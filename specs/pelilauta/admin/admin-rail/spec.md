---
status: approved
---

# Admin Rail

## Blueprint

### Context

The navigation a reader reaches from anywhere inside administration. Every reader who
reaches it holds the tools, so the rail states the same entries for all of them.

### Architecture

An Astro component, `apps/pelilauta/src/admin/chrome/AdminRail.astro`, reached as
`@pelilauta/admin/chrome/AdminRail.astro`. It wraps `CnRail` and supplies its entries;
`../../../design-system/rail/spec.md` and `../../../design-system/chrome-actions/spec.md`
govern everything about how they are drawn, placed and behave.

Nothing in the body depends on the session, because the guard has already settled it.
Only the footer's inbox and identity are islands.

### Constraints

| Entry | Leads to | Stands |
| :--- | :--- | :--- |
| Ylläpito | administration's front page | below `--cn-breakpoint-small`, where the bar cannot carry it |
| Forum Administration | the forum's channels and topics | always |
| Social Media Poster | what Pelilauta posts elsewhere | always |
| Site Activity | what the sites are doing | always |
| User Management | who holds an account | where the environment shows the developer tools |
| Snackbar Test | the snackbar utility | where the environment shows the developer tools |

A developer tool is absent where the environment does not show the tools, as its page is
absent there: `../spec.md`.

The entry leading to the front page carries the application's name, which translates. The
tool entries carry the words v18 gave them, in English, in both locales; translating those
is a decision about the product's language, not about this rail.

The rail's footer carries Pelilauta, the reader's inbox and their identity.

## Contract

### Definition of Done

- A reader inside administration reaches every tool from any page of it.
- The rail states which tool the reader is on.

### Regression Guardrails

- The rail states no measurement, responsive rule or interaction of its own beyond the
  entry the bar cannot carry; those are the design system's.
- No entry of the rail reads the session.

### Scenarios

```gherkin
Given a reader running one administrative tool
When the rail renders
Then that tool is the current entry
```
