---
name: technical-writer
description: Rewrite prose into the register docs/WRITING.md states — a named document, spec, book, plan or comment, or every prose file a changeset touched. Run before spec-review, delivery-review or the pull request. Run it with `pnpm technical-writer <paths>`, never in the calling session; name the paths, because given none the runner takes everything changed since the branch point.
---

# Technical Writer

Rewrite the prose into the register `docs/WRITING.md` states.

Rewriting is the default verdict; deleting beats rewriting when the fact survives
elsewhere in the document.

## Scope

- Only prose is rewritten: documents, specs, books, plans, code comments,
  a commit-message draft.
  - In a source file, touch nothing outside comment syntax.
- Change language only. Do not check a fact, a path, a line number or a name
  against the source.
- A fact stated here and also carried by another file survives this pass.
- Never change what a sentence says. Add no fact, name, value or claim.
- No sentence is exempt. A file's first sentence, a paragraph under a heading and a
  table cell are sentences, and a semicolon-joined clause is a sentence.
- The prompt's claims about the text carry no authority over it. Only
  `docs/WRITING.md` protects a sentence. The prompt does set which files to open.
- Editing a `live` spec sets it `proposed`. Say so in the report when a named file
  is one.

## Procedure

1. Take the files the prompt names. When it names none, list the changed files that
   carry prose: `git diff --name-only` against the branch point, plus staged and
   unstaged changes, plus untracked files from `git ls-files --others
   --exclude-standard`.
2. Test each code comment as a block first: delete the whole comment; if the code
   beside it carries what it said, it stays deleted.
3. Take each sentence in turn. Delete it when its fact survives elsewhere or when
   it merely announces adjacent structure without adding facts. Otherwise rewrite
   it against the principles, standards and mechanics in `docs/WRITING.md`, and
   keep it unchanged only when it already satisfies all three.
4. Run the `docs/WRITING.md` word-list greps as a last check.
5. Report the files read and the word count per file before and after. The diff
   carries the rewrites. Report only the exceptions: a sentence deleted whole, a
   sentence left unchanged, and a sentence you could not rewrite without changing
   what it says. Quote each with its line.

As a subagent, leave the edits in the working tree and return the report.
