<script lang="ts">
import CnIcon from '@design-system/components/CnIcon.svelte';

interface Props {
  value: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  searchable?: boolean;
  required?: boolean;
  onIconSelect?: (iconName: string) => void;
}

let {
  value = $bindable('discussion'),
  defaultValue = 'discussion',
  placeholder = 'Select an icon...',
  disabled = false,
  size = 'medium',
  searchable = true,
  required = false,
  onIconSelect,
}: Props = $props();

// Static icon list from our generated data
const availableIcons = [
  'add',
  'admin',
  'adventurer',
  'arrow-down',
  'arrow-left',
  'arrow-up',
  'assets',
  'avatar',
  'books',
  'card',
  'chevron-left',
  'clock',
  'close',
  'copy-md',
  'd12',
  'd20',
  'd8',
  'dd5',
  'delete',
  'design',
  'discussion',
  'dots',
  'drag',
  'dragger',
  'edit',
  'filter',
  'font',
  'fork',
  'fox',
  'gamepad',
  'google',
  'homebrew',
  'hood',
  'idea',
  'info',
  'karu',
  'kebab',
  'll-ampersand',
  'login',
  'love',
  'mekanismi',
  'monsters',
  'moon',
  'myrrys-scarlet',
  'palette',
  'pathfinder',
  'pbta',
  'pdf',
  'quote',
  'reduce',
  'save',
  'search',
  'send',
  'share',
  'spiral',
  'thequick',
  'tokens',
  'tools',
  'undo',
  'veil-advance',
  'youtube',
];

let isOpen = $state(false);
let searchTerm = $state('');
let focusedIndex = $state(-1);

// Filtered icons based on search
const filteredIcons = $derived.by(() => {
  if (!searchTerm) return availableIcons;
  return availableIcons.filter((icon) =>
    icon.toLowerCase().includes(searchTerm.toLowerCase()),
  );
});

// Initialize with default if needed
$effect(() => {
  if (!value && defaultValue) {
    value = defaultValue;
    if (onIconSelect) onIconSelect(value);
  }
});

function selectIcon(iconName: string) {
  value = iconName;
  if (onIconSelect) onIconSelect(iconName);
  isOpen = false;
  searchTerm = '';
}

function toggleDropdown() {
  if (disabled) return;
  isOpen = !isOpen;
  if (!isOpen) searchTerm = '';
}

function handleKeydown(event: KeyboardEvent) {
  if (disabled) return;

  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      if (isOpen && focusedIndex >= 0 && focusedIndex < filteredIcons.length) {
        selectIcon(filteredIcons[focusedIndex]);
      } else {
        toggleDropdown();
      }
      break;
    case 'Escape':
      isOpen = false;
      searchTerm = '';
      focusedIndex = -1;
      break;
    case 'ArrowDown':
      event.preventDefault();
      if (!isOpen) {
        toggleDropdown();
      } else {
        focusedIndex = Math.min(focusedIndex + 1, filteredIcons.length - 1);
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (isOpen) {
        focusedIndex = Math.max(focusedIndex - 1, 0);
      }
      break;
  }
}
</script>

