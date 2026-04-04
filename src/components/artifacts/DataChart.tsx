'use client';

import { BarChart3 } from 'lucide-react';

interface ChartSeries {
  name: string;
  values: number[];
}

interface DataChartData {
  title: string;
  chart_type: 'bar' | 'line';
  x_label?: string;
  y_label?: string;
  categories: string[];
  series: ChartSeries[];
}

const COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#8B5CF6', '#06B6D4'];

export default function DataChart({ data }: { data: DataChartData }) {
  const allValues = data.series.flatMap((s) => s.values);
  const maxValue = Math.max(...allValues, 1);
  const barWidth = Math.max(20, Math.min(60, 300 / (data.categories.length * data.series.length)));

  return (
    <div className="rounded-lg border border-[#E2E5E9] bg-[#FAFBFC] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E2E5E9]">
        <BarChart3 size={16} className="text-[#2563EB]" />
        <h3 className="text-sm font-semibold text-[#1A1D21]">{data.title}</h3>
      </div>
      <div className="p-4">
        {/* Legend */}
        <div className="flex gap-4 mb-4">
          {data.series.map((s, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs text-[#5F6B7A]">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              {s.name}
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex items-end gap-1 h-48">
          {data.y_label && (
            <div className="text-xs text-[#8D95A0] -rotate-90 origin-center whitespace-nowrap self-center">
              {data.y_label}
            </div>
          )}
          <div className="flex-1 flex items-end justify-around h-full border-l border-b border-[#E2E5E9] pl-1 pb-1">
            {data.categories.map((cat, catIdx) => (
              <div key={catIdx} className="flex flex-col items-center gap-1">
                <div className="flex items-end gap-0.5 h-40">
                  {data.series.map((s, sIdx) => {
                    const value = s.values[catIdx] || 0;
                    const height = (value / maxValue) * 100;
                    return (
                      <div key={sIdx} className="flex flex-col items-center">
                        <span className="text-[9px] text-[#8D95A0] mb-0.5">
                          {value}
                        </span>
                        <div
                          className="rounded-t-sm transition-all duration-300"
                          style={{
                            width: `${barWidth}px`,
                            height: `${height}%`,
                            minHeight: '2px',
                            backgroundColor: COLORS[sIdx % COLORS.length],
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <span className="text-[10px] text-[#5F6B7A] text-center max-w-[80px] truncate">
                  {cat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {data.x_label && (
          <div className="text-xs text-[#8D95A0] text-center mt-2">{data.x_label}</div>
        )}
      </div>
    </div>
  );
}
