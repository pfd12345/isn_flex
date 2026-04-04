import type { AppSettings } from '@/types';

const settings: AppSettings = {
  mockMode: true,
  apiKey: process.env.ANTHROPIC_API_KEY || undefined,
};

export function getSettings(): AppSettings {
  return { ...settings };
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  if (updates.mockMode !== undefined) settings.mockMode = updates.mockMode;
  if (updates.apiKey !== undefined) settings.apiKey = updates.apiKey;
  return { ...settings };
}
