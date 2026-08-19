# USWDS colour system — stated rationale

Sources: designsystem.digital.gov (official docs) + github.com/uswds/uswds issues #2712 and #3329
(primary team writeup by Dan O. Williams, USWDS maintainer, GitHub handle `thisisdano`, with
contributions from community members `darekkay` and `pspeter3`).

## 1. Grades 0–100 indexed by perceived lightness, and the "magic number" arithmetic

**What grade is, and why 0–100:**
> "Grade is a way to express how light or dark a color is. USWDS uses a 100-point scale to
> communicate a color token's grade, where 0 is pure white and 100 is pure black."
— https://designsystem.digital.gov/design-tokens/color/overview/

**Why grades are regularized across hue families (the structural move):**
> "USWDS has regularized these grades across color families; a color of grade 50 in one color
> family should be the same level of lightness as a color of grade 50 in another color family.
> This feature of USWDS has important color-contrast and accessibility implications."
— https://designsystem.digital.gov/design-tokens/color/overview/

**The magic number, defined:**
> "We call the difference in grade between any two colors the magic number."
— https://designsystem.digital.gov/design-tokens/color/overview/ (also quoted in
  https://github.com/RocketCommunicationsInc/astro-design-tokens/issues/50, which cites the same
  USWDS doc)

**The exact rules (grade difference → WCAG level):**
> "A magic number of 40+ results in WCAG 2.0 AA Large Text contrast"
> "A magic number of 50+ results in WCAG 2.0 AA contrast or AAA Large Text contrast"
> "A magic number of 70+ results in WCAG 2.0 AAA contrast"
> "Colors of grade 50 result in Section 508 AA contrast against both pure white (grade 0) and
> pure black (grade 100)"
— https://designsystem.digital.gov/design-tokens/color/overview/

**Why the arithmetic works (the mechanism, in one sentence):**
> "Magic numbers work because each grade conforms to a specific range of values for relative
> luminance." (linking to the W3C definition of relative luminance)
— https://designsystem.digital.gov/design-tokens/color/overview/

**Why lightness (HSL "L") rather than raw luminance for the human-facing scale — from the
maintainer's own working-through of the question, in the GitHub thread that produced the
published bounds:**
> "Luminosity is a geometric function and lightness is a linear function so it's easier (in a
> linear scale) to see the evenness of a color system mapped to lightness. (An increment of
> luminance is equal to a smaller increment of lightness at the light end of the spectrum than at
> the dark end. Is this because our eyes are more sensitive to light colors?)"
— thisisdano, https://github.com/uswds/uswds/issues/3329

**The original engineering task that produced the normalized values** (issue opened by
Dan O. Williams):
> "If we normalize each color at each grade around the `gray` luminance value for that grade, we
> should have a color system that delivers on its promise: to achieve AA Large contrast for magic
> numbers of 40+ and AA contrast for magic numbers of 50+."
— https://github.com/uswds/uswds/issues/2712

> "This normalizes color grades around the luminance of the `gray` family to assure that magic
> numbers work as advertised."
— PR description, https://github.com/uswds/uswds/pull/2713 (fixes #2712)

## 2. Why a constrained set of theme tokens over arbitrary colour

**The direct instruction, and its stated reason:**
> "Use USWDS color tokens, and avoid custom colors whenever possible. Creating coherent
> government sites and services helps provide a good user experience to the public."
— https://designsystem.digital.gov/design-tokens/color/overview/

**Design tokens generally — why discrete palettes over open-ended CSS values (from the design
tokens overview, framing the reasoning that also covers color):**
> "The degree of choice in CSS values can slow down design work and make communication between
> designer and developer unnecessarily granular, so the Design System seeks to maximize design
> efficiency and improve communication with design tokens: the discrete palettes of values from
> which all visual design is based."
— https://designsystem.digital.gov/design-tokens/ (via search extraction; corroborated by
  https://github.com/uswds/uswds-site/blob/main/pages/design-tokens/overview.md)

