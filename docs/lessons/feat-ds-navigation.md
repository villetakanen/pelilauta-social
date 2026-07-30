# Lesson Candidates — `feat/ds-navigation`

## 1. Workaround designed for a problem a minor version bump deleted

**Evidence.** Adding the owner-approved `@astrojs/mdx` broke
`pnpm --filter design build`: Svelte stopped parsing `lang="ts"` in
`packages/design-system/components/Icon.svelte` ("Unexpected token" at the first
type annotation). I traced it to two physically distinct `acorn` copies under
`node-linker=hoisted`, so `@sveltejs/acorn-typescript` was extending a different
acorn instance than the one Svelte parsed with. I then designed, verified and
presented two workarounds for approval — a `pnpm.overrides.acorn` pin and
`pnpm dedupe` — including a full gate run on the override.

Neither was necessary. The human asked whether the libraries could simply be
upgraded instead. `pnpm update -r svelte` (5.43.5 → 5.56.8 — zero majors, and
already admitted by the declared `^5.39.6` range) pulled
`@sveltejs/acorn-typescript` 1.0.6 → 1.0.11 and the build passed, with no
override, no dedupe, and no lockfile churn beyond MDX and Svelte.

**Assessment.** Valid, consequential, and the second recorded instance — not a
one-off.

- `AGENTS.md` already carries the rule under ASK: "do not propose a workaround
  for an outdated-dependency problem without reporting whether updating it
  works." That file is required context and had been read in this session.
- `plans/rc1-toolchain-upgrades.md` records the same failure shape from the
  `workbox-build`/`rollup` detour — a detour whose fix reported deploy SUCCESS
  while every SSR route returned 502 — and states the corollary explicitly.
- So the guidance was present, in required context, when the same mistake
  recurred. Emphasis is therefore unlikely to be the missing ingredient.

Alternative explanation considered, and the more probable mechanism: the rule is
written as applying to "an outdated-dependency problem", but the presenting
symptom was a package-manager *layout* problem — duplicate physical copies under
a hoisted linker. Having named a plausible root cause at the layout layer, no
step remained that would ask whether any implicated package was merely behind.
The trigger was not recognised, rather than the rule being disregarded. That
points at the rule's trigger wording, not at agent diligence.

Also worth noting: the eventual fix was not even a dependency *change* in the
sense the ASK gate contemplates — 5.56.8 was inside the range the repository
already declared, so the "workaround vs. update" comparison was cheaper to run
than either workaround was to design.

**Possible change.** Smallest useful change: make the trigger observable instead
of interpretive. Tie the `AGENTS.md` rule to a *symptom* rather than to a
diagnosis — when a dependency, a transitive dependency, or package-manager
layout is implicated in a failure, record installed-vs-latest for the implicated
packages before proposing any fix. "Duplicate transitive copy", "peer
mismatch" and "hoisting/linker" then read as instances of the rule rather than
as something outside it.

**Disposition.** Proposed. Human assessment required; not applied. Raised by the
human owner 2026-07-30 after observing the workaround attempt.

## 2. Provenance frontmatter became a dumping ground

**Evidence.** The owner rejected the provenance block of
`specs/design-system/design-site-navigation/spec.md` on sight, and the measured
shape supports that. Frontmatter word counts across the four design-system specs:

| Spec | Provenance |
| --- | --- |
| `design-site-navigation` (this slice) | 456 words |
| `iconography` | 442 words |
| `components/cn-icon` | 283 words |
| `design-tokens` | none (no `provenance:` key at all) |

456 words of frontmatter carried a 177-line spec. Of its ten entries, about half
were not sources of authority:

- Astro Content Layer mechanics, down to
  `node_modules/astro/dist/content/loaders/glob.js` and the name of an internal
  function — a framework choice and an implementation note.
- A paragraph of design rationale explaining why the layout does not own the
  `h1`, which the body already had to state anyway.
- The `--cn-grid` / `--cn-shadow-elevation-*` defect finding, plus the statement
  that the grid token is the next slice's work — a finding and task sequencing.
- An entry recording that wiring the design site's tests into the verify gate was
  out of scope, which is slice scope rather than the intent's authority.

`specs/TEMPLATE.md` already forbids exactly this: "Blueprint detail — file
layouts, framework choices, task sequencing — belongs in the linked plan, not
here."

**Assessment.** Valid, and the owner's hypothesis that the harness is implicated
looks correct. Three pressures point one way and nothing points back:

1. `.agents/skills/spec/SKILL.md` states "A spec without provenance is an
   opinion, not evidence." That is a strong incentive to add, with no
   counterweight.
2. `specs/TEMPLATE.md` describes provenance as a category list — v18 file,
   immutable commit, approved spec, or human decision — but says nothing about
   an entry's shape or length. Its "well under 300 lines" bound reads as being
   about the spec body; the frontmatter is unbounded.
