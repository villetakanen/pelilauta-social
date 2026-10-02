# Epic 165 Harness Proposals

The [audit](reports/2026-10-02-epic-165-audit.md) supplies the evidence for these proposals. Each proposal records its status below. Present and apply them individually after operator acceptance. Saving this queue does not amend the harness.

## H1: Establish the remaining implementation gap

**Status:** Accepted and applied to `AGENTS.md`.

**Target:** `AGENTS.md`, under `ALWAYS`.

The implementation replaced an existing Firestore query order and implemented viewport restoration before operator steering removed both. A repository-wide instruction reaches implementation agents that do not invoke `first-mate`.

Add this bullet after the existing prose instruction:

```diff
 - Conform prose to `docs/WRITING.md` and `docs/ARCHITECTURE.md` when writing documents, books, specs, or comments. Reference those files directly instead of restating their contents.
+- Before adding implementation, identify the remaining gap against the existing code. Check what the browser, framework, service, and existing components already provide; implement only the missing application behavior. A spec describes required outcomes, not a checklist of mechanisms to build.
```

This requires a baseline check before implementation. It does not require another document, approval exchange, test suite, or dependency investigation for an established primitive. It preserves the ability to add application-specific behavior when existing mechanisms do not provide it.

## H2: Bound tests to changed application scenarios

**Status:** Accepted and applied to `.claude/skills/app-e2e/SKILL.md`.

**Target:** `.claude/skills/app-e2e/SKILL.md`.

Replace the body below `# App E2E` with:

```markdown
Add a concise test for each application scenario the change adds or alters.
Name it after the scenario and use the smallest fixture and assertion set
that demonstrates the changed behavior. Existing scenarios gain no tests
solely because a spec now describes them.

Use browser tests when the browser integration is the behavior under test.
Use an existing unit-test path for application logic that needs no browser.
Do not duplicate the same claim across layers or test guarantees supplied
entirely by the browser, framework, or service.

Assert the application outcome. A test of live enhancement observes an
update; unchanged element counts do not establish that a listener started.
Reuse existing fixture and authentication helpers. Keep scenario prose in
the governing spec.

Declare browser fixtures in `e2e/reset-fixtures.mjs` and retain the checks
that restrict writes to `skaldbase-test`. Run browser scenarios through
`pnpm --filter pelilauta test:e2e`.
```

Seven changed scenarios can still warrant seven tests. The proposal limits duplication, setup, and platform verification rather than imposing a numerical ceiling. An application-selected link destination is testable even though the browser performs navigation.

## H3: Remove predetermined blame from run assessment

**Status:** Accepted and applied to `.agents/skills/assess-run/SKILL.md`, including removal of contradictory priors and revision of the report instructions.

**Target:** `.agents/skills/assess-run/SKILL.md`, description and `The one rule`.

Replace the description's final clause with `Produce an evidence-backed report distinguishing task interpretation, implementation choices, and repository or harness constraints.`

Replace `The one rule` and its paragraph with:

```markdown
## Attribute causes from evidence

Examine the operator request, execution record, implementation, and harness
without prescribing which caused the failure. Cite the instruction or action
supporting each finding. Distinguish verified events from inferred causes,
and identify missing evidence. An implementation mistake does not establish
a missing harness rule; a harness instruction does not establish that the
agent followed it.
```

The current rule excludes execution failure before the investigation starts. The replacement permits the audit to find either a harness defect or a failure to apply an adequate instruction. Review the remaining report instructions for contradictory wording as part of this same amendment; do not add a new assessment framework.

## H4: Permit proportionate delegation

**Status:** Withdrawn after operator review. No change was applied to `first-mate`.

**Target:** `.agents/skills/first-mate/SKILL.md`, opening paragraph. `.claude/skills/first-mate` links to that directory.

The proposed inline-work exception conflicted with the intended role: first-mate solely orchestrates. Its responsibility includes detecting scope drift and stopping delegated work that exceeds the brief or recreates supplied behavior. Delegation itself is not established as the cause of the drift.

The operator reports that the Claude Code/Opus 5.5 run also ignored existing subagent model-selection instructions. That is evidence of noncompliance with guidance, not evidence that the guidance was absent. The report distinguishes this account from events independently verified in source or execution records.

H1–H3 are the accepted harness changes for this cycle. Further first-mate scope checks and instruction-compliance investigation are recorded as lessons for later collation. Proceed to epic amendments without adding more harness requirements.

## Existing rules to apply without amendment

`docs/WRITING.md` already rejects comments that restate code and platform documentation. Do not add another writing rule or mandatory prose gate for this finding.

`next-task` already calls for the smallest useful increment and excludes independently shippable improvements. H1 makes the missing baseline check explicit; do not duplicate that instruction across every skill.

The audit supplies no basis for an arbitrary line-count limit, fixed maximum number of tests, new linter dependency, or universal ban on scrolling APIs, sorting, effects, or mocks. Review their purpose within the changed application behavior.
