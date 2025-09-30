# 包导出配置修复报告

## 问题描述

在开发过程中遇到了以下错误：

```
Failed to resolve entry for package "@orch-map/types". The package may have incorrect main/module/exports specified in its package.json: No known conditions for "." specifier in "@orch-map/types" package
```

## 问题根因

1. **包导出配置不完整**：`@orch-map/types` 包的 `package.json` 中的 `exports` 字段只配置了 `types`，缺少了 `import` 和 `require` 字段。

2. **缺少运行时文件**：虽然类型定义文件存在，但缺少 JavaScript 运行时文件（`.js` 和 `.mjs`）。

3. **构建配置问题**：TypeScript 配置设置为只生成声明文件，没有生成 JavaScript 文件。

## 解决方案

### 1. 修复 package.json 导出配置

```json
{
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
}
```

### 2. 更新构建工具

- 使用 `tsup` 替代纯 TypeScript 编译器
- 配置同时生成 CJS 和 ESM 格式的文件
- 确保类型声明文件正确生成

### 3. 创建 tsup 配置

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
});
```

### 4. 更新构建脚本

```json
{
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "clean": "rm -rf dist",
    "type-check": "tsc --noEmit"
  }
}
```

## 修复结果

修复后生成的文件结构：

```
dist/
├── index.d.mts    # ESM 类型声明
├── index.d.ts     # CJS 类型声明
├── index.js       # CJS 运行时文件
├── index.js.map   # CJS source map
├── index.mjs      # ESM 运行时文件
└── index.mjs.map  # ESM source map
```

## 验证

- ✅ Vite 可以正确解析 `@orch-map/types` 包
- ✅ 支持 ESM 和 CJS 两种模块格式
- ✅ 类型声明文件正确生成
- ✅ 开发服务器正常启动，无错误

## 最佳实践

1. **完整的包导出配置**：确保 `package.json` 中的 `exports` 字段包含所有必要的条件（types、import、require）

2. **多格式支持**：同时提供 CJS 和 ESM 格式的文件，确保兼容性

3. **现代构建工具**：使用 `tsup` 等现代构建工具，简化配置并提高构建效率

4. **类型安全**：确保类型声明文件正确生成，支持 TypeScript 类型检查

## 相关文件

- `packages/types/package.json` - 包配置
- `packages/types/tsup.config.ts` - 构建配置
- `packages/types/dist/` - 构建输出目录
