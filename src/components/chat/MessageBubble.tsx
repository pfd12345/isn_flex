'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Info } from 'lucide-react';
import ArtifactRenderer from '@/components/artifacts/ArtifactRenderer';
import type { ParsedArtifact } from '@/types';

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

const ARTIFACT_REGEX = /```artifact\s*(\{[\s\S]*?\})\s*```/g;

function extractParts(content: string): Array<{ type: 'text'; value: string } | { type: 'artifact'; value: ParsedArtifact }> {
  const parts: Array<{ type: 'text'; value: string } | { type: 'artifact'; value: ParsedArtifact }> = [];
  let lastIndex = 0;
  let match;

  const regex = new RegExp(ARTIFACT_REGEX.source, 'g');

  while ((match = regex.exec(content)) !== null) {
    // Text before artifact
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) parts.push({ type: 'text', value: text });
    }

    // Parse artifact
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.type && parsed.data) {
        parts.push({ type: 'artifact', value: { type: parsed.type, data: parsed.data } });
      }
    } catch {
      // Invalid JSON — render as text
      parts.push({ type: 'text', value: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) parts.push({ type: 'text', value: text });
  }

  return parts;
}

export default function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const parts = useMemo(() => extractParts(content), [content]);

  if (role === 'system') {
    return (
      <div className="flex justify-center my-3">
        <div className="flex items-start gap-2 max-w-xl bg-[#EFF6FF] border border-blue-200 rounded-lg px-4 py-3">
          <Info size={14} className="flex-shrink-0 mt-0.5 text-[#2563EB]" />
          <div className="text-sm text-[#5F6B7A] prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} my-3`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-[#2563EB] text-white' : 'bg-[#F0F4F8] text-[#5F6B7A]'
        }`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Message content */}
      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {parts.map((part, idx) => {
          if (part.type === 'artifact') {
            return (
              <div key={idx} className="w-full min-w-[300px] max-w-[560px]">
                <ArtifactRenderer type={part.value.type} data={part.value.data} />
              </div>
            );
          }

          return (
            <div
              key={idx}
              className={`rounded-xl px-4 py-2.5 ${
                isUser
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#F8F9FA] text-[#1A1D21] border-l-2 border-[#2563EB]'
              }`}
            >
              <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.value}</ReactMarkdown>
              </div>
            </div>
          );
        })}

        {timestamp && (
          <span className="text-[10px] text-[#8D95A0] px-1">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
