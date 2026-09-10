# Game Agent Network — PRD Addendum

## Domain-Led Project Onboarding

**Status:** Addendum to the Game Agent Network PRD  
**Applies to:** Project import, initialization, Project Intelligence, GM orchestration, Lead agents  
**Supersedes:** Any onboarding behavior that primarily asks the user to manually describe project information that GAN can reasonably discover itself.

---

## 1. Purpose

Game Agent Network must onboard an existing project the way a strong senior production team would.

When a new repository or project is imported, GAN should not begin by presenting the user with a long setup wizard or questionnaire.

Instead, the GM performs lightweight reconnaissance, identifies the production disciplines relevant to the project, and asks the appropriate Lead agents to inspect the project independently through their own domains.

Each Lead must determine whether it understands the project well enough to work, what assumptions it is currently making, what unresolved questions can safely wait, and what information is genuinely required before relevant work can continue.

The GM then reconciles the Lead reports and escalates only irreducible, materially blocking questions to the user.

The governing principle is:

> **Agents investigate → GM synthesizes → human resolves only what cannot responsibly be inferred.**

---

## 2. Core Onboarding Principle

GAN must not ask the user to provide information that competent specialists can discover from:

- repository structure,
- source code,
- engine/project files,
- assets,
- scenes,
- prefabs,
- configuration,
- documentation,
- Git history,
- runtime behavior,
- screenshots,
- audio,
- existing tests,
- issue trackers,
- previous production artifacts,
- or other inspectable project evidence.

Unknown information is not automatically a blocker.

GAN should distinguish between:

- information required now,
- information useful later,
- assumptions that permit work to continue,
- and information that can be inferred with sufficient confidence.

---

## 3. Onboarding Flow

When a project is imported:

```text
Repository imported
        ↓
GM performs lightweight reconnaissance
        ↓
GM identifies relevant production disciplines
        ↓
Relevant Lead agents inspect their domains in parallel
        ↓
Each Lead reports readiness
        ↓
GM reconciles overlaps, conflicts, and duplicate questions
        ↓
GM escalates only unresolved blocking questions
        ↓
Project enters active GAN state
        ↓
Project understanding continues to evolve progressively
```

Onboarding is therefore not a single form-filling step.

It is the first coordinated production task performed by the network.

---

## 4. GM Reconnaissance

The GM performs an initial shallow inspection only to determine:

- what type of project this is,
- what production disciplines are relevant,
- which Leads should participate,
- whether the repository is runnable/inspectable,
- and whether any obvious prerequisite prevents domain review.

The GM should not attempt to become the sole expert on every domain during this step.

Example findings:

```text
Engine: Godot
Rendering: 2D
Multiplayer: local
Existing UI: yes
Existing game assets: yes
Audio content: limited
Narrative systems: not detected
Current stage: likely prototype
```

Based on this, the GM may activate:

- Engineering Lead
- Game Design Lead
- Art Lead
- UX Lead
- QA Lead
- Production Lead

and omit irrelevant disciplines.

For example, a Narrative Lead should not be instantiated solely because narrative is theoretically part of game production.

---

## 5. Lead Selection

Lead participation must be capability-driven.

The GM selects only domains that appear relevant to the imported project.

Potential Lead domains include, but are not limited to:

- Engineering
- Game Design
- UX
- Art
- Technical Art
- Narrative
- Audio
- QA
- Production
- Data / Analytics
- Multiplayer / Networking
- Accessibility
- Platform / Certification
- Live Operations
- Monetization
- Localization

Additional Lead domains may be hired dynamically if the project exposes capabilities the current network does not cover.

---

## 6. Lead Domain Assessment

Each selected Lead independently performs an `assess_project_domain` task.

The Lead receives:

- relevant repository context,
- relevant assets/documents,
- applicable project history,
- direct evidence from its domain,
- and only the cross-domain context necessary to interpret its findings.

Each Lead must report:

