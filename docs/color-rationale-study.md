# Colour Rationale Study

- **Status:** complete — external findings gathered and the operator's
  rationale recorded 2026-08-19.
- **Purpose:** supply the *why* behind the colour system's structure — for
  `docs/DESIGN.md`'s intent paragraphs and the Colour principles book — from the
  stated rationale of major design systems and from perception research, mapped
  onto v21's decisions. The system's *how* is
  `specs/design-system/color-system/spec.md`.

## The mapping: v21's decision → the strongest external rationale

| v21's decision | External rationale | Source |
| :--- | :--- | :--- |
| Lightness-indexed steps (`--chroma-{family}-{step}`, step = perceived lightness) | Contrast collapses to subtraction. Material: "Contrast is guaranteed simply by picking colors whose tone values are far enough apart — no complex calculations required" (tone Δ40 large / Δ50 small elements). USWDS: grades regularized across families so a "magic number" (grade difference) predicts WCAG level — 40+ AA Large, 50+ AA, 70+ AAA — "because each grade conforms to a specific range of values for relative luminance." | [M3, Science of Color](https://m3.material.io/blog/science-of-color-design); [USWDS colour tokens](https://designsystem.digital.gov/design-tokens/color/overview/) |
| OKLCH as the authoring space | HSL "isn't remotely accurate, and doesn't try to be: it was built to make computing colors fast on 1970s computers" — at HSL lightness 50, measured lightness ranges 33–96. Oklab/Oklch were built for orthogonal L/C/H axes (Ottosson 2020), so stepping only L yields even ramps and same-L colours read as equal weight across hues. | [M3, Science of Color](https://m3.material.io/blog/science-of-color-design); [Ottosson, Oklab](https://bottosson.github.io/posts/oklab/) |
| Lightness as contrast *approximation*, not certificate | The correlation of ΔL to WCAG ratio is strong but not identity: WCAG 2 computes from relative luminance, a different number space, and its own math is not perceptually uniform (overstates contrast near black — the reason APCA exists). Verification runs the real formula on resolved pairs; the scale makes passing the default, not the proof. USWDS lived this: shipped colours broke the magic-number promise in 2020 and were fixed at the scale level. | [Myndex, Why APCA](https://git.apcacontrast.com/documentation/WhyAPCA.html); [uswds#3329](https://github.com/uswds/uswds/issues/3329) |
| A fixed semantic role layer components consume | Universal across systems. Carbon: tokens "are universal and never change across themes," roles "cannot be changed between themes" — only values shift. Apple: dynamic colours are "semantically defined by purpose, rather than appearance," and both redefining the meaning and hard-coding the value are prohibited. Material frames roles as the "paint-by-number" connective tissue. | [Carbon themes](https://v10.carbondesignsystem.com/guidelines/themes/overview/); [Apple HIG colour](https://developer.apple.com/design/human-interface-guidelines/color); [M3 roles](https://m3.material.io/styles/color/roles) |
| Role *pairs*, not free recombination | Chevreul's simultaneous contrast: adjacent colours shift each other's apparent hue, value and saturation, so contrast is a property of the pair, not the colour. Albers built a method on it: only a tested pairing carries a guarantee; an ad-hoc pair is an unrun experiment. Radix's guarantee has the same shape — step 11/12 text is certified only against step 2 of the same scale. | Albers, *Interaction of Color* (1963); [Radix, understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) |
| Themes replace chroma only; semantics are not themeable | Material's split is exactly v21's: "the other components of color, hue and chroma, are open to any values" while tone is fixed by the role-pairing contract — themes vary the input, never the grammar. Radix states the blunt version: "Radix Colors are not intended to be customised… Any customisation would likely break these features." | [M3, Science of Color](https://m3.material.io/blog/science-of-color-design); [Radix, composing a palette](https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette) |
| Two identity families (primary + surface) | Carbon's default themes are structurally this: "The Neutral Gray family is dominant… the core Blue family serves as the primary action color… Additional colors are used sparingly and purposefully." Brand theory supplies the deeper why: distinctive-asset research (Sharp/Romaniuk) finds recognition accrues to one hue used consistently in one role — rotating identity colours dilutes the cue. | [Carbon colour](https://v10.carbondesignsystem.com/guidelines/color/overview/); Sharp, *How Brands Grow* (2010) |
| Auxiliary status families fixed, not themeable | Material exempts exactly this: "Error color roles are made static by default with any dynamic color scheme" — the one named departure from everything-varies. The semiotic ground: status colour is a learned convention (red=stop is 19th-century railway signalling, kept by infrastructure, not perception), and a convention's whole value is staying fixed — a re-brandable error colour breaks the low-cognition recognition it exists for. | [M3 roles](https://m3.material.io/styles/color/roles); Knight 1868 / signalling history |
| Auxiliaries partial (20/40/60/90) | No system states this count, but the shape recurs: Radix maps steps to jobs (strong fill, hover, low/high-contrast text), and a status colour has fewer jobs than an identity colour — dark text, strong fill, bright accent, pale tint. Partial scales also shrink the untested-pair surface (Albers's argument: every colour added multiplies unrehearsed combinations). | [Radix scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) |
| Restraint as a value | Two schools. Carbon/Apple assert it ("Additional colors are used sparingly"; "Apply color sparingly… reserve it for elements that truly benefit from emphasis"). Radix declines, engineering harmony so proliferation is safe. The classical arguments both land on discipline: Itten because harmonic combinations are rule-governed; Albers because perception is relative, so only a small, rehearsed vocabulary can be trusted. v21 is in the Carbon/Apple school. | [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/color); Bauhaus colour literature |

## What no external source explains

The census of gaps was itself a finding: **none of the studied systems defends
its numeric choices.** Material never says why 13 tones; Radix never says why
12 steps; Carbon never says why four themes or 52 tokens; USWDS never derives
its grade bounds from a perceptual model. The industry's numbers are settled
practice, not derived truths — which licenses v21's to be stated the same way:
as decisions, with their intent, without a false proof.

Equally absent everywhere: an enforcement mechanism. All four state rules; none
describes how the rules are kept. v21's generator and token-graph checks
(`docs/color-token-regression-plan.md`) go further than any studied system.

## Deviations that are v21's to state

These are where Pelilauta departs from the studied systems, so no citation can
carry them — the design language lives exactly here:

1. **The primary scale rotates hue** (petrol → teal → acid-neon across
   lightness). Every studied system holds hue near-constant per family and
   varies tone. The rotation is an identity statement with no external
   precedent found.
2. **Love is a structural colour family** and info does not exist. The studied
   systems ship error/warning/success/info; none ships a social-affection
   family, and none has deleted info.
3. **Surface is a tinted cerulean architecture**, not the neutral grey that
   dominates Carbon/Material practice.

## The operator's rationale (recorded 2026-08-19)

1. **Register.** Nordic calm with one spark, crossed with zine/DIY punk. The
   palette must never turn noisy, and never polished-bland.
2. **The hue rotation mimics nature**, the way hue-shifting scales imitate how
   colour behaves under real light. The primary scale is the deep greens of a northern
   forest as the sun illuminates them: glowing sunlit yellow at the light end,
   deep shadowed forest at the dark end. A single held hue would be a swatch;
   the rotation is a landscape.
3. **Surface carries depth and atmosphere** — night-sky depth in Dark, paper
   warmth in Light — rather than neutral chrome.
4. **The theme author is a sub-community.** Pelilauta once merged with
   Mekanismi, an RPG wiki where people built wikis for characters, games and
   rules; site theming was among its most loved capabilities. The
   two-family contract exists to give that capability back safely: because the
   scales are lightness-indexed in OKLCH, a re-themed site keeps
   semi-predictable contrast.
5. **The answer to "let me override the link colour" is: retheme the family.**
   No single-role overrides — a replacement chroma family moves every role,
   links included, coherently.
6. **Love is structural because appreciation is core.** Reactions are the
   community's main social currency; warmth between players is a first-class
   signal, not decoration.
7. **Info was primary in disguise.** Its role resolved to primary steps — it
   named a distinction the design never actually made, so it was removed.
8. **The auxiliary steps are the four jobs a status colour has**: dark text on
   tint, strong fill for Light, bright fill for Dark, pale tint background.
   A status needs no more.
9. **The scale is a tool and a guardrail, by audience.** A working tool in the
   operator's hands (step arithmetic), a guardrail in everyone else's — the
   documentation speaks to both readers.
10. **v19's rescue-worthy insights are the layer separation and
    lightness-as-contrast** — the architecture and the arithmetic. The rest of
    v19 is not read during the port, deliberately, to avoid drift.

## Study sources

Research notes with verbatim quotes: Material 3 (Science of Color & Design,
roles, tone-based surfaces), USWDS (colour token docs; maintainer threads
uswds#2712, #3329), Radix Colors / IBM Carbon / Apple HIG, and the perception
foundations (Ottosson's Oklab, Chevreul/Albers/Itten, APCA, signalling history,
distinctive-asset theory). Full notes with URLs are in the repair session's
working records; the quotes above are verbatim from the cited pages.
