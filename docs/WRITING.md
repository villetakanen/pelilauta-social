# Writing

Rules for every sentence in this repository: documents, specs, books, plans, comments,
commit messages. Templates own structure; skills own process; this file owns
sentences.

## Principles

1. **Only carrier.** Every sentence is the only carrier of what it says — about the
   repository, the application, its users or its environments. Test: delete the
   sentence; if the fact survives somewhere the reader would look — the sentence
   before, the code beside it, the platform's own documentation, general competence —
   it stays deleted.
2. **A why changes what the reader does.** State a why where the reader would
   otherwise do the wrong thing; state none the reader can derive. The why lives in
   the artifact that owns it: a capability's purpose in its spec, a decision's
   narrative in the commit message, an irreversible choice in an ADR.
3. **Write to the reader's next action, in their register.** A document for agents or
   developers instructs and avoids pronouns. A document for people using the product
   says "we". A principles book argues, and the argument is its content.
4. **A statement lives once**, in the file that owns it. Elsewhere, a pointer or
   nothing.

Failures of principle 1: a rationale the sentence itself implies; a platform fact
readable from the technology's documentation; a restated sentence; an aphorism; a
metaphor; a knowing aside. A failure of principle 2: "X, not Y" where Y is not a
mistake the reader would likely make.

## Mechanics

Adapted from the Google developer documentation style guide. Where the register above
disagrees with the guide, the register wins.

- Second person, imperative, for instructions.
- Present tense; no future tense for product behaviour.
- Active voice.
- One idea per sentence.
- No anthropomorphism: code does not want, know or care.
- No contractions in a book.

## Word list

Over the changed files, these return nothing:

```sh
grep -rnwE 'easy|simply|quick|just|please|leverage' <files>
grep -rniE 'note that|in order to' <files>
```

Extend the list when a correction recurs; an entry must stay grep-able.

## Ownership

| Artifact | Shape | Process |
| :--- | :--- | :--- |
| Spec | `specs/TEMPLATE.md` | `spec` skill |
| Book | `packages/design-system/books/templates/` | `design-system-book` skill |
| ADR | `docs/adrs/` | — |
| Comment | the code around it | — |
| Commit message | — | carries the implementation why |