1. **Readiness status**
2. **Current understanding**
3. **Evidence**
4. **Assumptions**
5. **Unknowns**
6. **Questions requiring human input now**
7. **Questions that can wait**
8. **Recommendations**
9. **Risks or contradictions**
10. **Confidence**

Lead reports must become structured Project Intelligence rather than remaining only in model conversation context.

---

## 7. Readiness States

Every Lead assessment must return exactly one primary readiness state.

### `READY`

The Lead understands its domain sufficiently to perform relevant production work.

No user input is required.

Example:

> Godot 4.x project. Architecture and primary gameplay systems are understandable. The project runs successfully. No information is required from the user before engineering work can begin.

---

### `READY_WITH_ASSUMPTIONS`

The Lead can work safely, but one or more assumptions are currently being used.

Assumptions must be explicit and recorded in Project Intelligence.

Example:

> Existing runtime UI assets appear to define the intended visual language. Until told otherwise, I will treat currently used assets as more authoritative than unused experimental assets.

This state must not generate a blocking user question unless the assumption affects currently relevant work in a material way.

---

### `NEEDS_INPUT_LATER`

The Lead has identified meaningful unknown information, but it does not currently prevent useful work.

The question becomes an unresolved Project Intelligence item.

Do not interrupt the user during onboarding for these items.

Example:

> Intended average match duration is not documented. This may matter for later balancing work, but it does not block current UI production.

---

### `NEEDS_INPUT_NOW`

The Lead cannot responsibly perform currently relevant production work without a specific answer.

Only this state creates a candidate onboarding escalation.

Example:

> The project supports both keyboard and controller input, but the intended primary navigation policy cannot be inferred. This directly affects the current UI work.

The Lead must explain why the missing information blocks relevant work.

---

## 8. Structured Lead Assessment Schema

A Lead assessment should conceptually support:

```yaml
lead_assessment:
  project_id:
  domain:
  agent_id:
  timestamp:

  readiness:
    status: READY | READY_WITH_ASSUMPTIONS | NEEDS_INPUT_LATER | NEEDS_INPUT_NOW
    confidence: 0.0-1.0

  understanding:
    summary:
    known_facts: []
    inferred_facts: []

  evidence: []

  assumptions:
    - statement:
      confidence:
      impact:
      expires_when:

  unknowns:
    - question:
      impact:
      blocks_current_work: true | false

  recommendations: []

  risks: []

  contradictions: []

  requested_human_inputs: []
```

Exact implementation may differ, but these semantics must remain.

---

## 9. GM Reconciliation

The GM must not dump Lead reports directly onto the user.

After all relevant Lead assessments return, the GM performs a reconciliation pass.

The GM must:

- merge duplicate questions,
- resolve questions that another domain has already answered,
- compare conflicting assumptions,
- investigate apparent contradictions,
- distinguish real disagreement from differing terminology,
- determine which questions genuinely block current production,
- prioritize unresolved decisions,
- and produce one coherent project-level onboarding result.

Example:

```text
Art Lead:
Assumes 320×180 internal resolution.

Engineering Lead:
Runtime configured at 640×360.

UX Lead:
UI layout appears designed for 640×360.
```

The GM should investigate before escalating.

If evidence shows the game renders 320×180 assets at 2× integer scale, the issue is resolved internally.

The user should never see the disagreement.

If the conflict cannot be responsibly resolved, it becomes a human decision.

---

## 10. Human Escalation During Onboarding

Only questions meeting all of the following should interrupt onboarding:

- the answer cannot be confidently inferred,
- another Lead cannot resolve it,
- the GM cannot safely adopt a reversible assumption,
- the issue materially affects currently relevant work,
- and proceeding without the answer risks wasted work or a meaningful production mistake.

The GM must consolidate questions before presenting them.

Good:

> The team understands the project well enough to begin. I need one decision before we modify the UI: should controller and keyboard navigation have equal priority, or is one considered primary?

Bad:

