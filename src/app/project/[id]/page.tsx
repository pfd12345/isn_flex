'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, FlaskConical, PanelRightOpen, PanelRightClose, Settings } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

  // Load project and config
  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then((r) => r.json()),
      fetch('/api/config').then((r) => r.json()),
    ]).then(([projectData, configData]) => {
      setProject(projectData);
      setConfig(configData);
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

  if (!project || !workstream || !config) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#5F6B7A] mb-4">Project not found</p>
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
      onToggleFiles={() => setShowFiles(!showFiles)}
      onBack={() => router.push('/')}
      onSettings={() => router.push('/settings')}
    />
  );
}

function NotebookView({
  project,
  workstream: initialWorkstream,
  config,
  showFiles,
  onToggleFiles,
  onBack,
  onSettings,
}: {
  project: ProjectData;
  workstream: ProjectData['workstreams'][0];
  config: ISNConfig;
  showFiles: boolean;
  onToggleFiles: () => void;
  onBack: () => void;
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
          const data = await res.json();
          const ws = data.workstreams?.find((w: Workstream) => w.id === initialWorkstream.id);
          if (ws?.messages) {
            setMessages(ws.messages);
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
      <header className="flex-shrink-0 bg-white border-b border-[#E2E5E9] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-[#F8F9FA] transition-colors text-[#5F6B7A]"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center">
            <FlaskConical size={12} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-[#1A1D21] truncate">
                {project.name}
              </h1>
              <span className="text-[#8D95A0]">/</span>
              <span className="text-sm text-[#5F6B7A] truncate">
                {initialWorkstream.name}
              </span>
            </div>
            {activeStageDef && (
              <p className="text-xs text-[#8D95A0]">
                Stage: {activeStageDef.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onToggleFiles}>
              {showFiles ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onSettings}>
              <Settings size={14} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="flex-shrink-0 w-72 border-r border-[#E2E5E9] bg-white overflow-y-auto">
          <div className="py-3">
            <StageProgress
              stages={stages}
              stageDefinitions={stageDefinitions}
              activeStageId={activeStageId}
              onStageClick={handleStageClick}
              onStageAction={handleStageAction}
            />
          </div>
        </aside>

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

        {/* Files Panel */}
        {showFiles && (
          <aside className="flex-shrink-0 w-64 border-l border-[#E2E5E9] bg-white overflow-y-auto">
            <div className="py-3">
              <FilesPanel files={files} onUpload={handleFileUpload} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
