'use client';

import type { StageStatus } from '@/types';

const statusStyles: Record<StageStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Pending' },
  active: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Active' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
  skipped: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Skipped' },
  always_active: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Always Active' },
};

interface BadgeProps {
  status: StageStatus;
  className?: string;
}

export default function Badge({ status, className = '' }: BadgeProps) {
  const style = statusStyles[status] || statusStyles.pending;
  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
        ${style.bg} ${style.text} ${className}
      `}
    >
      {style.label}
    </span>
  );
}
