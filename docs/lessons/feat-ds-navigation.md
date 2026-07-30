# Lesson Candidates — `feat/ds-navigation`

Five candidates. Earlier revisions of this file recorded eight, most of them
facets of the second one; the discarded detail is in git history if needed.
Candidate 4 is a re-entry: it was consolidated away in `1016ccb` and recurred
within hours with material cost.

## 1. Check upgradability before designing a workaround

**Evidence.** Adding the approved `@astrojs/mdx` broke Svelte's TypeScript
parsing. I diagnosed duplicate physical `acorn` copies under
`node-linker=hoisted`, then designed and verified two workarounds — a
`pnpm.overrides` pin and `pnpm dedupe`. Neither was needed: `svelte` 5.43.5 →
5.56.8, already inside the declared `^5.39.6` range, brought
`@sveltejs/acorn-typescript` 1.0.11 and fixed it.

**Assessment.** Second recorded instance. `AGENTS.md` already carries the rule,
and `plans/rc1-toolchain-upgrades.md` records the same shape from the
`workbox`/`rollup` detour. The rule was in required context both times. The
likely mechanism is trigger recognition: the rule says "outdated-dependency
problem", but the symptom presented as a package-manager layout problem.

**Possible change.** Tie the rule to a symptom rather than a diagnosis — when a
dependency, transitive dependency, or package-manager layout is implicated,
record installed-versus-latest before proposing any fix.

**Disposition.** Proposed.

## 2. Harness artifacts have no stated altitude, so they fill with detail

**Evidence.** Four artifacts drifted the same way in one slice, each caught by the
owner reading it rather than by any gate:

- Provenance frontmatter reached 456 words carrying framework internals, design
  rationale, a defect finding and slice sequencing — all of which
  `specs/TEMPLATE.md` already assigns to the plan.
- The spec reached 177 lines for temporary documentation navigation, against 78
  for `design-tokens`, which governs the whole application's visual contract.
- Its Intent narrated history, then value claims, and never defined "book" or
  named agents as readers. Naming them immediately produced a missing contract
  line.
- `plans/core-tokens.md` was written as an inventory of token values and call
  sites — facts trivially greppable from source.

**Assessment.** One cause, not four. `specs/TEMPLATE.md` bounds the spec body but
not its frontmatter, defines a plan only negatively as where excluded detail
belongs, and prompts Intent for motivation rather than for the domain and its
boundaries. The spec skill states "a spec without provenance is an opinion, not
evidence", a pressure to add with no counterweight. The mandatory adversarial
review cannot catch any of it: its five axes all ask whether the spec says enough,
so every pass grows the file — this one added a Review section, two
Definition-of-Done lines, two guardrails and two tests.

`git log --follow specs/TEMPLATE.md` shows all of this entered in one commit,
`140720c`, which added the Intent anatomy, mandatory provenance and the review
gate together, explicitly before implementation began, with no spec to verify
against. Its own lessons entry recorded the decision as aligning with the
published ASDLC.io practice — while diverging from it: the published anatomy is
Blueprint (Context, Architecture, Constraints) plus Contract, and no ASDLC.io spec
uses Intent. The two dropped thirds are what would have forced concreteness.

A related defect from the same block: five provenance entries were worded as dated
human decisions but composed by the agent, laundering agent reasoning into human
authority in the one field designated as evidence.

**Possible change.** State an altitude for each artifact, positively. For plans,
the operational test is greppability — if a line can be regenerated from source
with a grep, it is not plan content. For Intent, ask for the domain objects,
the consumers by kind including agents, and the expected lifetime. For provenance,
one line per entry naming a source, and mark agent-proposed decisions as such. Add
a subtraction pass to the review, run last: what can be deleted without losing a
checkable claim.

**Disposition.** Proposed. Deferred by the owner — before the next cycle, not now.

## 3. Narrow criticism answered with a sweeping rewrite

**Evidence.** `140720c` above is one instance: a specific criticism about forcing
code-level contract detail into blueprints was answered by rewriting the template
and removing the concrete sections wholesale. The second instance is this file —
drafting candidate 2, I proposed rewriting `specs/TEMPLATE.md` again and
re-heading four specs. The owner chose to log instead, which stopped it.

