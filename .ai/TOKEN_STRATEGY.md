# Token Strategy

<!-- This file defines the context budget and retrieval rules for this project.
     `ai-index` generates an initial version; customize it with project-specific rules. -->

## Budget Targets

| Phase            | Target       | Action if exceeded            |
| ---------------- | ------------ | ----------------------------- |
| Session start    | < 8k tokens  | Read only .ai/ files          |
| Task planning    | < 16k tokens | Use indexes, not full files   |
| Active editing   | < 32k tokens | Read only affected files      |
| Deep exploration | < 50k tokens | Targeted grep, not full reads |

## Retrieval Layer Priority

Use the cheapest source that can answer the question:

1. **`.ai/` files** — pre-summarized project state (< 2k tokens total)
2. **`ai-doctor` output** — task-focused file recommendations
3. **codebase-memory-mcp** — structural queries without reading files
4. **Serena** — symbol-level search, targeted edits
5. **Direct file reads** — only when layers 1–4 are insufficient

## Never Read (Without Explicit Need)

```
node_modules/
dist/
build/
.next/
out/
coverage/
.cache/
*.lock
*.map
*.min.js
*.min.css
*.d.ts
```

## Project-Specific High-Cost Files

- `Logo.psd` — binary source asset; never read as text.
- `packages/protocol/schema/protocol.schema.json` — generated; inspect Pydantic instead.
- `packages/protocol/src/generated.ts` — generated; inspect Pydantic instead.
- `apps/studio/app/studio.tsx` — large; locate symbols with `rg`, then read narrow ranges.
- `services/daemon/gameagent/projects.py` — large; locate commands with `rg`, then read narrow ranges.
- `GAN_PRD_ADDENDUM_KNOWLEDGE_FABRIC_SPECIALIST_INTELLIGENCE.md` — read only scoped numbered sections.

<!-- List your project's specific files that are large or low-signal. -->
<!-- Example:
- `src/generated/schema.ts` — 15k tokens, auto-generated, never read directly
- `public/icons/sprite.svg` — 8k tokens, asset file, not code
-->

_Run `node scripts/ai-audit.js` to discover large files in your project._

## High-Value First Reads

For any task, start here before reading source files:

1. `.ai/PROJECT_STATE.md` (~1k tokens)
2. `.ai/AGENT_RULES.md` (~1k tokens)
3. `.ai/KNOWN_ISSUES.md` (~0.5k tokens)
4. `.ai/CONTEXT_INDEX.md` (~2k tokens, scan the relevant sections)

Total: ~4.5k tokens before touching source code.

## Caching Notes

_If using a provider that supports prompt caching (e.g. Anthropic cache_control):_

- The `.ai/` files are ideal cache candidates — they're stable across sessions.
- Cache the system prompt + `.ai/` context block.
- Don't cache per-file content — it changes too often.

---

_Last updated: 2026-09-10_
