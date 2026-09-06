# ADR 0002: SQLite as rebuildable operational projections

Status: accepted for foundation. Implementation: Phase 1.

## Context

The local desk needs indexed task, session and search queries without a hosted
database. Operational state must be disposable and reconstructable.

## Decision

Use SQLite WAL, accessed behind Python repository interfaces. SQLAlchemy and
Alembic manage projections and schema changes when persistence is implemented.
Record projection version and applied event cursor transactionally. A canonical
append precedes projection advancement; startup catches up after a crash.
Do not dual-write independent business truth to events and SQL.

Rebuild from canonical manifests and the ordered event stream into a replacement
database, validate the cursor, then swap while queries are coordinated. Persist
thread IDs through canonical assignment events/manifests, not only SQL sessions.
Never commit databases, WAL or SHM files. Queries must always include project scope.

## Alternatives and consequences

Postgres is suitable later for multi-user operation but adds infrastructure now.
Domain interfaces must not expose ORM sessions or SQLite SQL so that change stays
inside persistence. JSONL scans are simple but unsuitable for every UI query.
WAL still has a single writer and requires explicit transaction/retry discipline.

## Validation

Git-ignore and dependency-boundary tests exist now. Phase 1 tests schema migration,
crash recovery, cursor atomicity, replay parity and engine-independent repositories.
