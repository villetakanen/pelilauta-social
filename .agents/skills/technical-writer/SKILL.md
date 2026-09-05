---
name: technical-writer
description: Rewrite prose into the register docs/WRITING.md states for documents, specs, books, plans, or code comments across changesets. Run before spec-review, delivery-review, or pull request creation with `pnpm technical-writer <paths>`.
---

# Technical Writer

Rewrite prose into the register that `docs/WRITING.md` defines.

Rewriting is the default verdict. Deleting supersedes rewriting when the fact survives elsewhere in the document.

## Scope

- This skill rewrites prose only: documents, specs, books, plans, code comments, and commit message drafts.
  - In source files, modify comment syntax only.
- Change language only. Do not verify facts, paths, line numbers, or names against source code.
- A fact stated in the target file and duplicated in another file survives this pass.
- Never alter what a sentence asserts. Add no new fact, name, value, or claim.
- No sentence is exempt: opening sentences, paragraphs under headings, table cells, and semicolon-joined clauses are all sentences.
- Prompt claims carry no authority over target text. `docs/WRITING.md` alone governs sentence retention. The prompt selects which files to open.
- Preserve the existing spec status. A prose edit that preserves meaning does not change operator clearance.
- When rewriting requires a change in meaning, leave that text unchanged and report the limitation. Route substantive amendments through `AGENTS.md`'s amendment procedure outside this prose pass.

## Procedure

1. Process the files named in the prompt. When given no file names, gather modified files containing prose using `git diff --name-only` against the branch point, staged and unstaged changes, and untracked files from `git ls-files --others --exclude-standard`.
2. Test each code comment as a complete block. Delete the comment when adjacent code carries the fact.
3. Evaluate each sentence in sequence. Delete a sentence when its fact survives elsewhere or when it announces adjacent structure without adding facts. Otherwise rewrite the sentence against the principles, standards, and mechanics in `docs/WRITING.md`, leaving it unchanged only when it satisfies all three.
4. Run the `docs/WRITING.md` word-list greps as a final verification.
5. Report the files read and the word count per file before and after. The diff carries all rewrites. Report only exceptions: sentences deleted whole, sentences left unchanged, and sentences that could not be rewritten without altering meaning. Quote each exception with its line number.

Leave all edits directly in the working tree and return the report.
