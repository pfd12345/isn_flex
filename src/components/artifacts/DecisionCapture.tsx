'use client';

import { useState } from 'react';
import { Stamp, CheckSquare, Square } from 'lucide-react';
import Button from '@/components/ui/Button';

interface DecisionCaptureData {
  title: string;
  decision_id: string;
  statement: string;
  rationale: string;
  evidence: string[];
  risks_accepted?: string[];
  approvers?: string[];
  status: 'pending_approval' | 'approved' | 'rejected';
}

export default function DecisionCapture({ data }: { data: DecisionCaptureData }) {
  const [checkedEvidence, setCheckedEvidence] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState(data.status);

  const toggleEvidence = (idx: number) => {
    const next = new Set(checkedEvidence);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setCheckedEvidence(next);
  };

  return (
    <div className="rounded-lg border border-[#E2E5E9] bg-[#FAFBFC] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E2E5E9]">
        <Stamp size={16} className="text-[#2563EB]" />
        <h3 className="text-sm font-semibold text-[#1A1D21]">{data.title}</h3>
        <span className="ml-auto text-xs font-mono text-[#8D95A0]">{data.decision_id}</span>
      </div>
      <div className="px-4 py-3 space-y-3">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8D95A0] mb-1">
            Decision
          </h4>
          <p className="text-sm text-[#1A1D21] font-medium">{data.statement}</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8D95A0] mb-1">
            Rationale
          </h4>
          <p className="text-sm text-[#5F6B7A]">{data.rationale}</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8D95A0] mb-1">
            Supporting Evidence
          </h4>
          <ul className="space-y-1">
            {data.evidence.map((item, idx) => (
              <li
                key={idx}
                onClick={() => toggleEvidence(idx)}
                className="flex items-start gap-2 cursor-pointer hover:bg-white rounded p-1 -mx-1 transition-colors"
              >
                {checkedEvidence.has(idx) ? (
                  <CheckSquare size={14} className="flex-shrink-0 mt-0.5 text-[#16A34A]" />
                ) : (
                  <Square size={14} className="flex-shrink-0 mt-0.5 text-[#D1D5DB]" />
                )}
                <span className="text-sm text-[#1A1D21]">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {data.risks_accepted && data.risks_accepted.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
              Risks Accepted
            </h4>
            <ul className="space-y-1">
              {data.risks_accepted.map((risk, idx) => (
                <li key={idx} className="text-sm text-amber-700 flex items-start gap-1.5">
                  <span className="text-amber-500 mt-1">&#8226;</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {status === 'pending_approval' ? (
          <div className="flex gap-2 pt-2 border-t border-[#E2E5E9]">
            <Button size="sm" variant="primary" onClick={() => setStatus('approved')}>
              Approve Decision
            </Button>
            <Button size="sm" variant="danger" onClick={() => setStatus('rejected')}>
              Reject
            </Button>
          </div>
        ) : (
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {status === 'approved' ? 'Decision Approved' : 'Decision Rejected'}
          </div>
        )}
      </div>
    </div>
  );
}
