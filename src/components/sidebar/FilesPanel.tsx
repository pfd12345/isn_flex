'use client';

import { File, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { FileRecord } from '@/types';

interface FilesPanelProps {
  files: FileRecord[];
  onUpload: (file: globalThis.File) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesPanel({ files, onUpload }: FilesPanelProps) {
  const handleFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = () => {
      if (input.files) {
        Array.from(input.files).forEach((f) => onUpload(f));
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8D95A0]">
          Files
        </h3>
        <Button size="sm" variant="ghost" onClick={handleFileInput}>
          <Upload size={12} /> Upload
        </Button>
      </div>

      {files.length === 0 ? (
        <p className="px-3 py-4 text-xs text-[#8D95A0] text-center">
          No files uploaded yet
        </p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F8F9FA] transition-colors cursor-pointer"
            >
              <File size={14} className="flex-shrink-0 text-[#5F6B7A]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#1A1D21] truncate">{f.name}</p>
                <p className="text-xs text-[#8D95A0]">{formatSize(f.size_bytes)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
