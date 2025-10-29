import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  target: 'es2018', // 确保浏览器兼容性
  // 打包所有内部依赖
  noExternal: [/^@orch-map\//],
});
