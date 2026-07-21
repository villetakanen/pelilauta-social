# cn-icon — Adversarial Review Notes

> Holistic review of `feat/cn-icon` for hand-off to delivery agents.
> Reviewer: adversarial pass over the full PR (diff vs `main`), the delivery
> self-declaration, and a second external review agent's report.
> Scope note: findings are ordered by severity. Each carries evidence and a
> recommended action. "Blocker" = should not merge/release until resolved.

---

## Framing correction (read first)

`Drop-in v18 compatibility`, as clarified by the product owner, means **behavioral /
business-logic parity so v18 and v21 can run side by side** — *not* deploy /
infrastructure robustness. The icon migration is a presentational Cyan-4 reset and
does **not** change app or business logic, so on the compatibility rule proper this
slice is clean. Deploy-resilience concerns below are tracked on their own merits
(build robustness, delivery-process rules), not as compat violations.

---

## BLOCKER 1 — Build hard-fails if the proprietary package is absent

**Where:** `packages/design-system/components/Icon.svelte:17`
```ts
import { getIcon as getManagedIcon } from "@myrrys/proprietary";
```
The alias resolves `@myrrys/proprietary` to a concrete file **inside the submodule**:
`packages/myrrys-proprietary/index.ts` (`apps/pelilauta/astro.config.mjs:20-21`,
`apps/pelilauta/tsconfig.json:18`).

**Problem:** This is an *unconditional, top-level static import*. If Myrrys revokes
access (or the submodule is otherwise unavailable), `index.ts` does not exist →
Vite cannot resolve the import → `astro check` / `astro build` **fail at compile
time**. This fires for **every** page that renders `Icon`, including pages that use
only community or fallback icons. There is no code path where the build succeeds
without the proprietary package. A second, redundant hard-fail exists in
`apps/pelilauta/scripts/sync-proprietary-assets.mjs:35-40` (`process.exit(1)`), but
the static import dooms the build first.

**Why it matters:** The architecture bakes in "no proprietary access ⇒ no site."
The runtime tier logic *already* degrades gracefully
(`Icon.svelte:28` → fallback → missing glyph); the **only** thing converting graceful
degradation into total build failure is that the managed tier is wired as a
compile-time file dependency instead of an optional one.

**Status today:** Not on fire. The pinned commit `e9d8217` (adds `pbta-logo`) *is*
pushed to `origin/main` of the proprietary repo, and that repo is currently public,
so Netlify builds succeed right now.

**Recommended fix:** Decouple the managed tier so its absence is a normal state.
Preferred shape: the design-system owns a **public stub** for `@myrrys/proprietary`
(exports `getIcon(): undefined` + the `IconNoun` type), committed in the public repo;
the submodule *overrides* it only when checked out (alias/sync prefers the real
registry if present, else the stub). Branded art then falls through to fallback →
missing glyph via the resolution logic that already exists. This keeps proprietary
artwork out of the public repo **and** keeps the build green when access is dropped.
Small change (alias + committed stub), not a redesign. Land before release.

---

## HIGH 2 — Scope bundling: this is not a single reversible slice

**Contract rule:** "Do not combine unrelated refactors or migration steps"; keep each
RC "deployable and reversible."

The diff vs `main` is 56 files / +2162. A large fraction is **not** icon work and
rides in on the same merge unit:
- Color-theme delivery: `apps/pelilauta/e2e/color-theme.spec.ts`,
  `apps/pelilauta/test/styles/colorThemeContract.test.ts`,
  `packages/design-system/styles/compat/cyan-4.css`
- Docs/process migration: `AGENTS.md` rewrite + 223-line `apps/pelilauta/AGENTS.md`
  deletion, retros→lessons (`docs/retros/…` deleted, `docs/lessons/…` added),
  `specs/TEMPLATE.md`, `docs/runbooks/releases.md`
- Tooling: lefthook centralization (`lefthook.yml` added, `apps/pelilauta/lefthook.yml`
  deleted), `commitlint.config.ts → .mjs`, `.claude/skills/*` symlinks

Individual commits are clean, but the **merge/revert unit** is not: reverting the icon
feature would also revert hooks, color-theme, and doc restructuring.

**Recommended action:** Split into separate PRs/slices, **or** at minimum make the RC
release note explicit that this candidate lands four unrelated changes. If the intent
is "keep this focused on the Cyan-4 icon reset," the bundled diff is exactly what
dilutes that focus.