**Assessment.** The mechanism by which agent-driven harness evolution degrades
rather than compounds. The damage never appears at review time, because reviewers
check whether the new structure is coherent, not whether it was warranted; it
appears when the next author works inside it. `AGENTS.md` already forbids
consumer-free foundation work without approval and a timebox, and `140720c` was
consumer-free by its own description — so, as in candidate 1, the rule was present
and the trigger was not recognised.

**Possible change.** Fix the instance; record the general case. Changing a
generator — template, skill, practice guide — needs its own approval and a
consumer, meaning the next artifact actually written through it. The signal to
watch is the ratio: one sentence criticised, one template rewritten.

**Disposition.** Proposed.

## 4. A superfluous branch acquires a plan file and becomes a shadow epic

**Evidence.** `feat/ds-foundations` was created 12:31 from `1016ccb`, the tip of
this branch, and PR #58 was opened with `feat/ds-navigation` as its base — a
feature branch stacked on a feature branch, which the delivery contract does not
provide for. It then acquired `plans/core-tokens.md` as its work ledger. The
owner deleted that file from this branch in `2eb3680` as swept in by
`git add -A`, but it survived on the shadow branch, where it recorded the state
of the token work.

Three costs landed within four hours, all in this session:

- The owner could not verify the token results, because the work and its ledger
  were on a branch invisible from the epic.
- An agent auditing the token layer rediscovered `--cn-grid` as an unresolved
  reference, reported it as a live product defect, and was wrong: the fix — a
  `units.css` definition and a `tokens.css` entry point — already existed on the
  shadow branch, with a header comment naming that exact defect.
- The two branches diverged on a file one of them deleted, so replaying the work
  now needs manual conflict resolution.

**Assessment.** The mechanism is branch first, ledger second. An illegitimate
branch is still a place, and a place accumulates a durable artifact; `plans/` is
the only writable surface with no stated lifetime, so the artifact lands there
and becomes the only record of that branch's state. Nothing in the harness
objects: no gate checks a PR's base, and no artifact declares which branch is
the live epic.

This signal has now fired three times. `50b41ab docs(lessons): log plans
drifting into agent work ledgers` recorded it; `1016ccb` consolidated it into
candidate 2 as a facet of artifact altitude, hours before it recurred with
material cost. It is not an altitude problem. Candidate 2 is about artifacts
filling with too much detail; this is about an artifact existing at all because
a branch did.

**Possible change.** Two, separable. First, a plan's right to exist derives from
its branch: a PR whose base is not `main` is the defect to catch, and it is
mechanically checkable in the PR workflow. Second, introduce `docs/adrs/` so
decisions stop needing a plan to live in, and move the ones already stranded
(default radius, design-system token ownership) — both are currently recoverable
only from a plan file or a branch that should not exist.

**Disposition.** Proposed. Third recurrence; the previous consolidation was
premature. Overlaps the audit's missing-ADR finding.

## 5. Nothing tells an agent which branch is the live epic

**Evidence.** `AGENTS.md` states that a feature branch is a continuous context
delivering several slices to `main` before it closes, and `feat/cn-icon`
demonstrates it — PRs #53 and #56 from one branch. Despite having read and
quoted that passage, I concluded twice in one session that `feat/ds-navigation`
was finished because PR #57 had merged, and built two rounds of analysis on it:
first that the branch predated the token work, then that the work had been done
on dead code. A stored agent memory naming `feat/ds-foundations` as the epic
branch reinforced the error rather than correcting it.

**Assessment.** The rule was in required context and was not applied, which is
the same failure shape as candidates 1 and 3: the rule is stated abstractly and
the trigger is a concrete observation that does not resemble it. `git log`
answers "did this merge" but not "is this epic open"; merged-and-continuing and
merged-and-closed are indistinguishable from the branch alone. The one artifact
that would disambiguate — a closing commit like `chore(factory): close the icon
branch` — is only recognisable after the fact.

**Possible change.** Make the live epic observable rather than inferred. The
cheapest form is a line in `AGENTS.md` naming the current epic branch, updated
when one closes, so an agent reads it instead of deducing it from merge state.
The failing inference to name explicitly: a merged PR does not close its branch.

**Disposition.** Proposed.
