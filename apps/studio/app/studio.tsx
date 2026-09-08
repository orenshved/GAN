"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type {
  AgentDefinition,
  AgentRegistrySnapshot,
  ContextPackage,
  EngineProjectInspection,
  EventPage,
  InboxDecision,
  LocalModelRecommendation,
  ModelBenchmark,
  ModelEnvironment,
  ModelRoutingRecord,
  Policy,
  ProjectCatalog,
  QAReport,
  ProjectSummary,
  ProjectSnapshot,
  RecruitmentRecord,
  ReconciliationRecord,
  RuntimeCaptureResult,
  TaskContract,
  TaskProposal,
} from "@gameagent/protocol";

const Network = dynamic(() => import("./network"), {
  loading: () => <p role="status">Loading network…</p>,
  ssr: false,
});
const AgentNetwork = dynamic(
  () => import("./network").then((module) => module.AgentNetwork),
  {
    loading: () => <p role="status">Loading agent network…</p>,
    ssr: false,
  },
);
const views = [
  "Director Desk",
  "Production",
  "QA",
  "Needs Oren",
  "Workers",
  "Network",
  "Project Intelligence",
  "Agents",
  "Models",
  "Activity",
  "Settings",
] as const;
type View = (typeof views)[number];
type Connection = { websocketUrl: string };
type HistoryEvent = EventPage["events"][number];

export default function Studio(props: Connection) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: true },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <Desk {...props} />
    </QueryClientProvider>
  );
}

