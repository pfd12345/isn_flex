'use client';

import { useState, useCallback } from 'react';
import type { Message } from '@/types';

interface UseChatOptions {
  workstreamId: string;
  stageId?: string;
  initialMessages?: Message[];
}

export function useChat({ workstreamId, stageId, initialMessages = [] }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [streamingContent, setStreamingContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string, files?: File[]) => {
      if (!text.trim() && (!files || files.length === 0)) return;

      setError(null);
      setIsLoading(true);
      setStreamingContent('');

      // Add user message optimistically
      const userMsg: Message = {
        id: `temp-${Date.now()}`,
        workstream_id: workstreamId,
        role: 'user',
        content: text,
        stage_id: stageId,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Upload files first if any
      if (files && files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('workstream_id', workstreamId);
          if (stageId) formData.append('stage_id', stageId);
          try {
            await fetch('/api/files', { method: 'POST', body: formData });
          } catch {
            // File upload failed — continue with message
          }
        }
      }

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workstream_id: workstreamId,
            message: text,
            stage_id: stageId,
          }),
        });

        if (!res.ok) {
          throw new Error('Chat request failed');
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setStreamingContent(accumulated);
        }

        // Add assistant message
        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          workstream_id: workstreamId,
          role: 'assistant',
          content: accumulated,
          stage_id: stageId,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    },
    [workstreamId, stageId]
  );

  const addSystemMessage = useCallback((content: string) => {
    const sysMsg: Message = {
      id: `system-${Date.now()}`,
      workstream_id: workstreamId,
      role: 'system',
      content,
      stage_id: stageId,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, sysMsg]);
  }, [workstreamId, stageId]);

  return {
    messages,
    setMessages,
    streamingContent,
    isLoading,
    error,
    sendMessage,
    addSystemMessage,
  };
}
