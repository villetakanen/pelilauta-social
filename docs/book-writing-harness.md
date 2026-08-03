# Book-Writing Harness Rewite

A large scale harness change project plan.

This file is short on purpose, and nothing in its git history is a source. Earlier
versions were agent-written and are the failure this plan exists to fix. Fill the
sections below from verified sources; do not restore or expand from a previous draft.

## Scenario

We have noted that the agents, regardless of model and harness, bloat the repository with long, colourfull, and tautological language. A key example of this are the design system books.

The goal of this harness improcevement change, is to eliminate sources that create the said language in the design-system-books by either reducing the harness complexity, or introducing simpler mechanisms to write good design-system documentation.

Examples of design-ops harnesses:

- <https://github.com/murphytrueman/design-system-ops/tree/main/skills> — an open example
  of industry skills for design-system ops. About 40 skills, four of them about writing
  documentation. The `pattern-documentation` skill runs around 1,500 words and argues its
  rules before stating them, so its prose is not a model here. Its shape is: a gate that
  decides whether the page should exist, an output template with named slots, then checks
  after publication.
- <https://primer.style/product/contribute/documentation/> — GitHub's author-facing rules.
  A flat list of prohibitions and conventions, with no reasoning attached to them. Bans
  the words "easy", "simply", "quick" and "just". Requires imperative mood and
  contractions. Forbids double negatives, sarcasm and the possessive "our". Fixes three
  tabs — Overview, Guidelines, Accessibility — and lists what belongs in each. Sets no
  length limit.
- <https://diataxis.fr/reference/> — reference documentation excludes explanation and
  justification. Where bare description feels too thin to be useful, it links to an
  explanation page instead of explaining inline.
- <https://polaris-react.shopify.com/contributing/documentation> — Shopify's process.
  Draft, get subject-matter review, get Polaris-team review, then open the pull request.
  Little is written down as a rule; quality comes from human review. Recorded as an option
  we are not taking.

### Decided things, discovered while planning

## Exact changes to the harness

### AGENTS.md

Applied 2026-08-03. 558 words to 431. One departure from the proposal below, recorded under
"As applied".

`CLAUDE.md` is a symlink to `AGENTS.md`, so every turn reads this file. Its register is the
one agents reproduce. The rewrite covers the whole file, not only the lines about books.

`plans/agents-md-rewrite.md` rewrote this file on 2026-07-31, from 1040 words to 558, and
lines 28 and 29 below are its own outputs. Read its inventory before touching a line; it
records why each statement survived. That pass consolidated duplicated rules and kept the
register, so a second pass on register does not repeat it.

Five changes:

**Strip the justification from each rule.** Most bullets carry a clause explaining
themselves. Keep the instruction and drop the explanation. Where the explanation carries an
instruction of its own, give it its own line.

**Delete the aphorisms.** Line 5, "What they share is a contract." Line 29, "Refusing a fix
is a decision, not a default." Both are constructions the owner banned for books on
2026-08-01, recorded in `plans/design-books.md`.

**State each rule once.** Line 39 states the branch rule four times.

**Keep explanation in the opening blockquote and nowhere else.** Lines 3–5 are the project's
why, and a new agent needs them. Every line below is a rule. A line under the blockquote
that says why is in the wrong place, which makes this checkable by reading.

**Correct the versioning line.** Line 28 says "nested app versions keep their own meaning",
which states no rule. The workspace is not a monorepo: one release, one version number,
partitioned into packages to keep agent context small. App and package versions are unused.

Rewrites:

Line 27, owner's own:

> Now: A merge to `main` during the beta cycle is a release: it deploys and CI tags it.
> Only on the owner's request or approval.
>
> Wanted: During the beta phase, the active feat branch can be released by a PR and a merge
> to **main**.

Line 28, cut to its first clause. `.github/workflows/tag.yml` derives the tag from the root
`package.json` version and fails the release if that tag already points at another commit.
Nothing bumps the version automatically, so the instruction has to stay. The rest describes
version numbers that are unused:

> Now: Every pull request bumps the root beta version — `pnpm version prerelease
> --preid=beta`. The root `package.json` carries the release version; nested app versions
> keep their own meaning. No approval needed.
>
> Wanted: Every pull request bumps the root beta version with `pnpm version prerelease
> --preid=beta`. No approval needed.

Line 29, cut to its permission. The default is to report a defect and leave it, so the first
clause authorizes something and stays. "Unrelated cleanup and speculative generalization stay
out" restates the default. The closing sentence is the aphorism, and reporting covers it:

> Now: Fix what the work touches, and defects it uncovers inside the same epic. Unrelated
> cleanup and speculative generalization stay out. Refusing a fix is a decision, not a
> default.
>
> Wanted: Fix what the work touches, and any defect it uncovers in the same epic.

Line 39:

> Now: Never create, switch, or delete a branch. Until the beta line ends, this repository
> has exactly two branches: `main`, and the one long-living `feat/**` branch that all work
> happens on. Every pull request comes from that branch, whatever its topic. Only an
> explicit written instruction changes which branch that is: do not branch, and do not ask
> whether to branch.
>
> Wanted: Never create, switch, or delete a branch. All work happens on the one long-living
> `feat/**` branch, and only a written instruction from the owner changes which branch that
> is.

The rewrite of line 39 drops "do not ask whether to branch". That clause exists because the
rule was being ignored. If it is still needed after the rewrite, the imperative is not
landing and the rule belongs in a hook.

Expect the file to lose about a third of its length.

#### As applied

Line 27 keeps its approval gate, and names a human as the approver: "During the beta phase,
the active `feat/**` branch is released by a pull request and a merge to **main**. A human
approves every release." The proposed wording dropped the gate, which changes who may
release rather than how the rule reads.

**"Owner" is replaced by "a human" wherever it means approval authority.** Nothing in the
repository defined the word, and it carries three unrelated senses: the human who approves,
design authority (`design-system-developer/SKILL.md` lines 25 and 84,
`specs/design-system/principles/spec.md:38`), and a real domain concept in the application
(site, page and thread owners, `065-multi-owner-notification-skip.md`). The domain sense
stays. `plans/agents-md-rewrite.md:36` shows the approval sense was second person before
2026-07-31 and was abstracted into "the owner" then.

Done in AGENTS.md, lines 27 and 39. Still to do, in the skill sections below:
`release/SKILL.md` lines 12 and 17, `retro/SKILL.md` lines 25 and 40,
`docs/practices/lessons.md` lines 12 and 23, and the design-authority sense in
`design-system-developer/SKILL.md`. `spec/SKILL.md` and `delivery-review/SKILL.md` already
say "the human owner" and lose the second word.

Two other lines were pruned under change 1, beyond the four rewrites listed above:

- Line 26 loses "The versions inherited from v18 are dated, so" and "rather than hacking
  around it". The instruction that survives is to treat a build or CI failure as a stale
  dependency until proven otherwise.
- Line 30 keeps what Cyan consists of, because `plans/agents-md-rewrite.md` row 12 added it
  against a specific past error, and drops the em-dash asides carrying it.
- Line 47 loses "rather than assume".

Line 5 lost "What they share is a contract." The ask list at line 43 states that rule
directly.

### [constitution file x]

### [skill file x]

### .agents/skills/design-system-book.md