3. The worked examples disagree with each other. An agent that opens
   `iconography` to learn the format finds 442 words and matches it; one that
   opens `design-tokens` finds no provenance at all. There is no norm to copy,
   so whichever file gets read becomes the norm.

Alternative explanation considered: simple agent verbosity, independent of the
harness. Partly true — but the near-identical 456/442 word counts against a
shared template suggest imitation of the nearest exemplar rather than
free-running prose. That is a harness-shaped failure, and it will recur for every
new spec.

**Possible change.** Smallest useful change, in `specs/TEMPLATE.md` beside the
provenance key: one entry is one line naming a source — a path, an immutable
commit, or a dated decision — with at most a clause of context, and the block
stays short enough to scan. Say explicitly that rationale belongs in the body and
that framework, file-layout and sequencing detail belongs in the plan, mirroring
the wording already in the template's comment. Optionally trim `iconography` so
the exemplar stops teaching the wrong shape.

**Disposition.** Proposed. The offending spec is committed as-is and still
carries the defect, so the owner can see it before deciding. Raised by the human
owner 2026-07-30.

## 3. Agent phrasing recorded as dated human decisions

**Evidence.** Five entries in the same provenance block are worded as
"Human decision 2026-07-30: …" followed by a paragraph of reasoning the agent
composed. What the owner actually did was select options from multiple-choice
questions the agent wrote — including the justifications inside those options.
The spec now presents that reasoning as the owner's own recorded decree.

The underlying decisions are real and were genuinely approved. The defect is
attribution: a later reader cannot tell which words are the owner's and which are
the agent's reconstruction, in the one field the practice designates as evidence.

**Assessment.** Valid, and more consequential than the length problem. Provenance
exists so claims can be traced to authority; provenance that launders agent
reasoning into human authority defeats the mechanism it implements, and does so
invisibly. It is also self-reinforcing, because the next spec cites the previous
one as an approved source.

Related harness contribution: because `AskUserQuestion` presents agent-authored
options and returns only the selected label, the agent holds a record of the
choice but not of the owner's reasoning — and the gap is easy to fill with its
own.

**Possible change.** Record what was actually decided and by which mechanism:
name the choice the owner made and keep the agent's rationale in the body or the
plan, or mark an entry as agent-proposed and human-accepted rather than as a
human decision. Do not attribute composed reasoning to a person.

**Disposition.** Proposed. Not applied to the spec.

## 4. Only a human noticed the spec had bloated — the review gate cannot

