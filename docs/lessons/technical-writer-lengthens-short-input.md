---
name: technical-writer-lengthens-short-input
branch: feat/21-rc2
date: 2026-09-10
---

**Context:** `pnpm technical-writer specs/pelilauta/sites/settings/theming.md`, run three
times on a spec the operator had already cut to short sentences.

**What happened:** The runner made short text longer. `theming.md:14`, "A `client:only` CSR
island: `<path>`.", became "The section renders as a `client:only` CSR island in `<path>`."
The clause "A poster restyles the whole document around it, so it gets a document of its own"
became "Because a poster restyles the surrounding document, the preview isolates the poster in
a dedicated document." A one-line guardrail grew by nine words. In the same runs it deleted a
duplicated reload sentence correctly.

**Suspected why:** Step 3 of `.claude/skills/technical-writer/SKILL.md:28` tells the writer to
rewrite every sentence that does not satisfy all three of principles, standards and mechanics,
and a fragment or a plain "X, so Y" reads as failing a standard, so it gets rewritten upward.

**Fix:** Add one sentence to step 3: "A rewrite has no more words than the sentence it
replaces; when the shorter form is already correct, leave it unchanged and do not list it as
an exception."
