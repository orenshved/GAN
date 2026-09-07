"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import type {
  EventPage,
  Policy,
  ProjectSnapshot,
  TaskContract,
  TaskProposal,
} from "@gameagent/protocol";

const Network = dynamic(() => import("./network"), {
  loading: () => <p role="status">Loading network…</p>,
  ssr: false,
});
const views = [
  "Director Desk",
  "Production",
  "Workers",
  "Network",
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
    signal: AbortSignal.timeout(10000),
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
  const [streamState, setStreamState] = useState("Connecting");
  const cursor = useRef(0);
  const [activityAfter, setActivityAfter] = useState(0);
  const project = useQuery({
    queryKey: ["project"],
    queryFn: () => request<ProjectSnapshot>(connection, "/project"),
  });
  const history = useQuery({
    queryKey: ["events", activityAfter],
    queryFn: () =>
      request<EventPage>(
        connection,
        `/events?after=${activityAfter}&limit=100`,
      ),
    enabled: !!project.data,
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
  }, [ready, connection.websocketUrl, client]);

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
          <span className="brand-mark">G</span>
          <span>
            GAME AGENT
            <br />
            <strong>NETWORK</strong>
          </span>
        </div>
        <div className="project-label">
          <span className="eyebrow">PROJECT</span>
          <strong>{snapshot?.project.project.name ?? "Connecting…"}</strong>
          <span>{snapshot?.project.medium.replaceAll("_", " ")}</span>
        </div>
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
          {snapshot && (
            <>
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
                <section className="panel">
                  <div className="section-heading">
                    <h2>Task contracts</h2>
                    <span className="muted">{tasks.length} total</span>
                  </div>
                  <TaskTable tasks={tasks} select={selectTask} />
                </section>
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
    </div>
  );
}

const descriptions: Record<Exclude<View, "Director Desk">, string> = {
  Workers: "Run and resume read-only Codex analysis for a proposed task.",
  Production: "Outcome-driven contracts, ready for planning.",
  Network: "The actual dependencies between project tasks.",
  Activity: "Every recorded action, attributable and inspectable.",
  Settings: "Define how the project may proceed.",
};
const policyLabels: Record<NonNullable<Policy["authority"]>, string> = {
  ask_first: "Ask first",
  recommend_and_proceed: "Recommend and proceed",
  autonomous_within_policy: "Autonomous within policy",
};
function Metric({ label, value }: { label: string; value: number }) {
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
