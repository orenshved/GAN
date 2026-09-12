export type NetworkGraphRole = "root" | "major" | "endpoint";

export type NetworkGraphNode = {
  id: string;
  role: NetworkGraphRole;
  parentId?: string | undefined;
};

export type NetworkGraphEdge = {
  id: string;
  source: string;
  target: string;
};

export type NetworkGraphModel = {
  rootId: string;
  nodes: NetworkGraphNode[];
  edges: NetworkGraphEdge[];
};

function adjacencyFor(model: NetworkGraphModel) {
  const adjacency = new Map<string, Set<string>>();
  const connect = (from: string, to: string) => {
    const neighbors = adjacency.get(from) ?? new Set<string>();
    neighbors.add(to);
    adjacency.set(from, neighbors);
  };
  for (const edge of model.edges) {
    connect(edge.source, edge.target);
    connect(edge.target, edge.source);
  }
  return adjacency;
}

export function expandOneRelationshipLevel(
  model: NetworkGraphModel,
  visibleNodeIds: ReadonlySet<string>,
  nodeId: string,
) {
  const next = new Set(visibleNodeIds);
  next.add(nodeId);
  adjacencyFor(model)
    .get(nodeId)
    ?.forEach((neighbor) => next.add(neighbor));
  return next;
}

export function focusedNeighborhoodIds(
  model: NetworkGraphModel,
  nodeId: string,
) {
  const adjacency = adjacencyFor(model);
  const visible = new Set<string>([nodeId, model.rootId]);
  adjacency.get(nodeId)?.forEach((neighbor) => visible.add(neighbor));
  if (nodeId === model.rootId) return visible;

  const queue = [model.rootId];
  const visited = new Set(queue);
  const parent = new Map<string, string>();
  while (queue.length) {
    const current = queue.shift();
    if (!current || current === nodeId) break;
    adjacency.get(current)?.forEach((neighbor) => {
      if (visited.has(neighbor)) return;
      visited.add(neighbor);
      parent.set(neighbor, current);
      queue.push(neighbor);
    });
  }

  if (!visited.has(nodeId)) return visible;
  let current = nodeId;
  while (current !== model.rootId) {
    visible.add(current);
    const previous = parent.get(current);
    if (!previous) break;
    current = previous;
  }
  visible.add(model.rootId);
  return visible;
}

export function collapseDirectedBranch(
  model: NetworkGraphModel,
  visibleNodeIds: ReadonlySet<string>,
  nodeId: string,
) {
  const directed = new Map<string, Set<string>>();
  for (const edge of model.edges) {
    const children = directed.get(edge.source) ?? new Set<string>();
    children.add(edge.target);
    directed.set(edge.source, children);
  }

  const hidden = new Set<string>();
  const queue = [...(directed.get(nodeId) ?? [])];
  while (queue.length) {
    const current = queue.shift();
    if (!current || current === nodeId || hidden.has(current)) continue;
    hidden.add(current);
    directed.get(current)?.forEach((child) => queue.push(child));
  }

  const visible = new Set(
    [...visibleNodeIds].filter((candidate) => !hidden.has(candidate)),
  );
  visible.add(nodeId);
  return visible;
}

export function graphView(
  model: NetworkGraphModel,
  visibleNodeIds: ReadonlySet<string>,
) {
  const nodes = model.nodes.filter((node) => visibleNodeIds.has(node.id));
  const retained = new Set(nodes.map((node) => node.id));
  const edges = model.edges.filter(
    (edge) => retained.has(edge.source) && retained.has(edge.target),
  );
  return { nodes, edges };
}

export function stableGraphHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
