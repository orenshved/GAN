# Token Audit Report

<!-- generated 2026-09-10 -->

## Summary

| Metric              | Value                    |
| ------------------- | ------------------------ |
| Source files        | 143                      |
| Total source tokens | ~462.1k                  |
| Naive context cost  | ~462.1k (critical waste) |
| Smart context cost  | ~0 (excellent)           |
| Potential savings   | ~462.1k (100%)           |

## Context Strategy Comparison

| Strategy                    | Tokens  | Assessment         |
| --------------------------- | ------- | ------------------ |
| Naive (read everything)     | ~462.1k | !!! critical waste |
| README-first                | ~70.5k  | !! expensive       |
| Smart (.ai/ + entry points) | ~0      | ✓ excellent        |

## Large Files (Top Token Consumers)

| File                                                                    | Tokens | Size   | Recommendation                           |
| ----------------------------------------------------------------------- | ------ | ------ | ---------------------------------------- |
| `packages/protocol/schema/protocol.schema.json`                         | ~83.2k | 325 KB | Never read in full — use targeted search |
| `apps/studio/app/studio.tsx`                                            | ~42.9k | 168 KB | Never read in full — use targeted search |
| `services/daemon/gameagent/projects.py`                                 | ~34.7k | 136 KB | Never read in full — use targeted search |
| `packages/protocol/src/generated.ts`                                    | ~34.6k | 135 KB | Never read in full — use targeted search |
| `services/daemon/tests/test_persistence.py`                             | ~16.9k | 66 KB  | Read only if directly relevant           |
| `Game Agent Network - Product Requirements & Technical Architecture.md` | ~15.8k | 62 KB  | Read only if directly relevant           |
| `GAN_PRD_ADDENDUM_KNOWLEDGE_FABRIC_SPECIALIST_INTELLIGENCE.md`          | ~14.9k | 58 KB  | Read only if directly relevant           |
| `services/daemon/gameagent/knowledge.py`                                | ~13.3k | 52 KB  | Read only if directly relevant           |
| `services/daemon/gameagent/models/contracts.py`                         | ~11.9k | 46 KB  | Read only if directly relevant           |
| `services/daemon/gameagent/codex_bridge.py`                             | ~11.4k | 44 KB  | Read only if directly relevant           |
| `apps/studio/app/studio.css`                                            | ~10.1k | 39 KB  | Read only if directly relevant           |
| `services/daemon/gameagent/api.py`                                      | ~9.6k  | 38 KB  | Read section by section                  |
| `capabilities/ontology/initial.json`                                    | ~9.1k  | 36 KB  | Read section by section                  |
| `services/daemon/gameagent/local_models.py`                             | ~9.0k  | 35 KB  | Read section by section                  |
| `services/daemon/gameagent/intake.py`                                   | ~6.8k  | 26 KB  | Read section by section                  |

## Context Poison Files

> These files degrade context quality if included.

- `Logo.psd` — very large — splits context budget severely (~1.1M tokens)
- `packages/protocol/schema/protocol.schema.json` — very large — splits context budget severely (~83.2k tokens)
- `apps/studio/app/studio.tsx` — very large — splits context budget severely (~42.9k tokens)
- `services/daemon/gameagent/projects.py` — very large — splits context budget severely (~34.7k tokens)
- `packages/protocol/src/generated.ts` — very large — splits context budget severely (~34.6k tokens)

## Documentation Issues

- **Large doc:** `Game Agent Network - Product Requirements & Technical Architecture.md` (~15.8k tokens) — Split into focused sections or summarize into .ai/
- **Large doc:** `GAN_PRD_ADDENDUM_KNOWLEDGE_FABRIC_SPECIALIST_INTELLIGENCE.md` (~14.9k tokens) — Split into focused sections or summarize into .ai/
- **Possible duplicate:** `adapters/engines/godot/README.md` and `adapters/generation/comfyui/README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/engines/godot/README.md` and `adapters/inference/ollama/README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/engines/godot/README.md` and `adapters/source-control/git/README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/engines/godot/README.md` and `agents/builtin/README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/engines/godot/README.md` and `examples/README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/engines/godot/README.md` and `README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/generation/comfyui/README.md` and `adapters/inference/ollama/README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/generation/comfyui/README.md` and `adapters/source-control/git/README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/generation/comfyui/README.md` and `agents/builtin/README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/generation/comfyui/README.md` and `examples/README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/generation/comfyui/README.md` and `README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/inference/ollama/README.md` and `adapters/source-control/git/README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/inference/ollama/README.md` and `agents/builtin/README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/inference/ollama/README.md` and `examples/README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/inference/ollama/README.md` and `README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/source-control/git/README.md` and `agents/builtin/README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/source-control/git/README.md` and `examples/README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `adapters/source-control/git/README.md` and `README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `agents/builtin/README.md` and `examples/README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `agents/builtin/README.md` and `README.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `AGENTS.md` and `apps/studio/AGENTS.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `AGENTS.md` and `docs/decisions/0006-capability-based-agents.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `apps/studio/AGENTS.md` and `docs/decisions/0006-capability-based-agents.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `apps/studio/CLAUDE.md` and `CLAUDE.md` — Verify these docs don't duplicate each other
- **Possible duplicate:** `examples/README.md` and `README.md` — Verify these docs don't duplicate each other

## Churn Hotspots

> High-churn = frequently broken = agents should check known issues before editing.

- `README.md` — 8 changes
- `packages/protocol/schema/protocol.schema.json` — 8 changes
- `packages/protocol/src/generated.ts` — 8 changes
- `apps/studio/app/api/daemon/[...path]/route.ts` — 7 changes
- `apps/studio/app/studio.css` — 7 changes
- `apps/studio/app/studio.tsx` — 7 changes
- `docs/architecture/MONOREPO.md` — 7 changes
- `scripts/smoke.mjs` — 7 changes
- `services/daemon/gameagent/api.py` — 7 changes
- `services/daemon/gameagent/models/api.py` — 7 changes

## Language Breakdown

| Language   | Files | Tokens  |
| ---------- | ----- | ------- |
| Python     | 35    | ~165.0k |
| JSON       | 28    | ~105.7k |
| TypeScript | 15    | ~85.9k  |
| Markdown   | 44    | ~69.2k  |
| JavaScript | 13    | ~21.9k  |
| CSS        | 2     | ~10.3k  |
| YAML       | 5     | ~3.9k   |
| TOML       | 1     | ~254    |

---

_Regenerate: `node scripts/ai-audit.js`_
