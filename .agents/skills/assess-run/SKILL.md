---
name: assess-run
description: Investigate a run that required excessive turns, required operator arbitration, or failed to converge. Produce a root-cause report identifying repository artifacts and harness constraints that directed execution, treating agent actions as expected symptoms rather than faults.
---

# Assess Run

When a run requires excessive turns, requires operator arbitration, recalculates values unnecessarily, or oscillates between values, produce a root-cause report. The report identifies repository artifacts that directed execution to guide harness changes.

## The one rule

Agent reasoning and actions are neither the subject of analysis nor the source of error. Treat every agent action as the expected output of the analyzed harness. A finding never asserts that the agent erred or should have known better. When an action appears incorrect, name the repository artifact that prompted that action. An agent that creates a redundant token, challenges a gate, or halts prematurely executes the behavior dictated by the artifacts read during the run.

## Run it from outside

Do not assess a run from within the session that executed it. When invoked inside the analyzed session, delegate the assessment to a fresh subagent. Provide the subagent with the session transcript and repository access to identify repository causes.

## What steers a run

Examine the artifacts that directed agent execution and cite each artifact at `file:line`:

- **Skills under `.claude/skills/` and `.agents/skills/`:** Identify assumed execution modes, omitted procedures, and halt criteria.
- **`CLAUDE.md` and `CLAUDE.local.md`:** Identify gates, prohibitions, and boundary constraints.
- **Specs under `specs/`:** Identify contracts that constrained resolution, values defined in specs that code governs, and rules interpreted broader than written.
- **Generated pipelines and header banners:** Identify uneditable pipeline definitions that prevent direct modification during execution.
- **Memory files and `docs/lessons/`:** Identify recorded corrections not yet integrated into the relevant skill or spec.

## Priors the report carries

- A spec modification captures lessons from execution. When harness rules gate, impede, or halt a spec modification, record that constraint as a finding rather than an agent error.
- A spec carries purpose and system roles. Code defines concrete values. A spec that defines procedural steps, numeric measurements, or style values duplicates code, and drift in those values constitutes a finding.
- Code is the canonical source for rendered output. Do not fault an agent for resolving ambiguity against source code.

## The report

Write the report to `docs/reports/YYYY-MM-DD-<slug>.md`, conforming to `docs/WRITING.md`. Structure the report using these sections:

- **Task as set:** State the operator request using the framing of the prompt rather than the framing adopted during execution.
- **Summary:** Summarize the run outcome and execution profile in one paragraph.
- **Findings:** Group findings by artifact with one entry per artifact cited at `file:line`. For each entry, state what the artifact caused the agent to expect and the turns or arbitration it incurred. Order findings by impact on the run.
- **What would have made it cheap:** Identify the repository changes that would have enabled direct execution.
- **Recommendations:** List concrete modifications, naming each target file.
- **Verified, and inferred:** Distinguish facts verified in the repository from behaviors inferred from the transcript.

Run the `docs/WRITING.md` word-list greps over the generated report and resolve all matches.
