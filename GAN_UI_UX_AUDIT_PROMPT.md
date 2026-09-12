# Complete GAN Studio UI/UX Audit + Improvement Pass

Perform a **complete end-to-end UI/UX audit of Game Agent Network Studio**, then implement the improvements.

This is not primarily a visual-polish task.

The goal is to determine whether the product is genuinely understandable, usable, efficient, and appropriately designed for the role of the human using GAN.

Assume the current implementation may contain unnecessary information, unclear terminology, weak hierarchy, developer/system concepts leaking into user-facing UI, redundant screens, poor progressive disclosure, confusing navigation, unclear actions, excessive scrolling, weak onboarding, missing feedback, unclear status, or workflows that technically function but do not make sense to a new user.

Do not preserve existing UX merely because it already exists.

## 1. Auditor Role

Approach this as a **senior product UX/UI designer specializing in complex professional tools**.

Do not merely "pretend to be a UX expert" and provide aesthetic opinions. Use actual UX reasoning:

- information architecture
- cognitive load
- progressive disclosure
- interaction design
- hierarchy
- terminology
- discoverability
- affordances
- feedback
- error prevention
- accessibility
- consistency
- user mental models
- task completion
- first-use comprehension
- expert efficiency after familiarity

Where deterministic or measurable UX checks are possible, use them. Do not rely solely on LLM visual judgment.

## 2. The User You Must Design For

Perform the audit from the perspective of a user who knows only this:

> "Game Agent Network is an AI production system that manages specialist agents which work together to build a game."

Assume they know **nothing else about GAN**.

They should not need to know GAN's internal architecture, agent runtime implementation, event sourcing, task IDs, capability IDs, knowledge packet mechanics, database terminology, internal statuses, model-provider plumbing, Expertise Pack internals, orchestration implementation, thread IDs, raw tool calls, JSON, or internal system language unless they deliberately drill down into an advanced/debug layer.

Ask continuously:

> **Would a smart first-time user understand what this means without having read the PRD?**

If not, redesign it.

## 3. Remember Who the Human Is

The human's role in GAN is:

> **The human owns intent, taste, priorities, creative direction, and final judgment. GAN owns the production complexity required to act on them.**

The user is effectively sitting in the **Game Director / Creative Director / Product Owner chair**.

Therefore the primary UI should answer:

- What is happening right now?
- Is the project healthy?
- What is GAN working on?
- What has changed?
- Is anything stuck?
- Does GAN need anything from me?
- What decisions do I need to make?
- What does GAN recommend?
- Why does it recommend that?
- What is likely to happen next?
- Are we making progress?
- Is something going wrong?
- Can I intervene?
- Can I inspect the evidence if I care?
- Can I change how autonomous GAN is?

Whenever you encounter information, ask:

> **Does the Director need to see this?**

If the answer is no, remove it from the default layer. It may remain available deeper in the system for debugging, transparency, or expert inspection.

## 4. User Information vs System Information

### User-facing information

- current milestone
- meaningful progress
- blockers
- risks
- decisions requiring attention
- important recommendations
- current production activity
- QA failures that matter
- agent work expressed in human terms
- project health
- important assumptions
- major changes
- relevant evidence
- budget warnings
- actions the user can take

### System-facing information

- raw event names
- database IDs
- internal capability identifiers
- context packet internals
- thread IDs
- orchestration metadata
- raw model output
- internal state-machine terminology
- hashes
- raw logs
- provider payloads
- schema structures
- implementation diagnostics

System information should be **hidden by default**. If useful, expose it through progressively deeper technical/debug views.

Do not delete observability. **Layer it.**

## 5. Core UX Philosophy: Layers Over Endless Information

The central UX philosophy is:

> **Less scrolling through endless information. More progressive disclosure.**

Prefer collapsed summaries, expandable sections, drill-down Inspectors, drawers, focused detail views, contextual navigation, tabs where they represent genuinely different views, disclosure controls, and meaningful summaries.

The user should first receive **the answer**, then be able to inspect **why**, then inspect **evidence**, then inspect **system detail**.

Conceptually:

```text
WHAT I NEED TO KNOW
        ↓
WHY
        ↓
DETAIL
        ↓
EVIDENCE
        ↓
RAW SYSTEM INFORMATION
```

Do not require scrolling through levels 2–5 to reach level 1.

## 6. Audit the Entire Information Architecture

Do not audit screens independently. First determine whether the overall product structure makes sense.

Evaluate:

- primary navigation
- screen responsibilities
- redundant destinations
- terminology
- page naming
- hierarchy between screens
- where decisions live
- where project status lives
- where production work lives
- where agents live
- where QA lives
- where knowledge/intelligence lives
- where advanced/debug information belongs
- how the user returns to the high-level picture

Ask whether a first-time user could predict where to go to answer:

