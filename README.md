# Orch Map

一个基于 ECharts 的地理坐标系组件库 monorepo 项目，提供对 ECharts Geo 组件的二次封装。

> 📚 **[查看完整文档](./docs/README.md)** | 🚀 **[快速开始](./docs/QUICK_START.md)** | 📖 **[使用指南](./docs/USAGE.md)**

## 项目结构

```
orch-map/
├── packages/           # 核心依赖包
│   ├── types/         # 简单类型定义
│   ├── utils/         # 简单工具函数
│   ├── mapdata/       # 地图数据
│   └── core/          # 核心地图功能
├── docs/              # 项目文档
│   ├── README.md      # 文档索引
│   ├── QUICK_START.md # 快速开始
│   ├── USAGE.md       # 使用指南
│   ├── PUBLISHING.md  # 发布指南
│   └── example-project-setup.md # 项目集成示例
├── examples/          # 简单示例 (Vue3 + TSX)
├── package.json       # 根配置文件
└── pnpm-workspace.yaml # pnpm workspace 配置
```

## 快速开始

### 安装依赖

```bash
# 安装所有依赖
pnpm install

# 构建所有包
pnpm build

# 运行示例
pnpm dev
```

### 开发模式

```bash
# 监听模式构建 packages
pnpm -r --filter='!examples/*' build --watch

# 运行示例项目
pnpm --filter='basic-example' dev
```

## Packages

### @orch-map/types

提供简单的类型定义。

```typescript
import type { MapConfig, DataPoint } from '@orch-map/types';
```

### @orch-map/utils

提供简单的工具函数。

```typescript
import { getChinaCities } from '@orch-map/utils';
```

### @orch-map/core

提供核心地理坐标系功能，包括 Geo 组件、地图注册管理和工具函数。

```typescript
import { Geo, MapRegistry, GeoUtils } from '@orch-map/core';
import type { GeoConfig, GeoData } from '@orch-map/core';
```

## 使用示例

### 基本用法

```typescript
import { Geo } from '@orch-map/core';
import type { GeoConfig, GeoData } from '@orch-map/core';

const config: GeoConfig = {
  mapName: 'china',
  center: [105, 36],
  zoom: 1.2,
  roam: true,
  areaColor: '#f0f0f0',
  borderColor: '#999',
};

const geoContainer = document.getElementById('geo');
const geo = new Geo(geoContainer, config);

// 添加数据系列
const data: GeoData[] = [
  { name: '北京', value: [116.46, 39.92, 100] },
  { name: '上海', value: [121.48, 31.22, 200] },
  { name: '广州', value: [113.23, 23.16, 150] },
];

geo.addSeries({
  type: 'scatter',
  data: data,
  symbolSize: 8,
  itemStyle: { color: '#ff6b6b' },
});
```

### 高级用法

```typescript
import { Geo, GeoUtils } from '@orch-map/core';

// 使用工具类自动配置
const autoConfig = GeoUtils.autoConfigGeo(data, { width: 800, height: 600 });
const geo = new Geo(container, { mapName: 'china', ...autoConfig });

// 设置事件处理器
geo.setEventHandlers({
  onRegionClick: (params) => console.log('点击了:', params.name),
  onRegionMouseOver: (params) => console.log('悬停在:', params.name),
});

// 数据过滤和排序
const filteredData = GeoUtils.filterByValue(data, 100, 200);
const sortedData = GeoUtils.sortByValue(filteredData, false);
```

## 开发指南

### 运行示例

```bash
# 安装依赖
pnpm install

# 运行示例项目
pnpm dev
```

## 技术栈

- **包管理**: pnpm + workspace
- **语言**: TypeScript
- **构建工具**: tsup (packages) + Vite (examples)
- **前端框架**: Vue3 + TSX
- **地图引擎**: ECharts 5.6
- **开发服务器**: Vite

## 发布和使用

### 发布到 GitHub

将项目推送到 GitHub 后，可以通过 Git 依赖在其他项目中使用这些包：

```json
{
  "dependencies": {
    "@orch-map/core": "github:SKT-Shurima/orch-map#packages/core",
    "@orch-map/types": "github:SKT-Shurima/orch-map#packages/types",
    "@orch-map/utils": "github:SKT-Shurima/orch-map#packages/utils",
    "@orch-map/mapdata": "github:SKT-Shurima/orch-map#packages/mapData"
  }
}
```

详细说明请查看：

- **[QUICK_START.md](./docs/QUICK_START.md)** - 快速开始
- **[USAGE.md](./docs/USAGE.md)** - 使用指南
- **[PUBLISHING.md](./docs/PUBLISHING.md)** - 发布指南（npm/GitHub/GitHub Packages）
- **[example-project-setup.md](./docs/example-project-setup.md)** - 在外部项目中使用示例

## 许可证

MIT
