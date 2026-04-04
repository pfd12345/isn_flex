import { NextRequest, NextResponse } from 'next/server';
import { transitionStage, getWorkstreamStages, addMessage, getWorkstream } from '@/lib/db';
import { getStageConfig, getPrompts } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const { workstream_id, stage_id, action, reason } = await req.json();

    if (!workstream_id || !stage_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['complete', 'skip', 'reopen'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = transitionStage(workstream_id, stage_id, action, reason);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Add system message about the transition
    const stageConfig = getStageConfig(stage_id);
    const prompts = getPrompts();
    const workstream = getWorkstream(workstream_id);
    const stages = getWorkstreamStages(workstream_id);
    const nextActive = stages.find((s) => s.status === 'active');

    let systemMessage = '';

    if (action === 'complete') {
      const nextStageConfig = nextActive ? getStageConfig(nextActive.stage_id) : null;
      systemMessage = prompts.stage_transition
        .replace('{prev_stage_name}', stageConfig?.name || stage_id)
        .replace('{prev_stage_outcome}', 'completed')
        .replace('{next_stage_name}', nextStageConfig?.name || 'the final stage')
        .replace('{next_stage_description}', nextStageConfig?.description || '');
    } else if (action === 'skip') {
      const nextStageConfig = nextActive ? getStageConfig(nextActive.stage_id) : null;
      systemMessage = prompts.stage_skip
        .replace('{stage_name}', stageConfig?.name || stage_id)
        .replace('{skip_reason}', reason || 'No reason provided.')
        .replace('{next_stage_name}', nextStageConfig?.name || 'the next stage');
    } else if (action === 'reopen') {
      systemMessage = `**${stageConfig?.name || stage_id}** has been reopened for further work.`;
    }

    if (systemMessage) {
      addMessage(
        workstream_id,
        'system',
        systemMessage,
        nextActive?.stage_id || stage_id
      );
    }

    return NextResponse.json({
      success: true,
      stages: result.stages,
      active_stage_id: workstream?.active_stage_id,
    });
  } catch (error) {
    console.error('Stage transition error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const workstreamId = req.nextUrl.searchParams.get('workstream_id');
  if (!workstreamId) {
    return NextResponse.json({ error: 'workstream_id required' }, { status: 400 });
  }
  return NextResponse.json(getWorkstreamStages(workstreamId));
}
