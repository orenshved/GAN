# Architectural invariant coverage

Pure guards are foundation specifications. Future command handlers must call
them with trusted records; they do not establish an operating orchestration system.

| PRD §82                            | Phase 0 enforcement                                                                          | Runtime acceptance deferred                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1 GM authority                     | Actor admission, assignment schema, event authority tests                                    | Authenticated command dispatch, Phase 4                                        |
| 2 Capability packages              | Required capabilities, I/O, models, gates, version; extensible ontology tests                | Matching, Phase 4                                                              |
| 3 Tools separate                   | Separate strict tool and agent schemas, unknown-field tests                                  | Godot invocation isolated behind the service adapter boundary in Phase 6       |
| 4 Project threads isolated         | Assignment scope, immutable worker binding, resolved workspace paths and real SDK resume     | Write-capable task workspaces                                                  |
| 5 Human judgment wins              | Rejection blocks completion despite passing evaluations                                      | Durable decision resolution and UI                                             |
| 6 No sole LLM QA                   | Independent evidence, human-origin validation, runtime visual capture, human fun evidence    | Phase 6 verifies captured bytes/digest; multi-gate QA fabric remains Phase 7   |
| 7 Hard caps                        | Verified unexpired provider-side proof, budget/reservation boundaries, unknown cost denial   | Atomic reservation ledger and invocation gate, Phase 9                         |
| 8 Register or reconcile            | Non-disableable policy, task event registration, unresolved changes block new work           | Git/file watcher, attribution workflow and Studio alert implemented in Phase 3 |
| 9 Explicit durable state           | Typed events, tasks, knowledge, decisions, worker state, runtime evidence and evaluations    | Later production event families                                                |
| 10 No creative identity leakage    | Global schema excludes project context; project-scoped assignments                           | Phase 5 context retrieval filters by project/task and excludes event history   |
| 11 Engine independence             | Core has no adapter imports; Godot implementation is service-owned and capability-advertised | Broader adapter conformance suite in later engine phases                       |
| 12 One truth, progressive detail   | No Studio fixture state; protocol-derived UI evidence vocabulary                             | Overview/Inspector same-ID integration tests, Phase 1                          |
| 13 Progress or strategy change     | Pure recovery ladder tests                                                                   | Persisted attempt metrics, Phase 4                                             |
| 14 Escalation after three failures | Boundary tests at two and three subsequent failures                                          | Decision inbox integration                                                     |
| 15 Selective Greenlight reuse      | Pinned harvest matrix; forbidden infrastructure dependency tests                             | Network behavior tests when implemented                                        |

Completion requires latest evaluations for all required gates or explicit scoped
human waiver events. Current caller must supply the full applicable history;
Phase 1/4 handlers own record loading and event identity/authentication.
