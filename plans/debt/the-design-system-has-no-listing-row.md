# The design system has no listing row

`NotificationItem.svelte` lays out its row — icon, message, one action — with local
flex rules in its own `<style>` block, because no design-system capability publishes
a listing row. `specs/design-system/surface/spec.md` names a listing row as a surface
consumer, so the gap has an anchor; no spec defines the row itself.

## Remaining change

Spec and publish a listing row, then delete `NotificationItem.svelte`'s local layout
and compose the row. Until then the local block stands as a marked stopgap and is not
a pattern to copy.
