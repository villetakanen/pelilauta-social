# Plain Language Forbids Words That Carry A Fact

Status: Recorded 2026-08-25, found while rewriting the technical-writer skill

## What is wrong

`docs/WRITING.md:41` states "Plain language; no colloquialisms or figurative metaphors."
A reviewer applying it removed *bespoke* from a skill draft, where the word carried a
fact no shorter phrase carries: the scope is cut for that one file and not shared with
the next.

The rule aims at ornament. It reaches a precise word whose register is formal, because
nothing in the rule separates the two.

## Why it stays open

The separation is a judgement, and the word list cannot hold it — a grep entry for
*bespoke* would forbid the word outright, which is the defect. The fix is a sentence in
the mechanics that says what plain language protects the reader from, so a reviewer can
tell ornament from precision.

Writing that sentence is a change to the file every other rule derives from, and it
lands on its own.

## What done looks like

`docs/WRITING.md` states the test that separates an ornamental word from a precise one,
and a reviewer keeps a formal word that carries a fact.
