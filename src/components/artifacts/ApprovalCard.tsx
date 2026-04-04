'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ApprovalCardData {
  title: string;
  risk_id?: string;
  recommendation: string;
  prior_run?: string;
  confidence?: string;
  estimated_time?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function ApprovalCard({ data }: { data: ApprovalCardData }) {
  const [status, setStatus] = useState(data.status || 'pending');

  return (
    <div className="rounded-lg border border-[#E2E5E9] bg-[#FAFBFC] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E2E5E9]">
        {status === 'approved' && <CheckCircle size={16} className="text-green-600" />}
        {status === 'rejected' && <XCircle size={16} className="text-red-600" />}
        {status === 'pending' && <Clock size={16} className="text-amber-500" />}
        <h3 className="text-sm font-semibold text-[#1A1D21]">{data.title}</h3>
        {data.risk_id && (
          <span className="ml-auto text-xs font-mono text-[#5F6B7A]">{data.risk_id}</span>
        )}
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className="text-sm text-[#1A1D21]">{data.recommendation}</p>
        {data.prior_run && (
          <p className="text-xs text-[#5F6B7A]">
            <span className="font-medium">Prior Run:</span> {data.prior_run}
          </p>
        )}
        <div className="flex gap-3 text-xs text-[#8D95A0]">
          {data.confidence && <span>Confidence: {data.confidence}</span>}
          {data.estimated_time && <span>Est. Time: {data.estimated_time}</span>}
        </div>

        {status === 'pending' ? (
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="primary" onClick={() => setStatus('approved')}>
              <CheckCircle size={12} /> Approve
            </Button>
            <Button size="sm" variant="danger" onClick={() => setStatus('rejected')}>
              <XCircle size={12} /> Reject
            </Button>
          </div>
        ) : (
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-2 ${
              status === 'approved'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {status === 'approved' ? <CheckCircle size={12} /> : <XCircle size={12} />}
            {status === 'approved' ? 'Approved' : 'Rejected'}
          </div>
        )}
      </div>
    </div>
  );
}
