# Application spec harness updates

## Outcome

Support application views, forms, and workflows composed from the current design
system. An application spec records the user task, UX intent in Design, and
observable behaviour. A design-system spec governs the reusable capabilities
that composition consumes and links governing books from Documentation.

The plan alters no active instruction, application behaviour, shared Firebase
contract, or release process.

## Findings

| Source | Current direction | Consequence |
| :--- | :--- | :--- |
| [AGENTS.md](../AGENTS.md), [Design](DESIGN.md), and [DS developer](../.agents/skills/design-system-developer/SKILL.md) | The fallback for unsettled presentation is v20; the developer skill requires finding v20 implementation before writing. | Routine application composition starts with migration research instead of current books and public capabilities. |
| [Spec skill](../.agents/skills/spec/SKILL.md) | The author interviews the operator before settling Context and deletes text derivable from code. | Recorded intent can prompt a repeated interview, and implemented behaviour can lose its contract. |
| [Spec template](../specs/TEMPLATE.md) | The template requires stopping before implementing a proposed amendment. | The template contradicts the continuing-work procedure in AGENTS.md and the spec skill. |
| [Spec template](../specs/TEMPLATE.md) | The Blueprint has no Design section, Documentation expects books, and Gherkin starts with a bare Given. | An application view has no template for visual composition or a complete named feature. |
| [Spec skill](../.agents/skills/spec/SKILL.md) and the settings specs | The skill places sub-features in child spec directories; the settings specs use section files under one status. | Authors lack a rule for choosing between a section and an independent capability. |
| [Next task](../.agents/skills/next-task/SKILL.md) | Readiness requires live specs before implementation. | Planning can restore a stop that the amendment workflow removed. |
| [Delivery gates](../delivery.yaml) and AGENTS.md | The app e2e gate records no evidence; AGENTS.md directs app work toward the design suite. | Agents can mistake component checks for evidence of application composition or persistence. |

Library settings supplies two concrete examples: spacing was available in DS books
before inquiry, and a section-to-column table failed to show the layout that an
ASCII wireframe conveyed.

## Proposed changes

### 1. Establish current sources and task boundaries

Update AGENTS.md to distinguish application composition from changes to a public DS
capability. Using existing containers, fields, and actions in a view requires no DS
spec amendment. A missing or changed reusable treatment enters the DS workflow and
retains its named-epic requirement.

Make docs/DESIGN.md the canonical source for design-source precedence. Start with
recorded operator intent and governing local specs, then inspect current DS
books, specimens, and public APIs. Books explain composition; a conflict with a
governing spec remains an explicit discrepancy. Consult earlier versions only for
an identified historical or compatibility question. Current implementation records
behaviour but does not establish that a reported defect is intended.

Keep the existing application spec threshold: preserve settled behaviour without
inventing a spec for every fix; create or amend a governing spec when behaviour or
view composition changes. Treat visual hierarchy, responsive order, and form state
presentation as specifiable behaviour.

Preserve the shared-service judgment boundaries in AGENTS.md. Local design-source
precedence does not authorize changes to persisted data, authentication, or public
URLs.

### 2. Give the spec skill an application authoring path

Revise `.agents/skills/spec/SKILL.md` to follow this sequence:

1. Identify the user task, the changed capability, and the governing spec.
2. Read recorded intent, the current implementation, and the relevant DS books and
   specs before asking design questions.
3. Identify the smallest unresolved product decision. Ask only when it affects the
   proposed outcome and the available sources do not settle it.
4. Choose the application or DS template. Write the intended composition and
   observable states while implementation remains free to resolve internal details.
5. Update the spec with implementation discoveries in the same changeset and use
   the amendment procedure in AGENTS.md.

Replace the mandatory Context interview with a conditional inquiry for missing or
conflicting intent. Preserve contracts when code implements them: subtraction
removes implementation narration and duplicated authority, not the promise that a
future change must preserve.

Define a section file such as `actions.md` as part of its parent capability, sharing
the parent status and review boundary. Use a child `spec.md` when the capability
needs independent scope or clearance. Update `docs/ARCHITECTURE.md` with this
artifact distinction and link it from the skill.

### 3. Add application and DS templates

Retain `specs/TEMPLATE.md` as the common anatomy and template selector. Add
`specs/templates/application.md` and `specs/templates/design-system.md`. Both use
Blueprint and Contract, with status governed by AGENTS.md rather than a copied
approval procedure. The DS Blueprint requires Documentation with paths to the
book or books that carry the capability. The application Blueprint requires Design
that specifies UX at the intent level.

The application template includes these authoring prompts:

- Context identifies the user and task.
- Architecture identifies route, access boundary, participating capabilities, and
  consequential dependency choices.
- Design states what the user needs to understand and accomplish, which actions
  take priority, how information groups, and what feedback communicates progress
  and outcomes. It shows the composition and references consumed DS
  capabilities.
- Constraints state relevant data, interaction, and compatibility boundaries.
- Contract defines completion, invariants, and complete Gherkin features.

Keep Design focused on the intended experience: what stays visible while editing,
whether changes apply immediately or await submission, how the user recovers
from failure, and how priorities survive a narrower container. Include the aspects
the view needs without filling a universal checklist. Internal component structure
and CSS techniques remain implementation choices. Contract scenarios make the
intended experience observable.