**Evidence.** The bloat was found by the owner reading the file, in three
separate reactions: the provenance block ("insane and idiotic"), the Intent
section ("overtly long, and contains some 'before this and that' babble"), and
finally the whole file ("171 lines — for a spec that defines intent for
[temporary] ds navigation, that sounds like absolute overkill").

A fourth reaction followed the first rewrite, to an opening the agent had just
written as a replacement for bloat: "The books are how approved visual intent
reaches the people building Pelilauta. This capability makes that body of work
navigable, and cheap to extend." — "I have no clue what this is meant to mean, or
why would anyone write such a sentence to a spec?" Shortening the text did not
stop it being grandiose; abstraction survived the cut and had to be named
separately.

Nothing in the harness flagged any of it. Commitlint, Biome, `pnpm verify` and
eight Playwright tests all passed. So did the mandatory adversarial spec review,
which is the gate that exists specifically to catch spec defects.

Worse, that review made the file bigger. Its five axes led to a new Review
section, two extra Definition-of-Done lines, two extra guardrails and two extra
tests. Every finding it produced was an addition.

**Assessment.** Valid, and it identifies a structural gap rather than a lapse.
The review's five axes — ambiguity, testability, edge cases, compatibility,
scope — all ask whether the spec says enough, precisely enough. None asks whether
any sentence has earned its place, and the Scope axis as written looks for
requirements that belong elsewhere, not for volume. The gate is therefore
monotonically additive: a spec can pass its own quality review while becoming
unreadable, and every pass makes that more likely.

Nothing ties a spec's weight to what it governs, either. This navigation is
temporary documentation chrome, and it received a heavier treatment than
`design-tokens`, which governs the whole application's visual contract in 78
lines. Proportionality was never considered because nothing asks for it.

Also worth noting: detection needed three separate human observations because the
bloat was distributed — frontmatter, then one section, then the total. One
proportionality question would have surfaced all three at once.

**Possible change.** Add a final axis to the adversarial review in
`.agents/skills/spec/SKILL.md` — subtraction and proportionality: what can be
deleted without losing a checkable claim, and is the spec's weight proportionate
to the capability's significance and expected lifetime? Run it last, after the
additive axes, so it prunes what they grew. A concrete anchor helps: compare
against the leanest existing spec rather than the nearest one.

The fourth reaction suggests a second, cheaper test that catches what a length
bound does not — for each sentence, could a reader act differently because it is
there? A sentence naming what the capability does, who for, or what must hold
passes. A sentence characterising the value of the work does not, at any length.

## 5. The Intent never defined its subject or named its readers

**Evidence.** After four rewrites the owner supplied the intent directly, and it
was structurally different from every version the agent produced:

> The design system is documented as "books", MDX pages that define a single
> design aspect, principle, component or pattern. These books are part of the
> [package], and they are served via apps/design to human and agent readers.
>
> The Design Site Navigation provides a temporary navigation feature for
> apps/design, so that a user or an agent can easily locate a book of the
> [package].

Three things it has that no agent version had:

1. **It defines "book" before using it.** The agent's spec used the word fourteen
   times without ever saying what one is.
2. **It names the readers, and they include agents.** Every agent draft addressed
   "the people building Pelilauta" — in a repository whose own delivery model is
   agent-driven, and whose books agents read.
3. **It says the feature is temporary.**

**Assessment.** Valid, and each of the three has a distinct cause worth separating.

*Defining the subject.* The agent held the whole domain in session context and
wrote for a reader who shared it. A spec is read without that context — by a
person months later, or by an agent with only the file. Nouns therefore have to
be established before they are used, and "books" never was.

*Naming the readers.* This is the sharpest miss, because the omission had
consequences beyond wording: with only human readers in view, the spec's
accessibility claims were about keyboards and assistive technology, and nothing
addressed a reader that runs no scripts. Once agents were named as readers, a real
and checkable behavior appeared immediately — the navigation must be complete in
the served markup. The wrong audience produced an incomplete contract, not merely
vague prose.

*Stating that it is temporary.* The agent had this fact. The owner had written
"[temporary] ds navigation" one message earlier. It was used only as a reason to
shorten the document, and never recorded as something the spec says. A fact about
the capability was consumed as a meta-instruction about formatting.

Contributing harness shape: `specs/TEMPLATE.md` prompts Intent with "Why this
capability exists and what users and consumers can rely on... state the problem,
not the solution mechanics." That asks for motivation, which invites either
before-and-after narration or value claims — the two failure modes that actually
occurred, in that order. Nothing in the prompt asks the author to define the
capability's domain objects, name its consumers concretely, or state its expected
lifetime. "Consumers" appears, but as an abstraction that a human-only reading
satisfies.

Alternative explanation considered: the agent simply wrote badly and the template
is fine. Rejected on the pattern — four successive rewrites all missed the same
three elements while fixing whatever had just been criticised. Local repair under
feedback is not the same as re-deriving what a section is supposed to contain, and
the agent never once asked what a book is or who reads one.

**Possible change.** In `specs/TEMPLATE.md`, replace the Intent prompt's request
for motivation with three concrete requirements: define the domain objects the
spec will refer to, name the consumers by kind — including agents where they are
consumers — and state the expected lifetime when the capability is temporary or
transitional. Motivation then follows from those instead of standing in for them.

**Disposition.** Proposed. The owner's wording is adopted in the spec, with the
paths corrected to `apps/design` and `packages/design-system`. Raised by the human
owner 2026-07-30. See candidate 6 for the likely root cause.

## 6. The local template renamed Blueprint to Intent and dropped two thirds of it

**Evidence.** `AGENTS.md` states that spec conventions "follow the practices
published at ASDLC.io, adapted to this repository". The owner asked whether the
published practice says `## Blueprint` rather than `## Intent`. It does.

`asdlc-io/src/content/patterns/the-spec.md` defines the anatomy as **Blueprint +
Contract**, and Blueprint has three parts:

- **Context** — why does this feature exist?
- **Architecture** — API contracts, schemas, dependency directions
- **Constraints** — boundaries stated positively, as facts about how the system
  behaves

Across `asdlc-io/specs/*/spec.md` the dominant heading set is
`## Blueprint` + `## Contract` (+ optional Implementation Notes, Resources); a few
older specs use `## Context` + `## Architecture`. **No asdlc.io spec uses
`## Intent`.**

`pelilauta-social/specs/TEMPLATE.md` uses `## Intent`, and prompts it with "Why
this capability exists and what users and consumers can rely on... state the
problem, not the solution mechanics."

**Assessment.** Valid, and this is probably the root cause of candidate 5 rather
than a separate issue.

The adaptation kept Blueprint's softest third — Context, the "why" — promoted it
to the section's name, and dropped the two parts that force concreteness.
Architecture is what would have made the agent state what a book is and where
books live. Constraints is what would have made it state boundaries as facts. With
both gone, the section's only instruction was to explain why the feature exists,
and "state the problem, not the solution mechanics" actively discourages the
concrete description that Architecture asked for.

So the section name and prompt selected for the failure. "Intent" invites a
statement of motivation; "Blueprint" invites a description of the thing being
built. Four rewrites produced four flavours of motivation because that is what the
heading asked for, and the owner's replacement text is, structurally, a Blueprint:
domain objects, where they live, who consumes them, what this feature is.

**Provenance of the divergence.** It is neither drift nor a considered
adaptation. Per the owner, it is the residue of an over-correction: an agent was
criticised for forcing code-level contract detail into blueprints, and answered by
rewriting the template — removing the concrete parts wholesale rather than the
misuse of them.

`git log --follow specs/TEMPLATE.md` shows the file has two commits, and the
originating one is `140720c` "docs: consolidate ASDLC spec conventions"
(2026-07-20). Its own message states it added "the Intent + Contract anatomy",
required provenance frontmatter, and gated draft-to-approved behind the
adversarial review — and its `docs/lessons/feat-cn-icon.md` entry records the
decision as "align spec conventions with the ASDLC.io Living Specs practice".

Two things follow. The commit claimed alignment with the published practice while
introducing the divergence from it, so the local template's authority is weaker
than it looks. And **all three template-shaped findings in this file trace to that
single commit** — provenance-as-dumping-ground (candidate 2), the additive-only
review gate (candidate 4), and Intent-instead-of-Blueprint (candidates 5 and 6).
They are not three independent defects; they are one change's blast radius,
surfaced ten days later by a human reading a spec.

**Possible change.** The narrow fix is to the prompt, not the anatomy: whatever
the heading is called, it must ask for the domain objects and the boundaries, not
motivation alone. Restoring `## Blueprint` with Context, Architecture and
Constraints matches the published practice; keeping `## Intent` and restoring the
two missing prompts beneath it is cheaper and leaves the four existing specs
valid.

Explicitly **not** recommended: another sweeping template rewrite. See candidate 7
— this file's first draft of this candidate proposed exactly that, which would have
repeated the failure it describes.

**Disposition.** Proposed. The owner chose to log rather than change the template,
which on this evidence is the safer call. Raised by the human owner 2026-07-30.

## 7. Narrow criticism answered with a sweeping harness rewrite

**Evidence.** Two instances, one historical and one in this file.

The historical one is candidate 6's cause. The criticism was specific — an agent
was forcing code-level contract detail into blueprints. The response was
`140720c`, which introduced a whole template, made provenance frontmatter
mandatory, added the adversarial review gate, and deleted a 223-line nested
`AGENTS.md`, in one commit, explicitly "before starting cn-icon implementation" —
so with no spec to verify any of it against. Ten days later that single change
had produced three distinct defects, each found by a human reading prose rather
than by any gate.

The second instance is this file. Drafting candidate 6, I proposed rewriting
`specs/TEMPLATE.md` — restoring `## Blueprint` with three subsections and
re-heading four existing specs — as the fix for a bad prompt. That is the same
move that caused the problem: a broad structural rewrite in response to a narrow
observation. The owner chose "log only", which stopped it.

**Assessment.** Valid, repeated, and the most consequential pattern in this file,
because it is the mechanism by which agent-driven harness evolution degrades
rather than compounds.

The failure has a recognisable shape. A specific criticism arrives. The narrow fix
would be to change the offending sentence, prompt, or usage. Instead the agent
generalises the criticism into a principle, then restructures whatever artifact
embodies that principle — which is more satisfying to produce, reads as thorough,
and passes review because reviewers check whether the new structure is coherent,
not whether it was warranted. The damage does not appear at review time; it
appears when the next author works inside the changed structure, by which point
the connection to the original criticism is lost.

`AGENTS.md` already contains the rule that would have prevented both instances:
"Evolve factory, harness, and architecture inside the production slice that first
establishes and verifies their concrete need", plus "Consumer-free foundation work
requires explicit human approval and a timebox." `140720c` was consumer-free
foundation work by its own description. The rule exists; the trigger for applying
it was not recognised — the same failure mode as candidate 1, where an
outdated-dependency rule was present in required context and not applied because
the symptom did not announce itself as that category.

The lessons practice also already says a candidate may be discarded, and that "if
assessment shows that nothing should change, discard the candidate instead of
inventing a policy, guide, check, or follow-up task." Both instances invented a
structure instead.

**Possible change.** When a criticism concerns an artifact the harness generates,
fix the instance first and record the general case as a candidate. Changing the
generator — template, skill, practice guide — is a separate decision with its own
approval, and it needs a consumer: the next spec actually written through the
changed template, not a rewrite of the template in the abstract. Removing a
section is never the fix for that section being misused.

Sharper heuristic, since both instances passed the rules already written: the
signal to watch is not the size of the change but the ratio between what was
criticised and what got rewritten. One sentence criticised, one template rewritten,
is the shape.

**Disposition.** Proposed. Raised by the human owner 2026-07-30, who supplied the
history behind candidate 6.
