'use client';

import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import type { Message } from '@/types';

interface ChatThreadProps {
  messages: Message[];
  streamingContent?: string;
}

export default function ChatThread({ messages, streamingContent }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingContent]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6"
    >
      {messages.length === 0 && !streamingContent && (
        <div className="flex items-center justify-center h-full text-[#8D95A0] text-sm">
          Start a conversation to begin...
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          role={msg.role}
          content={msg.content}
          timestamp={msg.created_at}
        />
      ))}

      {streamingContent && (
        <MessageBubble
          role="assistant"
          content={streamingContent}
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
