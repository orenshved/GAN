"use client";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { useMemo, useState, type ReactNode } from "react";
import type {
  AgentDefinition,
  EventPage,
  ProjectSnapshot,
  TaskContract,
} from "@gameagent/protocol";
import "@xyflow/react/dist/style.css";

type HistoryEvent = EventPage["events"][number];
type AgentState = "working" | "attention" | "hired" | "available";
type AgentFilter = "all" | "used" | "working" | "available" | "attention";
type AgentView = {
  agent: AgentDefinition;
  state: AgentState;
  tasks: TaskContract[];
  history: HistoryEvent[];
  used: boolean;
};

const agentStateLabels: Record<AgentState, string> = {
  working: "Working now",
  attention: "Needs attention",
  hired: "In use",
  available: "Available to hire",
};

const filterLabels: Record<AgentFilter, string> = {
  all: "All agents",
  used: "Being used",
  working: "Working now",
  available: "Available to hire",
  attention: "Needs attention",
};

function payloadAgentId(event: HistoryEvent) {
  const payload: unknown = event.payload;
  if (!payload || typeof payload !== "object" || !("agent_id" in payload))
    return null;
  const agentId = (payload as { agent_id?: unknown }).agent_id;
  return typeof agentId === "string" ? agentId : null;
}

function statusClass(state: AgentState) {
  return `agent-state agent-state-${state}`;
}

