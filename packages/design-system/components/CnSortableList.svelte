<script lang="ts" module>
import type { Snippet } from 'svelte';

export interface CnListItem {
  /** Each key is unique within `items`. */
  key: string;
  /** `title` names the item and the drag handle. */
  title: string;
  /** `content` renders in the content region instead of the title. */
  content?: Snippet;
  /** `actions` renders in the actions region, after the content. */
  actions?: Snippet;
}

/**
 * `CnSortableListAnnouncements` carries localized status messages. Each function
 * receives the item title, one-based position, and list length, and returns
 * the message announced to assistive technology.
 */
export interface CnSortableListAnnouncements {
  pickup: (title: string, position: number, length: number) => string;
  position: (title: string, position: number, length: number) => string;
  completion: (title: string, position: number, length: number) => string;
  cancellation: (title: string, position: number, length: number) => string;
}

/**
 * Mounted instances increment across the entire page, matching `CnMenu`. Svelte
 * generates a per-instance ID once during each server render, causing pages with
 * multiple islands to emit duplicate IDs and resolve `aria-describedby` to the
 * first match.
 */
let mounted = 0;
</script>

<script lang="ts">
/**
 * `CnSortableList` renders an ordered set of named blocks that the reader
 * rearranges in place.
 *
 * The platform drag-and-drop API carries mouse and pen input. Rows retain their
 * positions during the drag while a line marks the landing position. Activation
 * carries touch and keyboard input. Activating the handle picks the item up,
 * arrow keys move the item, and a second activation places it. Rendered rows
 * follow the provisional order until the operation ends. Both paths land an item
 * in the same position.
 *
 * A completed move reports a new array through `onitemschange` and the component
 * returns to the supplied order, so a consumer that ignores the report sees the
 * original order return. `CnSortableList` never modifies the supplied array.
 *
 * The component maintains no state between operations and moves no item
 * between lists. Only the drag handle starts a reorder, leaving content selection
 * and the actions region operable.
 *
 * `styles/sortable-list.css` defines the presentation.
 */
import CnIcon from './CnIcon.svelte';

let {
  items,
  label,
  onitemschange,
  announcements,
}: {
  /** `items` supplies the rendered item order. The array may be empty. */
  items: readonly CnListItem[];
  /** `label` supplies the accessible name for the list, localized by the consumer. */
  label: string;
  /** `onitemschange` receives a new array on each completed reorder that changes position. */
  onitemschange: (items: CnListItem[]) => void;
  /** `announcements` supplies localized status messages. */
  announcements: CnSortableListAnnouncements;
} = $props();

const serverId = $props.id();
let statusId = $state(`${serverId}-status`);
$effect(() => {
  statusId = `cn-sortable-list-status-${(mounted += 1)}`;
});

let message = $state('');
let focusKey = $state<string | null>(null);

let dragKey = $state<string | null>(null);
let insertKey = $state<string | null>(null);
let insertBefore = $state(false);
let dropped = false;
/**
 * This flag tracks whether a drag concluded during the current pointer press.
 * Browsers fire a `click` event on the drag source when a drag ends, which must
 * not initiate a pickup. Subsequent pointer presses clear this flag so clicks
 * without a preceding drag activate normally.
 */
let dragConcluded = false;

let pickedKey = $state<string | null>(null);
let provisional = $state<string[] | null>(null);
let originalKeys: string[] = [];

const handles = new Map<string, HTMLButtonElement>();
const rows = new Map<string, HTMLLIElement>();

function registerHandle(node: HTMLButtonElement, key: string) {
  handles.set(key, node);
  return {
    destroy() {
      handles.delete(key);
    },
  };
}

function registerRow(node: HTMLLIElement, key: string) {
  rows.set(key, node);
  return {
    destroy() {
      rows.delete(key);
    },
  };
}

/**
 * `rendered` derives items in provisional order. When the consumer updates
 * `items` during an operation, `rendered` drops removed keys and appends new keys
 * to the end.
 */
const rendered = $derived.by(() => {
  if (!provisional) return [...items];
  const byKey = new Map(items.map((item) => [item.key, item]));
  const ordered: CnListItem[] = [];
  for (const key of provisional) {
    const item = byKey.get(key);
    if (item) ordered.push(item);
  }
  const placed = new Set(ordered.map((item) => item.key));
  return [...ordered, ...items.filter((item) => !placed.has(item.key))];
});

