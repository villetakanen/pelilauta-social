# Epic 165 Scope Proposals

The [audit](reports/2026-10-02-epic-165-audit.md) supplies the evidence. These proposals amend [epic #165](https://github.com/villetakanen/pelilauta-social/issues/165) only after individual operator acceptance. Each proposal records its status below. The accepted S1 amendment updates the replies spec. `docs/EPIC_TEMPLATE.md` governs the issue body.

## E1: State the remaining goal against the baseline

**Status:** Accepted, applied to GitHub issue #165, and verified.

Replace `Goal` with:

```markdown
## Goal

Complete the existing thread-reading path so anonymous readers receive the
opening post, replies, and public attribution in the initial HTML, without
browser data fetching or live subscriptions. Active authenticated sessions
enhance that same conversation with live updates. Preserve the existing
thread interface and authoring behavior while correcting the SSR and
subscription boundaries that prevent this outcome.
```

Add this baseline paragraph under `Evidence`:

```markdown
Before #165 implementation, the server already fetched the discussion and
the application already supplied reply presentation, reply IDs, authoring,
reactions, and a Firestore query ordered by creation time. The discussion
mounted with `client:only`, attribution depended on browser profile stores,
and the live listener lacked an active-session guard and cleanup. These gaps
define the starting work; the surrounding capability does not need rebuilding.
```

This makes the operator's intended correction explicit without reducing the target to a fixed number of lines.

## E2: Align completion with the remaining correction

**Status:** Accepted, applied to GitHub issue #165, and verified.

Replace `Success criteria` with:

```markdown
## Success criteria

- Anonymous readers receive the opening post, replies, public attribution,
  attachments, and reply destinations as readable initial HTML with
  JavaScript disabled.
- Anonymous and unresolved sessions establish no thread-reading Firebase
  subscriptions or browser profile and reaction reads.
- An active authenticated session starts live reply updates; sign-out,
  account changes, and page departure release the previous listener.
- The transition from server content to live updates preserves existing
  reply content and attribution and keeps the order supplied by the query.
- Existing authoring, editing, deletion, reactions, and public addresses
  retain their established behavior.
```

The operator accepted removing structured metadata, expanded date presentation, and additional read-state semantics as completion requirements for the immediate correction. Their live-spec promises remain recorded and are not declared satisfied. E4 reconciles their disposition.

## E3: Prevent implementation from recreating dependencies

**Status:** Accepted, applied to GitHub issue #165, and verified, including the operator's Markdown-rendering exclusion.

Append these entries to `Guardrails`:

```markdown
- Reuse the existing thread presentation and rendering paths. New helpers,
  state machines, and abstractions require a missing application behavior.
- Use Firestore query ordering, native fragment navigation, framework
  lifecycle cleanup, and the established design-system components where
  they already supply the required behavior.
- Verify added or changed application scenarios with concise tests. Avoid
  duplicate coverage and tests of behavior supplied entirely by dependencies.
- Preserve the existing Markdown renderer and its output behavior.
```

Add `Markdown rendering, sanitization, and renderer refactoring.` to `Out of scope`. Reuse the renderer as it exists; its defects and changes do not belong to this correction.

Replace the non-binding candidate list with:

```markdown
## Possible work (non-binding)

- Render the existing discussion and public attribution in the initial
  document, with authenticated enhancement following the same content path.
- Correct active-session guards and listener cleanup across the thread's
  reply, attribution, and reaction consumers.
```

The current candidate list can be read as a request for new reconciliation, navigation, and preparation subsystems. The replacement names the two observed gaps and leaves implementation choices to the source review.

## E4: Resolve the boundary before restarting implementation

**Status:** The anonymous-JavaScript boundary and explicit deferral of metadata, expanded dates, and new read-state semantics are accepted, applied to GitHub issue #165, and verified.

The accepted guardrail reads:

```markdown
- Anonymous readers receive server-rendered reply content without
  application-level browser data reads or live subscriptions. Preserve
  existing design-system component behavior; changing their JavaScript or
  hydration is outside this epic. Changes to shared layout, navigation,
  and unrelated client islands are outside this epic.
```

`Out of scope` also excludes shared layout, navigation, and unrelated client-island changes. This epic does not claim near-zero JavaScript for the entire page.

The accepted deferral under `Specifications` reads:

```markdown
Metadata, expanded date presentation, and new read-state semantics remain
recorded in these specs for later work. They are deferred from #165 and are
not completion requirements for this correction. Preserve existing behavior
in those areas.
```

`Out of scope` names discussion structured metadata, expanded publication, edit, and activity date presentation, and new read-state and unread-navigation semantics. The authorization guardrail now names subscription lifecycle instead of new read-status outcomes. The live specs retain the deferred commitments; this amendment neither satisfies nor removes them.

The shared layout already ships authentication, navigation, and other client islands. A subscription guard alone does not deliver a site-wide static baseline. Do not quietly weaken that goal or add a layout rewrite under this epic.

After the decisions, reconcile the three thread-reading specs through the existing amendment procedure. Preserve accepted data policies, including the decision about undated replies, unless the operator changes them. Report intentional implementation gaps while the restart remains incomplete. Do not change spec status merely to make the restored baseline appear complete.

## S1: Preserve design-system behavior

**Status:** Accepted and applied to the replies spec and the epic guardrail.

The operator clarified that design-system components can retain their existing client rendering and hydration. The anonymous boundary restricts application data reads and subscriptions. The replies spec retains `live` status. The earlier blanket prohibition on reply hydration is withdrawn.

## S2: Remove prescribed viewport anchoring

**Status:** Accepted and applied to the replies spec, retaining `live` status.

Remove the replies spec's next-or-previous viewport-anchor selection and empty-discussion anchor requirements, including their scenario assertions. Retain focus restoration when a focused reply disappears and the existing prohibition on overriding browser scroll behavior. The prescribed anchor algorithm invites the browser-behavior reimplementation identified in the audit.

## S3: Govern progressive enhancement in architecture

**Status:** Accepted and applied to `docs/ARCHITECTURE.md` and the replies spec, retaining `live` status.

The architecture now governs preservation of server-rendered content and native interactions when client enhancement activates. The redundant identical-formatting guardrail is removed from the replies spec. The epic retains the Markdown scope exclusion.

## S4: Keep the design-system scope exclusion in the epic

**Status:** Accepted and applied to the replies spec, retaining `live` status. The epic exclusion remains unchanged.

Remove the sentence beginning `Preserve existing design-system component behavior` from the replies spec. The epic already carries this scope exclusion. The spec continues to require server-rendered content without anonymous application data reads or subscriptions and references the governing design-system specs.

## S5: Remove redundant enhancement and reconciliation instructions

**Status:** Accepted and applied to the replies spec, retaining `live` status.

Delete `Hydration preserves initial articles. Live updates reconcile by reply key without replacing unaffected articles or replaying navigation.` without replacement. Architecture governs enhancement activation, and the read-state spec governs navigation. Focus restoration after deletion remains unchanged.

## S6: Correct the stale timestamp-fallback reference

**Status:** Accepted and applied to the read-state spec, retaining `live` status.

The sentence now reads `Unread targeting uses reply creation time.` The stale fallback reference is removed. The deferred read-state scope and accepted data policy remain unchanged.

## Amendment queue status

E1–E4 and S1–S6 are applied. No further amendment is queued. Remaining harness findings stay in lessons for later collation. Implementation has not restarted.

## Restart boundary

The operator authorized removal of the #165 implementation and test expansion on the active release branch. The recovery uses `a84aa111` as the behavioral baseline and retains the accepted move of thread server components into `src/threads/server`. It also retains the independent anonymous-label correction and its two existing locale assertions.

Preserve the release version, post-release documentation, legacy-component guidance, current specs, and harness files. The harness and epic proposal queues remain pending. Remove #165 changelog claims for reverted behavior. Keep the audit and the pre-existing delivery self-assessment as evidence.

This recovery is preparation for a bounded restart, not a deployable completion of #165. It restores the original anonymous-subscription and client-only discussion gaps deliberately. Do not merge or deploy that intermediate state as the epic's solution. No branch change, history rewrite, fixture reset, commit, or push is included.

## Recovery result

The authorized removal is complete in the working tree. The recovery changes 49 tracked files relative to `f195461a`, with 179 insertions and 3,627 deletions, for a net removal of 3,448 lines. These counts exclude the new report and proposal documents.

The application diff against `a84aa111` now contains only the four component moves, their import adjustments, the Finnish and English anonymous-label correction, and its two locale assertions. All #165 browser additions and their fixture expansion are removed. The existing onboarding regression remains configured. The release version and unrelated release documentation remain intact, and the changelog no longer claims the reverted behavior.

The three live specs, harness files, GitHub epic, branch, and commit history remain unchanged. The restoration intentionally diverges from the thread specs' SSR, anonymous-subscription, navigation, metadata, and lifecycle outcomes. E1–E4 govern the pending scope discussion; they are not applied spec amendments.

Verification passed:

- `pnpm test` passed 873 tests across 78 files, including 491 application tests.
- `pnpm --filter pelilauta exec astro check` reported zero errors, zero warnings, and one existing deprecation hint.
- `pnpm lint` passed with four warnings in untouched files.
- `git diff --check` passed.
- The proposal and report files passed the `docs/WRITING.md` word-list checks.

No browser suite, release UAT, or fixture reset ran. The recovery adds no browser behavior; source comparison verifies the restored behavior and type checking verifies the retained component wiring. The original application gaps remain for the next implementation after scope clearance.
