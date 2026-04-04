import { NextRequest, NextResponse } from 'next/server';
import { parseMockScriptYaml, updateMockScript, getMockScript } from '@/lib/mock-script-store';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();

    let parsed: Record<string, string>;
    try {
      parsed = parseMockScriptYaml(text);
    } catch (err) {
      return NextResponse.json(
        { error: `Invalid YAML: ${err instanceof Error ? err.message : 'parse error'}` },
        { status: 400 }
      );
    }

    updateMockScript(parsed);
    return NextResponse.json({ script: getMockScript() });
  } catch (error) {
    console.error('Mock script upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
