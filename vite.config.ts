import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Avoid CORS in dev: browser requests same-origin, Vite fetches from CDN
      '/photos-r2-proxy': {
        target: 'https://photos-r2.tribute.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/photos-r2-proxy/, ''),
      },
      '/encode-proxy': {
        target: 'https://tribute-production-encode.b-cdn.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/encode-proxy/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
  resolve: {
    // Ensure a single instance of remotion and React so Player's composition
    // context is the same one consumed by Sequence/TransitionSeries (useVideoConfig).
    dedupe: ['remotion', 'react', 'react-dom'],
  },
});
