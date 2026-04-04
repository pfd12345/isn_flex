'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, X } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [text, setText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && attachedFiles.length === 0) return;
    onSend(trimmed, attachedFiles.length > 0 ? attachedFiles : undefined);
    setText('');
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, attachedFiles, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    e.target.value = '';
  };

  const removeFile = (idx: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="border-t border-[#E2E5E9] bg-white px-4 py-3">
      {/* Attached files */}
      {attachedFiles.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {attachedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 bg-[#F0F4F8] rounded-full px-3 py-1 text-xs text-[#5F6B7A]"
            >
              <Paperclip size={10} />
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                onClick={() => removeFile(idx)}
                className="hover:text-[#DC2626] transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={handleFileSelect}
          disabled={disabled}
          className="flex-shrink-0 p-2 rounded-lg text-[#5F6B7A] hover:bg-[#F8F9FA] hover:text-[#2563EB] transition-colors disabled:opacity-50"
          title="Attach files"
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder || 'Type a message, or upload a file...'}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-[#E2E5E9] bg-[#F8F9FA] px-4 py-2.5 text-sm text-[#1A1D21] placeholder-[#8D95A0] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent disabled:opacity-50"
        />

        <button
          onClick={handleSubmit}
          disabled={disabled || (!text.trim() && attachedFiles.length === 0)}
          className="flex-shrink-0 p-2.5 rounded-xl bg-[#2563EB] text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
