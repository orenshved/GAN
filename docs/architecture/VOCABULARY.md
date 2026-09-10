# Domain vocabulary

| Term              | Meaning / source of truth                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Director          | Human intent, creative judgment and explicit overrides                                                                   |
| GM                | Sole production authority, constrained by policy and human decisions                                                     |
| Capability        | Versioned, extensible production outcome contract, not a role title                                                      |
| Agent definition  | Global capability package, instructions, model/tool choices, permissions, evaluations                                    |
| Assignment        | Project/task-scoped use of a pinned agent version and isolated worker thread                                             |
| Tool              | Independently versioned callable adapter with input/output contracts                                                     |
| Task contract     | Desired outcome, dependencies, constraints, permissions and required QA                                                  |
| Event             | Canonical append-only production history, typed and attributable                                                         |
| Projection        | Rebuildable query state derived from canonical files and events                                                          |
| Knowledge entry   | Typed source fact, deterministic consequence, inference, hypothesis, constraint or decision with provenance              |
| Knowledge plane   | Project, discipline, world or experience scope; planes remain epistemically distinct                                     |
| Expertise Pack    | Reviewed, versioned professional knowledge, methods, sources, benchmarks and evaluations for capabilities                |
| Knowledge source  | Provenance record with authority, retrieval/publication time, freshness, license and applicable capabilities             |
| Method            | Callable specialist procedure with steps, evidence requirements and source links                                         |
| Knowledge Packet  | Bounded task/agent context containing pinned packs, selected items, provenance, freshness and missing-knowledge flags    |
| Knowledge Router  | Domain-aware selector that combines project truth with qualified global expertise without merging or promoting either    |
| Experience record | Project-scoped observed result staged for review; never automatically reusable global truth                              |
| Evidence          | Inspectable artifact/reference, origin, producer, digest, time, scope and one of five evidence classes                   |
| Evaluation        | Gate outcome and rationale linked to evidence; does not supersede human judgment                                         |
| Decision          | Durable human selection with rationale, alternatives and consequences                                                    |
| Provider cap      | Verified provider-side bound; application accounting alone is insufficient                                               |
| Spend approval    | Human authorization for one provider, invocation request ID, exact upper-bound amount and expiry                         |
| Reservation       | Durable upper-bound budget hold created atomically before a paid provider can execute                                    |
| Paid invocation   | Gateway-mediated external call whose outcome and reconciled cost are recorded without prompt or credential content       |
| Production domain | Versioned discipline slice whose contract, read-only tool, QA gate, evidence, task history and Studio view ship together |
| Domain inspection | Task-scoped structural audit; evidence of readable project material, never proof of creative quality or fun              |
| Reconciliation    | Required attribution of meaningful work performed outside registered tasks                                               |
| Recovery          | Measured progress or change of strategy; three further non-progress failures after specialist intervention escalate      |
| Capability gap    | Project/task-scoped record that no registered agent satisfies the complete required capability contract                  |
| Recruiter         | GM-controlled subsystem that searches, composes, auditions and admits capability packages                                |
| Audition          | Read-only representative sandbox task plus independent seven-dimension review; qualification, not QA evidence            |
| Probation         | Globally available agent lifecycle with advisory QA authority and mandatory independent verification                     |
| QA gate           | Reusable discipline policy defining claim, required evidence classes, producers and runtime/independence rules           |
| QA report         | Derived task view explaining each required or optional gate without creating a second source of truth                    |
| Gate waiver       | Canonical, task-scoped Director exception that satisfies one required gate while preserving the rationale                |
| Local inventory   | Live machine hardware and installed Ollama metadata; never project or conversation truth                                 |
| Model benchmark   | Project/task-scoped representative execution pinned to model digest, output contract, latency and artifact               |
| Model route       | Canonical comparison and selected viable execution path with quality, confidence, runtime, cost and rationale            |

Evidence classes are deterministic, measured, comparative, heuristic and human.
Confidence, evidence class and human acceptance are distinct dimensions.
Model-generated claims remain heuristic; a model can interpret independent
captures without becoming the source of those captures.
Evaluation authority is advisory, eligible, or human. An advisory pass remains
visible but cannot satisfy completion.

PRD sections 12, 16 and 18 show conceptual YAML. The versioned implementation
uses explicit top-level IDs and `_ids` reference arrays instead of ambiguous
nested names. Dollar values use `_cents`; permissions are separately named
actions. JSON fixtures demonstrate the canonical wire format.
