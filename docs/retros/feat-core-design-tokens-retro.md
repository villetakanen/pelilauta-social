# feat/core-design-tokens Retrospective

Status: In progress

## Loop Summary

This retrospective accumulates observations during the core-design-tokens delivery loop. Outcomes, verification evidence, writeback decisions, and the close decision will be completed after the final acceptance issue.

## Findings

### 1. No Repository Issue Template

The epic was decomposed into 21 delegated GitHub issues, but the repository had no issue template for a PBI handoff.

The first issue set therefore established a manual structure containing objective, scope, exclusions, acceptance evidence, delivery dependency, and the linked epic plan. This structure should be validated through actual delegated work before it is encoded under `.github/ISSUE_TEMPLATE/`.

Candidate writeback: create a project issue template after at least one issue has completed the full delegate, review, correction, and acceptance cycle.

### 2. Assigned GitHub Issue Was Not Loaded

A delegated Antigravity agent did not realize that implementation tasks had already been defined as GitHub issues. The handoff relied on external tracker state without making the assigned issue required session context.

The durable rule should not require agents to scan every open issue. Delegation should explicitly name the assigned issue, and the agent should read that issue and its linked plan/spec before editing.

Candidate writeback: after the first delegated PBI validates this workflow, add one short root `AGENTS.md` rule stating that an explicitly assigned issue and its linked artifacts are mandatory implementation context. Keep issue discovery and assignment in the delegation prompt.

## Candidate Writebacks

| Learning | Destination | Gate |
| --- | --- | --- |
| Reusable delegated-PBI structure | `.github/ISSUE_TEMPLATE/` | Validate through one accepted delegated delivery cycle |
| Assigned issues are mandatory context | Root `AGENTS.md` and delegation prompt | Confirm explicit assignment works without broad tracker scanning |
