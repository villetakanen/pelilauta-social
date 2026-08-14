# Technical Writing Harness

A plan for `docs/WRITING.md` and a `technical-writer` skill. Report only; nothing here
is applied.

## Situation

The repository already fights prose bloat, but the guidance is scattered and nothing
enforces it after a changeset:

- `docs/DESIGN.md` § Technical writing — voice rules and the agent/reader audience
  split. Loaded on demand, not per artifact.
- `docs/book-writing-harness.md` — a completed campaign against the same problem.
  It banned three constructions ("not X, but Y"; an aphorism closing a paragraph; a
  knowing aside), cut `AGENTS.md` from 1040 to 431 words, and cut the book templates
  by half. Its findings: what worked was **cutting harness prose, hard templates, and
  rules checkable by reading or grep** — not adding guidance documents.
- `.claude/skills/spec/SKILL.md` § Prose and `.claude/skills/design-system-book/SKILL.md`
  § Voice — each restates part of `docs/DESIGN.md` with artifact-specific deltas. The
  book skill carries the only mechanized check in the repo:
  `grep -nwE 'easy|simply|quick|just'` returns nothing.
- `AGENTS.md` names `docs/DESIGN.md` and `docs/ARCHITECTURE.md` as the base for all
  prose.

Two structural gaps produce the recurring corrections:

1. **No single normative writing reference.** Rules live in four places, drift apart,
   and each new skill restates them again.
2. **No polish step between authoring and review.** The author's context wrote the
   bloat; the same context is asked to judge it. Review agents (`spec-review`,
   `delivery-review`) then spend findings on prose instead of substance, and the human
   spends turns on corrections.

## The anchoring problem

A plain consolidation would be wrong. The current rule set is not a coherent style; it
is an accumulation of patches, each written against one observed failure, and several
over-block — they are half as harmful as they are useful.

"No rationale" is the type specimen. The failure it patched is wider than rationale:
sentences whose content the reader already has, or can get from a public source.
Three recurring shapes:

- **The tautological why** — a rationale the sentence itself already implies ("it is
  black, as black is the opposite of white").
- **The upstream fact** — platform behaviour readable from the technology's own
  documentation: that a browser renders the document, in what order CSS applies.
  Displayed expertise; nothing local.
- **The obvious why** — a rationale for a decision the reader would have made anyway.

The patch bans the whole rationale category, so it also bans the non-obvious why and
needs standing exceptions (principles books argue, ADRs carry why, commit messages
carry why). A rule that needs three exceptions is describing a symptom. The same
pattern likely holds elsewhere: banned-word lists catch the last incident's
vocabulary, and the next incident uses different words.

The repository already states the intended rule twice, in narrower forms: the book
skill's "cut a paragraph a competent reader could have written without this
repository", and its rule against tests that re-assert browser behaviour — the same
aspiration aimed at prose and at tests.

So `WRITING.md` anchors to the **aspiration** the patches were reaching for, not to
the patches. Every imported rule must re-earn its place as a test under a principle,
or it drops.

## The aspiration

Candidate principles — each with its checkable test, because a principle without a
test regresses into mood:

1. **Every sentence is the only carrier of what it says.** What it says may be about
   the repository, the application, its users, or its environments — a spec stating
   why a feature exists, a fact about production observable only there. What it may
   not be is available elsewhere: in the sentence before it, in the code it sits
   beside, in the platform's own documentation, in general competence. Test: delete
   the sentence; if the fact survives somewhere the reader would look, it stays
   deleted. This one principle subsumes most of the current patches: all three shapes
   above, the restated sentence, the aphorism, the knowing aside, and both of the
   book skill's existing narrower forms.
2. **A why appears where it changes what the reader does, and nowhere else.**
   Rationale is not banned; *derivable* rationale is. A decision that contradicts what
   the reader would expect states its why (or links where it lives: ADR, commit,
   principles book). A decision the reader would have made anyway states nothing.
   This replaces "no rationale" and dissolves its exception list.
3. **Write to the reader's next action, in their register.** The existing audience
   split survives as-is: agent/developer artifacts instruct; product-facing books
   say "we" and may argue.
4. **A statement lives once, in the file that owns it.** Templates own structure,
   `WRITING.md` owns sentences, skills own process, specs own behaviour. A restatement
   elsewhere is a pointer or a deletion.

**Settled 2026-08-14, by the owner:** carriership wins over "no rationale". The
`spec` skill's "carries no rationale" line is rewritten under principle 1: a spec
states the why nothing else carries — the reason the feature exists — and states no
why that is derivable. A spec's non-derivable why is not an exception to the rule; it
is the rule's best case.

The current bans become *examples under* these principles — kept only where they stay
grep-able and still catch live failures, and free to change without the principles
moving.

## Proposal

### 1. `docs/WRITING.md` — the normative reference

One short file: the principles above with their tests, a mechanics digest adapted from
the *Google developer documentation style guide* (second person, present tense, active
voice, sentence-case headings, one idea per sentence, no anthropomorphism), and the
grep-able word list as an appendix that may change freely. Hard cap around 450 words
of rules; a longer file becomes the bloat it exists to remove.

External imports stay short and actionable: a Google rule enters only if it maps to a
failure this repository has actually produced, not because the guide contains it.

Consolidation with an audit, not a move:

- Each rule in `docs/DESIGN.md` § Technical writing, the two skills' prose sections,
  and the book-writing-harness bans is re-derived from a principle, rewritten to its
  intent, or dropped. The audit's disposition table (kept / rewritten / dropped, one
  line each) goes in the changeset's commit message, not the file.
