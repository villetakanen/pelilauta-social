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

### 3. Root Lefthook Gates Are Missing

Commits succeeded with `Can't find lefthook in PATH`, confirming that the repository has neither a reliably available root Lefthook executable nor root-owned hook rules. The imported application still declares Lefthook and a nested `postinstall`, but hook ownership is not established at the workspace root.

The desired commit, push, and pull-request gates need one coherent repository policy implemented at the correct enforcement points:

- Root Lefthook `pre-commit` runs the smallest fast, non-mutating checks appropriate for a commit.
- Root Lefthook `pre-push` runs the approved broader local test/check gate.
- GitHub CI and branch protection enforce pull-request checks; a local Git hook cannot guarantee PR policy.
- Root package setup makes the pinned Lefthook executable available without relying on a global installation or nested package lifecycle behavior.

Candidate writeback: after root test, non-mutating check, and CI commands exist, add root-owned Lefthook configuration and align its commands with required GitHub checks. Remove nested ownership ambiguity in the same bounded tooling PBI.

### 4. Deterministic Gate Policy Is Undefined

The epic asks agents to add root test, non-mutating check, CI, and later Lefthook gates, but the repository does not explain the intended gate model. There is no durable practice describing which checks run during authoring, commit, push, pull request, deployment, or human acceptance; which commands may modify files; or why local and remote gates differ.

This left issue #6 to infer both command names and policy from one mutating legacy script. In particular, a non-mutating Biome command only has clear value when tied to a verification boundary such as local CI parity, pre-push, or pull-request enforcement. A separate explicit write command serves the authoring/fix workflow.

The intended model should distinguish:

- Authoring commands may apply deterministic fixes and always require diff review.
- Verification commands report drift and fail without modifying the worktree.
- Commit gates stay fast and operate on the smallest relevant scope.
- Push gates run broader local verification.
- Pull-request gates run the authoritative deterministic CI set from a clean checkout.
- Deployment smoke checks and human acceptance cover behavior that static gates cannot establish.

Candidate writeback: validate the model through issues #6 and #7, then document it in a focused engineering verification practice or tooling spec. Root `AGENTS.md` should contain only the stable requirement to use repository-defined gates and treat failures as blockers, with detailed command ownership referenced rather than duplicated.

### 5. Netlify Smart Detection Rejected A Public Client Key

Opening the draft epic PR activated the Netlify deploy-preview gate and exposed a deployment configuration gap. The build generated the intentionally public Firebase API key into client and SSR bundles. Although `SECRETS_SCAN_OMIT_KEYS=PUBLIC_apiKey` was configured, Netlify's separate smart-detection scanner still classified the `AIza`-shaped value as a potential secret and failed the deploy preview.

The failure validates keeping Netlify as an independent deployment gate, but also shows that a configured standard secret-scan omission does not imply smart-detection parity. Public client values require a narrow smart-detection safelist; secret scanning itself should remain enabled.

Candidate writeback: update the Netlify runbook with the distinction between environment-secret scanning and smart detection, record the narrow public-value safelist procedure without values, and verify both production and deploy-preview contexts after configuration changes.

### 6. Skills Were Planned Into A Tool-Specific Directory

The epic planned the three project skills under `.opencode/skills/`, binding tool-agnostic markdown artifacts to one agent product even though the repository is worked on with several agent tools and none of them is privileged.

The corrected layout keeps one canonical copy per skill under `.agents/skills/<name>/SKILL.md` and gives each configured tool the smallest discovery adapter it needs. Claude uses relative symlinks; OpenCode registers `.agents/skills` once through `opencode.json` instead of maintaining one symlink per skill. The skill content stays on the shared frontmatter subset (`name`, `description`) so a single file remains valid across tools. Claude Code discovered `ds-spec-writer` through its symlink, and `opencode debug skill` discovered all four canonical skills through the configured path.

Issues #8, #9, and #15 and the epic plan were amended to use the canonical skill directory and tool-appropriate discovery adapters before the remaining skill PBIs start.

Candidate writeback: record the canonical-skill-plus-adapter layout as the durable convention after restarted sessions verify trigger behavior, and amend the remaining skill PBIs and plan sections before they are delegated.

### 7. The First Skill Draft Was Principle-Heavy And Procedure-Light

Review of `ds-spec-writer` found a concise boundary and useful spec-anchored principles, but little ordered procedure for loading context, selecting a mode, producing the artifact, validating it, and handing adjacent work to another skill. Abstract guidance such as treating specs as hypotheses did not tell the executing agent what to do next, while an overly strict verification rule incorrectly excluded explicit human acceptance criteria.

A proposed meta-skill supplied the useful correction: define exact triggers, outputs, neighboring handoffs, affirmative targets, and optional external assets before writing instructions. Its original language was itself somewhat abstract and implied creating supporting directories unconditionally, so the persisted version was reduced to concrete steps and creates `references/` or `scripts/` only when they contain necessary material.

The complete proposal also mandated one exact template and a root `.agent-state.json` update after every execution. Those mechanisms were not adopted: skill shapes need to follow workflow complexity, and an unowned shared state file would become stale, create merge contention, and duplicate issue/session state. The persisted meta-skill reports handoff through the active task unless the repository later defines a state contract.

Candidate writeback: use `.agents/skills/meta-skill-architect/SKILL.md` to revise `ds-spec-writer`, then validate one positive trigger, one neighboring non-trigger, and discovery through both configured tools before accepting either skill convention as durable.

## Candidate Writebacks

| Learning | Destination | Gate |
| --- | --- | --- |
| Reusable delegated-PBI structure | `.github/ISSUE_TEMPLATE/` | Validate through one accepted delegated delivery cycle |
| Assigned issues are mandatory context | Root `AGENTS.md` and delegation prompt | Confirm explicit assignment works without broad tracker scanning |
| Commit, push, and PR gates have root ownership | Root Lefthook configuration, root package setup, GitHub CI, and branch protection | Root test/check commands and minimal CI exist and pass |
| Deterministic gate purpose and ownership are explicit | Focused engineering verification practice or tooling spec, referenced briefly from root guidance | Validate command boundaries through issues #6 and #7 before documenting them as durable policy |
| Netlify secret-scan modes and public-value safelisting are explicit | Netlify deployment runbook | Deploy preview passes with standard and smart secret scanning still enabled |
| Skills live in canonical `.agents/skills/` with minimal per-tool discovery adapters | Plan skill sections, issues #9 and #15, and a short layout note where skills are documented | Claude and OpenCode discover the same canonical skills and pass trigger tests after restart |
| Skill authoring starts from triggers, outputs, procedure, and handoffs | `.agents/skills/meta-skill-architect/SKILL.md` | Revise and successfully trigger `ds-spec-writer` without activating it for implementation or docs-page work |
