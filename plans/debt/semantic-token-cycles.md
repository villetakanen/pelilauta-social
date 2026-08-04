# Semantic Token Cycles Are Not Detected

Status: Recorded 2026-08-04

## What is wrong

Semantic tokens may alias other semantic tokens. The current package checks that
every required custom-property reference names a declared property, but it does not
detect a cycle between declared properties.

CSS accepts a cycle such as `--cn-a: var(--cn-b)` and
`--cn-b: var(--cn-a)`. Both names pass the source-level resolvability check, while
both computed values become invalid at runtime.

This concerns the permanent reference and semantic token model. It is unrelated to
temporary Cyan 4 compatibility aliases.

## What done looks like

A source-level check builds the semantic-token dependency graph and fails when the
graph contains a cycle. Valid semantic aliases continue to resolve toward reference
tokens without requiring every semantic token to reference the reference layer
directly.
