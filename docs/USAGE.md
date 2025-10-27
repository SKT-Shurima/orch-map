# 使用指南

本指南说明如何在自己的项目中使用 `@orch-map` 包。

## 安装

### 方式一：从 npm 安装（如果已发布）

```bash
npm install @orch-map/core @orch-map/types @orch-map/utils @orch-map/mapdata
# 或使用 pnpm
pnpm add @orch-map/core @orch-map/types @orch-map/utils @orch-map/mapdata
```

### 方式二：从 GitHub 直接引用

在你的项目 `package.json` 中添加：

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

然后安装：

```bash
npm install
# 或
pnpm install
```

### 方式三：使用 SSH URL

```json
{
  "dependencies": {
    "@orch-map/core": "git+ssh://git@github.com:SKT-Shurima/orch-map.git#packages/core"
  }
}
```

---

## 使用示例

### 基本用法

```typescript
import { Geo } from '@orch-map/core';
import type { GeoConfig } from '@orch-map/types';

// 创建地图配置
const config: GeoConfig = {
  mapName: 'china',
  center: [105, 36],
  zoom: 1.2,
  roam: true,
  areaColor: '#f0f0f0',
  borderColor: '#999',
};

// 获取地图容器
const geoContainer = document.getElementById('geo');

// 创建地图实例
const geo = new Geo(geoContainer, config);

// 添加散点数据
const data = [
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

### 使用工具函数

```typescript
import { GeoUtils } from '@orch-map/core';
import type { DataPoint } from '@orch-map/types';

const data: DataPoint[] = [
  { name: '北京', value: [116.46, 39.92, 100] },
  { name: '上海', value: [121.48, 31.22, 200] },
];

// 自动计算配置
const autoConfig = GeoUtils.autoConfigGeo(data, { width: 800, height: 600 });

// 过滤数据
const filtered = GeoUtils.filterByValue(data, 100, 300);

// 排序数据
const sorted = GeoUtils.sortByValue(data, false);
```

### 使用地图注册表

```typescript
import { MapRegistry } from '@orch-map/core';
import chinaGeoJson from '@orch-map/mapdata/data/china/100000.json';

// 注册地图
MapRegistry.registerMap('my-custom-map', chinaGeoJson);

// 使用注册的地图
const geo = new Geo(container, {
  mapName: 'my-custom-map',
  // ... other config
});
```

### 使用地图数据

```typescript
import { getChinaCities, getCityByName } from '@orch-map/mapdata';

// 获取中国所有城市
const cities = getChinaCities();

// 根据名称查找城市
const beijing = getCityByName('北京');
```

### 在 Vue 3 中使用

```vue
<template>
  <div ref="geoContainer" style="width: 100%; height: 600px;"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Geo } from '@orch-map/core';
import type { GeoConfig } from '@orch-map/types';

const geoContainer = ref<HTMLElement>();

onMounted(() => {
  const config: GeoConfig = {
    mapName: 'china',
    center: [105, 36],
    zoom: 1.2,
  };

  const geo = new Geo(geoContainer.value!, config);

  const data = [{ name: '北京', value: [116.46, 39.92, 100] }];

  geo.addSeries({
    type: 'scatter',
    data,
  });
});
</script>
```

### 在 React 中使用

```tsx
import React, { useEffect, useRef } from 'react';
import { Geo } from '@orch-map/core';
import type { GeoConfig } from '@orch-map/types';

function MapComponent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: GeoConfig = {
      mapName: 'china',
      center: [105, 36],
      zoom: 1.2,
    };

    const geo = new Geo(containerRef.current, config);

    const data = [{ name: '北京', value: [116.46, 39.92, 100] }];

    geo.addSeries({
      type: 'scatter',
      data,
    });
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '600px' }} />;
}
```

---

## 模块说明

### @orch-map/core

核心功能模块，提供地图渲染、图层管理等功能。

主要导出：

- `Geo`: 地理坐标系组件
- `MapRegistry`: 地图注册管理
- `GeoUtils`: 地图工具函数

### @orch-map/types

TypeScript 类型定义。

主要导出：

- `MapConfig`: 地图配置类型
- `DataPoint`: 数据点类型
- `GeoData`: 地理数据类型

### @orch-map/utils

工具函数模块。

主要导出：

- 颜色处理函数
- 坐标转换函数
- 动画工具函数
- 任务调度函数

### @orch-map/mapdata

地图数据模块。

主要导出：

- `getChinaCities()`: 获取中国城市列表
- `getCityByName()`: 根据名称获取城市信息

地图数据：

- `@orch-map/mapdata/data/china/*`: 中国地图数据
- `@orch-map/mapdata/data/world/*`: 世界地图数据
- `@orch-map/mapdata/data/countries/*`: 国家地图数据

---

## 开发提示

### TypeScript 支持

所有包都提供完整的 TypeScript 类型定义：

```typescript
import type { MapConfig, DataPoint } from '@orch-map/types';
import type { AnimationConfig } from '@orch-map/utils';
```

### 按需导入

推荐按需导入需要的功能：

```typescript
// 只导入需要的功能
import { Geo } from '@orch-map/core';
import { hexToRgb } from '@orch-map/utils';
```

### 地图数据

使用地图数据时，注意数据文件的路径：

```typescript
// 导入地图数据
import chinaGeoJson from '@orch-map/mapdata/data/china/100000.json';

// 使用数据
MapRegistry.registerMap('china', chinaGeoJson);
```

---

## 常见问题

### Q: 如何更新版本？

A: 如果从 GitHub 引用，可以指定分支或 tag：

```json
{
  "dependencies": {
    "@orch-map/core": "github:yourusername/orch-map#v1.0.0"
  }
}
```

### Q: 如何发布到 npm？

A: 参考 [PUBLISHING.md](./PUBLISHING.md)

### Q: 如何查看包的文档？

A: 每个包都包含 TypeScript 类型定义，可以通过 IDE 自动补全查看。

### Q: 是否需要安装 echarts？

A: `echarts` 是 peerDependency，需要在使用前单独安装：

```bash
npm install echarts
```
