import { NextRequest, NextResponse } from 'next/server';
import { getProject, getWorkstreamsByProject, getWorkstreamStages, getMessages, getFiles, deleteProject } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const rawWorkstreams = await getWorkstreamsByProject(id);
  const workstreams = await Promise.all(
    rawWorkstreams.map(async (ws) => ({
      ...ws,
      stages: await getWorkstreamStages(ws.id),
      messages: await getMessages(ws.id),
      files: await getFiles(ws.id),
    }))
  );

  return NextResponse.json({ ...project, workstreams });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = await deleteProject(id);

  if (!success) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
