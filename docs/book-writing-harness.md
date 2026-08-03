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

**Books get their own skill.** 2026-08-03. `design-system-developer` does not absorb it.

**Three constructions are banned, in books, specs, code comments, and the harness files
that teach them:** "not X, but Y"; an aphorism closing a paragraph; a knowing aside.
2026-08-01, `plans/design-books.md`.

**"Owner" is replaced by "a human" where it means approval authority.** The application's
site, page and thread owners keep the word. Applied to `AGENTS.md` 2026-08-03; remaining
sites are listed under the skill sections below.

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

### packages/design-system/books/templates/*.mdx

1,158 words to emit books capped at 300 and 600: `base.mdx` 249, `component.mdx` 420,
`principles.mdx` 489. Each is a comment block followed by a body. The body is the template.
The comment block is a fourth copy of the skill.

**Cut the comment blocks to the slots.** `base.mdx` lines 8–26, `component.mdx` 8–30,
`principles.mdx` 8–41. The skill instructs; a template is shape to fill. A comment the
writer deletes on copy is an instruction delivered once, which is the skill's job.

What the blocks currently duplicate: the three kinds and which template each takes, the
specimen rule, the length limits, no `h1`, `docs.css` and `books/*.astro` are not patterns,
never link a spec. `principles.mdx` lines 17–23 describe the other two templates.

**They also argue.** `component.mdx` lines 16–20 cite five design systems to justify a
shape. Line 27, "however well it reads", is the same aphorism as
`design-system-developer/SKILL.md:51`.

**One contradiction to settle while cutting.** `component.mdx:29` sets length in lines,
"Sixty to a hundred lines". `design-system-developer/SKILL.md:61` says length is counted in
words, not lines. A component book has no word limit anywhere. Give it one.

Keep the slot guidance that is not in the skill: `principles.mdx:48`, headings state an
outcome rather than a noun phrase; `component.mdx:37`, render before code.

Expect the three to total under 400 words.

### .agents/skills/design-system-developer/SKILL.md

The only skill with book content. 749 words, of which lines 34–68 are the book skill's.

**Delete lines 34–68.** They become `design-system-book/SKILL.md`, rewritten to its budget
rather than moved.

**Replace them with the handoff.** The book is written with the `design-system-book` skill.
Invoke it. Do not write MDX from here.

**Line 3, the description.** "Building or changing a design-system component, token, or
book." Drop "or book", or book work routes here.

**Line 8 stays.** "A design-system pull request carries its spec, its implementation, and
its book on the design site." The only place the book is mandatory. What changes is who
writes it, not whether it exists.

**Lines 70–80 stay.** The `.astro` books and `docs.css`: a rule about what not to build,
read when building. It outlives the last `.astro` book only until `plans/design-books.md`
deletes them, and then it goes with them.

**Lines 82–92 stay.** The sourcing rule, read when deciding. A book does not read it.

**Register pass on what stays.** The surviving half breaks the bans as badly as the half
that leaves: lines 13–14, a knowing aside; 19–20, "not a deletion, and not a screenshot";
23, "Correctly, not identically"; 25–26; 31–32, "Tokens are inputs to a surface, not a
surface", a "not X but Y" closing on an aphorism.

Expect around 400 words.

### .agents/skills/design-system-book/SKILL.md

A new skill, written under 200 words. Not a move: what does not fit is a template comment,
or stays in `design-system-developer/SKILL.md`.

Shape, from the `pattern-documentation` skill: gate, slots, check.

**Gate, and the first line.** Which of the three kinds this is. The navigation spec decides
whether a page exists; the templates cannot decide which one to copy.

**Slots.** The MDX file at `apps/design/src/content/<group>/<slug>.mdx` is the book. Copy a
template. No `h1`. Anything that ships in source comes from a specimen, never from prose.
No existing book, here or in v20, is a reference.

**Check.** Base 300 words, principles 600, component per its template. The three banned
constructions. Primer's four words: "easy", "simply", "quick", "just". Imperative mood and
contractions, stated positively. The word list is the only part that greps; the plan's
length check owns the limits, or this skill names the command.

Displaces `design-system-developer/SKILL.md` lines 34–68. Delete them, do not move them.
Lines 8–32 stay, the Cyan gate. Lines 70–80 stay, the `docs.css` and `.astro` debt: a rule
about what not to build, read when building.

**When the book cannot state a design intent:** read `docs/DESIGN.md`, then `AGENTS.md`,
then ask a human. Not v20, and not `design-system-developer/SKILL.md` lines 82–92 — that is
the sourcing rule for deciding, and a book documents decisions already made. Lines 82–92
stay where they are and the book skill does not name them.

`docs/DESIGN.md` does not exist. The skill names it regardless. Its own section is below.

A book omits reasoning; it does not hand it off. Reasoning is the spec's and the commit
message's, and neither is for a design-site reader. Diátaxis links reference to an
explanation page, and that part does not port.

### docs/DESIGN.md

Does not exist. A book skill under 200 words needs somewhere to send a writer who cannot
state a design intent, and `AGENTS.md` is the constitution, not the design record.

Decisions are made and then scattered. Three that are settled and not in one place:

- Two themes, Dark default, Light checked before merge. `plans/design-books.md:59`.
- The font pairing. Commit `7cd8bd8`, and `specs/design-system/fonts`.
- Appearance is v20's and a human's, and is not a compatibility contract with v18.
  `AGENTS.md`, and `design-system-developer/SKILL.md:82`.

Plans are not the record: a plan is epic scope and ends with its epic.

Settled 2026-08-03:

**It states decisions, and only the ones no single spec owns.** A decision belonging to one
capability stays in that capability's spec, and `DESIGN.md` does not mention it. It does
not index: a pointer into a finished plan rots, and a commit is not navigable.

**It is not published.** `docs/`, not `apps/design/src/content`. Its reader is the agent
writing a book. It has no length cap and this plan does not govern its shape.

**An agent drafts it and a human approves it,** as with a spec. The first draft is assembly
from decisions already settled, not authorship. After approval, a decision enters when a
human makes it.
