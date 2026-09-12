# Known Issues

## Open Issues

### Desktop packaging: first release is Windows-only and unsigned

**Status:** open
**Severity:** medium
**Affected paths:** `apps/desktop/`, `scripts/package-desktop.mjs`, release automation
**Symptoms:** Phase 12 produces a Windows x64 NSIS installer and unpacked application only. Windows may show an unknown-publisher warning because no trusted signing certificate is configured.
**Next:** Add platform targets and trusted code signing when distribution requirements are known; do not block local Director review.

### Knowledge Fabric: initial professional baseline is incomplete

**Status:** open  
**Severity:** high  
**Affected paths:** `expertise/builtin/`, `agents/builtin/roster.json`, Knowledge catalog UI  
**Symptoms:** Four of fourteen initial packs exist. Ten remain missing, and the existing seeds lack a completed professional benchmark/portfolio qualification program.  
**Current approach:** Claude owns source-backed content and benchmarks; Codex owns schema, loaders, governance, and integration.  
**Next:** Execute the narrow Claude pack workstream after the workload split is reviewed.

### Knowledge Fabric: remaining runtime acceptance gaps

**Status:** open  
**Severity:** medium  
**Affected paths:** `services/daemon/gameagent/`, `apps/studio/`, acceptance tests  
**Symptoms:** Exact worker model/tool/QA composition receipts, evidence-bound failure postmortems, importable pack CLI, richer contradiction/source maintenance, and the complete portfolio acceptance suite remain.  
**Next:** Codex implements these as separate verified slices.

### Dependencies: Starlette test-client deprecations

**Status:** open  
**Severity:** low  
**Symptoms:** The passing daemon suite emits two upstream deprecation warnings involving Starlette/httpx compatibility aliases.  
**Next:** Address during dependency maintenance; no current behavior failure.

## Resolved Issues

### 2026-09-11 — Packaged desktop exited after project selection

**Root cause:** Desktop dotenv serialization repeatedly doubled Windows path separators, the global-knowledge containment check did not account for Windows/AppContainer path virtualization, and the documented positional project argument was not accepted.
**Fix:** Preserve dotenv path values exactly, normalize saved paths on startup, use lexical containment plus explicit symlink rejection for global knowledge, accept positional packaged project paths, and clarify the project-folder prompt.

### 2026-09-10 — Packaged Studio could not resolve pnpm-linked dependencies

**Root cause:** Next.js standalone output retained pnpm links whose targets were not valid inside the desktop archive, and transitive dependencies expected package-manager adjacency.
**Fix:** Materialize the standalone graph into ordinary files, flatten its transitive dependency adjacency, then create and verify the Studio ASAR.

### 2026-09-10 — Smoke tests hard-coded the old roster size

**Root cause:** Browser assertions expected six agents after onboarding added five Leads.  
**Fix:** Derive all/available network and registry counts from daemon responses.

### 2026-09-10 — RepoDoctor CommonJS scripts failed repository ESLint

**Root cause:** Vendored RepoDoctor utilities use CommonJS while project ESLint treats JavaScript as ESM/TypeScript.  
**Fix:** Exclude only `scripts/ai-*.js` and `scripts/lib/*.js`; RepoDoctor remains independently executable.

## Fragile Areas

- Generated protocol output is large and must only change through Pydantic generation.
- Built-in pack versions are immutable after installation; update sources through a new reviewed version.
- Recruitment replay pins expertise once auditioning begins.
- Worker resume must preserve the original specialist, packet, and project context.

---

_Last updated: 2026-09-10_
