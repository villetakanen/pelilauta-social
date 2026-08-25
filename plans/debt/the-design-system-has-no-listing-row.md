# The design system has no listing row

`NotificationItem.svelte` lays out its row — icon, message, one action — with local
flex rules in its own `<style>` block, because no design-system capability publishes
a listing row. `specs/design-system/surface/spec.md` names a listing row as a surface
consumer, so the gap has an anchor; no spec defines the row itself.

The channel directory carries the same gap twice over: `ChannelInfoRow.astro` lays
out its row — icon, channel identity, latest activity beside it at width — locally,
and `ChannelsList.astro` states the rhythm between a category's heading and its rows
locally, because no published class gives a section internal rhythm either.
`ThreadListItem.svelte` is the third row: a thread's identity with its activity
beside it at width, the same shape stated locally again.

## Remaining change

Spec and publish a listing row, then delete the local layouts in
`NotificationItem.svelte`, `ChannelInfoRow.astro`, `ChannelsList.astro` and
`ThreadListItem.svelte` and compose the row. Until then each local block stands as
a marked stopgap and is not a pattern to copy.
