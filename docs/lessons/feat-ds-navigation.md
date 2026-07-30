# Lesson Candidates — `feat/ds-navigation`

Three candidates. Earlier revisions of this file recorded eight, most of them
facets of the second one; the discarded detail is in git history if needed.

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
