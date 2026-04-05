import { NextRequest, NextResponse } from 'next/server';
import { getProject, getWorkstreamsByProject, getWorkstreamStages, getMessages, getFiles, deleteProject } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const workstreams = getWorkstreamsByProject(id).map((ws) => ({
    ...ws,
    stages: getWorkstreamStages(ws.id),
    messages: getMessages(ws.id),
    files: getFiles(ws.id),
  }));

  return NextResponse.json({ ...project, workstreams });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = deleteProject(id);

  if (!success) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
