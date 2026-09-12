"use client";

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3";
import {
  applyNodeChanges,
  type Edge,
  type Node,
  type OnNodeDrag,
  type OnNodesChange,
} from "@xyflow/react";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { stableGraphHash, type NetworkGraphRole } from "./network-graph";

export type ForceGraphNodeData = Record<string, unknown> & {
  forceRole: NetworkGraphRole;
  parentId?: string | undefined;
};

type LayoutNode = SimulationNodeDatum & {
  id: string;
  role: NetworkGraphRole;
  parentId?: string | undefined;
  connectionCount: number;
  anchorX: number;
  anchorY: number;
};

type LayoutLink = SimulationLinkDatum<LayoutNode> & {
  id: string;
};

type DragSample = {
  id: string;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  velocityX: number;
  velocityY: number;
  moved: boolean;
};

const FIRST_LAYOUT_TICKS = 420;
const UPDATE_LAYOUT_TICKS = 300;
const RELEASE_EASING_MS = 2_200;

function endpointId(endpoint: LayoutLink["source"]) {
  return typeof endpoint === "object" ? endpoint.id : String(endpoint);
}

function stableAngle(id: string) {
  return ((stableGraphHash(id) % 3_600) / 3_600) * Math.PI * 2;
}

function majorAnchor(
  id: string,
  nodeById: ReadonlyMap<string, Node<ForceGraphNodeData>>,
) {
  const majorIds = [...nodeById.values()]
    .filter((node) => node.data.forceRole === "major")
    .map((node) => node.id)
    .sort();
  const index = Math.max(0, majorIds.indexOf(id));
  const progress = majorIds.length <= 1 ? 0.5 : index / (majorIds.length - 1);
  const angle = Math.PI * (0.14 + progress * 0.72);
  return {
    x: Math.cos(angle) * 520,
    y: 50 + Math.sin(angle) * 390,
  };
}

function nodeAnchor(
  node: Node<ForceGraphNodeData>,
  nodeById: ReadonlyMap<string, Node<ForceGraphNodeData>>,
) {
  if (node.data.forceRole === "root") return { x: 0, y: -520 };
  if (node.data.forceRole === "major") return majorAnchor(node.id, nodeById);

  const parent = node.data.parentId ? nodeById.get(node.data.parentId) : null;
  const parentAnchor = parent
    ? majorAnchor(parent.id, nodeById)
    : { x: 0, y: 0 };
  const parentAngle = parent ? stableAngle(parent.id) : stableAngle(node.id);
  const spread = ((stableGraphHash(node.id) % 1_000) / 999 - 0.5) * 0.9;
  const angle = parentAngle + spread;
  return {
    x: parentAnchor.x + Math.cos(angle) * 190,
    y: parentAnchor.y + Math.sin(angle) * 145,
  };
}

function seededPosition(
  node: Node<ForceGraphNodeData>,
  anchor: { x: number; y: number },
) {
  if (node.data.forceRole === "root") return anchor;
  const hash = stableGraphHash(node.id);
  return {
    x: anchor.x + ((hash >>> 8) % 31) - 15,
    y: anchor.y + ((hash >>> 16) % 31) - 15,
  };
}

function collisionRadius(node: LayoutNode) {
  if (node.role === "root") return 74;
  if (node.role === "major") return 108;
  return 84;
}

function chargeStrength(node: LayoutNode) {
  if (node.role === "root") return -360;
  if (node.role === "major") return -82;
  return -42;
}

function clampVelocity(velocity: number, retention: number) {
  return Math.max(-7, Math.min(7, velocity * retention));
}

