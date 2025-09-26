import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import path from 'path';

export default defineConfig({
  plugins: [vue(), vueJsx()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      '@orch-map/types': path.resolve(__dirname, '../packages/types/src'),
      '@orch-map/utils': path.resolve(__dirname, '../packages/utils/src'),
      '@orch-map/core': path.resolve(__dirname, '../packages/core/src'),
    },
  },
});

