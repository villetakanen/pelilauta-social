# feat/color-theme-compatibility Retrospective

Status: Complete; approved for `v21.0.0-beta.1`

## Loop Summary

This loop delivered the first user-visible v21 product improvement. Pelilauta
now uses the established v20 Light and Dark color themes while the imported
Cyan 4 application and components continue to work through a bounded
compatibility layer. The same delivery publishes the color intent and contract
as a package-owned book in the design application.

The outcome was reviewed, approved, and verified by the owner on 2026-07-19.
It is suitable for the first v21 beta release. This is a theme-contract
migration; Lit-to-Svelte component migration has not started.

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

## Writebacks

- Durable design-token intent now lives in
  `specs/design-system/design-tokens/spec.md` and contains why and what, not
  implementation design.
- The detailed color-theme artifact is retained as
  `plans/color-theme-compatibility.md`, a delivery and compatibility record.
- The root README provides the current project and release position.
- The root package owns the v21 release version; imported application versions
  remain evidence of their baseline.

## Close Decision

The color-theme compatibility loop is complete and approved for
`v21.0.0-beta.1`. It proves that v21 can ship a production-integrated
design-system improvement while preserving legacy consumers.

The next delivery should select one bounded Lit surface, document that
component's intent and v18 compatibility, replace it with a local Svelte
component, and demonstrate the result in both Pelilauta and the design-system
book. Broader token infrastructure is not a prerequisite.
