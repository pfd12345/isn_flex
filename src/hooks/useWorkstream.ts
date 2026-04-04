'use client';

import { useState, useCallback } from 'react';
import type { WorkstreamStage, FileRecord } from '@/types';

interface UseWorkstreamOptions {
  workstreamId: string;
  initialStages?: WorkstreamStage[];
  initialFiles?: FileRecord[];
}

export function useWorkstream({
  workstreamId,
  initialStages = [],
  initialFiles = [],
}: UseWorkstreamOptions) {
  const [stages, setStages] = useState<WorkstreamStage[]>(initialStages);
  const [files, setFiles] = useState<FileRecord[]>(initialFiles);
  const [activeStageId, setActiveStageId] = useState(
    () => initialStages.find((s) => s.status === 'active')?.stage_id || ''
  );

  const transitionStage = useCallback(
    async (stageId: string, action: 'complete' | 'skip' | 'reopen', reason?: string) => {
      try {
        const res = await fetch('/api/stages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workstream_id: workstreamId,
            stage_id: stageId,
            action,
            reason,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          return { success: false, error: data.error };
        }

        const data = await res.json();
        setStages(data.stages);
        if (data.active_stage_id) {
          setActiveStageId(data.active_stage_id);
        }
        return { success: true };
      } catch {
        return { success: false, error: 'Network error' };
      }
    },
    [workstreamId]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workstream_id', workstreamId);
      formData.append('stage_id', activeStageId);

      try {
        const res = await fetch('/api/files', { method: 'POST', body: formData });
        if (res.ok) {
          const fileRecord = await res.json();
          setFiles((prev) => [...prev, fileRecord]);
          return fileRecord;
        }
      } catch {
        // Upload failed
      }
      return null;
    },
    [workstreamId, activeStageId]
  );

  const refreshFiles = useCallback(async () => {
    try {
      const res = await fetch(`/api/files?workstream_id=${workstreamId}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch {
      // Refresh failed
    }
  }, [workstreamId]);

  return {
    stages,
    setStages,
    activeStageId,
    setActiveStageId,
    files,
    transitionStage,
    uploadFile,
    refreshFiles,
  };
}
