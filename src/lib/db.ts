import { v4 as uuidv4 } from 'uuid';
import type {
  Project,
  Workstream,
  WorkstreamStage,
  Message,
  Artifact,
  FileRecord,
  StageTransition,
  StageStatus,
  TransitionType,
} from '@/types';
import { getWorkflowStages } from './config';

// ─── In-Memory Stores ────────────────────────────────────────

const projects = new Map<string, Project>();
const workstreams = new Map<string, Workstream>();
const workstreamStages = new Map<string, WorkstreamStage[]>();
const messages = new Map<string, Message[]>();
const artifacts = new Map<string, Artifact[]>();
const files = new Map<string, FileRecord[]>();
const stageTransitions = new Map<string, StageTransition[]>();

// ─── Projects ────────────────────────────────────────────────

export function createProject(name: string, description: string = ''): Project {
  const project: Project = {
    id: uuidv4(),
    name,
    description,
    created_at: new Date().toISOString(),
  };
  projects.set(project.id, project);
  return project;
}

export function getProject(id: string): Project | undefined {
  return projects.get(id);
}

export function listProjects(): Project[] {
  return Array.from(projects.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// ─── Workstreams ─────────────────────────────────────────────

export function createWorkstream(
  projectId: string,
  name: string,
  owner: string,
  workflowTemplateId: string
): Workstream {
  const resolvedStages = getWorkflowStages(workflowTemplateId);

  const workstream: Workstream = {
    id: uuidv4(),
    project_id: projectId,
    name,
    owner,
    workflow_template_id: workflowTemplateId,
    active_stage_id: '',
    created_at: new Date().toISOString(),
  };

  // Build stage rows from the resolved stages
  const stages: WorkstreamStage[] = resolvedStages.map((rs, idx) => {
    const isParallel = rs.parallel;
    const isFirst = !isParallel && idx === resolvedStages.filter((s) => !s.parallel).indexOf(rs) && idx === resolvedStages.indexOf(rs);

    // Find the first non-parallel stage
    const firstSequentialIndex = resolvedStages.findIndex((s) => !s.parallel);
    const isFirstSequential = resolvedStages.indexOf(rs) === firstSequentialIndex;

    let status: StageStatus = 'pending';
    if (isParallel) {
      status = 'always_active';
    } else if (isFirstSequential) {
      status = 'active';
    }

    return {
      id: uuidv4(),
      workstream_id: workstream.id,
      stage_id: rs.id,
      stage_name: rs.name,
      position: idx,
      status,
      required: rs.required,
      skippable: rs.skippable,
      parallel: rs.parallel,
    };
  });

  // Set active_stage_id to the first sequential stage
  const firstActive = stages.find((s) => s.status === 'active');
  if (firstActive) {
    workstream.active_stage_id = firstActive.stage_id;
  }

  workstreams.set(workstream.id, workstream);
  workstreamStages.set(workstream.id, stages);
  messages.set(workstream.id, []);
  artifacts.set(workstream.id, []);
  files.set(workstream.id, []);
  stageTransitions.set(workstream.id, []);

  // Record initial transition
  if (firstActive) {
    recordTransition(workstream.id, undefined, firstActive.stage_id, 'initial');
  }

  return workstream;
}

export function getWorkstream(id: string): Workstream | undefined {
  return workstreams.get(id);
}

export function getWorkstreamsByProject(projectId: string): Workstream[] {
  return Array.from(workstreams.values()).filter((w) => w.project_id === projectId);
}

// ─── Workstream Stages ───────────────────────────────────────

export function getWorkstreamStages(workstreamId: string): WorkstreamStage[] {
  return workstreamStages.get(workstreamId) || [];
}

export function getActiveStage(workstreamId: string): WorkstreamStage | undefined {
  const stages = getWorkstreamStages(workstreamId);
  return stages.find((s) => s.status === 'active');
}

export function transitionStage(
  workstreamId: string,
  stageId: string,
  action: 'complete' | 'skip' | 'reopen',
  reason?: string
): { success: boolean; error?: string; stages: WorkstreamStage[] } {
  const stages = workstreamStages.get(workstreamId);
  if (!stages) return { success: false, error: 'Workstream not found', stages: [] };

  const stage = stages.find((s) => s.stage_id === stageId);
  if (!stage) return { success: false, error: 'Stage not found', stages };

  const now = new Date().toISOString();
  const workstream = workstreams.get(workstreamId);

  switch (action) {
    case 'complete': {
      if (stage.status !== 'active') {
        return { success: false, error: 'Stage is not active', stages };
      }
      stage.status = 'completed';
      stage.completed_at = now;

      // Auto-advance to next pending sequential stage
      const nextStage = stages.find(
        (s) => s.status === 'pending' && !s.parallel && s.position > stage.position
      );
      if (nextStage) {
        nextStage.status = 'active';
        if (workstream) workstream.active_stage_id = nextStage.stage_id;
        recordTransition(workstreamId, stageId, nextStage.stage_id, 'advance');
      }
      break;
    }

    case 'skip': {
      if (!stage.skippable) {
        return { success: false, error: 'Stage is not skippable', stages };
      }
      if (stage.status !== 'active') {
        return { success: false, error: 'Stage is not active', stages };
      }
      stage.status = 'skipped';
      stage.skipped_at = now;
      stage.skip_reason = reason;

      // Auto-advance to next pending sequential stage
      const nextStage = stages.find(
        (s) => s.status === 'pending' && !s.parallel && s.position > stage.position
      );
      if (nextStage) {
        nextStage.status = 'active';
        if (workstream) workstream.active_stage_id = nextStage.stage_id;
        recordTransition(workstreamId, stageId, nextStage.stage_id, 'skip', reason);
      }
      break;
    }

    case 'reopen': {
      if (stage.status !== 'completed' && stage.status !== 'skipped') {
        return { success: false, error: 'Stage is not completed or skipped', stages };
      }
      stage.status = 'active';
      stage.reopened_at = now;
      if (workstream) workstream.active_stage_id = stage.stage_id;
      recordTransition(workstreamId, undefined, stageId, 'reopen');
      break;
    }
  }

  return { success: true, stages };
}

function recordTransition(
  workstreamId: string,
  fromStageId: string | undefined,
  toStageId: string,
  type: TransitionType,
  reason?: string
) {
  const transitions = stageTransitions.get(workstreamId) || [];
  transitions.push({
    id: uuidv4(),
    workstream_id: workstreamId,
    from_stage_id: fromStageId,
    to_stage_id: toStageId,
    transition_type: type,
    reason,
    created_at: new Date().toISOString(),
  });
  stageTransitions.set(workstreamId, transitions);
}

// ─── Messages ────────────────────────────────────────────────

export function addMessage(
  workstreamId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  stageId?: string
): Message {
  const msg: Message = {
    id: uuidv4(),
    workstream_id: workstreamId,
    role,
    content,
    stage_id: stageId,
    created_at: new Date().toISOString(),
  };
  const msgs = messages.get(workstreamId) || [];
  msgs.push(msg);
  messages.set(workstreamId, msgs);
  return msg;
}

export function getMessages(workstreamId: string): Message[] {
  return messages.get(workstreamId) || [];
}

// ─── Artifacts ───────────────────────────────────────────────

export function createArtifact(
  workstreamId: string,
  messageId: string,
  type: string,
  data: Record<string, unknown>,
  stageId?: string
): Artifact {
  const artifact: Artifact = {
    id: uuidv4(),
    workstream_id: workstreamId,
    message_id: messageId,
    type,
    data,
    stage_id: stageId,
    status: 'active',
    created_at: new Date().toISOString(),
  };
  const arts = artifacts.get(workstreamId) || [];
  arts.push(artifact);
  artifacts.set(workstreamId, arts);
  return artifact;
}

export function getArtifacts(workstreamId: string, stageId?: string): Artifact[] {
  const arts = artifacts.get(workstreamId) || [];
  if (stageId) return arts.filter((a) => a.stage_id === stageId);
  return arts;
}

// ─── Files ───────────────────────────────────────────────────

export function recordFile(
  workstreamId: string,
  name: string,
  blobUrl: string,
  mimeType: string,
  sizeBytes: number,
  stageId?: string
): FileRecord {
  const file: FileRecord = {
    id: uuidv4(),
    workstream_id: workstreamId,
    name,
    blob_url: blobUrl,
    mime_type: mimeType,
    size_bytes: sizeBytes,
    stage_id: stageId,
    uploaded_at: new Date().toISOString(),
  };
  const f = files.get(workstreamId) || [];
  f.push(file);
  files.set(workstreamId, f);
  return file;
}

export function getFiles(workstreamId: string): FileRecord[] {
  return files.get(workstreamId) || [];
}

// ─── Stage Transitions ──────────────────────────────────────

export function getStageTransitions(workstreamId: string): StageTransition[] {
  return stageTransitions.get(workstreamId) || [];
}
