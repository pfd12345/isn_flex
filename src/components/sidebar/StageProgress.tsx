'use client';

import { Check, SkipForward, RotateCcw, ChevronRight } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { getIcon } from '@/lib/icons';
import type { WorkstreamStage, StageDefinition } from '@/types';

interface StageProgressProps {
  stages: WorkstreamStage[];
  stageDefinitions: StageDefinition[];
  activeStageId: string;
  onStageClick: (stageId: string) => void;
  onStageAction: (stageId: string, action: 'complete' | 'skip' | 'reopen', reason?: string) => void;
}

export default function StageProgress({
  stages,
  stageDefinitions,
  activeStageId,
  onStageClick,
  onStageAction,
}: StageProgressProps) {
  const sequentialStages = stages.filter((s) => !s.parallel);
  const parallelStages = stages.filter((s) => s.parallel);

  return (
    <div className="flex flex-col gap-1">
      <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#8D95A0]">
        Stage Progress
      </h3>

      {/* Sequential stages */}
      <div className="flex flex-col">
        {sequentialStages.map((stage, idx) => {
          const def = stageDefinitions.find((d) => d.id === stage.stage_id);
          const Icon = getIcon(def?.icon || '');
          const isActive = stage.stage_id === activeStageId;
          const isClickable =
            stage.status === 'completed' ||
            stage.status === 'skipped' ||
            stage.status === 'active';

          return (
            <div key={stage.id} className="relative">
              {/* Connector line */}
              {idx > 0 && (
                <div
                  className={`absolute left-[23px] -top-1 w-0.5 h-2 ${
                    stage.status === 'completed'
                      ? 'bg-[#16A34A]'
                      : stage.status === 'skipped'
                      ? 'bg-[#F59E0B]'
                      : stage.status === 'active'
                      ? 'bg-[#2563EB]'
                      : 'bg-[#D1D5DB]'
                  }`}
                />
              )}

              <button
                onClick={() => isClickable && onStageClick(stage.stage_id)}
                disabled={!isClickable}
                className={`
                  w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                  ${isActive ? 'bg-[#EFF6FF] border border-[#2563EB]/20' : 'hover:bg-[#F8F9FA] border border-transparent'}
                  ${!isClickable ? 'opacity-50 cursor-default' : 'cursor-pointer'}
                `}
              >
                <div
                  className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5
                    ${stage.status === 'completed' ? 'bg-[#16A34A] text-white' : ''}
                    ${stage.status === 'active' ? 'bg-[#2563EB] text-white' : ''}
                    ${stage.status === 'skipped' ? 'bg-[#F59E0B] text-white' : ''}
                    ${stage.status === 'pending' ? 'bg-[#F8F9FA] text-[#8D95A0] border border-[#D1D5DB]' : ''}
                  `}
                >
                  {stage.status === 'completed' ? (
                    <Check size={14} />
                  ) : stage.status === 'skipped' ? (
                    <SkipForward size={14} />
                  ) : (
                    <Icon size={14} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium truncate ${isActive ? 'text-[#2563EB]' : 'text-[#1A1D21]'}`}>
                      {stage.stage_name}
                    </span>
                    {stage.required && (
                      <span className="text-[9px] font-bold text-red-500 uppercase">req</span>
                    )}
                  </div>
                  {def?.description && (
                    <p className="text-xs text-[#8D95A0] mt-0.5 line-clamp-1">{def.description}</p>
                  )}

                  {/* Action buttons for active stage */}
                  {isActive && (
                    <div className="flex gap-1.5 mt-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStageAction(stage.stage_id, 'complete');
                        }}
                      >
                        <Check size={12} /> Complete
                      </Button>
                      {stage.skippable && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            const reason = window.prompt('Reason for skipping (optional):');
                            onStageAction(stage.stage_id, 'skip', reason || undefined);
                          }}
                        >
                          <SkipForward size={12} /> Skip
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Reopen for completed/skipped */}
                  {(stage.status === 'completed' || stage.status === 'skipped') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStageAction(stage.stage_id, 'reopen');
                      }}
                      className="flex items-center gap-1 mt-1.5 text-xs text-[#5F6B7A] hover:text-[#2563EB] transition-colors"
                    >
                      <RotateCcw size={10} /> Reopen
                    </button>
                  )}

                  {/* Skip reason */}
                  {stage.status === 'skipped' && stage.skip_reason && (
                    <p className="text-xs text-amber-600 mt-1 italic">
                      Skipped: {stage.skip_reason}
                    </p>
                  )}
                </div>

                {isClickable && !isActive && (
                  <ChevronRight size={14} className="flex-shrink-0 mt-2 text-[#8D95A0]" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Parallel stages */}
      {parallelStages.length > 0 && (
        <>
          <div className="mx-3 my-2 border-t border-[#E2E5E9]" />
          <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-[#8D95A0]">
            Parallel Stages
          </h4>
          {parallelStages.map((stage) => {
            const def = stageDefinitions.find((d) => d.id === stage.stage_id);
            const Icon = getIcon(def?.icon || '');

            return (
              <button
                key={stage.id}
                onClick={() => onStageClick(stage.stage_id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-[#F8F9FA] transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[#1A1D21] truncate block">
                    {stage.stage_name}
                  </span>
                  <Badge status="always_active" />
                </div>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
