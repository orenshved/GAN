# GAN Studio UI/UX Audit

**Audit date:** 2026-09-11  
**Primary user:** Game Director / Creative Director / Product Owner  
**Method:** PRD and architecture review, source inspection, live packaged-Studio walkthrough, DOM/semantic inspection, viewport measurement, and existing Playwright workflow review.

## Executive finding

Studio exposes real production state and unusually deep evidence, but its default layer is organized around subsystems and records rather than the Director's questions. The result is technically transparent but slow to understand: the Director Desk opens with a planning form and internal counts, the 13-item navigation is ungrouped, historical work overwhelms current work, and specialist infrastructure appears before project understanding.

The first improvement pass therefore prioritizes orientation, attention, plain language, and progressive disclosure. Canonical records and technical detail remain available through inspectors and advanced sections.

## P0 — Understanding

### Director Desk does not answer “what needs me?” first

**AREA**  
Director Desk

**PROBLEM**  
The first large surface is “Direct the project.” Current attention, active work, recent meaningful change, and next steps are either absent or below a long task table.

**WHY IT MATTERS**  
A returning Director cannot regain context within 30 seconds and must interpret production machinery before deciding what to do.

**SEVERITY**  
Critical

**RECOMMENDED CHANGE**  
Lead with a plain-language project pulse and a “Needs your attention” section. Follow with current work, meaningful changes, and then a compact direction composer.

**USER BENEFIT**  
Immediate orientation and a clear first action.

**IMPLEMENTATION NOTES**  
Derive counts from canonical decisions, task states, reconciliation state, workers, and milestone. Never invent a health score.

### Historical tasks obscure current production

**AREA**  
Director Desk, Production, Workers, QA, Models, Disciplines

**PROBLEM**  
Every task selector and table includes the entire recorded backlog, including many completed phase-delivery tasks. The Director Desk alone renders more than 3,300 pixels of content.

**WHY IT MATTERS**  
The user cannot distinguish active work from project history. Repetition across pages creates cognitive noise and makes common actions slower.

**SEVERITY**  
Critical

**RECOMMENDED CHANGE**  
Default to active, blocked, decision-bound, and review work; cap overview lists; provide explicit access to all/history. Use the full list only where choosing a historical task is the purpose.

**USER BENEFIT**  
Current production becomes legible without deleting history.

**IMPLEMENTATION NOTES**  
Centralize active-state sorting and human-readable state labels.

### Project Intelligence leads with global specialist internals

**AREA**  
Project Intelligence

**PROBLEM**  
The page first displays Expertise Packs, pack-building controls, learning mechanics, and research plumbing. The actual project understanding and repository index appear several screens below; total page height exceeds 7,000 pixels.

**WHY IT MATTERS**  
The page fails its user-facing purpose: “What does GAN understand about my project, and what is uncertain?” It also conflates project knowledge with global specialist knowledge.

**SEVERITY**  
Critical

**RECOMMENDED CHANGE**  
Lead with the onboarding/domain understanding, project index, knowledge summaries, uncertainty, and targeted context. Put specialist knowledge maintenance under one collapsed advanced section.

**USER BENEFIT**  
The user sees project understanding first and can still inspect the machinery deliberately.

**IMPLEMENTATION NOTES**  
Do not move project facts into global pack state. This is a presentation reorder only.

### Raw system language is the default vocabulary

**AREA**  
Activity, task tables, status badges, Inspector, Models, Providers, Agents

**PROBLEM**  
Visible labels include event names (`task / proposed`), capability IDs (`project_analysis`), state constants (`BLOCKED_KNOWLEDGE`), and architecture terms such as “Task contracts,” “Expertise Pack Builder,” and “canonical events.”

**WHY IT MATTERS**  
The user must learn implementation vocabulary to understand ordinary production state.

**SEVERITY**  
High

**RECOMMENDED CHANGE**  
Translate common states, actors, events, and capabilities into natural production language. Preserve exact identifiers under Technical detail.

**USER BENEFIT**  
Faster comprehension without loss of auditability.

**IMPLEMENTATION NOTES**  
Use centralized formatting functions so the same state has the same name everywhere.

## P1 — Workflow

### Navigation mirrors implementation modules

**AREA**  
Global navigation

**PROBLEM**  
Thirteen flat numbered destinations compete equally. Closely related concepts—Production/Network/Workers, QA/Disciplines, Agents/Models, Providers/Settings—are separated without visible hierarchy.

**WHY IT MATTERS**  
First-time users cannot predict where to answer common questions. Numbering implies a sequence that does not exist.

**SEVERITY**  
High

**RECOMMENDED CHANGE**  
Group destinations by the Director's mental model: Overview, Production, Team, Knowledge, and System. Remove decorative numbering and rename “Network” to “Dependencies.”

**USER BENEFIT**  
Faster wayfinding and a stable mental model.

**IMPLEMENTATION NOTES**  
Keep view identifiers and API boundaries unchanged; navigation is presentational.

### Two competing ways to start work

**AREA**  
Director Desk and global page header

