# Orch Map

一个基于 ECharts 的地理坐标系组件库 monorepo 项目，提供对 ECharts Geo 组件的二次封装。

## 📚 文档

- 📘 **[开发说明](./docs/DEVELOPMENT.md)** - 如何安装、启动、测试和项目结构
- 📖 **[使用说明](./docs/USAGE.md)** - 如何在自己的项目中使用

## 🚀 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/SKT-Shurima/orch-map.git
cd orch-map

# 安装依赖
pnpm install
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

### 使用

在你的项目 `package.json` 中添加：

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

```bash
pnpm install
```

**注意**: 需要安装 `patch-package` 来应用对 `@deck.gl/layers` 的补丁。

```typescript
import { Geo } from 'orch-map/core';
import type { GeoConfig } from 'orch-map/types';

const config: GeoConfig = {
  mapName: 'china',
  center: [105, 36],
  zoom: 1.2,
  roam: true,
};

const container = document.getElementById('map')!;
const geo = new Geo(container, config);

geo.addSeries({
  type: 'scatter',
  data: [
    { name: '北京', value: [116.46, 39.92, 100] },
    { name: '上海', value: [121.48, 31.22, 200] },
  ],
  symbolSize: 8,
  itemStyle: { color: '#ff6b6b' },
});
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
- **构建工具**: tsup (packages) + Vite (examples)
- **地图引擎**: ECharts 5.6
- **3D 渲染**: Deck.gl 9.2

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