- What needs me?
- Why is this task stuck?
- What did the UX Lead do?
- Did QA approve this?
- Why did GAN make this recommendation?
- How autonomous is GAN?
- How much API money have I spent?
- What does GAN currently understand about my project's art direction?

If the answer requires hunting through the interface, improve the architecture.

## 7. Audit the Director Desk Especially Aggressively

The Director Desk is the most important screen in the product. It should function as the user's **production cockpit**, not a dashboard full of statistics.

It should answer at a glance:

- What is happening?
- What matters?
- What needs me?
- What changed?
- Is anything going wrong?
- What is next?

A user should be able to open GAN after being away for several days and become oriented within roughly **30 seconds**.

Avoid meaningless dashboard metrics. Every metric shown must help the user make a decision or understand project state.

## 8. "Needs Oren" / Human Decision UX

Each decision should clearly communicate:

1. What is the decision?
2. Why am I being asked?
3. What does GAN recommend?
4. Why?
5. What are my realistic options?
6. What happens if I choose each option?
7. What is blocked while I decide?
8. Can I discuss it instead of choosing immediately?

Keep the default card concise and allow deeper evidence through expansion.

## 9. Agent Network UX

The Network Map must represent meaningful production relationships, not visually impressive graph noise.

A user should understand:

- who is currently working
- on what
- who is waiting
- what they are waiting for
- where a blocker exists
- who reports back to the GM
- where a specialist was newly hired

Avoid showing inactive/global agents unless relevant.

Clicking an agent should reveal a layered Inspector. Do not lead with technical metadata.

## 10. Project Understanding / Intelligence UX

GAN has enormous amounts of knowledge. Do not dump it onto the user.

The primary question is:

> **What does the team understand about my project, and is anything important uncertain?**

Prefer domain summaries with readiness/confidence/assumptions, and expose facts, sources, contradictions, confidence and evidence only when expanded.

## 11. QA UX

QA must communicate **meaningful confidence**, not a wall of test results.

The default level should answer:

> Is this work actually ready?

Ensure the language distinguishes:

- technically works
- matches specification
- heuristically looks good
- human validated

These are not equivalent.

## 12. Settings UX

Group settings according to how the user thinks, not how the backend is implemented.

Suggested groups:

### How GAN Works With Me
- GM Authority
- GM Proactivity
- escalation behavior

### What GAN May Do
- permissions
- installing software
- changing code/assets
- Git behavior

### AI & Models
- local preference
- Codex
- external providers
- routing preferences

### Spending
- monthly budget
- automatic transaction threshold
- provider caps

### Quality
- QA expectations
- human validation requirements

### Advanced / Developer
- technical internals
- diagnostics
- raw provider settings
- logs

## 13. Terminology Audit

Audit **every visible term**.

Question internal terms such as:

- Task Contract
- Capability Gap
- Expertise Pack
- Evidence Class
- Projection
- Reconciliation
- Provider
- Agent Assignment
- Knowledge Packet
- Project Intelligence
- Event
- Probationary Agent

For each term ask:

> Is this something the user needs to learn?

If no, translate it into natural product language while retaining the technical term internally.

## 14. Action Clarity

Every interactive element should answer:

> What will happen if I click this?

Audit buttons, icons, menus, disclosure arrows, cards, graph nodes, status badges, contextual actions and destructive actions.

Remove ambiguous icons where text would be clearer.

## 15. Feedback and System Status

GAN performs long-running asynchronous work.

The user must never wonder:

> Did anything happen?

Show meaningful production stages, not every microscopic internal operation. Allow expansion for internal activity.

## 16. Empty, Loading, Error and First-use States

Audit important screens for:

- empty state
- first project
- no active tasks
- no decisions
- agent working
- project importing
- project onboarding
- unavailable provider
- Codex usage unavailable
- QA failure
- disconnected daemon
- unreconciled external changes
- no expertise available
- new specialist being hired

Each state should explain what is happening, whether it matters, whether the user needs to act, and what happens next.

Avoid generic "No data" or "Something went wrong."

## 17. New-user Walkthrough

Perform a cold-start usability simulation:

1. Launch GAN.
2. Import an existing game repository.
3. Watch domain-led onboarding.
4. Understand what GAN learned.
5. Resolve one requested decision.
6. Enter the project.
7. Understand the Director Desk.
8. Give GAN a production request.
9. Watch work begin.
10. Inspect what an agent is doing.
11. Encounter a blocker.
12. Inspect a QA result.
13. Change GM autonomy setting.
14. Return later and understand what happened while away.

At every stage ask:

> Could the user reasonably know what to do next without being taught the architecture?

Record every point of confusion, then fix it.

## 18. Expert-user Efficiency

Do not optimize exclusively for beginners.

Audit unnecessary clicks, repetitive navigation, repeated confirmations, excessive modal dialogs, inability to jump between related entities, loss of place, and inability to act directly from context.

Progressive disclosure should reduce beginner complexity **without punishing expert users**.

## 19. Accessibility

Audit at minimum:

