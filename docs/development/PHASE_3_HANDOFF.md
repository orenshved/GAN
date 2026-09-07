# Phase 3 handoff

Phase 3 implements the PRD's direct-work registration invariant without starting
Phase 4 production orchestration.

## Delivered

- `gameagent task start/status/block/complete` records meaningful direct work in
  the same canonical event history used by Studio and replay.
- Initialization inserts or refreshes a managed registration section in the
  repository's root `AGENTS.md` while preserving project-owned instructions.
- The daemon watches meaningful files, Git HEAD and porcelain status for every
  catalogued project. GAN-owned history and dependency/build output are excluded.
- Registered active work suppresses external-change classification; task
  completion records the new accepted workspace baseline.
- Work without registration creates `project.external_change_detected`, exposes
  `requires_reconciliation`, and blocks new task starts until resolved.
- Reconciliation captures changed paths, intervening commits, a bounded Git diff
  summary, content-addressed surviving files and a required human explanation.
  It associates those records with an existing task or creates a reconstructed
  task in `REVIEW`, then appends `project.reconciled`.
- Studio displays an unresolved integrity panel on every view and proxies the
  reconciliation command through its loopback-only route allowlist.
- The background watcher retains and logs per-project failures; `/health` becomes
  degraded rather than silently losing monitoring.

## Acceptance and recovery properties

Canonical JSONL remains authoritative. Replay independently validates external
change baselines, reconciliation task/path associations and legal task state
transitions. SQLite remains disposable and rebuildable. Request IDs make task
commands and reconciliation retries idempotent, including reconstruction events.

Coverage includes CLI commands, generated-instruction preservation, registered
baseline advancement, unresolved-work blocking, repeated detection suppression,
reconciliation replay/rebuild, real Git commit capture, REST routes, and a
production Studio-to-daemon Playwright flow that makes an external edit and clears
it only through reconciliation.

## Phase boundary

Phase 4 has not started. There is no persistent GM, capability matching, task
decomposition, specialist roster, dependency planner or decision inbox. A direct
task completion currently enters `REVIEW`; it does not claim GM-approved project
completion. Repository/design-document indexing and project-intelligence updates
remain Phase 5 work.