**PROBLEM**  
“Propose task” creates a low-level task while “Direct the project” creates a GM plan. Both look primary and the distinction is unclear.

**WHY IT MATTERS**  
The Director may choose the implementation-level workflow accidentally.

**SEVERITY**  
High

**RECOMMENDED CHANGE**  
Make “Give GAN direction” the primary Director action. Rename the lower-level action “Add task manually” and keep it off the Desk's default header.

**USER BENEFIT**  
Intent-first operation with an expert escape hatch.

**IMPLEMENTATION NOTES**  
No backend change required.

### Decisions cannot be discussed in context

**AREA**  
Needs Oren

**PROBLEM**  
Decision cards provide a select box and mandatory rationale, but no clear blocked-work summary, option-by-option consequences, urgency, or discussion path.

**WHY IT MATTERS**  
High-impact choices are reduced to form completion rather than informed judgment.

**SEVERITY**  
High

**RECOMMENDED CHANGE**  
Separate recommendation, why, realistic options, impact, and blocked work. Add a clear “Discuss with GAN” affordance when the GM conversation supports contextual follow-up.

**USER BENEFIT**  
More confident decisions and fewer accidental approvals.

**IMPLEMENTATION NOTES**  
Current contracts do not provide per-option consequence or discussion-thread fields; improve current hierarchy now and extend the contract in a later backend slice.

### Production graph opens with graph noise and an off-screen focal point

**AREA**  
Production agent network

**PROBLEM**  
All global agents are shown by default, including irrelevant inactive agents. At the tested desktop viewport the graph's useful nodes sit near the bottom of a large blank canvas, while a dense technical Inspector dominates the right side.

**WHY IT MATTERS**  
The graph does not answer who is working, waiting, or blocked. It appears broken despite containing real data.

**SEVERITY**  
High

**RECOMMENDED CHANGE**  
Default to agents used by the project, then working/attention; show all available agents only on request. Center the graph reliably and make the Inspector start with current task/waiting/recent result before expertise internals.

**USER BENEFIT**  
The map becomes an operational view rather than a roster visualization.

**IMPLEMENTATION NOTES**  
Use `fitView` after data/filter changes and a compact empty state when nobody is engaged.

## P2 — Information architecture

### Activity is a raw ledger, not a meaningful change feed

**AREA**  
Activity and Director Desk recent activity

**PROBLEM**  
Events are oldest-first on the full page, prefixed with internal sequence numbers, and labeled with raw event types and actor IDs.

**WHY IT MATTERS**  
The user cannot quickly understand what changed while away.

**SEVERITY**  
High

**RECOMMENDED CHANGE**  
Show newest first, humanize common event/actor names, hide sequence numbers, and expose the exact event only after selection under Technical detail.

**USER BENEFIT**  
A useful return-to-project briefing with complete audit depth still available.

**IMPLEMENTATION NOTES**  
Do not alter canonical ordering or event data; transform presentation only.

### Inspector reserves substantial space while empty

**AREA**  
Shared shell / Inspector

**PROBLEM**  
A 300-pixel rail remains open on every page with only “Follow the evidence,” reducing working space even when nothing is selected.

**WHY IT MATTERS**  
Dense production pages and graphs lose critical horizontal room, and the persistent blank rail appears unfinished.

**SEVERITY**  
Medium

**RECOMMENDED CHANGE**  
Collapse the Inspector when empty and open it when the user selects an inspectable item. Maintain a clear close action and full-height divider when open.

**USER BENEFIT**  
More room for work with detail available exactly when needed.

**IMPLEMENTATION NOTES**  
Use a shell state class; preserve the Inspector in the DOM only when selection exists.

### QA wording does not lead with readiness

**AREA**  
QA

**PROBLEM**  
The page leads with evidence architecture and filters. The distinction between technically works, matches specification, heuristic confidence, and human validation requires interpretation.

**WHY IT MATTERS**  
The Director needs “Is this ready?” before evaluation mechanics.

**SEVERITY**  
High

**RECOMMENDED CHANGE**  
Lead with one readiness verdict, explicitly list missing proof, and label the four confidence levels in plain language. Evidence classes remain in expanded detail.

**USER BENEFIT**  
Correct understanding of what QA did and did not prove.

**IMPLEMENTATION NOTES**  
Preserve human rejection authority and explicit waivers.

### Settings are backend-shaped and incomplete

**AREA**  
Settings

**PROBLEM**  
Authority and proactivity are terse selects followed by mixed immutable facts. Permissions, models, spending, quality, and advanced diagnostics have no coherent settings hierarchy.

**WHY IT MATTERS**  
The Director cannot understand how autonomous GAN is or where related control lives.

**SEVERITY**  
High

**RECOMMENDED CHANGE**  
Group settings as How GAN works with me, Safety and spending, Quality, and Advanced. Explain each autonomy level inline and link operational provider/model controls to their dedicated pages.

**USER BENEFIT**  
Safer, more understandable control over autonomy.

**IMPLEMENTATION NOTES**  
Only editable policy fields should look editable; immutable invariants should read as safeguards.

## P3 — Feedback and states

