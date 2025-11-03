# 开发文档

本文档面向参与 Orch Map 项目开发的开发者，介绍项目结构、开发环境搭建、开发流程和代码规范。

## 📋 目录

- [环境要求](#环境要求)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [开发流程](#开发流程)
- [包说明](#包说明)
- [构建系统](#构建系统)
- [代码规范](#代码规范)
- [测试](#测试)
- [常见问题](#常见问题)

## 🔧 环境要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0 (必须，项目使用 pnpm workspace)
- **操作系统**: macOS / Linux / Windows

## 📁 项目结构

```
orch-map/
├── packages/              # 核心依赖包
│   ├── types/            # TypeScript 类型定义包
│   │   ├── src/          # 类型定义源代码
│   │   ├── dist/         # 构建输出
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── utils/            # 工具函数包
│   │   ├── src/          # 工具函数源代码
│   │   ├── dist/         # 构建输出
│   │   └── package.json
│   ├── path-adapter/     # 地图数据路径适配器
│   │   ├── src/          # 适配器源代码
│   │   ├── dist/         # 构建输出
│   │   └── package.json
│   └── core/             # 核心地图功能包
│       ├── src/          # 核心功能源代码
│       │   ├── deckgl/           # DeckGL 渲染器
│       │   ├── echarts-geo/      # ECharts 渲染器
│       │   ├── interfaces/       # 接口定义
│       │   ├── utils/            # 工具函数
│       │   ├── MapStateManager.ts # 地图状态管理
│       │   └── main.ts           # 主入口文件
│       ├── dist/         # 构建输出
│       └── package.json
├── examples/             # 示例项目
│   ├── src/              # 示例代码
│   └── package.json
├── docs/                 # 项目文档
├── patches/              # 第三方库补丁
│   └── @deck.gl__layers@9.2.2.patch
├── package.json          # 根配置文件
├── pnpm-workspace.yaml   # pnpm workspace 配置
├── turbo.json            # Turbo 构建配置
└── tsconfig.json         # TypeScript 根配置
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/SKT-Shurima/orch-map.git
cd orch-map
```

### 2. 安装依赖

```bash
pnpm install
```

这会自动：
- 安装根目录和所有子包的依赖
- 应用 `@deck.gl/layers` 的补丁（通过 postinstall 脚本）

### 3. 构建项目

```bash
# 构建所有包
pnpm build
```

构建顺序由 Turbo 自动处理：
1. `@orch-map/types` (基础依赖，无依赖)
2. `@orch-map/utils` (依赖 types)
3. `@orch-map/path-adapter` (依赖 types)
4. `@orch-map/core` (依赖所有其他包)

### 4. 开发模式

#### 方式一：监听模式（推荐）

在一个终端运行：

```bash
# 监听所有包的构建
pnpm -r --filter='!examples/*' build --watch
```

在另一个终端运行示例：

```bash
# 运行示例项目
pnpm --filter='examples' dev
```

#### 方式二：开发单个包

```bash
# 进入要开发的包目录
cd packages/core

# 启动监听模式
pnpm dev
```

## 📦 包说明

### @orch-map/types

纯 TypeScript 类型定义包，不包含任何运行时代码。

- **位置**: `packages/types/`
- **依赖**: 无
- **导出**: 所有类型定义和枚举
- **用途**: 为其他包提供类型定义

### @orch-map/utils

通用工具函数包。

- **位置**: `packages/utils/`
- **依赖**: `@orch-map/types`
- **功能**: 
  - 颜色转换（hexToRgb, rgbToHex）
  - 坐标计算（coordinate）
  - 动画工具（animate）
  - GeoJSON 处理
  - 图标处理（svgToEChartsSymbol）

### @orch-map/path-adapter

地图数据路径适配器，负责地图数据的路径管理和获取。

- **位置**: `packages/path-adapter/`
- **依赖**: `@orch-map/types`
- **功能**:
  - 地图数据路径管理
  - GeoJSON 数据获取服务
  - 支持中国、美国、世界地图数据适配
- **注意**: 需要配合 `@orch-map/geo-json` 项目使用

### @orch-map/core

核心地图功能包，包含地图渲染器和主要 API。

- **位置**: `packages/core/`
- **依赖**: 所有其他包 + echarts（peer dependency）
- **功能**:
  - `OrchMap` 主类（工厂模式，支持 ECharts 和 DeckGL）
  - `EchartsMap` ECharts 渲染器实现
  - `DeckglMap` DeckGL 渲染器实现
  - `MapStateManager` 地图状态管理
  - 地图工具函数

### 包依赖关系

```
types (无依赖)
  ↓
utils, path-adapter (依赖 types)
  ↓
core (依赖所有)
```

## 🔨 构建系统

### Turbo

项目使用 [Turbo](https://turbo.build/) 进行构建编排，实现：

- **并行构建**: 自动检测依赖关系，并行构建独立包
- **缓存**: 构建结果缓存，加速后续构建
- **依赖管理**: 自动处理包之间的构建顺序

### tsup

所有包使用 `tsup` 进行构建：

- 支持 ES Module 和 CommonJS 输出
- TypeScript 类型定义生成
- 源码映射生成
- 代码压缩和优化

### 构建命令

```bash
# 构建所有包
pnpm build

# 构建并监听变化
pnpm -r --filter='!examples/*' build --watch

# 清理构建产物
pnpm clean

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 自动修复代码问题
pnpm lint:fix
```

## 📝 代码规范

### TypeScript

- 使用 TypeScript 5.x
- 启用严格模式 (`strict: true`)
- 优先使用 `interface` 而非 `type`
- 完整的类型注解，避免 `any`
- 使用 JSDoc 注释

### 命名规范

- **文件**: `camelCase.ts` (例如: `geoUtils.ts`)
- **类**: `PascalCase` (例如: `OrchMap`)
- **函数/变量**: `camelCase` (例如: `setPoints`)
- **常量**: `UPPER_SNAKE_CASE` (例如: `DEFAULT_ZOOM`)
- **枚举**: `PascalCase` (例如: `MapLevel`)
- **接口**: `PascalCase`，接口名称以 `I` 开头或描述性名称 (例如: `IMapRenderer`, `MapRendererConfig`)

### 目录结构

```
src/
├── interfaces/      # 接口定义
├── utils/          # 工具函数
├── constants/       # 常量定义
├── components/     # 组件（如适用）
└── main.ts         # 入口文件
```

### 提交规范

建议使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```bash
# 功能
git commit -m "feat: 添加地图缩放功能"

# 修复
git commit -m "fix: 修复地图导航偏移问题"

# 文档
git commit -m "docs: 更新 API 文档"

# 重构
git commit -m "refactor: 重构地图状态管理"

# 性能优化
git commit -m "perf: 优化地图渲染性能"

# 测试
git commit -m "test: 添加地图层级切换测试"
```

### 代码风格

项目使用 ESLint 和 Prettier：

```bash
# 检查代码
pnpm lint

# 自动修复
pnpm lint:fix
```

## 🧪 测试

### 类型检查

```bash
# 检查所有包的类型
pnpm type-check
```

### 手动测试

使用 `examples/` 目录中的示例项目进行手动测试：

```bash
# 运行示例项目
pnpm --filter='examples' dev

# 访问 http://localhost:5173
```

### 测试新功能

1. 在对应包的 `src/` 中编写代码
2. 构建包（监听模式会自动构建）
3. 在 `examples/src/App.tsx` 中添加测试代码
4. 运行示例项目查看效果

## 🔍 调试

### VS Code

1. 安装推荐扩展（ESLint、Prettier 等）
2. 在源代码中设置断点
3. 使用 VS Code 的调试功能

### Chrome DevTools

在示例项目中使用：

```typescript
import OrchMap from '@orch-map/core';

const mapInstance = new OrchMap({...});
console.log('Map instance:', mapInstance);
// 在控制台检查实例
```

## 📚 开发工作流

### 添加新功能

1. **创建功能分支**
   ```bash
   git checkout -b feat/new-feature
   ```

2. **开发代码**
   - 在对应的包中添加代码
   - 确保类型定义完整
   - 添加必要的注释

3. **测试**
   - 在示例项目中测试新功能
   - 运行类型检查：`pnpm type-check`
   - 运行代码检查：`pnpm lint`

4. **提交**
   ```bash
   git add .
   git commit -m "feat: 添加新功能"
   ```

5. **创建 Pull Request**

### 修改现有功能

1. 找到对应的源文件
2. 进行修改
3. 确保不影响其他包
4. 在示例项目中测试
5. 提交修改

### 添加新的地图数据支持

⚠️ **注意**: 地图数据已分离到独立的 `@orch-map/geo-json` 项目。

如果需要在 `path-adapter` 中添加新的地图数据适配：

1. 在 `packages/path-adapter/src/managers/` 中创建新的 PathManager
2. 在 `PathManagerFactory` 中注册
3. 更新 `DataService` 以支持新数据源
4. 测试数据加载和路径解析

## 🐛 常见问题

### Q: 构建失败，提示找不到模块？

确保所有依赖已安装：
```bash
pnpm install
```

然后重新构建：
```bash
pnpm build
```

### Q: 如何添加新的包？

1. 在 `packages/` 下创建新目录
2. 添加 `package.json`，配置正确的依赖
3. 在根目录 `pnpm-workspace.yaml` 中确保包含（通常已通过 `packages/*` 包含）
4. 运行 `pnpm install` 安装依赖

### Q: 补丁没有应用？

检查 `package.json` 中是否有 `postinstall` 脚本：
```json
{
  "scripts": {
    "postinstall": "patch-package || exit 0"
  }
}
```

手动应用：
```bash
npx patch-package
```

### Q: 类型定义找不到？

确保已构建 `@orch-map/types`：
```bash
cd packages/types
pnpm build
```

### Q: 如何更新依赖？

```bash
# 更新所有依赖
pnpm update --latest

# 更新特定依赖
pnpm update <package-name> --latest
```

### Q: 开发时如何查看包的变化？

使用监听模式：
```bash
pnpm -r --filter='!examples/*' build --watch
```

在示例项目中，导入会使用最新构建的版本。

## 🔗 相关资源

- [Turbo 文档](https://turbo.build/repo/docs)
- [pnpm Workspace](https://pnpm.io/workspaces)
- [tsup 文档](https://tsup.egoist.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)

## 📖 相关文档

- [USAGE.md](./USAGE.md) - 使用文档（面向使用者）

