# GAN Studio — Visual Overhaul Using Approved Mockups

Perform a **visual overhaul of GAN Studio** using the provided mockups as the design reference.

The goal is to bring the existing product substantially closer to the mockups in visual quality, hierarchy, polish, density, and overall feel.

## CRITICAL RULE: THESE MOCKUPS ARE NOT FUNCTIONAL SPECIFICATIONS

The mockups were generated to explore **visual design**.

They contain invented:

- buttons
- labels
- metrics
- statuses
- workflows
- navigation items
- actions
- data
- agents
- project stages
- copy
- controls
- functionality

Do **not** implement something merely because it appears in a mockup.

### The existing GAN product, PRD, current implementation, schemas, routes, and workflows remain the source of truth for functionality.

The mockups are the source of truth only for **visual direction**.

---

# 1. Absolute Functional Invariant

This pass must not intentionally change:

- product behavior
- workflows
- business logic
- task lifecycle
- agent orchestration
- backend APIs
- schemas
- persisted state
- event behavior
- routing behavior
- permissions
- provider behavior
- onboarding logic
- QA logic
- Knowledge Fabric behavior
- decisions/escalation behavior

If a working interaction exists today, preserve it.

If a feature does not exist today, **do not create it because the mockup shows it**.

---

# 2. How to Interpret the Mockups

For every element in a mockup, ask:

> Does an equivalent concept already exist in GAN?

## If YES

Use the mockup as inspiration for how the existing concept should look.

Examples:

Existing:

- Director Desk project status
- task list
- Needs Oren
- Project Understanding
- QA
- agent/team views
- production state
- Knowledge Fabric

Mockup:

- improved hierarchy
- stronger card treatment
- better typography
- cleaner progress display
- more polished Inspector

→ Restyle the **existing feature**.

## If NO

Ignore the mockup element.

Example:

Mockup contains:

> "Create Fix Task for Performance Issue"

If GAN does not currently expose that action:

**Do not add it.**

Likewise, if a mockup invents:

- a new search command
- a new milestone action
- an Auto-Assign button
- a new agent action
- a new settings control
- a new workflow

do not implement it.

---

# 3. Content Fidelity Rule

Existing real GAN data should populate the redesigned UI.

Do not replace real data with mockup data.

The mockups contain fictional examples such as:

- 24 active tasks
- Unreal Engine projects
- fictional agents
- fictional factions
- fictional QA scores
- fictional milestone dates
- fictional project descriptions

These exist only to communicate layout.

Preserve the real application data and state.

---

# 4. What SHOULD Be Taken From the Mockups

Use them aggressively as visual/design references for the following.

## Overall Visual Language

- sophisticated dark UI
- deep blue/teal-black surfaces
- restrained turquoise/cyan accent
- subtle glow
- thin borders
- controlled transparency
- high-quality contrast
- layered depth
- professional tool aesthetic
- cinematic but restrained game-production identity

The result should feel **cutting-edge and premium**, but still like a serious professional production application.

Avoid turning GAN into a sci-fi game HUD.

---

## Header / Visual Identity

Adopt the cinematic project header treatment where appropriate:

- panoramic art
- dark overlay/gradient
- large clean page title
- contextual subtitle
- strong visual separation from application content

The background artwork should support the content rather than reduce readability.

It should behave as atmosphere, not decoration competing with the UI.

---

## Typography

Move toward the mockups' hierarchy:

- strong page titles
- clear section headings
- compact secondary labels
- restrained uppercase metadata
- highly readable body copy
- deliberate contrast between primary/secondary/tertiary information

Avoid tiny low-contrast text.

---

## Layout

Use the mockups as inspiration for:

- cleaner grids
- clearer alignment
- consistent margins
- more deliberate spacing
- meaningful side Inspectors
- stronger visual grouping
- less wasted space
- better use of wide desktop displays

GAN should feel designed for a professional workstation.

---

## Progressive Disclosure

Preserve the UX philosophy already established:

> **Summary → Detail → Evidence → Technical Detail**

The mockups demonstrate this well through:

- Inspectors
- panels
- expandable sections
- summary rows
- focused sidebars

Use those patterns where they map onto existing GAN functionality.

---

## Cards / Surfaces

Improve:

- border subtlety
- selected states
- hover states
- active states
- spacing
- internal hierarchy
- status highlighting
- depth

Do not simply wrap everything in cards.

Use cards only where grouping actually benefits comprehension.

---

## Status Design

Use the visual language shown in the mockups:

- green / turquoise for healthy/ready/pass
- amber for attention/waiting
- red for blocked/failure
- blue for informational/inferred
- neutral gray for inactive/unknown

Do not change the meaning of existing statuses.

Only change their visual presentation.

---

## Data Visualization

Existing concepts such as:

- progress
- confidence
- readiness
- QA status
- production state

may use improved:

- progress bars
- rings
- concise badges
- lightweight visual indicators

Do not invent new metrics solely to fill visual space.

---

## Inspectors

Where GAN already has Inspectors or detail panes, bring them closer to the mockup quality:

- strong object title
- concise summary first
- tabs/sections where useful
- progressively deeper information
- evidence below reasoning
- technical metadata deepest

Do not introduce new functionality just because a mockup Inspector shows a control.

---

## Navigation

Restyle existing navigation to match the visual quality of the mockups.

Do not assume every navigation item in the mockups should exist.

Existing routes remain authoritative.

---

# 5. Reference the Mockups by Concept, Not Pixel Copying

The mockups represent examples of several stages:

- Director Desk
- Project Import
- Project Reconnaissance
- Team Familiarization
- Project Understanding
- Needs Oren
- Production
- Agent Network
- QA
- Knowledge Fabric

