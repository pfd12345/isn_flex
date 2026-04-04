import { NextResponse } from 'next/server';
import { getDefaultMockScript, updateMockScript, getMockScript } from '@/lib/mock-script-store';

export async function POST() {
  updateMockScript(getDefaultMockScript());
  return NextResponse.json({ script: getMockScript() });
}
