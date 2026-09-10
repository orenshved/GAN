# Next Best Actions

## Immediate

- [ ] **Review the Codex/Claude workload split** — confirm ownership before another large implementation phase.
  - _Context:_ `docs/AI_WORK_SPLIT.md`, `.ai/handoffs/codex-to-claude.md`
- [ ] **Create isolated worktrees from the verified checkpoint** — use `codex/platform-runtime` and `claude/professional-knowledge` branches without sharing edited paths.

## High Priority

- [ ] **Claude: curate and qualify the first missing pack slice** — begin with `game-production-core` and `game-design-core`; source-backed quality over count.
- [ ] **Codex: complete worker composition and postmortem receipts** — make historical results reproducible without inventing root cause.
- [ ] **Cross-review the existing four seed packs** — Claude reviews professional adequacy; Codex reviews schema, retrieval, maintenance, and benchmark integration.
- [ ] **Implement the remaining Knowledge Fabric acceptance stories** — generic-vs-specialist, domain projection, freshness, new expertise, learning, isolation, regression, and Studio provenance drilldown.

## Backlog

- [ ] Add import/update/inspect CLI operations for expertise packs.
- [ ] Expand Lead Bench runtime definitions only when matching expertise is qualified.
- [ ] Consider a rebuildable semantic index after lexical retrieval and packet budgets are proven insufficient.

## Blocked

- [ ] **Phase 12 desktop packaging** — blocked by explicit Director decision until the system feels ready and complete.

## Completed

- [x] **2026-09-10: Install RepoDoctor and create focused project memory.**
- [x] **2026-09-10: Stabilize the current Knowledge Fabric checkpoint and pass `pnpm check`.**

---

_Last updated: 2026-09-10_
