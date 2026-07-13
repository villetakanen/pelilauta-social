# Client-side Sentry Integration

This project now uses manual client-side Sentry initialization to avoid conflicts with Netlify Edge Functions (Deno runtime).

## How It Works

1. **Automatic Initialization**: Sentry is automatically initialized on page load through the `BaseHead.astro` component
2. **Client-Side Only**: Sentry only runs in the browser, avoiding Node.js module conflicts in edge functions
3. **Production Only**: Sentry is disabled in development mode

## Usage Examples

### Manual Error Tracking

```typescript
import { captureError, captureMessage } from '@utils/client/sentry';

try {
  // Some risky operation
  await riskyFunction();
} catch (error) {
  // Capture error with additional context
  await captureError(error as Error, {
    component: 'MyComponent',
    action: 'riskyFunction',
    userId: user?.id,
  });
}

// Capture informational messages
await captureMessage('User completed onboarding', 'info');
```

### In Svelte Components

```svelte
<script lang="ts">
import { captureError } from '@utils/client/sentry';

async function handleSubmit() {
  try {
    await submitForm();
  } catch (error) {
    await captureError(error as Error, {
      component: 'FormComponent',
      formData: { ... }
    });
  }
}
</script>
```

## Configuration

The Sentry configuration is in `src/utils/client/sentry.ts`:

- **DSN**: Points to the production Sentry project
- **Environment**: Automatically set based on build mode
- **Performance Monitoring**: Disabled (tracesSampleRate: 0)
- **Session Replays**: Disabled
- **PII**: Disabled for privacy

## Benefits

1. **Edge Function Compatible**: No Node.js modules in edge functions
2. **Automatic**: Initializes on every page load
3. **Development Friendly**: Disabled in dev mode
4. **Privacy First**: No PII collection
5. **Performance Optimized**: Minimal overhead with disabled features

## Build Process

The build now works with Netlify Edge Functions without the previous Node.js module conflicts:

```bash
pnpm build  # Now works without Sentry-related edge function errors
```
