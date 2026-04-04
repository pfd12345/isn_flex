'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FlaskConical, ToggleLeft, ToggleRight, Key, Code, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';

interface SettingsData {
  mockMode: boolean;
  hasApiKey: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  const toggleMockMode = async () => {
    if (!settings) return;

    // Warn if trying to disable mock mode without an API key
    if (settings.mockMode && !settings.hasApiKey) {
      setMessage('Cannot disable mock mode: ANTHROPIC_API_KEY is not configured. Add it in your Vercel project settings.');
      return;
    }

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
                This is useful for demos and development.
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

        {/* Mock Script Editor */}
        <button
          onClick={() => router.push('/settings/mock-script')}
          className="w-full bg-white rounded-xl border border-[#E2E5E9] p-6 text-left hover:border-[#2563EB]/30 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F0F4F8] flex items-center justify-center group-hover:bg-[#EFF6FF] transition-colors">
              <Code size={18} className="text-[#5F6B7A] group-hover:text-[#2563EB] transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-[#1A1D21]">Mock Script Editor</h2>
              <p className="text-sm text-[#5F6B7A] mt-0.5">
                Customize the demo responses returned in mock mode for each workflow stage.
                Download or upload scripts as YAML files.
              </p>
            </div>
            <ChevronRight size={16} className="text-[#8D95A0] group-hover:text-[#2563EB] transition-colors" />
          </div>
        </button>

        {/* API Key — Vercel Environment Variable */}
        <div className="bg-white rounded-xl border border-[#E2E5E9] p-6">
          <div className="flex items-center gap-2 mb-2">
            <Key size={16} className="text-[#5F6B7A]" />
            <h2 className="text-base font-semibold text-[#1A1D21]">Anthropic API Key</h2>
          </div>
          <p className="text-sm text-[#5F6B7A] mb-4">
            The API key is configured as an environment variable on the Vercel platform, not in the application.
            This keeps your key secure and out of application code.
          </p>

          <div className="rounded-lg border border-[#E2E5E9] bg-[#F8F9FA] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#1A1D21]">
                ANTHROPIC_API_KEY
              </span>
              {settings?.hasApiKey ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Configured
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  Not Set
                </span>
              )}
            </div>

            <div className="text-xs text-[#5F6B7A] space-y-2">
              <p className="font-medium text-[#1A1D21]">How to configure:</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Go to your Vercel project dashboard</li>
                <li>Navigate to <strong>Settings</strong> &rarr; <strong>Environment Variables</strong></li>
                <li>Add a new variable with key <code className="bg-white px-1.5 py-0.5 rounded border border-[#E2E5E9] text-[10px]">ANTHROPIC_API_KEY</code></li>
                <li>Paste your Anthropic API key as the value</li>
                <li>Redeploy the application for the change to take effect</li>
              </ol>
              <p className="mt-2">
                For local development, add the key to a <code className="bg-white px-1.5 py-0.5 rounded border border-[#E2E5E9] text-[10px]">.env.local</code> file in the project root.
              </p>
            </div>
          </div>
        </div>

        {/* Status message */}
        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm ${
            message.includes('Cannot') || message.includes('not configured')
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
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
