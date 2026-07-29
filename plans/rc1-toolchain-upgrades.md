# RC.1 Toolchain Upgrades

Status: Draft 2026-07-28
Branch: `chore/repo-tooling` opened step 1; the remaining steps are unstarted
Decision: human 2026-07-28 — Astro and Vite must be current before `v21.0.0-rc.1`;
too large for the current beta line, so they are logged here rather than started.

## Standing Principle

**Dependency versions are not themselves compatibility contracts.** Libraries
may and should be updated, breaking majors included, whenever the update
preserves the v18 behavior, Firebase integration, public routes, data shapes,
and user-visible interactions protected by the delivery contract. Staying on a
legacy version is not a compatibility requirement and does not reduce delivery
risk — it defers and compounds it.

Corollary, learned the expensive way: **when a problem is caused by an outdated
dependency, check whether the dependency can simply be updated before designing
any workaround.** The `node-linker=hoisted` versus `shamefully-hoist`
investigation — which produced a fix that reported deploy SUCCESS while every
SSR route returned 502 — existed entirely because `workbox-build@7.3.0` pinned
`rollup: ^2.43.1`. Bumping workbox to 7.4.1, a version the declared `^7.3.0`
range already admitted, deleted the cause. Checking upgradability first would
have replaced the whole detour with one command.

## Why This Is An RC.1 Gate

`docs/runbooks/releases.md` reserves `beta.X` for "deployable product increments
that are not yet claimed as complete v18 replacements." RC.1 is where v21 *is*
claimed as the drop-in replacement for live v18. Shipping that claim on a
framework two majors behind means the first post-RC upgrade would land breaking
framework changes on a release already asserted complete — exactly the coupling
the delivery contract exists to avoid. So the toolchain moves while the version
still says beta.

## Version Ledger

Recorded 2026-07-28 against installed versions, not just declared ranges.

| Package | Declared | Installed | Latest | Majors behind |
| --- | --- | --- | --- | --- |
| `astro` | `^5.14.1` | 5.15.4 | 7.1.4 | **2** |
| `vite` (pelilauta direct) | `^6.0.11` | 6.4.1 | 8.1.5 | **2** |
| `@astrojs/netlify` | `^6.5.11` | 6.6.0 | 8.1.2 | **2** |
| `@astrojs/svelte` | `^7.1.1` | 7.2.2 | 9.0.1 | **2** |
| `vitest` | `^2.1.8` | 2.1.9 | 4.1.10 | **2** |
| `svelte` | `^5.39.6` | 5.43.5 | 5.56.8 | 0 (minor drift) |
| `@astrojs/check` | `^0.9.4` | 0.9.5 | 0.9.10 | 0 (patch drift) |
| `workbox-cli` | `^7.4.1` | 7.4.1 | 7.4.1 | 0 — **done in this slice** |

`astro` and `vite` are declared in both apps' dependency sets; `apps/design`
carries `astro` and `@astrojs/svelte` too, so every Astro-major step is a
two-application change, not a `apps/pelilauta` change.

## Coupling — Why This Cannot Be One PBI Per Package

The Astro majors drag their own ecosystem with them, so these are not
independent upgrades:

- `@astrojs/netlify` and `@astrojs/svelte` majors are pinned to Astro majors.
  Both must move in the same step as `astro`, in both applications.
- `astro` bounds the supported `vite`. The direct `vite` devDependency in
  `apps/pelilauta` must land in the same step rather than drifting ahead.
- `vitest` shares Vite's plugin and config surface, so the harness bump is
  gated on the Vite version rather than free-standing.

Practical shape: **one PBI per Astro major** (5→6, then 6→7), each carrying its
matching adapter, integration, and Vite versions across both apps. Do not
attempt 5→7 in one merge.

## Ordering

Cheap and independent first, so the risky steps start from a clean baseline.

