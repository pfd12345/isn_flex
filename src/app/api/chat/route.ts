import { NextRequest, NextResponse } from 'next/server';
import { addMessage, getMessages, getWorkstream, getActiveStage, createArtifact } from '@/lib/db';
import { buildSystemPrompt } from '@/lib/claude/prompts';
import { streamChat } from '@/lib/claude/client';
import { mockStreamChat } from '@/lib/claude/mock';
import { parseArtifacts } from '@/lib/claude/artifacts';
import { getSettings } from '@/lib/settings';
import { getProject } from '@/lib/db';
import type { ChatMessage } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { workstream_id, message, stage_id } = await req.json();

    if (!workstream_id || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const workstream = await getWorkstream(workstream_id);
    if (!workstream) {
      return NextResponse.json({ error: 'Workstream not found' }, { status: 404 });
    }

    const project = await getProject(workstream.project_id);
    const activeStage = await getActiveStage(workstream_id);
    const currentStageId = stage_id || activeStage?.stage_id || workstream.active_stage_id;

    // Save user message
    await addMessage(workstream_id, 'user', message, currentStageId);

    // Build system prompt
    const systemPrompt = buildSystemPrompt(
      currentStageId,
      project?.name || 'Unknown Project',
      workstream.name,
      workstream.workflow_template_id,
      workstream_id
    );

    // Build message history for Claude
    const history = await getMessages(workstream_id);
    const chatMessages: ChatMessage[] = history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-20) // Last 20 messages for context
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // Get stream (real or mock)
    const settings = getSettings();
    let stream: ReadableStream<Uint8Array>;

    if (settings.mockMode || !process.env.ANTHROPIC_API_KEY) {
      stream = await mockStreamChat(systemPrompt, chatMessages, currentStageId);
    } else {
      stream = await streamChat(systemPrompt, chatMessages);
    }

    // We need to collect the full response to save it and extract artifacts
    const [streamForClient, streamForCollection] = stream.tee();

    // Collect full response in background
    collectAndSave(streamForCollection, workstream_id, currentStageId);

    return new Response(streamForClient, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function collectAndSave(
  stream: ReadableStream<Uint8Array>,
  workstreamId: string,
  stageId: string
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value, { stream: true });
    }

    // Save assistant message
    const savedMessage = await addMessage(workstreamId, 'assistant', fullText, stageId);

    // Extract and save artifacts
    const parsedArtifacts = parseArtifacts(fullText);
    for (const artifact of parsedArtifacts) {
      await createArtifact(workstreamId, savedMessage.id, artifact.type, artifact.data, stageId);
    }
  } catch (error) {
    console.error('Error collecting stream:', error);
  }
}
