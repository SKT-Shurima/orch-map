import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  bundle: true,  // 打包所有依赖，除了 external 中指定的
  // echarts 作为外部依赖，由使用方提供
  external: ['echarts'],
  // 明确指定要打包的依赖（不作为外部依赖）
  noExternal: ['@deck.gl/core', '@deck.gl/layers', /^@orch-map\//],
  // 使用 tsconfig 的 paths 配置
  tsconfig: './tsconfig.json',
  onSuccess: async () => {
    // 复制 lib 文件夹到 dist 目录
    const libDir = join(__dirname, 'lib');
    const distLibDir = join(__dirname, 'dist', 'lib');
    
    if (existsSync(libDir)) {
      if (!existsSync(distLibDir)) {
        mkdirSync(distLibDir, { recursive: true });
      }
      
      // 复制 core.min.js
      const coreSrc = join(libDir, 'core.min.js');
      const coreDest = join(distLibDir, 'core.min.js');
      if (existsSync(coreSrc)) {
        copyFileSync(coreSrc, coreDest);
        console.log('✅ Copied core.min.js to dist/lib/');
      }
      
      // 复制 layers.min.js
      const layersSrc = join(libDir, 'layers.min.js');
      const layersDest = join(distLibDir, 'layers.min.js');
      if (existsSync(layersSrc)) {
        copyFileSync(layersSrc, layersDest);
        console.log('✅ Copied layers.min.js to dist/lib/');
      }
    }
  },
});

