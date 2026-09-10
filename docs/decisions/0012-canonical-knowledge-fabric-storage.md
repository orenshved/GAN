# ADR 0012: Canonical Knowledge Fabric storage and project isolation

Status: accepted. Initial implementation: Knowledge Fabric specialist-intelligence addendum.

## Context

Specialists need reusable professional knowledge without confusing it with project
facts, live research, measured results, or human judgment. Project material may
contain private creative IP and cannot silently become global training material.
Search indexes must remain disposable rather than becoming a second source of truth.

## Decision

Canonical global expertise is stored under the configurable
`GAMEAGENT_KNOWLEDGE_HOME`, defaulting to `~/.gameagent/knowledge/`. Expertise
Packs are immutable, versioned, human-readable manifests under
`packs/<pack-id>/<version>/pack.yaml`. Large future source payloads use
content-addressed `blobs/sha256/` storage. The pack registry validates source,
method, item, capability, authority, freshness, lifecycle, and version references
before a pack can be selected.

SQLite FTS5 is a rebuildable lexical index. It contains only curated global pack
items. Vector retrieval may be added later as another rebuildable index, but the
system must remain useful without embeddings.

Project Intelligence remains canonical inside each project's `.gameagent/`
history. The Knowledge Router may combine project entries with pinned Expertise
Pack versions in a task-scoped Knowledge Packet. It never writes retrieved project
material to the global directory. Current research and experience candidates remain
separate planes and require explicit review before any global promotion.

Worker records retain exact pack versions, the full knowledge packet, the specialist
definition, and the project context package. Resumes reuse this recorded composition;
new tasks select the latest trusted version. Inspector retrieval distinguishes a
current-context preview from recorded onboarding and worker packets. Legacy workers
without a stored packet remain explicitly without one on resume.

## Consequences

Specialist reasoning becomes inspectable and reproducible. Global packs can be
shared across projects without importing project identity or history. Pack updates
require a new version and validation. Search databases can be deleted and rebuilt
from manifests. Automated experience promotion and autonomous Pack Builder research
remain deliberately out of scope for this decision's first implementation.

## Continuation authorized 2026-09-09

The Director explicitly authorized continuing beyond addendum section 121 through
the remaining Knowledge Fabric work. Phase 12 remains paused. No commit or push
is authorized by this continuation.

The current continuation adds:

| Area                   | Implementation                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Worker reproducibility | Full specialist, method-bearing packet and project context persisted; resume cannot replace composition                         |
| Experience capture     | Idempotent QA observations in project event history                                                                             |
| Distillation           | Repeated failures across tasks become project-local candidates; no causal claim                                                 |
| Validation             | Independent human review; rejected/expired/superseded lessons are not retrieved                                                 |
| Global experience      | Explicit abstraction and privacy approval; only evidence digests exported                                                       |
| Research               | Task-authorized, allowlisted HTTPS, public-address pinning, bounded responses, no redirects; project-local artifacts and expiry |
| Pack drafting          | Isolated read-only Codex draft generation from supplied fresh sources; source metadata and project-identity checks              |
| Pack governance        | Immutable drafts, independent recorded auditions, audit checks, regression blocking, approval receipts and version publication  |
| Recruitment            | Trusted expertise coverage checked before audition; incomplete candidates remain retryable                                      |
| Studio                 | Expertise library, candidate/audition/review forms, research and learning controls                                              |
| Idle maintenance       | Optional local-only capture/distillation, disabled by default; no autonomous promotion or paid calls                            |
| Context budget         | Project-first priority ordering, relevant method/source pruning and a 48 KB knowledge payload ceiling                           |
| Knowledge blocking     | Missing Lead packs withhold onboarding recommendations and persist `BLOCKED_KNOWLEDGE` until coverage is restored               |
| Performance learning   | Per-agent observed method and pack outcomes, labelled correlation rather than causation                                         |
| Recommendation why     | Structured professional reasoning, project evidence, uncertainty, missing evidence, QA plan and source IDs                      |

Human-entered audition scores remain human-attested evidence, not independently
measured by the service. Drafting does not establish pack quality. Existing seed
packs do not constitute a completed professional benchmark program.

Comparative auditions now run baseline and expertise-enriched synthetic scenarios
in separate ephemeral read-only workspaces, followed by a third model evaluator.
Receipts explicitly identify heuristic scoring; invented candidate citations force
a failing score. Paired runs are cancelled together on failure. Human publication
review remains mandatory. The Studio exposes this workflow separately from
human-attested audition evidence.

Recruitment now saves the full expertise snapshot and supplies it to both the
candidate and evaluator. Completed auditions cannot replace their saved packs.
The Agent Inspector reports pack coverage, not a claim of benchmark qualification.

Outstanding program work includes broad Lead Bench qualification, the remaining
baseline packs, autonomous curator policy and benchmark suites, comprehensive source
maintenance and contradiction lifecycle, and the complete portfolio acceptance
suite. Do not mark the entire addendum complete based only on passing software tests.

## Validation

Tests validate pack references, FTS retrieval, Lead-specific onboarding packets,
exact pack versions in the Agent Inspector, and byte-for-byte unchanged global
knowledge storage after project-scoped routing.
