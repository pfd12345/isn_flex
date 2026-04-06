'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FlaskConical, Zap, Beaker, Settings, Trash2, Share2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import type { ISNConfig, Project, Workstream, WorkflowTemplateDefinition } from '@/types';

interface ProjectWithWorkstreams extends Project {
  workstreams: Workstream[];
}

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithWorkstreams[]>([]);
  const [config, setConfig] = useState<ISNConfig | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then((r) => {
        if (!r.ok) throw new Error(`Failed to load projects (${r.status})`);
        return r.json();
      }),
      fetch('/api/config').then((r) => {
        if (!r.ok) throw new Error(`Failed to load config (${r.status})`);
        return r.json();
      }),
    ]).then(([projects, config]) => {
      setProjects(projects);
      setConfig(config);
      setLoading(false);
    }).catch((err: Error) => {
      console.error('Failed to load data:', err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-full bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E5E9]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center flex-shrink-0">
              <FlaskConical size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-[#1A1D21] truncate">
                {config?.app?.name || 'Intelligent Scientific Notebook'}
              </h1>
              <p className="text-xs text-[#8D95A0] hidden sm:block">
                {config?.app?.description || ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={() => router.push('/ontology')}>
              <Share2 size={14} /> <span className="hidden sm:inline">Ontology</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push('/settings')}>
              <Settings size={14} /> <span className="hidden sm:inline">Settings</span>
            </Button>
            {projects.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (!confirm('Delete all projects? This cannot be undone.')) return;
                  await fetch('/api/projects', { method: 'DELETE' });
                  setProjects([]);
                }}
              >
                <Trash2 size={14} /> <span className="hidden sm:inline">Clear All</span>
              </Button>
            )}
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={14} /> <span className="hidden sm:inline">New Project</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="text-center py-20 text-[#8D95A0]">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <FlaskConical size={48} className="mx-auto text-[#D1D5DB] mb-4" />
            <h2 className="text-xl font-semibold text-[#1A1D21] mb-2">No projects yet</h2>
            <p className="text-[#5F6B7A] mb-6">
              Create your first project to start a scientific workflow.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="relative bg-white rounded-xl border border-[#E2E5E9] hover:border-[#2563EB] hover:shadow-md transition-all group"
              >
                <button
                  onClick={() => {
                    const ws = project.workstreams?.[0];
                    if (ws) router.push(`/project/${project.id}?ws=${ws.id}`);
                  }}
                  className="text-left w-full p-5"
                >
                  <h3 className="font-semibold text-[#1A1D21] group-hover:text-[#2563EB] transition-colors pr-6">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-[#5F6B7A] mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3 text-xs text-[#8D95A0]">
                    <span>{project.workstreams?.length || 0} workstream(s)</span>
                    <span>&middot;</span>
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
                    await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
                    setProjects((prev) => prev.filter((p) => p.id !== project.id));
                  }}
                  className="absolute top-3 right-3 p-2 rounded-lg text-[#8D95A0] hover:text-red-500 hover:bg-red-50 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                  title="Delete project"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Dialog */}
      {config && (
        <CreateProjectDialog
          open={showCreate}
          onClose={() => setShowCreate(false)}
          templates={config.workflow_templates}
          onCreated={(projectId, workstreamId) => {
            setShowCreate(false);
            router.push(`/project/${projectId}?ws=${workstreamId}`);
          }}
        />
      )}
    </div>
  );
}

function CreateProjectDialog({
  open,
  onClose,
  templates,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  templates: WorkflowTemplateDefinition[];
  onCreated: (projectId: string, workstreamId: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateId, setTemplateId] = useState(
    templates.find((t) => t.default)?.id || templates[0]?.id || ''
  );
  const [creating, setCreating] = useState(false);

  const templateIcons: Record<string, React.ReactNode> = {
    solid_form_development: <FlaskConical size={16} />,
    quick_assessment: <Zap size={16} />,
    wet_lab_only: <Beaker size={16} />,
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          workflow_template_id: templateId,
        }),
      });
      const data = await res.json();
      onCreated(data.project.id, data.workstream.id);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="New Project">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1A1D21] mb-1">
            Project Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Compound X Development"
            className="w-full rounded-lg border border-[#E2E5E9] bg-[#F8F9FA] px-3 py-2 text-sm text-[#1A1D21] placeholder-[#8D95A0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1D21] mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the project..."
            rows={2}
            className="w-full rounded-lg border border-[#E2E5E9] bg-[#F8F9FA] px-3 py-2 text-sm text-[#1A1D21] placeholder-[#8D95A0] focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1D21] mb-2">
            Workflow Template
          </label>
          <div className="space-y-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                className={`w-full text-left rounded-lg border p-3 transition-all ${
                  templateId === t.id
                    ? 'border-[#2563EB] bg-[#EFF6FF] ring-1 ring-[#2563EB]'
                    : 'border-[#E2E5E9] hover:border-[#2563EB]/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={templateId === t.id ? 'text-[#2563EB]' : 'text-[#5F6B7A]'}>
                    {templateIcons[t.id] || <FlaskConical size={16} />}
                  </span>
                  <span className="text-sm font-medium text-[#1A1D21]">{t.name}</span>
                  <span className="ml-auto text-xs text-[#8D95A0]">
                    {t.stages.length} stages
                  </span>
                </div>
                <p className="text-xs text-[#5F6B7A] mt-1 ml-6">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || creating}>
            {creating ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
