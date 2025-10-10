import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@orch-map/types'],
  // 不打包 JSON 文件，保持原样
  noExternal: [],
  // 不复制任何静态文件，data 目录作为独立资源
  publicDir: false,
  // 使用更简单的 TypeScript 配置
  tsconfig: './tsconfig.json'
});
