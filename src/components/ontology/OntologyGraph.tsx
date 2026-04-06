'use client';

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { Core, ElementDefinition } from 'cytoscape';

export interface OntologyGraphRef {
  fit: () => void;
  center: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  focusNode: (id: string) => void;
}

interface OntologyGraphProps {
  elements: ElementDefinition[];
  onNodeSelect?: (nodeId: string | null) => void;
  onEdgeSelect?: (edgeId: string | null) => void;
}

const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  class: { bg: '#EFF6FF', border: '#2563EB', text: '#1e40af' },
  instance: { bg: '#F0FDF4', border: '#16A34A', text: '#15803d' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stylesheet: any[] = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '11px',
      'font-family': 'Inter, ui-sans-serif, system-ui, sans-serif',
      'background-color': '#EFF6FF',
      'border-width': 2,
      'border-color': '#2563EB',
      color: '#1e40af',
      width: 'label',
      height: 36,
      shape: 'round-rectangle',
      'padding-left': '12px' as unknown as undefined,
      'padding-right': '12px' as unknown as undefined,
      'text-wrap': 'wrap',
      'text-max-width': '140px',
    } as Record<string, unknown>,
  },
  {
    selector: 'node[type="instance"]',
    style: {
      'background-color': '#F0FDF4',
      'border-color': '#16A34A',
      color: '#15803d',
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': 3,
      'border-color': '#F59E0B',
      'background-color': '#FFFBEB',
      color: '#92400e',
    },
  },
  {
    selector: ':parent',
    style: {
      'background-color': '#F8FAFC',
      'border-color': '#CBD5E1',
      'border-width': 1,
      'border-style': 'dashed' as unknown as undefined,
      'text-valign': 'top',
      'text-halign': 'center',
      'font-size': '10px',
      color: '#64748B',
      'padding-top': '24px' as unknown as undefined,
      'compound-sizing-wrt-labels': 'include',
    } as Record<string, unknown>,
  },
  {
    selector: 'edge',
    style: {
      width: 1.5,
      'line-color': '#94A3B8',
      'target-arrow-color': '#94A3B8',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.8,
      'curve-style': 'bezier',
      label: 'data(label)',
      'font-size': '9px',
      'font-family': 'Inter, ui-sans-serif, system-ui, sans-serif',
      color: '#64748B',
      'text-rotation': 'autorotate',
      'text-margin-y': -8,
      'text-background-color': '#FFFFFF',
      'text-background-opacity': 0.85,
      'text-background-padding': '2px' as unknown as undefined,
    } as Record<string, unknown>,
  },
  {
    selector: 'edge:selected',
    style: {
      width: 2.5,
      'line-color': '#F59E0B',
      'target-arrow-color': '#F59E0B',
      color: '#92400e',
    },
  },
];

const OntologyGraph = forwardRef<OntologyGraphRef, OntologyGraphProps>(
  ({ elements, onNodeSelect, onEdgeSelect }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<Core | null>(null);

    useImperativeHandle(ref, () => ({
      fit: () => cyRef.current?.fit(undefined, 40),
      center: () => cyRef.current?.center(),
      zoomIn: () => {
        const cy = cyRef.current;
        if (cy) cy.zoom({ level: cy.zoom() * 1.3, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
      },
      zoomOut: () => {
        const cy = cyRef.current;
        if (cy) cy.zoom({ level: cy.zoom() / 1.3, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
      },
      focusNode: (id: string) => {
        const cy = cyRef.current;
        if (!cy) return;
        const node = cy.getElementById(id);
        if (node.length) {
          cy.animate({ center: { eles: node }, zoom: 1.5 }, { duration: 400 });
          cy.elements().unselect();
          node.select();
        }
      },
    }));

    const initCytoscape = useCallback(async () => {
      if (!containerRef.current) return;

      const cytoscape = (await import('cytoscape')).default;
      const fcose = (await import('cytoscape-fcose')).default;

      cytoscape.use(fcose);

      if (cyRef.current) {
        cyRef.current.destroy();
      }

      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: stylesheet,
        layout: {
          name: 'fcose',
          animate: true,
          animationDuration: 600,
          quality: 'proof',
          nodeDimensionsIncludeLabels: true,
          nodeRepulsion: () => 8000,
          idealEdgeLength: () => 120,
          edgeElasticity: () => 0.1,
          gravity: 0.3,
          gravityRange: 2.0,
          padding: 40,
        } as unknown as cytoscape.LayoutOptions,
        minZoom: 0.1,
        maxZoom: 5,
        wheelSensitivity: 0.3,
      });

      cy.on('tap', 'node', (e) => {
        const nodeId = e.target.id();
        onNodeSelect?.(nodeId);
        onEdgeSelect?.(null);
      });

      cy.on('tap', 'edge', (e) => {
        const edgeId = e.target.id();
        onEdgeSelect?.(edgeId);
        onNodeSelect?.(null);
      });

      cy.on('tap', (e) => {
        if (e.target === cy) {
          onNodeSelect?.(null);
          onEdgeSelect?.(null);
        }
      });

      cyRef.current = cy;
    }, [elements, onNodeSelect, onEdgeSelect]);

    useEffect(() => {
      initCytoscape();
      return () => {
        cyRef.current?.destroy();
        cyRef.current = null;
      };
    }, [initCytoscape]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full bg-[#FAFBFC]"
        style={{ minHeight: 400 }}
      />
    );
  }
);

OntologyGraph.displayName = 'OntologyGraph';
export default OntologyGraph;
