'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FlaskConical, ToggleLeft, ToggleRight, Key } from 'lucide-react';
import Button from '@/components/ui/Button';

interface SettingsData {
  mockMode: boolean;
  hasApiKey: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  const toggleMockMode = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockMode: !settings.mockMode }),
      });
      const data = await res.json();
      setSettings(data);
      setMessage(`Mock mode ${data.mockMode ? 'enabled' : 'disabled'}`);
    } finally {
      setSaving(false);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim(), mockMode: false }),
      });
      const data = await res.json();
      setSettings(data);
      setApiKey('');
      setMessage('API key saved and mock mode disabled');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-[#F8F9FA]">
      <header className="bg-white border-b border-[#E2E5E9]">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="p-1.5 rounded-lg hover:bg-[#F8F9FA] transition-colors text-[#5F6B7A]"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
            <FlaskConical size={16} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold text-[#1A1D21]">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Mock Mode Toggle */}
        <div className="bg-white rounded-xl border border-[#E2E5E9] p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#1A1D21]">Mock Mode</h2>
              <p className="text-sm text-[#5F6B7A] mt-1">
                When enabled, the app returns pre-built demo responses instead of calling the Claude API.
                This is useful for demos and development without an API key.
              </p>
            </div>
            <button
              onClick={toggleMockMode}
              disabled={saving}
              className="flex-shrink-0 ml-4 text-[#2563EB] disabled:opacity-50"
            >
              {settings?.mockMode ? (
                <ToggleRight size={36} />
              ) : (
                <ToggleLeft size={36} className="text-[#D1D5DB]" />
              )}
            </button>
          </div>
          <div className="mt-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                settings?.mockMode
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {settings?.mockMode ? 'Mock Mode Active' : 'Live Mode (Claude API)'}
            </span>
          </div>
        </div>

        {/* API Key */}
        <div className="bg-white rounded-xl border border-[#E2E5E9] p-6">
          <div className="flex items-center gap-2 mb-2">
            <Key size={16} className="text-[#5F6B7A]" />
            <h2 className="text-base font-semibold text-[#1A1D21]">Anthropic API Key</h2>
          </div>
          <p className="text-sm text-[#5F6B7A] mb-4">
            Required for live mode. Your key is stored in memory only and resets on server restart.
            {settings?.hasApiKey && (
              <span className="ml-1 text-green-600 font-medium">Key is currently set.</span>
            )}
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="flex-1 rounded-lg border border-[#E2E5E9] bg-[#F8F9FA] px-3 py-2 text-sm text-[#1A1D21] placeholder-[#8D95A0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              onKeyDown={(e) => e.key === 'Enter' && saveApiKey()}
            />
            <Button onClick={saveApiKey} disabled={!apiKey.trim() || saving}>
              Save Key
            </Button>
          </div>
        </div>

        {/* Status message */}
        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* Info */}
        <div className="bg-white rounded-xl border border-[#E2E5E9] p-6">
          <h2 className="text-base font-semibold text-[#1A1D21] mb-2">About</h2>
          <div className="text-sm text-[#5F6B7A] space-y-1">
            <p>The ISN uses an in-memory data store. All data resets when the server restarts.</p>
            <p>Stages, workflows, and prompts are configured in <code className="bg-[#F0F4F8] px-1.5 py-0.5 rounded text-xs">config/isn.yaml</code>.</p>
            <p>Add, remove, or reorder stages by editing the YAML file — no code changes needed.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
