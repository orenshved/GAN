# Phase 1 handoff

## Delivered

| Area              | Result                                                                                                                                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initialization    | `gameagent init [PATH]` resolves a Git root; detects Godot, Unity or Unreal; samples scenes; inventories documents/assets; records Git HEAD; separates known, inferred and missing findings; creates `.gameagent` atomically. |
| Canonical history | Typed, sequence-checked JSONL events with rotation, process locking, durable flush/fsync, duplicate request handling and explicit corruption failures.                                                                        |
| Projection        | Alembic-managed SQLite in WAL/FULL-sync mode; the database can be deleted or rebuilt deterministically from events.                                                                                                           |
| Daemon            | Loopback FastAPI service for project state, paged events, task proposals, policy updates and WebSocket replay.                                                                                                                |
| Authentication    | HTTP bearer token stays on the Next.js server. Browser WebSockets exchange it for a ten-second, single-use ticket and require the configured Studio origin.                                                                   |
| Studio            | Director Desk, Production, Network, Inspector, Activity and Settings use daemon state through TanStack Query and React Flow. Empty/loading/error states are explicit.                                                         |
| Tooling           | `pnpm dev` starts daemon and Studio from dotenv configuration. `pnpm check` includes a production Playwright flow across both services.                                                                                       |

## Canonical project layout

```text
.gameagent/
  project.yaml
  policy.yaml
  agents.lock.json
  events/events-0001.jsonl
  manifests/intake.yaml
  contracts/<sha256>.json
  decisions/
  evaluations/
  references/
  projection.sqlite3       rebuildable, ignored by Git
  writer.lock              transient, ignored by Git
```

`project.yaml`, `policy.yaml` and `manifests/intake.yaml` are initialization
manifests checked against the first event. Later policy values are events and
projection state. Contract exports are content-addressed references; replay uses
the full typed event payload as the authoritative revision.

## Verification

Local Windows result on 2026-09-06:

- 106 Python tests passed.
- 43 Node contract tests passed.
- Ruff, ESLint, mypy, TypeScript and protocol drift checks passed.
- All ten workspaces built, including the Python wheel/sdist and production Studio.
- Playwright initialized a temporary Godot project, started the authenticated
  daemon and Studio, proposed a task, observed its Activity event and rendered
  the Network node.

Run `pnpm check` from the repository root. CI installs Chromium and runs the same
gate on Windows and Linux with Python 3.12 and Node 24.

## Phase boundary

Phase 2 has not started. There is no Codex account detection, ChatGPT auth flow,
worker thread lifecycle, workspace isolation, worker output ingestion or worker
status UI. Task creation in Phase 1 records a proposal; it does not execute work.

GAN work registration/reconciliation also does not exist yet. Current repository
changes therefore cannot claim registration and must be reconciled when that
protocol is implemented.
