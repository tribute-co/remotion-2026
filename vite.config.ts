import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
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
