<script lang="ts">
import {
  type CnIcon,
  type CnListItem,
  CnSortableList,
} from '@11thdeg/cyan-lit';
import { onMount } from 'svelte';

interface Props {
  items: CnListItem[];
  onItemsChanged?: (items: CnListItem[]) => void;
  delete?: boolean;
}
const { items, onItemsChanged, delete: showDelete }: Props = $props();
let sortableListElement: CnSortableList | null = null;

/**
 * Handle items changed event from the sortable list
 */
function handleItemsChanged(newItems: CnListItem[]) {
  // Update the internal state to reflect the reordered items
  // This might trigger an update cycle, so be careful not to cause infinite loops
  // If onItemsChanged updates the parent's state which flows back down as `items`,
  // Svelte's reactivity should handle it. If not, you might need to update `items` directly here.
  onItemsChanged?.(newItems);
}

/**
 * Delete an item from the list
 */
function deleteItem(key: string) {
  const updatedItems = items.filter((item) => item.key !== key);
  handleItemsChanged(updatedItems); // This should trigger an update cycle
}

/**
 * Updates the delete buttons in the DOM based on current items and showDelete flag
 */
function updateDeleteButtons() {
  if (!sortableListElement) return;

  // Remove existing delete buttons first
  const buttonsToRemove = sortableListElement.querySelectorAll(
    'button[slot][data-delete-button]',
  );
  for (const btn of buttonsToRemove) {
    btn.remove();
  }

  if (showDelete) {
    for (const item of items) {
      const button = document.createElement('button');
      button.setAttribute('slot', item.key); // Set the slot dynamically
      button.setAttribute('type', 'button');
      button.setAttribute('data-delete-button', 'true'); // Mark button for easy removal
      button.onclick = () => deleteItem(item.key); // Add click handler

      const icon = document.createElement('cn-icon') as CnIcon;
      icon.noun = 'delete';
      button.appendChild(icon);

      sortableListElement?.appendChild(button);
    }
  }
}

onMount(() => {
  // sortableListElement is already bound via bind:this
  // sortableListElement = document.querySelector('cn-sortable-list');

  if (sortableListElement instanceof CnSortableList) {
    // Add event listener for item changes from the web component
    sortableListElement.addEventListener('items-changed', (event) => {
      handleItemsChanged(
        (event as CustomEvent<{ items: CnListItem[] }>).detail.items,
      );
    });
    // Initial rendering of delete buttons
    updateDeleteButtons();
  } else {
    console.error(
      'cn-sortable-list element not found or not an instance of CnSortableList',
    );
  }
});

// Update delete buttons whenever items or showDelete changes
$effect(() => {
  // Ensure sortableListElement is available before updating buttons
  if (sortableListElement) {
    updateDeleteButtons();
  }
});
</script>

<!-- Bind the element reference -->
<cn-sortable-list {items} bind:this={sortableListElement}>
  <!-- Static slots can still be defined here if needed -->
</cn-sortable-list>
