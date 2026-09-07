"use client";
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import type { TaskContract } from "@gameagent/protocol";
import "@xyflow/react/dist/style.css";

export default function Network({
  tasks,
  select,
}: {
  tasks: TaskContract[];
  select: (id: string) => void;
}) {
  const nodes: Node[] = tasks.map((task, index) => ({
    id: task.task_id,
    data: { label: `${task.title} · ${task.state ?? "PROPOSED"}` },
    position: { x: (index % 3) * 260, y: Math.floor(index / 3) * 130 },
    style: {
      width: 220,
      background: "var(--ga-surface)",
      color: "var(--ga-foreground)",
      border: "1px solid var(--ga-border)",
      borderRadius: 8,
      padding: 16,
    },
  }));
  const edges: Edge[] = tasks.flatMap((task) =>
    task.dependency_ids.map((dependency) => ({
      id: `${dependency}:${task.task_id}`,
      source: dependency,
      target: task.task_id,
      label: "required by",
      animated: false,
    })),
  );
  if (!tasks.length)
    return (
      <div className="empty">
        No production network yet. Propose a task to begin.
      </div>
    );
  return (
    <div className="network" aria-label="Task dependency graph">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        onNodeClick={(_, node) => select(node.id)}
        colorMode="dark"
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background gap={24} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