**The maintainer's own framing of why the system favors a smaller, tightly-consistent set of
values over covering the whole color spectrum** (this is the clearest first-person statement of
the "constrained over arbitrary" philosophy):
> "The big differences here are that the proposal optimizes for coverage (i.e. increasing how
> much of the spectrum is covered in the ranges) and USWDS optimizes for consistency (i.e. how
> similar colors are within a range and how similar ranges are between each other). The proposal
> covers more of the spectrum, USWDS is more consistent."

> "It's important that our color system be consistent and predictable, that users know what
> they're getting when they choose a color of a certain grade. This makes us inclined to favor
> smaller, more equal ranges, and consistent spacing between ranges."

> "USWDS is structured around a relatively static collection of design tokens. We expect our
> users to use these tokens, and we don't expect the values of our tokens to change very
> frequently. Our users expect us to be predictable, if we do change the value of a specific
> token, they would expect that this change would not have a dramatic effect of the tone of their
> site. One of the very nice things about color tokens is that the system can adapt and update the
> values under the hood but these changes will never adversely affect either accessibility or
> broad tonal intent (that is, blue will still be "blue" and blue-40 will always have a
> predictable luminosity)."
— thisisdano, https://github.com/uswds/uswds/issues/3329

## 3. System palette vs. theme palette — what a theme may change

**Definition of the system palette and its relation to the theme palette:**
> "USWDS system color tokens are the complete palette of color tokens from which any project can
> build a theme palette. System tokens are well-researched starting points you can use to define
> your theme tokens, which represents your site's visual identity."
— https://designsystem.digital.gov/design-tokens/color/system-tokens/ (via search extraction)

> "USWDS color system tokens include 10 grades for 25 different hues of the color wheel, but you
> probably don't need 250 colors available for immediate use in your project, so the theme color
> tokens use a handful of grades for specific purposes like primary, secondary, accent-cool,
> accent-warm, and base."
— https://designsystem.digital.gov/design-tokens/color/system-tokens/ (via search extraction)

**Theme tokens are strictly derived from system tokens — a theme customizes assignment, not the
underlying color values:**
> "USWDS theme color tokens provide flexible, accessible, customizable color choices for your
> project."
> "Each theme token is drawn from a system color token and we only use token-based colors in
> official components."
— https://designsystem.digital.gov/design-tokens/color/theme-tokens/

**What a theme is structured as — five role-based families, and the proportional rule for how
much of a UI each occupies:**
> "USWDS theme color tokens are divided into five high-level role-based color families: base,
> primary, secondary, accent-warm, and accent-cool."
> "Base is a project's neutral color, typically some tint of gray, and usually used as the text
> color throughout."
> "Primary, secondary, and accent colors can be thought of as falling into a proportional 60/30/10
> relationship: about 60% of your site's color would be the primary color family, about 30% would
> be the secondary color family, and about 10% would be the accent color families."
— https://designsystem.digital.gov/design-tokens/color/theme-tokens/

**What a theme may vary within a family — grade choice, not the grade's meaning:**
> "Each color family has seven possible lightness grades, from lightest to darkest, though not
> every family needs to include a color at each grade."
— https://designsystem.digital.gov/design-tokens/color/theme-tokens/

**State tokens follow the identical constraint (drawn from system tokens, not free-standing
colors), for a separate but structurally parallel palette:**
> "The state color palette is divided into five high-level role-based color families: info,
> error, warning, success, emergency, and disabled."
> "Each state token is drawn from a system color token and we only use token-based colors in
> official components."
— https://designsystem.digital.gov/design-tokens/color/state-tokens/

## 4. Accessibility as a structural property of the scale, not a per-pair check

