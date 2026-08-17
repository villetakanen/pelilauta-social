<script lang="ts">
/**
 * ToggleSpecimen — the three states a settings pane shows at once: one flipped
 * on, one off, and one the reader cannot reach. The two live ones hold their
 * value the way a consumer does, by writing what the event carried back into the
 * prop.
 *
 * The readout prints what the consumer received. Without it a reader watching
 * the thumb move learns only that the input works, because the input moves the
 * thumb whether a handler ran or not.
 *
 * Book: apps/design/src/content/components/cn-toggle.mdx
 */
import CnToggle from '../../components/CnToggle.svelte';

let clocks = $state(true);
let handouts = $state(false);
let received = $state('—');

const record = (setting: string, value: boolean) => {
  received = `${setting}: ${value ? 'on' : 'off'}`;
};
</script>

<div class="toggle-specimen">
  <CnToggle
    label="Käytä kelloja"
    checked={clocks}
    onchange={(event) => {
      clocks = event.currentTarget.checked;
      record('Käytä kelloja', clocks);
    }}
  />
  <CnToggle
    label="Käytä jakomateriaaleja"
    checked={handouts}
    onchange={(event) => {
      handouts = event.currentTarget.checked;
      record('Käytä jakomateriaaleja', handouts);
    }}
  />
  <CnToggle
    label="Jäädytä sivusto"
    checked
    disabled
    onchange={() => record('Jäädytä sivusto', true)}
  />
  <p class="text-label" aria-live="polite">Viimeisin muutos: {received}</p>
</div>

<style>
  .toggle-specimen {
    display: grid;
    max-inline-size: 24rem;
  }

  .toggle-specimen p {
    margin-block: var(--cn-gap) 0;
  }
</style>
