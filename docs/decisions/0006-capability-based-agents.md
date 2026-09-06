# ADR 0006: Capability-based global agent definitions

Status: accepted for foundation. Matching/recruitment: Phases 4 and 10.

## Context

Games span disciplines and engines. Hard-coded personalities and fixed role
enums cannot express extensible production capabilities.

## Decision

A capability defines versioned inputs, outputs and evaluation requirements.
An agent definition composes capabilities, instructions, preferred/fallback
models, independent tool IDs, permissions, resource policy and QA gates.
Populate the complete PRD section 15 ontology as declarative data. New capability
IDs require no changes to GM core. Do not seed dozens of executable agents.

Global agent definitions are reusable; assignments separately pin agent version,
project, task, workspace, sandbox and worker thread. Creative identity, references
and conversation memory are project-scoped. Capabilities are claims to validate
through auditions and task-specific evidence, not proof of competence.

Performance history will be separate records keyed by capability, project,
task type, model and toolchain, including quality, revisions, rejection, cost and
latency. No single global agent score or project-derived creative memory is embedded
in the reusable definition.

## Alternatives and consequences

Persona rosters encourage organizational theater. Embedding executable tools
inside agents prevents independent health, permissions and version checks.
Version pinning costs migration work but preserves reproducibility. Facade packages
publish contracts now; actual registry storage and selection wait for Phase 4.

## Validation

Ontology completeness/extension, required capability/output fields, unknown-field
rejection, separate tool schema and scoped assignment compatibility tests.
