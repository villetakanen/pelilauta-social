# Spec Review Changes

How the `spec-review` skill will change, and why. Continues
`2026-08-14-spec-harness.md`; the changes here land one instrument per changeset,
each observed on a real review before the next.

## The evidence behind the changes

Two experiments on 2026-08-15:

1. A naive spec-review skill was built from the ASDLC.io online pages alone
   (`patterns/the-spec`, `practices/living-specs`,
   `practices/adversarial-requirement-review`) and compared against the local
   skill. The two fail in opposite directions: the naive skill demands presence and
   barely polices excess; the local skill polices excess exhaustively and, until the
   Context gate (e1b3a82), demanded presence of nothing. A review that only
   subtracts and disambiguates approves a spec that is precise, minimal, consistent
   — and empty where it matters. That is the altitude inversion of finding 1, seen
   from the instrument side.
2. The comparison was re-scored under the agile principles the owner holds: the
   spec anchors what code cannot show. This withdrew part of the naive skill's
   advantage as ASDLC overreach — see below — and sharpened the rest. The conflict
   found in ASDLC's own material is reported upstream in
   `docs/outgoing/2026-08-15-note-to-asdlc-on-living-specs.md`.

## The principle the changes serve

A signature is visible in code; whether it is a promise is not. The spec carries
the contract — the promised surface, the invariants, the need it serves — and stays
silent about the how, which belongs to implementation and discovery. Explicit about
the promise, silent about the how.

The refinement cycle runs at two speeds. The Blueprint is a hypothesis:
implementation completes it, and discoveries flow back in the same changeset. The
Contract hardens once consumers rely on it, and changes only as a decision.

## Withdrawn — recorded so it does not return

ASDLC's blanket explicitness rules ("use file paths, not descriptions"; Architecture
carrying signatures and dependency inventories, gated before implementation) are not
imported. Pre-deciding the how closes the search space the hypothesis framing
promises, and every implementation detail in a spec is a future stale line. The
local Architecture question — what would a reader of the code get backwards? — is
the stronger form and stands. A path enters a spec where the path is the promise: a
component's public identity, a shared token, an endpoint.

## Planned changes, in landing order

Each is one changeset. The next lands only after the previous has been observed on a
real spec review.

1. **Context gate** — landed, e1b3a82 (2026-08-14). The Premise challenge tests
   that Context carries the need — the paste test — and a missing why blocks.
   Observation pending: the next real review is the first data point.
2. **Contract completeness.** The review blocks when the Contract cannot anchor a
   verification plan: no observable Definition of Done, no guardrail invariants, or
   scenarios a critic cannot verify. Presence of contract, not presence of detail —
   the naive skill's completeness demand, cut down to the promise.
3. **Size and split trigger.** One spec covers one independently evolvable
   capability; growth past the point where a reviewer can hold it argues a split.
   Targets the 200–500-line slop specs directly.
4. **Staleness check.** The review compares the Contract against the current
   implementation, not only against v18/v20 sources. Under the principle above this
   is cheap and meaningful: a stale contract is a broken promise, a defect.
5. **Two-speed refinement.** Blueprint discoveries update the spec in the changeset
   that made them, the pull request's approval approving the diff; Contract changes
   are decisions. Touches the `spec` skill and the draft/approved state machine, so
   it carries an owner decision about what a Blueprint-only edit does to `approved`
   status.
6. **Positive-constraint form.** Constraints state facts the system follows; a
   failure mode goes in a Scenario, not a warning.
7. **Premise interview** — open, finding 6 of the spec-harness report. Whether a
   capability with no v18/v20 ancestor routes through a problem-sharpening interview
   with the human before its spec is written. Owner decides.

## Why this order

2 attacks the same inversion as the landed Context gate from the opposite end —
presence of the promise — and is the strongest remaining lever. 3 and 4 attack the
two failures the owner has named from field experience: unparseable specs and
misleading ones. 5 changes process rather than a checklist and needs the state-machine
decision first. 6 is hygiene. 7 waits on its decision.
