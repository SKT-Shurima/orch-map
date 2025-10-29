# Orch Map

一个强大的基于 ECharts 和 DeckGL 的地图可视化组件库，专为现代 Web 应用设计。支持世界地图、中国地图和美国地图的多层级展示，提供丰富的交互功能和数据可视化能力。

## ✨ 特性

- 🗺️ **多层级地图支持** - 世界地图、国家地图、省份/州地图无缝切换
- 🎨 **双渲染引擎** - 支持 ECharts 和 DeckGL 两种渲染方式
- 📊 **丰富的数据可视化** - 散点图、线条图、热力图等
- 🌍 **全球地图数据** - 内置世界、中国、美国地图数据
- 📱 **响应式设计** - 适配各种屏幕尺寸
- 🔧 **TypeScript 支持** - 完整的类型定义
- 🚀 **现代化构建** - 支持 ES Module、CommonJS 和 UMD 格式
- 🎯 **框架无关** - 支持 React、Vue、Angular 等现代框架

## 📚 文档

- 📘 **[开发说明](./docs/DEVELOPMENT.md)** - 如何安装、启动、测试和项目结构
- 📖 **[使用说明](./docs/USAGE.md)** - 如何在自己的项目中使用

## 🚀 快速开始

### 安装

#### 方式一：NPM 安装（推荐）

```bash
# 使用 pnpm（推荐）
pnpm add orch-map echarts

# 或使用 npm
npm install orch-map echarts

# 或使用 yarn
yarn add orch-map echarts
```

#### 方式二：从 GitHub 安装

```json
{
  "dependencies": {
    "orch-map": "github:SKT-Shurima/orch-map#master",
    "echarts": "^5.6.0"
  },
  "scripts": {
    "postinstall": "patch-package"
  },
  "devDependencies": {
    "patch-package": "^8.0.0"
  }
}
```

### 开发

```bash
# 构建所有包
pnpm build

# 监听模式构建
pnpm -r --filter='!examples/*' build --watch

# 运行示例
pnpm dev
```

### 基本使用

#### ES Module 方式

```typescript
import OrchMap, { MapRendererType } from 'orch-map/core';
import { MapLevel } from 'orch-map/types';

// 创建地图实例
const mapInstance = new OrchMap({
  renderType: MapRendererType.DECKGL,
  mapVersion: 'standard',
  mode: '3d',
  container: document.getElementById('map-container')!,
  curLevel: MapLevel.WORLD,
  country: '',
  postcode: '',
  events: {
    onMapClick: (event) => {
      console.log('地图点击:', event);
    },
  },
});

// 设置点位数据
mapInstance.setPoints([
  {
    id: 'beijing',
    name: '北京',
    coordinate: [116.46, 39.92],
    icon: 'star',
    size: 16,
  },
]);

// 设置线条数据
mapInstance.setLines([
  {
    id: 'line1',
    name: '连接线',
    startCoordinate: [116.46, 39.92],
    endCoordinate: [121.48, 31.22],
    color: '#ff6b6b',
  },
]);
```

## 📁 项目结构

```
orch-map/
├── packages/           # 核心依赖包
│   ├── types/         # TypeScript 类型定义
│   ├── utils/         # 工具函数
│   ├── mapData/       # 地图数据
│   └── core/          # 核心地图功能
├── docs/              # 项目文档
│   ├── DEVELOPMENT.md # 开发说明
│   └── USAGE.md       # 使用说明
├── examples/          # 示例项目
├── scripts/           # 构建脚本
└── patches/           # 第三方库补丁
```

## 🛠️ 技术栈

- **包管理**: pnpm + workspace
- **语言**: TypeScript
- **构建工具**: tsup (支持 ES Module、CommonJS、UMD)
- **地图引擎**: ECharts 5.6
- **3D 渲染**: DeckGL 9.2
- **浏览器支持**: ES2018+ (现代浏览器)

## 📦 Packages

### @orch-map/core

提供核心地理坐标系功能，包括 Geo 组件、地图注册管理和工具函数。

### @orch-map/types

提供 TypeScript 类型定义。

### @orch-map/utils

提供工具函数（颜色、坐标、动画等）。

### @orch-map/path-adapter

地图数据路径适配器，提供地图数据的路径管理和数据获取服务。
⚠️ 需要配合 @orch-map/geo-json 项目使用。

## 🔄 分支说明

- **master**: 源代码分支，包含所有源代码和开发文件

## 📖 更多文档

查看 [docs](./docs/) 目录了解更多信息。

## 📄 许可证

MIT
