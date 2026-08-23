import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Vite plugin that regenerates the token stylesheets while `dev` runs, so
 * editing a JSON under `tokens/` shows on the next reload instead of waiting
 * for a by-hand `pnpm generate:tokens` (plans/debt, token generation is
 * unreachable). The generator writes `styles/*.css`, which the site imports
 * through Vite, so the write itself is what refreshes the page.
 *
 * Dev only: builds and merges stay guarded by `check:tokens` inside the
 * package's `test`. A generation failure is a contract violation in the JSON;
 * it is reported to the terminal and the stylesheets keep their last good
 * state, the same outcome the by-hand command gives.
 */
export function tokenWatch() {
  const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
  const generator = join(packageRoot, 'scripts/generate-tokens.mjs');
  const tokensDir = join(packageRoot, 'tokens');

  let running = false;
  let queued = false;

  /** @type {import("vite").Plugin} */
  const plugin = {
    name: 'design-system-token-watch',
    apply: 'serve',
    configureServer(server) {
      const generate = () => {
        if (running) {
          queued = true;
          return;
        }
        running = true;
        const run = spawn(process.execPath, [generator], { stdio: 'inherit' });
        run.on('close', () => {
          running = false;
          if (queued) {
            queued = false;
            generate();
          }
        });
      };

      server.watcher.add(tokensDir);
      server.watcher.on('change', (file) => {
        if (file.startsWith(tokensDir) && file.endsWith('.json')) generate();
      });
    },
  };
  return plugin;
}
