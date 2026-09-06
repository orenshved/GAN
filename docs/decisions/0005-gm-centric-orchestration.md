# ADR 0005: GM-centric production authority

Status: accepted for foundation. Runtime orchestration: Phase 4.

## Context

Specialists need freedom to execute contracts without independently changing
production priorities, hiring workers or deciding integration.

## Decision

GM commands own assignment, hiring, priority/scope changes, integration and
completion. Workers publish findings, results, blockers and capability gaps.
Humans own intent and overrides; human choices are recorded and then executed
through the GM. Distinguish worker-reported success from authoritative task completion.

Authority and proactivity are independent settings. Authority defaults to
recommend-and-proceed; proactivity defaults to balanced. Mandatory creative,
scope, money, irreversible-structure, public-exposure and unresolved player-facing
decisions still require human resolution at every authority level. Proactive
findings do not themselves grant implementation permission.

Use an explicit task state machine. Review and integration cannot be skipped.
Track measurable progress; strategy changes or specialist intervention replace
blind retries. Three further non-progress failures after intervention escalate
to Oren. Current pure guards specify these boundaries without scheduling work.

## Alternatives and consequences

Peer-to-peer authority is flexible but obscures ownership and permits conflicting
scope decisions. The GM can bottleneck, so execution can later be concurrent while
production decisions remain serialized per project. Actor strings are not authentication;
the future command boundary must bind trusted identity to each request.

## Validation

Actor/event admission, task transition, human rejection, gate, reconciliation and
failure-ladder tests now. Phase 4 tests policy escalation and persisted GM recovery.
