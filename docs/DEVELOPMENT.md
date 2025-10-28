# 开发说明文档

本文档说明如何参与 Orch Map 项目的开发工作。

## 📋 目录

- [环境要求](#环境要求)
- [项目结构](#项目结构)
- [安装依赖](#安装依赖)
- [启动开发](#启动开发)
- [测试](#测试)
- [构建](#构建)
- [代码规范](#代码规范)

## 🔧 环境要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **操作系统**: macOS / Linux / Windows

## 📁 项目结构

```
orch-map/
├── packages/           # 核心依赖包
│   ├── types/         # TypeScript 类型定义
│   │   ├── src/       # 源代码
│   │   └── dist/      # 构建输出
│   ├── utils/         # 工具函数
│   │   ├── src/       # 源代码
│   │   └── dist/      # 构建输出
│   ├── mapData/       # 地图数据
│   │   ├── src/       # 数据服务源码
│   │   ├── data/      # GeoJSON 数据文件
│   │   └── dist/      # 构建输出
│   └── core/          # 核心地图功能
│       ├── src/       # 源代码
│       │   ├── echarts-geo/     # ECharts Geo 组件
│       │   ├── deckgl/          # Deck.gl 相关
│       │   ├── interfaces/      # 接口定义
│       │   └── utils/           # 工具函数
│       └── dist/      # 构建输出
├── examples/          # 示例项目
│   └── src/           # 示例代码
├── docs/              # 项目文档
├── scripts/           # 构建脚本
├── patches/           # 第三方库补丁
├── package.json       # 根配置文件
├── pnpm-workspace.yaml # pnpm workspace 配置
└── turbo.json         # Turbo 配置
```

### 包说明

- **@orch-map/types**: 纯 TypeScript 类型定义，不包含任何运行时代码
- **@orch-map/utils**: 通用工具函数（颜色、坐标、动画等）
- **@orch-map/path-adapter**: 地图数据路径适配器（需要配合 @orch-map/geo-json 项目使用）
- **@orch-map/core**: 核心功能，包含 ECharts Geo 和 Deck.gl 支持

## 📦 安装依赖

```bash
# 克隆仓库
git clone https://github.com/SKT-Shurima/orch-map.git petals
cd orch-map

# 安装所有依赖（包括子包）
pnpm install
```

这将安装：

- 根目录依赖
- 各个子包的依赖
- 自动应用 `@deck.gl/layers` 的补丁

## 🚀 启动开发

### 模式一：监听模式构建

在开发 packages 时，使用监听模式自动重新构建：

```bash
# 监听所有包的构建
pnpm -r --filter='!examples/*' build --watch
```

这将监听所有 packages 的代码变化，自动重新构建。

### 模式二：运行示例项目

```bash
# 先构建 packages
pnpm build

# 运行示例项目
pnpm --filter='examples' dev
```

或同时进行：

```bash
# 在一个终端构建 packages
pnpm -r --filter='!examples/*' build --watch

# 在另一个终端运行示例
pnpm --filter='examples' dev
```

### 模式三：开发单个包

如果只修改某个包，可以单独开发：

```bash
# 开发 core 包
cd packages/core
pnpm dev

# 开发 types 包
cd packages/types
pnpm dev
```

## 🧪 测试

### 运行类型检查

```bash
# 检查所有包的类型
pnpm type-check
```

### 运行 Linter

```bash
# 检查代码规范
pnpm lint

# 自动修复
pnpm lint:fix
```

### 手动测试

在 `examples/` 目录中有完整的示例项目，可以用来测试新功能：

```bash
# 运行示例
pnpm --filter='examples' dev
```

访问 http://localhost:5173 查看效果。

## 🔨 构建

### 构建所有包

```bash
# 使用 Turbo 并行构建
pnpm build
```

构建顺序（自动处理）：

1. types（基础依赖）
2. utils（依赖 types）
3. mapData（依赖 types）
4. core（依赖所有）

### 构建单个包

```bash
# 构建 core
cd packages/core
pnpm build

# 构建 types
cd packages/types
pnpm build
```

### 清理构建产物

```bash
# 清理所有构建产物
pnpm clean

# 清理单个包
cd packages/core
pnpm clean
```

## 📝 代码规范

### TypeScript

- 使用 TypeScript 5.x
- 启用严格模式
- 完整的类型定义
- 使用 `interface` 而非 `type`（推荐）

### 命名规范

- **文件**: `camelCase` (例如: `geoUtils.ts`)
- **组件**: `PascalCase` (例如: `Geo.ts`)
- **函数/变量**: `camelCase` (例如: `getChinaCities`)
- **常量**: `UPPER_SNAKE_CASE` (例如: `MAX_ZOOM`)

### 提交规范

建议使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```bash
# 功能
git commit -m "feat: 添加中国城市搜索功能"

# 修复
git commit -m "fix: 修复地图缩放问题"

# 文档
git commit -m "docs: 更新 API 文档"

# 重构
git commit -m "refactor: 重构地图数据加载逻辑"
```

### 代码风格

项目使用 ESLint 和 Prettier 进行代码规范检查，提交前确保：

```bash
# 运行 linter
pnpm lint

# 自动修复
pnpm lint:fix
```

## 🔍 调试

### 使用 VS Code

1. 安装推荐的扩展
2. 在 `examples/` 中设置断点
3. 使用 VS Code 的调试功能

### 使用 Chrome DevTools

在示例项目中，使用 `console.log` 或调试工具：

```typescript
import { Geo } from '@orch-map/core';

const geo = new Geo(container, config);
console.log('Geo instance:', geo);
```

## 📚 常用命令

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 监听构建
pnpm -r --filter='!examples/*' build --watch

# 运行示例
pnpm dev

# 清理
pnpm clean

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 修复代码
pnpm lint:fix
```

## 🐛 常见问题

### Q: 构建失败？

确保先安装依赖：`pnpm install`

### Q: 找不到模块？

检查是否已构建：`pnpm build`

### Q: 如何添加新的地图数据？

⚠️ **注意**: 地图数据已分离到独立的 @orch-map/geo-json 项目。

1. 在 `@orch-map/geo-json/data/` 添加 GeoJSON 文件
2. 在 `@orch-map/path-adapter/src/` 添加路径适配逻辑
3. 运行 `pnpm build`

### Q: 如何添加新的类型定义？

在 `packages/types/src/` 添加类型文件，然后更新 `index.ts`。

## 📖 相关文档

- [USAGE.md](./USAGE.md) - 使用说明