Require a visual sketch for a view whose arrangement matters. Prefer fenced ASCII
for rows, columns, nesting, and relative widths. Use Mermaid when relationships or
state transitions are clearer as a graph. Tables carry mappings and comparisons;
they do not replace a requested wireframe. Label sketches as schematic and keep
token values and responsive thresholds in governing DS specs. Add a narrow
sketch when stacking changes the composition materially.

Use the library settings Design section as the worked composition example. A form
example shows field groups, supporting text, and action placement without prescribing
new field or button styling.

Provide `Feature:` with named `Scenario:` blocks. Use `Background:` only for shared
preconditions and `Scenario Outline:` with `Examples:` for equivalent behaviour
across inputs. Select relevant states: access denied, loading, empty or missing
data, validation, unsaved edits, submission, success, failure, and recovery. Each
scenario states its precondition, trigger, and observable result. A written feature
does not imply an executable step suite exists.

Keep Documentation and book requirements in the DS template. Application Design
references a DS book when it explains a treatment the view uses, without adding a
Documentation section merely to satisfy the shared anatomy. Application specs name
a view or existing fixture where it provides evidence; they require no DS book for
each application widget.

### 4. Align review, sync, and prose handling

Update `.agents/skills/spec-review/SKILL.md` to read the chosen template and all
section files the parent delegates to. For DS specs, check that Documentation links
the books carrying the capability. For application specs, check that Design states
UX intent and that the sketch, section order, responsive rules, and scenarios serve
that intent. Check state preconditions and scope data
constraints to the records they govern. The loaded-profile and account-write
corrections in the settings spec are regression examples.

Keep independent review for proposed behavioural changes. Make its scope the
changed capability, including its sections. A wording edit or equivalent visual
representation preserves clearance and does not restart behavioural review.

Update `.agents/skills/spec-sync/SKILL.md` to reconcile the composed application
view with its spec and delegated sections. Resolve a missing reusable treatment
through its DS spec; report Contract divergence through the existing procedure.

Update `docs/WRITING.md` and the technical-writer skill to distinguish normative
contracts from implementation narration. Preserve wireframe geometry and Gherkin
structure during prose edits. A diagram label need not become a sentence. Check
the representation guidance in `.claude/output-styles/pelilauta-register.md` against
this rule while preserving concurrent operator edits.

### 5. Remove competing migration instructions

Update the source-selection paragraphs in the DS developer, next-task, and
epic-planning skills to reference docs/DESIGN.md. Narrow the DS developer trigger
so application composition does not inherit DS capability authoring requirements
solely because it changes view styles.

Remove the proposed-status stop from the template and the requirement in next-task
to obtain live status before proceeding with an authorized proposed amendment.
Resolve the phrase “implementation follows live specs” in AGENTS.md against its
explicit continuing-work rule. Keep one amendment procedure in AGENTS.md and
reference it from the participating skills.

Search active instructions and skill metadata for remaining migration prerequisites,
old status names, and stale template links. Preserve historical reports and lessons
as historical records. Update existing skill exposures if their metadata changes;
this plan introduces no new skill.

### 6. State what application verification demonstrates

Clarify the verification guidance in AGENTS.md and delivery.yaml: Astro checks
answer type questions, unit checks answer logic questions, and the design suite
answers DS behaviour questions. Inspect the actual application view to assess its
composition. Record application integration gaps where no check controls the
required inputs.

Preserve the prohibition on the application e2e suite and the release-only cadence
of UAT. This plan adds no testing framework, seeded backend suite, or release gate.
Scenarios identify intended behaviour; delivery evidence states which scenarios
ran and which remain unverified.

## Implementation order

1. Amend AGENTS.md, docs/DESIGN.md, the spec skill, and the common and domain
   templates together so the application path has consistent authority.
2. Align Architecture, Writing, review, sync, task selection, DS development, and
   verification guidance with that path. Run the technical-writer pass over the
   changed prose and `pnpm check:skills` for skill exposure.
3. Exercise the revised workflow on library settings and site settings, including
   their Actions and Theming sections. Amend only what the new workflow reveals;
   leave unrelated specs for their next substantive change.

## Validation

Verify the harness against these cases:

| Case | Expected result |
| :--- | :--- |
| A view stacks existing fields. | The author finds the spacing treatment in current DS sources without a new DS capability or a repeated operator question. |
| A settings page places three widgets in columns. | The application spec includes a visual sketch and complete layout scenarios using the existing container contract. |
| An application spec describes a form. | Design explains the intended editing experience and feedback; the Contract makes those outcomes observable. |
| A DS capability changes. | Documentation identifies every book carrying the capability. |
| A form adds a save failure state. | The spec states the resulting values, feedback, and recovery behaviour without inventing persistence permissions. |
| A reusable control lacks a required state. | The task identifies the DS capability and follows its spec and epic requirements. |
| Implementation reveals a material spec amendment. | The spec becomes proposed and work continues within the existing judgment boundaries. |
| A prose pass encounters a wireframe. | The layout geometry and behavioural meaning survive the pass. |
| Only the design suite passes. | The delivery report makes no claim of verifying application persistence or the composed view. |

Run the writing checks and inspect all changed links and templates. Review the
trial specs through the revised spec-review workflow. Confirm that no active
instruction requires routine historical-source research or stops work solely
because a spec is proposed. Keep the application e2e and UAT commands unexecuted
during this harness validation.
