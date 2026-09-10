import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base is set from an env var so the same build works on GitHub Pages
// (where the site lives under /<repo>/) and on a custom domain.
export default defineConfig({
  base: process.env.SITE_BASE ?? '/',
  plugins: [react()],
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
});
