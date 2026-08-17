# Spec Harness

An analysis of `specs/TEMPLATE.md`, the `spec` skill and the `spec-review` skill
against ASDLC.io as the primary source, the way the Google style guide anchored
`docs/WRITING.md` (`2026-08-14-technical-writing-harness.md`). Report only; nothing
here is applied.

## Method

Anchor to the theory, not to the current set. The ASDLC knowledge base
(`asdlc.io/asdlc-skill.zip`, read 2026-08-14: `patterns/the-spec.md`,
`practices/living-specs.md`, `practices/adversarial-requirement-review.md`) is the
external authority. Each local rule either maps to the theory, records a deliberate
local divergence, or is a patch to re-derive or drop. The same import filter applies:
a theory rule enters the harness only if it maps to a failure this repository has
produced or plausibly will.

## Where the local harness already matches the theory

More than expected. Read before changing anything:

- **Spec-anchored maturity.** Specs persist, live in `specs/{domain}/{capability}/`,
  and are referenced from `AGENTS.md` — exactly the level ASDLC targets, explicitly
  rejecting spec-as-source. The Orphaned Spec anti-pattern is structurally impossible
  here.
- **State versus delta.** Specs carry state; `plans/` carries transient delta and is
  deleted — the Spec/PBI separation under local names, and the
  plans-are-guesses-not-territory rule is the same doctrine.
- **Blueprint/Contract anatomy.** The local template is ASDLC's anatomy plus a local
  `Documentation` section (the books a change must reach). Deliberate, earns its
  place.
- **The verification-plan test.** ASDLC: "if the Critic can't construct a
  verification plan from the spec, the spec is incomplete." `spec-review` states this
  as its spine. Present and correct.
- **Critic independence.** ASDLC's Critic Agent; local requires a non-author critic
  or `review incomplete`. Present.
- **Spec-as-Tutorial and Copy-Paste anti-patterns.** The template's sentence tests
  and its link-don't-copy rule kill both, more sharply than the theory itself.
- **The living template.** ASDLC says the project's `TEMPLATE.md` should evolve with
  use; it has, repeatedly, on this branch.

## Rules first read as deliberate — the owner says otherwise

Both rows below were drafted as "record, do not fix". Owner comments on 2026-08-14
reclassify them: patches born of exhaustion against the drift, not decisions.

- **"Git carries history."** Not a rule. Git was out of the way, so pointing detail
  there was the cheapest way to stop an agent filling specs with it — and the history
  itself is slop on slop, with erroneous claims. A carrier that is unread and
  unreliable is not a carrier: a why assigned to a commit message is lost. What
  survives of the local rule is narrower than it was written: a spec carries state,
  not narrative, so inline strikethrough deprecation stays out — but the standing
  reason behind a live decision belongs in the spec's Context or an ADR, never waved
  at git. Consequences in finding 8.
- **"No test plans in specs" (b3033d5).** Driven by the same pressure — specs at
  200–500 lines of slop, too hard to parse — not by settled theory. It stands as a
  working rule while the altitude fixes land, and gets revisited after them: if
  specs shrink to intent and contract, ASDLC's per-scenario named check may return
  without the bloat it was patched against.

## Findings — where the theory exposes local gaps

### 1. The central failure: inverted altitude

The owner's observation, 2026-08-14: specs land at far too detailed a level —
Gherkin for minutiae — while the capability's real why is almost always missing. The
pruned examples in the repo understate this; the raw drafts show it.

This is carriership inverted. The spec fills with what code, specimens and platform
behaviour already carry better, and omits the one thing nothing else carries: the
user or system need the capability exists for. The theory names both halves. ASDLC
defines Context as exactly that why ("Why does this feature exist? What problem does
it solve?") and defines scenarios as contract-level behaviour — what a Critic
verifies and future changes must not break — not an enumeration of renderings.

The instruments explain it. Every local test punishes imprecision, vagueness and
bloat; no test demands altitude. An agent generating a spec fills the sections whose
quality is checked (scenarios — and Gherkin costs it nothing to produce) and
satisfies the unchecked one with a thin sentence. The economy of code applies to
Gherkin too: volume without direction.

**Proposed:**

- **Context becomes a gate.** A Context that does not state the need the capability
  serves is a `spec-review` blocker, equal in rank to ambiguity. The `spec` skill's
  Recording-the-intent section already demands this; the review must enforce it.
- **A scenario must earn its altitude.** A scenario exists to protect a contract —
  behaviour a consumer, another capability or a future change depends on. Behaviour
  already pinned by a Constraint, a specimen or the platform gets no scenario. State
  this in the template's Scenarios slot and test it in `spec-review` (the existing
  Consequence challenge sharpened: name the materially wrong implementation each
  Gherkin prevents; a scenario preventing none is deleted).

### 2. The subtraction test needs a floor

The bloat war made the local instruments subtractive: "can an agent derive this from
the code? delete it." ASDLC pulls the other way: "be explicit about constraints",
"use file paths, not descriptions", state contracts with signatures and schema names.
These do not actually conflict — a contract, a path, a value boundary is
only-carrier content; what subtraction removes is narration. But nothing says so, and
a zealous subtraction pass could strip a spec below the point where it anchors
anything. The notification-action spec shows the healthy balance: one-sentence
Context, a file path, value boundaries (`9+`, whole numbers), and nothing else.

