# ADR 0009: Recruiter trust before generalized QA

Status: accepted and implemented as Phase 10 ahead of Phase 7 by Director decision
on 2026-09-08.

## Context

The planned QA fabric needs to know which evaluator capabilities exist and how a
new evaluator becomes trustworthy. Building generalized QA first would bake in a
fixed roster assumption and make later recruitment capable of silently changing
the meaning of a pass.

## Decision

Implement the Phase 10 recruiter before Phase 7 without editing the original PRD
milestone list. Missing complete task capability contracts become explicit,
project-scoped capability gaps. The recruiter searches the global roster and
adjacent ontology families, discovers only installed tools compatible with task
permissions, composes a capability package, and runs separate candidate and
reviewer turns in read-only sandboxes.

An audition pass grants probation, not proof of competence. A probationary agent
is globally reusable but has advisory QA decision authority and requires
independent verification. Recruitment can change evaluator availability; it
cannot change evidence classes, waive gates, promote model output to deterministic
or human evidence, or override the Director. Phase 7 will consume this lifecycle
and QA-role boundary.

Project recruitment transitions are canonical `recruitment.updated` events. The
reusable agent definition is stored in a separate global registry and contains no
project identity, creative direction, task context, or conversation history.

## Consequences

GM planning can recover from known unavailable capabilities instead of leaving
the task blocked or fabricating expertise. Unknown capabilities still fail closed
until the ontology is extended. Failed auditions remain visible and do not enter
the registry. Cross-file global/project publication is idempotent but not a single
transaction; future hardening may add registry reconciliation.

## Validation

Tests cover gap detection, adjacent-agent search, permission-aware tool discovery,
seven-dimension audition admission, untrusted-tool rejection, global registry
persistence, canonical replay, and automatic GM recruitment of an unavailable
test capability.
