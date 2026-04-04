import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/settings';

export async function GET() {
  const settings = getSettings();
  return NextResponse.json({
    mockMode: settings.mockMode,
    hasApiKey: settings.hasApiKey,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { mockMode } = await req.json();
    const updated = updateSettings({ mockMode });
    return NextResponse.json({
      mockMode: updated.mockMode,
      hasApiKey: updated.hasApiKey,
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