<div class="noun-select" class:disabled class:open={isOpen}>
  <!-- Selected value display -->
  <button 
    type="button"
    class="noun-select-trigger {size}"
    onclick={toggleDropdown}
    onkeydown={handleKeydown}
    {disabled}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-label={placeholder}
  >
    {#if value}
      <CnIcon noun={value} size={size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium'} />
      <span class="icon-name">{value}</span>
    {:else}
      <span class="placeholder">{placeholder}</span>
    {/if}
    <CnIcon noun="open-down" size="small" />
  </button>
  
  <!-- Dropdown content -->
  {#if isOpen}
    <div class="noun-select-dropdown" role="listbox">
      {#if searchable}
        <div class="search-container">
          <input
            type="text"
            bind:value={searchTerm}
            placeholder="Search icons..."
            class="search-input"
            autocomplete="off"
          />
          <CnIcon noun="search" size="small" />
        </div>
      {/if}
      
      <div class="icons-list">
        {#if filteredIcons.length === 0}
          <div class="empty-state">
            <span>No icons found for "{searchTerm}"</span>
          </div>
        {:else}
          {#each filteredIcons as icon, index}
            <button
              type="button"
              class="icon-option"
              class:selected={value === icon}
              class:focused={focusedIndex === index}
              onclick={() => selectIcon(icon)}
              role="option"
              aria-selected={value === icon}
            >
              <CnIcon noun={icon} size="small" />
              <span>{icon}</span>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
.noun-select {
  position: relative;
  display: inline-block;
  width: 100%;
}

/* @todo A noun picker is a design-system capability; this trigger reproduces
   what a painted `select` and its platform-drawn disclosure already do. The
   one thing it does that a native select cannot is put an icon beside a
   noun's label. Two-sided distribution — a value pinned to one edge, a
   chevron pinned to the other — is the one shape text alignment cannot
   serve, so this rule stays until the component moves into the design
   system. See plans/debt/the-noun-picker-is-not-in-the-design-system.md. */
.noun-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: calc(var(--cn-grid) * 1.5) var(--cn-gap);
  background: var(--cn-color-field);
  border: 1px solid var(--cn-color-field-border);
  border-radius: var(--cn-border-radius-small);
  cursor: pointer;
  transition: background-color var(--cn-duration-ui) var(--cn-easing-ui), border-color var(--cn-duration-ui) var(--cn-easing-ui);
  gap: var(--cn-grid);
}

.noun-select-trigger:hover:not(:disabled) {
  background: var(--cn-color-field-hover);
  border-color: var(--cn-color-field-border-hover);
}

.noun-select-trigger:focus {
  outline: 2px solid var(--cn-color-focus-ring);
  outline-offset: 2px;
  border-color: var(--cn-color-field-border-focus);
}

.noun-select-trigger:disabled {
  opacity: var(--cn-disabled-opacity);
  cursor: not-allowed;
}

.noun-select-trigger.small {
  padding: var(--cn-grid) calc(var(--cn-grid) * 1.5);
  font-size: var(--cn-font-size-small);
}

.noun-select-trigger.large {
  padding: var(--cn-gap) calc(var(--cn-grid) * 2.5);
  font-size: var(--cn-font-size-text);
}

.icon-name {
  flex-grow: 1;
  text-align: left;
  text-transform: capitalize;
}

.placeholder {
  color: var(--cn-color-text-low);
  font-style: italic;
  flex-grow: 1;
  text-align: left;
}

.noun-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--cn-color-surface-2);
  border: 1px solid var(--cn-color-border);
  border-radius: var(--cn-border-radius-small);
  /* light-dark, not a media query: the document's scheme decides, and the
     account's stored theme may force it against the OS preference. */
  box-shadow: 0 4px 12px light-dark(rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.4));
  margin-top: calc(var(--cn-grid) * 0.5);
  max-height: 300px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-container {
  position: relative;
  padding: var(--cn-grid);
  border-bottom: 1px solid var(--cn-color-border);
}

.search-input {
  width: 100%;
  padding: var(--cn-grid) calc(var(--cn-grid) * 4) var(--cn-grid) calc(var(--cn-grid) * 1.5);
  border: 1px solid var(--cn-color-field-border);
  border-radius: var(--cn-border-radius-small);
  background: var(--cn-color-field);
  font-size: var(--cn-font-size-small);
}

.search-input:focus {
  outline: 2px solid var(--cn-color-focus-ring);
  outline-offset: 2px;
  border-color: var(--cn-color-field-border-focus);
}

/*
 * The search affordance is positioned against the input, not sized by it. The
 * local CnIcon renders its own element, so this component's scoped selector has
 * to reach the child component's class explicitly — a scoped `.cn-icon` rule
 * would never match (migration guide: a class does not match a tag rule, and
 * Svelte scoping does not cross a component boundary).
 */
.search-container :global(.cn-icon) {
  position: absolute;
  right: var(--cn-gap);
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  opacity: var(--cn-disabled-opacity);
}

.icons-list {
  overflow-y: auto;
  max-height: 240px;
}

.icon-option {
  display: flex;
  align-items: center;
  width: 100%;
  padding: calc(var(--cn-grid) * 1.5) var(--cn-gap);
  background: none;
  border: none;
  cursor: pointer;
  gap: calc(var(--cn-grid) * 1.5);
  transition: background-color var(--cn-duration-ui) var(--cn-easing-ui);
  text-align: left;
}

.icon-option:hover {
  background: var(--cn-color-hover);
}

.icon-option.focused {
  background: var(--cn-color-hover);
  outline: 2px solid var(--cn-color-focus-ring);
  outline-offset: -2px;
}

.icon-option.selected {
  background: var(--cn-color-selection);
  color: var(--cn-color-text-high);
  font-weight: 500;
}

.icon-option:focus {
  outline: 2px solid var(--cn-color-focus-ring);
  outline-offset: -2px;
}

.empty-state {
  padding: var(--cn-line) var(--cn-gap);
  text-align: center;
  color: var(--cn-color-text-low);
  font-style: italic;
}

.noun-select.disabled {
  pointer-events: none;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .noun-select-dropdown {
    max-height: 250px;
  }
  
  .icons-list {
    max-height: 190px;
  }
}
</style>
