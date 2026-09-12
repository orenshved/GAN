# Working History

## Sessions

### 2026-09-10 Codex — Package Phase 12 desktop runtime

**Outcome:** ready for review
**Changed:** `apps/desktop/`, `scripts/package-desktop.mjs`, Studio standalone output, daemon PyInstaller configuration, CI, environment examples, tests, and Phase 12 documentation
**Approach:** Kept Electron as a process/security shell around the existing authenticated loopback architecture. Materialized pnpm's linked Next.js standalone dependency tree into an ordinary ASAR, packaged the Python daemon independently, and copied the same daemon bundle into a headless distribution.
**What worked:** The unpacked desktop application launched both real packaged services; authenticated daemon health, Studio health, project loading, Production navigation, and all 12 agent-network nodes passed.
**What didn't:** Directly archiving pnpm links broke transitive module resolution. A cycle-safe materialization pass plus flattened standalone adjacency fixed the packaged Next.js runtime. A first headless status probe also required UTF-8 console mode on Windows.
**Issues added:** Windows x64 is the only packaged target and the installer is not signed by a trusted publisher.
**Next:** Director review of the installer and live packaged preview; address only concrete packaging findings before release versioning/signing.

### 2026-09-11 Codex — Repair first-run Windows desktop startup

**Outcome:** success
**Changed:** Desktop argument parsing, dotenv persistence and folder-selection copy; global Knowledge Directory containment; regression tests; rebuilt Windows artifacts
**Approach:** Reproduced the silent exit from the packaged executable, traced each daemon failure from the desktop log, and retained the global/project isolation rule while making it robust to Windows path virtualization.
**What worked:** The rebuilt portable executable accepts either `--project=PATH` or a positional repository path, self-heals previously doubled config paths, launches both packaged services, and shows a responsive Studio window.
**What didn't:** The first attempted fix compared two resolved paths, but Windows virtualized the file and directory differently. Normalized lexical containment with explicit symlink rejection handled both security and platform behavior.
**Next:** Rebuild the NSIS installer and keep this startup path in the Phase 12 acceptance gate.

### 2026-09-10 Codex — Stabilize Knowledge Fabric checkpoint and adopt multi-LLM workflow

**Outcome:** success  
**Changed:** Knowledge Fabric/recruiter/contracts/Studio/tests, RepoDoctor tooling and `.ai/` memory, `docs/AI_WORK_SPLIT.md`  
**Approach:** Preserved canonical project/global boundaries; added composition diagnosis, qualification-aware network filters, stale-knowledge blocking, baseline tracking, and interruptible knowledge maintenance. Installed RepoDoctor, ran its audit/doctor flow, and repaired integration drift.  
**What worked:** Generated contracts stayed Pydantic-owned; deterministic pytest/Node tests plus Playwright exposed stale roster-count assertions.  
**What didn't:** The first `pnpm check` treated RepoDoctor CommonJS utilities as project ESM, and browser smoke hard-coded the old roster size. Both were corrected.  
**Issues added:** Incomplete professional pack baseline, remaining runtime acceptance gaps, Starlette deprecations.  
**Next:** Commit/push this verified checkpoint, create isolated Codex/Claude worktrees, show the split, then begin narrow workstreams only after review.

---

_Last updated: 2026-09-10_