export function AgentNetwork({
  snapshot,
  roster,
  events,
  loading,
  error,
  selectTask,
}: {
  snapshot: ProjectSnapshot;
  roster: AgentDefinition[];
  events: HistoryEvent[];
  loading: boolean;
  error: string | null;
  selectTask: (id: string) => void;
}) {
  const [filter, setFilter] = useState<AgentFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const agents = useMemo<AgentView[]>(() => {
    const agentByTask = new Map<string, string>();
    for (const plan of snapshot.plans ?? []) {
      for (const assignment of plan.assignments) {
        if (assignment.agent)
          agentByTask.set(assignment.task_id, assignment.agent.agent_id);
      }
    }
    for (const event of events) {
      if (
        (event.event_type === "agent.assigned" ||
          event.event_type === "agent.hired") &&
        event.task_id
      ) {
        const agentId = payloadAgentId(event);
        if (agentId) agentByTask.set(event.task_id, agentId);
      }
    }
    const hiredAgentIds = new Set(
      events
        .filter((event) => event.event_type === "agent.hired")
        .map(payloadAgentId)
        .filter((id): id is string => Boolean(id)),
    );
    const failedAgentIds = new Set(
      events
        .filter((event) => event.event_type === "agent.failed")
        .map(payloadAgentId)
        .filter((id): id is string => Boolean(id)),
    );
    return roster.map((agent) => {
      const tasks = snapshot.tasks.filter(
        (task) => agentByTask.get(task.task_id) === agent.agent_id,
      );
      const taskIds = new Set(tasks.map((task) => task.task_id));
      const workers = (snapshot.workers ?? []).filter((worker) =>
        taskIds.has(worker.task_id),
      );
      const working = workers.some((worker) => worker.state === "running");
      const attention =
        failedAgentIds.has(agent.agent_id) ||
        workers.some((worker) => worker.state === "failed") ||
        tasks.some((task) => task.state === "BLOCKED");
      const used = tasks.length > 0 || hiredAgentIds.has(agent.agent_id);
      const state: AgentState = attention
        ? "attention"
        : working
          ? "working"
          : used
            ? "hired"
            : "available";
      const history = events.filter(
        (event) =>
          event.actor_id === agent.agent_id ||
          payloadAgentId(event) === agent.agent_id ||
          Boolean(event.task_id && taskIds.has(event.task_id)),
      );
      return { agent, state, tasks, history, used };
    });
  }, [events, roster, snapshot.plans, snapshot.tasks, snapshot.workers]);

  const counts = useMemo<Record<AgentFilter, number>>(
    () => ({
      all: agents.length,
      used: agents.filter((agent) => agent.used).length,
      working: agents.filter((agent) => agent.state === "working").length,
      available: agents.filter((agent) => agent.state === "available").length,
      attention: agents.filter((agent) => agent.state === "attention").length,
    }),
    [agents],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleAgents = agents.filter((agent) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "used" && agent.used) ||
      agent.state === filter;
    const matchesQuery =
      !normalizedQuery ||
      agent.agent.name.toLocaleLowerCase().includes(normalizedQuery) ||
      agent.agent.description.toLocaleLowerCase().includes(normalizedQuery) ||
      agent.agent.capabilities.some((capability) =>
        capability.toLocaleLowerCase().includes(normalizedQuery),
      );
    return matchesFilter && matchesQuery;
  });
  const selectedAgent =
    visibleAgents.find((agent) => agent.agent.agent_id === selectedAgentId) ??
    visibleAgents[0] ??
    null;

  const graph = useMemo(() => {
    const center = { x: 440, y: 270 };
    const nodes: Node<{ label: ReactNode }>[] = [
      {
        id: "project-root",
        position: center,
        className: "agent-map-root",
        data: {
          label: (
            <div className="agent-node-label agent-root-label">
              <span className="agent-node-mark">GAN</span>
              <strong>{snapshot.project.project.name}</strong>
              <small>{visibleAgents.length} agents shown</small>
            </div>
          ),
        },
      },
    ];
    const edges: Edge[] = [];
    visibleAgents.forEach((view, index) => {
      const angle =
        (Math.PI * 2 * index) / Math.max(visibleAgents.length, 1) - Math.PI / 2;
      const x = center.x + Math.cos(angle) * 335;
      const y = center.y + Math.sin(angle) * 235;
      const agentId = `agent:${view.agent.agent_id}`;
      nodes.push({
        id: agentId,
        position: { x, y },
        className: `agent-map-node agent-map-node-${view.state}`,
        data: {
          label: (
            <div className="agent-node-label">
              <span className={statusClass(view.state)}>
                {agentStateLabels[view.state]}
              </span>
              <strong>{view.agent.name}</strong>
              <small>
                v{view.agent.version} · {view.tasks.length} task
                {view.tasks.length === 1 ? "" : "s"}
              </small>
            </div>
          ),
        },
      });
      edges.push({
        id: `project:${agentId}`,
        source: "project-root",
        target: agentId,
        className: `agent-map-edge agent-map-edge-${view.state}`,
      });
      view.tasks.forEach((task, taskIndex) => {
        const spread = (taskIndex - (view.tasks.length - 1) / 2) * 72;
        const outwardX = Math.cos(angle) * 165;
        const outwardY = Math.sin(angle) * 120;
        const tangentX = -Math.sin(angle) * spread;
        const tangentY = Math.cos(angle) * spread;
        nodes.push({
          id: `task:${task.task_id}`,
          position: {
            x: x + outwardX + tangentX,
            y: y + outwardY + tangentY,
          },
          className: `agent-task-node agent-task-${task.state?.toLocaleLowerCase() ?? "proposed"}`,
          data: {
            label: (
              <div className="agent-task-label">
                <span>{task.state ?? "PROPOSED"}</span>
                <strong>{task.title}</strong>
              </div>
            ),
          },
        });
        edges.push({
          id: `${agentId}:task:${task.task_id}`,
          source: agentId,
          target: `task:${task.task_id}`,
          className: "agent-task-edge",
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      });
    });
    return { nodes, edges };
  }, [snapshot.project.project.name, visibleAgents]);

  if (loading)
    return (
      <section className="panel agent-network-panel" aria-busy="true">
        <div className="empty">Loading the agent roster…</div>
      </section>
    );
  if (error)
    return (
      <section className="panel agent-network-panel">
        <div className="error" role="alert">
          {error}
        </div>
      </section>
    );

  return (
    <section className="panel agent-network-panel" aria-label="Agent network">
      <header className="agent-network-header">
        <div>
          <p className="eyebrow">PRODUCTION · AGENT NETWORK</p>
          <h2>Agent network</h2>
          <p className="muted">
            Explore the roster, current engagements, and the project history
            behind each agent.
          </p>
        </div>
        <div
          className="agent-network-telemetry"
          aria-label="Agent network totals"
        >
          <div>
            <strong>{agents.length}</strong>
            <span>agents</span>
          </div>
          <div>
            <strong>{counts.working}</strong>
            <span>working now</span>
          </div>
          <div>
            <strong>{counts.available}</strong>
            <span>available</span>
          </div>
        </div>
      </header>
      <div className="agent-network-toolbar">
        <span className="eyebrow">LIVE PROJECT STATE</span>
        <span>
          Scroll to zoom · drag nodes to reposition · select an agent to inspect
        </span>
      </div>
      <div className="agent-network-workspace">
        <aside className="agent-filter-rail" aria-label="Agent filters">
          <div className="agent-rail-heading">
            <span className="eyebrow">FILTER AGENTS</span>
            <strong>{visibleAgents.length}</strong>
          </div>
          <div className="agent-filter-list">
            {(Object.keys(filterLabels) as AgentFilter[]).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >
                <span className={`agent-filter-dot agent-filter-dot-${key}`} />
                <span>{filterLabels[key]}</span>
                <em>{counts[key]}</em>
              </button>
            ))}
          </div>
          <label className="agent-search">
            <span className="eyebrow">AGENT INDEX</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find agent or capability…"
            />
          </label>
          <div className="agent-index">
            {visibleAgents.map((view) => (
              <button
                type="button"
                key={view.agent.agent_id}
                aria-current={
                  selectedAgent?.agent.agent_id === view.agent.agent_id
                }
                onClick={() => setSelectedAgentId(view.agent.agent_id)}
              >
                <span className={statusClass(view.state)} />
                <span>{view.agent.name}</span>
              </button>
            ))}
            {!visibleAgents.length && <p>No matching agents.</p>}
          </div>
        </aside>
        <div className="agent-network-canvas">
          <ReactFlow
            nodes={graph.nodes}
            edges={graph.edges}
            fitView
            fitViewOptions={{ padding: 0.24 }}
            nodesConnectable={false}
            onNodeClick={(_, node) => {
              if (node.id.startsWith("agent:"))
                setSelectedAgentId(node.id.slice("agent:".length));
              if (node.id.startsWith("task:"))
                selectTask(node.id.slice("task:".length));
            }}
            colorMode="dark"
            minZoom={0.2}
            maxZoom={2.1}
          >
            <Background gap={26} color="#263236" />
            <Controls showInteractive={false} />
          </ReactFlow>
          <div
            className="agent-network-legend"
            aria-label="Agent status legend"
          >
            {(Object.keys(agentStateLabels) as AgentState[]).map((state) => (
              <span key={state}>
                <i className={statusClass(state)} /> {agentStateLabels[state]}
              </span>
            ))}
          </div>
        </div>
        <aside className="agent-context-lens" aria-label="Agent context lens">
          <div className="agent-context-heading">
            <span className="eyebrow">CONTEXT LENS</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15">
              <path d="M6 6l12 5M6 18l12-7M6 6v12" />
              <circle cx="6" cy="6" r="2" />
              <circle cx="6" cy="18" r="2" />
              <circle cx="18" cy="11" r="2" />
            </svg>
          </div>
          {selectedAgent ? (
            <div className="agent-context-body">
              <span className={statusClass(selectedAgent.state)}>
                {agentStateLabels[selectedAgent.state]}
              </span>
              <h3>{selectedAgent.agent.name}</h3>
              <p>{selectedAgent.agent.description}</p>
              <dl className="details agent-context-metrics">
                <dt>Version</dt>
                <dd>{selectedAgent.agent.version}</dd>
                <dt>Engagement</dt>
                <dd>
                  {selectedAgent.used
                    ? "Used by this project"
                    : "Not hired yet"}
                </dd>
                <dt>Recorded history</dt>
                <dd>{selectedAgent.history.length} events</dd>
              </dl>
              <div className="agent-context-section">
                <span className="eyebrow">CAPABILITIES</span>
                <div className="agent-capabilities">
                  {selectedAgent.agent.capabilities.map((capability) => (
                    <span key={capability}>
                      {capability.replaceAll("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
              <div className="agent-context-section">
                <span className="eyebrow">TASKS</span>
                {selectedAgent.tasks.length ? (
                  <ul className="agent-context-list">
                    {selectedAgent.tasks.map((task) => (
                      <li key={task.task_id}>
                        <button
                          type="button"
                          onClick={() => selectTask(task.task_id)}
                        >
                          <strong>{task.title}</strong>
                          <span>{task.state ?? "PROPOSED"}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No project tasks assigned.</p>
                )}
              </div>
              <div className="agent-context-section">
                <span className="eyebrow">HISTORY</span>
                {selectedAgent.history.length ? (
                  <ol className="agent-history-list">
                    {selectedAgent.history
                      .slice()
                      .reverse()
                      .slice(0, 8)
                      .map((event) => (
                        <li key={event.event_id}>
                          <strong>
                            {event.event_type.replaceAll(".", " / ")}
                          </strong>
                          <time dateTime={event.timestamp}>
                            {new Date(event.timestamp).toLocaleString()}
                          </time>
                        </li>
                      ))}
                  </ol>
                ) : (
                  <p className="muted">No agent history recorded.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="agent-context-empty">
              <strong>No agents match this view</strong>
              <p>Change the filter or search to restore the network.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

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
