# Codex to Claude

## OBJECTIVE

Audit the four existing GAN Expertise Packs as professional knowledge-engineering artifacts and prepare compact, source-backed successor candidates plus discriminating benchmark scenarios.

## WHAT CHANGED

Codex implemented the pack schema/registry, immutable governance, provenance/freshness, FTS routing, bounded four-plane packets, Pack Builder, separate candidate/evaluator auditions, lifecycle, maintenance reports, and Studio inspection. Software gates pass; professional qualification is not claimed.

## FILES/PATHS

- Read first: `.ai/PROJECT_STATE.md`, `.ai/AGENT_RULES.md`, `.ai/KNOWN_ISSUES.md`, `docs/AI_WORK_SPLIT.md`.
- Run: `node scripts/ai-index.js` if stale, `node scripts/ai-audit.js`, then `node scripts/ai-doctor.js --task "Audit the four existing Expertise Packs and design professional benchmark scenarios"`.
- Owned content: `expertise/builtin/game-ux-core/`, `expertise/builtin/game-engineering-core/`, `expertise/builtin/game-qa-core/`, `expertise/builtin/godot-ui-engineering/`, and agreed expertise benchmark fixtures.
- Contract reference: `services/daemon/gameagent/models/contracts.py` (`KnowledgeSource`, `KnowledgeMethod`, `ExpertiseKnowledgeItem`, `ExpertisePack`).

## DECISIONS MADE

- Existing `1.0.0` manifests are immutable once installed. Corrections require new versions.
- Drafts and heuristic model auditions are not human/professional proof.
- Knowledge is not project evidence; sources, methods, and uncertainty must remain explicit.
- Quality matters more than completing the pack count.

## CONTRACTS THE OTHER SIDE MUST RESPECT

- Do not edit Pydantic/runtime architecture or generated schema/TypeScript.
- Do not copy project identity, history, private taste, or copyrighted full text into global packs.
- Every item and method must reference declared sources; every pack needs at least one method and evaluation ID.
- Use authoritative sources, explicit licenses, applicable capabilities, and honest freshness classes.
- Create candidate successor versions; do not mark them active or reviewed.

## BLOCKERS

- Claude Code is not installed locally. Oren must install/authenticate it or run this exact handoff in Claude Code.
- A benchmark fixture location may need Codex confirmation if no existing path is suitable.

## QUESTIONS

- Do the current schemas adequately represent checklists, playbooks, anti-patterns, and evidence expectations, or is one narrow contract extension needed?
- Which current claims are generic, unsupported, stale, or professionally misleading?

## NEXT ACTION

Produce an audit table for the four packs, then implement only the smallest coherent successor-pack batch and benchmark scenarios. Record runtime/schema requests in `.ai/handoffs/claude-to-codex.md`. Do not mass-produce the ten missing packs in this first assignment.
