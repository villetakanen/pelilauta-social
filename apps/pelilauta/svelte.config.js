import { vitePreprocess } from '@astrojs/svelte';

export default {
  preprocess: vitePreprocess(),
  compilerOptions: {
    // enable run-time checks when not in production
    runes: true,
  },
};
