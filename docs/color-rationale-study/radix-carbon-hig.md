# Colour-system rationale: Radix Colors, IBM Carbon, Apple HIG

Research notes with verbatim quotes and source URLs, gathered 2026-08-18.

---

## 1. Radix Colors

Sources:
- https://www.radix-ui.com/colors (landing page)
- https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette
- https://www.radix-ui.com/colors/docs/overview/aliasing

### Why 12 steps

> "There are 12 steps in each scale. Each step was designed for at least one specific use case."
— https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale

Landing page framing, same claim in marketing language:

> "Designed for user interfaces — Each step is designed with a specific use case in mind, such as backgrounds, hover states, borders, overlays, or text."
— https://www.radix-ui.com/colors

### Step → use-case mapping (the fixed table)

From https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale:

| Step | Use case |
|---|---|
| 1 | App background |
| 2 | Subtle background |
| 3 | UI element background |
| 4 | Hovered UI element background |
| 5 | Active / Selected UI element background |
| 6 | Subtle borders and separators |
| 7 | UI element border and focus rings |
| 8 | Hovered UI element border |
| 9 | Solid backgrounds |
| 10 | Hovered solid backgrounds |
| 11 | Low-contrast text |
| 12 | High-contrast text |

Detail quotes tying specific steps to specific mechanics:

> "Steps `1` and `2` are designed for app backgrounds and subtle component backgrounds. You can use them interchangeably, depending on the vibe you're going for."

> "Step `3` is for normal states. Step `4` is for hover states. Step `5` is for pressed or selected states."

> "Step `6` is designed for subtle borders on components which are not interactive... Step `7` is designed for subtle borders on interactive components. Step `8` is designed for stronger borders on interactive components and focus rings."

> "Step `9` has the highest chroma of all steps in the scale. In other words, it's the purest step, the step mixed with the least amount of white or black... Step `10` is designed for component hover states, where step `9` is the component's normal state background."

> "Step `11` is designed for low-contrast text. Step `12` is designed for high-contrast text."
— all from https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale

### Why a fixed mapping beats free choice

Radix does not argue this abstractly as "constraint beats freedom" — its stated reasoning is that customisation breaks the engineered properties (contrast guarantees, harmony) the scale was built to deliver:

> "Custom brand colors — Radix Colors are not intended to be customised. They're designed to be accessible, well-balanced, and harmonious. Any customisation would likely break these features."
— https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette

On the step-to-use-case aliasing layer specifically (rather than reject free choice outright), Radix's guidance is to defer to the fixed step numbering when no semantic alias fits, rather than invent an ad hoc mapping:

> "Each step in Radix Colors scales is designed for a specific use case. To help your team know which step to use, you can provide aliases based on the designed use cases... Or you can simply recommend that your teammates defer to the original step number for situations where use cases don't have an alias."
— https://www.radix-ui.com/colors/docs/overview/aliasing

### Accessibility pairing claims

> "Steps `11` and `12`—which are designed for text—are guaranteed to Lc 60 and Lc 90 APCA contrast ratio on top of a step `2` background from the same scale."
— https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale

Landing-page restatement:

> "Accessibility made easy — Text colors are guaranteed to pass target contrast ratios against the corresponding background colors."

> "APCA text contrast — Contrast targets are based on the modern APCA contrast algorithm, which accurately predicts how human vision perceives text."

> "P3 color gamut support — Accounts for the blending differences in the wide gamut color spaces and enables the brightest yellows and reds possible."
— all https://www.radix-ui.com/colors

The pairing guarantee is scale-internal: step 11/12 text is only guaranteed against a step-2 background *from the same scale* — i.e., the contrast claim is a property of the fixed step system, not of arbitrary colour choices across scales.

---

## 2. IBM Carbon

Sources:
- https://v10.carbondesignsystem.com/guidelines/color/overview/
- https://v10.carbondesignsystem.com/guidelines/color/usage/
- https://v10.carbondesignsystem.com/guidelines/themes/overview/