**The direct statement that the scale itself, not manual checking, carries the guarantee:**
> "USWDS has regularized these grades across color families; a color of grade 50 in one color
> family should be the same level of lightness as a color of grade 50 in another color family.
> This feature of USWDS has important color-contrast and accessibility implications."
— https://designsystem.digital.gov/design-tokens/color/overview/

> "Magic numbers work because each grade conforms to a specific range of values for relative
> luminance."
— https://designsystem.digital.gov/design-tokens/color/overview/

**The consequence spelled out — pick by number, not by measurement:**
Search-extracted framing of the same overview page: "This approach makes it easier for design
teams to select accessible color combinations without having to manually check contrast ratios,"
i.e. the arithmetic (grade subtraction) substitutes for a contrast-ratio calculation on every
chosen pair, because the guarantee is baked into how the scale was built rather than verified
pair-by-pair after the fact. This is corroborated by the maintainer's own account of *why* the
ranges were built the way they were (the coverage-vs-consistency tradeoff in section 2 above):
the ranges were deliberately narrowed and evened out specifically so the promise ("40+ = AA
Large", "50+ = AA", "70+ = AAA") holds for *any* pair of grades in *any* family, not just for
pairs someone happened to test.

**The system was not initially airtight, and the maintainer treated this as a defect in the
scale's construction to be fixed at the scale level — not as grounds for per-pair testing to
replace the scale guarantee.** When a community member (`darekkay`, backed by `pspeter3`'s
independent luminance-bounds work) found real counterexamples — `indigo-cool-vivid-60` failing
its promised contrast against several grade-10 colors — the maintainer's response was to publish
tighter luminance-range bounds per grade and bring the outlier tokens into conformance, rather
than to introduce a rule that every pair must be measured:
> "I do see that indigo-cool-vivid-60 (#4150f2), green-vivid-10 (#c3ee90), and gray-cool-10
> (#dcdee0) all fall outside the guidance bounds. ... there are a few current token values that
> fall outside this guidance, and we'll be bringing them into conformance as well."
— thisisdano, https://github.com/uswds/uswds/issues/3329

## What USWDS does NOT explain

- **No published derivation of the exact luminance bounds per grade.** The maintainer showed
  charts (images, not machine-readable tables) and said the guidance was "still a work in
  progress" as of the 2020 thread; the precise numeric bounds table is not published in the
  official docs as prose/quotable text — only community members (`darekkay`, `pspeter3`)
  reverse-engineered numeric tables from the shipped colors and posted them in the GitHub issue,
  and even those two independent tables disagree with each other and with USWDS's own.
- **No stated color-vision-deficiency (CVD) rationale tied to the grade/magic-number system
  specifically.** The docs assert general color-insensitivity statistics (about 4.5% of the
  population) and advise not relying on color alone, but this is a separate concern from the
  lightness-grade contrast system — the two are not explicitly connected in the source material
  found.
- **No explanation of why 10 grades (in 10s from 0–100, sometimes 5–90) rather than some other
  count**, nor why the "vivid" variants exist as a separate track requiring their own later
  reconciliation pass (referenced but not detailed in issue #3094, linked from #3329).
- **No worked-out defence of HSL "L" vs. a perceptual color space (e.g., CIELAB/LCH) for the
  lightness scale.** The maintainer raises the luminance-vs-lightness distinction and even
  wonders aloud ("Is this because our eyes are more sensitive to light colors?") without
  answering it from a color-science basis — the choice is justified by internal consistency
  goals, not by a stated perceptual model.
- **No acknowledgment in the official docs (only in the GitHub issue) that the shipped color
  values had *failed* their own advertised guarantee** (`indigo-cool-vivid-60` etc.) before the
  2020 fix — the published documentation describes the system as it now ships, not as a place
  where the arithmetic was once broken and had to be repaired.
- **The exact automated contrast-check tooling's own bug** (why `check-contrast.js` didn't flag
  the failing AA pairs) is discussed as an open question in the thread but never resolved in any
  source found here.