- `docs/DESIGN.md` keeps the design vision and a pointer; the skills keep only their
  genuine deltas.
- `AGENTS.md`'s "Base prose on…" line adds `docs/WRITING.md`. Constitution edit;
  owner approval.

### 2. `technical-writer` skill

`.claude/skills/technical-writer/SKILL.md`. Runs after a changeset is complete,
before `spec-review`, `delivery-review` or the PR. Invocable inline or as a subagent;
the subagent form is preferred because a fresh context has no attachment to the
sentences it is cutting.

The skill applies the principles' tests, not a pattern list — it asks "could the
reader have written this sentence" before it asks "does this sentence match a banned
shape". Scope rules:

- **Only prose the changeset touched.** Files in the current diff: docs, specs, books,
  plans, comments, commit-message drafts. It does not wander into untouched approved
  specs — editing one flips it back through the approval gate.
- **Cut and correct; never change meaning.** No new facts, names, values or claims.
  Where a sentence is wrong rather than bloated, it reports instead of rewriting.
- **Comments only, never code.** In a source file it touches nothing outside comment
  syntax.
- **It runs the checks**: the `WRITING.md` grep list over the diff, plus a
  before/after word count per file as its report.
- **A deletion is its default verdict**, and it reports each removal in one line.

### 3. Wiring

Start manual: the delivery habit becomes *implement → technical-writer → review*.
Reference the ordering in the skill descriptions; no hook or mandatory gate yet. If
invocations get skipped in practice, escalate then.

## Actions, in order

1. Distill the aspiration: audit every existing prose rule (`DESIGN.md`, two skills,
   book-writing-harness bans, relevant lessons) into kept / rewritten-to-intent /
   dropped, with the owner settling contested rows.
2. Draft `docs/WRITING.md` from the surviving principles (≤450 words of rules).
3. Same changeset: cut `docs/DESIGN.md` § Technical writing and the two skills' prose
   sections to pointers plus deltas; propose the one-line `AGENTS.md` edit for
   approval.
4. Draft `.claude/skills/technical-writer/SKILL.md` with the scope rules above.
5. Pilot: run the skill on one known-bloated document; the owner reviews the diff and
   the word-count delta before the skill is trusted on changesets.
6. After two or three real uses, `lesson`/`retro` decide whether the wiring escalates.

## Decisions needed from the owner

1. The rule audit's remaining contested rows — which patches carried intent worth
   keeping. (Carriership over "no rationale" is settled above.)
2. Approve `WRITING.md` superseding `docs/DESIGN.md` § Technical writing (move, not
   duplicate).
3. Approve the `AGENTS.md` "Base prose on…" edit.
4. Manual invocation before review, or a mandatory gate from day one. Recommendation:
   manual first.