async function request<T>(
  connection: Connection,
  path: string,
  body?: unknown,
  method = "GET",
): Promise<T> {
  const response = await fetch(`/api/daemon${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(
      path === "/runtime-capture" ||
        path === "/recruit" ||
        path === "/model-benchmark" ||
        path === "/model-recommend"
        ? 120000
        : 10000,
    ),
  });
  const value = await response.json();
  if (!response.ok)
    throw new Error(
      value.detail || value.error || `Request failed (${response.status})`,
    );
  return value as T;
}

function Desk(connection: Connection) {
  const client = useQueryClient();
  const [view, setView] = useState<View>("Director Desk");
  const [selection, setSelection] = useState<{
    type: "task" | "event";
    id: string;
  } | null>(null);
  const [proposing, setProposing] = useState(false);
  const [managingProjects, setManagingProjects] = useState(false);
  const [switchingProject, setSwitchingProject] = useState(false);
  const [streamState, setStreamState] = useState("Connecting");
  const cursor = useRef(0);
  const [activityAfter, setActivityAfter] = useState(0);
  const catalog = useQuery({
    queryKey: ["projects"],
    queryFn: () => request<ProjectCatalog>(connection, "/projects"),
  });
  const activeProjectId = catalog.data?.active_project_id;
  const project = useQuery({
    queryKey: ["project", activeProjectId],
    queryFn: () => request<ProjectSnapshot>(connection, "/project"),
    enabled: !!activeProjectId,
  });
  const history = useQuery({
    queryKey: ["events", activeProjectId, activityAfter],
    queryFn: () =>
      request<EventPage>(
        connection,
        `/events?after=${activityAfter}&limit=100`,
      ),
    enabled: !!project.data && !!activeProjectId,
  });
  const agentRoster = useQuery({
    queryKey: ["agent-roster"],
    queryFn: () => request<AgentDefinition[]>(connection, "/agent-roster"),
    enabled: view === "Production" && !!activeProjectId,
  });
  const agentHistory = useQuery({
    queryKey: ["events", activeProjectId, "agent-network"],
    queryFn: () => request<EventPage>(connection, "/events?after=0&limit=500"),
    enabled: view === "Production" && !!project.data && !!activeProjectId,
  });
  const registry = useQuery({
    queryKey: ["agent-registry"],
    queryFn: () =>
      request<AgentRegistrySnapshot>(connection, "/agent-registry"),
    enabled: view === "Agents",
  });
  const modelEnvironment = useQuery({
    queryKey: ["model-environment"],
    queryFn: () => request<ModelEnvironment>(connection, "/model-environment"),
    enabled: view === "Models",
  });
  const ready = !!project.data;
  useEffect(() => {
    if (!ready) return;
    let stopped = false;
    let socket: WebSocket | undefined;
    let timer: ReturnType<typeof setTimeout>;
    async function connect() {
      const url = new URL(connection.websocketUrl);
      url.searchParams.set("after", String(cursor.current));
      try {
        const { ticket } = await request<{ ticket: string }>(
          connection,
          "/stream-ticket",
          undefined,
          "POST",
        );
        if (stopped) return;
        socket = new WebSocket(url);
        socket.onopen = () => socket?.send(JSON.stringify({ ticket }));
        socket.onmessage = (message: MessageEvent<string>) => {
          const data = JSON.parse(message.data) as EventPage & {
            error?: string;
            detail?: string;
          };
          if (data.error) {
            setStreamState("History needs attention");
            if (data.error === "cursor_ahead") cursor.current = 0;
            return;
          }
          setStreamState("Live");
          cursor.current = data.cursor;
          if (data.events.length) {
            void client.invalidateQueries({ queryKey: ["project"] });
            void client.invalidateQueries({ queryKey: ["events"] });
            void client.invalidateQueries({ queryKey: ["agent-registry"] });
            void client.invalidateQueries({ queryKey: ["agent-roster"] });
          }
        };
        socket.onclose = reconnect;
        socket.onerror = () => socket?.close();
      } catch {
        reconnect();
      }
    }
    function reconnect() {
      if (stopped) return;
      setStreamState("Reconnecting");
      timer = setTimeout(() => void connect(), 2000);
    }
    void connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      socket?.close();
    };
  }, [ready, activeProjectId, connection.websocketUrl, client]);

  async function activateProject(projectId: string) {
    setSwitchingProject(true);
    try {
      const next = await request<ProjectCatalog>(
        connection,
        "/project-select",
        { project_id: projectId },
        "POST",
      );
      cursor.current = 0;
      setActivityAfter(0);
      setSelection(null);
      client.setQueryData(["projects"], next);
      await client.invalidateQueries({ queryKey: ["project"] });
      await client.invalidateQueries({ queryKey: ["events"] });
      setManagingProjects(false);
    } finally {
      setSwitchingProject(false);
    }
  }

  const snapshot = project.data;
  const tasks = snapshot?.tasks ?? [];
  const selectedTask =
    selection?.type === "task"
      ? tasks.find((task) => task.task_id === selection.id)
      : undefined;
  const selectedEvent =
    selection?.type === "event"
      ? history.data?.events.find((event) => event.event_id === selection.id)
      : undefined;
  const selectTask = (id: string) => setSelection({ type: "task", id });
  const events = history.data?.events ?? [];
  return (
    <div className="workspace">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brand">
          <Image
            className="brand-logo"
            src="/logo.png"
            alt="Game Agent Network"
            width={160}
            height={147}
            priority
          />
        </div>
        <button
          className="project-label"
          onClick={() => setManagingProjects(true)}
          aria-label="Switch or import project"
        >
          <span className="eyebrow">PROJECT</span>
          <strong>{snapshot?.project.project.name ?? "Connecting…"}</strong>
          <span>
            {snapshot?.project.engine?.type ??
              snapshot?.project.production.stage.replaceAll("_", " ")}
            {catalog.data && catalog.data.projects.length > 1
              ? ` · ${catalog.data.projects.length} projects`
              : ""}
          </span>
        </button>
        <nav>
          {views.map((item, index) => (
            <button
              key={item}
              aria-current={view === item ? "page" : undefined}
              onClick={() => setView(item)}
            >
              <span className="nav-index">0{index + 1}</span>
              {item}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span
            className={`connection ${streamState === "Live" ? "connected" : ""}`}
          >
            {project.isError ? "Disconnected" : streamState}
          </span>
          <span>Local production workspace</span>
        </div>
      </aside>
      <div className="work-area">
        <header className="topbar">
          <span>
            {snapshot?.project.project.name ?? "Game Agent Network"}{" "}
            <span className="separator">/</span> {view}
          </span>
          <span className="mono">
            {snapshot
              ? `EVENT ${String(snapshot.cursor).padStart(4, "0")}`
              : "—"}
          </span>
        </header>
        <main className="desk">
          <div className="page-heading">
            <div>
              <p className="eyebrow">PRODUCTION WORKSPACE</p>
              <h1>{view}</h1>
              <p className="muted">
                {view === "Director Desk"
                  ? "Intent, work, and the history behind every decision."
                  : descriptions[view]}
              </p>
            </div>
            {snapshot && view !== "Settings" && (
              <button className="primary" onClick={() => setProposing(true)}>
                + Propose task
              </button>
            )}
          </div>
          {project.isPending && (
            <div className="empty" role="status">
              Connecting to your project…
            </div>
          )}
          {project.isError && (
            <div className="error" role="alert">
              <h2>Project unavailable</h2>
              <p>{project.error.message}</p>
              <p>
                Check that the local daemon is running and the project history
                is valid.
              </p>
              <button onClick={() => void project.refetch()}>Reconnect</button>
            </div>
          )}
          {snapshot?.requires_reconciliation && (
            <ReconciliationPanel
              records={
                snapshot.reconciliations?.filter(
                  (record) => record.state === "unresolved",
                ) ?? []
              }
              connection={connection}
              reconciled={() => {
                void client.invalidateQueries({ queryKey: ["project"] });
                void client.invalidateQueries({ queryKey: ["events"] });
              }}
            />
          )}
          {snapshot && (
            <>
              {view === "Needs Oren" && (
                <DecisionInbox
                  key={activeProjectId}
                  snapshot={snapshot}
                  connection={connection}
                />
              )}
              {view === "Director Desk" && (
                <GMPanel
                  key={activeProjectId}
                  snapshot={snapshot}
                  connection={connection}
                  select={selectTask}
                />
              )}
              {view === "Workers" && (
                <Workers snapshot={snapshot} connection={connection} />
              )}
              {view === "Director Desk" && (
                <>
                  <div className="metrics">
                    <Metric
                      label="Task proposals"
                      value={
                        tasks.filter((task) => task.state === "PROPOSED").length
                      }
                    />
                    <Metric
                      label="Blocked tasks"
                      value={
                        tasks.filter((task) => task.state === "BLOCKED").length
                      }
                    />
                    <Metric label="Recorded events" value={snapshot.cursor} />
                    <div>
                      <span className="eyebrow">CURRENT MILESTONE</span>
                      <strong className="milestone">
                        {snapshot.project.production.current_milestone ??
                          "Not set"}
                      </strong>
                    </div>
                  </div>
                  <section className="panel">
                    <div className="section-heading">
                      <h2>Production queue</h2>
                      <button
                        className="text-button"
                        onClick={() => setView("Production")}
                      >
                        View all →
                      </button>
                    </div>
                    <TaskTable tasks={tasks} select={selectTask} />
                  </section>
                  <div className="two-column">
                    <section className="panel">
                      <h2>Recent activity</h2>
                      <EventList
                        events={events.slice(-5).reverse()}
                        select={(event) =>
                          setSelection({ type: "event", id: event.event_id })
                        }
                      />
                    </section>
                    <section className="panel">
                      <h2>Project direction</h2>
                      <p>{snapshot.project.project.description}</p>
                      <dl className="details">
                        <dt>Stage</dt>
                        <dd>{snapshot.project.production.stage}</dd>
                        <dt>Visual direction</dt>
                        <dd>{snapshot.project.visual.direction}</dd>
                        <dt>Authority</dt>
                        <dd>
                          {
                            policyLabels[
                              snapshot.policy.authority ??
                                "recommend_and_proceed"
                            ]
                          }
                        </dd>
                      </dl>
                    </section>
                  </div>
                </>
              )}
              {view === "Production" && (
                <>
                  <AgentNetwork
                    key={`agent-network-${activeProjectId}`}
                    snapshot={snapshot}
                    roster={agentRoster.data ?? []}
                    events={agentHistory.data?.events ?? []}
                    loading={agentRoster.isPending || agentHistory.isPending}
                    error={
                      agentRoster.error?.message ??
                      agentHistory.error?.message ??
                      null
                    }
                    selectTask={selectTask}
                  />
                  <RuntimeEvidencePanel
                    key={activeProjectId}
                    snapshot={snapshot}
                    connection={connection}
                  />
                  <section className="panel">
                    <div className="section-heading">
                      <h2>Task contracts</h2>
                      <span className="muted">{tasks.length} total</span>
                    </div>
                    <TaskTable tasks={tasks} select={selectTask} />
                  </section>
                </>
              )}
              {view === "QA" && (
                <QAPanel
                  key={`qa-${activeProjectId}`}
                  snapshot={snapshot}
                  connection={connection}
                />
              )}
              {view === "Network" && (
                <section className="panel">
                  <div className="section-heading">
                    <h2>Production dependencies</h2>
                    <span className="muted">
                      Select a task to inspect its contract
                    </span>
                  </div>
                  <Network tasks={tasks} select={selectTask} />
                </section>
              )}
              {view === "Project Intelligence" && (
                <ProjectIntelligencePanel
                  snapshot={snapshot}
                  connection={connection}
                />
              )}
              {view === "Agents" && (
                <AgentRegistryPanel
                  snapshot={snapshot}
                  registry={registry.data}
                  loading={registry.isPending}
                  error={registry.error?.message ?? null}
                  connection={connection}
                  refreshed={() => {
                    void client.invalidateQueries({
                      queryKey: ["agent-registry"],
                    });
                    void client.invalidateQueries({ queryKey: ["project"] });
                    void client.invalidateQueries({
                      queryKey: ["agent-roster"],
                    });
                  }}
                />
              )}
              {view === "Models" && (
                <ModelRouterPanel
                  key={`models-${activeProjectId}`}
                  snapshot={snapshot}
                  environment={modelEnvironment.data}
                  loading={modelEnvironment.isPending}
                  error={modelEnvironment.error?.message ?? null}
                  connection={connection}
                />
              )}
              {view === "Activity" && (
                <section className="panel">
                  <div className="section-heading">
                    <h2>Project history</h2>
                    <span className="muted">
                      Canonical events · oldest first
                    </span>
                  </div>
                  {history.isError && (
                    <p className="error" role="alert">
                      {history.error.message}
                    </p>
                  )}
                  <EventList
                    events={events}
                    select={(event) =>
                      setSelection({ type: "event", id: event.event_id })
                    }
                  />
                  <div className="pagination">
                    <button
                      disabled={activityAfter === 0}
                      onClick={() => {
                        setActivityAfter(Math.max(0, activityAfter - 100));
                        setSelection(null);
                      }}
                    >
                      Previous
                    </button>
                    <span>
                      Events {activityAfter + 1}–
                      {history.data?.cursor ?? activityAfter}
                    </span>
                    <button
                      disabled={!history.data?.has_more}
                      onClick={() => {
                        setActivityAfter(history.data?.cursor ?? 0);
                        setSelection(null);
                      }}
                    >
                      Next
                    </button>
                  </div>
                </section>
              )}
              {view === "Settings" && (
                <Settings
                  key={`${snapshot.project.project.id}-${snapshot.cursor}`}
                  snapshot={snapshot}
                  connection={connection}
                  saved={() =>
                    void client.invalidateQueries({ queryKey: ["project"] })
                  }
                />
              )}
            </>
          )}
        </main>
      </div>
      <aside className="inspector" aria-label="Inspector">
        <div className="section-heading">
          <h2>Inspector</h2>
          {selection && (
            <button
              aria-label="Close inspector selection"
              onClick={() => setSelection(null)}
            >
              ×
            </button>
          )}
        </div>
        {selectedTask ? (
          <>
            <p className="eyebrow">TASK CONTRACT</p>
            <h3>{selectedTask.title}</h3>
            <Status state={selectedTask.state ?? "PROPOSED"} />
            <p>{selectedTask.objective}</p>
            <dl className="details">
              <dt>Capabilities</dt>
              <dd>{selectedTask.required_capabilities.join(", ")}</dd>
              <dt>Deliverables</dt>
              <dd>{selectedTask.deliverables.join("; ")}</dd>
              <dt>Required gates</dt>
              <dd>{selectedTask.required_evaluations.join(", ")}</dd>
              <dt>Dependencies</dt>
              <dd>
                {selectedTask.dependency_ids.length
                  ? selectedTask.dependency_ids
                      .map(
                        (id) =>
                          tasks.find((task) => task.task_id === id)?.title ??
                          id,
                      )
                      .join(", ")
                  : "None"}
              </dd>
            </dl>
            <details>
              <summary>Full contract</summary>
              <pre>{JSON.stringify(selectedTask, null, 2)}</pre>
            </details>
          </>
        ) : selectedEvent ? (
          <>
            <p className="eyebrow">PROJECT EVENT</p>
            <h3>{selectedEvent.event_type}</h3>
            <p>
              {selectedEvent.actor_id} · {selectedEvent.timestamp}
            </p>
            <pre>{JSON.stringify(selectedEvent, null, 2)}</pre>
          </>
        ) : (
          <div className="inspector-empty">
            <span className="inspection-mark">↗</span>
            <h3>Follow the evidence.</h3>
            <p>
              Select a task or event to inspect its context, requirements, and
              underlying record.
            </p>
          </div>
        )}
      </aside>
      {proposing && snapshot && (
        <ProposalDialog
          connection={connection}
          tasks={tasks}
          close={() => setProposing(false)}
          created={(task) => {
            setProposing(false);
            selectTask(task.task_id);
            void client.invalidateQueries({ queryKey: ["project"] });
            void client.invalidateQueries({ queryKey: ["events"] });
          }}
        />
      )}
      {managingProjects && catalog.data && (
        <ProjectDialog
          catalog={catalog.data}
          connection={connection}
          busy={switchingProject}
          close={() => setManagingProjects(false)}
          activate={activateProject}
          imported={(next) => {
            cursor.current = 0;
            setActivityAfter(0);
            setSelection(null);
            client.setQueryData(["projects"], next);
            void client.invalidateQueries({ queryKey: ["project"] });
            void client.invalidateQueries({ queryKey: ["events"] });
            setManagingProjects(false);
          }}
          removed={(next) => {
            cursor.current = 0;
            setActivityAfter(0);
            setSelection(null);
            client.setQueryData(["projects"], next);
            void client.invalidateQueries({ queryKey: ["project"] });
            void client.invalidateQueries({ queryKey: ["events"] });
            setManagingProjects(false);
          }}
        />
      )}
    </div>
  );
}

function GMPanel({
  snapshot,
  connection,
  select,
}: {
  snapshot: ProjectSnapshot;
  connection: Connection;
  select: (id: string) => void;
}) {
  const client = useQueryClient();
  const [objective, setObjective] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    requestId.current ??= `objective-${crypto.randomUUID()}`;
    try {
      await request(
        connection,
        "/gm-objective",
        { request_id: requestId.current, objective },
        "POST",
      );
      setObjective("");
      requestId.current = null;
      await client.invalidateQueries({ queryKey: ["project"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Planning request failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel gm-panel">
      <div className="section-heading">
        <h2>Direct the project</h2>
        <span className="eyebrow">PROJECT GM</span>
      </div>
      <p>
        Describe the outcome. The GM will map the work, find specialists and
        surface choices that need your judgment.
      </p>
      <form onSubmit={(event) => void submit(event)}>
        <label htmlFor="gm-objective">Production objective</label>
        <textarea
          id="gm-objective"
          required
          rows={3}
          value={objective}
          onChange={(event) => {
            setObjective(event.target.value);
            requestId.current = null;
          }}
          placeholder="Players should understand what to do next…"
        />
        <button
          disabled={
            busy ||
            snapshot.gm?.state === "planning" ||
            snapshot.requires_reconciliation ||
            !objective.trim()
          }
        >
          {busy ? "Starting…" : "Create production plan"}
        </button>
      </form>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {snapshot.gm && (
        <p role="status">
          <Status state={snapshot.gm.state} /> {snapshot.gm.detail}
        </p>
      )}
      {(snapshot.plans ?? [])
        .slice()
        .reverse()
        .map((plan) => (
          <article key={plan.plan_id} className="plan-card">
            <h3>{plan.objective}</h3>
            <p>{plan.summary}</p>
            <p className="muted">
              {plan.tasks.length} tasks ·{" "}
              {snapshot.decisions?.filter(
                (d) => d.plan_id === plan.plan_id && !d.selected_option,
              ).length ?? 0}{" "}
              decisions pending
            </p>
            <ul>
              {plan.tasks.map((task) => {
                const assignment = plan.assignments.find(
                  (a) => a.task_id === task.task_id,
                );
                const state =
                  snapshot.tasks.find((t) => t.task_id === task.task_id)
                    ?.state ?? task.state;
                return (
                  <li key={task.task_id}>
                    <button
                      className="text-button"
                      onClick={() => select(task.task_id)}
                    >
                      {task.title}
                    </button>{" "}
                    <Status state={state ?? "QUEUED"} />
                    <p>
                      {assignment?.agent
                        ? `${assignment.agent.name} · v${assignment.agent.version}`
                        : `Capability gap: ${assignment?.missing_capabilities.join(", ")}`}
                    </p>
                  </li>
                );
              })}
            </ul>
            <details>
              <summary>Plan record</summary>
              <pre>{JSON.stringify(plan, null, 2)}</pre>
            </details>
          </article>
        ))}
    </section>
  );
}

function DecisionInbox({
  snapshot,
  connection,
}: {
  snapshot: ProjectSnapshot;
  connection: Connection;
}) {
  return (
    <section className="panel">
      <h2>Needs Oren</h2>
      <p>Your choices become durable project decisions.</p>
      {!snapshot.decisions?.length && <p>No decisions need your attention.</p>}
      {(snapshot.decisions ?? []).map((decision) => (
        <DecisionCard
          key={decision.decision_id}
          decision={decision}
          snapshot={snapshot}
          connection={connection}
        />
      ))}
    </section>
  );
}

function DecisionCard({
  decision,
  snapshot,
  connection,
}: {
  decision: InboxDecision;
  snapshot: ProjectSnapshot;
  connection: Connection;
}) {
  const client = useQueryClient();
  const [option, setOption] = useState("");
  const [rationale, setRationale] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(`decision-${crypto.randomUUID()}`);
  async function resolve(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request(
        connection,
        "/decision-resolve",
        {
          request_id: requestId.current,
          decision_id: decision.decision_id,
          selected_option: option,
          rationale,
        },
        "POST",
      );
      await client.invalidateQueries({ queryKey: ["project"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decision failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="plan-card">
      <h3>{decision.title}</h3>
      <p>{decision.reason}</p>
      <p>
        <strong>GM recommendation:</strong> {decision.recommendation}
      </p>
      <p>{decision.consequences.join(" · ")}</p>
      <p className="muted">
        Affects:{" "}
        {decision.task_ids
          .map(
            (id) => snapshot.tasks.find((t) => t.task_id === id)?.title ?? id,
          )
          .join(", ")}
      </p>
      {decision.selected_option ? (
        <p>
          <strong>Decided: {decision.selected_option}</strong> —{" "}
          {decision.rationale}
        </p>
      ) : (
        <form onSubmit={(event) => void resolve(event)}>
          <label>
            Choose an option
            <select
              required
              value={option}
              onChange={(event) => {
                setOption(event.target.value);
                requestId.current = `decision-${crypto.randomUUID()}`;
              }}
            >
              <option value="">Select…</option>
              {decision.options.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Rationale or discussion notes
            <textarea
              required
              value={rationale}
              onChange={(event) => {
                setRationale(event.target.value);
                requestId.current = `decision-${crypto.randomUUID()}`;
              }}
            />
          </label>
          <button disabled={busy || !option || !rationale.trim()}>
            Record decision
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </article>
  );
}

const descriptions: Record<Exclude<View, "Director Desk">, string> = {
  "Needs Oren": "Resolve the human choices holding production work.",
  Workers: "Run and resume read-only Codex analysis for a proposed task.",
  Production:
    "Live agent topology, engine runs, runtime evidence, and task contracts.",
  QA: "Required gates, evidence provenance, human judgment, and explicit waivers.",
  Network: "The actual dependencies between project tasks.",
  "Project Intelligence":
    "Indexed facts, decisions, references, and task-scoped context.",
  Agents:
    "Capability gaps, sandbox auditions, probation, and the global production roster.",
  Models:
    "Local hardware, installed models, representative benchmarks, and explainable routing.",
  Activity: "Every recorded action, attributable and inspectable.",
  Settings: "Define how the project may proceed.",
};
const policyLabels: Record<NonNullable<Policy["authority"]>, string> = {
  ask_first: "Ask first",
  recommend_and_proceed: "Recommend and proceed",
  autonomous_within_policy: "Autonomous within policy",
};
function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function Status({ state }: { state: string }) {
  return <span className="status">{state.replaceAll("_", " ")}</span>;
}
function TaskTable({
  tasks,
  select,
}: {
  tasks: TaskContract[];
  select: (id: string) => void;
}) {
  if (!tasks.length)
    return (
      <div className="empty">
        <h3>A clear brief is the first step.</h3>
        <p>
          Propose a task with an objective and deliverable. It will be recorded
          in your project history.
        </p>
      </div>
    );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Task / desired outcome</th>
            <th>Capability</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.task_id}>
              <td>
                <button
                  className="task-link"
                  onClick={() => select(task.task_id)}
                >
                  {task.title}
                </button>
                <span className="task-objective">{task.objective}</span>
              </td>
              <td>{task.required_capabilities.join(", ")}</td>
              <td>
                <Status state={task.state ?? "PROPOSED"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function EventList({
  events,
  select,
}: {
  events: HistoryEvent[];
  select: (event: HistoryEvent) => void;
}) {
  return (
    <ol className="event-list">
      {events.map((event) => (
        <li key={event.event_id}>
          <span className="event-sequence">
            {String(event.sequence).padStart(3, "0")}
          </span>
          <button onClick={() => select(event)}>
            <strong>{event.event_type.replaceAll(".", " / ")}</strong>
            <span>
              {event.actor_id} ·{" "}
              <time dateTime={event.timestamp}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </time>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
function ReconciliationPanel({
  records,
  connection,
  reconciled,
}: {
  records: ReconciliationRecord[];
  connection: Connection;
  reconciled: () => void;
}) {
  const record = records[0];
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!record) return null;
  const changeId = record.change_id;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request<ReconciliationRecord>(
        connection,
        "/reconcile",
        {
          request_id: `studio-${crypto.randomUUID()}`,
          change_id: changeId,
          detail: detail.trim(),
        },
        "POST",
      );
      reconciled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reconcile");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="reconciliation-alert" role="alert">
      <div>
        <p className="eyebrow">WORKSPACE INTEGRITY</p>
        <h2>Unregistered changes require reconciliation</h2>
        <p>
          GAN detected project files changing outside a registered task. Review
          the paths and explain the work before the project can report a clean
          state.
        </p>
        <ul>
          {record.paths.map((path) => (
            <li key={path}>
              <code>{path}</code>
            </li>
          ))}
        </ul>
      </div>
      <form onSubmit={(event) => void submit(event)}>
        <label>
          Reconciliation detail
          <textarea
            required
            minLength={3}
            rows={3}
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            placeholder="Describe why these files changed and the outcome they serve."
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy || detail.trim().length < 3}>
          {busy ? "Reconciling…" : "Reconcile changes"}
        </button>
      </form>
    </section>
  );
}
function ProjectDialog({
  catalog,
  connection,
  busy,
  close,
  activate,
  imported,
  removed,
}: {
  catalog: ProjectCatalog;
  connection: Connection;
  busy: boolean;
  close: () => void;
  activate: (projectId: string) => Promise<void>;
  imported: (catalog: ProjectCatalog) => void;
  removed: (catalog: ProjectCatalog) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [importing, setImporting] = useState(false);
  const [removing, setRemoving] = useState<ProjectSummary | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function choose(projectId: string) {
    setError("");
    try {
      await activate(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to switch project");
    }
  }
  async function importProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImporting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      imported(
        await request<ProjectCatalog>(
          connection,
          "/project-import",
          { path: String(form.get("path")).trim() },
          "POST",
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to import project");
    } finally {
      setImporting(false);
    }
  }
  async function removeProject() {
    if (!removing) return;
    setRemoveBusy(true);
    setError("");
    try {
      removed(
        await request<ProjectCatalog>(
          connection,
          "/project-remove",
          { project_id: removing.project_id },
          "POST",
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove project");
    } finally {
      setRemoveBusy(false);
    }
  }
  return (
    <dialog ref={dialog} onCancel={close} onClose={close}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">PROJECTS</p>
          <h2>Choose a production workspace</h2>
        </div>
        <button
          type="button"
          aria-label="Close project chooser"
          onClick={close}
        >
          ×
        </button>
      </div>
      <div className="project-list">
        {catalog.projects.map((project) => {
          const active = project.project_id === catalog.active_project_id;
          return (
            <div className="project-entry" key={project.project_id}>
              <button
                className="project-choice"
                type="button"
                disabled={busy || active || removeBusy}
                aria-current={active ? "true" : undefined}
                onClick={() => void choose(project.project_id)}
              >
                <strong>{project.name}</strong>
                <span>
                  {project.engine ?? project.stage.replaceAll("_", " ")} ·{" "}
                  {project.root}
                </span>
                <span>{active ? "Current project" : "Open project"}</span>
              </button>
              <button
                className="project-remove"
                type="button"
                disabled={
                  busy ||
                  removeBusy ||
                  importing ||
                  catalog.projects.length === 1
                }
                aria-label={`Remove ${project.name} from GAN`}
                title={
                  catalog.projects.length === 1
                    ? "GAN requires at least one registered project"
                    : `Remove ${project.name} from GAN`
                }
                onClick={() => {
                  setError("");
                  setRemoving(project);
                }}
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
      {removing && (
        <section
          className="project-removal-confirmation"
          role="alertdialog"
          aria-labelledby="remove-project-title"
          aria-describedby="remove-project-detail"
        >
          <h3 id="remove-project-title">Remove {removing.name} from GAN?</h3>
          <p id="remove-project-detail">
            This forgets the project from this Studio. Repository files and its
            .gameagent history stay on disk.
          </p>
          <div className="form-actions">
            <button
              type="button"
              disabled={removeBusy}
              autoFocus
              onClick={() => setRemoving(null)}
            >
              Keep project
            </button>
            <button
              className="danger"
              type="button"
              disabled={removeBusy}
              onClick={() => void removeProject()}
            >
              {removeBusy ? "Removing…" : "Remove project"}
            </button>
          </div>
        </section>
      )}
      <form onSubmit={(event) => void importProject(event)}>
        <label>
          Add local repository
          <input
            name="path"
            required
            placeholder="C:\\projects\\my-game"
            autoComplete="off"
          />
        </label>
        <p className="muted">
          GAN will inspect this folder and initialize .gameagent if needed.
          Remote repository cloning is not enabled yet.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button
            className="primary"
            disabled={busy || importing || removeBusy}
          >
            {importing ? "Importing…" : "Import repository"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
function ProposalDialog({
  connection,
  tasks,
  close,
  created,
}: {
  connection: Connection;
  tasks: TaskContract[];
  close: () => void;
  created: (task: TaskContract) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const requestId = useRef(`request-${crypto.randomUUID()}`);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const proposal: TaskProposal = {
      request_id: requestId.current,
      title: String(form.get("title")).trim(),
      objective: String(form.get("objective")).trim(),
      required_capabilities: String(form.get("capabilities"))
        .split(",")
        .map((text) => text.trim())
        .filter(Boolean) as [string, ...string[]],
      deliverables: String(form.get("deliverables"))
        .split("\n")
        .map((text) => text.trim())
        .filter(Boolean) as [string, ...string[]],
      dependency_ids: form.getAll("dependencies").map(String),
    };
    try {
      created(
        await request<TaskContract>(connection, "/tasks", proposal, "POST"),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to propose task");
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog ref={dialog} onCancel={close} onClose={close}>
      <form onSubmit={(event) => void submit(event)}>
        <div className="section-heading">
          <h2>Propose a task</h2>
          <button type="button" aria-label="Close task form" onClick={close}>
            ×
          </button>
        </div>
        <p className="muted">
          Describe the outcome. The proposal is recorded immediately; execution
          requires production planning.
        </p>
        <label>
          Title
          <input name="title" required autoFocus maxLength={200} />
        </label>
        <label>
          Desired outcome
          <textarea name="objective" required rows={3} />
        </label>
        <label>
          Required capabilities
          <input
            name="capabilities"
            required
            placeholder="ui_engineering, usability_analysis"
          />
        </label>
        <label>
          Deliverables
          <textarea
            name="deliverables"
            required
            rows={2}
            placeholder="One deliverable per line"
          />
        </label>
        {tasks.length > 0 && (
          <label>
            Depends on
            <select name="dependencies" multiple>
              {tasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.title}
                </option>
              ))}
            </select>
          </label>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Recording…" : "Record proposal"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
function ProjectIntelligencePanel({
  snapshot,
  connection,
}: {
  snapshot: ProjectSnapshot;
  connection: Connection;
}) {
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [taskId, setTaskId] = useState(snapshot.tasks[0]?.task_id ?? "");
  const [context, setContext] = useState<ContextPackage | null>(null);
  const intelligence = snapshot.intelligence;
  const counts = intelligence?.resources.reduce<Record<string, number>>(
    (total, resource) => {
      total[resource.kind] = (total[resource.kind] ?? 0) + 1;
      return total;
    },
    {},
  );

  async function refresh() {
    setBusy(true);
    setError("");
    setContext(null);
    try {
      await request(
        connection,
        "/project-intelligence-refresh",
        { request_id: `index-${crypto.randomUUID()}` },
        "POST",
      );
      await client.invalidateQueries({ queryKey: ["project"] });
      await client.invalidateQueries({ queryKey: ["events"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to index project");
    } finally {
      setBusy(false);
    }
  }

  async function retrieve(event: FormEvent) {
    event.preventDefault();
    if (!taskId) return;
    setBusy(true);
    setError("");
    try {
      setContext(
        await request<ContextPackage>(
          connection,
          "/task-context",
          { task_id: taskId },
          "POST",
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to assemble context",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="intelligence-view">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Repository index</h2>
            <span className="muted">
              {intelligence
                ? `Indexed ${new Date(intelligence.indexed_at).toLocaleString()}`
                : "No project index recorded yet"}
            </span>
          </div>
          <button
            className="primary"
            disabled={busy}
            onClick={() => void refresh()}
          >
            {busy
              ? "Indexing…"
              : intelligence
                ? "Refresh index"
                : "Index project"}
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {intelligence && (
          <>
            <div className="intelligence-metrics">
              <Metric label="Documents" value={counts?.document ?? 0} />
              <Metric label="Source files" value={counts?.source ?? 0} />
              <Metric label="Assets" value={counts?.asset ?? 0} />
              <Metric label="Knowledge" value={intelligence.knowledge.length} />
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Indexed resource</th>
                    <th>Kind</th>
                    <th>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {intelligence.resources.slice(0, 40).map((resource) => (
                    <tr key={resource.path}>
                      <td className="mono">{resource.path}</td>
                      <td>{resource.kind}</td>
                      <td>{resource.size.toLocaleString()} bytes</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {intelligence.resources.length > 40 && (
              <p className="muted">
                Showing 40 of {intelligence.resources.length} indexed resources.
              </p>
            )}
          </>
        )}
      </section>

      {intelligence && (
        <div className="two-column intelligence-columns">
          <section className="panel">
            <h2>Knowledge with provenance</h2>
            <ul className="knowledge-list">
              {intelligence.knowledge.slice(0, 20).map((entry) => (
                <li key={entry.knowledge_id}>
                  <div>
                    <Status state={entry.kind} />
                    <span className="mono">
                      {Math.round(entry.confidence * 100)}% confidence
                    </span>
                  </div>
                  <strong>{entry.statement}</strong>
                  <span>{entry.source.uri}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel">
            <h2>Targeted context assembly</h2>
            <p className="muted">
              Preview the bounded package a worker receives instead of the full
              repository history.
            </p>
            <form onSubmit={(event) => void retrieve(event)}>
              <label>
                Task
                <select
                  value={taskId}
                  onChange={(event) => setTaskId(event.target.value)}
                  disabled={!snapshot.tasks.length}
                >
                  {snapshot.tasks.map((task) => (
                    <option key={task.task_id} value={task.task_id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </label>
              <button className="primary" disabled={busy || !taskId}>
                Assemble context
              </button>
            </form>
            {context && (
              <div className="context-result" role="status">
                <p>
                  <strong>
                    {context.selected_resource_count} of{" "}
                    {context.indexed_resource_count}
                  </strong>{" "}
                  resources selected · event history excluded
                </p>
                <dl className="details">
                  <dt>Knowledge entries</dt>
                  <dd>{context.knowledge.length}</dd>
                  <dt>Human decisions</dt>
                  <dd>{context.decisions.length}</dd>
                  <dt>References</dt>
                  <dd>{context.references.length}</dd>
                </dl>
                <details>
                  <summary>Inspect context package</summary>
                  <pre>{JSON.stringify(context, null, 2)}</pre>
                </details>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function QAPanel({
  snapshot,
  connection,
}: {
  snapshot: ProjectSnapshot;
  connection: Connection;
}) {
  const client = useQueryClient();
  const [taskId, setTaskId] = useState(snapshot.tasks.at(-1)?.task_id ?? "");
  const [discipline, setDiscipline] = useState<"all" | "ui" | "engineering">(
    "all",
  );
  const [requiredOnly, setRequiredOnly] = useState(false);
  const [busy, setBusy] = useState<"run" | "review" | "waive" | null>(null);
  const [error, setError] = useState("");
  const [reviewVerdict, setReviewVerdict] = useState<
    "approved" | "rejected" | "observation"
  >("observation");
  const [reviewSummary, setReviewSummary] = useState("");
  const [waiverGate, setWaiverGate] = useState("");
  const [waiverReason, setWaiverReason] = useState("");
  const report = useQuery({
    queryKey: [
      "qa-report",
      snapshot.project.project.id,
      taskId,
      snapshot.cursor,
    ],
    queryFn: () =>
      request<QAReport>(
        connection,
        `/qa-report?task_id=${encodeURIComponent(taskId)}`,
      ),
    enabled: !!taskId,
  });
  const selectedTask = snapshot.tasks.find((item) => item.task_id === taskId);
  const shownGates = (report.data?.gates ?? []).filter(
    (item) =>
      (discipline === "all" || item.gate.discipline === discipline) &&
      (!requiredOnly || item.required),
  );
  const evidenceById = new Map(
    (snapshot.evidence ?? []).map((item) => [item.evidence_id, item]),
  );
  const evaluationById = new Map(
    (snapshot.evaluations ?? []).map((item) => [item.evaluation_id, item]),
  );

  async function refresh(next: QAReport) {
    client.setQueryData(
      ["qa-report", snapshot.project.project.id, taskId, snapshot.cursor],
      next,
    );
    await Promise.all([
      client.invalidateQueries({ queryKey: ["project"] }),
      client.invalidateQueries({ queryKey: ["events"] }),
      client.invalidateQueries({ queryKey: ["qa-report"] }),
    ]);
  }

  async function runQA() {
    if (!taskId) return;
    setBusy("run");
    setError("");
    try {
      const next = await request<QAReport>(
        connection,
        "/qa-run",
        { request_id: `qa-${crypto.randomUUID()}`, task_id: taskId },
        "POST",
      );
      await refresh(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "QA run failed");
    } finally {
      setBusy(null);
    }
  }

  async function recordReview(event: FormEvent) {
    event.preventDefault();
    if (!taskId || !reviewSummary.trim()) return;
    setBusy("review");
    setError("");
    try {
      const next = await request<QAReport>(
        connection,
        "/qa-human-review",
        {
          request_id: `human-review-${crypto.randomUUID()}`,
          task_id: taskId,
          gate_id: "human_judgment",
          verdict: reviewVerdict,
          summary: reviewSummary.trim(),
          supporting_evidence_ids: [],
        },
        "POST",
      );
      setReviewSummary("");
      await refresh(next);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Human review failed",
      );
    } finally {
      setBusy(null);
    }
  }

  async function waive(event: FormEvent) {
    event.preventDefault();
    if (!taskId || !waiverGate || !waiverReason.trim()) return;
    setBusy("waive");
    setError("");
    try {
      const next = await request<QAReport>(
        connection,
        "/qa-waive",
        {
          request_id: `waiver-${crypto.randomUUID()}`,
          task_id: taskId,
          gate_id: waiverGate,
          reason: waiverReason.trim(),
        },
        "POST",
      );
      setWaiverGate("");
      setWaiverReason("");
      await refresh(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gate waiver failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="qa-workspace">
      <section className="panel qa-overview">
        <div className="section-heading">
          <div>
            <h2>Quality gates</h2>
            <span className="muted">
              Evidence class, authority, and rationale remain separate
            </span>
          </div>
          <button
            className="primary"
            onClick={() => void runQA()}
            disabled={!taskId || busy !== null}
          >
            {busy === "run" ? "Running checks…" : "Run deterministic gates"}
          </button>
        </div>
        <div className="qa-task-control">
          <label>
            Task under review
            <select
              value={taskId}
              onChange={(event) => {
                setTaskId(event.target.value);
                setWaiverGate("");
                setError("");
              }}
            >
              {snapshot.tasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        {report.data && (
          <>
            <div className="qa-metrics">
              <Metric label="Completion" value={report.data.completion_state} />
              <Metric
                label="Required"
                value={report.data.required_gate_count}
              />
              <Metric label="Passed" value={report.data.passed_gate_count} />
              <Metric label="Waived" value={report.data.waived_gate_count} />
            </div>
            <div
              className={`qa-verdict qa-verdict-${report.data.completion_state}`}
            >
              <Status state={report.data.completion_state} />
              <strong>{selectedTask?.title}</strong>
              <p>{report.data.explanation}</p>
            </div>
          </>
        )}
        {report.isPending && <p role="status">Assembling QA report…</p>}
        {(error || report.error) && (
          <p className="error" role="alert">
            {error || report.error?.message}
          </p>
        )}
      </section>

      <section className="panel qa-gates-panel">
        <div className="qa-filter-row" aria-label="QA filters">
          {(["all", "ui", "engineering"] as const).map((item) => (
            <button
              key={item}
              aria-pressed={discipline === item}
              onClick={() => setDiscipline(item)}
            >
              {item === "all" ? "All disciplines" : item}
            </button>
          ))}
          <label className="qa-required-filter">
            <input
              type="checkbox"
              checked={requiredOnly}
              onChange={(event) => setRequiredOnly(event.target.checked)}
            />
            Required only
          </label>
        </div>
        <div className="qa-gate-list">
          {shownGates.map((item) => {
            const evaluation = item.latest_evaluation_id
              ? evaluationById.get(item.latest_evaluation_id)
              : undefined;
            const evidence = (item.evidence_ids ?? []).flatMap((id) => {
              const record = evidenceById.get(id);
              return record ? [record] : [];
            });
            return (
              <article key={item.gate.gate_id} className="qa-gate-card">
                <div className="qa-gate-heading">
                  <div>
                    <span className="eyebrow">
                      {item.gate.discipline} ·{" "}
                      {item.required ? "required" : "optional"}
                    </span>
                    <h3>{item.gate.title}</h3>
                  </div>
                  <Status state={item.state} />
                </div>
                <p>{item.explanation}</p>
                <div className="qa-evidence-classes">
                  {item.gate.required_evidence_classes.map((evidenceClass) => (
                    <span key={evidenceClass}>{evidenceClass}</span>
                  ))}
                  {item.gate.requires_runtime_capture && (
                    <span>runtime required</span>
                  )}
                  {item.gate.requires_independent_verification && (
                    <span>independent verification</span>
                  )}
                </div>
                {evaluation && (
                  <p className="muted">
                    {evaluation.evaluator_id} · {evaluation.authority} authority
                    · {new Date(evaluation.evaluated_at).toLocaleString()}
                  </p>
                )}
                {evidence.map((record) => (
                  <details key={record.evidence_id}>
                    <summary>
                      {record.evidence_class} · {record.summary}
                    </summary>
                    <pre>
                      {JSON.stringify(
                        { evidence: record, evaluation },
                        null,
                        2,
                      )}
                    </pre>
                  </details>
                ))}
                {item.required &&
                  !["passed", "waived"].includes(item.state) && (
                    <button
                      className="text-button"
                      onClick={() => setWaiverGate(item.gate.gate_id)}
                    >
                      Request explicit waiver →
                    </button>
                  )}
              </article>
            );
          })}
        </div>
      </section>

      <div className="qa-actions">
        <form className="panel" onSubmit={(event) => void recordReview(event)}>
          <p className="eyebrow">HUMAN EVIDENCE</p>
          <h2>Director judgment</h2>
          <p className="muted">
            A rejection overrides automated passes. An observation stays
            inconclusive.
          </p>
          <label>
            Verdict
            <select
              value={reviewVerdict}
              onChange={(event) =>
                setReviewVerdict(
                  event.target.value as "approved" | "rejected" | "observation",
                )
              }
            >
              <option value="observation">Observation</option>
              <option value="approved">Approve</option>
              <option value="rejected">Reject</option>
            </select>
          </label>
          <label>
            Review note
            <textarea
              value={reviewSummary}
              onChange={(event) => setReviewSummary(event.target.value)}
              placeholder="What did you observe, accept, or reject?"
            />
          </label>
          <button
            type="submit"
            disabled={busy !== null || !taskId || !reviewSummary.trim()}
          >
            {busy === "review" ? "Recording…" : "Record human evidence"}
          </button>
        </form>

        <form className="panel" onSubmit={(event) => void waive(event)}>
          <p className="eyebrow">AUDITED EXCEPTION</p>
          <h2>Gate waiver</h2>
          <p className="muted">
            Waivers satisfy one required gate but remain explicit in project
            history.
          </p>
          <label>
            Required gate
            <select
              value={waiverGate}
              onChange={(event) => setWaiverGate(event.target.value)}
            >
              <option value="">Select a gate</option>
              {(report.data?.gates ?? [])
                .filter((item) => item.required && item.state !== "passed")
                .map((item) => (
                  <option key={item.gate.gate_id} value={item.gate.gate_id}>
                    {item.gate.title}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Waiver rationale
            <textarea
              value={waiverReason}
              onChange={(event) => setWaiverReason(event.target.value)}
              placeholder="Why is this gate being waived for this task?"
            />
          </label>
          <button
            type="submit"
            disabled={
              busy !== null || !taskId || !waiverGate || !waiverReason.trim()
            }
          >
            {busy === "waive" ? "Recording…" : "Record Director waiver"}
          </button>
        </form>
      </div>
    </div>
  );
}

function RuntimeEvidencePanel({
  snapshot,
  connection,
}: {
  snapshot: ProjectSnapshot;
  connection: Connection;
}) {
  const client = useQueryClient();
  const initialTask =
    snapshot.tasks.find((task) =>
      `${task.title} ${task.objective}`.toLowerCase().includes("dropdown"),
    ) ?? snapshot.tasks.find((task) => task.state === "RUNNING");
  const [taskId, setTaskId] = useState(
    initialTask?.task_id ?? snapshot.tasks[0]?.task_id ?? "",
  );
  const [nodePath, setNodePath] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [latest, setLatest] = useState<RuntimeCaptureResult | null>(null);
  const requestId = useRef(`capture-${crypto.randomUUID()}`);
  const inspection = useQuery({
    queryKey: ["engine-inspection", snapshot.project.project.id, taskId],
    queryFn: () =>
      request<EngineProjectInspection>(
        connection,
        `/engine-inspection?task_id=${encodeURIComponent(taskId)}`,
      ),
    enabled: !!taskId,
  });

  useEffect(() => {
    const nodes = inspection.data?.ui_nodes ?? [];
    if (!nodes.some((node) => node.path === nodePath)) {
      setNodePath(nodes[0]?.path ?? "");
    }
  }, [inspection.data, nodePath]);

  async function capture() {
    if (!taskId || !nodePath) return;
    setBusy(true);
    setError("");
    try {
      const result = await request<RuntimeCaptureResult>(
        connection,
        "/runtime-capture",
        { request_id: requestId.current, task_id: taskId, node_path: nodePath },
        "POST",
      );
      setLatest(result);
      requestId.current = `capture-${crypto.randomUUID()}`;
      await client.invalidateQueries({ queryKey: ["project"] });
      await client.invalidateQueries({ queryKey: ["events"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Runtime capture failed");
    } finally {
      setBusy(false);
    }
  }

  const evidence = (snapshot.evidence ?? []).filter(
    (item) => item.task_id === taskId,
  );
  const evaluations = snapshot.evaluations ?? [];
  const shownEvidence = latest
    ? [
        latest.evidence,
        ...evidence.filter(
          (item) => item.evidence_id !== latest.evidence.evidence_id,
        ),
      ]
    : [...evidence].reverse();

  return (
    <section className="panel runtime-evidence">
      <div className="section-heading">
        <div>
          <h2>Godot vertical slice</h2>
          <span className="muted">
            Inspect → build → run → capture → evaluate
          </span>
        </div>
        <button
          className="primary"
          disabled={busy || inspection.isPending || !nodePath}
          onClick={() => void capture()}
        >
          {busy ? "Running Godot…" : "Capture runtime evidence"}
        </button>
      </div>
      <div className="runtime-controls">
        <label>
          Registered task
          <select
            value={taskId}
            onChange={(event) => {
              setTaskId(event.target.value);
              setLatest(null);
            }}
          >
            {snapshot.tasks.map((task) => (
              <option key={task.task_id} value={task.task_id}>
                {task.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Inspected UI element
          <select
            value={nodePath}
            onChange={(event) => setNodePath(event.target.value)}
            disabled={!inspection.data?.ui_nodes.length}
          >
            {(inspection.data?.ui_nodes ?? []).map((node) => (
              <option key={`${node.scene}:${node.path}`} value={node.path}>
                {node.path}
              </option>
            ))}
          </select>
        </label>
      </div>
      {inspection.data && (
        <div className="runtime-metrics">
          <Metric label="Adapter" value={inspection.data.adapter.version} />
          <Metric label="Godot" value={inspection.data.engine_version} />
          <Metric label="UI nodes" value={inspection.data.ui_nodes.length} />
          <Metric
            label="Approved assets"
            value={inspection.data.approved_assets.length}
          />
        </div>
      )}
      {inspection.isPending && <p role="status">Inspecting Godot project…</p>}
      {(error || inspection.error) && (
        <p className="error" role="alert">
          {error || inspection.error?.message}
        </p>
      )}
      {shownEvidence.length > 0 ? (
        <div className="evidence-grid">
          {shownEvidence.map((item) => {
            const evaluation =
              latest?.evidence.evidence_id === item.evidence_id
                ? latest.evaluation
                : evaluations.find((record) =>
                    record.evidence_ids.includes(item.evidence_id),
                  );
            return (
              <article key={item.evidence_id} className="evidence-card">
                {item.source.media_type === "image/png" && (
                  <Image
                    src={`/api/daemon/evidence-file?evidence_id=${encodeURIComponent(item.evidence_id)}`}
                    alt={item.summary}
                    width={1600}
                    height={900}
                    sizes="(max-width: 1200px) 100vw, 60vw"
                    unoptimized
                  />
                )}
                <div>
                  <Status state={evaluation?.result ?? item.evidence_class} />
                  <h3>{item.summary}</h3>
                  <p className="muted">
                    {item.capture_origin} · {item.source.locator ?? "artifact"}{" "}
                    · {new Date(item.captured_at).toLocaleString()}
                  </p>
                  {evaluation && <p>{evaluation.rationale}</p>}
                  <details>
                    <summary>Inspect evidence record</summary>
                    <pre>{JSON.stringify({ item, evaluation }, null, 2)}</pre>
                  </details>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="muted">
          No runtime evidence is recorded for this task yet.
        </p>
      )}
    </section>
  );
}

function AgentRegistryPanel({
  snapshot,
  registry,
  loading,
  error,
  connection,
  refreshed,
}: {
  snapshot: ProjectSnapshot;
  registry: AgentRegistrySnapshot | undefined;
  loading: boolean;
  error: string | null;
  connection: Connection;
  refreshed: () => void;
}) {
  const [recruitingTask, setRecruitingTask] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const recruitments = snapshot.recruitments ?? [];
  const unresolved = (snapshot.plans ?? []).flatMap((plan) =>
    plan.assignments
      .filter((assignment) => assignment.agent === null)
      .map((assignment) => ({
        assignment,
        task: snapshot.tasks.find(
          (task) => task.task_id === assignment.task_id,
        ),
      })),
  );
  const entries = registry?.entries ?? [];
  const probation = entries.filter(
    (entry) => entry.lifecycle === "probation",
  ).length;
  const eligible = entries.filter(
    (entry) => entry.qa_decision_role === "eligible",
  ).length;

  async function recruit(taskId: string) {
    setRecruitingTask(taskId);
    setActionError(null);
    setNotice(null);
    try {
      const result = await request<RecruitmentRecord>(
        connection,
        "/recruit",
        {
          request_id: `recruit-${Date.now()}`,
          task_id: taskId,
        },
        "POST",
      );
      setNotice(
        result.state === "probation"
          ? `${result.candidate.name} passed the audition and entered probation.`
          : `${result.candidate.name} was ${result.state}.`,
      );
      refreshed();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Recruitment failed",
      );
    } finally {
      setRecruitingTask(null);
    }
  }

  return (
    <div className="registry-layout">
      <section className="panel registry-hero">
        <div>
          <p className="eyebrow">PHASE 10 · RECRUITER</p>
          <h2>Capability registry</h2>
          <p className="muted">
            Missing expertise becomes an explicit gap, a sandbox audition, and a
            probation decision. Capability claims are never fabricated.
          </p>
        </div>
        <div className="registry-metrics" aria-label="Registry totals">
          <Metric label="Global agents" value={entries.length} />
          <Metric label="Probation" value={probation} />
          <Metric label="QA eligible" value={eligible} />
          <Metric label="Open gaps" value={unresolved.length} />
        </div>
      </section>

      <section className="panel qa-authority-note">
        <span className="eyebrow">QA AUTHORITY BOUNDARY</span>
        <strong>
          Recruitment changes evaluator availability, not evidence truth.
        </strong>
        <p>
          Probationary specialists are advisory and require independent
          verification. Automated evaluation cannot override a Director
          rejection.
        </p>
      </section>

      {loading && <div className="empty">Loading the global registry…</div>}
      {(error || actionError) && (
        <p className="error" role="alert">
          {error ?? actionError}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}

      <div className="registry-columns">
        <section className="panel">
          <div className="section-heading">
            <h2>Capability gaps</h2>
            <span className="muted">GM-detected · project scoped</span>
          </div>
          {unresolved.length ? (
            <div className="gap-list">
              {unresolved.map(({ assignment, task }) => {
                const existing = recruitments.find(
                  (item) => item.task_id === assignment.task_id,
                );
                return (
                  <article key={assignment.task_id} className="gap-card">
                    <div>
                      <Status state={existing?.state ?? "CAPABILITY GAP"} />
                      <h3>{task?.title ?? assignment.task_id}</h3>
                      <p>
                        {assignment.missing_capabilities
                          .map((item) => item.replaceAll("_", " "))
                          .join(", ")}
                      </p>
                    </div>
                    {!existing && (
                      <button
                        className="primary"
                        disabled={recruitingTask !== null}
                        onClick={() => void recruit(assignment.task_id)}
                      >
                        {recruitingTask === assignment.task_id
                          ? "Auditioning…"
                          : "Recruit specialist"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty">No unresolved capability gaps.</div>
          )}
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>Recruitment history</h2>
            <span className="muted">Canonical project events</span>
          </div>
          {recruitments.length ? (
            <div className="recruitment-list">
              {recruitments.map((item) => (
                <article key={item.recruitment_id}>
                  <div className="section-heading">
                    <div>
                      <Status state={item.state} />
                      <h3>{item.candidate.name}</h3>
                    </div>
                    <time dateTime={item.updated_at}>
                      {new Date(item.updated_at).toLocaleString()}
                    </time>
                  </div>
                  <p>{item.gap.reason}</p>
                  <dl className="details">
                    <dt>Adjacent roster</dt>
                    <dd>{item.adjacent_agent_ids.join(", ") || "None"}</dd>
                    <dt>Trusted tools</dt>
                    <dd>
                      {item.tool_discoveries
                        .filter((tool) => tool.decision === "trusted")
                        .map((tool) => tool.tool_id)
                        .join(", ") || "No tool admitted"}
                    </dd>
                    <dt>Audition</dt>
                    <dd>
                      {item.audition
                        ? `${item.audition.result} · ${item.audition.review.recommendation}`
                        : "Pending"}
                    </dd>
                  </dl>
                  {item.audition && (
                    <details>
                      <summary>Inspect audition scorecard</summary>
                      <ul className="scorecard">
                        {item.audition.review.dimensions.map((dimension) => (
                          <li key={dimension.dimension}>
                            <Status state={dimension.result} />
                            <span>
                              {dimension.dimension.replaceAll("_", " ")}
                            </span>
                            <small>{dimension.detail}</small>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">
              No specialists have been auditioned for this project.
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="section-heading">
          <h2>Global roster</h2>
          <span className="muted">
            Reusable definitions · project memory excluded
          </span>
        </div>
        <div className="registry-table-wrap">
          <table className="registry-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Lifecycle</th>
                <th>QA role</th>
                <th>Capabilities</th>
                <th>Auditions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.agent.agent_id}>
                  <td>
                    <strong>{entry.agent.name}</strong>
                    <span>{entry.agent.description}</span>
                  </td>
                  <td>
                    <Status state={entry.lifecycle} />
                  </td>
                  <td>{entry.qa_decision_role}</td>
                  <td>
                    {entry.agent.capabilities
                      .map((item) => item.replaceAll("_", " "))
                      .join(", ")}
                  </td>
                  <td>{(entry.audition_ids ?? []).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Workers({
  snapshot,
  connection,
}: {
  snapshot: ProjectSnapshot;
  connection: Connection;
}) {
  const client = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loginUrl, setLoginUrl] = useState("");
  const account = useQuery({
    queryKey: ["worker-account"],
    queryFn: () =>
      request<{ state: string; detail?: string }>(
        connection,
        "/worker-account",
      ),
    refetchInterval: 5000,
  });
  async function command(path: string, body?: unknown) {
    setBusy(true);
    setError("");
    try {
      const response = await request<{ url?: string }>(
        connection,
        path,
        body,
        "POST",
      );
      if (response.url) setLoginUrl(response.url);
      await client.invalidateQueries({ queryKey: ["project"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Worker request failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Codex workers</h2>
      <p role="status">ChatGPT session: {account.data?.state ?? "checking"}</p>
      {(error || account.error || account.data?.detail) && (
        <p role="alert" className="error">
          {error || account.error?.message || account.data?.detail}
        </p>
      )}
      {account.data?.state === "login_required" && (
        <button disabled={busy} onClick={() => void command("/worker-login")}>
          Sign in with ChatGPT
        </button>
      )}
      {loginUrl && (
        <a href={loginUrl} target="_blank" rel="noreferrer">
          Continue ChatGPT sign-in
        </a>
      )}
      <p className="muted">
        Read-only analysis uses your Codex session. Results remain attached to
        the task; they do not mark the task complete.
      </p>
      {snapshot.tasks.map((task) => {
        const worker = (snapshot.workers ?? []).find(
          (item) => item.task_id === task.task_id,
        );
        const running = worker?.state === "running";
        return (
          <article key={task.task_id} className="panel">
            <h3>{task.title}</h3>
            <p>{worker?.detail ?? "No worker started"}</p>
            {worker && (
              <p className="mono">
                {worker.state} · {worker.thread_id}
              </p>
            )}
            <button
              disabled={
                busy ||
                account.data?.state !== "ready" ||
                (snapshot.workers ?? []).some(
                  (item) => item.state === "running",
                )
              }
              onClick={() =>
                void command("/workers", {
                  task_id: task.task_id,
                  worker_id: worker?.worker_id ?? null,
                })
              }
            >
              {worker ? "Resume analysis" : "Run analysis"}
            </button>
            {running && (
              <button
                disabled={busy}
                onClick={() =>
                  void command("/worker-interrupt", {
                    task_id: task.task_id,
                    worker_id: worker.worker_id,
                  })
                }
              >
                Interrupt worker
              </button>
            )}
            {worker?.result && (
              <>
                <h4>{worker.result.summary}</h4>
                <ul>
                  {worker.result.findings.map((finding, index) => (
                    <li key={index}>{finding}</li>
                  ))}
                </ul>
                <h4>Next steps</h4>
                <ul>
                  {worker.result.next_steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </>
            )}
          </article>
        );
      })}
      {!snapshot.tasks.length && (
        <p>Propose a task to run your first analysis.</p>
      )}
    </section>
  );
}

function formatCapacity(bytes: number | null | undefined) {
  if (!bytes) return "Unknown";
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function routeLabel(route: ModelRoutingRecord["selected_route"]) {
  return {
    deterministic_tool: "Deterministic tool",
    local_ollama: "Local Ollama",
    codex_authenticated: "Authenticated Codex",
    paid_provider: "Paid provider",
    wait_for_codex: "Wait for Codex",
  }[route];
}

function BenchmarkHistory({ records }: { records: ModelBenchmark[] }) {
  if (!records.length) {
    return (
      <div className="empty model-empty">
        No representative local benchmark has been recorded for this task.
      </div>
    );
  }
  return (
    <div className="model-history">
      {records
        .slice()
        .reverse()
        .map((benchmark) => (
          <article key={benchmark.benchmark_id} className="model-history-row">
            <div>
              <strong>{benchmark.model_name}</strong>
              <span className="muted">
                {benchmark.prompt_tokens} in · {benchmark.completion_tokens} out
                · {benchmark.output_channel} channel
              </span>
            </div>
            <div>
              <span className={`route-state ${benchmark.result}`}>
                {benchmark.result}
              </span>
              <span className="mono">
                {(benchmark.contract_score * 100).toFixed(0)}% ·{" "}
                {(benchmark.latency_ms / 1000).toFixed(1)}s
              </span>
            </div>
          </article>
        ))}
    </div>
  );
}

function RoutingDecision({ record }: { record: ModelRoutingRecord }) {
  return (
    <>
      <div className="model-decision">
        <div>
          <span className="eyebrow">SELECTED ROUTE</span>
          <h3>{routeLabel(record.selected_route)}</h3>
          <p className="mono">
            {record.selected_model_name ??
              record.selected_provider_id ??
              "No model"}
          </p>
        </div>
        <p>{record.reason}</p>
      </div>
      <div className="route-candidates">
        {record.candidates.map((candidate) => (
          <article
            key={candidate.route}
            className={`route-candidate ${candidate.viable ? "viable" : "blocked"}`}
          >
            <div className="section-heading">
              <strong>{routeLabel(candidate.route)}</strong>
              <span
                className={`route-state ${candidate.viable ? "passed" : "missing"}`}
              >
                {candidate.viable ? "viable" : "unavailable"}
              </span>
            </div>
            <p>{candidate.reason}</p>
            <dl className="route-facts">
              <dt>Expected quality</dt>
              <dd>{candidate.expected_quality}</dd>
              <dt>Confidence</dt>
              <dd>{(candidate.confidence * 100).toFixed(0)}%</dd>
              <dt>Expected runtime</dt>
              <dd>
                {candidate.expected_runtime_ms == null
                  ? "Not measured"
                  : `${(candidate.expected_runtime_ms / 1000).toFixed(1)}s`}
              </dd>
              <dt>External cost</dt>
              <dd>
                {candidate.expected_external_cost_cents == null
                  ? "Unknown"
                  : `$${(candidate.expected_external_cost_cents / 100).toFixed(2)}`}
              </dd>
              <dt>External cost avoided</dt>
              <dd>
                $
                {(
                  (candidate.expected_external_cost_avoided_cents ?? 0) / 100
                ).toFixed(2)}
              </dd>
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}

function ModelRouterPanel({
  snapshot,
  environment,
  loading,
  error: environmentError,
  connection,
}: {
  snapshot: ProjectSnapshot;
  environment: ModelEnvironment | undefined;
  loading: boolean;
  error: string | null;
  connection: Connection;
}) {
  const client = useQueryClient();
  const [taskId, setTaskId] = useState(snapshot.tasks[0]?.task_id ?? "");
  const [modelName, setModelName] = useState("");
  const [urgency, setUrgency] = useState<"low" | "normal" | "high">("normal");
  const [busy, setBusy] = useState<
    "benchmark" | "recommend" | "route" | "scan" | null
  >(null);
  const [recommendation, setRecommendation] =
    useState<LocalModelRecommendation>();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const models = environment?.models.models ?? [];
  const selectedModel = modelName || models[0]?.name || "";
  const benchmarks = (snapshot.model_benchmarks ?? []).filter(
    (benchmark) => benchmark.task_id === taskId,
  );
  const routings = (snapshot.model_routing_records ?? []).filter(
    (routing) => routing.task_id === taskId,
  );
  const latestRouting = routings.at(-1);

  async function refreshProject() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["project"] }),
      client.invalidateQueries({ queryKey: ["events"] }),
    ]);
  }

  async function scan() {
    setBusy("scan");
    setError("");
    try {
      await client.invalidateQueries({ queryKey: ["model-environment"] });
      setNotice("Local hardware and Ollama inventory refreshed.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Inventory refresh failed",
      );
    } finally {
      setBusy(null);
    }
  }

  async function benchmark() {
    setBusy("benchmark");
    setError("");
    setNotice("");
    try {
      const result = await request<ModelBenchmark>(
        connection,
        "/model-benchmark",
        {
          request_id: `model-benchmark-${crypto.randomUUID()}`,
          task_id: taskId,
          model_name: selectedModel,
        },
        "POST",
      );
      await refreshProject();
      setNotice(
        `${result.model_name} benchmark ${result.result} at ${(result.contract_score * 100).toFixed(0)}%.`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Local benchmark failed",
      );
    } finally {
      setBusy(null);
    }
  }

  async function recommend() {
    setBusy("recommend");
    setError("");
    setNotice("");
    try {
      const result = await request<LocalModelRecommendation>(
        connection,
        "/model-recommend",
        {
          request_id: `model-recommend-${crypto.randomUUID()}`,
          task_id: taskId,
        },
        "POST",
      );
      setRecommendation(result);
      setNotice(
        result.action === "install"
          ? `Install candidate found: ${result.recommended_model_name}. No download was started.`
          : result.action === "keep_installed"
            ? `${result.recommended_model_name} remains the strongest hardware/task fit.`
            : "No install recommendation was made without verified catalog evidence.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Model discovery failed",
      );
    } finally {
      setBusy(null);
    }
  }

  async function explainRoute() {
    setBusy("route");
    setError("");
    setNotice("");
    try {
      const result = await request<ModelRoutingRecord>(
        connection,
        "/model-route",
        {
          request_id: `model-route-${crypto.randomUUID()}`,
          task_id: taskId,
          urgency,
        },
        "POST",
      );
      await refreshProject();
      setNotice(`Routing record saved: ${routeLabel(result.selected_route)}.`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Model routing failed",
      );
    } finally {
      setBusy(null);
    }
  }

  const gpu = environment?.hardware.graphics?.[0];
  return (
    <div className="model-router">
      <section className="panel model-overview">
        <div className="section-heading">
          <div>
            <h2>Local Model Expert</h2>
            <p className="muted">
              Machine facts are live. Benchmarks and routing decisions are
              project history.
            </p>
          </div>
          <button disabled={busy !== null} onClick={() => void scan()}>
            {busy === "scan" ? "Scanning…" : "Refresh inventory"}
          </button>
        </div>
        {loading && <p role="status">Inspecting local hardware and Ollama…</p>}
        {(environmentError || error) && (
          <p className="error" role="alert">
            {error || environmentError}
          </p>
        )}
        {environment && (
          <>
            <div className="metrics model-metrics">
              <Metric
                label="System RAM"
                value={formatCapacity(environment.hardware.ram_bytes)}
              />
              <Metric label="Primary GPU" value={gpu?.name ?? "Not detected"} />
              <Metric
                label="GPU memory"
                value={formatCapacity(gpu?.memory_bytes)}
              />
              <Metric label="Local models" value={models.length} />
            </div>
            <p className="model-machine">
              <strong>{environment.hardware.cpu}</strong>
              <span className="muted">
                {environment.hardware.operating_system} ·{" "}
                {environment.hardware.logical_core_count} logical cores · Ollama{" "}
                {environment.models.version ?? environment.models.state}
              </span>
            </p>
          </>
        )}
      </section>

      <section className="panel model-controls">
        <div>
          <span className="eyebrow">REPRESENTATIVE TASK</span>
          <h2>Choose with evidence</h2>
        </div>
        <div className="model-control-grid">
          <label>
            Task contract
            <select
              value={taskId}
              onChange={(event) => {
                setTaskId(event.target.value);
                setRecommendation(undefined);
              }}
            >
              {snapshot.tasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Local model
            <select
              value={selectedModel}
              onChange={(event) => setModelName(event.target.value)}
            >
              {!models.length && <option value="">No fitting model</option>}
              {models.map((model) => (
                <option
                  key={model.digest}
                  value={model.name}
                  disabled={!model.fits_memory}
                >
                  {model.name} · {formatCapacity(model.size_bytes)}
                  {model.fits_memory ? "" : " · exceeds memory"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Urgency
            <select
              value={urgency}
              onChange={(event) =>
                setUrgency(event.target.value as "low" | "normal" | "high")
              }
            >
              <option value="low">Low · waiting is acceptable</option>
              <option value="normal">Normal · quality and cost first</option>
              <option value="high">High · prefer ready paths</option>
            </select>
          </label>
        </div>
        <div className="model-actions">
          <button
            disabled={busy !== null || !taskId}
            onClick={() => void recommend()}
          >
            {busy === "recommend"
              ? "Checking catalog…"
              : "Check install options"}
          </button>
          <button
            disabled={busy !== null || !taskId || !selectedModel}
            onClick={() => void benchmark()}
          >
            {busy === "benchmark" ? "Benchmarking…" : "Benchmark local model"}
          </button>
          <button
            className="primary"
            disabled={busy !== null || !taskId}
            onClick={() => void explainRoute()}
          >
            {busy === "route" ? "Routing…" : "Explain recommended route"}
          </button>
        </div>
        {notice && <p role="status">{notice}</p>}
      </section>

      {recommendation && (
        <section className="panel model-recommendation">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LIVE CATALOG CHECK</span>
              <h2>
                {recommendation.action === "install"
                  ? `Install ${recommendation.recommended_model_name}`
                  : recommendation.action === "keep_installed"
                    ? "Best fit is already installed"
                    : "No verified install recommendation"}
              </h2>
            </div>
            <span
              className={`route-state ${recommendation.catalog_state === "live" ? "passed" : "missing"}`}
            >
              {recommendation.catalog_state}
            </span>
          </div>
          <p>{recommendation.reason}</p>
          {recommendation.candidate && (
            <dl className="route-facts recommendation-facts">
              <dt>Recommended model</dt>
              <dd>{recommendation.candidate.name}</dd>
              <dt>Estimated footprint</dt>
              <dd>
                {formatCapacity(recommendation.candidate.estimated_size_bytes)}
              </dd>
              <dt>Hardware mode</dt>
              <dd>{recommendation.candidate.memory_tier.replace("_", " ")}</dd>
              <dt>Task suitability</dt>
              <dd>
                {(recommendation.candidate.suitability_score * 100).toFixed(0)}%
              </dd>
              <dt>Catalog evidence</dt>
              <dd>
                <a
                  href={recommendation.candidate.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ollama model page ↗
                </a>
              </dd>
              <dt>Checked</dt>
              <dd>
                {new Date(recommendation.catalog_checked_at).toLocaleString()}
              </dd>
            </dl>
          )}
          {recommendation.install_command && (
            <div className="install-command">
              <span className="eyebrow">
                RECOMMENDATION ONLY · DOWNLOAD NOT STARTED
              </span>
              <code>{recommendation.install_command}</code>
            </div>
          )}
          {!!recommendation.alternatives?.length && (
            <div className="model-alternatives">
              <span className="eyebrow">ALTERNATIVES CHECKED</span>
              {(recommendation.alternatives ?? []).map((candidate) => (
                <div key={candidate.name}>
                  <strong>{candidate.name}</strong>
                  <span className="muted">
                    {candidate.installed ? "installed" : "available"} ·{" "}
                    {candidate.memory_tier.replace("_", " ")} ·{" "}
                    {(candidate.suitability_score * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {latestRouting ? (
        <section className="panel">
          <div className="section-heading">
            <h2>Latest routing decision</h2>
            <span className="mono">{latestRouting.routing_id}</span>
          </div>
          <RoutingDecision record={latestRouting} />
        </section>
      ) : (
        <section className="panel empty model-empty">
          <h2>No routing record yet</h2>
          <p>
            Ask the router to compare deterministic, local, Codex, and paid
            paths.
          </p>
        </section>
      )}

      <section className="panel">
        <div className="section-heading">
          <h2>Benchmark history</h2>
          <span className="muted">
            {benchmarks.length} recorded for this task
          </span>
        </div>
        <BenchmarkHistory records={benchmarks} />
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Installed local models</h2>
          <span
            className={`route-state ${environment?.models.state === "available" ? "passed" : "missing"}`}
          >
            {environment?.models.state ?? "loading"}
          </span>
        </div>
        <div className="local-model-grid">
          {models.map((model) => (
            <article key={model.digest} className="local-model-card">
              <div className="section-heading">
                <h3>{model.name}</h3>
                <span
                  className={`route-state ${model.fits_memory ? "passed" : "missing"}`}
                >
                  {model.fits_memory ? "fits" : "too large"}
                </span>
              </div>
              <p className="mono">
                {model.parameter_size ?? "Unknown size"} ·{" "}
                {model.quantization_level ?? "Unknown quantization"} ·{" "}
                {model.digest.slice(0, 12)}
              </p>
              <dl className="route-facts">
                <dt>Stored size</dt>
                <dd>{formatCapacity(model.size_bytes)}</dd>
                <dt>Context</dt>
                <dd>{model.context_limit?.toLocaleString() ?? "Unknown"}</dd>
                <dt>Modalities</dt>
                <dd>{model.modalities.join(", ")}</dd>
                <dt>Tool support</dt>
                <dd>{model.tool_support ? "Reported" : "Not reported"}</dd>
              </dl>
            </article>
          ))}
          {!models.length && (
            <div className="empty model-empty">
              {environment?.models.detail ??
                "Ollama inventory is not available."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Settings({
  snapshot,
  connection,
  saved,
}: {
  snapshot: ProjectSnapshot;
  connection: Connection;
  saved: () => void;
}) {
  const [authority, setAuthority] = useState(snapshot.policy.authority);
  const [proactivity, setProactivity] = useState(snapshot.policy.proactivity);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request(
        connection,
        "/policy",
        {
          request_id: `policy-${crypto.randomUUID()}`,
          expected_cursor: snapshot.cursor,
          policy: { ...snapshot.policy, authority, proactivity },
        },
        "PUT",
      );
      setNotice("Policy saved to project history.");
      saved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save policy");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel settings">
      <h2>Project policy</h2>
      <form onSubmit={(event) => void submit(event)}>
        <label>
          GM authority
          <select
            value={authority}
            onChange={(event) =>
              setAuthority(event.target.value as Policy["authority"])
            }
          >
            {Object.entries(policyLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          GM proactivity
          <select
            value={proactivity}
            onChange={(event) =>
              setProactivity(event.target.value as Policy["proactivity"])
            }
          >
            <option value="reactive">Reactive</option>
            <option value="balanced">Balanced</option>
            <option value="active">Active</option>
          </select>
        </label>
        <p className="muted">
          Authority controls execution permission. Proactivity controls which
          findings are surfaced. Mandatory human decisions still apply.
        </p>
        <dl className="details">
          <dt>Monthly external budget</dt>
          <dd>
            $
            {(
              (snapshot.policy.monthly_external_budget_cents ?? 2500) / 100
            ).toFixed(2)}
          </dd>
          <dt>Approval threshold</dt>
          <dd>
            $
            {((snapshot.policy.approval_threshold_cents ?? 100) / 100).toFixed(
              2,
            )}{" "}
            per action
          </dd>
          <dt>Provider hard caps</dt>
          <dd>Required · cannot be disabled</dd>
          <dt>Work attribution</dt>
          <dd>Registration or reconciliation required</dd>
        </dl>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        <button className="primary" disabled={busy}>
          {busy ? "Saving…" : "Save policy"}
        </button>
      </form>
    </section>
  );
}
