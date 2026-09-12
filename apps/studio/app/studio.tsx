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
  AgentKnowledgeCatalog,
  AgentDefinition,
  AgentRegistrySnapshot,
  ContextPackage,
  EngineProjectInspection,
  EventPage,
  InboxDecision,
  KnowledgeCatalog,
  LearningMaintenanceStatus,
  LocalModelRecommendation,
  ModelBenchmark,
  ModelEnvironment,
  ModelRoutingRecord,
  Policy,
  ProviderRegistry,
  ProductionDomainCatalog,
  ProductionDomainInspection,
  ProjectCatalog,
  ProjectOnboarding,
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
type View =
  | "Director Desk"
  | "Production"
  | "Disciplines"
  | "QA"
  | "Needs Oren"
  | "Workers"
  | "Network"
  | "Project Intelligence"
  | "Agents"
  | "Models"
  | "Providers"
  | "Activity"
  | "Settings";
const navigationGroups: ReadonlyArray<{
  label: string;
  items: ReadonlyArray<{ view: View; label?: string }>;
}> = [
  { label: "Overview", items: [{ view: "Director Desk" }] },
  {
    label: "Production",
    items: [
      { view: "Production" },
      { view: "Needs Oren" },
      { view: "QA" },
      { view: "Network", label: "Dependencies" },
    ],
  },
  {
    label: "Team",
    items: [
      { view: "Workers", label: "Agent work" },
      { view: "Agents" },
      { view: "Models" },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { view: "Project Intelligence", label: "Project understanding" },
      { view: "Disciplines", label: "Discipline checks" },
    ],
  },
  {
    label: "System",
    items: [{ view: "Providers" }, { view: "Activity" }, { view: "Settings" }],
  },
];
const viewLabels: Record<View, string> = {
  "Director Desk": "Director Desk",
  Production: "Production",
  Disciplines: "Discipline checks",
  QA: "QA",
  "Needs Oren": "Needs Oren",
  Workers: "Agent work",
  Network: "Dependencies",
  "Project Intelligence": "Project understanding",
  Agents: "Agents",
  Models: "Models",
  Providers: "Providers",
  Activity: "Activity",
  Settings: "Settings",
};
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
      path === "/pack-audition-run"
        ? 360000
        : path === "/runtime-capture" ||
            path === "/project-import" ||
            path === "/recruit" ||
            path === "/model-benchmark" ||
            path === "/model-recommend" ||
            path === "/production-domain-run"
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
  const agentKnowledge = useQuery({
    queryKey: ["agent-knowledge", activeProjectId],
    queryFn: () =>
      request<AgentKnowledgeCatalog>(connection, "/agent-knowledge"),
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
  const providers = useQuery({
    queryKey: ["providers", activeProjectId],
    queryFn: () => request<ProviderRegistry>(connection, "/providers"),
    enabled: view === "Providers" && !!activeProjectId,
  });
  const productionDomains = useQuery({
    queryKey: ["production-domains", activeProjectId],
    queryFn: () =>
      request<ProductionDomainCatalog>(connection, "/production-domains"),
    enabled: view === "Disciplines" && !!activeProjectId,
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
            void client.invalidateQueries({ queryKey: ["providers"] });
            void client.invalidateQueries({ queryKey: ["production-domains"] });
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
      setManagingProjects(false);
      await client.invalidateQueries({ queryKey: ["project"] });
      await client.invalidateQueries({ queryKey: ["events"] });
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
    <div className={`workspace ${selection ? "inspector-open" : ""}`}>
      <a className="skip-link" href="#studio-main">
        Skip to project content
      </a>
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
        <nav aria-label="Studio sections">
          {navigationGroups.map((group) => (
            <section className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              {group.items.map((item) => (
                <button
                  key={item.view}
                  aria-current={view === item.view ? "page" : undefined}
                  onClick={() => setView(item.view)}
                >
                  {item.label ?? item.view}
                </button>
              ))}
            </section>
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
            <span className="separator">/</span> {viewLabels[view]}
          </span>
        </header>
        <main className="desk" id="studio-main" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <p className="eyebrow">PRODUCTION WORKSPACE</p>
              <h1>{viewLabels[view]}</h1>
              <p className="muted">
                {view === "Director Desk"
                  ? "Intent, work, and the history behind every decision."
                  : descriptions[view]}
              </p>
            </div>
            {snapshot && view !== "Settings" && view !== "Director Desk" && (
              <button className="primary" onClick={() => setProposing(true)}>
                Add task manually
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
              {view === "Workers" && (
                <Workers snapshot={snapshot} connection={connection} />
              )}
              {view === "Director Desk" && (
                <>
                  <DirectorOverview
                    snapshot={snapshot}
                    events={events}
                    selectTask={selectTask}
                    selectEvent={(event) =>
                      setSelection({ type: "event", id: event.event_id })
                    }
                    navigate={setView}
                  />
                  <GMPanel
                    key={activeProjectId}
                    snapshot={snapshot}
                    connection={connection}
                    select={selectTask}
                  />
                </>
              )}
              {view === "Production" && (
                <>
                  <AgentNetwork
                    key={`agent-network-${activeProjectId}`}
                    snapshot={snapshot}
                    roster={agentRoster.data ?? []}
                    events={agentHistory.data?.events ?? []}
                    knowledge={agentKnowledge.data}
                    loading={
                      agentRoster.isPending ||
                      agentHistory.isPending ||
                      agentKnowledge.isPending
                    }
                    error={
                      agentRoster.error?.message ??
                      agentHistory.error?.message ??
                      agentKnowledge.error?.message ??
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
              {view === "Disciplines" && (
                <ProductionDomainsPanel
                  key={`domains-${activeProjectId}`}
                  snapshot={snapshot}
                  catalog={productionDomains.data}
                  loading={productionDomains.isPending}
                  error={productionDomains.error?.message ?? null}
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
              {view === "Providers" && (
                <ProviderPanel
                  key={`providers-${activeProjectId}`}
                  registry={providers.data}
                  loading={providers.isPending}
                  error={providers.error?.message ?? null}
                  connection={connection}
                  refreshed={() => {
                    void client.invalidateQueries({ queryKey: ["providers"] });
                    void client.invalidateQueries({ queryKey: ["project"] });
                    void client.invalidateQueries({ queryKey: ["events"] });
                  }}
                />
              )}
              {view === "Activity" && (
                <section className="panel">
                  <div className="section-heading">
                    <h2>Project history</h2>
                    <span className="muted">
                      Meaningful changes · newest first
                    </span>
                  </div>
                  {history.isError && (
                    <p className="error" role="alert">
                      {history.error.message}
                    </p>
                  )}
                  <EventList
                    events={events.slice().reverse()}
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
      {selection && (
        <aside className="inspector" aria-label="Inspector">
          <div className="section-heading">
            <h2>Details</h2>
            <button
              aria-label="Close details"
              onClick={() => setSelection(null)}
            >
              ×
            </button>
          </div>
          <div className="inspector-body">
            {selectedTask ? (
              <>
                <p className="eyebrow">PRODUCTION TASK</p>
                <h3>{selectedTask.title}</h3>
                <Status state={selectedTask.state ?? "PROPOSED"} />
                <p>{selectedTask.objective}</p>
                <dl className="details">
                  <dt>Specialist skills needed</dt>
                  <dd>
                    {selectedTask.required_capabilities
                      .map(humanizeIdentifier)
                      .join(", ")}
                  </dd>
                  <dt>Expected result</dt>
                  <dd>{selectedTask.deliverables.join("; ")}</dd>
                  <dt>Quality checks</dt>
                  <dd>
                    {selectedTask.required_evaluations
                      .map(humanizeIdentifier)
                      .join(", ")}
                  </dd>
                  <dt>Waiting on</dt>
                  <dd>
                    {selectedTask.dependency_ids.length
                      ? selectedTask.dependency_ids
                          .map(
                            (id) =>
                              tasks.find((task) => task.task_id === id)
                                ?.title ?? id,
                          )
                          .join(", ")
                      : "None"}
                  </dd>
                </dl>
                <details className="technical-details">
                  <summary>Technical task record</summary>
                  <pre>{JSON.stringify(selectedTask, null, 2)}</pre>
                </details>
              </>
            ) : selectedEvent ? (
              <>
                <p className="eyebrow">PROJECT CHANGE</p>
                <h3>{eventLabel(selectedEvent.event_type)}</h3>
                <p>
                  {actorLabel(selectedEvent.actor_id)} ·{" "}
                  {new Date(selectedEvent.timestamp).toLocaleString()}
                </p>
                <details className="technical-details">
                  <summary>Technical event record</summary>
                  <pre>{JSON.stringify(selectedEvent, null, 2)}</pre>
                </details>
              </>
            ) : (
              <div className="inspector-empty">
                <h3>This item is no longer in the current view.</h3>
                <p>Close Details and select another task or project change.</p>
              </div>
            )}
          </div>
        </aside>
      )}
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

const taskStatePriority: Record<string, number> = {
  NEEDS_HUMAN: 0,
  BLOCKED: 1,
  BLOCKED_KNOWLEDGE: 1,
  RUNNING: 2,
  READY: 3,
  QUEUED: 4,
  REVIEW: 5,
  PROPOSED: 6,
};

function DirectorOverview({
  snapshot,
  events,
  selectTask,
  selectEvent,
  navigate,
}: {
  snapshot: ProjectSnapshot;
  events: HistoryEvent[];
  selectTask: (id: string) => void;
  selectEvent: (event: HistoryEvent) => void;
  navigate: (view: View) => void;
}) {
  const pendingDecisions = (snapshot.decisions ?? []).filter(
    (decision) => !decision.selected_option,
  );
  const blockedTasks = snapshot.tasks.filter((task) =>
    ["BLOCKED", "BLOCKED_KNOWLEDGE", "NEEDS_HUMAN"].includes(task.state ?? ""),
  );
  const currentTasks = snapshot.tasks
    .filter((task) => (task.state ?? "PROPOSED") in taskStatePriority)
    .slice()
    .sort(
      (left, right) =>
        (taskStatePriority[left.state ?? "PROPOSED"] ?? 99) -
        (taskStatePriority[right.state ?? "PROPOSED"] ?? 99),
    )
    .slice(0, 6);
  const workingCount = snapshot.tasks.filter((task) =>
    ["RUNNING", "READY", "QUEUED"].includes(task.state ?? ""),
  ).length;
  const reviewCount = snapshot.tasks.filter(
    (task) => task.state === "REVIEW",
  ).length;
  const attentionCount =
    pendingDecisions.length +
    blockedTasks.length +
    (snapshot.requires_reconciliation ? 1 : 0);
  const firstDecision = pendingDecisions.at(0);
  const firstBlockedTask = blockedTasks.at(0);
  const nextMessage = firstDecision
    ? `Production is waiting for your decision on ${firstDecision.title}.`
    : firstBlockedTask
      ? `${firstBlockedTask.title} needs help before work can continue.`
      : workingCount
        ? `${workingCount} ${workingCount === 1 ? "task is" : "tasks are"} moving through production now.`
        : reviewCount
          ? `${reviewCount} ${reviewCount === 1 ? "result is" : "results are"} ready for review.`
          : "Give GAN a production outcome when you are ready to begin the next piece of work.";

  return (
    <div className="director-overview">
      <section className="director-pulse" aria-labelledby="project-pulse-title">
        <div>
          <p className="eyebrow">PROJECT PULSE</p>
          <h2 id="project-pulse-title">
            {attentionCount
              ? `${attentionCount} ${attentionCount === 1 ? "item needs" : "items need"} your attention`
              : workingCount
                ? `${workingCount} ${workingCount === 1 ? "task is" : "tasks are"} in progress`
                : reviewCount
                  ? `${reviewCount} ${reviewCount === 1 ? "result is" : "results are"} moving through review`
                  : "Production is clear to continue"}
          </h2>
          <p>{nextMessage}</p>
        </div>
        <div className="pulse-metrics" aria-label="Current project state">
          <Metric
            label="Milestone"
            value={
              snapshot.project.production.current_milestone ?? "Not set yet"
            }
          />
          <Metric label="In progress" value={workingCount} />
          <Metric label="Awaiting review" value={reviewCount} />
          <Metric label="Your decisions" value={pendingDecisions.length} />
        </div>
      </section>

      <div className="director-grid">
        <section
          className="attention-section"
          aria-labelledby="attention-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">FIRST LOOK</p>
              <h2 id="attention-title">Needs your attention</h2>
            </div>
            {pendingDecisions.length > 0 && (
              <button
                className="text-button"
                onClick={() => navigate("Needs Oren")}
              >
                Review decisions →
              </button>
            )}
          </div>
          {attentionCount === 0 ? (
            <div className="calm-state">
              <strong>Nothing is waiting on you.</strong>
              <span>GAN can continue within the current project policy.</span>
            </div>
          ) : (
            <ul className="attention-list">
              {snapshot.requires_reconciliation && (
                <li data-tone="warning">
                  <div>
                    <strong>Unregistered project changes</strong>
                    <span>
                      Explain the external work so production history stays
                      trustworthy.
                    </span>
                  </div>
                  <span>Action required</span>
                </li>
              )}
              {pendingDecisions.slice(0, 3).map((decision) => (
                <li key={decision.decision_id}>
                  <button onClick={() => navigate("Needs Oren")}>
                    <strong>{decision.title}</strong>
                    <span>{decision.reason}</span>
                  </button>
                  <span>Your decision</span>
                </li>
              ))}
              {blockedTasks.slice(0, 3).map((task) => (
                <li key={task.task_id} data-tone="warning">
                  <button onClick={() => selectTask(task.task_id)}>
                    <strong>{task.title}</strong>
                    <span>{task.objective}</span>
                  </button>
                  <Status state={task.state ?? "BLOCKED"} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="direction-summary"
          aria-labelledby="direction-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">PROJECT DIRECTION</p>
              <h2 id="direction-title">What the team is building toward</h2>
            </div>
          </div>
          <p>{snapshot.project.project.description}</p>
          <dl className="details compact-details">
            <dt>Stage</dt>
            <dd>{humanizeIdentifier(snapshot.project.production.stage)}</dd>
            <dt>Visual direction</dt>
            <dd>
              {snapshot.project.visual.direction || "Not established yet"}
            </dd>
            <dt>How GAN may proceed</dt>
            <dd>
              {
                policyLabels[
                  snapshot.policy.authority ?? "recommend_and_proceed"
                ]
              }
            </dd>
          </dl>
          <button className="text-button" onClick={() => navigate("Settings")}>
            Change collaboration settings →
          </button>
        </section>
      </div>

      <section className="current-work" aria-labelledby="current-work-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">RIGHT NOW</p>
            <h2 id="current-work-title">Current work</h2>
          </div>
          <button
            className="text-button"
            onClick={() => navigate("Production")}
          >
            Open production →
          </button>
        </div>
        <TaskTable tasks={currentTasks} select={selectTask} compact />
      </section>

      <section className="change-briefing" aria-labelledby="changes-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SINCE THE LATEST ACTIVITY</p>
            <h2 id="changes-title">What changed</h2>
          </div>
          <button className="text-button" onClick={() => navigate("Activity")}>
            Open full history →
          </button>
        </div>
        <EventList events={events.slice(-5).reverse()} select={selectEvent} />
      </section>
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
        <div>
          <p className="eyebrow">GIVE GAN DIRECTION</p>
          <h2>What outcome do you want next?</h2>
        </div>
        <span className="muted">GAN plans the production work</span>
      </div>
      <p>
        Describe the result in your own words. GAN will inspect the project,
        plan the work, choose specialists, and bring back only the choices that
        need your judgment.
      </p>
      <form onSubmit={(event) => void submit(event)}>
        <label htmlFor="gm-objective">Desired outcome</label>
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
          {busy ? "Planning the work…" : "Plan and start work"}
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
      {!!snapshot.plans?.length && (
        <details className="plan-history">
          <summary>
            Previous production plans
            <span>{snapshot.plans.length}</span>
          </summary>
          {snapshot.plans
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
                <details className="technical-details">
                  <summary>Technical plan record</summary>
                  <pre>{JSON.stringify(plan, null, 2)}</pre>
                </details>
              </article>
            ))}
        </details>
      )}
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
  const pending = (snapshot.decisions ?? []).filter(
    (decision) => !decision.selected_option,
  );
  const resolved = (snapshot.decisions ?? []).filter(
    (decision) => decision.selected_option,
  );
  return (
    <section className="decision-inbox">
      <div className="decision-intro">
        <p className="eyebrow">YOUR JUDGMENT</p>
        <h2>
          {pending.length
            ? `${pending.length} ${pending.length === 1 ? "decision needs" : "decisions need"} you`
            : "Nothing is waiting on you"}
        </h2>
        <p>
          GAN handles production complexity. This inbox contains only choices
          that affect intent, taste, scope, money, or another boundary you own.
        </p>
      </div>
      {!pending.length && (
        <div className="calm-state">
          <strong>Production can continue within your current policy.</strong>
          <span>
            New decisions will appear here with a recommendation and impact.
          </span>
        </div>
      )}
      {pending.map((decision) => (
        <DecisionCard
          key={decision.decision_id}
          decision={decision}
          snapshot={snapshot}
          connection={connection}
        />
      ))}
      {!!resolved.length && (
        <details className="resolved-decisions">
          <summary>
            Previous decisions <span>{resolved.length}</span>
          </summary>
          {resolved.map((decision) => (
            <DecisionCard
              key={decision.decision_id}
              decision={decision}
              snapshot={snapshot}
              connection={connection}
            />
          ))}
        </details>
      )}
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
    <article className="decision-card">
      <p className="eyebrow">DECISION</p>
      <h3>{decision.title}</h3>
      <p className="decision-reason">{decision.reason}</p>
      <div className="recommendation">
        <span className="eyebrow">GAN RECOMMENDS</span>
        <strong>{decision.recommendation}</strong>
      </div>
      {!!decision.consequences.length && (
        <div className="decision-impact">
          <strong>What this changes</strong>
          <ul>
            {decision.consequences.map((consequence) => (
              <li key={consequence}>{consequence}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="muted decision-affects">
        Work affected:{" "}
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
            Your decision
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
            Why this is the right call
            <textarea
              required
              value={rationale}
              onChange={(event) => {
                setRationale(event.target.value);
                requestId.current = `decision-${crypto.randomUUID()}`;
              }}
            />
          </label>
          <button
            className="primary"
            disabled={busy || !option || !rationale.trim()}
          >
            Confirm decision
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
  "Needs Oren": "Make the choices that only you can make.",
  Workers: "See what specialist agents are doing and what they returned.",
  Production:
    "See who is working, what is blocked, and how current work connects.",
  Disciplines:
    "Check gameplay, level design, art, audio, and narrative for important risks.",
  QA: "Understand whether work is ready and what the evidence actually proves.",
  Network: "See which pieces of work depend on one another.",
  "Project Intelligence":
    "See what GAN understands about this project and where it is uncertain.",
  Agents:
    "Manage the specialist team, missing skills, auditions, and hiring history.",
  Models: "See which AI is best suited to the work and why GAN recommends it.",
  Providers:
    "Control paid AI services and keep external spending inside hard limits.",
  Activity:
    "Review what changed, who did it, and inspect the underlying record.",
  Settings: "Choose how GAN works with you and what it may do.",
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
function humanizeIdentifier(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll(".", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
const statusLabels: Record<string, string> = {
  PROPOSED: "Not started",
  QUEUED: "Queued",
  READY: "Ready to start",
  RUNNING: "In progress",
  BLOCKED: "Blocked",
  BLOCKED_KNOWLEDGE: "Missing information",
  NEEDS_HUMAN: "Needs your decision",
  REVIEW: "Awaiting review",
  PASSED: "Passed",
  FAILED: "Needs revision",
  INTEGRATE: "Ready to integrate",
  COMPLETE: "Complete",
  CANCELLED: "Cancelled",
  SUPERSEDED: "Superseded",
};
function statusLabel(state: string) {
  return statusLabels[state.toLocaleUpperCase()] ?? humanizeIdentifier(state);
}
function Status({ state }: { state: string }) {
  return (
    <span className={`status status-${state.toLocaleLowerCase()}`}>
      {statusLabel(state)}
    </span>
  );
}
function TaskTable({
  tasks,
  select,
  compact = false,
}: {
  tasks: TaskContract[];
  select: (id: string) => void;
  compact?: boolean;
}) {
  if (!tasks.length)
    return (
      <div className="empty">
        <h3>A clear brief is the first step.</h3>
        <p>
          Tell GAN the outcome you want. It will plan the production work and
          bring back anything that needs your judgment.
        </p>
      </div>
    );
  return (
    <div className={`table-scroll ${compact ? "compact-task-table" : ""}`}>
      <table>
        <thead>
          <tr>
            <th>Task / desired outcome</th>
            {!compact && <th>Specialist skill</th>}
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
              {!compact && (
                <td>
                  {task.required_capabilities
                    .map(humanizeIdentifier)
                    .join(", ")}
                </td>
              )}
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
          <button onClick={() => select(event)}>
            <strong>{eventLabel(event.event_type)}</strong>
            <span>
              {actorLabel(event.actor_id)} ·{" "}
              <time dateTime={event.timestamp}>
                {new Date(event.timestamp).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </time>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

const eventLabels: Record<string, string> = {
  "task.proposed": "New work was proposed",
  "task.created": "A task was created",
  "task.started": "Work started",
  "task.blocked": "Work became blocked",
  "task.completed": "Work moved to review",
  "task.cancelled": "Work was cancelled",
  "decision.requested": "Your decision was requested",
  "decision.resolved": "A decision was recorded",
  "agent.assigned": "A specialist joined the work",
  "agent.hired": "A new specialist was hired",
  "agent.failed": "A specialist needs help",
  "evaluation.started": "Quality review started",
  "evaluation.failed": "Quality review found an issue",
  "evaluation.passed": "Quality review passed",
  "project.initialized": "Project connected to GAN",
  "project.baseline_recorded": "Project changes were recorded",
  "project.intelligence_indexed": "Project understanding was refreshed",
  "project.external_change_detected": "Unregistered changes were found",
  "project.reconciled": "External changes were reconciled",
};
function eventLabel(eventType: string) {
  return eventLabels[eventType] ?? humanizeIdentifier(eventType);
}
function actorLabel(actorId: string) {
  const labels: Record<string, string> = {
    "local-director": "You",
    "workspace-watcher": "GAN",
    "project-indexer": "Project Intelligence",
    "qa-fabric": "QA",
    recruiter: "Recruiter",
  };
  return labels[actorId] ?? humanizeIdentifier(actorId);
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
  const [onboarded, setOnboarded] = useState<ProjectSummary | null>(null);
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
      const next = await request<ProjectCatalog>(
        connection,
        "/project-import",
        { path: String(form.get("path")).trim() },
        "POST",
      );
      imported(next);
      setOnboarded(
        next.projects.find(
          (project) => project.project_id === next.active_project_id,
        ) ?? null,
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
    <dialog
      className="project-dialog"
      ref={dialog}
      onCancel={close}
      onClose={close}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">PROJECTS</p>
          <h2>
            {importing
              ? "Getting the team familiar with the project"
              : onboarded
                ? "Project understanding"
                : "Choose a production workspace"}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Close project chooser"
          onClick={close}
        >
          ×
        </button>
      </div>
      {importing ? (
        <section
          className="onboarding-progress"
          role="status"
          aria-live="polite"
        >
          <p>
            GAN is inspecting the repository before asking you anything. Large
            projects may take a little longer.
          </p>
          <ol>
            <li>Reconnaissance and project detection</li>
            <li>Relevant Lead selection</li>
            <li>Independent domain assessments</li>
            <li>GM reconciliation</li>
          </ol>
        </section>
      ) : onboarded ? (
        onboarded.onboarding ? (
          <ProjectOnboardingResult
            project={onboarded}
            onboarding={onboarded.onboarding}
            enter={close}
          />
        ) : (
          <section className="onboarding-result">
            <h3>{onboarded.name} is ready</h3>
            <p>
              This project already has GAN history but no domain-onboarding
              record. The team can build understanding progressively as work
              begins.
            </p>
            <div className="form-actions">
              <button className="primary" onClick={close}>
                Enter project
              </button>
            </div>
          </section>
        )
      ) : (
        <>
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
                      busy || removeBusy || catalog.projects.length === 1
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
              <h3 id="remove-project-title">
                Remove {removing.name} from GAN?
              </h3>
              <p id="remove-project-detail">
                This forgets the project from this Studio. Repository files and
                its .gameagent history stay on disk.
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
              GAN will inspect the repository, select relevant production Leads,
              reconcile their findings, and ask only about genuine blockers.
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
              <button className="primary" disabled={busy || removeBusy}>
                Import and inspect
              </button>
            </div>
          </form>
        </>
      )}
    </dialog>
  );
}

function ProjectOnboardingResult({
  project,
  onboarding,
  enter,
}: {
  project: ProjectSummary;
  onboarding: ProjectOnboarding;
  enter: () => void;
}) {
  return (
    <section className="onboarding-result">
      <ProjectUnderstanding
        projectName={project.name}
        onboarding={onboarding}
      />
      <div className="form-actions">
        <button className="primary" onClick={enter}>
          Enter project
        </button>
      </div>
    </section>
  );
}

function ProjectUnderstanding({
  projectName,
  onboarding,
}: {
  projectName: string;
  onboarding: ProjectOnboarding;
}) {
  const ready = onboarding.assessments.filter(
    (item) => item.readiness.status === "READY",
  ).length;
  const assumptions = onboarding.assessments.filter(
    (item) => item.readiness.status === "READY_WITH_ASSUMPTIONS",
  ).length;
  return (
    <div className="project-understanding">
      <p className="eyebrow">
        {onboarding.blocking_questions.length
          ? "YOUR INPUT IS NEEDED"
          : "WE'RE GOOD TO START"}
      </p>
      <h3>{projectName}</h3>
      <p>{onboarding.reconciliation_summary}</p>
      <div className="onboarding-metrics" aria-label="Onboarding summary">
        <div>
          <strong>{ready}</strong>
          <span>Ready</span>
        </div>
        <div>
          <strong>{assumptions}</strong>
          <span>With assumptions</span>
        </div>
        <div>
          <strong>{onboarding.deferred_questions.length}</strong>
          <span>Can wait</span>
        </div>
        <div>
          <strong>{onboarding.blocking_questions.length}</strong>
          <span>Need you now</span>
        </div>
      </div>
      <div className="onboarding-domains">
        {onboarding.assessments.map((assessment) => (
          <details className="onboarding-domain" key={assessment.assessment_id}>
            <summary>
              <span>{assessment.domain.replaceAll("_", " ")}</span>
              <span>{assessment.readiness.status.replaceAll("_", " ")}</span>
              <span>{Math.round(assessment.readiness.confidence * 100)}%</span>
            </summary>
            <p>{assessment.summary}</p>
            {assessment.known_facts.length > 0 && (
              <OnboardingList title="Known" items={assessment.known_facts} />
            )}
            {assessment.assumptions.length > 0 && (
              <OnboardingList
                title="Assumptions"
                items={assessment.assumptions.map((item) => item.statement)}
              />
            )}
            {assessment.unknowns.length > 0 && (
              <OnboardingList
                title="Unresolved"
                items={assessment.unknowns.map((item) => item.question)}
              />
            )}
            {assessment.recommendations.length > 0 && (
              <OnboardingList
                title="Recommendations"
                items={assessment.recommendations}
              />
            )}
            {assessment.evidence.length > 0 && (
              <OnboardingList
                title="Evidence"
                items={assessment.evidence.map(
                  (item) => item.locator ?? item.uri,
                )}
              />
            )}
          </details>
        ))}
      </div>
      {onboarding.blocking_questions.length > 0 && (
        <div className="onboarding-blockers">
          <h4>Questions requiring your decision</h4>
          <ul>
            {onboarding.blocking_questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function OnboardingList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="onboarding-detail-group">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
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
function KnowledgePanel({ connection }: { connection: Connection }) {
  const client = useQueryClient();
  const catalog = useQuery({
    queryKey: ["knowledge-catalog"],
    queryFn: () => request<KnowledgeCatalog>(connection, "/knowledge-catalog"),
  });
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(
    event: FormEvent<HTMLFormElement>,
    kind: "candidate" | "audition" | "audition-run" | "review" | "lifecycle",
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      let body: unknown;
      if (kind === "candidate")
        body = { pack: JSON.parse(String(data.get("manifest"))) };
      else {
        const pack = {
          pack_id: String(data.get("pack_id")),
          version: String(data.get("version")),
        };
        body =
          kind === "audition-run"
            ? {
                pack,
                benchmark_id: String(data.get("benchmark_id")),
              }
            : kind === "lifecycle"
              ? {
                  pack,
                  state: String(data.get("state")),
                  reason: String(data.get("reason")),
                }
              : kind === "audition"
                ? {
                    pack,
                    benchmark_id: String(data.get("benchmark_id")),
                    baseline_score: Number(data.get("baseline_score")),
                    candidate_score: Number(data.get("candidate_score")),
                    evidence_text: String(data.get("evidence_text")),
                    detail: String(data.get("detail")),
                  }
                : {
                    pack,
                    decision: String(data.get("decision")),
                    detail: String(data.get("detail")),
                    provenance_checked: data.has("provenance_checked"),
                    privacy_checked: data.has("privacy_checked"),
                    licensing_checked: data.has("licensing_checked"),
                    contradictions_checked: data.has("contradictions_checked"),
                  };
      }
      await request(connection, `/pack-${kind}`, body, "POST");
      await Promise.all([
        client.invalidateQueries({ queryKey: ["knowledge-catalog"] }),
        client.invalidateQueries({ queryKey: ["agent-knowledge"] }),
      ]);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Knowledge action failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Expertise library</h2>
      <p className="muted">
        Versioned professional knowledge, separate from project facts. Drafts
        require independent audit and benchmark evidence before becoming
        trusted.
      </p>
      {catalog.error && <p role="alert">{catalog.error.message}</p>}
      {error && <p role="alert">{error}</p>}
      <details open>
        <summary>
          Initial expertise baseline ·{" "}
          {
            (catalog.data?.baseline ?? []).filter(
              (item) => item.state === "trusted",
            ).length
          }
          /{(catalog.data?.baseline ?? []).length} trusted
        </summary>
        <p className="muted">
          Missing or draft packs are not specialist qualifications. Build,
          audition, and independently review them before use.
        </p>
        <ul className="agent-knowledge-list">
          {(catalog.data?.baseline ?? []).map((item) => (
            <li key={item.pack_id}>
              <strong>{item.pack_id}</strong>
              <span>
                {item.state}
                {item.version ? ` · v${item.version}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </details>
      {(catalog.data?.global_experience ?? []).map((lesson) => (
        <details key={lesson.lesson_id}>
          <summary>Reviewed global experience · {lesson.statement}</summary>
          <p>{lesson.applicability}</p>
          <ul>
            {lesson.limitations.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
          <p>
            Scope: {lesson.scope} · Confidence:{" "}
            {Math.round(lesson.confidence * 100)}% · Human review:{" "}
            {new Date(lesson.reviewed_at).toLocaleString()}
          </p>
          <p className="muted">
            Private source records remain in their projects; evidence is
            referenced by content digest only.
          </p>
        </details>
      ))}
      <label>
        Filter by domain, capability, source or freshness
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </label>
      {(catalog.data?.maintenance_flags ?? []).map((flag) => (
        <p key={flag} role="status">
          {flag}
        </p>
      ))}
      {(catalog.data?.packs ?? [])
        .filter((pack) =>
          [
            pack.name,
            ...pack.domain_ids,
            ...pack.capability_ids,
            ...pack.sources.flatMap((source) => [
              source.title,
              source.freshness_class,
            ]),
          ]
            .join(" ")
            .toLowerCase()
            .includes(filter.toLowerCase()),
        )
        .map((pack) => (
          <details key={`${pack.pack_id}@${pack.version}`}>
            <summary>
              {pack.name} · v{pack.version} ·{" "}
              {catalog.data?.lifecycle
                ?.filter(
                  (item) =>
                    item.pack.pack_id === pack.pack_id &&
                    item.pack.version === pack.version,
                )
                .at(-1)?.state ?? pack.state}
            </summary>
            <p>{pack.description}</p>
            <form onSubmit={(event) => void submit(event, "lifecycle")}>
              <input type="hidden" name="pack_id" value={pack.pack_id} />
              <input type="hidden" name="version" value={pack.version} />
              <label>
                Global availability
                <select name="state">
                  <option value="deprecated">Deprecate</option>
                  <option value="disputed">Mark disputed</option>
                  <option value="expired">Expire</option>
                  <option value="active">Reactivate</option>
                </select>
              </label>
              <label>
                Reason for changing availability
                <textarea name="reason" required />
              </label>
              <button disabled={busy}>Record availability change</button>
              <p className="muted">
                Changes selection for new work across projects. Recorded worker
                packets remain unchanged.
              </p>
            </form>
            <p>Capabilities: {pack.capability_ids.join(", ")}</p>
            {pack.methods.map((method) => (
              <article key={method.method_id}>
                <h3>{method.title}</h3>
                <p>{method.purpose}</p>
                <ol>
                  {method.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p>
                  Evidence required: {method.evidence_requirements.join("; ")}
                </p>
              </article>
            ))}
            {pack.sources.map((source) => (
              <p key={source.source_id}>
                {source.title} · {source.authority.replaceAll("_", " ")} ·{" "}
                {source.freshness_class.replaceAll("_", " ")} · Retrieved{" "}
                {new Date(source.retrieved_at).toLocaleDateString()}
                <br />
                {source.uri}
              </p>
            ))}
          </details>
        ))}
      <details>
        <summary>Propose a pack draft</summary>
        <form onSubmit={(event) => void submit(event, "candidate")}>
          <label>
            Draft manifest (JSON)
            <textarea name="manifest" required />
          </label>
          <p className="muted">
            Global library: remove project identity, private context and copied
            source material before submitting.
          </p>
          <button disabled={busy}>Save untrusted draft</button>
        </form>
      </details>
      {(catalog.data?.candidates ?? []).map((pack) => {
        const review = catalog.data?.reviews?.find(
          (item) =>
            item.pack.pack_id === pack.pack_id &&
            item.pack.version === pack.version,
        );
        const packAuditions = (catalog.data?.auditions ?? [])
          .filter(
            (item) =>
              item.pack.pack_id === pack.pack_id &&
              item.pack.version === pack.version,
          )
          .sort((left, right) =>
            left.recorded_at.localeCompare(right.recorded_at),
          );
        const latestByBenchmark = new Map(
          packAuditions.map((item) => [item.benchmark_id, item]),
        );
        const latestAuditions = pack.evaluation_ids
          .map((benchmarkId) => latestByBenchmark.get(benchmarkId))
          .filter((item) => item !== undefined);
        const latestAuditionIds = new Set(
          latestAuditions.map((item) => item.audition_id),
        );
        const supersededAuditions = packAuditions.filter(
          (item) => !latestAuditionIds.has(item.audition_id),
        );
        return (
          <details key={`candidate-${pack.pack_id}@${pack.version}`}>
            <summary>
              Candidate: {pack.name} v{pack.version} ·{" "}
              {review?.decision ?? "Awaiting review"}
            </summary>
            <p>{pack.description}</p>
            <p>Benchmarks: {pack.evaluation_ids.join(", ")}</p>
            <h3>Latest qualification evidence</h3>
            {latestAuditions.length ? (
              latestAuditions.map((item) => {
                const passes =
                  item.candidate_score >= 0.8 &&
                  item.candidate_score >= item.baseline_score;
                return (
                  <details key={item.audition_id}>
                    <summary>
                      {item.benchmark_id} · baseline {item.baseline_score} ·
                      candidate {item.candidate_score} ·{" "}
                      {passes ? "Pass" : "Needs work"}
                    </summary>
                    <p>
                      {item.evidence_class} evidence. {item.detail}
                    </p>
                    <p>Evidence digest: {item.evidence.sha256}</p>
                  </details>
                );
              })
            ) : (
              <p>No audition evidence recorded yet.</p>
            )}
            {supersededAuditions.length > 0 && (
              <details>
                <summary>
                  Earlier audition attempts ({supersededAuditions.length})
                </summary>
                <p className="muted">
                  Preserved for audit history. Qualification uses the latest
                  receipt for each benchmark.
                </p>
                {supersededAuditions.map((item) => (
                  <details key={item.audition_id}>
                    <summary>
                      {item.benchmark_id} · baseline {item.baseline_score} ·
                      candidate {item.candidate_score} ·{" "}
                      {new Date(item.recorded_at).toLocaleString()}
                    </summary>
                    <p>
                      {item.evidence_class} evidence. {item.detail}
                    </p>
                    <p>Evidence digest: {item.evidence.sha256}</p>
                  </details>
                ))}
              </details>
            )}
            {review ? (
              <p>{review.detail}</p>
            ) : (
              <>
                <form onSubmit={(event) => void submit(event, "audition-run")}>
                  <input type="hidden" name="pack_id" value={pack.pack_id} />
                  <input type="hidden" name="version" value={pack.version} />
                  <h3>Run comparative audition</h3>
                  <p>
                    Loads the selected repository benchmark, runs it with and
                    without this draft, then requests a separate model
                    evaluation. Uses your signed-in model account. Results are
                    heuristic; publication still requires independent human
                    review.
                  </p>
                  <label>
                    Benchmark
                    <select name="benchmark_id" required>
                      {pack.evaluation_ids.map((id) => (
                        <option key={id}>{id}</option>
                      ))}
                    </select>
                  </label>
                  <button disabled={busy || !pack.evaluation_ids.length}>
                    {busy
                      ? "Knowledge action running…"
                      : "Run model-judged audition"}
                  </button>
                </form>
                <form onSubmit={(event) => void submit(event, "audition")}>
                  <input type="hidden" name="pack_id" value={pack.pack_id} />
                  <input type="hidden" name="version" value={pack.version} />
                  <label>
                    Benchmark
                    <select name="benchmark_id">
                      {pack.evaluation_ids.map((id) => (
                        <option key={id}>{id}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Measured baseline score (0–1)
                    <input
                      name="baseline_score"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      required
                    />
                  </label>
                  <label>
                    Measured candidate score (0–1)
                    <input
                      name="candidate_score"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      required
                    />
                  </label>
                  <label>
                    Benchmark evidence (sanitized)
                    <textarea name="evidence_text" minLength={10} required />
                  </label>
                  <label>
                    Evaluation rationale
                    <textarea name="detail" required />
                  </label>
                  <button disabled={busy}>Record independent audition</button>
                </form>
                <form onSubmit={(event) => void submit(event, "review")}>
                  <input type="hidden" name="pack_id" value={pack.pack_id} />
                  <input type="hidden" name="version" value={pack.version} />
                  <fieldset>
                    <legend>Independent curator review</legend>
                    <label>
                      <input name="provenance_checked" type="checkbox" />
                      Sources support the claims
                    </label>
                    <label>
                      <input name="privacy_checked" type="checkbox" />
                      No private project information
                    </label>
                    <label>
                      <input name="licensing_checked" type="checkbox" />
                      Reuse rights checked
                    </label>
                    <label>
                      <input name="contradictions_checked" type="checkbox" />
                      No unresolved critical contradictions
                    </label>
                  </fieldset>
                  <label>
                    Decision
                    <select name="decision">
                      <option value="rejected">Reject</option>
                      <option value="approved">Approve and publish</option>
                    </select>
                  </label>
                  <label>
                    Review rationale
                    <textarea name="detail" required />
                  </label>
                  <button disabled={busy}>Record curator decision</button>
                </form>
              </>
            )}
          </details>
        );
      })}
    </section>
  );
}

function LearningPanel({
  snapshot,
  connection,
}: {
  snapshot: ProjectSnapshot;
  connection: Connection;
}) {
  const client = useQueryClient();
  const maintenance = useQuery({
    queryKey: ["learning-status"],
    queryFn: () =>
      request<LearningMaintenanceStatus>(connection, "/learning-status"),
    refetchInterval: 5000,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [reviewDetails, setReviewDetails] = useState<Record<string, string>>(
    {},
  );
  async function action(path: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      await request(connection, path, body, "POST");
      await Promise.all([
        client.invalidateQueries({ queryKey: ["project"] }),
        client.invalidateQueries({ queryKey: ["events"] }),
        client.invalidateQueries({ queryKey: ["agent-knowledge"] }),
        client.invalidateQueries({ queryKey: ["knowledge-catalog"] }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Learning action failed");
    } finally {
      setBusy(false);
    }
  }
  const observations = snapshot.experience_observations ?? [];
  const lessons = snapshot.experience_lessons ?? [];
  const matches = (text: string) =>
    text.toLowerCase().includes(filter.toLowerCase());
  return (
    <section className="panel">
      <p className="muted">
        Background learning: {maintenance.data?.state ?? "loading"}
        {maintenance.data?.detail ? ` — ${maintenance.data.detail}` : ""}
      </p>
      <div className="section-heading">
        <h2>Learning from production</h2>
        <div>
          <button
            disabled={busy}
            onClick={() => void action("/knowledge-maintenance-run", {})}
          >
            Check global knowledge
          </button>
          <button
            disabled={busy}
            onClick={() => void action("/learning-run", {})}
          >
            {busy ? "Processing…" : "Capture and distill"}
          </button>
        </div>
      </div>
      <p className="muted">
        QA observations stay in this project. Repeated patterns become
        candidates; only independently validated lessons enter worker context.
        Global export requires a separate, explicit abstraction and privacy
        review.
      </p>
      {maintenance.data?.knowledge_report && (
        <details>
          <summary>
            Knowledge maintenance · {maintenance.data.knowledge_report.state}
          </summary>
          <p>
            Full-text index rebuilt ·{" "}
            {maintenance.data.knowledge_report.stale_sources?.length ?? 0} stale
            sources ·{" "}
            {maintenance.data.knowledge_report.broken_sources?.length ?? 0}{" "}
            broken sources ·{" "}
            {maintenance.data.knowledge_report.benchmark_regressions?.length ??
              0}{" "}
            benchmark regressions ·{" "}
            {maintenance.data.knowledge_report.contradiction_candidates
              ?.length ?? 0}{" "}
            contradiction candidates
          </p>
        </details>
      )}
      {error && <p role="alert">{error}</p>}
      <label>
        Filter learning by capability, outcome or text
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </label>
      <p>
        {observations.length} observations · {lessons.length} lessons
      </p>
      {lessons
        .filter((lesson) =>
          matches(
            [lesson.statement, lesson.state, ...lesson.capability_ids].join(
              " ",
            ),
          ),
        )
        .map((lesson) => (
          <details key={lesson.lesson_id}>
            <summary>
              {lesson.state.replaceAll("_", " ")} · {lesson.statement}
            </summary>
            <p>{lesson.applicability}</p>
            <ul>
              {lesson.limitations.map((limit) => (
                <li key={limit}>{limit}</li>
              ))}
            </ul>
            <p>
              Confidence: {Math.round(lesson.confidence * 100)}% · Scope:{" "}
              {lesson.scope}
            </p>
            <ul>
              {lesson.observation_ids.map((id) => {
                const observation = observations.find(
                  (item) => item.observation_id === id,
                );
                return (
                  <li key={id}>
                    {observation
                      ? `${observation.outcome}: ${observation.conclusion}`
                      : `Unavailable observation: ${id}`}
                  </li>
                );
              })}
            </ul>
            {lesson.review_detail && <p>Review: {lesson.review_detail}</p>}
            {lesson.state === "validated" && (
              <details>
                <summary>Propose a generalized lesson for global use</summary>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    void action("/lesson-promote", {
                      lesson_id: lesson.lesson_id,
                      statement: String(data.get("statement")),
                      applicability: String(data.get("applicability")),
                      limitations: String(data.get("limitations"))
                        .split("\n")
                        .filter(Boolean),
                      scope: String(data.get("scope")),
                      scope_constraint:
                        String(data.get("scope_constraint") ?? "").trim() ||
                        null,
                      privacy_checked: data.has("privacy_checked"),
                      generalization_reviewed: data.has(
                        "generalization_reviewed",
                      ),
                    });
                  }}
                >
                  <p className="muted">
                    This writes to the global knowledge library. Remove project
                    identity, confidential details and personal taste. Original
                    project evidence is not exported.
                  </p>
                  <label>
                    Generalized statement
                    <textarea name="statement" required />
                  </label>
                  <label>
                    Domain or engine ID (leave blank for Global)
                    <input name="scope_constraint" placeholder="godot" />
                  </label>
                  <label>
                    When it applies
                    <textarea name="applicability" required />
                  </label>
                  <label>
                    Limitations (one per line)
                    <textarea name="limitations" required />
                  </label>
                  <label>
                    Scope
                    <select name="scope">
                      <option value="domain">Domain</option>
                      <option value="engine">Engine</option>
                      <option value="global">Global</option>
                    </select>
                  </label>
                  <label>
                    <input name="privacy_checked" type="checkbox" required />I
                    reviewed this abstraction for private project information
                  </label>
                  <label>
                    <input
                      name="generalization_reviewed"
                      type="checkbox"
                      required
                    />
                    The evidence supports this limited generalization, not
                    merely personal taste
                  </label>
                  <button disabled={busy}>Approve global abstraction</button>
                </form>
              </details>
            )}
            {!["rejected", "expired", "superseded"].includes(lesson.state) && (
              <div>
                <label>
                  Independent review rationale
                  <textarea
                    value={reviewDetails[lesson.lesson_id] ?? ""}
                    onChange={(event) =>
                      setReviewDetails({
                        ...reviewDetails,
                        [lesson.lesson_id]: event.target.value,
                      })
                    }
                  />
                </label>
                {(
                  ["validated", "rejected", "expired", "superseded"] as const
                ).map((decision) => (
                  <button
                    key={decision}
                    disabled={
                      busy || !(reviewDetails[lesson.lesson_id] ?? "").trim()
                    }
                    onClick={() =>
                      void action("/lesson-review", {
                        lesson_id: lesson.lesson_id,
                        decision,
                        detail: reviewDetails[lesson.lesson_id],
                      })
                    }
                  >
                    {decision === "validated"
                      ? "Validate for this project"
                      : decision === "rejected"
                        ? "Reject"
                        : decision === "expired"
                          ? "Expire"
                          : "Supersede"}
                  </button>
                ))}
              </div>
            )}
          </details>
        ))}
      <details>
        <summary>Recorded observations</summary>
        {observations
          .filter((item) =>
            matches(
              [item.conclusion, item.outcome, ...item.capability_ids].join(" "),
            ),
          )
          .map((item) => (
            <article key={item.observation_id}>
              <strong>
                {item.outcome} · {item.context_tags?.[0]}
              </strong>
              <p>{item.conclusion}</p>
              <p className="muted">
                Task: {item.task_id} · Evidence: {item.evidence_ids.join(", ")}
              </p>
            </article>
          ))}
      </details>
    </section>
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
  const knowledgeCounts = intelligence?.knowledge.reduce<
    Record<string, number>
  >((total, entry) => {
    total[entry.kind] = (total[entry.kind] ?? 0) + 1;
    return total;
  }, {});
  const highlightedKnowledge =
    intelligence?.knowledge
      .filter((entry) => !entry.statement.includes(' begins with "'))
      .slice(0, 6) ?? [];

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

  async function research(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await request(
        connection,
        "/research-run",
        {
          task_id: String(data.get("task_id")),
          requirement: String(data.get("requirement")),
          url: String(data.get("url")),
          freshness_class: String(data.get("freshness_class")),
        },
        "POST",
      );
      await Promise.all([
        client.invalidateQueries({ queryKey: ["project"] }),
        client.invalidateQueries({ queryKey: ["agent-knowledge"] }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Research failed");
    } finally {
      setBusy(false);
    }
  }

  async function buildPack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await request(
        connection,
        "/pack-build",
        {
          task_id: String(data.get("task_id")),
          pack_id: String(data.get("pack_id")),
          version: String(data.get("version")),
        },
        "POST",
      );
      await client.invalidateQueries({ queryKey: ["knowledge-catalog"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pack drafting failed");
    } finally {
      setBusy(false);
    }
  }

  const advancedTools = (
    <div className="advanced-tools-body">
      <KnowledgePanel connection={connection} />
      <section className="panel">
        <h2>Expertise Pack Builder</h2>
        <p className="muted">
          Draft expertise from fresh, supplied source material using the
          signed-in Codex account. The builder receives capability requirements,
          not project history or creative direction. Independent audit and
          auditions are still required.
        </p>
        <form onSubmit={(event) => void buildPack(event)}>
          <label>
            Task needing expertise
            <select name="task_id" required>
              <option value="">Choose a task</option>
              {snapshot.tasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Global pack ID (no project identity)
            <input name="pack_id" pattern="[a-z0-9][a-z0-9-]*" required />
          </label>
          <label>
            New version
            <input
              name="version"
              pattern="[0-9]+\.[0-9]+\.[0-9]+"
              placeholder="0.1.0"
              required
            />
          </label>
          <button disabled={busy}>
            {busy ? "Working…" : "Draft expertise"}
          </button>
        </form>
      </section>
      <LearningPanel snapshot={snapshot} connection={connection} />
      <section className="panel">
        <h2>Current research</h2>
        <p className="muted">
          Primary-source captures for a specific task. Requires that task's
          network permission and an operator-configured hostname. Research does
          not update trusted expertise.
        </p>
        <form onSubmit={(event) => void research(event)}>
          <label>
            Task
            <select name="task_id" required>
              <option value="">Choose a task</option>
              {snapshot.tasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.title}
                  {task.permissions.network ? "" : " — network not granted"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Knowledge needed
            <input name="requirement" required />
          </label>
          <label>
            Exact primary-source URL
            <input name="url" type="url" required />
          </label>
          <label>
            Freshness
            <select name="freshness_class">
              <option value="version_sensitive">
                Version-sensitive · 7 days
              </option>
              <option value="policy_sensitive">Policy-sensitive · 1 day</option>
              <option value="live">Live · 1 hour</option>
              <option value="slow_changing">Slow-changing · 30 days</option>
            </select>
          </label>
          <button disabled={busy}>Research source</button>
        </form>
        {(snapshot.research_records ?? []).map((record) => (
          <details key={record.research_id}>
            <summary>
              {record.state} · {record.requirement}
            </summary>
            <p>{record.detail}</p>
            <p>{record.url}</p>
            <p>{record.excerpt}</p>
            {record.source?.fresh_until && (
              <p>
                Review after{" "}
                {new Date(record.source.fresh_until).toLocaleString()}
              </p>
            )}
          </details>
        ))}
      </section>
    </div>
  );

  return (
    <div className="intelligence-view">
      {snapshot.onboarding ? (
        <section className="project-understanding-panel">
          <ProjectUnderstanding
            projectName={snapshot.project.project.name}
            onboarding={snapshot.onboarding}
          />
        </section>
      ) : null}
      <section className="panel repository-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PROJECT UNDERSTANDING</p>
            <h2>What GAN knows about this project</h2>
            <span className="muted">
              {intelligence
                ? `Last refreshed ${new Date(intelligence.indexed_at).toLocaleString()}`
                : "GAN has not inspected this project yet"}
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
            <div className="understanding-status">
              <strong>
                GAN has {intelligence.knowledge.length} sourced understanding
                records to use when planning work.
              </strong>
              <span>
                Facts, inferences, decisions, and references remain distinct so
                uncertainty is visible.
              </span>
            </div>
            <details className="resource-browser">
              <summary>
                Browse indexed project files
                <span>{intelligence.resources.length}</span>
              </summary>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Project file</th>
                      <th>Kind</th>
                      <th>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intelligence.resources.slice(0, 40).map((resource) => (
                      <tr key={resource.path}>
                        <td className="mono">{resource.path}</td>
                        <td>{humanizeIdentifier(resource.kind)}</td>
                        <td>{resource.size.toLocaleString()} bytes</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {intelligence.resources.length > 40 && (
                <p className="muted">
                  Showing 40 of {intelligence.resources.length} indexed project
                  files.
                </p>
              )}
            </details>
          </>
        )}
      </section>

      {intelligence && (
        <div className="two-column intelligence-columns">
          <section className="panel">
            <h2>What GAN believes it knows</h2>
            <p className="muted">
              Confidence and source remain visible; an inference is never
              silently presented as a fact.
            </p>
            <div className="knowledge-summary" aria-label="Understanding types">
              <Metric
                label="Sourced facts"
                value={knowledgeCounts?.source_fact ?? 0}
              />
              <Metric
                label="Inferences"
                value={knowledgeCounts?.inferred_fact ?? 0}
              />
              <Metric
                label="Decisions"
                value={knowledgeCounts?.user_decision ?? 0}
              />
            </div>
            <ul className="knowledge-list">
              {highlightedKnowledge.map((entry) => (
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
            <details className="knowledge-records">
              <summary>
                Browse all understanding records
                <span>{intelligence.knowledge.length}</span>
              </summary>
              <ul className="knowledge-list">
                {intelligence.knowledge.map((entry) => (
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
            </details>
          </section>
          <section className="panel">
            <h2>What a specialist will receive</h2>
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
      <details className="advanced-tools">
        <summary>
          <span>
            <strong>Specialist knowledge tools</strong>
            <small>
              Expertise packs, learning, research, and technical maintenance
            </small>
          </span>
          <span>Advanced</span>
        </summary>
        {advancedTools}
      </details>
    </div>
  );
}

function ProductionDomainsPanel({
  snapshot,
  catalog,
  loading,
  error,
  connection,
}: {
  snapshot: ProjectSnapshot;
  catalog: ProductionDomainCatalog | undefined;
  loading: boolean;
  error: string | null;
  connection: Connection;
}) {
  const client = useQueryClient();
  const initialTask =
    snapshot.tasks.find((task) => task.state === "RUNNING") ??
    snapshot.tasks.at(-1);
  const [taskId, setTaskId] = useState(initialTask?.task_id ?? "");
  const [filter, setFilter] = useState<"all" | "attention" | "recorded">("all");
  const [busyDomain, setBusyDomain] = useState<string | null>(null);
  const [runError, setRunError] = useState("");
  const inspections = catalog?.inspections ?? [];
  const taskInspections = inspections.filter((item) => item.task_id === taskId);
  const latestByDomain = new Map<string, ProductionDomainInspection>();
  for (const inspection of taskInspections) {
    const current = latestByDomain.get(inspection.domain_id);
    if (!current || current.inspected_at < inspection.inspected_at) {
      latestByDomain.set(inspection.domain_id, inspection);
    }
  }
  const shownDomains = (catalog?.domains ?? []).filter((domain) => {
    const latest = latestByDomain.get(domain.domain_id);
    if (filter === "attention") return latest?.status === "needs_attention";
    if (filter === "recorded") return latest !== undefined;
    return true;
  });
  const toolsById = new Map(
    (catalog?.tools ?? []).map((tool) => [tool.tool_id, tool]),
  );

  async function runDomain(domainId: string) {
    if (!taskId) return;
    setBusyDomain(domainId);
    setRunError("");
    try {
      await request<ProductionDomainInspection>(
        connection,
        "/production-domain-run",
        {
          request_id: `domain-${domainId}-${crypto.randomUUID()}`,
          task_id: taskId,
          domain_id: domainId,
        },
        "POST",
      );
      await Promise.all([
        client.invalidateQueries({ queryKey: ["production-domains"] }),
        client.invalidateQueries({ queryKey: ["project"] }),
        client.invalidateQueries({ queryKey: ["events"] }),
        client.invalidateQueries({ queryKey: ["qa-report"] }),
      ]);
    } catch (caught) {
      setRunError(
        caught instanceof Error ? caught.message : "Discipline audit failed",
      );
    } finally {
      setBusyDomain(null);
    }
  }

  if (loading) {
    return (
      <section className="panel" role="status">
        Loading production disciplines…
      </section>
    );
  }
  if (error) {
    return (
      <section className="error" role="alert">
        {error}
      </section>
    );
  }
  if (!snapshot.tasks.length) {
    return (
      <section className="panel empty">
        <h2>Create a task before auditing a discipline.</h2>
        <p>
          Every audit is task-scoped so its evidence and history stay
          attributable.
        </p>
      </section>
    );
  }

  const attentionCount = [...latestByDomain.values()].filter(
    (item) => item.status === "needs_attention",
  ).length;
  return (
    <div className="domain-workspace">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PHASE 11 · VERTICAL SLICES</p>
            <h2>Production discipline audits</h2>
            <span className="muted">
              Read-only tools validate project structure; creative quality and
              fun still require stronger evidence.
            </span>
          </div>
        </div>
        <div className="domain-metrics">
          <Metric label="Disciplines" value={catalog?.domains.length ?? 0} />
          <Metric
            label="Tools ready"
            value={
              catalog?.tools.filter(
                (tool) => tool.install_state === "installed",
              ).length ?? 0
            }
          />
          <Metric label="Task runs" value={taskInspections.length} />
          <Metric label="Needs attention" value={attentionCount} />
        </div>
        <label className="domain-task-control">
          Task receiving evidence and history
          <select
            value={taskId}
            onChange={(event) => setTaskId(event.target.value)}
          >
            {snapshot.tasks.map((task) => (
              <option key={task.task_id} value={task.task_id}>
                {task.title}
              </option>
            ))}
          </select>
        </label>
        <div
          className="qa-filter-row"
          aria-label="Production discipline filters"
        >
          {(["all", "attention", "recorded"] as const).map((item) => (
            <button
              key={item}
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
            >
              {item === "all" ? "All disciplines" : item}
            </button>
          ))}
        </div>
        {runError ? (
          <p className="error" role="alert">
            {runError}
          </p>
        ) : null}
      </section>

      <section className="domain-grid" aria-label="Production disciplines">
        {shownDomains.map((domain) => {
          const latest = latestByDomain.get(domain.domain_id);
          const tool = toolsById.get(domain.tool_ids[0]);
          return (
            <article className="domain-card" key={domain.domain_id}>
              <div className="domain-card-heading">
                <div>
                  <p className="eyebrow">
                    {domain.capability_ids.length} CAPABILITIES
                  </p>
                  <h2>{domain.title}</h2>
                </div>
                <Status state={latest?.status ?? "not_run"} />
              </div>
              <p>{domain.description}</p>
              <dl className="details">
                <dt>Tool</dt>
                <dd>{tool?.tool_id ?? domain.tool_ids[0]}</dd>
                <dt>Health</dt>
                <dd>{tool?.install_state ?? "unknown"}</dd>
                <dt>Gate</dt>
                <dd>{domain.gate_ids[0].replaceAll("_", " ")}</dd>
                <dt>Formats</dt>
                <dd>{domain.accepted_extensions.join(" · ")}</dd>
              </dl>
              {latest ? (
                <div className="domain-result">
                  <p className="muted">
                    {latest.inspected_file_count} files ·{" "}
                    {new Date(latest.inspected_at).toLocaleString()}
                  </p>
                  <ul>
                    {latest.findings.map((finding) => (
                      <li
                        key={finding.finding_id}
                        data-severity={finding.severity}
                      >
                        <strong>{finding.title}</strong>
                        <span>{finding.detail}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    className="text-button"
                    href={`/api/daemon/evidence-file?evidence_id=${encodeURIComponent(latest.evidence_id)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Inspect evidence →
                  </a>
                </div>
              ) : (
                <p className="domain-no-result">
                  No audit has been recorded for this task.
                </p>
              )}
              <button
                className="primary"
                disabled={
                  busyDomain !== null || tool?.install_state !== "installed"
                }
                onClick={() => void runDomain(domain.domain_id)}
              >
                {busyDomain === domain.domain_id
                  ? "Auditing…"
                  : "Run read-only audit"}
              </button>
            </article>
          );
        })}
        {!shownDomains.length ? (
          <div className="panel empty">No disciplines match this filter.</div>
        ) : null}
      </section>
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
  const [discipline, setDiscipline] = useState("all");
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
          {[
            "all",
            "ui",
            "engineering",
            "gameplay",
            "level_design",
            "art",
            "audio",
            "narrative",
          ].map((item) => (
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
                    {existing?.missing_expertise_capabilities?.length ? (
                      <p role="status">
                        Expertise needed:{" "}
                        {existing.missing_expertise_capabilities.join(", ")}.
                        Approve a suitable pack in Project Intelligence, then
                        retry.
                      </p>
                    ) : null}
                    {(!existing || existing.state === "candidate_composed") && (
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
                <details>
                  <summary>Why?</summary>
                  <h4>Professional reasoning</h4>
                  <ul>
                    {(worker.result.professional_reasoning ?? []).map(
                      (item) => (
                        <li key={item}>{item}</li>
                      ),
                    )}
                  </ul>
                  <h4>Project evidence</h4>
                  <ul>
                    {(worker.result.project_evidence ?? []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <h4>Uncertainty and missing evidence</h4>
                  <ul>
                    {[
                      ...(worker.result.uncertainty ?? []),
                      ...(worker.result.missing_evidence ?? []),
                    ].map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <h4>QA plan</h4>
                  <ul>
                    {(worker.result.qa_plan ?? []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {!!worker.result.source_ids?.length && (
                    <p className="muted">
                      Sources: {worker.result.source_ids.join(", ")}
                    </p>
                  )}
                </details>
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

function cents(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100);
}

function ProviderPanel({
  registry,
  loading,
  error: providerError,
  connection,
  refreshed,
}: {
  registry: ProviderRegistry | undefined;
  loading: boolean;
  error: string | null;
  connection: Connection;
  refreshed: () => void;
}) {
  const [providerId, setProviderId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [adapterId, setAdapterId] = useState("");
  const [credentialId, setCredentialId] = useState("api-key");
  const [capAmount, setCapAmount] = useState("");
  const [capExpires, setCapExpires] = useState("2099-01-01T00:00");
  const [proofUri, setProofUri] = useState("");
  const [proofSha, setProofSha] = useState("");
  const [approvalProvider, setApprovalProvider] = useState("");
  const [approvalRequest, setApprovalRequest] = useState("");
  const [approvalAmount, setApprovalAmount] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("register");
    setNotice("");
    setError("");
    const amount = Number(capAmount);
    const verified =
      Number.isInteger(amount) &&
      amount > 0 &&
      proofUri.trim().length > 0 &&
      /^[a-f0-9]{64}$/.test(proofSha);
    try {
      await request(
        connection,
        "/provider-configure",
        {
          request_id: `provider-configure-${crypto.randomUUID()}`,
          provider: {
            provider_id: providerId,
            display_name: displayName,
            purpose,
            billing: "paid",
            state: verified ? "ACTIVE" : "DISABLED_UNCAPPED",
            currency: "USD",
            adapter_id: adapterId || null,
            credential_id: credentialId || null,
            cap: verified
              ? {
                  verified: true,
                  amount_cents: amount,
                  verification_method: "manual_provider_console",
                  verified_at: new Date().toISOString(),
                  expires_at: new Date(capExpires).toISOString(),
                  proof: {
                    uri: proofUri,
                    media_type: "image/png",
                    sha256: proofSha,
                  },
                  provider_side: true,
                }
              : { verified: false },
          },
        },
        "POST",
      );
      setNotice(
        verified
          ? `${displayName} registered with a verified provider-side cap.`
          : `${displayName} registered as disabled and uncapped.`,
      );
      refreshed();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Provider registration failed",
      );
    } finally {
      setBusy("");
    }
  }

  async function approve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("approve");
    setNotice("");
    setError("");
    try {
      await request(
        connection,
        "/provider-approve",
        {
          request_id: `provider-approval-${crypto.randomUUID()}`,
          provider_id: approvalProvider,
          invocation_request_id: approvalRequest,
          amount_cents: Number(approvalAmount),
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        "POST",
      );
      setNotice(
        `Approved the exact ${cents(Number(approvalAmount))} upper bound for one hour.`,
      );
      setApprovalRequest("");
      setApprovalAmount("");
      refreshed();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Approval failed");
    } finally {
      setBusy("");
    }
  }

  if (loading)
    return <div className="empty">Loading provider safety state…</div>;
  if (providerError) return <p className="error">{providerError}</p>;
  const ledger = registry?.ledger;
  const providers = registry?.providers ?? [];
  return (
    <div className="provider-console">
      {ledger && (
        <section className="panel provider-hero">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                MONTHLY EXTERNAL BUDGET · {ledger.month}
              </span>
              <h2>Paid work is admitted before it can execute</h2>
            </div>
            <span className="route-state passed">fail closed</span>
          </div>
          <div className="metrics provider-metrics">
            <Metric label="Budget" value={cents(ledger.budget_cents)} />
            <Metric label="Settled" value={cents(ledger.settled_cents)} />
            <Metric label="Reserved" value={cents(ledger.reserved_cents)} />
            <Metric label="Available" value={cents(ledger.available_cents)} />
          </div>
          <p className="muted provider-safety-copy">
            A paid call needs an active provider, current provider-side cap
            proof, secure OS credential, available adapter, known upper-bound
            cost, and exact human approval at $1.00 or more.
          </p>
        </section>
      )}

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PROVIDER REGISTRY</span>
            <h2>Execution paths</h2>
          </div>
          <span className="muted">{providers.length} configured</span>
        </div>
        <div className="provider-grid">
          {providers.map((status) => (
            <ProviderCard
              key={status.provider.provider_id}
              status={status}
              connection={connection}
              refreshed={refreshed}
            />
          ))}
          {!providers.length && (
            <div className="empty provider-empty">
              No paid provider is configured. Paid execution is unavailable.
            </div>
          )}
        </div>
      </section>

      <div className="provider-columns">
        <section className="panel">
          <span className="eyebrow">REGISTER OR UPDATE</span>
          <h2>Provider and cap proof</h2>
          <form
            className="provider-form"
            onSubmit={(event) => void register(event)}
          >
            <label>
              Provider ID
              <input
                required
                pattern="[a-z][a-z0-9_.-]*"
                value={providerId}
                onChange={(event) => setProviderId(event.target.value)}
                placeholder="openai"
              />
            </label>
            <label>
              Display name
              <input
                required
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="OpenAI"
              />
            </label>
            <label className="span-two">
              Purpose
              <input
                required
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                placeholder="High-quality reasoning fallback"
              />
            </label>
            <label>
              Adapter ID
              <input
                value={adapterId}
                onChange={(event) => setAdapterId(event.target.value)}
                placeholder="Configured through .env"
              />
            </label>
            <label>
              Credential ID
              <input
                value={credentialId}
                onChange={(event) => setCredentialId(event.target.value)}
              />
            </label>
            <label>
              Provider cap · cents
              <input
                type="number"
                min="1"
                step="1"
                value={capAmount}
                onChange={(event) => setCapAmount(event.target.value)}
                placeholder="2500"
              />
            </label>
            <label>
              Cap expires
              <input
                type="datetime-local"
                value={capExpires}
                onChange={(event) => setCapExpires(event.target.value)}
              />
            </label>
            <label className="span-two">
              Provider-console proof URI
              <input
                value={proofUri}
                onChange={(event) => setProofUri(event.target.value)}
                placeholder="artifact://provider/cap-capture"
              />
            </label>
            <label className="span-two">
              Proof SHA-256
              <input
                minLength={64}
                maxLength={64}
                value={proofSha}
                onChange={(event) =>
                  setProofSha(event.target.value.toLowerCase())
                }
                placeholder="64 lowercase hex characters"
              />
            </label>
            <button className="primary span-two" disabled={busy !== ""}>
              {busy === "register" ? "Saving…" : "Save provider"}
            </button>
          </form>
          <p className="muted">
            Incomplete cap evidence is accepted only as DISABLED_UNCAPPED; it
            can never execute.
          </p>
        </section>

        <section className="panel">
          <span className="eyebrow">HUMAN APPROVAL</span>
          <h2>Approve one upper bound</h2>
          <form
            className="provider-form"
            onSubmit={(event) => void approve(event)}
          >
            <label className="span-two">
              Provider
              <select
                required
                value={approvalProvider}
                onChange={(event) => setApprovalProvider(event.target.value)}
              >
                <option value="">Select…</option>
                {providers.map(({ provider }) => (
                  <option
                    key={provider.provider_id}
                    value={provider.provider_id}
                  >
                    {provider.display_name ?? provider.provider_id}
                  </option>
                ))}
              </select>
            </label>
            <label className="span-two">
              Invocation request ID
              <input
                required
                pattern="[a-z][a-z0-9_.-]*"
                value={approvalRequest}
                onChange={(event) => setApprovalRequest(event.target.value)}
                placeholder="paid-task-123"
              />
            </label>
            <label className="span-two">
              Exact upper bound · cents
              <input
                required
                type="number"
                min="100"
                step="1"
                value={approvalAmount}
                onChange={(event) => setApprovalAmount(event.target.value)}
              />
            </label>
            <button
              disabled={busy !== "" || !providers.length}
              className="span-two"
            >
              {busy === "approve" ? "Recording…" : "Approve for one hour"}
            </button>
          </form>
          <p className="muted">
            Approval is scoped to one provider, request ID, and exact cost. It
            cannot bypass either cap.
          </p>
        </section>
      </div>

      {(notice || error) && (
        <p
          className={error ? "error" : "provider-notice"}
          role={error ? "alert" : "status"}
        >
          {error || notice}
        </p>
      )}

      <section className="panel">
        <div className="section-heading">
          <h2>Reservations and spend</h2>
          <span className="muted">Durable · newest first</span>
        </div>
        {!registry?.reservations.length ? (
          <div className="empty">No external cost has been reserved.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Provider</th>
                  <th>Month</th>
                  <th>Upper bound</th>
                  <th>Actual</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {registry.reservations
                  .slice()
                  .reverse()
                  .map((item) => (
                    <tr key={item.reservation_id}>
                      <td className="mono">{item.request_id}</td>
                      <td>{item.provider_id}</td>
                      <td>{item.month}</td>
                      <td>{cents(item.predicted_cents)}</td>
                      <td>
                        {item.actual_cents == null
                          ? "—"
                          : cents(item.actual_cents)}
                      </td>
                      <td>
                        <Status state={item.state} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function ProviderCard({
  status,
  connection,
  refreshed,
}: {
  status: ProviderRegistry["providers"][number];
  connection: Connection;
  refreshed: () => void;
}) {
  const provider = status.provider;
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function saveCredential(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("credential");
    setError("");
    try {
      await request(
        connection,
        "/provider-credential",
        { provider_id: provider.provider_id, secret },
        "POST",
      );
      setSecret("");
      refreshed();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Credential save failed",
      );
    } finally {
      setBusy("");
    }
  }
  async function disable() {
    setBusy("disable");
    setError("");
    try {
      await request(
        connection,
        "/provider-disable",
        {
          request_id: `provider-disable-${crypto.randomUUID()}`,
          provider_id: provider.provider_id,
          reason: "Disabled by the local director",
        },
        "POST",
      );
      refreshed();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Provider disable failed",
      );
    } finally {
      setBusy("");
    }
  }
  return (
    <article
      className={`provider-card ${provider.state !== "ACTIVE" ? "blocked" : ""}`}
    >
      <div className="section-heading">
        <div>
          <h3>{provider.display_name ?? provider.provider_id}</h3>
          <span className="mono">{provider.provider_id}</span>
        </div>
        <Status state={provider.state} />
      </div>
      <p>{provider.purpose ?? "External model execution"}</p>
      <dl className="route-facts">
        <dt>Provider-side cap</dt>
        <dd>
          {provider.cap.verified
            ? cents(provider.cap.amount_cents)
            : "Not verified"}
        </dd>
        <dt>Cap freshness</dt>
        <dd>
          {provider.cap.verified
            ? new Date(provider.cap.expires_at).toLocaleDateString()
            : "Disabled"}
        </dd>
        <dt>Credential</dt>
        <dd>{status.credential_configured ? "OS secure store" : "Missing"}</dd>
        <dt>Adapter</dt>
        <dd>{status.adapter_available ? "Available" : "Unavailable"}</dd>
      </dl>
      <form
        className="provider-credential"
        onSubmit={(event) => void saveCredential(event)}
      >
        <input
          required
          type="password"
          autoComplete="new-password"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          placeholder="Store credential securely"
        />
        <button disabled={busy !== ""}>
          {busy === "credential" ? "Saving…" : "Save"}
        </button>
      </form>
      <button
        className="text-button provider-disable"
        disabled={busy !== "" || provider.state === "DISABLED"}
        onClick={() => void disable()}
      >
        Disable provider
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </article>
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
    <section className="settings">
      <form onSubmit={(event) => void submit(event)}>
        <section className="settings-section">
          <div className="settings-heading">
            <p className="eyebrow">HOW GAN WORKS WITH ME</p>
            <h2>Collaboration</h2>
            <p>
              Authority controls what GAN may carry out. Proactivity controls
              which useful problems it brings to you.
            </p>
          </div>
          <fieldset>
            <legend>Decision authority</legend>
            <div className="choice-grid">
              {(
                [
                  [
                    "ask_first",
                    "Ask first",
                    "Recommend work, then wait for my approval.",
                  ],
                  [
                    "recommend_and_proceed",
                    "Recommend and proceed",
                    "Explain the plan and begin unless my judgment is required.",
                  ],
                  [
                    "autonomous_within_policy",
                    "Autonomous within policy",
                    "Handle routine production decisions inside my safeguards.",
                  ],
                ] as const
              ).map(([value, label, detail]) => (
                <label key={value} className="choice-card">
                  <input
                    type="radio"
                    name="authority"
                    value={value}
                    checked={authority === value}
                    onChange={() => setAuthority(value)}
                  />
                  <span>
                    <strong>{label}</strong>
                    <small>{detail}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>How proactive should GAN be?</legend>
            <div className="choice-grid">
              {(
                [
                  ["reactive", "Reactive", "Only work on outcomes I request."],
                  [
                    "balanced",
                    "Balanced",
                    "Surface important adjacent problems without creating noise.",
                  ],
                  [
                    "active",
                    "Active",
                    "Continuously look for meaningful production improvements.",
                  ],
                ] as const
              ).map(([value, label, detail]) => (
                <label key={value} className="choice-card">
                  <input
                    type="radio"
                    name="proactivity"
                    value={value}
                    checked={proactivity === value}
                    onChange={() => setProactivity(value)}
                  />
                  <span>
                    <strong>{label}</strong>
                    <small>{detail}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="settings-note">
            Creative direction, material scope changes, public exposure, and
            spending above your threshold always come back to you.
          </p>
        </section>

        <section className="settings-section">
          <div className="settings-heading">
            <p className="eyebrow">SAFETY & SPENDING</p>
            <h2>Guardrails</h2>
            <p>These safeguards apply even when GAN is highly autonomous.</p>
          </div>
          <dl className="safeguard-list">
            <div>
              <dt>Monthly external AI budget</dt>
              <dd>
                $
                {(
                  (snapshot.policy.monthly_external_budget_cents ?? 2500) / 100
                ).toFixed(2)}
              </dd>
            </div>
            <div>
              <dt>Ask before one paid action</dt>
              <dd>
                From $
                {(
                  (snapshot.policy.approval_threshold_cents ?? 100) / 100
                ).toFixed(2)}
              </dd>
            </div>
            <div>
              <dt>Paid-provider protection</dt>
              <dd>Provider-side hard cap required</dd>
            </div>
            <div>
              <dt>Project history</dt>
              <dd>Work must be registered or reconciled</dd>
            </div>
          </dl>
          <p className="muted">
            Provider credentials, cap proof, and individual reservations are
            managed in Providers.
          </p>
        </section>

        <details className="advanced-tools settings-advanced">
          <summary>
            <span>
              <strong>Advanced and developer settings</strong>
              <small>
                Technical diagnostics and immutable system safeguards
              </small>
            </span>
            <span>Advanced</span>
          </summary>
          <div className="advanced-tools-body">
            <p>
              Provider hard-cap enforcement and work attribution cannot be
              disabled. Raw model and provider configuration remains on the
              Models and Providers pages.
            </p>
          </div>
        </details>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        <div className="settings-save">
          <button className="primary" disabled={busy}>
            {busy ? "Saving…" : "Save collaboration settings"}
          </button>
        </div>
      </form>
    </section>
  );
}
