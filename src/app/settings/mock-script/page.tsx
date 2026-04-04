'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FlaskConical,
  Download,
  Upload,
  RotateCcw,
  Save,
  Check,
  ChevronDown,
  ChevronRight,
  Code,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import type { ISNConfig } from '@/types';

interface StageEntry {
  key: string;
  label: string;
  value: string;
  dirty: boolean;
  saving: boolean;
  saved: boolean;
}

export default function MockScriptPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<StageEntry[]>([]);
  const [config, setConfig] = useState<ISNConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['_default']));

  // Load script + config on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/mock-script').then((r) => r.json()),
      fetch('/api/config').then((r) => r.json()),
    ]).then(([scriptData, configData]) => {
      setConfig(configData);
      buildEntries(scriptData.script, configData);
      setLoading(false);
    });
  }, []);

  const buildEntries = useCallback((script: Record<string, string>, cfg: ISNConfig | null) => {
    const stageNames: Record<string, string> = {};
    if (cfg?.stages) {
      for (const s of cfg.stages) {
        stageNames[s.id] = s.name;
      }
    }

    // Order: _default first, then stage IDs in script order
    const keys = Object.keys(script);
    const defaultEntry = keys.includes('_default') ? '_default' : null;
    const stageKeys = keys.filter((k) => k !== '_default');

    const ordered = defaultEntry ? [defaultEntry, ...stageKeys] : stageKeys;

    setEntries(
      ordered.map((key) => ({
        key,
        label: key === '_default'
          ? 'Default Fallback Response'
          : stageNames[key] || key,
        value: script[key],
        dirty: false,
        saving: false,
        saved: false,
      }))
    );
  }, []);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const updateEntry = (key: string, value: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.key === key ? { ...e, value, dirty: true, saved: false } : e
      )
    );
  };

  const saveEntry = async (key: string) => {
    const entry = entries.find((e) => e.key === key);
    if (!entry) return;

    setEntries((prev) =>
      prev.map((e) => (e.key === key ? { ...e, saving: true } : e))
    );

    try {
      const res = await fetch('/api/mock-script', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: key, response: entry.value }),
      });

      if (res.ok) {
        setEntries((prev) =>
          prev.map((e) =>
            e.key === key ? { ...e, saving: false, dirty: false, saved: true } : e
          )
        );
        // Clear saved indicator after 2s
        setTimeout(() => {
          setEntries((prev) =>
            prev.map((e) => (e.key === key ? { ...e, saved: false } : e))
          );
        }, 2000);
      }
    } catch {
      setEntries((prev) =>
        prev.map((e) => (e.key === key ? { ...e, saving: false } : e))
      );
    }
  };

  const downloadYaml = async () => {
    try {
      const res = await fetch('/api/mock-script');
      const data = await res.json();
      const blob = new Blob([data.yaml], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'isn-mock-script.yaml';
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ text: 'Mock script downloaded', type: 'success' });
    } catch {
      setMessage({ text: 'Download failed', type: 'error' });
    }
  };

  const uploadYaml = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/mock-script/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ text: data.error || 'Upload failed', type: 'error' });
        return;
      }

      const data = await res.json();
      buildEntries(data.script, config);
      setMessage({ text: 'Mock script uploaded and applied', type: 'success' });
    } catch {
      setMessage({ text: 'Upload failed', type: 'error' });
    }
  };

  const resetAll = async () => {
    if (!confirm('Reset all mock responses to their original defaults? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/mock-script/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        buildEntries(data.script, config);
        setMessage({ text: 'All responses reset to defaults', type: 'success' });
      } else {
        setMessage({ text: 'Reset failed', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Reset failed', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-[#F8F9FA] flex items-center justify-center text-[#8D95A0]">
        Loading mock script...
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E5E9] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push('/settings')}
            className="p-1.5 rounded-lg hover:bg-[#F8F9FA] transition-colors text-[#5F6B7A]"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
            <Code size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-[#1A1D21]">Mock Script Editor</h1>
            <p className="text-xs text-[#8D95A0]">
              Customize demo responses for each workflow stage
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={downloadYaml}>
            <Download size={14} /> Download YAML
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} /> Upload YAML
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".yaml,.yml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadYaml(file);
              e.target.value = '';
            }}
          />
          <Button variant="ghost" size="sm" onClick={resetAll}>
            <RotateCcw size={14} /> Reset All to Defaults
          </Button>

          <span className="ml-auto text-xs text-[#8D95A0]">
            {entries.length} response(s)
          </span>
        </div>

        {/* Status message */}
        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Stage entries */}
        <div className="space-y-2">
          {entries.map((entry) => {
            const isExpanded = expandedKeys.has(entry.key);

            return (
              <div
                key={entry.key}
                className="bg-white rounded-xl border border-[#E2E5E9] overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => toggleExpand(entry.key)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[#F8F9FA] transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown size={14} className="text-[#5F6B7A]" />
                  ) : (
                    <ChevronRight size={14} className="text-[#5F6B7A]" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[#1A1D21]">
                      {entry.label}
                    </span>
                    {entry.key !== '_default' && (
                      <span className="ml-2 text-xs font-mono text-[#8D95A0]">
                        {entry.key}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.dirty && (
                      <span className="text-xs text-amber-600 font-medium">Unsaved</span>
                    )}
                    {entry.saved && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <Check size={12} /> Saved
                      </span>
                    )}
                    <span className="text-xs text-[#8D95A0]">
                      {entry.value.length} chars
                    </span>
                  </div>
                </button>

                {/* Editor */}
                {isExpanded && (
                  <div className="border-t border-[#E2E5E9] px-5 py-4">
                    <textarea
                      value={entry.value}
                      onChange={(e) => updateEntry(entry.key, e.target.value)}
                      className="w-full rounded-lg border border-[#E2E5E9] bg-[#F8F9FA] px-4 py-3 text-sm text-[#1A1D21] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-y"
                      rows={Math.min(20, Math.max(8, entry.value.split('\n').length + 2))}
                      spellCheck={false}
                    />
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => saveEntry(entry.key)}
                        disabled={!entry.dirty || entry.saving}
                      >
                        {entry.saving ? (
                          'Saving...'
                        ) : (
                          <>
                            <Save size={12} /> Save Response
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-[#8D95A0]">
                        Tip: Use <code className="bg-[#F0F4F8] px-1 py-0.5 rounded text-[10px]">
                          {"`"}``artifact {"{"}&quot;type&quot;: ...{"}"}``{"`"}
                        </code> blocks to include inline artifacts.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="bg-white rounded-xl border border-[#E2E5E9] p-5 text-sm text-[#5F6B7A] space-y-1">
          <p>
            Mock responses are stored in memory and reset when the server restarts.
            Use <strong>Download YAML</strong> to save your customizations, and <strong>Upload YAML</strong> to restore them.
          </p>
          <p>
            The YAML format uses stage IDs as keys with multi-line string values.
            The <code className="bg-[#F0F4F8] px-1.5 py-0.5 rounded text-xs">_default</code> key
            is the fallback response used when no stage-specific response exists.
          </p>
        </div>
      </main>
    </div>
  );
}
