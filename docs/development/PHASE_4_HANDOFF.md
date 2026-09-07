# Phase 4 handoff

Phase 4 implements the first persistent GM planning slice. A Director objective
is sent to a project-scoped authenticated Codex thread, decomposed into a typed
acyclic production plan, matched against the built-in capability roster, and
recorded in canonical event history.

## Delivered

- Project-scoped `GMRecord`, `PlanDraft`, `ProductionPlan`, `PlanAssignment` and
  `InboxDecision` contracts with generated JSON Schema and TypeScript types.
- Persistent GM planning through the authenticated Codex bridge. The GM uses a
  read-only thread and returns structured `PlanDraft` output.
- Deterministic validation for scope, dependency cycles, duplicate work,
  capability gaps, permissions, decision scope and idempotency.
- Six deliberately small built-in capability specialists: project intelligence,
  UX, visual/UI, implementation, QA and local-model expertise.
- Studio Director Desk objective entry, plan/dependency visibility and a Needs
  Oren decision inbox with durable human resolutions.
- Replay, restart, duplicate request, cycle, capability-gap, authority-policy,
  and GM/worker thread-isolation coverage.

## Boundary

Phase 4 does not execute a multidisciplinary plan automatically, hire new
specialists, index project intelligence, or claim authoritative completion.
Phase 5 owns repository/design-document indexing and targeted context assembly.

## Verification

The daemon and Studio build, protocol drift checks, Python tests, and the
existing Studio-to-daemon Playwright smoke flow pass in the clean build path.

## Live preview

[Open the verified GAN Studio preview](http://127.0.0.1:4242/). The local daemon
and Studio were left running for Director review on 2026-09-07.
