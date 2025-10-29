# 使用说明

本文档说明如何在你的项目中使用 Orch Map 地图可视化组件库。

## 📋 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [基本使用](#基本使用)
- [高级功能](#高级功能)
- [框架集成](#框架集成)
- [API 参考](#api-参考)
- [常见问题](#常见问题)

## 📦 安装

### 环境要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0 (推荐) 或 npm / yarn
- **浏览器**: 支持 ES2018+ 的现代浏览器

### 方式一：NPM 安装（推荐）

```bash
# 使用 pnpm（推荐）
pnpm add orch-map echarts

# 或使用 npm
npm install orch-map echarts

# 或使用 yarn
yarn add orch-map echarts
```

### 方式二：从 GitHub 安装

在项目根目录的 `package.json` 中添加依赖：

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

然后安装：

```bash
pnpm install
# 或
npm install
# 或
yarn install
```

**注意**:

- `echarts` 是必需的 peer dependency，需要单独安装。
- `patch-package` 需要添加到 devDependencies 中，用于应用对 `@deck.gl/layers` 的补丁。

### 指定版本

可以通过不同的方式指定版本：

```json
{
  "dependencies": {
    // 使用 master 分支
    "orch-map": "github:SKT-Shurima/orch-map#master",

    // 使用特定 tag
    "orch-map": "github:SKT-Shurima/orch-map#v1.0.0"
  }
}
```

## 🚀 快速开始

### 基本示例

```typescript
import { Geo } from 'orch-map/core';
import type { GeoConfig } from 'orch-map/types';

// 准备容器
const container = document.getElementById('map')!;

// 配置地图
const config: GeoConfig = {
  mapName: 'china',
  center: [105, 36],
  zoom: 1.2,
  roam: true,
};

// 创建地图实例
const geo = new Geo(container, config);

// 添加数据
geo.addSeries({
  type: 'scatter',
  data: [
    { name: '北京', value: [116.46, 39.92, 100] },
    { name: '上海', value: [121.48, 31.22, 200] },
    { name: '广州', value: [113.23, 23.16, 150] },
  ],
  symbolSize: 8,
  itemStyle: { color: '#ff6b6b' },
});
```

## 📖 基本使用

### 1. 导入模块

```typescript
// 核心功能
import { Geo, MapRegistry, GeoUtils } from 'orch-map/core';

// 类型定义
import type { GeoConfig, GeoData } from 'orch-map/types';

// 工具函数
import { hexToRgb, animate } from 'orch-map/utils';

// 地图数据
import { getChinaCities } from 'orch-map/mapData';
```

### 2. 创建地图配置

```typescript
const config: GeoConfig = {
  mapName: 'china', // 地图名称
  center: [105, 36], // 中心点坐标
  zoom: 1.2, // 缩放级别
  roam: true, // 允许缩放和平移
  areaColor: '#f0f0f0', // 区域颜色
  borderColor: '#999', // 边框颜色
  borderWidth: 1, // 边框宽度
  aspectScale: 0.75, // 宽高比
  layoutCenter: ['50%', '50%'], // 布局中心
  layoutSize: '80%', // 布局大小
};
```

### 3. 初始化地图

```typescript
const container = document.getElementById('map-container')!;
const geo = new Geo(container, config);
```

### 4. 添加数据系列

#### 散点图

```typescript
geo.addSeries({
  type: 'scatter',
  data: [
    { name: '北京', value: [116.46, 39.92, 100] },
    { name: '上海', value: [121.48, 31.22, 200] },
  ],
  symbolSize: (val) => val[2] / 2, // 大小融合
  itemStyle: { color: '#ff6b6b' },
  label: {
    show: true,
    formatter: '{b}',
    position: 'top',
  },
});
```

#### 热力图

```typescript
geo.addSeries({
  type: 'effectScatter',
  data: [...],
  symbolSize: 8,
  rippleEffect: {
    brushType: 'stroke',
    scale: 2.5,
  },
  itemStyle: { color: '#ff6b6b' },
});
```

### 5. 事件处理

```typescript
geo.setEventHandlers({
  onRegionClick: (params) => {
    console.log('点击了区域:', params.name);
  },
  onRegionMouseOver: (params) => {
    console.log('悬停在:', params.name);
  },
});
```

## 🎯 高级功能

### 使用工具类

```typescript
import { GeoUtils } from 'orch-map/core';

const data = [
  { name: '北京', value: [116.46, 39.92, 100] },
  { name: '上海', value: [121.48, 31.22, 200] },
];

// 自动计算配置
const autoConfig = GeoUtils.autoConfigGeo(data, { width: 800, height: 600 });

// 过滤数据
const filtered = GeoUtils.filterByValue(data, 100, 200);

// 排序数据
const sorted = GeoUtils.sortByValue(data, false);
```

### 地图注册

```typescript
import { MapRegistry } from 'orch-map/core';
import chinaGeoJson from 'orch-map/mapData/data/china/100000.json';

// 注册自定义地图
MapRegistry.registerMap('my-china', chinaGeoJson);

// 使用注册的地图
const geo = new Geo(container, {
  mapName: 'my-china',
  // ...
});
```

### 地图数据

```typescript
import { getChinaCities, getCityByName } from 'orch-map/mapData';

// 获取所有城市
const cities = getChinaCities();

// 根据名称查找
const beijing = getCityByName('北京');
```

### 颜色和动画工具

```typescript
import { hexToRgb, animate } from 'orch-map/utils';

// 颜色转换
const rgb = hexToRgb('#ff6b6b');

// 动画
animate(0, 100, 1000, (value) => {
  // 更新动画值
});
```

## 🔗 框架集成

### Vue 3

```vue
<template>
  <div ref="containerRef" style="width: 100%; height: 600px;"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Geo } from 'orch-map/core';
import type { GeoConfig } from 'orch-map/types';

const containerRef = ref<HTMLElement>();
let geo: Geo | null = null;

onMounted(() => {
  if (!containerRef.value) return;

  const config: GeoConfig = {
    mapName: 'china',
    center: [105, 36],
    zoom: 1.2,
  };

  geo = new Geo(containerRef.value, config);

  geo.addSeries({
    type: 'scatter',
    data: [{ name: '北京', value: [116.46, 39.92, 100] }],
  });
});

onUnmounted(() => {
  geo?.dispose();
});
</script>
```

### React

```tsx
import React, { useEffect, useRef } from 'react';
import { Geo } from 'orch-map/core';
import type { GeoConfig } from 'orch-map/types';

const MapComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: GeoConfig = {
      mapName: 'china',
      center: [105, 36],
      zoom: 1.2,
    };

    const geo = new Geo(containerRef.current, config);

    geo.addSeries({
      type: 'scatter',
      data: [{ name: '北京', value: [116.46, 39.92, 100] }],
    });

    return () => {
      geo.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '600px' }} />;
};

export default MapComponent;
```

## 📚 API 参考

### Geo

主地图类。

#### 构造函数

```typescript
new Geo(container: HTMLElement, config: GeoConfig)
```

#### 方法

##### addSeries(options)

添加数据系列。

```typescript
geo.addSeries({
  type: 'scatter' | 'effectScatter',
  data: GeoData[],
  symbolSize?: number | ((val: number[]) => number),
  itemStyle?: object,
  label?: object,
  // ... 其他 ECharts 配置
});
```

##### setEventHandlers(handlers)

设置事件处理器。

```typescript
geo.setEventHandlers({
  onRegionClick?: (params: any) => void,
  onRegionMouseOver?: (params: any) => void,
});
```

##### dispose()

销毁地图实例。

```typescript
geo.dispose();
```

### GeoConfig

地图配置接口。

```typescript
interface GeoConfig {
  mapName: string;
  center?: [number, number];
  zoom?: number;
  roam?: boolean;
  areaColor?: string;
  borderColor?: string;
  exceptionalBorderColor?: string;
  borderWidth?: number;
  aspectScale?: number;
  layoutCenter?: [string, string];
  layoutSize?: string;
}
```

### GeoData

地理数据接口。

```typescript
interface GeoData {
  name: string;
  value: [number, number, number?]; // [经度, 纬度, 值]
}
```

## ❓ 常见问题

### Q: 如何更新版本？

```bash
pnpm update orch-map
```

### Q: 如何指定特定版本？

在 `package.json` 中使用 master 分支或特定 tag：

```json
{
  "dependencies": {
    "orch-map": "github:SKT-Shurima/orch-map#master"
  }
}
```

### Q: 是否需要安装 echarts？

是的，`echarts` 是必需的 peer dependency：

```bash
pnpm install echarts
```

### Q: 如何自定义地图样式？

在配置中设置：

```typescript
const config: GeoConfig = {
  mapName: 'china',
  areaColor: '#ff0000',
  borderColor: '#00ff00',
  borderWidth: 2,
};
```

### Q: 如何处理地图交互？

使用事件处理器：

```typescript
geo.setEventHandlers({
  onRegionClick: (params) => {
    // 处理点击
  },
});
```

### Q: 如何添加多个数据系列？

多次调用 `addSeries`：

```typescript
geo.addSeries({ type: 'scatter', data: [...], name: '数据1' });
geo.addSeries({ type: 'effectScatter', data: [...], name: '数据2' });
```

### Q: ArcTripsLayer 找不到怎么办？

如果在构建时遇到 `export 'ArcTripsLayer' was not found in '@deck.gl/layers'` 错误，需要在项目中正确配置 patch-package：

1. 确保 `package.json` 中包含：

```json
{
  "scripts": {
    "postinstall": "patch-package"
  },
  "devDependencies": {
    "patch-package": "^8.0.0"
  }
}
```

2. 重新安装依赖：

```bash
rm -rf node_modules package-lock.json
pnpm install
```

这会自动应用对 `@deck.gl/layers` 的补丁。

## 🚨 故障排除

### ArcTripsLayer 错误

**错误信息**: `export 'ArcTripsLayer' was not found in '@deck.gl/layers'`

**原因**: 补丁没有正确应用到 `@deck.gl/layers` 包。

**解决方案**:

1. 检查 `package.json` 配置：

```json
{
  "scripts": {
    "postinstall": "patch-package"
  },
  "devDependencies": {
    "patch-package": "^8.0.0"
  }
}
```

2. 重新安装依赖：

```bash
# 清理
rm -rf node_modules package-lock.json pnpm-lock.yaml

# 重新安装
pnpm install
```

3. 手动应用补丁：

```bash
npx patch-package
```

### echarts 未定义

确保安装了 echarts：

```bash
pnpm install echarts
```

### 类型定义找不到

确保安装完整：

```bash
pnpm install orch-map echarts
```

## 📖 相关文档

- [DEVELOPMENT.md](./DEVELOPMENT.md) - 开发说明