> What platforms are you targeting?  
> What is the art style?  
> What is the milestone?  
> What is the target resolution?  
> What is the preferred input?  
> What is the target audience?

GAN must discover first.

---

## 11. Non-blocking Unknowns

Unknown information that does not block current work becomes durable Project Intelligence.

Such items may be surfaced later when:

- relevant work begins,
- project conditions change,
- conflicting evidence appears,
- a Lead's assumption becomes unsafe,
- or the GM determines that resolution now has sufficient value.

This prevents onboarding from becoming administrative overhead.

---

## 12. Project Understanding View

GAN Studio should expose the result of domain onboarding.

Suggested presentation:

```text
PROJECT UNDERSTANDING

Engineering      ● Ready                  High confidence
Game Design      ● Ready with assumptions Medium confidence
UX               ● Ready                  High confidence
Art              ● Ready with assumptions High confidence
QA               ● Ready                  High confidence
Production       ● Ready                  High confidence
```

Each Lead/domain is expandable.

A domain Inspector should show, at progressively deeper levels:

### High level

- readiness,
- confidence,
- summary,
- whether user input is required.

### Expanded

- known facts,
- assumptions,
- unresolved questions,
- recommendations,
- risks,
- canonical references.

### Detailed

- evidence,
- files inspected,
- runtime captures,
- related events,
- raw assessment artifact,
- agent/thread provenance.

This must follow GAN's established layered-information philosophy.

---

## 13. First-run Experience

The preferred first-run experience after project import is not a questionnaire.

It should communicate that the team is learning the project.

Example:

```text
GETTING THE TEAM FAMILIAR WITH THE PROJECT

Engineering       ✓ Ready
Game Design       ✓ Ready
Art               ✓ Ready with assumptions
UX                ● Reviewing...
QA                ● Reviewing...
Production        ✓ Ready
```

Once complete:

```text
WE'RE GOOD TO START

The team understands the project well enough to work.

Ready domains: 5
Ready with assumptions: 1
Questions that can wait: 3
Questions requiring you now: 1

[Review the one decision]
[Enter Project]
```

If no blocking question exists:

```text
WE'RE GOOD TO START

The team understands the project well enough to work.
Nothing requires your input right now.

[Enter Project]
```

"Enter Project" should not be unnecessarily blocked by unrelated domain uncertainty.

---

## 14. Progressive Onboarding

Onboarding does not permanently end.

The project model should evolve as:

- new systems are added,
- new platforms are targeted,
- previously unused disciplines become relevant,
- new agents are hired,
- imported content expands,
- or prior assumptions are invalidated.

When a newly hired Lead-level specialist enters the global roster and becomes relevant to a project, the GM may assign:

`assess_project_domain`

to expand that project's understanding.

Example:

A project later adds VR support.

The GM hires or activates a VR Interaction specialist.

The specialist reviews the existing project and contributes a new domain understanding without forcing full project re-onboarding.

---

## 15. Lead Assessment as a Reusable Capability

`assess_project_domain` is a standard Lead capability.

All Lead agents should be able to:

- inspect an unfamiliar project,
- establish a domain model,
- identify canonical references,
- identify uncertainty,
- distinguish blockers from non-blockers,
- report confidence,
- and communicate needs to the GM.

This capability must be included in agent auditions where relevant.

A specialist that cannot successfully assess an unfamiliar project should not automatically become a trusted Lead.

---

## 16. Project Import State Machine

Suggested onboarding states:

```text
IMPORTED
   ↓
RECONNAISSANCE
   ↓
DOMAIN_REVIEW
   ↓
RECONCILIATION
   ↓
┌────────────────────┐
│                    │
READY          NEEDS_HUMAN_INPUT
│                    │
│                    ↓
│               DECISION_RESOLVED
│                    │
└────────────────────┘
           ↓
       ACTIVE
```

A project may become `ACTIVE` while some domains remain:

- `READY_WITH_ASSUMPTIONS`
- or `NEEDS_INPUT_LATER`.

