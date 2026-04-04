'use client';

import { useState } from 'react';
import { ArrowUpDown, Table } from 'lucide-react';

interface DataTableData {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

export default function DataTable({ data }: { data: DataTableData }) {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const rows = [...data.rows];
  if (sortCol !== null) {
    rows.sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortAsc ? cmp : -cmp;
    });
  }

  const handleSort = (idx: number) => {
    if (sortCol === idx) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(idx);
      setSortAsc(true);
    }
  };

  return (
    <div className="rounded-lg border border-[#E2E5E9] bg-[#FAFBFC] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E2E5E9]">
        <Table size={16} className="text-[#2563EB]" />
        <h3 className="text-sm font-semibold text-[#1A1D21]">{data.title}</h3>
        <span className="ml-auto text-xs text-[#8D95A0]">{data.rows.length} rows</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8F9FA]">
              {data.columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(idx)}
                  className="px-4 py-2 text-left text-xs font-medium text-[#5F6B7A] uppercase tracking-wider cursor-pointer hover:bg-[#F0F4F8] transition-colors select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {col}
                    <ArrowUpDown size={10} className="text-[#8D95A0]" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E5E9]">
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-white transition-colors">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-4 py-2 text-[#1A1D21] whitespace-nowrap">
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
