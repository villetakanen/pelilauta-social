<script lang="ts">
/**
 * `SortableListSpecimen` renders a live `CnSortableList` that a reviewer
 * reorders by dragging, by activation, or from the keyboard, displaying what the
 * consumer received.
 *
 * The status readout displays the message `CnSortableList` places in the status
 * region so the reviewer reads what a screen reader receives. The order readout
 * displays the array delivered by `onitemschange` so a completed move is
 * distinguishable from provisional movement.
 *
 * `size` selects the empty, two-item, or three-item list. `accept` controls
 * whether the specimen writes the reported order back; when false, the supplied
 * order returns to demonstrate a consumer rejecting a reorder.
 *
 * Every row shares one `rowActions` snippet, built from the `items` array rather
 * than written per row in markup. The snippet receives its own item and reads
 * its title, so the "Action activated" readout names the row whose action ran.
 *
 * The specimen appears in `apps/design/src/content/components/cn-sortable-list.mdx`.
 */

import type {
  CnListItem,
  CnSortableListAnnouncements,
} from '../../components/CnSortableList.svelte';
import CnSortableList from '../../components/CnSortableList.svelte';

let { size = 3, accept = true }: { size?: 0 | 2 | 3; accept?: boolean } =
  $props();

let keys = $state(
  ['overview', 'characters', 'locations'].slice(0, size === 0 ? 0 : size),
);
let status = $state('—');
let received = $state('—');
let activated = $state('—');

function say(message: string) {
  status = message;
  return message;
}

const announcements: CnSortableListAnnouncements = {
  pickup: (title, position, length) =>
    say(`Picked up ${title}, position ${position} of ${length}.`),
  position: (title, position, length) =>
    say(`${title} is at position ${position} of ${length}.`),
  completion: (title, position, length) =>
    say(`Dropped ${title} at position ${position} of ${length}.`),
  cancellation: (title, position, length) =>
    say(`Cancelled. ${title} stays at position ${position} of ${length}.`),
};

const catalogue = $derived.by<Record<string, CnListItem>>(() => ({
  overview: { key: 'overview', title: 'Overview', actions: rowActions },
  characters: {
    key: 'characters',
    title: 'Characters',
    content: charactersContent,
    actions: rowActions,
  },
  locations: {
    key: 'locations',
    title: 'Locations',
    content: locationsContent,
    actions: rowActions,
  },
}));

const items = $derived(keys.map((key) => catalogue[key]));

function onitemschange(next: CnListItem[]) {
  received = next.map((item) => item.title).join(' · ');
  if (accept) keys = next.map((item) => item.key);
}
</script>

{#snippet charactersContent()}
  <span class="block">
    <span>Characters</span>
    <span class="text-caption text-low">12 pages</span>
  </span>
{/snippet}

{#snippet locationsContent()}
  <span class="block">
    <span>Locations</span>
    <span class="text-caption text-low">Draft</span>
  </span>
{/snippet}

{#snippet rowActions(item: CnListItem)}
  <button type="button" class="text" onclick={() => (activated = item.title)}>
    Edit
  </button>
{/snippet}

<div class="sortable-list-specimen">
  <CnSortableList
    {items}
    {onitemschange}
    {announcements}
    label="Site table of contents"
  />
  <dl class="text-caption">
    <dt>Status region</dt>
    <dd>{status}</dd>
    <dt>Order received</dt>
    <dd>{received}</dd>
    <dt>Action activated</dt>
    <dd>{activated}</dd>
  </dl>
</div>

<style>
  .sortable-list-specimen {
    display: grid;
    row-gap: var(--cn-gap);
  }

  .block {
    display: grid;
  }

  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: var(--cn-gap);
    margin: 0;
    color: var(--cn-color-text-low);
  }

  dd {
    margin: 0;
  }
</style>