export function useForceGraphLayout(
  topologyNodes: Node<ForceGraphNodeData>[],
  topologyEdges: Edge[],
) {
  const [nodes, setNodes] = useState(topologyNodes);
  const topologyRef = useRef(topologyNodes);
  const layoutByIdRef = useRef(new Map<string, LayoutNode>());
  const simulationRef = useRef<Simulation<LayoutNode, LayoutLink> | null>(null);
  const publishFrameRef = useRef<number | null>(null);
  const settleFrameRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const dragRef = useRef<DragSample | null>(null);

  topologyRef.current = topologyNodes;

  const structureSignature = useMemo(
    () =>
      `${topologyNodes
        .map((node) => node.id)
        .sort()
        .join("|")}::${topologyEdges
        .map((edge) => edge.id)
        .sort()
        .join("|")}`,
    [topologyEdges, topologyNodes],
  );

  const publishPositions = useCallback(() => {
    publishFrameRef.current = null;
    const layoutById = layoutByIdRef.current;
    setNodes((current) => {
      const currentById = new Map(current.map((node) => [node.id, node]));
      return topologyRef.current.map((node) => {
        const layout = layoutById.get(node.id);
        const currentNode = currentById.get(node.id);
        return {
          ...currentNode,
          ...node,
          position: {
            x: layout?.x ?? node.position.x,
            y: layout?.y ?? node.position.y,
          },
        };
      });
    });
  }, []);

  const schedulePublish = useCallback(() => {
    if (publishFrameRef.current !== null) return;
    publishFrameRef.current = window.requestAnimationFrame(publishPositions);
  }, [publishPositions]);

  useLayoutEffect(() => {
    const previousById = layoutByIdRef.current;
    const nodeById = new Map(topologyNodes.map((node) => [node.id, node]));
    const connectionCount = new Map<string, number>();
    for (const edge of topologyEdges) {
      connectionCount.set(
        edge.source,
        (connectionCount.get(edge.source) ?? 0) + 1,
      );
      connectionCount.set(
        edge.target,
        (connectionCount.get(edge.target) ?? 0) + 1,
      );
    }

    const layoutNodes = topologyNodes.map((node) => {
      const previous = previousById.get(node.id);
      const anchor = nodeAnchor(node, nodeById);
      const seed = seededPosition(node, anchor);
      return {
        id: node.id,
        role: node.data.forceRole,
        parentId: node.data.parentId,
        connectionCount: connectionCount.get(node.id) ?? 0,
        anchorX: anchor.x,
        anchorY: anchor.y,
        x: previous?.x ?? seed.x,
        y: previous?.y ?? seed.y,
        vx: previous?.vx ?? 0,
        vy: previous?.vy ?? 0,
        fx: previous?.fx,
        fy: previous?.fy,
      } satisfies LayoutNode;
    });
    const layoutById = new Map(layoutNodes.map((node) => [node.id, node]));
    const layoutLinks = topologyEdges
      .filter(
        (edge) => layoutById.has(edge.source) && layoutById.has(edge.target),
      )
      .map(
        (edge) =>
          ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
          }) satisfies LayoutLink,
      );

    const temporaryPins = new Map<
      string,
      { fx: number | null | undefined; fy: number | null | undefined }
    >();
    if (previousById.size) {
      for (const node of layoutNodes) {
        if (!previousById.has(node.id)) continue;
        temporaryPins.set(node.id, { fx: node.fx, fy: node.fy });
        node.fx = node.x;
        node.fy = node.y;
      }
    }

    simulationRef.current?.stop();
    const simulation = forceSimulation<LayoutNode>(layoutNodes)
      .force(
        "link",
        forceLink<LayoutNode, LayoutLink>(layoutLinks)
          .id((node) => node.id)
          .distance((link) => {
            const source = layoutById.get(endpointId(link.source));
            const target = layoutById.get(endpointId(link.target));
            if (source?.role === "root" || target?.role === "root") return 420;
            if (source?.role === "endpoint" || target?.role === "endpoint")
              return 190;
            return 230;
          })
          .strength((link) => {
            const source = layoutById.get(endpointId(link.source));
            return source?.role === "root" ? 0.2 : 0.42;
          }),
      )
      .force("charge", forceManyBody<LayoutNode>().strength(chargeStrength))
      .force(
        "collision",
        forceCollide<LayoutNode>().radius((node) => collisionRadius(node) + 8),
      )
      .force(
        "x",
        forceX<LayoutNode>((node) => node.anchorX).strength((node) =>
          node.role === "root" ? 0.3 : node.connectionCount <= 1 ? 0.16 : 0.055,
        ),
      )
      .force(
        "y",
        forceY<LayoutNode>((node) => node.anchorY).strength((node) =>
          node.role === "root" ? 0.3 : node.connectionCount <= 1 ? 0.16 : 0.055,
        ),
      )
      .alphaMin(0.00008)
      .alphaDecay(0.026)
      .velocityDecay(0.24)
      .alpha(previousById.size ? 0.32 : 1)
      .on("tick", schedulePublish)
      .stop();

    const tickCount = previousById.size
      ? UPDATE_LAYOUT_TICKS
      : FIRST_LAYOUT_TICKS;
    for (let tick = 0; tick < tickCount; tick += 1) simulation.tick();
    for (const node of layoutNodes) {
      const priorPin = temporaryPins.get(node.id);
      if (!priorPin) continue;
      node.fx = priorPin.fx ?? undefined;
      node.fy = priorPin.fy ?? undefined;
    }

    layoutByIdRef.current = layoutById;
    simulationRef.current = simulation;
    publishPositions();

    return () => {
      simulation.stop();
    };
  }, [
    publishPositions,
    schedulePublish,
    structureSignature,
    topologyEdges,
    topologyNodes,
  ]);

  useLayoutEffect(
    () => () => {
      simulationRef.current?.stop();
      if (publishFrameRef.current !== null)
        window.cancelAnimationFrame(publishFrameRef.current);
      if (settleFrameRef.current !== null)
        window.cancelAnimationFrame(settleFrameRef.current);
      if (suppressClickTimerRef.current !== null)
        clearTimeout(suppressClickTimerRef.current);
    },
    [],
  );

  const onNodesChange = useCallback<OnNodesChange<Node<ForceGraphNodeData>>>(
    (changes) => setNodes((current) => applyNodeChanges(changes, current)),
    [],
  );

  const onNodeDragStart = useCallback<OnNodeDrag<Node<ForceGraphNodeData>>>(
    (event, node) => {
      const layout = layoutByIdRef.current.get(node.id);
      if (!layout) return;
      if (settleFrameRef.current !== null) {
        window.cancelAnimationFrame(settleFrameRef.current);
        settleFrameRef.current = null;
      }
      layout.x = node.position.x;
      layout.y = node.position.y;
      layout.fx = node.position.x;
      layout.fy = node.position.y;
      dragRef.current = {
        id: node.id,
        startX: node.position.x,
        startY: node.position.y,
        lastX: node.position.x,
        lastY: node.position.y,
        lastTime: event.timeStamp,
        velocityX: 0,
        velocityY: 0,
        moved: false,
      };
      simulationRef.current?.alpha(0.42).alphaTarget(0.08).restart();
    },
    [],
  );

  const onNodeDrag = useCallback<OnNodeDrag<Node<ForceGraphNodeData>>>(
    (event, node) => {
      const drag = dragRef.current;
      const layout = layoutByIdRef.current.get(node.id);
      if (!drag || drag.id !== node.id || !layout) return;
      const elapsed = Math.max(8, event.timeStamp - drag.lastTime);
      const frameScale = 16.667 / elapsed;
      const sampledVelocityX = (node.position.x - drag.lastX) * frameScale;
      const sampledVelocityY = (node.position.y - drag.lastY) * frameScale;
      drag.velocityX = drag.velocityX * 0.55 + sampledVelocityX * 0.45;
      drag.velocityY = drag.velocityY * 0.55 + sampledVelocityY * 0.45;
      drag.lastX = node.position.x;
      drag.lastY = node.position.y;
      drag.lastTime = event.timeStamp;
      drag.moved ||=
        Math.hypot(
          node.position.x - drag.startX,
          node.position.y - drag.startY,
        ) > 4;
      layout.x = node.position.x;
      layout.y = node.position.y;
      layout.fx = node.position.x;
      layout.fy = node.position.y;
      const simulation = simulationRef.current;
      simulation?.alpha(Math.max(simulation.alpha(), 0.24)).restart();
      schedulePublish();
    },
    [schedulePublish],
  );

  const onNodeDragStop = useCallback<OnNodeDrag<Node<ForceGraphNodeData>>>(
    (event, node) => {
      const drag = dragRef.current;
      const layout = layoutByIdRef.current.get(node.id);
      if (!drag || drag.id !== node.id || !layout) return;
      const idleDuration = Math.max(0, event.timeStamp - drag.lastTime);
      const retention = Math.exp(-idleDuration / 120);
      layout.x = node.position.x;
      layout.y = node.position.y;
      layout.vx = clampVelocity(drag.velocityX, retention);
      layout.vy = clampVelocity(drag.velocityY, retention);
      layout.fx = undefined;
      layout.fy = undefined;
      dragRef.current = null;

      if (drag.moved) {
        suppressClickRef.current = true;
        if (suppressClickTimerRef.current !== null)
          clearTimeout(suppressClickTimerRef.current);
        suppressClickTimerRef.current = setTimeout(() => {
          suppressClickRef.current = false;
          suppressClickTimerRef.current = null;
        }, 0);
      }

      const simulation = simulationRef.current;
      if (!simulation) return;
      const easingStartedAt = performance.now();
      const initialTarget = 0.055;
      simulation
        .alpha(Math.max(simulation.alpha(), 0.22))
        .alphaTarget(initialTarget)
        .restart();
      const easeRelease = (time: number) => {
        const progress = Math.min(
          1,
          (time - easingStartedAt) / RELEASE_EASING_MS,
        );
        const remaining = 1 - progress;
        simulation.alphaTarget(initialTarget * remaining * remaining);
        if (progress < 1) {
          settleFrameRef.current = window.requestAnimationFrame(easeRelease);
        } else {
          simulation.alphaTarget(0);
          settleFrameRef.current = null;
        }
      };
      settleFrameRef.current = window.requestAnimationFrame(easeRelease);
    },
    [],
  );

  const consumeSuppressedClick = useCallback(() => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  }, []);

  return {
    nodes,
    onNodesChange,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    consumeSuppressedClick,
  };
}
