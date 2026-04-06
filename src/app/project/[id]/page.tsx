'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, FlaskConical, PanelRightOpen, PanelRightClose, PanelLeftOpen, PanelLeftClose, Settings, Share2, X } from 'lucide-react';
import ChatThread from '@/components/chat/ChatThread';
import ChatInput from '@/components/chat/ChatInput';
import StageProgress from '@/components/sidebar/StageProgress';
import FilesPanel from '@/components/sidebar/FilesPanel';
import Button from '@/components/ui/Button';
import { useChat } from '@/hooks/useChat';
import { useWorkstream } from '@/hooks/useWorkstream';
import type { ISNConfig, Project, Workstream, WorkstreamStage, Message, FileRecord, StageDefinition } from '@/types';

interface ProjectData extends Project {
  workstreams: (Workstream & {
    stages: WorkstreamStage[];
    messages: Message[];
    files: FileRecord[];
  })[];
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const wsId = searchParams.get('ws');

  const [project, setProject] = useState<ProjectData | null>(null);
  const [config, setConfig] = useState<ISNConfig | null>(null);
  const [showFiles, setShowFiles] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-hide panels on small screens
  useEffect(() => {
    if (window.innerWidth < 640) {
      setShowSidebar(false);
      setShowFiles(false);
    }
  }, []);

  // Load project and config
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/projects/${id}`).then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? 'Project not found' : `Failed to load project (${r.status})`);
        return r.json();
      }),
      fetch('/api/config').then((r) => {
        if (!r.ok) throw new Error(`Failed to load config (${r.status})`);
        return r.json();
      }),
    ]).then(([projectData, configData]) => {
      setProject(projectData);
      setConfig(configData);
      setLoading(false);
    }).catch((err: Error) => {
      setError(err.message);
      setLoading(false);
    });
  }, [id]);

  const workstream = project?.workstreams?.find((w) => w.id === wsId) || project?.workstreams?.[0];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-[#8D95A0]">
        Loading notebook...
      </div>
    );
  }

  if (error || !project || !workstream || !config) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#5F6B7A] mb-4">{error || 'Project not found'}</p>
          <Button variant="secondary" onClick={() => router.push('/')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <NotebookView
      project={project}
      workstream={workstream}
      config={config}
      showFiles={showFiles}
      showSidebar={showSidebar}
      onToggleFiles={() => setShowFiles(!showFiles)}
      onToggleSidebar={() => setShowSidebar(!showSidebar)}
      onBack={() => router.push('/')}
      onOntology={() => router.push('/ontology')}
      onSettings={() => router.push('/settings')}
    />
  );
}

function NotebookView({
  project,
  workstream: initialWorkstream,
  config,
  showFiles,
  showSidebar,
  onToggleFiles,
  onToggleSidebar,
  onBack,
  onOntology,
  onSettings,
}: {
  project: ProjectData;
  workstream: ProjectData['workstreams'][0];
  config: ISNConfig;
  showFiles: boolean;
  showSidebar: boolean;
  onToggleFiles: () => void;
  onToggleSidebar: () => void;
  onBack: () => void;
  onOntology: () => void;
  onSettings: () => void;
}) {
  const {
    stages,
    activeStageId,
    setActiveStageId,
    files,
    transitionStage,
    uploadFile,
  } = useWorkstream({
    workstreamId: initialWorkstream.id,
    initialStages: initialWorkstream.stages,
    initialFiles: initialWorkstream.files,
  });

  const {
    messages,
    setMessages,
    streamingContent,
    isLoading,
    sendMessage,
  } = useChat({
    workstreamId: initialWorkstream.id,
    stageId: activeStageId,
    initialMessages: initialWorkstream.messages,
  });

  // Get stage definitions from config
  const stageDefinitions: StageDefinition[] = config.stages;

  const handleStageClick = useCallback((stageId: string) => {
    setActiveStageId(stageId);
  }, [setActiveStageId]);

  const handleStageAction = useCallback(
    async (stageId: string, action: 'complete' | 'skip' | 'reopen', reason?: string) => {
      const result = await transitionStage(stageId, action, reason);
      if (result.success) {
        // Refresh messages to get system messages about transitions
        try {
          const res = await fetch(`/api/projects/${project.id}`);
          if (res.ok) {
            const data = await res.json();
            const ws = data.workstreams?.find((w: Workstream) => w.id === initialWorkstream.id);
            if (ws?.messages) {
              setMessages(ws.messages);
            }
          }
        } catch {
          // Refresh failed — that's ok
        }
      }
    },
    [transitionStage, project.id, initialWorkstream.id, setMessages]
  );

  const handleFileUpload = useCallback(
    (file: File) => {
      uploadFile(file);
    },
    [uploadFile]
  );

  // Active stage info
  const activeStage = stages.find((s) => s.stage_id === activeStageId);
  const activeStageDef = stageDefinitions.find((d) => d.id === activeStageId);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-[#E2E5E9] px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-[#F8F9FA] transition-colors text-[#5F6B7A] flex-shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center flex-shrink-0 hidden sm:flex">
            <FlaskConical size={12} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-[#1A1D21] truncate">
                {project.name}
              </h1>
              <span className="text-[#8D95A0] hidden sm:inline">/</span>
              <span className="text-sm text-[#5F6B7A] truncate hidden sm:inline">
                {initialWorkstream.name}
              </span>
            </div>
            {activeStageDef && (
              <p className="text-xs text-[#8D95A0] truncate">
                Stage: {activeStageDef.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onToggleSidebar}>
              {showSidebar ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            </Button>
            <span className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" onClick={onToggleFiles}>
                {showFiles ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
              </Button>
            </span>
            <Button variant="ghost" size="sm" onClick={onOntology}>
              <Share2 size={14} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onSettings}>
              <Settings size={14} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile sidebar overlay backdrop */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black/30 z-20 sm:hidden"
            onClick={onToggleSidebar}
          />
        )}

        {/* Sidebar — overlay on mobile, inline on desktop */}
        {showSidebar && (
          <aside className="
            fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-[#E2E5E9] overflow-y-auto shadow-lg
            sm:static sm:z-auto sm:shadow-none sm:flex-shrink-0
          ">
            <div className="flex items-center justify-between px-3 pt-3 sm:hidden">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8D95A0]">Stages</span>
              <button
                onClick={onToggleSidebar}
                className="p-1.5 rounded-lg hover:bg-[#F8F9FA] text-[#5F6B7A]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="py-3">
              <StageProgress
                stages={stages}
                stageDefinitions={stageDefinitions}
                activeStageId={activeStageId}
                onStageClick={(stageId) => {
                  handleStageClick(stageId);
                  // Auto-close sidebar on mobile after selecting a stage
                  if (window.innerWidth < 640) onToggleSidebar();
                }}
                onStageAction={handleStageAction}
              />
            </div>
          </aside>
        )}

        {/* Chat */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          <ChatThread
            messages={messages}
            streamingContent={streamingContent}
          />
          <ChatInput
            onSend={sendMessage}
            disabled={isLoading}
            placeholder={config.chat?.placeholder}
          />
        </main>

        {/* Files Panel — hidden on mobile */}
        {showFiles && (
          <aside className="hidden sm:block flex-shrink-0 w-64 border-l border-[#E2E5E9] bg-white overflow-y-auto">
            <div className="py-3">
              <FilesPanel files={files} onUpload={handleFileUpload} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
