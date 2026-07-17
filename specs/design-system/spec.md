---
status: approved
---

# Design System

## Context

The v21 design system provides shared visual language and reusable interface implementation for the Pelilauta product and its independent design documentation site. It supports incremental replacement of Cyan 4 and Lit.js surfaces without coupling design-system development to product data or Firebase.

This spec preserves durable design-system intent. Running package code defines actual behavior, automated checks provide executable evidence, and living books explain the implemented system.

## Architecture

- `packages/design-system/` is the planned owner of reusable tokens, generated styles, components, page implementations, documentation demos, and package tests.
- `apps/design/` is the planned deployment host for `design.pelilauta.social`. Its Astro routes remain thin adapters to package-owned page implementations.
- `apps/pelilauta/` consumes design-system source only through an explicitly assigned compatibility migration backed by a v18 surface spec.
- Source-level workspace links use Vite aliases mirrored by TypeScript path aliases. Workspace package linking and build orchestration are outside this architecture.
- Astro owns structural shells and page composition. Svelte owns reusable interactive components.
- Reusable behavior supports server rendering; browser-only enhancement is isolated and intentionally hydrated.
- Design-system specs live under `specs/design-system/`. The [token intent](tokens/spec.md) defines the first implementation foundation.

## Acceptance

### Deterministic Verification

- Reusable design-system implementation resides under `packages/design-system/`.
- Design-site routes import package-owned page implementations through mirrored source aliases.
- Package and app checks fail on unresolved aliases or invalid cross-boundary imports.
- Changes to `apps/pelilauta/` occur only in an issue whose scope includes that application.

### Probabilistic Review

- Review confirms each change remains one bounded design-system surface.
- Review confirms reusable implementation has not accumulated in an app host.
- Review confirms documentation demonstrates implementation rather than defining independent behavior.

### Human Acceptance

- Humans approve dependencies, deployment configuration, public routes, compatibility exceptions, and product integration.
- Humans accept visual behavior that cannot be established by deterministic checks.
