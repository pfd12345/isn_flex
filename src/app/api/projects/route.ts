import { NextRequest, NextResponse } from 'next/server';
import {
  createProject,
  listProjects,
  createWorkstream,
  getWorkstreamsByProject,
  getWorkstreamStages,
  addMessage,
  deleteAllProjects,
} from '@/lib/db';
import { getDefaultWorkflowTemplate, getWorkflowTemplate, getWorkflowStages, getPrompts } from '@/lib/config';

export async function GET() {
  const projects = await listProjects();
  // Enrich with workstream count
  const enriched = await Promise.all(
    projects.map(async (p) => ({
      ...p,
      workstreams: await getWorkstreamsByProject(p.id),
    }))
  );
  return NextResponse.json(enriched);
}

export async function DELETE() {
  await deleteAllProjects();
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, workflow_template_id, workstream_name, owner } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const templateId = workflow_template_id || getDefaultWorkflowTemplate().id;
    const template = getWorkflowTemplate(templateId);
    if (!template) {
      return NextResponse.json({ error: 'Invalid workflow template' }, { status: 400 });
    }

    // Create project
    const project = await createProject(name, description || '');

    // Create default workstream
    const wsName = workstream_name || name;
    const workstream = await createWorkstream(project.id, wsName, owner || 'Default Owner', templateId);

    // Add welcome message
    const resolvedStages = getWorkflowStages(templateId);
    const sequentialStages = resolvedStages.filter((s) => !s.parallel);
    const firstStage = sequentialStages[0];
    const prompts = getPrompts();

    const welcomeMsg = prompts.welcome_message
      .replace('{project_name}', project.name)
      .replace('{workstream_name}', workstream.name)
      .replace('{workflow_template_name}', template.name)
      .replace('{total_stages}', String(sequentialStages.length))
      .replace('{first_stage_name}', firstStage?.name || 'the first stage');

    await addMessage(workstream.id, 'system', welcomeMsg, firstStage?.id);

    return NextResponse.json({
      project,
      workstream,
      stages: await getWorkstreamStages(workstream.id),
    }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
