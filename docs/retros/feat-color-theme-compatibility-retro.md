# feat/color-theme-compatibility Retrospective

Status: Complete; approved for `v21.0.0-beta.1`

## Loop Summary

This loop delivered the first user-visible v21 product improvement. Pelilauta
now uses the established v20 Light and Dark color themes while the imported
Cyan 4 application and components continue to work through a bounded
compatibility layer. The same delivery publishes the color intent and contract
as a package-owned book in the design application.

The outcome was reviewed, approved, and verified by the owner on 2026-07-19,
then released as `v21.0.0-beta.1`. This is the first design-system migration.
It migrates the token and theme capability rather than a Lit component.

## Outcome

| Goal | Result |
| --- | --- |
| Deliver a visible production improvement | Pelilauta uses the approved v20-derived Light and Dark themes |
| Preserve v18 behavior outside the approved visual change | Routes, interactions, authentication, data, and theme selection are unchanged |
| Keep legacy consumers working | Production-used Cyan 4 color properties resolve through the local compatibility layer |
| Integrate design-system documentation | `/tokens/color` demonstrates both modes, references, semantics, and compatibility mappings |
| Verify the bounded contract | Unit, build, static contract, and browser checks cover both applications and both modes |
| Complete human acceptance | Preview appearance, mappings, interaction states, and browser behavior were approved |

## What Worked

- The loop named a visible Pelilauta outcome and integrated it before expanding
  design-system foundations.
- Static CSS remained the canonical web implementation because there is no
  approved non-web consumer.
- The compatibility layer preserved old consumer names without preserving the
  old palette or changing unrelated Cyan functionality.
- The design-system book reads the committed CSS, avoiding a second token data
  source.
- Contract tests and focused browser tests made the visual migration reviewable
  without pretending to replace human acceptance.
- Small commits kept planning, production integration, tests, documentation,
  and generated-output cleanup independently reviewable.
- A root-owned release version, merge commit, deploy preview, and annotated tag
  made the first v21 release identifiable without changing the imported app's
  package version.

## What Could Improve

- `plans/color-theme-compatibility/spec.md` mixed product intent, compatibility
  rules, architecture, task status, and acceptance evidence. Its `spec.md` name
  made the repository artifact model harder to understand.
- The root README did not identify the imported baseline, active delivery, open
  gates, or release state.
- Release identity was absent at the workspace root while the imported
  application correctly retained its legacy `18.13.3` package version.
- The superseded core-token branch and open PR can be mistaken for current
  direction unless they are explicitly closed.
- The browser check described the footer icon as an inheritance probe even
  though that icon has an inline color. It did not prove that an unstyled
  `cn-icon` inherits contextual foreground color.
- The compatibility inventory verified that consumed properties resolved, but
  did not verify the effect of defining a formerly absent property. Mapping
  global `--color-on` to a surface color disabled `cn-icon`'s `currentColor`
  fallback and broke contextual icon colors.
- Release verification was repeatable only from session history. The project
  had no release runbook or small workflow aid.
- The imported app still owned Lefthook installation even though releases and
  Git history are owned by the workspace root. A frozen install recreated an
  unwanted example root configuration.
- Retrospective writebacks were proposed without a durable accept, defer, or
  reject step, making it too easy to turn every finding into immediate scope.

## Writebacks

- Durable design-token intent now lives in
  `specs/design-system/design-tokens/spec.md` and contains why and what, not
  implementation design.
- The detailed color-theme artifact is retained as
  `plans/color-theme-compatibility.md`, a delivery and compatibility record.
- The root README provides the current project and release position.
- The root package owns the v21 release version; imported application versions
  remain evidence of their baseline.
- The superseded core-token PR is closed. Its useful evidence remains available
  without presenting the stopped foundation as current direction.

## Compound Decisions

| Finding | Decision | Follow-up |
| --- | --- | --- |
| Pull-request CI could repeat local checks | Reject for now | Reconsider only after a concrete failure shows local and deploy-preview gates are insufficient |
| Root verification commands are incomplete | Defer except tests | Add one root test dispatcher and a root pre-push test hook in the next production iteration |
| Lefthook ownership is nested under the imported app | Accept | Move installation, configuration, and commit-message tooling to the workspace root |
| Release steps exist only in session history | Accept | Add a rudimentary root release runbook and release skill |
| Authenticated-write compatibility remains unaccepted | Defer | Do not pull it into the next design-system migration |
| The theme was treated as preparation rather than migration | Correct | Record tokens and themes as the first design-system migration |
| Retro findings can expand scope automatically | Accept | Add a small retro/compound practice and skill with explicit human decisions |
| Spec purpose and location were unclear | Accept | Add a rudimentary intent-spec skill anchored under `specs/` |
| Contextual icon colors regressed | Accept as next product work | Restore legacy inheritance and migrate the first local icon consumers in the `cn-icon` iteration |

No broader root `check`, workspace build orchestration, CI, authenticated-write
work, or generic token infrastructure is authorized by this retrospective.

## Close Decision

The color-theme compatibility loop is complete and approved for
`v21.0.0-beta.1`. It proves that v21 can ship a production-integrated
design-system improvement while preserving legacy consumers.

The next delivery addresses `cn-icon`, because the theme compatibility layer
exposed a real contextual-color regression. It should first restore inherited
color for existing icons, then migrate a bounded public set to the local icon
capability and demonstrate the same intent in Pelilauta and the design-system
book. The iteration may add one root test dispatcher and pre-push test hook.
Everything else in the deferred harness backlog remains outside its scope.
