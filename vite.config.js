import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/swim-crew/' : '/',
  test: {
    environment: 'jsdom',
  },
});
