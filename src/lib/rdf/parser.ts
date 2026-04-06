import { graph, parse, serialize, NamedNode, Literal, Statement, IndexedFormula } from 'rdflib';
import type { ElementDefinition } from 'cytoscape';

// Well-known namespace prefixes
const NS: Record<string, string> = {
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf',
  'http://www.w3.org/2000/01/rdf-schema#': 'rdfs',
  'http://www.w3.org/2002/07/owl#': 'owl',
};

/** Extract a short label from a URI */
export function uriToLabel(uri: string): string {
  const hashIdx = uri.lastIndexOf('#');
  const slashIdx = uri.lastIndexOf('/');
  const idx = Math.max(hashIdx, slashIdx);
  return idx >= 0 ? uri.slice(idx + 1) : uri;
}

/** Extract namespace from URI */
function uriToNamespace(uri: string): string {
  const hashIdx = uri.lastIndexOf('#');
  const slashIdx = uri.lastIndexOf('/');
  const idx = Math.max(hashIdx, slashIdx);
  return idx >= 0 ? uri.slice(0, idx + 1) : '';
}

/** Shorten a URI using known prefixes */
export function shortenUri(uri: string): string {
  const ns = uriToNamespace(uri);
  const prefix = NS[ns];
  if (prefix) return `${prefix}:${uriToLabel(uri)}`;
  return uriToLabel(uri);
}

// RDF/OWL URIs we use for classification
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const RDFS_SUBCLASS = 'http://www.w3.org/2000/01/rdf-schema#subClassOf';
const RDFS_LABEL = 'http://www.w3.org/2000/01/rdf-schema#label';
const RDFS_COMMENT = 'http://www.w3.org/2000/01/rdf-schema#comment';
const RDFS_DOMAIN = 'http://www.w3.org/2000/01/rdf-schema#domain';
const RDFS_RANGE = 'http://www.w3.org/2000/01/rdf-schema#range';
const OWL_CLASS = 'http://www.w3.org/2002/07/owl#Class';
const OWL_OBJECT_PROPERTY = 'http://www.w3.org/2002/07/owl#ObjectProperty';
const OWL_DATATYPE_PROPERTY = 'http://www.w3.org/2002/07/owl#DatatypeProperty';
const OWL_ONTOLOGY = 'http://www.w3.org/2002/07/owl#Ontology';

export type NodeType = 'class' | 'property' | 'dataProperty' | 'ontology' | 'instance';

export interface RDFNode {
  uri: string;
  label: string;
  comment?: string;
  type: NodeType;
  properties: Record<string, string[]>; // predicate URI → object values
}

export interface RDFEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  uri: string;
}

export interface ParsedOntology {
  nodes: RDFNode[];
  edges: RDFEdge[];
  store: IndexedFormula;
  namespaces: Record<string, string>;
}

/** Parse RDF/XML string into structured ontology data */
export function parseRDFXML(rdfXml: string, baseUri?: string): ParsedOntology {
  const store = graph();
  const base = baseUri || 'http://isn-ontology.org/pharma';

  parse(rdfXml, store, base, 'application/rdf+xml');

  const nodes = new Map<string, RDFNode>();
  const edges: RDFEdge[] = [];

  // Collect all statements
  const stmts: Statement[] = store.statements;

  // Build namespace map from store
  const namespaces: Record<string, string> = {};
  // Extract namespaces from all URIs
  for (const stmt of stmts) {
    if (stmt.subject.termType === 'NamedNode') {
      const ns = uriToNamespace(stmt.subject.value);
      if (ns && !NS[ns]) {
        const label = uriToLabel(ns.slice(0, -1));
        if (label && !namespaces[ns]) namespaces[ns] = label;
      }
    }
  }

  // First pass: identify all classes, properties, and individuals
  for (const stmt of stmts) {
    if (stmt.predicate.value === RDF_TYPE && stmt.subject.termType === 'NamedNode') {
      const uri = stmt.subject.value;
      const typeUri = stmt.object.value;

      let nodeType: NodeType = 'instance';
      if (typeUri === OWL_CLASS) nodeType = 'class';
      else if (typeUri === OWL_OBJECT_PROPERTY) nodeType = 'property';
      else if (typeUri === OWL_DATATYPE_PROPERTY) nodeType = 'dataProperty';
      else if (typeUri === OWL_ONTOLOGY) nodeType = 'ontology';

      if (!nodes.has(uri)) {
        nodes.set(uri, {
          uri,
          label: uriToLabel(uri),
          type: nodeType,
          properties: {},
        });
      } else {
        // Upgrade type if more specific
        const existing = nodes.get(uri)!;
        if (existing.type === 'instance' && nodeType !== 'instance') {
          existing.type = nodeType;
        }
      }
    }
  }

  // Second pass: collect labels, comments, and other literal properties
  for (const stmt of stmts) {
    if (stmt.subject.termType !== 'NamedNode') continue;
    const uri = stmt.subject.value;
    const node = nodes.get(uri);
    if (!node) continue;

    if (stmt.predicate.value === RDFS_LABEL && stmt.object.termType === 'Literal') {
      node.label = stmt.object.value;
    } else if (stmt.predicate.value === RDFS_COMMENT && stmt.object.termType === 'Literal') {
      node.comment = stmt.object.value;
    }

    // Collect all properties
    const predLabel = shortenUri(stmt.predicate.value);
    const objValue = stmt.object.termType === 'Literal'
      ? stmt.object.value
      : shortenUri(stmt.object.value);

    if (!node.properties[predLabel]) node.properties[predLabel] = [];
    node.properties[predLabel].push(objValue);
  }

  // Third pass: build edges from subClassOf and object property domain/range
  let edgeId = 0;
  for (const stmt of stmts) {
    if (stmt.subject.termType !== 'NamedNode' || stmt.object.termType !== 'NamedNode') continue;

    const subjectUri = stmt.subject.value;
    const objectUri = stmt.object.value;

    // Skip rdf:type edges to OWL meta-classes
    if (stmt.predicate.value === RDF_TYPE) continue;

    // subClassOf edges
    if (stmt.predicate.value === RDFS_SUBCLASS) {
      // Ensure both endpoints exist as nodes
      ensureNode(nodes, subjectUri, 'class');
      ensureNode(nodes, objectUri, 'class');

      edges.push({
        id: `e${edgeId++}`,
        source: subjectUri,
        target: objectUri,
        label: 'subClassOf',
        uri: RDFS_SUBCLASS,
      });
    }
  }

  // Build edges from object properties (domain → range)
  for (const stmt of stmts) {
    if (stmt.predicate.value !== RDF_TYPE) continue;
    if (stmt.object.value !== OWL_OBJECT_PROPERTY) continue;
    if (stmt.subject.termType !== 'NamedNode') continue;

    const propUri = stmt.subject.value;
    const propNode = nodes.get(propUri);

    // Find domain and range
    const domainStmts = stmts.filter(
      (s) => s.subject.value === propUri && s.predicate.value === RDFS_DOMAIN
    );
    const rangeStmts = stmts.filter(
      (s) => s.subject.value === propUri && s.predicate.value === RDFS_RANGE
    );

    for (const dStmt of domainStmts) {
      for (const rStmt of rangeStmts) {
        if (dStmt.object.termType === 'NamedNode' && rStmt.object.termType === 'NamedNode') {
          const sourceUri = dStmt.object.value;
          const targetUri = rStmt.object.value;

          ensureNode(nodes, sourceUri, 'class');
          ensureNode(nodes, targetUri, 'class');

          edges.push({
            id: `e${edgeId++}`,
            source: sourceUri,
            target: targetUri,
            label: propNode?.label || uriToLabel(propUri),
            uri: propUri,
          });
        }
      }
    }
  }

  // Filter out ontology-level and property nodes from the visual graph
  // (they're shown as edges or in the detail panel)
  const visibleNodes = Array.from(nodes.values()).filter(
    (n) => n.type === 'class' || n.type === 'instance'
  );

  return { nodes: visibleNodes, edges, store, namespaces };
}