const pickedItem = $derived(
  pickedKey ? rendered.find((item) => item.key === pickedKey) : undefined,
);

function titleOf(key: string) {
  return items.find((item) => item.key === key)?.title ?? '';
}

function announcePosition() {
  if (!pickedItem || !pickedKey || !provisional) return;
  message = announcements.position(
    pickedItem.title,
    provisional.indexOf(pickedKey) + 1,
    rendered.length,
  );
}

function itemsOf(keys: string[]) {
  const byKey = new Map(items.map((item) => [item.key, item]));
  const ordered: CnListItem[] = [];
  for (const key of keys) {
    const item = byKey.get(key);
    if (item) ordered.push(item);
  }
  return ordered;
}

function handleDragStart(event: DragEvent, key: string) {
  const row = rows.get(key);
  const transfer = event.dataTransfer;
  if (!row || !transfer) return;
  // An unfinished activation yields to the drag without announcing cancellation.
  endPickup();
  dragConcluded = true;
  dropped = false;
  dragKey = key;
  transfer.effectAllowed = 'move';
  // Firefox requires non-empty data transfer content to start a drag.
  transfer.setData('text/plain', key);
  // The drag image paints the entire row under the pointer coordinates.
  const rect = row.getBoundingClientRect();
  transfer.setDragImage(row, event.clientX - rect.left, event.clientY - rect.top);
  message = announcements.pickup(
    titleOf(key),
    items.findIndex((item) => item.key === key) + 1,
    items.length,
  );
}

function insertsBefore(event: DragEvent, key: string) {
  const rect = rows.get(key)?.getBoundingClientRect();
  if (!rect) return true;
  return event.clientY < rect.top + rect.height / 2;
}

function handleDragOver(event: DragEvent, key: string) {
  if (!dragKey) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  if (key === dragKey) {
    insertKey = null;
    return;
  }
  insertKey = key;
  insertBefore = insertsBefore(event, key);
}

function handleDragLeave(key: string) {
  if (insertKey === key) insertKey = null;
}

function clearDrag() {
  dragKey = null;
  insertKey = null;
}

function handleDrop(event: DragEvent, key: string) {
  const source = dragKey;
  if (!source) return;
  event.preventDefault();
  const before = insertsBefore(event, key);
  const keys = items.map((item) => item.key);
  const from = keys.indexOf(source);
  dropped = true;
  dragConcluded = true;
  focusKey = source;
  if (key === source) {
    message = announcements.completion(titleOf(source), from + 1, keys.length);
    clearDrag();
    return;
  }
  const next = keys.filter((candidate) => candidate !== source);
  const index = next.indexOf(key);
  if (index === -1) {
    clearDrag();
    return;
  }
  next.splice(before ? index : index + 1, 0, source);
  const to = next.indexOf(source);
  const ordered = itemsOf(next);
  message = announcements.completion(titleOf(source), to + 1, ordered.length);
  clearDrag();
  if (from !== to) onitemschange(ordered);
}

function handleDragEnd() {
  const source = dragKey;
  if (source && !dropped) {
    message = announcements.cancellation(
      titleOf(source),
      items.findIndex((item) => item.key === source) + 1,
      items.length,
    );
  }
  dropped = false;
  clearDrag();
}

function pickup(key: string) {
  const item = items.find((candidate) => candidate.key === key);
  if (!item) return;
  originalKeys = rendered.map((entry) => entry.key);
  provisional = [...originalKeys];
  pickedKey = key;
  message = announcements.pickup(
    item.title,
    originalKeys.indexOf(key) + 1,
    originalKeys.length,
  );
  handles.get(key)?.focus();
}

function endPickup() {
  pickedKey = null;
  provisional = null;
  originalKeys = [];
}

function place() {
  if (!pickedKey || !provisional || !pickedItem) return;
  const key = pickedKey;
  const from = originalKeys.indexOf(key);
  const to = provisional.indexOf(key);
  const ordered = [...rendered];
  message = announcements.completion(pickedItem.title, to + 1, ordered.length);
  focusKey = key;
  endPickup();
  if (from !== to) onitemschange(ordered);
}