**Proposed:** one line in the template and one in `spec-review`'s Subtraction
challenge: subtraction removes what the reader can derive; a contract, a path or a
boundary value is what the spec exists to carry, and is never subtracted.

### 3. Positive constraints — the pink elephant rule

ASDLC: telling an agent what *not* to do puts the wrong approach in its context;
state constraints as facts the system follows, and encode failure modes as scenarios
rather than warnings. The local template's Constraints prompt ("what would someone
guess wrong?") is compatible, but nothing requires the positive form, and
`spec-review` does not check for it. Meanwhile the template's own comment block
teaches by prohibition ("Do not write datelines… Do not announce…").

**Proposed:** add the positive form to the template's Constraints slot ("state each
constraint as a fact the system follows; put a failure mode in a Scenario, not a
warning") and a matching challenge to `spec-review`. Recasting the template comment's
own "do not" lines can ride along where a positive form is shorter.

### 4. The same-commit rule has no local home

ASDLC's strongest maintenance rule: if code changes behaviour, the spec updates in
the same commit — a stale spec actively misleads, and stale specs are the primary
source of intent debt. Locally, nothing states this. `delivery-review` challenge 10
checks record accuracy when a review is requested, but reviews are on-request only.
The approval gate is not an obstacle: during beta the merge is the approval, so a
spec diff riding the same pull request as the code that revealed it *is* approved by
the merge. The mechanism exists; the rule is unstated.

**Proposed:** one line in the `spec` skill: an implementation discovery that changes
behaviour updates the spec in the same changeset, and the pull request's approval is
the spec diff's approval. This also implements ASDLC's refinement cycle — the spec as
hypothesis that implementation completes — which the current draft/approved state
machine otherwise discourages.

### 5. No size or split trigger

ASDLC: a focused spec outperforms a comprehensive one; past ~500 lines a spec is
covering multiple features — split it. The local template supports sub-feature
splitting but nothing triggers it, and the drift memory (specs toward too much
detail) says the pressure is real.

**Proposed:** a split trigger in the `spec` skill, stated positively: one spec covers
one independently evolvable capability; when a second capability appears in the text,
it moves to a child spec.

### 6. Upstream requirement review is absent — probably rightly, but undecided

ASDLC's Adversarial Requirement Review challenges the *problem statement* before a
spec is written (Problem Sharpener, Assumption Surfacer, Pre-Build Stress Test —
human as thought leader, agent as interviewing critic). Locally, `spec-review`
reviews the written spec; its Premise challenge is the only trace of the upstream
step. For v21 this is usually moot — premises arrive validated from shipped v18 and
v20 — but product decisions do occur (the characters removal carried an ADR), and
nothing routes a genuinely new capability through a premise interview.

**Decision for the owner**, not a proposal: record the absence as deliberate
("premises come from v18/v20; a new capability's premise goes to the human"), or add
a short premise-interview step to the `spec` skill that fires only when a capability
has no v18/v20 ancestor.

### 7. The skills' own prose predates WRITING.md

`spec-review`'s challenge list is dense to the point of ambiguity ("Guarantee: checks
control their inputs; wider aims remain targets") and the `spec` skill's procedure
carries typos and drafting scars ("a a spec", "clarificatioons", numbering that
drifts). Both predate `docs/WRITING.md` and have not had the treatment.

**Proposed:** run the `technical-writer` skill over both files as part of the same
changeset — the first harness files to get the pass.

### 8. The why has no trusted carrier

`docs/WRITING.md` principle 2 and its ownership table assign "a decision's
narrative" and "the implementation why" to the commit message. The owner's
correction breaks that assignment: git history is mostly slop with erroneous
claims, and nobody reads it — a why stored only there is functionally deleted.
Carriership requires a carrier that actually carries.

**Proposed:**

- Amend `docs/WRITING.md` principle 2 and the ownership row: the commit message
  records only its own delta, best-effort; a why any future reader needs lives in
  the spec's Context or an ADR. Nothing load-bearing is assigned to git alone.
- Commit messages still get better for free: the `technical-writer` skill already
  lists commit-message drafts in its scope.
- This raises the weight of finding 1's Context gate: with git demoted, the spec's
  Context is the *only* place a capability's why can survive.

## Actions, in order

1. Owner settles finding 6 (deliberate absence, or a conditional premise-interview
   step) and confirms findings 1–5 and 8.
2. One changeset: the Context gate and the scenario-altitude rule (template +
   `spec-review`), the subtraction floor (template + `spec-review`), the positive-
   constraint rule (template + `spec-review`), the same-commit line and the split
   trigger (`spec` skill), and the `docs/WRITING.md` principle-2 amendment
   (finding 8).
3. `technical-writer` pass over `spec`, `spec-review` and the template comment in the
   same changeset.
4. `spec-review` the next real spec through the amended instruments; adjust from the
   evidence, not from further theory.

## Source

Findings anchor to the ASDLC knowledge base as read 2026-08-14:
[The Spec](https://asdlc.io/patterns/the-spec),
[Living Specs](https://asdlc.io/practices/living-specs),
[Adversarial Requirement Review](https://asdlc.io/practices/adversarial-requirement-review).
The `asdlc-audit` skill carries the download mechanics.
