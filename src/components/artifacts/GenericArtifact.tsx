'use client';

import { Code } from 'lucide-react';

interface GenericArtifactProps {
  type: string;
  data: Record<string, unknown>;
}

export default function GenericArtifact({ type, data }: GenericArtifactProps) {
  return (
    <div className="rounded-lg border border-[#E2E5E9] bg-[#FAFBFC] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E2E5E9]">
        <Code size={16} className="text-[#5F6B7A]" />
        <h3 className="text-sm font-semibold text-[#1A1D21]">
          {(data.title as string) || type}
        </h3>
        <span className="ml-auto text-xs font-mono text-[#8D95A0]">{type}</span>
      </div>
      <div className="p-4">
        <pre className="text-xs text-[#5F6B7A] bg-[#F8F9FA] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
