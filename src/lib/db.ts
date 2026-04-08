import { neon } from '@neondatabase/serverless';
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

const sql = neon(process.env.DATABASE_URL!);

// ─── Projects ────────────────────────────────────────────────

export async function createProject(name: string, description: string = ''): Promise<Project> {
  const project: Project = {
    id: uuidv4(),
    name,
    description,
    created_at: new Date().toISOString(),
  };
  await sql`
    INSERT INTO projects (id, name, description, created_at)
    VALUES (${project.id}, ${project.name}, ${project.description}, ${project.created_at})
  `;
  return project;
}

export async function getProject(id: string): Promise<Project | undefined> {
  const rows = await sql`SELECT * FROM projects WHERE id = ${id}`;
  return (rows[0] as Project) ?? undefined;
}

export async function listProjects(): Promise<Project[]> {
  const rows = await sql`SELECT * FROM projects ORDER BY created_at DESC`;
  return rows as Project[];
}

export async function deleteProject(id: string): Promise<boolean> {
  const rows = await sql`DELETE FROM projects WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function deleteAllProjects(): Promise<void> {
  await sql`DELETE FROM projects`;
}

// ─── Workstreams ─────────────────────────────────────────────

export async function createWorkstream(
  projectId: string,
  name: string,
  owner: string,
  workflowTemplateId: string
): Promise<Workstream> {
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
    const firstSequentialIndex = resolvedStages.findIndex((s) => !s.parallel);
    const isFirstSequential = resolvedStages.indexOf(rs) === firstSequentialIndex;

    let status: StageStatus = 'pending';
    if (rs.parallel) {
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

  // Set active_stage_id to the first sequential active stage
  const firstActive = stages.find((s) => s.status === 'active');
  if (firstActive) {
    workstream.active_stage_id = firstActive.stage_id;
  }

  await sql`
    INSERT INTO workstreams (id, project_id, name, owner, workflow_template_id, active_stage_id, created_at)
    VALUES (
      ${workstream.id}, ${workstream.project_id}, ${workstream.name},
      ${workstream.owner}, ${workstream.workflow_template_id},
      ${workstream.active_stage_id}, ${workstream.created_at}
    )
  `;

  // Insert all stage rows
  for (const stage of stages) {
    await sql`
      INSERT INTO workstream_stages
        (id, workstream_id, stage_id, stage_name, position, status, required, skippable, parallel)
      VALUES (
        ${stage.id}, ${stage.workstream_id}, ${stage.stage_id}, ${stage.stage_name},
        ${stage.position}, ${stage.status}, ${stage.required}, ${stage.skippable}, ${stage.parallel}
      )
    `;
  }

  // Record initial transition
  if (firstActive) {
    await sql`
      INSERT INTO stage_transitions
        (id, workstream_id, from_stage_id, to_stage_id, transition_type, reason, performed_by, created_at)
      VALUES (
        ${uuidv4()}, ${workstream.id}, ${null}, ${firstActive.stage_id},
        ${'initial'}, ${null}, ${null}, ${new Date().toISOString()}
      )
    `;
  }

  return workstream;
}

export async function getWorkstream(id: string): Promise<Workstream | undefined> {
  const rows = await sql`SELECT * FROM workstreams WHERE id = ${id}`;
  return (rows[0] as Workstream) ?? undefined;
}

export async function getWorkstreamsByProject(projectId: string): Promise<Workstream[]> {
  const rows = await sql`SELECT * FROM workstreams WHERE project_id = ${projectId} ORDER BY created_at`;
  return rows as Workstream[];
}

// ─── Workstream Stages ───────────────────────────────────────

export async function getWorkstreamStages(workstreamId: string): Promise<WorkstreamStage[]> {
  const rows = await sql`
    SELECT * FROM workstream_stages WHERE workstream_id = ${workstreamId} ORDER BY position
  `;
  return rows.map(rowToStage);
}

export async function getActiveStage(workstreamId: string): Promise<WorkstreamStage | undefined> {
  const rows = await sql`
    SELECT * FROM workstream_stages
    WHERE workstream_id = ${workstreamId} AND status = 'active'
    LIMIT 1
  `;
  return rows.length > 0 ? rowToStage(rows[0]) : undefined;
}

export async function transitionStage(
  workstreamId: string,
  stageId: string,
  action: 'complete' | 'skip' | 'reopen',
  reason?: string
): Promise<{ success: boolean; error?: string; stages: WorkstreamStage[] }> {
  // Fetch target stage row
  const stageRows = await sql`
    SELECT * FROM workstream_stages
    WHERE workstream_id = ${workstreamId} AND stage_id = ${stageId}
    LIMIT 1
  `;
  if (stageRows.length === 0) {
    const stages = await getWorkstreamStages(workstreamId);
    return { success: false, error: 'Workstream or stage not found', stages };
  }

  const stage = rowToStage(stageRows[0]);
  const now = new Date().toISOString();

  if (action === 'complete') {
    if (stage.status !== 'active') {
      return { success: false, error: 'Stage is not active', stages: await getWorkstreamStages(workstreamId) };
    }

    // Find next pending sequential stage
    const nextRows = await sql`
      SELECT * FROM workstream_stages
      WHERE workstream_id = ${workstreamId}
        AND status = 'pending'
        AND parallel = false
        AND position > ${stage.position}
      ORDER BY position
      LIMIT 1
    `;
    const nextStage = nextRows.length > 0 ? rowToStage(nextRows[0]) : null;

    // Complete current stage
    await sql`
      UPDATE workstream_stages SET status = 'completed', completed_at = ${now}
      WHERE id = ${stage.id}
    `;

    if (nextStage) {
      await sql`UPDATE workstream_stages SET status = 'active' WHERE id = ${nextStage.id}`;
      await sql`UPDATE workstreams SET active_stage_id = ${nextStage.stage_id} WHERE id = ${workstreamId}`;
      await sql`
        INSERT INTO stage_transitions
          (id, workstream_id, from_stage_id, to_stage_id, transition_type, reason, performed_by, created_at)
        VALUES (
          ${uuidv4()}, ${workstreamId}, ${stageId}, ${nextStage.stage_id},
          ${'advance'}, ${null}, ${null}, ${now}
        )
      `;
    }

  } else if (action === 'skip') {
    if (!stage.skippable) {
      return { success: false, error: 'Stage is not skippable', stages: await getWorkstreamStages(workstreamId) };
    }
    if (stage.status !== 'active') {
      return { success: false, error: 'Stage is not active', stages: await getWorkstreamStages(workstreamId) };
    }

    const nextRows = await sql`
      SELECT * FROM workstream_stages
      WHERE workstream_id = ${workstreamId}
        AND status = 'pending'
        AND parallel = false
        AND position > ${stage.position}
      ORDER BY position
      LIMIT 1
    `;
    const nextStage = nextRows.length > 0 ? rowToStage(nextRows[0]) : null;

    await sql`
      UPDATE workstream_stages SET status = 'skipped', skipped_at = ${now}, skip_reason = ${reason ?? null}
      WHERE id = ${stage.id}
    `;

    if (nextStage) {
      await sql`UPDATE workstream_stages SET status = 'active' WHERE id = ${nextStage.id}`;
      await sql`UPDATE workstreams SET active_stage_id = ${nextStage.stage_id} WHERE id = ${workstreamId}`;
      await sql`
        INSERT INTO stage_transitions
          (id, workstream_id, from_stage_id, to_stage_id, transition_type, reason, performed_by, created_at)
        VALUES (
          ${uuidv4()}, ${workstreamId}, ${stageId}, ${nextStage.stage_id},
          ${'skip'}, ${reason ?? null}, ${null}, ${now}
        )
      `;
    }

  } else if (action === 'reopen') {
    if (stage.status !== 'completed' && stage.status !== 'skipped') {
      return { success: false, error: 'Stage is not completed or skipped', stages: await getWorkstreamStages(workstreamId) };
    }

    await sql`
      UPDATE workstream_stages SET status = 'active', reopened_at = ${now}
      WHERE id = ${stage.id}
    `;
    await sql`UPDATE workstreams SET active_stage_id = ${stageId} WHERE id = ${workstreamId}`;
    await sql`
      INSERT INTO stage_transitions
        (id, workstream_id, from_stage_id, to_stage_id, transition_type, reason, performed_by, created_at)
      VALUES (
        ${uuidv4()}, ${workstreamId}, ${null}, ${stageId},
        ${'reopen'}, ${null}, ${null}, ${now}
      )
    `;
  }

  return { success: true, stages: await getWorkstreamStages(workstreamId) };
}

// ─── Messages ────────────────────────────────────────────────

export async function addMessage(
  workstreamId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  stageId?: string
): Promise<Message> {
  const msg: Message = {
    id: uuidv4(),
    workstream_id: workstreamId,
    role,
    content,
    stage_id: stageId,
    created_at: new Date().toISOString(),
  };
  await sql`
    INSERT INTO messages (id, workstream_id, role, content, stage_id, created_at)
    VALUES (${msg.id}, ${msg.workstream_id}, ${msg.role}, ${msg.content}, ${msg.stage_id ?? null}, ${msg.created_at})
  `;
  return msg;
}

export async function getMessages(workstreamId: string): Promise<Message[]> {
  const rows = await sql`
    SELECT * FROM messages WHERE workstream_id = ${workstreamId} ORDER BY created_at
  `;
  return rows as Message[];
}

// ─── Artifacts ───────────────────────────────────────────────

export async function createArtifact(
  workstreamId: string,
  messageId: string,
  type: string,
  data: Record<string, unknown>,
  stageId?: string
): Promise<Artifact> {
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
  await sql`
    INSERT INTO artifacts (id, workstream_id, message_id, type, data, stage_id, status, created_at)
    VALUES (
      ${artifact.id}, ${artifact.workstream_id}, ${artifact.message_id},
      ${artifact.type}, ${JSON.stringify(artifact.data)}, ${artifact.stage_id ?? null},
      ${artifact.status}, ${artifact.created_at}
    )
  `;
  return artifact;
}

export async function getArtifacts(workstreamId: string, stageId?: string): Promise<Artifact[]> {
  const rows = stageId
    ? await sql`SELECT * FROM artifacts WHERE workstream_id = ${workstreamId} AND stage_id = ${stageId} ORDER BY created_at`
    : await sql`SELECT * FROM artifacts WHERE workstream_id = ${workstreamId} ORDER BY created_at`;

  return rows.map((r) => ({
    ...(r as Omit<Artifact, 'data'>),
    data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data,
  })) as Artifact[];
}

// ─── Files ───────────────────────────────────────────────────

export async function recordFile(
  workstreamId: string,
  name: string,
  blobUrl: string,
  mimeType: string,
  sizeBytes: number,
  stageId?: string
): Promise<FileRecord> {
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
  await sql`
    INSERT INTO files (id, workstream_id, name, blob_url, mime_type, size_bytes, stage_id, uploaded_at)
    VALUES (
      ${file.id}, ${file.workstream_id}, ${file.name}, ${file.blob_url},
      ${file.mime_type}, ${file.size_bytes}, ${file.stage_id ?? null}, ${file.uploaded_at}
    )
  `;
  return file;
}

export async function getFiles(workstreamId: string): Promise<FileRecord[]> {
  const rows = await sql`SELECT * FROM files WHERE workstream_id = ${workstreamId} ORDER BY uploaded_at`;
  return rows as FileRecord[];
}

// ─── Stage Transitions ──────────────────────────────────────

export async function getStageTransitions(workstreamId: string): Promise<StageTransition[]> {
  const rows = await sql`
    SELECT * FROM stage_transitions WHERE workstream_id = ${workstreamId} ORDER BY created_at
  `;
  return rows as StageTransition[];
}

// ─── Helpers ─────────────────────────────────────────────────

function rowToStage(row: Record<string, unknown>): WorkstreamStage {
  return {
    id: row.id as string,
    workstream_id: row.workstream_id as string,
    stage_id: row.stage_id as string,
    stage_name: row.stage_name as string,
    position: row.position as number,
    status: row.status as StageStatus,
    required: Boolean(row.required),
    skippable: Boolean(row.skippable),
    parallel: Boolean(row.parallel),
    skip_reason: row.skip_reason as string | undefined,
    completed_at: row.completed_at as string | undefined,
    skipped_at: row.skipped_at as string | undefined,
    reopened_at: row.reopened_at as string | undefined,
  };
}
