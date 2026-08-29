# Next-Task Evaluation Rubric

## Deterministic Format Checks
1. **Paragraph Count:** Output must contain exactly 3 unbulleted paragraphs separated by single blank lines.
2. **Paragraph Headers:**
   - Paragraph 1 starts with `Task: `
   - Paragraph 2 starts with `Rationale: `
   - Paragraph 3 starts with `Risks: `
3. **Character Length Constraints (excluding the header prefix):**
   - `Task`: 1 to 73 characters
   - `Rationale`: 1 to 221 characters
   - `Risks`: 1 to 221 characters
4. **Placeholder Noun Ban:** Must contain 0 instances of:
   - `ownership`, `capability`, `contract`, `boundary`, `surface`, `slice`
5. **No Intro/Outro:** Must contain no greeting, introduction, commentary, or conclusion outside the three paragraphs.

## Qualitative Evaluation
1. **Atomic & Deliverable:** The proposed task delivers immediate value and can be tested and merged in one step.
2. **Concrete Comparison:** Rationale states why now compared to alternatives.
3. **Actionable Risk:** Risks states specific failure modes or states that no material risk exists.
