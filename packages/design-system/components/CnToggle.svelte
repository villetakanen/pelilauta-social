<script lang="ts">
/**
 * CnToggle — one boolean setting, applied the moment it is flipped.
 *
 * The control is a native checkbox announcing as a switch, wrapped in the label
 * that names it. Toggling, the keyboard, focus, the disabled state and the
 * `change` event are the input's; this component adds no listener, no role and
 * no tabindex of its own. Cyan's `cn-toggle-button` rebuilt all of them on its
 * host, and the rebuild is what the migration retires.
 *
 * It holds no state either. The consumer supplies the current value through
 * `checked`, the input carries it, and the consumer reads it back from the
 * event — `event.currentTarget.checked` — and writes it wherever the setting
 * lives. A consumer that leaves `checked` alone leaves the input showing what
 * the reader last did to it.
 *
 * Presentation is styles/toggle.css, which both applications receive.
 */

let {
  label,
  checked = false,
  disabled = false,
  onchange,
}: {
  /** The switch's accessible name. Required, and localised by the consumer. */
  label: string;
  /** The setting's current value. */
  checked?: boolean;
  /** Renders the row inert. */
  disabled?: boolean;
  /** Runs on every flip, with the input as the event's `currentTarget`. */
  onchange?: (
    event: Event & { currentTarget: EventTarget & HTMLInputElement },
  ) => void;
} = $props();
</script>

<label class="cn-toggle">
  <span>{label}</span>
  <input type="checkbox" role="switch" {checked} {disabled} {onchange} />
</label>
