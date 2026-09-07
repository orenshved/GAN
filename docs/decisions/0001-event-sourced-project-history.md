# ADR 0001: Event-sourced project history

Status: accepted for foundation. Persistence implementation: Phase 1.

## Context

Project knowledge cannot disappear with a worker conversation or local database.
Direct work, overrides, failed attempts and QA must remain attributable and diffable.

## Decision

Use append-only versioned JSONL events in each project's `.gameagent/events/`.
Canonical project, policy, contract, decision and evidence manifests accompany
events. Events contain identity, UTC time, actor, correlation, project/task scope
and typed payloads. SQLite is not canonical history.

Phase 1 must establish one append owner, flush/fsync before projection acknowledgement,
event-ID deduplication, deterministic ordering across rotated segments, and explicit
handling of truncated tails, malformed records and unsupported versions. Never
silently skip corrupt history. Rebuilds use immutable referenced contract/artifact
revisions, not whichever mutable file happens to exist later.

A small daemon-level catalog may retain project IDs, resolved repository roots and
the current selection so Studio can move between projects. This catalog is routing
metadata, not project truth. Importing an existing local repository initializes its
own `.gameagent`; switching projects never copies history or worker threads between
repositories.

## Alternatives and consequences

A SQLite-only log simplifies transactions but fails portable Git-friendly history.
Mutable JSON snapshots lose causality. JSONL needs explicit crash/replay semantics
and conflict handling. Corrections use new events; upcasters interpret old schemas
without rewriting the original history. Project copies must not silently share
an active writer identity.

## Validation

Phase 0 validates event union shape, version and actor/task admission. Phase 1
requires restart, duplicate delivery, rotated log, corrupt-tail and identical-replay
tests. No event writer or durability guarantee is claimed by this phase.
