---
name: the-spec-skill-names-v20-as-primary-source
branch: feat/reply-authoring
date: 2026-08-19
---

**Context:** `.claude/skills/spec/SKILL.md` step 2 says existing specs, implementation
and documents of v20 "act as the primary source for design-system intent and vision".
Its own "Recording the intent" section says the opposite where it matters: a v20 why is
confirmed with the human before it is carried, "because v20 canonicalised its mistakes".

**What happened:** Three agents — Claude, Codex and Gemini — independently concluded the
chat bar epic needed no field or input work. All three were wrong, and the reason is
structural: v20 dropped the field element style entirely and kept five tokens, of which
two resolve identically, and Cyan 4's field wires its hover to a token that resolves to
the resting value. An agent reading the versions as the primary source finds either
nothing or a broken thing, and reports that the question is settled. The intent was
recoverable only from the product owner, over a long interview
(`docs/chat-bar-field-study.md`), and from v19, which no repository here holds.

A later session resumed that interview, decided the model's earlier analysis must be
wrong, and looped. It looped on a focus-ring width that appears identically at five
sites across two versions — repetition read as corroboration.

**Suspected why:** Step 2 is the first instruction an agent hits and it is unqualified,
so it sets the search strategy before the caution in "Recording the intent" is read. The
skill has no sentence saying what to do when the versions carry nothing, or carry
something broken. Neither has any harness file stating that agreement across the
repositories is not evidence.

**Fix:** Qualify step 2 in `.claude/skills/spec/SKILL.md`: v20 and v18 are the primary
source for what the system *does*, and a source for intent only where a human confirms
it. Add the missing branch — where the versions carry nothing, or carry an
implementation the study or the human calls faulty, the intent comes from the human and
the search stops. State once, in the skill or in `AGENTS.md`, that a value repeated
across versions is one value and several copies.
