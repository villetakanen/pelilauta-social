# The Writing Rules Catch Defects And Never Ask For Good Prose

Status: Recorded 2026-08-25, found by running technical-writer four times on one document

## What is wrong

`docs/WRITING.md` states what a sentence must not be: no colloquialism, no metaphor, no
anthropomorphism, no possessive standing in for a clause, no word from the list. It
never states what the prose is aiming at, so a reviewer that finds no violation reports
a clean file.

Four runs of `technical-writer` on `docs/cyan-removal-page-checklist.md` — two Sonnet,
one Opus, one Sonnet after the possessive rule landed — kept this sentence:

    Which rendered pages have been through the triage that removed Cyan, and which have not.

It is a fragment, it is passive, it states one fact twice, and the table below it
carries the fact. Each run cleared it, and the last one rewrote the possessive inside it
and left the rest, because the possessive was the only part a rule named.

The skill has the same gap. `.agents/skills/technical-writer/SKILL.md` sets the verdict
and the procedure, and states no standard to reach.

## Why it stays open

A target is a judgement, not a test, and adding one badly gives a reviewer licence to
rewrite to taste. The wording has to say what good technical prose is here — the
register of a polished developer document — precisely enough that a reviewer applies it
and an operator can argue with a result.

Whether the target belongs in `docs/WRITING.md`, in the skill, or in both is part of
the work. `docs/WRITING.md` governs every sentence in the repository, so a target there
binds prose no reviewer ever reads; a target in the skill binds the reviewer only.

## What done looks like

`docs/WRITING.md` states what the prose aims at alongside what it forbids, and
`technical-writer` carries the standard it rewrites toward. A reviewer that finds no
rule violation still deletes or rewrites a sentence that falls short of the target, and
says which target it missed.
