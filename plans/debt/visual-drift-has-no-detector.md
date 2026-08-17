# Visual Drift Has No Detector

Status: Recorded 2026-08-14, while levelling the test suite

## What is wrong

`.agents/skills/design-system-tests/SKILL.md` gives the Visual level one instrument:
the book page, read by a human. A specimen that changes between two merges is caught
if someone looks at it, and otherwise is not caught.

The book already renders each specimen in Light and Dark side by side, which is the
shape a screenshot baseline wants.

The cost is the reason it is not done yet: baselines rendered on one machine and
compared on another disagree over font rasterisation before they disagree over the
design, and a suite that raises false alarms is read by nobody. Where baselines are produced
has to be settled before the first one is committed.

## What done looks like

A specimen's appearance changing produces a diff a machine raises, an agent triages
and a human judges, and the baseline is produced somewhere both a local run and CI
can reproduce.
