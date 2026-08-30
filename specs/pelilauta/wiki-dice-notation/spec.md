---
status: proposed
---

# Wiki Dice Notation

## Blueprint

### Context

A wiki writer uses compact tabletop-rules notation in prose and link text. A
reader receives the same die, result or target information in rendered pages
without the notation changing a code sample, destination or HTML.

### Architecture

The wiki Markdown renderer identifies the eligible inline text that this
capability governs before HTML is emitted. It converts each supported token into
a server-rendered span for `specs/dice/spec.md`; it never creates a custom
element or a client boundary.

The span has `class="dice"` and `role="img"`. `data-sides` holds the admitted
side count. `data-value` always holds the numeric face value. `data-kind` is
`die`, `result` or `target`. `data-length` holds the character count of
`data-value`, so Dice can size the face text to fit its silhouette. `aria-label`
holds the accessible name. The span carries its face text as a real text node,
so a reader can select and copy it with the surrounding prose; `role="img"`
with `aria-label` keeps assistive technology announcing the accessible name
instead. Dice governs how that face text renders. A `target` span carries its
`+` in its own `<span class="dice-plus">`, so Dice can draw it outside the
silhouette; `die` and `result` spans have no inner element.

### Documentation

- `apps/pelilauta/src/content/docs/10-wikisyntax.md`

### Constraints

The notation accepts sides `2`, `4`, `6`, `8`, `10`, `12` and `20`. A number
uses ASCII digits `0` through `9` without a leading zero. A value is an integer
from 1 through the stated side count.

`dice:<sides>` emits a `die` span with the side count as `data-value` and
accessible name `[<sides>]`. `dice:<sides>:<value>` emits a `result` span with
the value as `data-value` and accessible name `[<value>]`.

`target:<sides>` and `target:<sides>+` emit equivalent `target` spans whose
`data-value` is the side count and whose accessible name is
`[d<sides>, <sides>+]`. `target:<sides>:<value>` and
`target:<sides>:<value>+` emit equivalent `target` spans whose `data-value` is
the stated value and whose accessible name is `[d<sides>, <value>+]`.

The renderer recognises one whole notation token: it converts only when the
character immediately before it and the character immediately after it each
permit a token boundary, and the start and end of the inline string each
permit one. Every character except a Unicode letter, decimal digit,
underscore, colon or plus sign permits a boundary. A denied boundary leaves
the whole contiguous run as text:
`dice:6:2:3`, `target:6+5`, `xdice:6` and `dice:6x` all stay literal.
An unsupported side count, value, leading zero or malformed suffix remains
text.

The renderer converts notation in prose and link text alone. Link text includes
standard Markdown links and shortcut links. Obsidian wiki-link text converts
with or without an alias. The renderer leaves each destination unrecognised, and
the link parser keeps its established destination processing. Inline code,
fenced code, raw HTML element children and HTML attributes remain literal.

## Contract

### Definition of Done

- Rendered wiki text exposes the settled markup and accessible name for every
  accepted notation form.
- Wiki syntax documentation lists the grammar, accepted sides, value range,
  equivalent target forms and literal contexts.

### Regression Guardrails

- The server response contains the Dice span before client-side JavaScript runs.
- A literal context never gains a Dice span.

### Scenarios

```gherkin
Given prose containing dice:20
When the page renders
Then it contains <span class="dice" role="img" data-sides="20" data-value="20" data-kind="die" data-length="2" aria-label="[20]">20</span>
```

```gherkin
Given prose containing dice:6:2
When the page renders
Then it contains <span class="dice" role="img" data-sides="6" data-value="2" data-kind="result" data-length="1" aria-label="[2]">2</span>
```

```gherkin
Given prose containing target:6, target:6+, target:6:2 and target:6:2+
When the page renders
Then target:6 and target:6+ emit the same target span and accessible name
And target:6:2 and target:6:2+ emit the same target span and accessible name
And target:6:2 contains <span class="dice" role="img" data-sides="6" data-value="2" data-kind="target" data-length="1" aria-label="[d6, 2+]">2<span class="dice-plus">+</span></span>
```

```gherkin
Given standard, shortcut and Obsidian link text containing dice:6:2
When the page renders
Then the link text contains a result span
And each link destination resolves as it does without Dice notation
```

```gherkin
Given an unaliased Obsidian link [[dice:6]]
When the page renders
Then its visible link text contains a die span
And its href resolves as it does without Dice notation
```

```gherkin
Given inline code, a fenced code block or <em>dice:6:2</em>
When the page renders
Then the notation remains text
```

```gherkin
Given a raw HTML attribute whose value is dice:6:2
When the page renders
Then the attribute value remains exactly dice:6:2
```

```gherkin
Given prose reading Roll (yes it is a dice:6). And the dice result is target:6:2.
When the page renders
Then the d6 die and target faces render before their punctuation
```

```gherkin
Given prose containing dice:6:7 or dice:06
When the page renders
Then the notation remains text
```
