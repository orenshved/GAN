# ADR 0007: Evidence-backed QA and human judgment

Status: accepted and implemented in Phases 6–7.

## Context

Creator/reviewer model agreement is not evidence of runtime quality or fun.
Passing automated gates cannot override the Director's judgment.

## Decision

Each evidence record identifies class, producer, capture origin/time, artifact
URI/digest/media type and project/task scope. Evaluations reference evidence and
state gate, claim, result and rationale. Use deterministic, measured, comparative,
heuristic and human evidence as distinct classes. A model's own output is heuristic.

Visual passes require actual tool-produced runtime capture and cannot rely only
on model judgment. Strong fun claims require human evidence. Human rejection
blocks completion even if every automated gate passed. All required gates must
pass using their latest result, or have scoped human waiver audit events.

Artifact serving verifies current bytes against the canonical digest and remains
confined to the project evidence directory. Supplying a URI and hash alone is not
proof of authenticity. Command handlers enforce actor, project, task, producer,
evidence-class and gate-policy boundaries; callers cannot manufacture approval by
labeling a model response as human evidence.

Evaluations persist their authority as advisory, eligible, or human. A pass from
a probationary evaluator remains advisory until independently verified. QA reports
are derived views, not canonical truth, and explain each gate with linked evidence.

## Alternatives and consequences

Single numeric scores hide uncertainty and invite false claims. Model-only review
is inexpensive but insufficient. Evidence storage/capture is additional work;
retain locators/manifests in canonical history and keep large artifacts outside
JSONL. Gate waivers remain inspectable decisions, never silent exceptions.

## Validation

Tests cover missing/foreign/duplicate evidence, model self-certification, absent
runtime capture, fun claims, all five evidence classes, latest failing gates,
probationary advisory results, human rejection, durable audit waivers, artifact
digests and report explanations.
