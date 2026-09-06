# ADR 0007: Evidence-backed QA and human judgment

Status: accepted for foundation. Capture and evaluation workflows: Phases 6–7.

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

Future artifact admission verifies bytes/digest and capture provenance. Supplying
a URI and hash is a contract, not proof of artifact authenticity. The current
foundation guards consume trusted records; callers cannot manufacture approval
by labeling a model response as human evidence.

## Alternatives and consequences

Single numeric scores hide uncertainty and invite false claims. Model-only review
is inexpensive but insufficient. Evidence storage/capture is additional work;
retain locators/manifests in canonical history and keep large artifacts outside
JSONL. Gate waivers remain inspectable decisions, never silent exceptions.

## Validation

Tests cover missing/foreign/duplicate evidence, model self-certification, absent
runtime capture, fun claims, latest failing gates, human rejection and audit waivers.
Future tests verify authentic runtime capture and immutable artifact references.
