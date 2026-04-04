import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/settings';

export async function GET() {
  const settings = getSettings();
  // Don't expose the full API key
  return NextResponse.json({
    mockMode: settings.mockMode,
    hasApiKey: !!settings.apiKey,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateSettings(body);
    return NextResponse.json({
      mockMode: updated.mockMode,
      hasApiKey: !!updated.apiKey,
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