Only true production blockers should prevent relevant work.

---

## 17. Event Requirements

Onboarding must generate normal GAN events.

Suggested event types:

- `project.imported`
- `project.reconnaissance_started`
- `project.reconnaissance_completed`
- `domain.assessment_started`
- `domain.assessment_completed`
- `domain.assumption_recorded`
- `domain.input_needed_later`
- `domain.input_needed_now`
- `project.reconciliation_started`
- `project.reconciliation_completed`
- `decision.requested`
- `decision.resolved`
- `project.onboarding_completed`

Lead assessments and reconciliations must therefore be fully auditable.

---

## 18. GM Behavior Requirements

During onboarding the GM must:

- prefer discovery over questioning,
- avoid duplicate questions,
- avoid asking for information irrelevant to current work,
- treat assumptions as explicit state,
- resolve cross-domain conflicts before escalation,
- preserve uncertainty rather than fabricate certainty,
- activate only relevant Leads,
- and minimize user interruption.

The GM should be able to say:

> "The team understands enough to begin."

without claiming:

> "The project is fully understood."

---

## 19. Studio Requirements

Add onboarding/domain-understanding support to GAN Studio.

Required UI capabilities:

- live Lead assessment status,
- readiness by domain,
- confidence,
- expandable assumptions,
- unresolved questions,
- blockers,
- recommendations,
- evidence,
- current reconciliation state,
- user decision cards where needed.

Do not represent Lead assessments as character-chat transcripts.

They are production intelligence.

---

## 20. QA of Onboarding

Onboarding itself must be testable.

Acceptance tests should include:

### Scenario A — Well-documented project

Expected:

- Leads discover most information,
- no unnecessary questions,
- project becomes active quickly.

### Scenario B — Poorly documented but inspectable project

Expected:

- Leads infer useful structure,
- assumptions are explicitly recorded,
- only genuine blockers reach the user.

### Scenario C — Conflicting project evidence

Expected:

- Leads report contradiction,
- GM attempts reconciliation,
- user is asked only if conflict cannot be safely resolved.

### Scenario D — Irrelevant discipline

Expected:

- Lead is not instantiated solely because the capability exists globally.

### Scenario E — Newly relevant capability later

Expected:

- GM activates/hire relevant Lead,
- new Lead performs domain assessment,
- Project Intelligence expands without complete re-onboarding.

---

## 21. Acceptance Criteria

This addendum is implemented when:

- importing a repository triggers GM reconnaissance,
- the GM identifies relevant Lead domains,
- Leads inspect the real project independently,
- every Lead emits a structured readiness assessment,
- readiness supports all four required states,
- assumptions become durable Project Intelligence,
- non-blocking questions do not interrupt onboarding,
- the GM reconciles Lead reports before user escalation,
- duplicate/cross-domain questions are consolidated,
- GAN Studio shows project understanding by domain,
- the user can drill from readiness summary to evidence,
- newly hired relevant Leads can assess existing projects later,
- and onboarding produces auditable project events.

---

## 22. Architectural Invariant

Add the following invariant to the main PRD:

> **Invariant 16: Project onboarding is domain-led. GAN must prefer specialist discovery over user questioning. Relevant Lead agents independently assess their domains, and the GM must reconcile their findings before escalating only genuinely blocking ambiguity to the human.**

---

## 23. Replacement for Existing PRD Onboarding Language

Where the main PRD currently describes project initialization as primarily:

1. detect project,
2. inspect repository,
3. create project model,
4. identify missing information,
5. ask only important questions,

interpret and update that process as:

1. detect project,
2. perform lightweight GM reconnaissance,
3. identify relevant production disciplines,
4. assign domain assessments to relevant Leads,
5. collect readiness/assumption/unknown reports,
6. reconcile reports across domains,
7. escalate only irreducible blocking questions,
8. enter active project state,
9. continue progressive domain onboarding throughout production.

This addendum supersedes conflicting onboarding language in the main PRD.