function ensureNode(nodes: Map<string, RDFNode>, uri: string, type: NodeType) {
  if (!nodes.has(uri)) {
    nodes.set(uri, {
      uri,
      label: uriToLabel(uri),
      type,
      properties: {},
    });
  }
}

/** Convert parsed ontology to Cytoscape elements */
export function ontologyToCytoscape(parsed: ParsedOntology): ElementDefinition[] {
  const elements: ElementDefinition[] = [];

  // Determine parent for each node (from subClassOf edges)
  const parentMap = new Map<string, string>();
  for (const edge of parsed.edges) {
    if (edge.label === 'subClassOf') {
      parentMap.set(edge.source, edge.target);
    }
  }

  for (const node of parsed.nodes) {
    elements.push({
      data: {
        id: node.uri,
        label: node.label,
        type: node.type,
        comment: node.comment || '',
        parent: parentMap.get(node.uri) || undefined,
      },
    });
  }

  for (const edge of parsed.edges) {
    // Skip subClassOf since we show that as parent-child hierarchy
    if (edge.label === 'subClassOf') continue;

    elements.push({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
      },
    });
  }

  return elements;
}

/** Serialize an rdflib store back to RDF/XML string */
export function serializeToRDFXML(store: IndexedFormula, baseUri?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const base = baseUri || 'http://isn-ontology.org/pharma';
    serialize(null, store, base, 'application/rdf+xml', (err: Error | null | undefined, result?: string) => {
      if (err) reject(err);
      else resolve(result || '');
    });
  });
}

/** Add a class node to the store */
export function addClass(
  store: IndexedFormula,
  uri: string,
  label: string,
  comment?: string,
  parentUri?: string
): void {
  const node = new NamedNode(uri);
  store.add(node, new NamedNode(RDF_TYPE), new NamedNode(OWL_CLASS));
  store.add(node, new NamedNode(RDFS_LABEL), new Literal(label));
  if (comment) {
    store.add(node, new NamedNode(RDFS_COMMENT), new Literal(comment));
  }
  if (parentUri) {
    store.add(node, new NamedNode(RDFS_SUBCLASS), new NamedNode(parentUri));
  }
}

/** Remove all statements involving a URI (as subject or object) */
export function removeNode(store: IndexedFormula, uri: string): void {
  const node = new NamedNode(uri);
  const asSubject = store.statementsMatching(node, undefined, undefined);
  const asObject = store.statementsMatching(undefined, undefined, node);
  for (const st of [...asSubject, ...asObject]) {
    store.remove(st);
  }
}

/** Add an object property edge (domain→range) to the store */
export function addEdge(
  store: IndexedFormula,
  propertyUri: string,
  label: string,
  domainUri: string,
  rangeUri: string
): void {
  const prop = new NamedNode(propertyUri);
  store.add(prop, new NamedNode(RDF_TYPE), new NamedNode(OWL_OBJECT_PROPERTY));
  store.add(prop, new NamedNode(RDFS_LABEL), new Literal(label));
  store.add(prop, new NamedNode(RDFS_DOMAIN), new NamedNode(domainUri));
  store.add(prop, new NamedNode(RDFS_RANGE), new NamedNode(rangeUri));
}

/** Remove an object property from the store */
export function removeEdge(store: IndexedFormula, propertyUri: string): void {
  removeNode(store, propertyUri);
}
