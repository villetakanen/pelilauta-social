<script lang="ts">
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
  'check',
  'chevron-left',
  'clock',
  'close',
  'components',
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
  'file-pdf',
  'filter',
  'font',
  'fork',
  'fox',
  'gamepad',
  'google',
  'homebrew',
  'hood',
  'idea',
  'import-export',
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
  'open-down',
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
      <cn-icon noun={value} small={size === 'small'} large={size === 'large'}></cn-icon>
      <span class="icon-name">{value}</span>
    {:else}
      <span class="placeholder">{placeholder}</span>
    {/if}
    <cn-icon noun="open-down" small></cn-icon>
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
          <cn-icon noun="search" small></cn-icon>
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
              <cn-icon noun={icon} small></cn-icon>
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

.noun-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-s);
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 0.5rem;
}

.noun-select-trigger:hover:not(:disabled) {
  background: var(--color-surface-hover);
  border-color: var(--color-border-hover);
}

.noun-select-trigger:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-color: var(--color-primary);
}

.noun-select-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.noun-select-trigger.small {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.noun-select-trigger.large {
  padding: 1rem 1.25rem;
  font-size: 1.125rem;
}

.icon-name {
  flex-grow: 1;
  text-align: left;
  text-transform: capitalize;
}

.placeholder {
  color: var(--color-text-low);
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-s);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 0.25rem;
  max-height: 300px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-container {
  position: relative;
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.search-input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-s);
  background: var(--color-surface);
  font-size: 0.875rem;
}

.search-input:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-color: var(--color-primary);
}

.search-container cn-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  opacity: 0.5;
}

.icons-list {
  overflow-y: auto;
  max-height: 240px;
}

.icon-option {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  gap: 0.75rem;
  transition: background-color 0.2s ease;
  text-align: left;
}

.icon-option:hover {
  background: var(--color-surface-hover);
}

.icon-option.focused {
  background: var(--color-surface-hover);
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}

.icon-option.selected {
  background: var(--color-primary-low);
  color: var(--color-primary);
  font-weight: 500;
}

.icon-option:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}

.empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-text-low);
  font-style: italic;
}

.noun-select.disabled {
  pointer-events: none;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .noun-select-dropdown {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
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