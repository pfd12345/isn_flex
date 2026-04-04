import type { AppSettings } from '@/types';

const settings: AppSettings = {
  mockMode: !process.env.ANTHROPIC_API_KEY,
};

export function getSettings(): AppSettings {
  return {
    ...settings,
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
  };
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  if (updates.mockMode !== undefined) settings.mockMode = updates.mockMode;
  return getSettings();
}
