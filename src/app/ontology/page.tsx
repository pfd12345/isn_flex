'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FlaskConical, Share2 } from 'lucide-react';
import OntologyToolbar from '@/components/ontology/OntologyToolbar';
import NodeDetailPanel from '@/components/ontology/NodeDetailPanel';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { SAMPLE_ONTOLOGY_RDF } from '@/lib/rdf/sample-ontology';
import {
  parseRDFXML,
  ontologyToCytoscape,
  serializeToRDFXML,
  addClass,
  removeNode,
  addEdge,
  removeEdge as removeEdgeFromStore,
  uriToLabel,
  type ParsedOntology,
  type RDFNode,
  type RDFEdge,
} from '@/lib/rdf/parser';
import type { OntologyGraphRef } from '@/components/ontology/OntologyGraph';
import type { ElementDefinition } from 'cytoscape';

const OntologyGraph = dynamic(
  () => import('@/components/ontology/OntologyGraph'),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center text-[#8D95A0]">Loading graph...</div> }
);

const BASE_URI = 'http://isn-ontology.org/pharma';

export default function OntologyPage() {
  const router = useRouter();
  const graphRef = useRef<OntologyGraphRef>(null);

  const [ontology, setOntology] = useState<ParsedOntology | null>(null);
  const [elements, setElements] = useState<ElementDefinition[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [showAddNode, setShowAddNode] = useState(false);
  const [showAddEdge, setShowAddEdge] = useState(false);

  // Load sample ontology on mount
  useEffect(() => {
    loadRDF(SAMPLE_ONTOLOGY_RDF);
  }, []);

  const loadRDF = useCallback((rdfXml: string) => {
    try {
      const parsed = parseRDFXML(rdfXml, BASE_URI);
      setOntology(parsed);
      setElements(ontologyToCytoscape(parsed));
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setError(null);
    } catch (err) {
      setError(`Failed to parse RDF: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  const refreshFromStore = useCallback(() => {
    if (!ontology) return;
    // Re-parse from store by serializing and re-parsing
    serializeToRDFXML(ontology.store, BASE_URI).then((rdfXml) => {
      loadRDF(rdfXml);
    });
  }, [ontology, loadRDF]);

  // Selected node/edge data
  const selectedNode: RDFNode | null = selectedNodeId
    ? ontology?.nodes.find((n) => n.uri === selectedNodeId) || null
    : null;

  const selectedEdge: RDFEdge | null = selectedEdgeId
    ? ontology?.edges.find((e) => e.id === selectedEdgeId) || null
    : null;

  // Handlers
  const handleUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) loadRDF(text);
    };
    reader.readAsText(file);
  }, [loadRDF]);

  const handleDownload = useCallback(async () => {
    if (!ontology) return;
    try {
      const rdfXml = await serializeToRDFXML(ontology.store, BASE_URI);
      const blob = new Blob([rdfXml], { type: 'application/rdf+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ontology.rdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [ontology]);

  const handleDeleteNode = useCallback((uri: string) => {
    if (!ontology) return;
    removeNode(ontology.store, uri);
    refreshFromStore();
  }, [ontology, refreshFromStore]);

  const handleDeleteEdge = useCallback((uri: string) => {
    if (!ontology) return;
    removeEdgeFromStore(ontology.store, uri);
    refreshFromStore();
  }, [ontology, refreshFromStore]);

  const handleNavigate = useCallback((uri: string) => {
    setSelectedNodeId(uri);
    setSelectedEdgeId(null);
    graphRef.current?.focusNode(uri);
  }, []);

  const handleSearch = useCallback((uri: string) => {
    setSelectedNodeId(uri);
    setSelectedEdgeId(null);
    graphRef.current?.focusNode(uri);
  }, []);

  const showDetail = selectedNode || selectedEdge;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-[#E2E5E9] px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.push('/')}
            className="p-1.5 rounded-lg hover:bg-[#F8F9FA] transition-colors text-[#5F6B7A] flex-shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
            <Share2 size={12} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-[#1A1D21]">Ontology Explorer</h1>
            <p className="text-xs text-[#8D95A0]">
              {ontology ? `${ontology.nodes.length} nodes, ${ontology.edges.length} edges` : 'Loading...'}
            </p>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex-shrink-0 bg-white border-b border-[#E2E5E9] px-3 sm:px-4 py-2">
        <OntologyToolbar
          nodes={ontology?.nodes || []}
          onUpload={handleUpload}
          onDownload={handleDownload}
          onAddNode={() => setShowAddNode(true)}
          onAddEdge={() => setShowAddEdge(true)}
          onSearch={handleSearch}
          onFit={() => graphRef.current?.fit()}
          onZoomIn={() => graphRef.current?.zoomIn()}
          onZoomOut={() => graphRef.current?.zoomOut()}
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-red-600">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xs">
            dismiss
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Graph area */}
        <div className="flex-1 relative">
          {elements.length > 0 && (
            <OntologyGraph
              ref={graphRef}
              elements={elements}
              onNodeSelect={setSelectedNodeId}
              onEdgeSelect={setSelectedEdgeId}
            />
          )}
        </div>

        {/* Detail panel */}
        {showDetail && (
          <aside className="flex-shrink-0 w-72 sm:w-80">
            <NodeDetailPanel
              node={selectedNode}
              edge={selectedEdge}
              allNodes={ontology?.nodes || []}
              allEdges={ontology?.edges || []}
              onClose={() => {
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
              }}
              onDeleteNode={handleDeleteNode}
              onDeleteEdge={handleDeleteEdge}
              onNavigate={handleNavigate}
            />
          </aside>
        )}
      </div>

      {/* Add Node Dialog */}
      {ontology && (
        <AddNodeDialog
          open={showAddNode}
          onClose={() => setShowAddNode(false)}
          parentOptions={ontology.nodes.filter((n) => n.type === 'class')}
          onAdd={(label, comment, parentUri) => {
            const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
            const uri = `${BASE_URI}#${slug}`;
            addClass(ontology.store, uri, label, comment || undefined, parentUri || undefined);
            refreshFromStore();
            setShowAddNode(false);
          }}
        />
      )}

      {/* Add Edge Dialog */}
      {ontology && (
        <AddEdgeDialog
          open={showAddEdge}
          onClose={() => setShowAddEdge(false)}
          nodes={ontology.nodes.filter((n) => n.type === 'class')}
          onAdd={(label, sourceUri, targetUri) => {
            const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
            const uri = `${BASE_URI}#${slug}`;
            addEdge(ontology.store, uri, label, sourceUri, targetUri);
            refreshFromStore();
            setShowAddEdge(false);
          }}
        />
      )}
    </div>
  );
}

// ── Add Node Dialog ──────────────────────────────────────────

function AddNodeDialog({
  open,
  onClose,
  parentOptions,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  parentOptions: RDFNode[];
  onAdd: (label: string, comment: string, parentUri: string) => void;
}) {
  const [label, setLabel] = useState('');
  const [comment, setComment] = useState('');
  const [parentUri, setParentUri] = useState('');

  const handleSubmit = () => {
    if (!label.trim()) return;
    onAdd(label.trim(), comment.trim(), parentUri);
    setLabel('');
    setComment('');
    setParentUri('');
  };

  return (
    <Dialog open={open} onClose={onClose} title="Add Class Node">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-[#1A1D21] mb-1">Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Dissolution Test"
            className="w-full rounded-lg border border-[#E2E5E9] bg-[#F8F9FA] px-3 py-2 text-sm text-[#1A1D21] placeholder-[#8D95A0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1A1D21] mb-1">Description (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Brief description..."
            rows={2}
            className="w-full rounded-lg border border-[#E2E5E9] bg-[#F8F9FA] px-3 py-2 text-sm text-[#1A1D21] placeholder-[#8D95A0] focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1A1D21] mb-1">Parent Class (optional)</label>
          <select
            value={parentUri}
            onChange={(e) => setParentUri(e.target.value)}
            className="w-full rounded-lg border border-[#E2E5E9] bg-[#F8F9FA] px-3 py-2 text-sm text-[#1A1D21] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="">None (top-level)</option>
            {parentOptions.map((n) => (
              <option key={n.uri} value={n.uri}>{n.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!label.trim()}>Add Node</Button>
        </div>
      </div>
    </Dialog>
  );
}

// ── Add Edge Dialog ──────────────────────────────────────────

function AddEdgeDialog({
  open,
  onClose,
  nodes,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  nodes: RDFNode[];
  onAdd: (label: string, sourceUri: string, targetUri: string) => void;
}) {
  const [label, setLabel] = useState('');
  const [sourceUri, setSourceUri] = useState('');
  const [targetUri, setTargetUri] = useState('');

  const handleSubmit = () => {
    if (!label.trim() || !sourceUri || !targetUri) return;
    onAdd(label.trim(), sourceUri, targetUri);
    setLabel('');
    setSourceUri('');
    setTargetUri('');
  };

  return (
    <Dialog open={open} onClose={onClose} title="Add Relationship (Edge)">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-[#1A1D21] mb-1">Relationship Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., requires"
            className="w-full rounded-lg border border-[#E2E5E9] bg-[#F8F9FA] px-3 py-2 text-sm text-[#1A1D21] placeholder-[#8D95A0] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1A1D21] mb-1">Source (Domain)</label>
          <select
            value={sourceUri}
            onChange={(e) => setSourceUri(e.target.value)}
            className="w-full rounded-lg border border-[#E2E5E9] bg-[#F8F9FA] px-3 py-2 text-sm text-[#1A1D21] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="">Select source class...</option>
            {nodes.map((n) => (
              <option key={n.uri} value={n.uri}>{n.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1A1D21] mb-1">Target (Range)</label>
          <select
            value={targetUri}
            onChange={(e) => setTargetUri(e.target.value)}
            className="w-full rounded-lg border border-[#E2E5E9] bg-[#F8F9FA] px-3 py-2 text-sm text-[#1A1D21] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="">Select target class...</option>
            {nodes.map((n) => (
              <option key={n.uri} value={n.uri}>{n.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!label.trim() || !sourceUri || !targetUri}>
            Add Edge
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
