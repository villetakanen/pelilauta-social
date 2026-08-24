# An Unread Notification Claims The System Interrupt Level

Status: Recorded 2026-08-20, while settling what each elevation level means; deferred to the release-candidate cycle 2026-08-21

`apps/pelilauta/src/components/svelte/inbox/NotificationItem.svelte:57,89-102` puts an
unread notification at elevation 4, toggled by `notification.read`.

Raising a surface by a level is how a state marks its content as something else.
Elevation 4 is not available for it: that level is a system-level interrupt — a dialog, or
the frontpage card that prompts a reader to sign in. A notification interrupts nobody, so
an unread row takes the highest layer in the system for a list item.

The level also reaches further than the row. `packages/design-system/styles/surface.css`
reduces a child's shadow by its distance from the nearest elevated ancestor, so a row that
jumps to level 4 changes what everything inside it paints.

## What done looks like

An unread notification reads as unread without claiming the interrupt level. A rise of one
level, or the `has-notify` state `specs/design-system/surface/spec.md` already carries,
does the same work.