Where these correspond to an implemented GAN screen, use the matching mockup as its visual reference.

Where the current product differs functionally, **adapt the visual language to the real product rather than forcing the product to match the screenshot.**

---

# 6. Do Not Copy Mockup Mistakes

These are AI-generated mockups.

Assume they may contain:

- inconsistent labels
- duplicated navigation
- impossible states
- nonsensical metrics
- invented controls
- inaccessible contrast
- inconsistent interaction patterns
- decorative UI with no functional meaning

Use design judgment.

The goal is:

> **the quality and visual philosophy of the mockups**

not:

> **a literal reconstruction of every pixel.**

---

# 7. Preserve Existing UX Improvements

This visual pass comes after the UI/UX audit.

Do not undo improvements made for:

- clarity
- progressive disclosure
- beginner comprehension
- reduced information overload
- user/system information separation
- Director-level orientation
- accessibility
- simplified terminology

If the mockup conflicts with an already-approved UX improvement:

**the UX improvement wins.**

---

# 8. User Role Must Remain Central

Remember the product principle:

> **The human owns intent, taste, priorities, creative direction, and final judgment. GAN owns production complexity.**

The redesign should make the user feel like they are sitting above the production system.

The UI should communicate:

- what matters
- what is happening
- what needs the user
- what changed
- what is blocked
- what GAN recommends

Do not surface more internal machinery simply because it looks impressive in a mockup.

---

# 9. Responsive Behavior

The screenshots show a large desktop workspace.

Use them primarily as the **wide desktop target**.

Maintain sensible behavior at smaller window widths.

Do not hard-code screenshot dimensions or layouts that break when resized.

---

# 10. Accessibility

Maintain or improve:

- keyboard navigation
- focus visibility
- readable contrast
- non-color-only status communication
- scalable text
- reduced-motion behavior
- semantic controls

Glow and transparency must not compromise readability.

---

# 11. Implementation Approach

Before editing:

1. inspect the current Studio implementation;
2. map each mockup to the closest existing screen;
3. identify reusable visual primitives;
4. identify global design tokens that should change;
5. identify which mockup elements are visual-only inventions and must be ignored.

Create a short implementation plan before broad edits.

Prefer systemic changes through:

- design tokens
- shared components
- layout primitives
- status components
- Inspector patterns
- shared headers
- navigation styles

rather than one-off CSS hacks per screen.

---

# 12. Build a Coherent Design System

Extract the visual language into reusable tokens/components.

At minimum consider:

## Color

- application background
- elevated surface
- selected surface
- subtle border
- strong border
- primary accent
- secondary accent
- success
- warning
- danger
- information
- text hierarchy

## Typography

- page title
- section title
- body
- secondary body
- metadata
- status

## Geometry

- border radii
- border weights
- panel spacing
- row height
- Inspector width
- navigation dimensions

## Effects

- shadows
- restrained glow
- transparency
- overlays
- hover transitions

Avoid scattering magic values throughout the codebase.

---

# 13. Protect Scope

This is a **visual overhaul**, not another product-development phase.

Do not:

- refactor unrelated backend code
- rewrite orchestration
- redesign schemas
- expand agent capabilities
- add features
- add new workflows
- fix unrelated product issues
- research unrelated architecture problems

If a purely visual improvement requires a substantial functional change:

**stop and flag it instead of implementing it.**

---

# 14. Usage / Execution Budget

This should remain a bounded implementation task.

Do not opportunistically expand scope.

Use targeted checks while implementing.

Do not repeatedly run the full repository suite after every styling change.

Recommended sequence:

```text
shared visual system
↓
shell/navigation/header
↓
primary screens
↓
secondary screens
↓
targeted UI checks
↓
visual review
↓
single full validation pass
```

If unexpected architectural work is required, stop and report before proceeding.

---

# 15. Required Visual Review

After implementation:

1. run GAN Studio;
2. capture the redesigned screens;
3. compare them directly against the corresponding mockups;
4. inspect:
   - hierarchy
   - spacing
   - visual consistency
   - density
   - readability
   - polish
   - use of the panoramic artwork
   - selected/hover/focus states;
5. perform a final visual correction pass.

Do not declare completion based solely on tests/build success.

This task requires **actual visual inspection**.

---

# 16. Regression Requirement

After the redesign, verify that existing workflows still work.

At minimum confirm:

- navigation
- Director Desk
- production views
- Needs Oren
- Project Understanding
- onboarding/reconnaissance views
- QA
- agent/team views
- Knowledge Fabric views
- settings
- Inspectors
- existing actions

The visual overhaul must not silently break real functionality.

---

# 17. Definition of Done

The overhaul is complete when:

- GAN clearly belongs to the same visual family as the supplied mockups;
- the application looks significantly more professional and distinctive;
- layouts are cleaner and more deliberate;
- typography and hierarchy are substantially improved;
- existing real data is displayed rather than mockup fiction;
- no mockup-invented feature has been added merely because it appeared in an image;
- existing functionality and workflows remain intact;
- progressive disclosure remains intact;
- accessibility has not regressed;
- the UI has been visually inspected in the running application;
- full checks pass.

---

# Final Rule

When uncertain whether to copy something from a mockup, ask:

> **Is this a visual treatment of something GAN already does, or is this an invented product behavior?**

If it is visual treatment:

**Use it.**

If it is invented product behavior:

**Ignore it.**

The desired outcome is:

> **Current GAN functionality, transformed into the polished, cinematic, professional visual language of these mockups.**

Not:

> **A new version of GAN whose functionality was accidentally reverse-engineered from AI-generated screenshots.**
