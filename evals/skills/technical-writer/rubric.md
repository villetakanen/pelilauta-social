# Technical Writer Evaluation Rubric

## Deterministic Checks
1. **Forbidden Words & Phrases:** Must contain 0 instances of:
   - `easy`, `simply`, `quick`, `just`, `please`, `leverage`
   - `note that`, `in order to`
   - `'s own`, `their own`
2. **Grammar & Voice:**
   - Active voice throughout (no "by the user", "is managed by").
   - 0 sentence fragments (e.g. "Which notifications have been read by the user, and which have not" must be deleted or rewritten into a complete sentence).

## Quality Standards (docs/WRITING.md)
1. **Information Density:**
   - Introductory placeholder sentences (e.g. "The following table lists...") are deleted.
   - Symmetric tautologies ("which are X, and which are not") are removed or consolidated.
2. **Complete & Assertive:**
   - Sentences directly assert facts without conversational meta-commentary.
3. **No Anthropomorphism / Literary Drift:**
   - Code/components do not "manage their own lifecycle" or have feelings/intentions.
