---
name: assess-run
description: Investigate a run that required excessive turns, required operator arbitration, or failed to converge. Produce an evidence-backed report distinguishing task interpretation, implementation choices, and repository or harness constraints.
---

# Assess Run

When a run requires excessive turns, requires operator arbitration, recalculates values unnecessarily, or oscillates between values, produce a root-cause report.

## Attribute causes from evidence

Examine the operator request, execution record, implementation, and harness
without prescribing which caused the failure. Cite the instruction or action
supporting each finding. Distinguish verified events from inferred causes,
and identify missing evidence. An implementation mistake does not establish
a missing harness rule; a harness instruction does not establish that the
agent followed it.

## Run it from outside

Do not assess a run from within the session that executed it. When invoked inside the analyzed session, delegate the assessment to a fresh subagent. Provide the subagent with the session transcript and repository access.

## What steers a run

Compare the operator request and recorded actions with the following artifacts. Cite repository evidence at `file:line` and execution evidence by turn or event:

- **Skills under `.claude/skills/` and `.agents/skills/`:** Identify assumed execution modes, omitted procedures, and halt criteria.
- **`CLAUDE.md` and `CLAUDE.local.md`:** Identify gates, prohibitions, and boundary constraints.
- **Specs under `specs/`:** Identify contracts that constrained resolution, values defined in specs that code governs, and rules interpreted broader than written.
- **Generated pipelines and header banners:** Identify uneditable pipeline definitions that prevent direct modification during execution.
- **Memory files and `docs/lessons/`:** Identify recorded corrections not yet integrated into the relevant skill or spec.

## The report

Write the report to `docs/reports/YYYY-MM-DD-<slug>.md`, conforming to `docs/WRITING.md`. Structure the report using these sections:

- **Task as set:** State the operator request using the framing of the prompt rather than the framing adopted during execution.
- **Summary:** Summarize the run outcome and execution profile in one paragraph.
- **Findings:** Group findings by supported cause. Cite the request, action, implementation, or artifact supporting each finding and state its observed impact. Order findings by impact on the run.
- **What would have made it cheap:** Identify the changes to task interpretation, execution, or guidance that would have enabled direct execution.
- **Recommendations:** Recommend corrections supported by the findings. Name target files when proposing repository edits; do not require an edit for every finding.
- **Verified, and inferred:** Distinguish facts verified in the repository from behaviors inferred from the transcript.

Run the `docs/WRITING.md` word-list greps over the generated report and resolve all matches.
