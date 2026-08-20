<script lang="ts" module>
/**
 * Mounted instances, counted across the page rather than per island. Svelte's
 * per-instance id is generated once per server render, and one island's render is
 * one render: a page carrying several CnMenu islands ships the same id in each of
 * them, and an IDREF resolves to whichever came first. The count re-keys each
 * container as it mounts, so the trigger invokes the container beside it.
 */
let mounted = 0;
</script>

<script lang="ts">
/**
 * CnMenu — a surface's secondary commands, behind the more-options trigger.
 *
 * The container is a native popover and the trigger is its invoker, so light
 * dismissal, Escape, focus return and the top layer come from the platform and
 * this component adds no document listener. It does state `aria-expanded`, because
 * an invoker's implicit expanded state is not exposed by every engine.
 *
 * Despite the name, it announces as a disclosure. The items keep the semantics of
 * the elements the consumer wrote — no role, no tabindex and no pointer handler of
 * ours reaches them — and Tab walks them. Opening moves no focus.
 *
 * The one handler on the container closes the menu after an item is activated, from
 * the click a pointer, Enter and Space all produce.
 *
 * Presentation is styles/menu.css, which both applications receive.
 */
import type { Snippet } from 'svelte';
import Icon from './Icon.svelte';

let {
  label = 'More options',
  inline = false,
  noun,
  chrome = false,
  opens = 'block-end',
  children,
}: {
  /** The trigger's accessible name. Localise it. */
  label?: string;
  /** Selects the horizontal `dots` glyph over the upright `kebab`. */
  inline?: boolean;
  /**
   * The trigger's glyph, where the menu is not the more-options one: a chat
   * bar's `add`, for instance. Defaults to the pair `inline` selects.
   */
  noun?: string;
  /**
   * Gives the trigger the chrome action's presentation instead of the text
   * button's, for a menu standing inside application chrome beside other
   * chrome actions.
   */
  chrome?: boolean;
  /**
   * Which side of the trigger the surface opens toward. `block-end` is below it,
   * where a trigger in a toolbar has room; `block-start` is above it, for a
   * trigger standing at the block end of its container. Either way the platform
   * flips it where the viewport gives it no room.
   */
  opens?: 'block-end' | 'block-start';
  /** The items: an anchor or a button the consumer wrote, one command each. */
  children?: Snippet;
} = $props();

let container: HTMLDivElement;
let open = $state(false);
const serverId = $props.id();
let containerId = $state(`${serverId}-menu`);

$effect(() => {
  containerId = `cn-menu-${(mounted += 1)}`;
});

/** An item's activation performs the command; closing the menu is ours. */
function closeAfterItem(event: MouseEvent) {
  const item = (event.target as Element | null)?.closest?.('a[href], button');
  if (item && container.matches(':popover-open')) container.hidePopover();
}
</script>

<div class="cn-menu">
  <button
    type="button"
    class={`${chrome ? 'chrome-action' : 'text'} cn-menu-trigger`}
    popovertarget={containerId}
    aria-expanded={open}
    aria-controls={containerId}
    aria-label={label}
  >
    <Icon noun={noun ?? (inline ? 'dots' : 'kebab')} decorative />
  </button>

  <!--
    The handler listens for an item's activation, which a pointer, Enter and Space
    all deliver as a click on the item. The container is not the control, so it
    takes neither a role nor a key handler of its own.
  -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={container}
    id={containerId}
    class="cn-menu-container elevation-3"
    data-opens={opens}
    popover
    ontoggle={(event) => {
      open = (event as ToggleEvent).newState === 'open';
    }}
    onclick={closeAfterItem}
  >
    {@render children?.()}
  </div>
</div>
