# Phase 7 handoff

Phase 7 generalizes the Phase 6 runtime capture into an evidence-backed QA fabric
after the Phase 10 recruiter established evaluator trust boundaries.

## Delivered

| Area               | Operating result                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate catalog       | Versioned UI and engineering gates declare claims, allowed producers, required evidence classes, runtime-capture requirements, and independent-verification requirements. |
| Evidence classes   | Deterministic, measured, comparative, heuristic, and human evidence remain distinct throughout Pydantic, generated schema, TypeScript, canonical events, and Studio.      |
| QA run             | The initial deterministic contract gate records a content-addressed JSON artifact covering contract validity, dependencies, project scope, known gates, and deliverables. |
| Reports            | A derived task report shows passed, failed, inconclusive, missing, advisory, and waived gates with linked evidence and a plain-language completion explanation.           |
| Recruiter boundary | Probationary evaluators can record advisory recommendations, but their passes cannot satisfy required gates without independent authoritative verification.               |
| Human authority    | Director observations, approvals, and rejections become human evidence. Rejection overrides automated passes. Explicit task/gate waivers are canonical audit events.      |
| Studio             | The primary QA screen filters UI/engineering gates, runs deterministic checks, records Director judgment and waivers, and drills into raw evidence/evaluation records.    |

## Verified result

- `pnpm check` passes formatting, lint, protocol drift, Python/TypeScript typing,
  146 daemon tests, 54 cross-language protocol tests, all production builds, and
  the Studio↔daemon Playwright smoke.
- Browser acceptance creates a real task, opens QA, observes the missing required
  gate, runs the deterministic check, and renders the recorded rationale.
- Replay tests verify human rejection, advisory non-admission, content digest,
  idempotent QA runs, and durable Director waivers.

## Boundaries retained

- The PRD is unchanged.
- Reports are projections over canonical evidence, evaluations, and waivers.
- Model output remains heuristic; visual passes still require tool-produced runtime
  evidence, and fun claims still require human evidence.
- Phase 8 has not started.

## Preview

[Open the verified GAN Studio QA screen](http://127.0.0.1:4242/) and select **QA**.
