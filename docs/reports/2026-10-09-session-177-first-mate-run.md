# Assessment: session consistency run (#178, #179, #180) under first-mate

Transcript: `~/.claude/projects/-Users-ville-takanen-dev-pelilauta-social/dffec624-27d6-48cd-b573-8fd38322cfcd.jsonl`. Event numbers below are JSONL line indexes in that file.

## Task as set

After `/clear` the operator wrote "next task" (event 6). The `next-task` skill ran and proposed #178. The operator asked whether a spec was needed (event 89), then wrote "you are the first mate; our first task is to review the spec, done by astra-high, before we approve it and start the work" (event 104). Later instructions: "fixed to live, read it, implement. where spec and 178 disagree, spec wins" (181); "dev server is running, add the two e2e tests" (418); "commit and push" (639); "close 178 and propose the next task" (692); "initial on failed cleanup. go" (752); "lets discuss on why logout matters. ask questions" (860); "cleared, go" (1120); "Try again copy, commit and push" (1190).

## Summary

The run delivered two commits on `feat/21-2`: `dd7e5fc8` (#178) and `2ef3f5b1` (#179, #180), and closed three issues. It took roughly 1,245 transcript events, 109 Bash calls and 9 subagent launches. Four operator corrections or redirections changed the course: the spec Context interview (860), the legacy-path remark (724), the prose complaint (1052) and the logout order discussion (886-900). About 55% of the tool calls went to two segments: the logout spec amendment (32 calls, events 752-1120, three critic passes plus a writer pass) and the e2e tests (30 calls, events 418-639, mostly locating the dev server). The code work itself converged on the first implementation attempt each time. The spec work did not, because the draft behavior was settled before the operator's purpose was known.

## Findings

### 1. The logout spec was drafted from a decision taken before the purpose and the order were examined

- At 750 the first mate asked one question, "error or initial after a failed cleanup", and framed it from #180's wording. The operator answered `initial` (752).
- The draft brief (757) recorded that answer as "settled", together with "attempt both operations regardless of the other" taken from #180.
- At 860 the operator asked for a discussion of why logout matters, and answered "shared computers mostly; logout is a privacy promise" (867). That answer made both settled decisions wrong. The first mate then found that cookie-first order with stop-at-first-failure and `error` state fit the promise (891, 898). The operator accepted (893, 900).
- Impact: the first draft, its critic pass (795), the listener-guard edits (811-858) and the rewrite (943) were spent on text that the final spec replaced. The spec skill carries the rule this would have satisfied: "Before settling Context, interview the human regarding product priorities" (`.claude/skills/spec/SKILL.md`, Recording Intent; present in `HEAD`). The first mate delegated the draft without running that interview. The operator had to start it.
- Attribution: a first-mate sequencing choice. The skill text did not stop it, because `.claude/skills/first-mate/SKILL.md:30-32` says "Delegate amendments through the procedure in `AGENTS.md` and the `spec` skill" and the first mate relied on the subagent to run the interview. A subagent cannot interview the operator.

### 2. The writer pass ran after the critics, and the prose reached the operator unrevised

- The working-tree `spec` skill reads "Before presenting a proposed spec change, run technical-writer and spec-review" (`.claude/skills/spec/SKILL.md:29`, via the symlink to `.agents/skills/spec/SKILL.md`). The `technical-writer` skill says to run it "before spec-review" (`.claude/skills/technical-writer/SKILL.md:3`). That edit was uncommitted at session start (`git status` in the session context shows ` M .agents/skills/spec/SKILL.md`), and `HEAD` carries only step 9 ("run the spec-review skill").
- The first mate ran no writer pass before the three critic passes (134, 795, 944, 1046) or before presenting the Logout section at 1050. The operator then wrote "that language is pure manneristic slop ... Suggest running tech-writer before you propose these to me" (1052). The first mate ran `pnpm technical-writer` in the background at 1059, which complies with `CLAUDE.local.md` (the runner, not a subagent).
- The writer rewrote the whole file (155 insertions, 38 deletions) after the last critic pass had reviewed the pre-writer text. The first mate hand-corrected three of its changes (1118), and the spec went to `live` without a critic pass over the final text.
- Impact: one operator correction, one wasted critic pass (the last one reviewed text that no longer exists), and a `live` spec whose final wording no independent reviewer read. Whether the first mate saw the uncommitted skill line is not recorded; no event shows it reading `.claude/skills/spec/SKILL.md` itself. The brief at 757 names the skill for the subagent to read.
- Attribution: the instruction existed in the working tree and was not followed. The order rule exists in two skills that the first-mate skill does not mention.

### 3. The session spec grew from 0 to 371 lines against a stated 100-line target

- `git show dd7e5fc8:specs/pelilauta/session/spec.md` is 254 lines. `2ef3f5b1` is 371 lines. The other `specs/pelilauta/*/spec.md` files range from 53 to 147 lines.
- The working-tree `spec` skill says "Aim for 100 lines per spec; above 120, review scope and duplication" (`.claude/skills/spec/SKILL.md:25`), also uncommitted at session start. The memory note "Specs are drifting toward too much detail" records the same operator preference. The brief at 757 repeated the preference ("write less") but no event measures the spec size, and the first mate cleared a 371-line spec.
- Impact: three review rounds over a long spec, and each round found more internal duplication (the Mermaid diagram plus prose restating it, a table plus Definition-of-Done items restating it; critic findings at 858 and 1005). The size was not raised to the operator as a decision.
- Attribution: unverified whether the first mate read the 100-line line. The rule was not committed, so the repository on `main` carries no size limit.

### 4. The e2e segment lost about 30 calls to locating the dev server

- The operator said "dev server is running" (418). The Playwright config defaults to `http://localhost:4321` (`apps/pelilauta/playwright.config.ts:35`). The server ran on 4328 (event 460), with a second node process on 4324 that was not the app (454).
- The first run failed with `ERR_CONNECTION_REFUSED` (440); three events found the port. The server on 4328 then returned HTTP 500 on every page except `/login` (532-555), and the first mate started its own server on 4410 (556) and ran the work there.
- It then wrote a throwaway `e2e/zz-debug.spec.ts`, registered it in `playwright.config.ts` (482), and added and removed `console.log` probes (584, 595) to understand one flake in the repair test. The flake traced to the login flow POST that precedes the reload (601-608). The debug file does not appear in the commit.
- Impact: about 215 events and 30 tool calls for two tests. The 500 on 4328 is a stale dev server state that nobody read the cause of (the first mate stated it was "the running server's state, not the code", an inference from one clean restart).
- Attribution: neither `.claude/skills/app-e2e/SKILL.md` nor `apps/pelilauta/e2e/README.md` states how to discover or choose the dev server port or when the suite starts its own. `delivery.yaml:45-50` defines `app-e2e` as `pnpm --filter pelilauta test:e2e`, which the first mate used only at the end (619, 1162) with `BASE_URL` set.

### 5. No e2e test accompanies the new logout scenarios

- `.claude/skills/app-e2e/SKILL.md` says "Add a concise test for each application scenario the change adds or alters" and "Use an existing unit-test path for application logic that needs no browser." The spec amendment added seven logout scenarios, and the implementation added `apps/pelilauta/test/stores/session-logout.test.ts` (unit tests). For #178 the operator asked for e2e tests (the first mate had asked and offered at 415), and the first mate added two. For #180 it ran the existing suite and reported that one existing scenario ("a reply subscription terminates on sign-out") passes through the new `logout()` (1409). It did not state whether a logout e2e is warranted.
- Impact: a possible gap, not a defect. The skill's unit-test clause may cover it. No operator decision is recorded.

### 6. The first-mate delegation worked, with costs from sequential briefing

- Verified: both parallel implementation launches (215, 216; 757, 758) split by file with a "do not touch" line, and the first mate reviewed the diff against source (a real defect was found and fixed at 286: a failed `getIdToken()` signed the reader out). Critic briefs carried paths and the mandate only, as `.claude/skills/spec-review/SKILL.md` (Independence) requires; the report at 169 states this.
- The operator's instruction "review the spec, done by astra-high" (104) named a reviewer. The first mate used a `general-purpose` sonnet subagent (134). The repository has no definition of "astra-high" (grep found none), so the substitution may be correct or may have ignored an instruction. The transcript contains no question about it.
- `.claude/skills/first-mate/SKILL.md:41` ("If subagents or conversation loops, or stalls - log a lesson note prudently") produced no note. The e2e segment and the spec rewrite loop were not logged. The first mate did file one ticket the operator asked for (#206, event 964) and one issue comment (#181, 1183).

### 7. Smaller observations

- The legacy-path remark (724): the operator asked whether the session store belongs under `base/`. The first mate recommended an 81-file move; the operator declined ("we should not over extend here", 745). AGENTS.md names only `src/components` as legacy (verified in `CLAUDE.md`). The first mate offered a refactor the written rules did not require, which cost one round.
- The first mate declined to run the writer on `CHANGELOG.md` entries because it rewrites whole files (1219). That judgment matches the memory note "Technical-writer rewrites whole files". The entries therefore skipped the register gate this session.
- The version bump to `21.1.3` as a patch was stated and offered for override (690). It matches the AGENTS.md rule for a release without a feature.
- `.agents/skills/spec/SKILL.md` remained modified in the tree throughout. The first mate reported it and left it out of the commit (1206), which matches the memory note "Tree changes are not mine to revert".

## What would have made it cheap

- Interview before draft. For #180 the interview at 860-867 (who logs out, what the reader believes, the worst outcome) would have produced "shared computers, privacy promise", which leads directly to cookie-first order and stop-at-first-failure. The amendment would have needed one critic pass.
- Writer first, critics second, one round each. Running `pnpm technical-writer` on the draft before the first critic removes the prose complaint and puts the critic on final text.
- A size check at draft time. A 371-line spec for one capability is outside the 100-line target; a split or cut before review shortens every later round.
- A stated dev-server contract for e2e: either `pnpm --filter pelilauta test:e2e` starts its own server on a fixed port, or `e2e/README.md` states how to point `BASE_URL` at a running one and how to check that the server serves the app.

## Recommendations

1. Commit the `spec` skill edit (`.agents/skills/spec/SKILL.md`), then add one sentence to `.claude/skills/first-mate/SKILL.md` stating that the first mate runs the Context interview with the operator before delegating a spec draft, and runs `pnpm technical-writer` before `spec-review`. Both rules exist; the first-mate skill cites neither. The operator decides whether to apply this change, since the uncommitted skill edit may be in progress.
2. Settle whether the 100-line target belongs in `specs/TEMPLATE.md` or the `spec` skill, and whether the 371-line session spec splits (for example Logout as a child spec; the skill allows "child specs, preserving requirements, review status, and incoming links").
3. Add the dev-server discovery rule to `apps/pelilauta/e2e/README.md` (port, `BASE_URL`, a one-line check such as requesting `/` before running). The `app-e2e` skill carries process only and need not change.
4. Decide whether the operator-named reviewer "astra-high" has a definition. If it names an agent configuration, record it where the first-mate skill can find it; if it is an alias for a model tier, say so in the first-mate skill.
5. Log lesson notes under `docs/lessons/` for findings 1 and 2 if the operator wants them (`first-mate/SKILL.md:41` asks for a note on a loop; none was written).

## Verified, and inferred

Verified in the repository:
- `.claude/skills/spec/SKILL.md:25,29` (the 100-line target and the writer-then-review sentence) are uncommitted, present at session start (session-context `git status`), and absent from `HEAD`. The `diff` against `HEAD` shows the full rewrite of the skill.
- Spec sizes: 254 lines at `dd7e5fc8`, 371 lines at `2ef3f5b1`; other specs 53 to 147 lines (`wc -l`).
- `apps/pelilauta/playwright.config.ts:35` defaults `baseURL` to port 4321. `delivery.yaml:45-50` defines the `app-e2e` gate.
- The first-mate skill text (`.claude/skills/first-mate/SKILL.md:23-41`), the `spec-review` Independence rule and the `technical-writer` ordering sentence read as quoted.
- `apps/pelilauta/playwright.config.ts` has no `webServer` entry, so the suite never starts its own server; `dd7e5fc8` touches only `e2e/README.md`, `session-agreement.spec.ts` and one line of `playwright.config.ts`, so the debug spec was not committed.
- No repository file defines "astra-high" (search over markdown, yaml and json files in the repository found none).

Verified in the transcript:
- Event order of the operator decisions at 752, 867, 893, 900, 1007 and 1120; the three critic verdicts "not ready" (176, 1005, and the final one summarized at 1118); the writer run at 1059 as a background `pnpm` command; the commits at 690 and 1219.

Inferred, not verified:
- That the first mate did not read the `spec` skill itself. No event shows a read of `.claude/skills/spec/SKILL.md` by the first mate; it may have been read before the `/clear` context or summarized by the skill listing.
- That the 500s on port 4328 came from stale server state. One clean restart on 4410 removed them; the cause was not read.
- That the operator's preferred reviewer by "astra-high" differs from the sonnet critic used.
- The share of effort per segment is a count of tool calls per event range (28, 30 and 32 for the three largest segments; 8 to 11 for the others), not a measure of time.
