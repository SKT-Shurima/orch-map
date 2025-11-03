# 使用文档

本文档面向使用 Orch Map 地图可视化库的开发者，介绍如何安装、配置和使用该库。

## 📋 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [核心概念](#核心概念)
- [API 参考](#api-参考)
- [使用示例](#使用示例)
- [框架集成](#框架集成)
- [常见问题](#常见问题)

## 📦 安装

### 环境要求

- **Node.js**: >= 18.0.0
- **pnpm/npm/yarn**: 现代包管理器
- **浏览器**: 支持 ES2018+ 的现代浏览器
- **echarts**: ^5.6.0 (必需依赖)

### NPM 安装

```bash
# 使用 pnpm（推荐）
pnpm add orch-map echarts

# 或使用 npm
npm install orch-map echarts

# 或使用 yarn
yarn add orch-map echarts
```

### GitHub 安装

在 `package.json` 中添加：

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
```

**重要**: 必须配置 `postinstall` 脚本来应用对 `@deck.gl/layers` 的补丁。

### 指定版本

```json
{
  "dependencies": {
    // 使用 master 分支
    "orch-map": "github:SKT-Shurima/orch-map#master",
    
    // 使用特定 tag（如果有）
    "orch-map": "github:SKT-Shurima/orch-map#v1.0.0"
  }
}
```

## 🚀 快速开始

### 基本示例

```typescript
import OrchMap, { MapRendererType } from 'orch-map/core';
import { MapLevel } from 'orch-map/types';

// 准备容器元素
const container = document.getElementById('map-container')!;

// 创建地图实例
const mapInstance = new OrchMap({
  renderType: MapRendererType.ECHARTS,
  mapVersion: 'standard',
  mode: '3d',
  container: container,
  curLevel: MapLevel.WORLD,
  country: '',
  postcode: '',
  events: {
    onMapClick: (event) => {
      console.log('地图点击:', event);
    },
  },
});

// 添加点位数据
mapInstance.setPoints([
  {
    id: 'beijing',
    name: '北京',
    coordinate: [116.46, 39.92],
    icon: 'star',
    size: 16,
    label: {
      show: true,
      hoverShow: false,
      formatter: () => '北京',
    },
  },
]);

// 添加线条数据
mapInstance.setLines([
  {
    id: 'line1',
    startCoordinate: [116.46, 39.92],
    endCoordinate: [121.48, 31.22],
    color: '#ff6b6b',
    width: 2,
  },
]);
```

## 📖 核心概念

### 渲染器类型

Orch Map 支持两种渲染器：

- **ECharts** (`MapRendererType.ECHARTS`): 基于 ECharts 5.6，适合传统 2D 地图可视化
- **DeckGL** (`MapRendererType.DECKGL`): 基于 Deck.gl 9.2，支持 2D/3D 模式，适合高性能渲染

### 地图层级

支持多层级地图导航：

- `MapLevel.WORLD`: 世界地图
- `MapLevel.COUNTRY`: 国家地图
- `MapLevel.PROVINCE`: 省份/州地图（如中国省份、美国各州）
- `MapLevel.CITY`: 城市地图
- `MapLevel.COUNTY`: 县级地图

### 地图版本

- `standard`: 标准版，适用于中国大陆
- `international`: 国际版，适用于国际场景

### 渲染模式

仅在 DeckGL 渲染器下支持：

- `2d`: 2D 平面模式
- `3d`: 3D 立体模式

## 📚 API 参考

### OrchMap

主地图类，提供统一的 API 接口。

#### 构造函数

```typescript
new OrchMap(
  config: MapRendererConfig,
  extraSvgIcons?: Record<string, string>
)
```

**参数**:

- `config`: 地图配置对象（见下方配置说明）
- `extraSvgIcons`: 可选的 SVG 图标映射，键为图标名称，值为 SVG 字符串

**配置对象 (MapRendererConfig)**:

```typescript
interface MapRendererConfig {
  // 必需配置
  container: HTMLElement | string;        // 容器元素或选择器
  renderType: MapRendererType;             // 渲染器类型
  curLevel: MapLevel;                      // 当前地图层级
  mapVersion: 'standard' | 'international'; // 地图版本
  
  // 可选配置
  country?: string;                        // 国家名称
  postcode?: string;                       // 邮政编码（中国地图用）
  mode?: '2d' | '3d';                      // 渲染模式（仅 DeckGL）
  center?: { lat: number; lng: number };   // 初始中心点（仅在初始化时生效）
  zoom?: number;                           // 缩放级别
  events?: MapRendererEvents;              // 事件处理器
  style?: string;                          // 地图样式
  showControls?: boolean;                  // 是否显示控制面板
  interactive?: boolean;                   // 是否启用交互
}
```

#### 方法

##### setPoints(points: BaseMapPoint[])

设置地图点位数据。

```typescript
mapInstance.setPoints([
  {
    id: 'point1',
    name: '北京',
    coordinate: [116.46, 39.92], // [经度, 纬度]
    icon: 'star',                 // 图标名称
    size: 16,                     // 图标大小
    color: '#ff6b6b',             // 图标颜色
    opacity: 1,                   // 透明度 (0-1)
    label: {
      show: true,                 // 是否显示标签
      hoverShow: false,           // 是否悬停时显示
      formatter: (params) => '北京', // 标签格式化函数
    },
    tooltip: '北京市',            // 提示信息
    siblingPointId: [],           // 关联点位 ID 数组
  },
]);
```

##### setLines(lines: BaseMapLine[])

设置地图线条数据。

```typescript
mapInstance.setLines([
  {
    id: 'line1',
    startCoordinate: [116.46, 39.92], // 起点坐标 [经度, 纬度]
    endCoordinate: [121.48, 31.22],   // 终点坐标 [经度, 纬度]
    color: '#ff6b6b',                 // 线条颜色
    width: 2,                          // 线条宽度
    style: 'solid',                   // 线条样式: 'solid' | 'dashed' | 'dotted'
  },
]);
```

##### navigateToLevel(targetLevel, country?, region?, postcode?)

导航到指定地图层级。

```typescript
// 返回世界地图
await mapInstance.navigateToLevel(MapLevel.WORLD);

// 导航到国家地图
await mapInstance.navigateToLevel(MapLevel.COUNTRY, 'China');

// 导航到省份地图（中国）
await mapInstance.navigateToLevel(
  MapLevel.PROVINCE,
  'China',
  '北京',
  '110000'
);

// 导航到美国州地图
await mapInstance.navigateToLevel(
  MapLevel.PROVINCE,
  'United States',
  'California'
);
```

##### returnToWorldMap()

快捷方法，返回到世界地图。

```typescript
await mapInstance.returnToWorldMap();
```

##### setRenderType(renderType: MapRendererType)

动态切换渲染器类型。

```typescript
// 切换到 DeckGL
await mapInstance.setRenderType(MapRendererType.DECKGL);

// 切换到 ECharts
await mapInstance.setRenderType(MapRendererType.ECHARTS);
```

##### setMode(mode: '2d' | '3d')

动态切换渲染模式（仅 DeckGL 有效）。

```typescript
// 切换到 3D 模式
await mapInstance.setMode('3d');

// 切换到 2D 模式
await mapInstance.setMode('2d');
```

##### resize()

调整地图大小（当容器尺寸变化时调用）。

```typescript
mapInstance.resize();
```

##### destroy()

销毁地图实例，释放资源。

```typescript
mapInstance.destroy();
```

##### isInitialized(): boolean

检查地图是否已初始化完成。

```typescript
if (mapInstance.isInitialized()) {
  // 地图已初始化
}
```

##### waitForInitialization(): Promise<void>

等待地图初始化完成。

```typescript
await mapInstance.waitForInitialization();
// 地图已初始化，可以安全使用
```

### 事件处理器

```typescript
interface MapRendererEvents {
  onPointClick?: (pointId: string) => void;
  onPointHover?: (pointId: string | null) => void;
  onAreaHover?: (region: string) => void;
  onAreaDoubleClick?: (region: string) => void;
  onMapClick?: (event: { lat: number; lng: number }) => void;
  onZoom?: (level: number) => void;
  onPan?: (center: { lat: number; lng: number }) => void;
  onUpdateGeo?: (params: GeoJSONSourceInput) => void;
}
```

**使用示例**:

```typescript
const mapInstance = new OrchMap({
  // ... 其他配置
  events: {
    onPointClick: (pointId) => {
      console.log('点击了点位:', pointId);
    },
    onPointHover: (pointId) => {
      console.log('悬停在点位:', pointId);
    },
    onAreaDoubleClick: async (region) => {
      // 双击区域，进入下一层级
      console.log('双击区域:', region);
    },
    onMapClick: (event) => {
      console.log('点击坐标:', event.lat, event.lng);
    },
  },
});
```

### 类型定义

#### BaseMapPoint

```typescript
interface BaseMapPoint {
  id: string;                              // 点位唯一标识
  name: string;                             // 点位名称
  coordinate: [number, number];            // 坐标 [经度, 纬度]
  icon?: string;                            // 图标名称
  color?: ColorValue;                       // 颜色值
  opacity?: number;                         // 透明度 (0-1)
  size?: number;                            // 图标大小
  label: {                                  // 标签配置
    show: boolean;
    hoverShow: boolean;
    formatter: (params: AnyObj) => string;
  };
  tooltip?: string;                         // 提示信息
  siblingPointId?: string[];                // 关联点位 ID
  [key: string]: unknown;                   // 允许扩展属性
}
```

#### BaseMapLine

```typescript
interface BaseMapLine {
  id: string;                               // 线条唯一标识
  startCoordinate: [number, number];       // 起点坐标 [经度, 纬度]
  endCoordinate: [number, number];         // 终点坐标 [经度, 纬度]
  color?: ColorValue;                       // 线条颜色
  width?: number;                           // 线条宽度
  style?: 'solid' | 'dashed' | 'dotted';   // 线条样式
  [key: string]: any;                       // 允许扩展属性
}
```

#### ColorValue

颜色值类型，支持多种格式：

```typescript
type ColorValue =
  | [number, number, number]        // RGB: [255, 0, 0]
  | [number, number, number, number] // RGBA: [255, 0, 0, 0.5]
  | string;                          // 16进制或颜色名: '#ff0000' | 'red'
```

## 💡 使用示例

### 完整示例

```typescript
import OrchMap, { MapRendererType } from 'orch-map/core';
import { MapLevel, BaseMapPoint, BaseMapLine } from 'orch-map/types';
import diamond from './assets/diamond.svg?raw';
import star from './assets/star.svg?raw';

// 准备容器
const container = document.getElementById('map')!;

// 创建地图实例
const mapInstance = new OrchMap(
  {
    renderType: MapRendererType.ECHARTS,
    mapVersion: 'standard',
    mode: '3d',
    container: container,
    curLevel: MapLevel.WORLD,
    country: '',
    postcode: '',
    center: { lat: 39.9093, lng: 116.3974 }, // 北京坐标（可选）
    events: {
      onPointClick: (pointId) => {
        console.log('点击点位:', pointId);
      },
      onAreaDoubleClick: async (region) => {
        // 双击进入下一层级
        await mapInstance.navigateToLevel(
          MapLevel.COUNTRY,
          region
        );
      },
    },
  },
  {
    // 自定义 SVG 图标
    cpe: diamond,
    star: star,
  }
);

// 等待初始化完成
await mapInstance.waitForInitialization();

// 设置点位数据
const points: BaseMapPoint[] = [
  {
    id: 'beijing',
    name: '北京',
    coordinate: [116.46, 39.92],
    icon: 'star',
    size: 16,
    label: {
      show: true,
      hoverShow: false,
      formatter: () => '北京',
    },
  },
  {
    id: 'shanghai',
    name: '上海',
    coordinate: [121.48, 31.22],
    icon: 'cpe',
    size: 14,
    label: {
      show: true,
      hoverShow: false,
      formatter: () => '上海',
    },
  },
];

mapInstance.setPoints(points);

// 设置线条数据
const lines: BaseMapLine[] = [
  {
    id: 'line-beijing-shanghai',
    startCoordinate: [116.46, 39.92],
    endCoordinate: [121.48, 31.22],
    color: '#1890ff',
    width: 2,
    style: 'solid',
  },
];

mapInstance.setLines(lines);

// 导航到中国地图
await mapInstance.navigateToLevel(MapLevel.COUNTRY, 'China');

// 导航到北京
await mapInstance.navigateToLevel(
  MapLevel.PROVINCE,
  'China',
  '北京',
  '110000'
);

// 切换渲染器
await mapInstance.setRenderType(MapRendererType.DECKGL);

// 切换模式（仅 DeckGL）
await mapInstance.setMode('3d');
```

### 动态更新数据

```typescript
// 更新点位
const newPoints: BaseMapPoint[] = [
  // ... 新的点位数据
];
mapInstance.setPoints(newPoints);

// 更新线条
const newLines: BaseMapLine[] = [
  // ... 新的线条数据
];
mapInstance.setLines(newLines);
```

### 响应容器尺寸变化

```typescript
// 使用 ResizeObserver 监听容器尺寸变化
const resizeObserver = new ResizeObserver(() => {
  mapInstance.resize();
});

resizeObserver.observe(container);
```

## 🔗 框架集成

### React

```tsx
import React, { useEffect, useRef } from 'react';
import OrchMap, { MapRendererType } from 'orch-map/core';
import { MapLevel } from 'orch-map/types';

const MapComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<OrchMap | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const mapInstance = new OrchMap({
      renderType: MapRendererType.ECHARTS,
      mapVersion: 'standard',
      container: containerRef.current,
      curLevel: MapLevel.WORLD,
      country: '',
      postcode: '',
      events: {
        onMapClick: (event) => {
          console.log('点击:', event);
        },
      },
    });

    mapInstanceRef.current = mapInstance;

    // 添加数据
    mapInstance.setPoints([...]);
    mapInstance.setLines([...]);

    return () => {
      mapInstance.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '600px' }}
    />
  );
};

export default MapComponent;
```

### Vue 3

```vue
<template>
  <div ref="containerRef" style="width: 100%; height: 600px;"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import OrchMap, { MapRendererType } from 'orch-map/core';
import { MapLevel } from 'orch-map/types';

const containerRef = ref<HTMLElement | null>(null);
let mapInstance: OrchMap | null = null;

onMounted(() => {
  if (!containerRef.value) return;

  mapInstance = new OrchMap({
    renderType: MapRendererType.ECHARTS,
    mapVersion: 'standard',
    container: containerRef.value,
    curLevel: MapLevel.WORLD,
    country: '',
    postcode: '',
  });

  mapInstance.setPoints([...]);
  mapInstance.setLines([...]);
});

onUnmounted(() => {
  mapInstance?.destroy();
});
</script>
```

## ❓ 常见问题

### Q: 如何更新版本？

```bash
pnpm update orch-map
```

### Q: 是否需要安装 echarts？

是的，`echarts` 是必需的 peer dependency，必须单独安装：

```bash
pnpm install echarts
```

### Q: 补丁没有应用怎么办？

确保 `package.json` 中有以下配置：

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

然后重新安装：

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Q: 地图不显示？

1. 确保容器有明确的宽高
2. 检查是否初始化完成：`await mapInstance.waitForInitialization()`
3. 检查控制台是否有错误信息
4. 确保地图数据路径正确（需要配合 `@orch-map/geo-json` 项目）

### Q: 如何自定义图标？

在创建地图实例时传入 `extraSvgIcons`：

```typescript
import myIcon from './my-icon.svg?raw';

const mapInstance = new OrchMap(
  { /* 配置 */ },
  {
    'my-icon': myIcon,
  }
);

// 使用自定义图标
mapInstance.setPoints([
  {
    // ...
    icon: 'my-icon',
  },
]);
```

### Q: center 配置不生效？

`center` 配置仅在初始化时生效。如果需要重新设置中心点，需要重新创建地图实例。

### Q: 如何切换渲染器？

使用 `setRenderType` 方法：

```typescript
await mapInstance.setRenderType(MapRendererType.DECKGL);
```

### Q: 如何切换 2D/3D 模式？

仅在 DeckGL 渲染器下支持：

```typescript
await mapInstance.setMode('3d');
```

### Q: 点位和线条不显示？

1. 确保地图已初始化完成
2. 检查坐标是否正确（格式：[经度, 纬度]）
3. 检查当前地图层级是否包含这些点位/线条的坐标范围
4. 使用 `navigateToLevel` 后，点位和线条会自动根据新层级过滤

### Q: 如何处理地图交互？

使用事件处理器：

```typescript
const mapInstance = new OrchMap({
  // ...
  events: {
    onPointClick: (pointId) => {
      // 处理点位点击
    },
    onAreaDoubleClick: async (region) => {
      // 处理区域双击，进入下一层级
      await mapInstance.navigateToLevel(/* ... */);
    },
  },
});
```

### Q: 地图数据从哪里来？

地图数据需要配合 `@orch-map/geo-json` 项目使用。该项目提供了 GeoJSON 格式的地图数据。

## 🔗 相关资源

- [GitHub 仓库](https://github.com/SKT-Shurima/orch-map)
- [ECharts 文档](https://echarts.apache.org/)
- [Deck.gl 文档](https://deck.gl/)

## 📖 相关文档

- [DEVELOPMENT.md](./DEVELOPMENT.md) - 开发文档（面向开发者）

