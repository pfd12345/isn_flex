'use client';

import { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Search,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize,
  X,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import type { RDFNode } from '@/lib/rdf/parser';

interface OntologyToolbarProps {
  nodes: RDFNode[];
  onUpload: (file: File) => void;
  onDownload: () => void;
  onAddNode: () => void;
  onAddEdge: () => void;
  onSearch: (nodeUri: string) => void;
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function OntologyToolbar({
  nodes,
  onUpload,
  onDownload,
  onAddNode,
  onAddEdge,
  onSearch,
  onFit,
  onZoomIn,
  onZoomOut,
}: OntologyToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNodes = searchQuery.trim()
    ? nodes.filter(
        (n) =>
          n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.uri.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
      {/* Search */}
      <div className="relative">
        {searchOpen ? (
          <div className="flex items-center gap-1">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8D95A0]" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes..."
                className="w-48 sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E2E5E9] bg-[#F8F9FA] text-[#1A1D21] placeholder-[#8D95A0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              {/* Search results dropdown */}
              {searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E2E5E9] rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                  {filteredNodes.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-[#8D95A0]">No results</div>
                  ) : (
                    filteredNodes.slice(0, 20).map((node) => (
                      <button
                        key={node.uri}
                        onClick={() => {
                          onSearch(node.uri);
                          setSearchQuery('');
                          setSearchOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-[#F8F9FA] border-b border-[#F0F4F8] last:border-0"
                      >
                        <span className="font-medium text-[#1A1D21]">{node.label}</span>
                        <span className="block text-[#8D95A0] text-[10px] truncate">{node.uri}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
              className="p-1.5 rounded-lg text-[#8D95A0] hover:bg-[#F8F9FA]"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setSearchOpen(true)}>
            <Search size={14} /> <span className="hidden sm:inline">Search</span>
          </Button>
        )}
      </div>

      <div className="w-px h-5 bg-[#E2E5E9] hidden sm:block" />

      {/* Zoom controls */}
      <div className="flex items-center gap-0.5">
        <button onClick={onZoomIn} className="p-1.5 rounded-lg text-[#5F6B7A] hover:bg-[#F8F9FA]" title="Zoom in">
          <ZoomIn size={14} />
        </button>
        <button onClick={onZoomOut} className="p-1.5 rounded-lg text-[#5F6B7A] hover:bg-[#F8F9FA]" title="Zoom out">
          <ZoomOut size={14} />
        </button>
        <button onClick={onFit} className="p-1.5 rounded-lg text-[#5F6B7A] hover:bg-[#F8F9FA]" title="Fit to view">
          <Maximize size={14} />
        </button>
      </div>

      <div className="w-px h-5 bg-[#E2E5E9] hidden sm:block" />

      {/* Edit controls */}
      <Button variant="ghost" size="sm" onClick={onAddNode}>
        <Plus size={14} /> <span className="hidden sm:inline">Add Node</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={onAddEdge}>
        <Plus size={14} /> <span className="hidden sm:inline">Add Edge</span>
      </Button>

      <div className="w-px h-5 bg-[#E2E5E9] hidden sm:block" />

      {/* Upload / Download */}
      <Button variant="ghost" size="sm" onClick={onDownload}>
        <Download size={14} /> <span className="hidden sm:inline">Download</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
        <Upload size={14} /> <span className="hidden sm:inline">Upload</span>
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".rdf,.xml,.owl"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
