import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  // 打包所有内部依赖
  noExternal: [/^@orch-map\//],
  // 不复制任何静态文件，data 目录作为独立资源
  publicDir: false,
  // 使用更简单的 TypeScript 配置
  tsconfig: './tsconfig.json'
});