1. ~~**`workbox-cli` 7.3.0 → 7.4.1.**~~ **Done in this slice.** Moved workbox
   from `rollup: ^2.43.1` to `^4.53.3`, removing `rollup@2.79.2` and with it the
   dual peer-resolution of `astro@5.15.4` that broke
   `pnpm install --frozen-lockfile` under `node-linker=hoisted`. Output
   equivalent: same precache manifest, same 12 hashed fonts.
2. **`svelte` and `@astrojs/check` drift.** Same-major, no API surface change
   expected. Cheap to verify and shrinks the diff of every later step.
3. **`astro` 5 → 6**, with `@astrojs/netlify`, `@astrojs/svelte`, and `vite` to
   their 6-compatible majors, in both applications.
4. **`vitest` 2 → 4**, once the Vite version underneath it is settled.
5. **`astro` 6 → 7**, same shape as step 3.

Steps 3 and 5 each begin by inventorying that major's breaking changes against
this repository's actual usage — SSR adapter configuration, `astro:content`,
middleware, image handling, and the Svelte integration. That inventory is the
first deliverable of the step, not an assumption to be made now; nothing in this
plan should be read as a claim about what those majors changed.

## Known Landmines

Found while investigating the install failure repaired in this slice; both bear
directly on the remaining steps.

- ~~**Relative `node_modules` font path.**~~ **Fixed in this slice.**
  `overrides.css` addressed Lato as
  `url("../node_modules/lato-font/fonts/…")`, which resolves only when
  `apps/pelilauta/node_modules/lato-font` exists. Under `node-linker=hoisted`
  it does not, and the failure is **silent** — Vite emits no asset, passes the
  raw specifier into the built CSS, and the browser 404s. Now addressed as
  `url("lato-font/fonts/…")` so node resolution handles it under any store
  layout. The **font-emission gate below stays** regardless: any Vite major
  changes asset resolution, and this class of failure produces no build error.
- **The Netlify SSR function bundle is the highest-risk surface, and its health
  cannot be read from Netlify's state.** The adapter major moves with Astro, and
  the deploy fixes `6be656a`…`7c2d2ee` show this repository has already been
  bitten by traced dependencies not surviving upload. Demonstrated again during
  this slice: a `shamefully-hoist=true` preview reported deploy **SUCCESS** while
  every SSR route returned **502** and only static assets served. Fetch an SSR
  route on the preview; never accept "ready" as evidence.

## Gates Per Step

Every step in this plan must hold all of these, not a subset:

- `pnpm install --frozen-lockfile` succeeds from a clean checkout.
- `astro check` 0 errors in both applications; both app builds pass.
- `pnpm -r test` — pelilauta unit suite and the design-system registry suite.
- `check-netlify-ssr-entry.mjs` reports `OK` on the built entry.
- **Font emission gate:** `find apps/pelilauta/dist -name '*.woff2'` returns 12
  hashed files and the built CSS references the hashed names. This is the
  regression detector for the landmine above and it is cheap; run it every step.
- **Service worker gate:** the precache manifest stays at its expected size
  (308 URLs / 7.8 MB on a clean `dist/` as of this plan; the broken-font state
  reads 296 / 5.6 MB). A silent drop is how the missing fonts first surfaced.
- A **Netlify preview deploy** verified against the live endpoint, per the
  release runbook. Required for any step touching the adapter or Vite.

## Out Of Scope

- Framework-idiom refactors that a major merely makes possible. Upgrade first,
  adopt new idioms in their own slice.
- The Cyan Lit dependency removal, the Fab epic, and the remaining `cn-icon`
  consumer batches. Those have their own plans; do not bundle them into a
  framework step.
- Any Firebase schema, security rule, route, auth, or persisted-data change.

## Approvals Still Required

Per `AGENTS.md`, each step is a dependency change and needs human approval
before it starts, and steps 3 and 5 also change deployment configuration. This
plan records the *requirement* and its ordering; it is not standing approval to
begin any step.