### Loading and empty states describe data, not user consequence

**AREA**  
All pages

**PROBLEM**  
States such as “Loading network…”, “No routing record yet,” and “No project index recorded yet” do not consistently say whether the user needs to act or what happens next.

**WHY IT MATTERS**  
For long-running asynchronous work, the user may believe the system is stuck.

**SEVERITY**  
Medium

**RECOMMENDED CHANGE**  
Use state messages with three parts: what GAN is doing, whether action is required, and the next transition. Reserve spinners/status roles for genuine live activity.

**USER BENEFIT**  
Less uncertainty and fewer repeated actions.

**IMPLEMENTATION NOTES**  
Add shared state-copy patterns and `aria-live` for meaningful async updates.

### Global connection status is too technical and low-salience on failure

**AREA**  
Sidebar and project error state

**PROBLEM**  
“Live” / “Reconnecting” appears in small footer text, while the top-level page may retain stale content.

**WHY IT MATTERS**  
The user may act on stale state without realizing it.

**SEVERITY**  
Medium

**RECOMMENDED CHANGE**  
Use “Up to date,” “Updating…,” and “Connection lost,” with a visible non-destructive banner when stale.

**USER BENEFIT**  
Clear trust in whether displayed production state is current.

**IMPLEMENTATION NOTES**  
Keep detailed connection diagnostics in Advanced.

## P4 — Visual consistency and accessibility

### Focus, status, and graph accessibility are inconsistent

**AREA**  
Shared controls and graph surfaces

**PROBLEM**  
Some controls rely on border/colour changes, status badges use nearly identical styling, graph nodes require precise pointer interaction, and there is no skip link. Several all-caps labels are very small.

**WHY IT MATTERS**  
Keyboard and low-vision users may lose location or miss important state.

**SEVERITY**  
High

**RECOMMENDED CHANGE**  
Add a skip link, global `:focus-visible`, colour-plus-text status semantics, minimum readable label sizing, and a keyboard-operable list paired with each graph.

**USER BENEFIT**  
Core workflows remain usable without precise pointing or colour discrimination.

**IMPLEMENTATION NOTES**  
Respect reduced motion and retain semantic buttons, fieldsets, headings, tables, and live regions.

### Excessive bordered panels weaken hierarchy

**AREA**  
All primary pages

**PROBLEM**  
Most groupings use the same rounded bordered panel, regardless of importance or interactivity.

**WHY IT MATTERS**  
The interface reads as dashboard card soup and users cannot infer what is actionable.

**SEVERITY**  
Polish

**RECOMMENDED CHANGE**  
Reserve strong panels for actionable or stateful surfaces. Use section dividers, whitespace, lists, and disclosure sections for supporting information.

**USER BENEFIT**  
Stronger visual hierarchy and a more credible production-tool character.

**IMPLEMENTATION NOTES**  
Apply after P0–P3 structure stabilizes.

## First implementation pass

1. Replace flat numbered navigation with grouped, plain-language navigation.
2. Rebuild Director Desk around attention, project pulse, current work, change briefing, and next steps.
3. Centralize human-readable task, event, actor, and capability language.
4. Reorder Project Intelligence around project understanding; collapse specialist machinery under Advanced.
5. Default Production's agent map to relevant agents and correct its empty/focus behavior.
6. Collapse the shared Inspector until a task or event is selected.
7. Reframe Settings around collaboration, safeguards, quality, and advanced controls.
8. Add shared keyboard focus, skip navigation, reduced-motion, responsive, and state-feedback patterns.
9. Extend Playwright coverage for the new hierarchy and progressive disclosure.

## Deferred contract work

The following improvements require domain/API fields not currently present and should be separate tracked slices rather than fabricated in the frontend:

- per-option consequences and urgency for decisions;
- a contextual “Discuss with GAN” decision thread;
- explicit milestone progress and next scheduled action;
- last-visited timestamp and “since you were away” change boundary;
- task-level waiting-on relationship and expected completion stage;
- user-configurable QA expectation fields beyond current policy contracts.

## Second-pass verification

The implementation was reviewed again in the running Studio after the first pass.

- Director Desk now opens on project pulse, actionable attention, current work, and a short change briefing. Raw event counts are absent.
- Production defaults to agents relevant to the current project and presents an explanatory empty state when none are engaged.
- Project understanding leads with indexed project evidence; file inventories and specialist machinery are progressively disclosed.
- Decision Inbox separates pending decisions from resolved history and gives the recommended choice visual priority.
- Settings presents human choices and immutable guardrails before advanced system controls.
- The Inspector is absent until an item is selected and aligns with the full content area when open.
- At a 390-pixel viewport the page has no horizontal overflow and navigation becomes a compact tab strip.
- Keyboard entry lands on the skip link, and interactive controls expose a visible two-pixel focus outline.
- The full repository check and Studio-to-daemon Playwright workflow cover the revised navigation, task creation, Inspector alignment, agent filtering, project indexing, context assembly, QA, and activity views.

The deferred items above remain explicit product-contract work. They were not simulated with invented frontend data.
