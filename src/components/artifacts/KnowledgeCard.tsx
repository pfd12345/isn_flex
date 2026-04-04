'use client';

import { Brain, Tag } from 'lucide-react';

interface KnowledgeCardData {
  title: string;
  card_type: string;
  content: string;
  tags?: string[];
  confidence?: string;
  source?: string;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  lesson_learned: { label: 'Lesson Learned', color: 'bg-blue-100 text-blue-700' },
  causal_statement: { label: 'Causal', color: 'bg-purple-100 text-purple-700' },
  counterfactual: { label: 'Counterfactual', color: 'bg-amber-100 text-amber-700' },
  surprise: { label: 'Surprise', color: 'bg-red-100 text-red-700' },
};

export default function KnowledgeCard({ data }: { data: KnowledgeCardData }) {
  const typeStyle = typeLabels[data.card_type] || {
    label: data.card_type,
    color: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="rounded-lg border border-[#E2E5E9] bg-[#FAFBFC] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E2E5E9]">
        <Brain size={16} className="text-purple-600" />
        <h3 className="text-sm font-semibold text-[#1A1D21]">{data.title}</h3>
        <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle.color}`}>
          {typeStyle.label}
        </span>
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className="text-sm text-[#1A1D21]">{data.content}</p>

        {data.tags && data.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag size={12} className="text-[#8D95A0]" />
            {data.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs bg-[#F0F4F8] text-[#5F6B7A] px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-4 text-xs text-[#8D95A0]">
          {data.confidence && <span>Confidence: {data.confidence}</span>}
          {data.source && <span>Source: {data.source}</span>}
        </div>
      </div>
    </div>
  );
}
