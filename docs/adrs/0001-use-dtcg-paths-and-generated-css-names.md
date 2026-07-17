# ADR 0001: Use DTCG Paths And Generated CSS Names

Status: Accepted

## Context

The v21 design system needs one durable token identity that is independent of CSS and can move between design, documentation, validation, and future platform tooling. Cyan 4 and v20 use overlapping `--chroma-*`, `--cn-*`, `--color-*`, and `--cyan-*` custom-property namespaces. Copying those names as the new source model would preserve migration debt and make tool interchange depend on CSS.

The Design Tokens Community Group published stable 2025.10 Format, Color, and Resolver reports for platform-neutral token data. The web application still needs CSS custom properties, and later Pelilauta migrations need an isolated bridge from Cyan 4 names.

## Decision

Canonical token code uses stable DTCG 2025.10 `.tokens.json` files under the planned `packages/design-system/tokens/` path.

Canonical token identities use category-first DTCG paths:

```text
color.{palette}.{step}
space.{role}
radius.{size}
font.family.{role}
font.size.{role}
font.weight.{role}
line-height.{role}
letter-spacing.{role}
```

The web projection adds the `cn` namespace and joins path segments with hyphens:

```text
color.primary.70  -> --cn-color-primary-70
space.grid        -> --cn-space-grid
font.size.body    -> --cn-font-size-body
```

The projection follows these rules:

- DTCG paths are the canonical platform-neutral identities.
- `--cn-*` is the only generated public web namespace.
- DTCG types are explicit and are not inferred from names.
- Numeric color steps identify tonal references.
- Ordinal size names use `xs`, `sm`, `md`, `lg`, and `xl`.
- `radius.full` is the non-ordinal endpoint for a fully rounded shape.
- Two canonical paths producing the same CSS name are invalid.
- Generated CSS is committed for direct source consumption and checked for freshness.
- Generated CSS is never edited independently of canonical token data.
- DTCG aliases project to CSS custom-property references when the target platform can represent the alias.
- Cyan 4 names remain outside canonical token data and map to generated names through an opt-in compatibility stylesheet.
- Semantic and component token path grammars are decided with the later surfaces that need them.

## Consequences

- Token data can be validated and consumed without parsing CSS.
- Living books can derive names, types, and values from canonical data.
- Web consumers receive a predictable `--cn-*` API.
- Generation and freshness checks become required package tooling.
- Renaming a DTCG path or its generated CSS property is a public API change.
- Cyan 4 migration remains explicit and removable rather than becoming the permanent naming model.
- A translation or validation dependency still requires separate approval.

## Alternatives Considered

### Copy V20 Names

This retains mixed `--chroma-*` and `--cn-*` namespaces and preserves duplicate radius and component naming debt.

### Keep Cyan 4 Names Canonical

This reduces initial alias work but makes legacy CSS names the permanent v21 token identity.

### Hand-Author CSS Only

This is initially smaller but provides no platform-neutral typed source and encourages documentation to duplicate values.

## Approved Detail

`radius.full` is allowed in addition to the ordinal `xs` through `xl` scale because a fully rounded shape is a semantic endpoint rather than another size step.
