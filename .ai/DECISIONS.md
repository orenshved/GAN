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

### Phase 12 uses an Electron process shell without changing daemon authority

**Date:** 2026-09-10
**Status:** active
**Deciders:** Oren, Codex

**Decision:** Package the local Studio and daemon for Windows x64 with Electron. Electron owns their process lifecycle, but the authenticated loopback daemon remains the only production authority. Ship the daemon separately for headless CLI/service use.

**Why:** The Director explicitly authorized Phase 12 after the runtime and specialist-intelligence architecture stabilized. Electron can package the existing Next.js standalone server and Python daemon without moving domain logic into the desktop shell.

**Consequences:** The desktop shell launches both services on loopback, generates or loads local configuration, verifies the Studio archive digest, restricts browser capabilities, and shuts down owned child processes. Core, CLI, and headless service boundaries remain intact.

**Do not change without:** A replacement design that preserves daemon authority, CLI parity, project isolation, and authenticated loopback access.

## Reversed / Superseded Decisions

### Phase 12 remains paused

**Date:** 2026-09-09
**Superseded:** 2026-09-10 by explicit Director authorization to begin Phase 12.

---

_Last updated: 2026-09-10_