- keyboard navigation
- visible focus
- contrast
- semantic controls
- text scaling
- reduced motion
- tooltip accessibility
- status conveyed by more than color
- graph usability without precise mouse interaction where feasible

## 20. Visual Design Audit

After structural UX issues are understood, audit:

- hierarchy
- typography
- density
- spacing
- alignment
- consistency
- component reuse
- contrast
- iconography
- status semantics
- selected/focused states
- panel boundaries
- unnecessary visual chrome
- excessive cards
- excessive rounding
- gratuitous gradients
- generic AI-product aesthetics

GAN should feel like a serious professional production tool, not an "AI startup dashboard."

## 21. Avoid Dashboard Card Soup

Do not solve every grouping problem with another rounded rectangle.

Use whitespace, hierarchy, typography, tables, lists, disclosure sections, inspectors and spatial structure appropriately.

Cards should mean something.

## 22. Preserve the Layered Philosophy Everywhere

For every complex object, use this pattern where appropriate:

```text
SUMMARY
>
  DETAIL
  >
    EVIDENCE
    >
      TECHNICAL DETAIL
```

Apply this to Agents, Tasks, Decisions, QA results, Project domains, Recommendations, Budget/providers and Risks.

## 23. Audit for Redundancy

Identify cases where:

- the same information appears in multiple screens
- multiple screens serve nearly identical purposes
- status is represented differently in different places
- two concepts could be one
- one concept incorrectly combines multiple things

Consolidate where useful.

## 24. Audit for Missing Information

Ask:

> What does the Director need that the system currently fails to communicate?

Examples:

- What changed since I last looked?
- What needs my attention?
- Why is this blocked?
- What happens next?
- How confident is GAN?
- Is this waiting on an agent or on me?
- Did QA actually test this?
- Why did GAN choose this specialist?
- Is the system learning anything from this failure?

Add missing information if it materially improves control or understanding.

## 25. Do Not Expose Architecture for Architecture's Sake

GAN is technically sophisticated. That does **not** mean the UI should constantly prove it.

The sophisticated architecture should produce a simpler experience.

Use complexity to hide complexity.

## 26. Required Audit Deliverable

Before making broad changes, create:

`docs/UI_UX_AUDIT.md`

For each issue record:

```text
AREA
PROBLEM
WHY IT MATTERS
SEVERITY
RECOMMENDED CHANGE
USER BENEFIT
IMPLEMENTATION NOTES
```

Severity:

- Critical
- High
- Medium
- Polish

Group findings by systemic issue rather than generating hundreds of trivial pixel complaints.

## 27. Prioritization

Fix in this order:

### P0 — Understanding
Anything preventing the user from understanding where they are, what GAN is doing, or what they need to do.

### P1 — Workflow
Anything making common tasks unnecessarily difficult or confusing.

### P2 — Information Architecture
Hierarchy, navigation, progressive disclosure, terminology.

### P3 — Feedback / States
Loading, status, errors, blockers, transitions.

### P4 — Visual Consistency
Typography, spacing, components, iconography, density.

### P5 — Polish
Animations, subtle interaction details, visual refinement.

Do not spend hours perfecting shadows while the information architecture is wrong.

## 28. Implementation Behavior

After the audit:

1. identify systemic changes
2. establish shared UX patterns/components
3. implement highest-impact improvements
4. propagate patterns consistently
5. run the application
6. test the real workflows
7. capture screenshots where useful
8. compare before/after
9. run existing automated tests
10. add tests for important interaction behavior
11. perform a second UX pass after implementation

Do not merely produce the audit document.

**Implement the improvements.**

## 29. Do Not Destroy Valuable Depth

The target is:

```text
simple by default
powerful when expanded
deeply inspectable when needed
```

not:

```text
simple because useful information was deleted
```

## 30. Final Self-review Questions

Before declaring the pass complete, ask:

### Comprehension
Can someone who only knows GAN's basic premise understand the interface?

### Orientation
Can they tell what is happening within 30 seconds?

### Attention
Is it obvious what needs them?

### Role alignment
Does the UI feel designed for a Game Director, or for the engineer who built GAN?

### Layering
Is complexity progressively disclosed rather than dumped onto the page?

### Language
Does visible terminology speak the user's language rather than the architecture's?

### Confidence
Can the user understand why GAN is recommending or doing something?

### Control
Can the user intervene without needing to understand orchestration internals?

### Feedback
Does every meaningful action communicate what happened and what comes next?

### Depth
Can an expert still drill all the way down to evidence and technical detail?

### Visual quality
Does GAN Studio look like a credible professional product suitable for a portfolio demonstration?

If any answer is "not really," continue the audit.

## 31. Final Goal

The best version of GAN Studio should make a very complicated system feel surprisingly simple.

The user should feel:

> **"I understand my production. I know what my team is doing. I know what needs me. I can intervene whenever I want. And I don't need to manage the machinery underneath."**

That is the UX target.
