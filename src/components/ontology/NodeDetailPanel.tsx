'use client';

import { X } from 'lucide-react';
import type { RDFNode, RDFEdge } from '@/lib/rdf/parser';
import { shortenUri } from '@/lib/rdf/parser';

interface NodeDetailPanelProps {
  node: RDFNode | null;
  edge: RDFEdge | null;
  allNodes: RDFNode[];
  allEdges: RDFEdge[];
  onClose: () => void;
  onDeleteNode?: (uri: string) => void;
  onDeleteEdge?: (uri: string) => void;
  onNavigate?: (uri: string) => void;
}

export default function NodeDetailPanel({
  node,
  edge,
  allNodes,
  allEdges,
  onClose,
  onDeleteNode,
  onDeleteEdge,
  onNavigate,
}: NodeDetailPanelProps) {
  if (!node && !edge) return null;

  if (edge) {
    const sourceNode = allNodes.find((n) => n.uri === edge.source);
    const targetNode = allNodes.find((n) => n.uri === edge.target);

    return (
      <div className="h-full overflow-y-auto bg-white border-l border-[#E2E5E9]">
        <div className="p-4 border-b border-[#E2E5E9] flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
              Property
            </span>
            <h3 className="text-sm font-semibold text-[#1A1D21] mt-1">{edge.label}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#F8F9FA] text-[#8D95A0]">
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <DetailRow label="URI" value={shortenUri(edge.uri)} />

          <div>
            <span className="text-xs font-medium text-[#8D95A0] block mb-1">Domain (source)</span>
            <button
              onClick={() => onNavigate?.(edge.source)}
              className="text-sm text-[#2563EB] hover:underline"
            >
              {sourceNode?.label || shortenUri(edge.source)}
            </button>
          </div>

          <div>
            <span className="text-xs font-medium text-[#8D95A0] block mb-1">Range (target)</span>
            <button
              onClick={() => onNavigate?.(edge.target)}
              className="text-sm text-[#2563EB] hover:underline"
            >
              {targetNode?.label || shortenUri(edge.target)}
            </button>
          </div>

          {onDeleteEdge && (
            <button
              onClick={() => {
                if (confirm(`Remove property "${edge.label}"?`)) {
                  onDeleteEdge(edge.uri);
                }
              }}
              className="w-full mt-4 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Remove Property
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!node) return null;

  // Find connected edges
  const outgoing = allEdges.filter((e) => e.source === node.uri && e.label !== 'subClassOf');
  const incoming = allEdges.filter((e) => e.target === node.uri && e.label !== 'subClassOf');
  const subClassEdges = allEdges.filter((e) => e.source === node.uri && e.label === 'subClassOf');
  const childEdges = allEdges.filter((e) => e.target === node.uri && e.label === 'subClassOf');

  const typeColors: Record<string, { bg: string; text: string }> = {
    class: { bg: 'bg-blue-50', text: 'text-blue-600' },
    instance: { bg: 'bg-green-50', text: 'text-green-600' },
    property: { bg: 'bg-purple-50', text: 'text-purple-600' },
    dataProperty: { bg: 'bg-orange-50', text: 'text-orange-600' },
    ontology: { bg: 'bg-gray-50', text: 'text-gray-600' },
  };

  const tc = typeColors[node.type] || typeColors.class;

  return (
    <div className="h-full overflow-y-auto bg-white border-l border-[#E2E5E9]">
      <div className="p-4 border-b border-[#E2E5E9] flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <span className={`text-[9px] font-bold uppercase tracking-wider ${tc.text} ${tc.bg} px-1.5 py-0.5 rounded`}>
            {node.type}
          </span>
          <h3 className="text-sm font-semibold text-[#1A1D21] mt-1 break-words">{node.label}</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-[#F8F9FA] text-[#8D95A0] flex-shrink-0 ml-2">
          <X size={14} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {node.comment && (
          <div>
            <span className="text-xs font-medium text-[#8D95A0] block mb-1">Description</span>
            <p className="text-sm text-[#5F6B7A]">{node.comment}</p>
          </div>
        )}

        <DetailRow label="URI" value={shortenUri(node.uri)} />
        <DetailRow label="Full URI" value={node.uri} mono />

        {/* Parent classes */}
        {subClassEdges.length > 0 && (
          <div>
            <span className="text-xs font-medium text-[#8D95A0] block mb-1">Parent Class</span>
            {subClassEdges.map((e) => {
              const parentNode = allNodes.find((n) => n.uri === e.target);
              return (
                <button
                  key={e.id}
                  onClick={() => onNavigate?.(e.target)}
                  className="block text-sm text-[#2563EB] hover:underline"
                >
                  {parentNode?.label || shortenUri(e.target)}
                </button>
              );
            })}
          </div>
        )}

        {/* Children */}
        {childEdges.length > 0 && (
          <div>
            <span className="text-xs font-medium text-[#8D95A0] block mb-1">
              Subclasses ({childEdges.length})
            </span>
            <div className="space-y-0.5">
              {childEdges.map((e) => {
                const childNode = allNodes.find((n) => n.uri === e.source);
                return (
                  <button
                    key={e.id}
                    onClick={() => onNavigate?.(e.source)}
                    className="block text-sm text-[#2563EB] hover:underline"
                  >
                    {childNode?.label || shortenUri(e.source)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Outgoing relationships */}
        {outgoing.length > 0 && (
          <div>
            <span className="text-xs font-medium text-[#8D95A0] block mb-1">
              Outgoing Relations ({outgoing.length})
            </span>
            <div className="space-y-1">
              {outgoing.map((e) => {
                const targetNode = allNodes.find((n) => n.uri === e.target);
                return (
                  <div key={e.id} className="flex items-center gap-1.5 text-sm">
                    <span className="text-[#8D95A0]">&rarr;</span>
                    <span className="text-purple-600 font-medium text-xs">{e.label}</span>
                    <button
                      onClick={() => onNavigate?.(e.target)}
                      className="text-[#2563EB] hover:underline truncate"
                    >
                      {targetNode?.label || shortenUri(e.target)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Incoming relationships */}
        {incoming.length > 0 && (
          <div>
            <span className="text-xs font-medium text-[#8D95A0] block mb-1">
              Incoming Relations ({incoming.length})
            </span>
            <div className="space-y-1">
              {incoming.map((e) => {
                const sourceNode = allNodes.find((n) => n.uri === e.source);
                return (
                  <div key={e.id} className="flex items-center gap-1.5 text-sm">
                    <span className="text-[#8D95A0]">&larr;</span>
                    <span className="text-purple-600 font-medium text-xs">{e.label}</span>
                    <button
                      onClick={() => onNavigate?.(e.source)}
                      className="text-[#2563EB] hover:underline truncate"
                    >
                      {sourceNode?.label || shortenUri(e.source)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Delete */}
        {onDeleteNode && (
          <button
            onClick={() => {
              if (confirm(`Remove "${node.label}" and all its relationships?`)) {
                onDeleteNode(node.uri);
              }
            }}
            className="w-full mt-2 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Remove Node
          </button>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs font-medium text-[#8D95A0] block mb-0.5">{label}</span>
      <span className={`text-sm text-[#1A1D21] break-all ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}
