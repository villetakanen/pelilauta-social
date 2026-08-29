# Spec-Review Evaluation Rubric

## Required Defect Findings
An effective adversarial review of `fixture.md` must catch:
1. **Forbidden Words & Quality Violations:**
   - Catches `leverage`, `very versatile`.
   - Catches improper use of "owned" / "ownership" outside ACL role.
2. **Missing Architectural Precision:**
   - Flags missing token specifications, component naming conventions, and layout rules.
   - Flags missing data schema or boundary definitions.
3. **Vague Constraints:**
   - Flags "look good and have proper spacing" as untestable and lacking token references.
4. **Missing Acceptance Scenarios:**
   - Flags the complete absence of Gherkin / BDD behavioral acceptance scenarios.
