<script lang="ts">
import { auth } from '@firebase/client';
import { logDebug } from '@utils/logHelpers';
import { onMount } from 'svelte';

onMount(() => {
  if (typeof window === 'undefined') return;

  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      const tokenResult = await user.getIdTokenResult();
      const claims = tokenResult.claims;
      let eulaAccepted = claims.eula_accepted === true;
      let accountCreated = claims.account_created === true;

      logDebug('AuthManager', 'Initial user claims', {
        eulaAccepted,
        accountCreated,
      });

      // If claims are missing, check the server for legacy data
      if (!eulaAccepted || !accountCreated) {
        logDebug(
          'AuthManager',
          'Claims missing, checking server status for legacy data',
        );

        try {
          const response = await fetch('/api/auth/status', {
            credentials: 'include',
          });

          if (response.ok) {
            const serverStatus = await response.json();
            logDebug('AuthManager', 'Server status response', serverStatus);

            // If server updated claims, force token refresh
            if (
              serverStatus.eula_accepted !== eulaAccepted ||
              serverStatus.account_created !== accountCreated
            ) {
              logDebug(
                'AuthManager',
                'Server updated claims, refreshing token',
              );
              await user.getIdToken(true); // Force refresh

              // Get updated token with new claims
              const refreshedTokenResult = await user.getIdTokenResult();
              const refreshedClaims = refreshedTokenResult.claims;
              eulaAccepted = refreshedClaims.eula_accepted === true;
              accountCreated = refreshedClaims.account_created === true;

              logDebug('AuthManager', 'Refreshed user claims', {
                eulaAccepted,
                accountCreated,
              });
            }
          }
        } catch (error) {
          logDebug('AuthManager', 'Error checking server status:', error);
        }
      }

      const currentPath = window.location.pathname;

      const publicPaths = ['/onboarding'];
      const isPublicPath =
        publicPaths.includes(currentPath) || currentPath.startsWith('/login');

      // If user has missing EULA acceptance or account creation, redirect to onboarding
      if ((!eulaAccepted || !accountCreated) && !isPublicPath) {
        const reason = !eulaAccepted
          ? 'EULA not accepted'
          : 'Account not created';
        logDebug(
          'AuthManager',
          `${reason}, redirecting from ${currentPath} to /onboarding`,
        );
        window.location.href = '/onboarding';
        return;
      }
    }
  });

  return () => unsubscribe();
});
</script>