---

## HIGH 3 — Test gates give false confidence

**a) The only real-component render test is in no gate.**
Root `package.json:10` `test` = `pnpm -r --if-present run test`; pre-push
(`lefthook.yml:6-9`) runs `pnpm test`. `apps/design` has **no `test` script** (only
`test:e2e`), so `--if-present` **silently skips it**. The Playwright icon-book spec
(`apps/design/e2e/icon-book.spec.ts`) — the only test that exercises the real rendered
`Icon.svelte` (geometry, currentColor inheritance, branded-fill presence, visible
missing-glyph, console-error-free) — is therefore in **no automated gate**. There is
**no CI** (no `.github`), and the Netlify build is pelilauta-only and runs no tests.
Every gate depends on a developer's local hook firing.

**b) Unit tests validate a copy, not the component.**
`packages/design-system/test/icon-registry.test.ts:16-23` asserts tier precedence /
fallback against a hand-written `resolveTier()` **mirror** (its own comment says so);
it never imports `Icon.svelte`. If the component's real precedence (`Icon.svelte:28`)
drifts from the mirror, the 8 tests stay green.

Combined, "463/463, 8/8, e2e passing ✅" overstates real coverage.

**Recommended actions:**
1. Add a `test` (or wire `test:e2e`) for `apps/design` so the icon-book spec is gated;
   ideally add minimal CI so gates don't depend on local hooks.
2. Point at least one unit test at the real `Icon.svelte` resolution, or drop the
   mirror and rely on the (now-gated) e2e.

---

## MEDIUM 4 — Runtime SVG rewriting is a workaround for a registry-format inconsistency

**Where:** `Icon.svelte:57-66` (regex strips `<?xml>`, `<!DOCTYPE>`, outer `<svg>`,
`</svg>`) + `:49-55` (viewBox re-extracted separately).

**Root cause:** The tiers store data in two different shapes:
- Community/managed (`icons/community.ts:7-9`, proprietary `index.ts`) store the
  **entire raw SVG document** string (XML prolog + Illustrator root `<svg>` + inner).
  These are v18 sprite source files inlined verbatim — note the fossil `viewBox="0 0
  128 128"` and `<g id="icon">` (the `#icon` fragment v18's `<use href=".../x.svg#icon">`
  referenced).
- Fallback (`components/icon-fallback.ts:11-25`) stores **normalized structured data**
  (`{ paths, viewBox }`).

The component wants one uniform output (`<svg viewBox role="img"><title>{noun}</title>…`)
so it must reverse-engineer inner content out of the full documents at render time.
This is **not** a browser requirement — it's the cost of storing two tiers as whole
documents and one as structured data.

