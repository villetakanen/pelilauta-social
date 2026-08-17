# A conflict between Living Specs' explicitness rules and the hypothesis framing

To the ASDLC.io maintainers, from the pelilauta.social project — a small production
web application rebuilt with agents, using your patterns: living specs under
`specs/{domain}/{capability}/spec.md`, adversarial review as a gate, an agent
constitution. This note reports a conflict we hit between two of your pages, how it
misled our agent in practice, and a resolution we now run on. We offer it as field
evidence.

## The conflict

[The Spec](https://asdlc.io/patterns/the-spec) frames a spec as a hypothesis:
"Implementation doesn't invalidate a spec. Implementation completes it." The same
page rejects spec-as-source as a regression to Model-Driven Development.

[Living Specs](https://asdlc.io/practices/living-specs), under *Writing for Agents*,
requires the Blueprint to carry API contracts with specific signatures, data models
by file path, and dependency directions — and *Spec Review as Gate* checks this
before implementation begins.

These pull against each other. A spec that pre-decides signatures, file layout and
dependency structure before the first line of code is a model the code renders, and
the search for the optimal implementation — the space the hypothesis framing
promises — is closed before it opens. The second diamond has nothing left to
develop.

The conflict has a second-order cost you already document as an anti-pattern. The
more implementation detail a spec carries, the more commits must touch it, and the
faster it goes stale. The Stale Spec is partly inflicted by the explicitness rule,
and the same-commit rule then patches a wound the guide itself opened. A spec that
carries only its contract rarely needs the patch.

## How the guide misled our agent

We ran an experiment: our agent built a spec-review skill from your online pages
alone, then compared it against the review skill our project evolved in the field.

Reading *Writing for Agents* literally — "Be explicit about constraints. Agents
don't infer." and "Use file paths, not descriptions" — the agent adopted
explicitness as a review-gate requirement. It then judged a healthy contract-level
spec incomplete for lacking signatures and internal file paths, and recommended
adding implementation detail before implementation. The overreach surfaced only when
we re-tested the analysis against the agile principles the pattern page itself
stands on.

The general failure is worth stating: an agent is a literal consumer of a practice
guide. A rule published without its boundary gets applied without its boundary.

## The resolution we now run on

The distinction the guide is missing sits inside the word "visible". A function
signature is visible in code; whether that signature is a *promise* is not. Code
shows what the system does today. It cannot show which parts are contract — relied
on by others, required to survive change — and which are the current answer, free to
be searched again. That is what the spec carries.

So: **explicit about the contract, silent about the how.** "Agents don't infer"
justifies explicit contracts; it does not justify pre-decided designs. Our
Architecture section now asks one question — what would a reader of the code get
backwards? — and carries only those inversions: dependency directions, structural
choices no single file reveals, the promised public surface. Everything else is the
implementation's to find.

This also gives the refinement cycle two speeds. The Blueprint is the hypothesis:
implementation completes it, and discoveries flow back freely. The Contract hardens
once consumers rely on it, and changes only as a decision.

## What might help

- Scope the *Writing for Agents* explicitness rules to the Contract and to promised
  surface, and say so on the page.
- State the boundary next to the rule: signatures and paths belong in the spec where
  they are promises, in the code where they are answers.
- Name the connection between the explicitness rules and the Stale Spec
  anti-pattern; the fix for one is the fix for the other.
- Split the hypothesis framing by speed: Blueprint as hypothesis, Contract as
  commitment.

We are happy to share the underlying analyses and the review instruments they
produced.

— Ville Takanen, pelilauta.social
