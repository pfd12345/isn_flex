'use client';

import { ShieldAlert } from 'lucide-react';

interface Risk {
  id: string;
  category: string;
  severity: string;
  likelihood?: string;
  description: string;
  mitigation: string;
  source?: string;
}

interface RiskRegisterData {
  title: string;
  risks: Risk[];
}

const severityColors: Record<string, { bg: string; text: string }> = {
  High: { bg: 'bg-red-100', text: 'text-red-700' },
  Medium: { bg: 'bg-amber-100', text: 'text-amber-700' },
  Low: { bg: 'bg-green-100', text: 'text-green-700' },
};

export default function RiskRegister({ data }: { data: RiskRegisterData }) {
  return (
    <div className="rounded-lg border border-[#E2E5E9] bg-[#FAFBFC] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E2E5E9]">
        <ShieldAlert size={16} className="text-[#2563EB]" />
        <h3 className="text-sm font-semibold text-[#1A1D21]">{data.title}</h3>
        <span className="ml-auto text-xs text-[#8D95A0]">{data.risks.length} risks</span>
      </div>
      <div className="divide-y divide-[#E2E5E9]">
        {data.risks.map((risk) => {
          const sev = severityColors[risk.severity] || severityColors.Medium;
          return (
            <div key={risk.id} className="px-4 py-3 hover:bg-white transition-colors">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 text-xs font-mono font-bold text-[#5F6B7A] mt-0.5">
                  {risk.id}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[#5F6B7A]">{risk.category}</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${sev.bg} ${sev.text}`}>
                      {risk.severity}
                    </span>
                    {risk.likelihood && (
                      <span className="text-xs text-[#8D95A0]">Likelihood: {risk.likelihood}</span>
                    )}
                  </div>
                  <p className="text-sm text-[#1A1D21] mb-1">{risk.description}</p>
                  <p className="text-xs text-[#5F6B7A]">
                    <span className="font-medium">Mitigation:</span> {risk.mitigation}
                  </p>
                  {risk.source && (
                    <p className="text-xs text-[#8D95A0] mt-1">Source: {risk.source}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
