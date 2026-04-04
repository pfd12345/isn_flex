import { NextRequest, NextResponse } from 'next/server';
import {
  getMockScript,
  getMockScriptAsYaml,
  updateMockScript,
  updateMockResponse,
} from '@/lib/mock-script-store';

export async function GET() {
  return NextResponse.json({
    script: getMockScript(),
    yaml: getMockScriptAsYaml(),
  });
}

export async function PUT(req: NextRequest) {
  try {
    const { script } = await req.json();

    if (!script || typeof script !== 'object') {
      return NextResponse.json({ error: 'Invalid script format' }, { status: 400 });
    }

    // Validate all values are strings
    for (const [key, value] of Object.entries(script)) {
      if (typeof value !== 'string') {
        return NextResponse.json(
          { error: `Invalid value for key "${key}": expected a string` },
          { status: 400 }
        );
      }
    }

    updateMockScript(script as Record<string, string>);
    return NextResponse.json({ script: getMockScript() });
  } catch (error) {
    console.error('Mock script PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { stageId, response } = await req.json();

    if (!stageId || typeof stageId !== 'string' || typeof response !== 'string') {
      return NextResponse.json(
        { error: 'stageId (string) and response (string) are required' },
        { status: 400 }
      );
    }

    updateMockResponse(stageId, response);
    return NextResponse.json({ script: getMockScript() });
  } catch (error) {
    console.error('Mock script PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
