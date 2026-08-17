# Writing

Rules for every sentence in this repository: documents, specs, books, plans, comments,
commit messages. Templates carry structure; skills carry process; this file carries
sentences. The style derives from the
[Google developer documentation style guide](https://developers.google.com/style);
rules in this file take precedence.

## Principles

1. **Only carrier.** Every sentence is the only carrier of what it says — about the
   repository, the application, its users or its environments. Test: delete the
   sentence; if the fact survives somewhere the reader would look — the sentence
   before, the code beside it, the platform's documentation, general competence —
   it stays deleted.
2. **A why changes what the reader does.** State a why where the reader would
   otherwise do the wrong thing; state none the reader can derive. The why lives in
   the artifact that carries it: a capability's purpose in its spec, a decision's
   narrative in the commit message, an irreversible choice in an ADR.
3. **Audience register.** A document for agents or developers instructs and avoids
   pronouns. A document for people using the product says "we". A principles book
   argues, and the argument is its content.
4. **Canonical source.** A fact is defined once, in the file that carries it.
   Elsewhere, a reference or nothing.

Failures of principle 1: a rationale the sentence itself implies; a platform fact
readable from the technology's documentation; a restated sentence; an aphorism; a
metaphor; a knowing aside. A failure of principle 2: "X, not Y" where Y is not a
mistake the reader would likely make.

## Mechanics

Follow the Google guide by default. Where the principles above disagree with it, the
principles win.

- Second person, imperative, for instructions.
- Active voice, present tense; no future tense for product behaviour.
- One idea per sentence.
- No anthropomorphism: code does not want, know or care.
- Plain language; no colloquialisms or figurative metaphors.
- No contractions in a book.
- *Owner* names an access-control role: a person on an entity's `owners` list,
  holding full rights to it. Use the word for that fact only. Any other relation
  between a person and a thing gets its name — author, member, their inbox, a page
  about them. Artifact responsibility is *carries* or *governs*, not *owns*.

## Word list

Over the changed files, these return nothing:

```sh
grep -rnwE 'easy|simply|quick|just|please|leverage' <files>
grep -rniE 'note that|in order to' <files>
grep -rnE "'s own|their own" <files>
```

Extend the list when a correction recurs; an entry must stay grep-able.

## Carriers

| Artifact | Shape | Process |
| :--- | :--- | :--- |
| Spec | `specs/TEMPLATE.md` | `spec` skill |
| Book | `packages/design-system/books/templates/` | `design-system-book` skill |
| ADR | `docs/adrs/` | — |
| Comment | the code around it | — |
| Commit message | — | carries the implementation why |

---

Portions of this guide adapt work created and shared by the
[Google developer documentation style guide](https://developers.google.com/style),
used according to the
[Creative Commons 4.0 Attribution License](https://creativecommons.org/licenses/by/4.0/).
