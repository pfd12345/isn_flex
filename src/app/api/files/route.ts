import { NextRequest, NextResponse } from 'next/server';
import { recordFile, getFiles } from '@/lib/db';

// In-memory file content store (for demo — no filesystem needed)
const fileContents = new Map<string, string>();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const workstreamId = formData.get('workstream_id') as string;
    const stageId = formData.get('stage_id') as string | null;

    if (!file || !workstreamId) {
      return NextResponse.json({ error: 'File and workstream_id required' }, { status: 400 });
    }

    // Store file content as base64 in memory
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const blobUrl = `data:${file.type};base64,${base64}`;

    // For large files, just store a reference
    const fileRecord = recordFile(
      workstreamId,
      file.name,
      blobUrl.length > 1_000_000 ? `memory://${file.name}` : blobUrl,
      file.type,
      file.size,
      stageId || undefined
    );

    if (blobUrl.length > 1_000_000) {
      fileContents.set(fileRecord.id, blobUrl);
    }

    return NextResponse.json(fileRecord, { status: 201 });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const workstreamId = req.nextUrl.searchParams.get('workstream_id');
  if (!workstreamId) {
    return NextResponse.json({ error: 'workstream_id required' }, { status: 400 });
  }
  return NextResponse.json(getFiles(workstreamId));
}