**Consequences (external reviewer's Finding 2, confirmed valid):**
- Non-global regex strips only the *first* `<svg>`/`</svg>` — nested `<svg>`/`<symbol>`
  would leave broken markup.
- Any attribute on the root `<svg>` other than viewBox (e.g. `fill-rule`, `class`,
  `style`) is discarded. Current fox/search icons survive only because their
  `fill="currentColor"` sits on the inner `<g>` — luck of authoring, not a guarantee.

**Recommended fix:** Normalize at **generation time**, not render time.
`packages/design-system/scripts/generate-icon-registry.mjs` already parses these files;
have it emit the same structured shape the fallback tier uses (inner markup + viewBox)
for all three tiers. The component then interpolates pre-stripped, trusted inner markup
uniformly — deleting the runtime regex and this whole failure class.

---

## LOW 5 — Color-contract claim in the self-declaration is inaccurate

Self-declaration item #1 says `--color-on` "is consumed as `var(--color-on,
currentColor)`" in `icon.css`. Actually:
- `packages/design-system/styles/icon.css` contains **only** the five sizing tokens —
  no color rule.
- The new `Icon.svelte` never references `--color-on`; it hardcodes `fill="currentColor"`
  (`:38-46`).
- The `var(--color-on, currentColor)` contract lives in *legacy* `cn-icon`
  (`@11thdeg/cyan-lit`) and the note in `styles/compat/cyan-4.css`.

Functionally equivalent **today** only because `--color-on` is globally undefined. If
any scope ever sets `--color-on`, legacy `cn-icon` would adopt it and the new `Icon`
would not — an undocumented divergence.

**Recommended action:** Correct the delivery record, or reproduce `var(--color-on,
currentColor)` literally if the inheritance contract is meant to hold.

---

## LOW 6 — Element tag change may break tag-based selectors

New component emits `<span class="cn-icon" data-noun=…>` (`Icon.svelte:78`) instead of a
`<cn-icon>` custom element. Class selectors (`.cn-icon`) and `data-noun` survive, but any
CSS or test selecting the `cn-icon` **tag** silently stops matching at migrated sites.

**Recommended action:** grep for `cn-icon` tag selectors before merge.

---

## NOTE 7 — Registry can drift from its SVG sources at build time

`icons/community.ts` is generated-and-committed. The staleness `--check`
(`generate-icon-registry.mjs`, `check:icons`) runs only inside the (gated) design-system
unit test — **never** in any `build`. A build that skips the pre-push hook (e.g. Netlify)
can ship a `community.ts` stale against its SVG sources.

**Recommended action:** run `check:icons` as part of the build, or accept the risk
explicitly.

---

## NOTE 8 — Catalog is tiny relative to v18; future migrations can silently miss

Community = 2 nouns (`fox`, `search`); managed = 28; v18 serves 150+ dynamically from
`/icons/{noun}.svg`. Migrating a future component to `<Icon noun="…">` without first
adding its asset to a registry falls through to the **visible missing-glyph** with no
error and no gate to catch it (ties to Finding 3).

**Recommended action:** treat catalog expansion as a prerequisite gate for each
subsequent migration slice. (External reviewer's Finding 4 — valid.)

---

## Assessment of the external review agent's report (for reference)

- **Finding 2 (SVG stripping)** — valid and useful; folded in as MEDIUM 4 above.
- **Finding 4 (registry/migration bottleneck)** — valid; folded in as NOTE 8.
- **Finding 1 (accessible-name collision)** — *overstated, mechanism partly wrong*.
  `aria-label` takes precedence over descendant content in the AccName algorithm, so
  `<a aria-label>…<Icon/></a>` does **not** double-announce. Also missed that the
  `<title>=noun` behavior is a documented, human-approved spec decision preserving v18
  (`Icon.svelte:11-13`, spec 2026-07-20). Treat as a low-priority a11y-polish note
  (consider `aria-hidden` on icons inside already-labeled controls), not a defect.
- **Finding 3 (Netlify submodule)** — right symptom, shallow root cause. It blamed the
  sync script and recommended `GIT_SUBMODULES=true` / `git submodule update --init`.
  That only fixes "CI forgot to check out"; it does **not** address "Myrrys drops
  access," and it missed the compile-time static-import coupling that is the actual
  blocker. Use BLOCKER 1's decoupling fix instead.
- **Blind spots:** the external review praised "complete deterministic test coverage"
  (false — see Finding 3), missed the scope bundling (HIGH 2), missed the mirror-test
  issue, and overstated the `--color-on` fix. Its "conditional approval" verdict was
  reached without noticing the two things that should actually gate the release.

---

## What is genuinely good (credit / do not regress)

- Server-rendered, no hydration — full icon markup in the initial response.
- Spec has proper `provenance:` frontmatter (v18 source `@11thdeg/cyan-lit@4.0.0-beta.30`,
  v20 commit `02880fbc…`, cyan-css sizing evidence, dated human decisions).
- Sizing tokens **verifiably** match cyan-css beta.39 (16/24/36/72/128px) — not an
  unverifiable claim.
- Consumer migration preserves nouns, sizes, and accessible names; a11y arguably
  improved (`role="img"` added). AppFooter's inline color correctly moved to a wrapping
  span.
- Missing-glyph-visible and empty-noun divergences from v18 are deliberate, spec'd, and
  human-approved.
- Sync script fails loud with a remediation hint, not silently.

---

## Suggested gate checklist before release

- [ ] BLOCKER 1: managed tier decoupled (public stub + submodule override); build
      survives with proprietary package absent.
- [ ] HIGH 2: bundled non-icon changes split out, or RC note made explicit.
- [ ] HIGH 3: icon-book e2e wired into a gate; a unit test targets real `Icon.svelte`.
- [ ] MEDIUM 4: SVG normalization moved to generation time (kills the runtime regex).
- [ ] LOW 5: color-contract claim corrected in the delivery record.
- [ ] Verify: pinned submodule commit `e9d8217` remains pushed to proprietary origin.