(Fetched the v10 docs because the current carbondesignsystem.com site is a client-rendered SPA that curl/fetch tooling could not extract text from; v10 content matches the same token model — $interactive-01, $support-01..04, etc. — still current in Carbon's vocabulary.)

### Why themes are a fixed set of role tokens

Carbon's own glossary draws the theme/token/role/value distinction explicitly:

> "Theme: The set of unique values assigned to the tokens of a Carbon interface. Token: The code identifier for a unique role or set of roles. Tokens are universal and never change across themes. Role: The systematic usage(s) of a token. Roles cannot be changed between themes. Value: The actual style (i.e. hex code) assigned to a token."
— https://v10.carbondesignsystem.com/guidelines/themes/overview/ (also repeated verbatim on https://v10.carbondesignsystem.com/guidelines/color/overview/)

> "Carbon provides four themes as shown in the color usage page."
— https://v10.carbondesignsystem.com/guidelines/themes/overview/

The four are White, Gray 10, Gray 90, Gray 100 — two light, two dark, each keyed to a primary background:

> "Themes serve as an organizational framework for color in Carbon, with each theme based on a specific primary background color. There are two default 'light' themes and two default 'dark' themes. The light themes use White and Gray 10 backgrounds, and the dark themes use Gray 100 and Gray 90 backgrounds."
— https://v10.carbondesignsystem.com/guidelines/color/overview/

### What a theme may and may not change

May change — the value:

> "Altering one, some, or all of the default token values will result in a new theme. The developer then packages those new values into a new theme SCSS stylesheet which will replace the values of the default theme."

> "Alternatively, for relatively minor changes to an existing theme, a developer can make changes on a per-token basis... she could just set something like `$interactive-01: hotpink;`."
— https://v10.carbondesignsystem.com/guidelines/themes/overview/

May not change — the token identifier and its role:

> "The code identifier for a unique role or set of roles. Tokens are universal and never change across themes."

> "The systematic usage(s) of a token. Roles cannot be changed between themes."
— https://v10.carbondesignsystem.com/guidelines/themes/overview/

### Stated reasons for semantic-token stability

> "With tokens, the code only needs to be changed in one place to see the effect system-wide. Tokens are used across all components and help keep global patterns and styles consistent."
— https://v10.carbondesignsystem.com/guidelines/themes/overview/

> "Each theme is assigned 52 universal color variables, which are determined by common roles and usage. This allows for uniform color application across themes while maintaining full styling flexibility."
— https://v10.carbondesignsystem.com/guidelines/themes/overview/ (near-identical wording also on the color/overview page)

> "Tokens are a method of abstracting color by role or usage, independent of the actual color values. For example, instead of needing to code all instances of input labels in a UI to be #565656, the form component in Carbon specifies the token $text-02 for these labels... For a different theme, that same text-02 token could be mapped to a different hex value, like #ffffff. Thus, tokens not only allow for more efficient color updates within a theme, but also enable any UI (or portion of a UI) built with Carbon to easily switch between different themes."
— https://v10.carbondesignsystem.com/guidelines/color/overview/

> "A single token can be associated with multiple roles, but only if the color value is used consistently across those roles."
— https://v10.carbondesignsystem.com/guidelines/color/overview/

Governance note — Carbon distinguishes what *can* be built (any theme) from what IBM products are told to actually ship:

> "With this system, all Carbon users can create their own themes by assigning new values to the established color tokens. IBM products should use one of the four IBM default themes."
— https://v10.carbondesignsystem.com/guidelines/color/overview/

---

## 3. Apple Human Interface Guidelines — Color

Source: https://developer.apple.com/design/human-interface-guidelines/color (fetched 2026-08-18; content current as of the "December 16, 2025 — Updated guidance for Liquid Glass" change-log entry)

### Why apps consume purpose-named colours

> "The system defines colors that look good on various backgrounds and appearance modes, and can automatically adapt to vibrancy and accessibility settings. Using system colors is a convenient way to make your experience feel at home on the device."

> "iOS, iPadOS, macOS, and visionOS also define sets of dynamic system colors that match the color schemes of standard UI components and automatically adapt to both light and dark contexts. Each dynamic color is semantically defined by its purpose, rather than its appearance or color values. For example, some colors represent view backgrounds at different levels of hierarchy and other colors represent foreground content, such as labels, links, and separators."
— https://developer.apple.com/design/human-interface-guidelines/color

### What Apple protects from customization, and why

Explicit prohibition on redefining semantic meaning:

> "Avoid redefining the semantic meanings of dynamic system colors. To ensure a consistent experience and ensure your interface looks great when the appearance of the platform changes, use dynamic system colors as intended. For example, don't use the separator color as a text color, or secondary text label color as a background color."
— https://developer.apple.com/design/human-interface-guidelines/color

Explicit prohibition on hard-coding the underlying values (protects the *value*, not just the *role*, because Apple reserves the right to change it):

> "Avoid hard-coding system color values in your app. Documented color values are for your reference during the app design process. The actual color values may fluctuate from release to release, based on a variety of environmental variables. Use APIs like Color to apply system colors."
— https://developer.apple.com/design/human-interface-guidelines/color

Reasons given are consistency, dark mode / appearance adaptivity, and accessibility (contrast + colour blindness):

> "Make sure all your app's colors work well in light, dark, and increased contrast contexts... System colors vary subtly depending on the system appearance, adjusting to ensure proper color differentiation and contrast for text, symbols, and other elements. With the Increase Contrast setting turned on, the color differences become far more apparent. When possible, use system colors, which already define variants for all these contexts."

> "Avoid relying solely on color to differentiate between objects, indicate interactivity, or communicate essential information. When you use color to convey information, be sure to provide the same information in alternative ways so people with color blindness or other visual disabilities can understand it."
— https://developer.apple.com/design/human-interface-guidelines/color

One documented, narrow carve-out where Apple *does* let a customization override a system behaviour — a fixed-color sidebar icon is exempted from the user's global accent-color override, because the color there is carrying meaning, not decoration:

> "If people set their accent color setting to a value other than multicolor, the system applies their chosen color to the relevant items throughout your app, replacing your accent color. The exception is a sidebar icon that uses a fixed color you specify. Because a fixed-color sidebar icon uses a specific color to provide meaning, the system doesn't override its color when people change the value of accent color settings."
— https://developer.apple.com/design/human-interface-guidelines/color

### How status colours are treated

Apple's system colour palette (Red, Orange, Yellow, Green, Mint, Teal, Cyan, Blue, Indigo, Purple, Pink, Brown) is a single named set with light/dark/increased-contrast variants each — not a separate "status" subsystem — but the usage guidance singles out status/interactivity as the case demanding the most discipline:

> "Avoid using the same color to mean different things. Use color consistently throughout your interface, especially when you use it to help communicate information like status or interactivity. For example, if you use your brand color to indicate that a borderless button is interactive, using the same or similar color to stylize noninteractive text is confusing."
— https://developer.apple.com/design/human-interface-guidelines/color

And on where colour deserves emphasis at all, framed for the new Liquid Glass material:

> "Apply color sparingly to the Liquid Glass material, and to symbols or text on the material. If you apply color, reserve it for elements that truly benefit from emphasis, such as status indicators or primary actions."
— https://developer.apple.com/design/human-interface-guidelines/color

---

## 4. Across all three: limiting hues, and status vs. brand colour

### Stated reasons for limiting the number of hues/palettes

**Carbon** states this as house style, tied to the Neutral Gray + core Blue structure:

> "Carbon's default themes are derived from the IBM Design Language color palette. The Neutral Gray family is dominant in the default themes, making use of subtle shifts in value to help organize content into distinct zones. The core Blue family serves as the primary action color across all IBM products and experiences. Additional colors are used sparingly and purposefully."
— https://v10.carbondesignsystem.com/guidelines/color/overview/

**Apple** states it per-platform, most explicitly for tvOS and visionOS, where restraint is tied to legibility over content and deference to a media-heavy or physically-transparent context:

> "Consider choosing a limited color palette that coordinates with your app logo. Subtle use of color can help you communicate your brand while deferring to the content." (tvOS)

> "Use color sparingly, especially on glass... Prefer using color in places where it can help call attention to important information or show the relationship between parts of the interface." (visionOS)

> "Refrain from adding color to the background of multiple controls" (Liquid Glass, all platforms) — colour is explicitly rationed to the one element that needs emphasis, not spread across peers.
— https://developer.apple.com/design/human-interface-guidelines/color

**Radix** does not argue for limiting palette count as a design virtue — it ships 20+ hue scales and explicitly expects most products to eventually need most of them:

> "In many cases, you might eventually need most of the scales, for one reason or another. Your app may support multiplayer mode, where you assign a color to each user... Radix Colors are well-balanced, and designed to work in harmony. So for product communication, most color pairings will work."
— https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette

So on this specific question the three diverge: Carbon and Apple state restraint as a design value (organise via neutral + one accent, spend colour only where it earns emphasis); Radix explicitly declines to make that argument and instead engineers harmony so scale proliferation is safe.

### Status colours vs. brand colour

- **Carbon** hard-separates them at the token level: `$interactive-01..04` (brand/primary action, Blue 60 default) are a distinct token family from `$support-01..04` (Error/Success/Warning/Information — Red 60 / Green 60 / Yellow / Blue 70) and their high-contrast counterparts `$inverse-support-01..04`. Nothing in the fetched docs states the rationale for the split beyond the role-token model itself (roles fixed, values swappable per theme) — see the token table at https://v10.carbondesignsystem.com/guidelines/color/usage/.
- **Apple** does not structurally separate "status colours" from the rest of the system palette (same 12-hue set, e.g. `systemGreen`/`systemRed` are ordinary members), but its prose repeatedly calls out status/interactivity as the situation where colour consistency is non-negotiable: "especially when you use it to help communicate information like status or interactivity" and "reserve it for elements that truly benefit from emphasis, such as status indicators or primary actions" (quotes above).
- **Radix** treats "semantic" (status-like: error/success/warning/info) and "brand" scale choice as the same mechanism — pick a hue and alias it — but flags that a single hue often has to carry more than one status meaning, which it treats as a known limitation of the alias layer rather than a case for structural separation:

> "If you map `yellow` to 'warning', you might also need `yellow` to communicate 'pending'... In this scenario, you can choose to define multiple semantic aliases which map to the same scale."
— https://www.radix-ui.com/colors/docs/overview/aliasing

> "**Error**: red, ruby, tomato, crimson. **Success**: green, teal, jade, grass, mint. **Warning**: yellow, amber, orange. **Info**: blue, indigo, sky, cyan."
— https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette

---

## What none of them explain

- **Why 12, specifically, and not some other count.** Radix asserts every step has a use case, but never argues why the *use-case count itself* landed at 12 rather than, say, 8 or 16 — no trade-off analysis (perceptual step size, engineering cost, precedent) is given in any fetched page.
- **Why four Carbon themes, specifically two-light/two-dark, rather than three or five.** Carbon states the fact (White, Gray 10, Gray 90, Gray 100) and the light/dark split, but not why exactly two backgrounds per mode were judged sufficient, nor why 52 was the right number of universal color variables.
- **A quantitative or empirical basis for any contrast claim beyond citing the algorithm/standard.** Radix cites APCA Lc 60/90 targets and Carbon cites the "difference of 50 or greater" WCAG-AA heuristic; Apple cites Increase Contrast as a system setting. None of the three shows the underlying research or justifies why those particular thresholds (not stricter or looser ones) were chosen.
- **Why limiting hue count is/isn't a virtue** — as noted in Section 4, Carbon and Apple assert restraint as a value without defending it against the alternative, while Radix does the reverse (defends proliferation as safe) without addressing when restraint might still be better product practice.
- **How a status colour is chosen to begin with** (why red for error is culturally near-universal enough to hard-code) — Radix flags culture-dependence only implicitly ("common pairings that work well in Western culture"); Apple flags it directly for a chart example (green/red reversal in English vs. Chinese) but gives no general method for choosing a culturally safe default, only a caution to "make sure the colors in your app send the message you intend."
- **Governance/enforcement mechanism.** All three state the rule (don't redefine semantics, don't customize the scale, roles can't change between themes) but none of the fetched pages describes how the rule is enforced in practice — lint rules, review process, or automated checks are absent from all three sources.
