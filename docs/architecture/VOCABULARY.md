# Domain vocabulary

| Term             | Meaning / source of truth                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| Director         | Human intent, creative judgment and explicit overrides                                                              |
| GM               | Sole production authority, constrained by policy and human decisions                                                |
| Capability       | Versioned, extensible production outcome contract, not a role title                                                 |
| Agent definition | Global capability package, instructions, model/tool choices, permissions, evaluations                               |
| Assignment       | Project/task-scoped use of a pinned agent version and isolated worker thread                                        |
| Tool             | Independently versioned callable adapter with input/output contracts                                                |
| Task contract    | Desired outcome, dependencies, constraints, permissions and required QA                                             |
| Event            | Canonical append-only production history, typed and attributable                                                    |
| Projection       | Rebuildable query state derived from canonical files and events                                                     |
| Knowledge entry  | Typed source fact, deterministic consequence, inference, hypothesis, constraint or decision with provenance         |
| Evidence         | Inspectable artifact/reference, origin, producer, digest, time, scope and one of five evidence classes              |
| Evaluation       | Gate outcome and rationale linked to evidence; does not supersede human judgment                                    |
| Decision         | Durable human selection with rationale, alternatives and consequences                                               |
| Provider cap     | Verified provider-side bound; application accounting alone is insufficient                                          |
| Reconciliation   | Required attribution of meaningful work performed outside registered tasks                                          |
| Recovery         | Measured progress or change of strategy; three further non-progress failures after specialist intervention escalate |

Evidence classes are deterministic, measured, comparative, heuristic and human.
Confidence, evidence class and human acceptance are distinct dimensions.
Model-generated claims remain heuristic; a model can interpret independent
captures without becoming the source of those captures.

PRD sections 12, 16 and 18 show conceptual YAML. The versioned implementation
uses explicit top-level IDs and `_ids` reference arrays instead of ambiguous
nested names. Dollar values use `_cents`; permissions are separately named
actions. JSON fixtures demonstrate the canonical wire format.
