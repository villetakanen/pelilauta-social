<script lang="ts">
import { appMeta } from '@stores/metaStore/metaStore';
import { uid } from '@stores/session';
import { pushSessionSnack, pushSnack } from '@utils/client/snackUtils';
import WithAuth from '../app/WithAuth.svelte';

const visible = $derived.by(() => $appMeta.admins.includes($uid));

let immediateMessage = $state('This is an immediate snackbar test');
let sessionMessage = $state('This is a session snackbar test');
let navigateUrl = $state('/admin');

function showImmediateSnack() {
  pushSnack({
    message: immediateMessage,
  });
}

function showImmediateInfoSnack() {
  pushSnack({
    message: '✓ Info: This is an informational snackbar',
  });
}

function showImmediateSuccessSnack() {
  pushSnack({
    message: '✓ Success: This is a success message',
  });
}

function showImmediateErrorSnack() {
  pushSnack({
    message: '✗ Error: This is an error message',
  });
}

function showActionSnack() {
  pushSnack({
    message: 'This one waits for you',
    action: {
      label: 'Kumoa',
      callback: () => pushSnack('The action ran'),
    },
  });
}

function pushSessionAndNavigate() {
  pushSessionSnack({
    message: sessionMessage,
  });
  window.location.href = navigateUrl;
}

function pushSessionSuccessAndNavigate() {
  pushSessionSnack({
    message: '✓ Success: Session snackbar after navigation',
  });
  window.location.href = navigateUrl;
}
</script>

<WithAuth allow={visible}>
  <div class="content-prose">
    <section>
      <h1 class="downscaled">Snackbar Test Utility</h1>
      <p class="text-caption">
        Test immediate and session snackbars with different message types.
      </p>

      <div class="mt-2">
        <h2>Immediate Snackbars</h2>
        <p class="text-caption mb-1">
          These appear immediately when triggered without page navigation.
        </p>
        
        <div class="flex flex-col gap-1">
          <label for="immediate-message">Message:</label>
          <input
            id="immediate-message"
            type="text"
            bind:value={immediateMessage}
            class="radius-m p-1 border"
          />
          
          <div class="toolbar mt-1">
            <button class="button" onclick={showImmediateSnack}>
              Show Default
            </button>
            <button class="button" onclick={showImmediateInfoSnack}>
              Show Info
            </button>
            <button class="button" onclick={showImmediateSuccessSnack}>
              Show Success
            </button>
            <button class="button" onclick={showImmediateErrorSnack}>
              Show Error
            </button>
            <button class="button" onclick={showActionSnack}>
              Show With Action
            </button>
          </div>
        </div>
      </div>

      <div class="mt-2">
        <h2>Session Snackbars</h2>
        <p class="text-caption mb-1">
          These are stored in sessionStorage and displayed after navigation.
        </p>
        
        <div class="flex flex-col gap-1">
          <label for="session-message">Message:</label>
          <input
            id="session-message"
            type="text"
            bind:value={sessionMessage}
            class="radius-m p-1 border"
          />
          
          <label for="navigate-url">Navigate to URL:</label>
          <input
            id="navigate-url"
            type="text"
            bind:value={navigateUrl}
            class="radius-m p-1 border"
          />
          
          <div class="toolbar mt-1">
            <button class="button" onclick={pushSessionAndNavigate}>
              Push & Navigate (Default)
            </button>
            <button class="button" onclick={pushSessionSuccessAndNavigate}>
              Push & Navigate (Success)
            </button>
          </div>
        </div>
      </div>

      <div class="mt-2 p-1 border radius-m">
        <h3>How It Works</h3>
        <ul class="text-caption">
          <li>
            <strong>Immediate snackbars</strong> use <code>pushSnack()</code>, which adds the
            message to the queue in <code>snackUtils</code>. The layout's
            <code>SnackbarHost</code> presents the queue one message at a time.
          </li>
          <li>
            <strong>Session snackbars</strong> use <code>pushSessionSnack()</code> to store one
            message in sessionStorage, then navigate. The <code>SnackbarHost</code> in the
            destination document collects it on mount and queues it there.
          </li>
          <li>
            A message with an <strong>action</strong> waits until the reader takes it, rather
            than timing out. Only immediate messages can carry one: a callback cannot survive
            a navigation.
          </li>
          <li>
            Session snackbars are useful for showing success messages after form submissions
            that redirect, like "Thread deleted" or "Profile updated".
          </li>
        </ul>
      </div>
    </section>
  </div>
</WithAuth>