function placeAt(targetKey: string) {
  if (!pickedKey || !provisional) return;
  const key = pickedKey;
  if (targetKey !== key) {
    const index = provisional.indexOf(targetKey);
    if (index !== -1) {
      const next = provisional.filter((candidate) => candidate !== key);
      next.splice(index, 0, key);
      provisional = next;
      announcePosition();
    }
  }
  place();
}

function moveBy(delta: number) {
  if (!pickedKey || !provisional) return;
  const index = provisional.indexOf(pickedKey);
  const target = Math.min(Math.max(index + delta, 0), provisional.length - 1);
  if (target !== index) {
    const next = [...provisional];
    next.splice(index, 1);
    next.splice(target, 0, pickedKey);
    provisional = next;
  }
  announcePosition();
}

function cancel() {
  if (!pickedKey) return;
  const key = pickedKey;
  message = announcements.cancellation(
    titleOf(key),
    originalKeys.indexOf(key) + 1,
    originalKeys.length,
  );
  focusKey = key;
  endPickup();
}

function handlePointerDown() {
  dragConcluded = false;
}

function handleRowClick(event: MouseEvent, key: string) {
  if (dragConcluded) {
    dragConcluded = false;
    return;
  }
  const target = event.target;
  const onHandle =
    target instanceof Element &&
    target.closest('.cn-sortable-list-handle') !== null;
  if (!pickedKey) {
    if (onHandle) pickup(key);
    return;
  }
  if (key === pickedKey && onHandle) {
    place();
    return;
  }
  placeAt(key);
}

function handleKeydown(event: KeyboardEvent, key: string) {
  if (event.key === ' ' || event.key === 'Enter') {
    // Preventing the default action suppresses synthetic click events dispatched by browsers during keyboard activation.
    event.preventDefault();
    if (!pickedKey) pickup(key);
    else if (pickedKey === key) place();
    else placeAt(key);
    return;
  }
  if (pickedKey !== key) return;
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    moveBy(event.key === 'ArrowUp' ? -1 : 1);
  }
}

function onWindowKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  cancel();
}

$effect(() => {
  if (!pickedKey) return;
  window.addEventListener('keydown', onWindowKeydown);
  return () => window.removeEventListener('keydown', onWindowKeydown);
});

/**
 * This effect restores focus to the moved handle after the consumer updates
 * `items`. When the consumer removes the key, focus remains at its current
 * position.
 */
$effect(() => {
  const key = focusKey;
  if (!key) return;
  if (items.some((item) => item.key === key)) handles.get(key)?.focus();
  focusKey = null;
});
</script>

<div class="cn-sortable-list">
  <ul role="list" aria-label={label}>
    {#each rendered as item (item.key)}
      <!-- The row handles placement clicks while an item is picked up. The
           drag handle button provides keyboard placement, so the row requires
           no separate key handler. -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <li
        use:registerRow={item.key}
        data-dragging={dragKey === item.key || pickedKey === item.key
          ? ''
          : undefined}
        data-insert={insertKey === item.key
          ? insertBefore
            ? 'before'
            : 'after'
          : undefined}
        onpointerdown={handlePointerDown}
        onclick={(event) => handleRowClick(event, item.key)}
        ondragover={(event) => handleDragOver(event, item.key)}
        ondragleave={() => handleDragLeave(item.key)}
        ondrop={(event) => handleDrop(event, item.key)}
      >
        <button
          type="button"
          class="cn-sortable-list-handle"
          aria-label={item.title}
          aria-describedby={pickedKey === item.key ? statusId : undefined}
          draggable="true"
          use:registerHandle={item.key}
          ondragstart={(event) => handleDragStart(event, item.key)}
          ondragend={handleDragEnd}
          onkeydown={(event) => handleKeydown(event, item.key)}
        >
          <CnIcon noun="dragger" decorative />
        </button>
        <div class="content">
          {#if item.content}{@render item.content()}{:else}{item.title}{/if}
        </div>
        {#if item.actions}
          <div class="actions">{@render item.actions()}</div>
        {/if}
      </li>
    {/each}
  </ul>
  <div class="status" id={statusId} role="status" aria-live="polite">{message}</div>
</div>
