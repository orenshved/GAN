# Decisions

## Active Decisions

### Codex/Claude split with Codex integration ownership

**Date:** 2026-09-10  
**Status:** active  
**Deciders:** Oren

**Decision:** Codex owns executable architecture and final integration. Claude owns professional expertise content and benchmark design. Gemini is opt-in only for a specific independent-review advantage.

**Why:** GAN is too large for repeated single-model broad context; work must be divided by comparative strength without creating competing implementations.

**Consequences:** Separate branches/worktrees, narrow path ownership, RepoDoctor at workstream start, compact `.ai/handoffs/`, and cross-review before integration.

**Do not change without:** A documented Director decision.

### Canonical knowledge is portable; indexes are derived

**Date:** 2026-09-09  
**Status:** active  
**Deciders:** Oren, Codex

**Decision:** Global expertise uses immutable versioned manifests and content-addressed blobs. Project knowledge remains in project history. SQLite/FTS are rebuildable indexes only.

**Why:** Specialist reproducibility and cross-project reuse must not leak project IP or create competing truth stores.

**Consequences:** New pack versions require review; project facts never enter global expertise automatically; historical workers pin exact packets.

**Do not change without:** A replacement isolation, migration, and reproducibility design.

### Phase 12 remains paused

**Date:** 2026-09-09  
**Status:** active  
**Deciders:** Oren

**Decision:** Do not begin desktop packaging until the system is judged ready and complete.

**Why:** Product behavior and specialist intelligence must stabilize before packaging.

**Consequences:** Current effort remains on system completeness and Knowledge Fabric; packaging work is blocked.

**Do not change without:** Explicit Director approval.

## Reversed / Superseded Decisions

None.

---

_Last updated: 2026-09-10_
