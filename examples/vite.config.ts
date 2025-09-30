import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import path from 'path';
import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';

export default defineConfig({
  plugins: [
    vue(), 
    vueJsx(),
    {
      name: 'mapData-middleware',
      configureServer(server) {
        server.middlewares.use('/mapData', (req, res, next) => {
          const url = req.url;
          if (!url) return next();
          
          try {
            // 直接使用包的主模块路径来推断包目录
            const require = createRequire(import.meta.url);
            const coreModulePath = require.resolve('@orch-map/core');
            // 从 dist/index.js 向上找到包根目录
            const coreDir = path.dirname(path.dirname(coreModulePath));
            // 移除 URL 前导斜杠，避免 path.resolve 将其视为绝对路径
            const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
            const filePath = path.resolve(coreDir, 'mapData', cleanUrl);
            const content = readFileSync(filePath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(content);
          } catch (error) {
            console.error('Error serving mapData:', error instanceof Error ? error.message : String(error));
            console.error('Request URL:', url);
            next();
          }
        });
      }
    }
  ],
  server: {
    port: 3000,
    open: true,
    fs: {
      allow: ['..']
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      '@orch-map/utils': path.resolve(__dirname, '../packages/utils/src'),
      '@orch-map/core': path.resolve(__dirname, '../packages/core/src'),
    },
  },
});

