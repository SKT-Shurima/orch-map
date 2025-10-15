# GeoJSON 区域点位过滤功能

## 功能概述

该功能实现了在双击进入某个地图层级时，自动隐藏不在该 GeoJSON 区域范围内的点位和线条。

## 实现原理

### 1. 数据存储

在 `MapStateManager` 中新增了两个静态属性来存储所有原始数据：

```typescript
// 所有原始点位数据（用于层级切换时过滤）
private static _allPoints: BaseMapPoint[] = [];

// 所有原始线条数据（用于层级切换时过滤）
private static _allLines: BaseMapLine[] = [];
```

### 2. 地理判断算法

在 `GeoUtils` 中新增了多个方法：

#### `isPointInGeoJSON(lng: number, lat: number, geoData: GeoJSON): boolean`

判断某个点（经纬度）是否在 GeoJSON 区域内。使用两步判断：

1. **边界框快速判断**：首先检查点是否在 GeoJSON 的边界框内
2. **精确多边形判断**：使用射线法（Ray Casting Algorithm）判断点是否在多边形内

#### `filterPointsInGeoJSON<T extends { coordinate: [number, number] }>(points: T[], geoData: GeoJSON): T[]`

过滤点位数组，只保留在 GeoJSON 区域内的点位。

### 3. 自动过滤机制

#### 设置点位时自动过滤

当调用 `orchMap.setPoints(points)` 时：

1. 原始点位数据存储到 `MapStateManager.allPoints`
2. 根据当前地图层级自动过滤点位
3. 只渲染过滤后的点位

```typescript
public setPoints(points: BaseMapPoint[]) {
  // 存储所有原始点位数据
  MapStateManager.allPoints = points;

  this._executeWhenReady(() => {
    // 根据当前地图层级过滤点位
    const filteredPoints = this.filterPointsByCurrentLevel(points);
    void this.instance.setPoints(filteredPoints);
  });
}
```

#### 层级切换时自动更新

当双击进入下一级地图时：

1. 加载新的 GeoJSON 数据
2. 更新地图显示
3. 自动重新过滤并更新点位和线条

```typescript
private async entryNextLevel(region: string) {
  // ... 层级切换逻辑 ...

  // 进入新层级后，重新过滤并更新点位和线条
  this.updatePointsAndLinesForCurrentLevel();
}
```

### 4. 线条过滤策略

线条的过滤策略可以根据需求调整：

```typescript
// 策略1：两端都在区域内（默认）
return fromInRegion && toInRegion;

// 策略2：至少一端在区域内
return fromInRegion || toInRegion;
```

当前实现使用**策略1**，即只显示起点和终点都在当前区域内的线条。

## 使用示例

```typescript
import OrchMap from '@orch-map/core';
import { MapRendererType } from '@orch-map/types';

// 创建地图实例
const orchMap = new OrchMap({
  container: document.getElementById('map'),
  renderType: MapRendererType.DECKGL,
  curLevel: 'world',
  mode: '2d',
});

// 设置点位数据（会自动根据当前层级过滤）
orchMap.setPoints([
  {
    id: 'point1',
    name: 'Beijing',
    coordinate: [116.4074, 39.9042],
    label: {
      show: true,
      hoverShow: false,
      formatter: (params) => params.name,
    },
  },
  {
    id: 'point2',
    name: 'Shanghai',
    coordinate: [121.4737, 31.2304],
    label: {
      show: true,
      hoverShow: false,
      formatter: (params) => params.name,
    },
  },
  // ... 更多点位
]);

// 设置线条数据（会自动根据当前层级过滤）
orchMap.setLines([
  {
    id: 'line1',
    startCoordinate: [116.4074, 39.9042],
    endCoordinate: [121.4737, 31.2304],
  },
  // ... 更多线条
]);

// 双击某个区域（如中国）后，会自动：
// 1. 进入中国地图
// 2. 只显示在中国境内的点位
// 3. 只显示起点和终点都在中国境内的线条
```

## 性能优化

### 边界框快速过滤

在进行精确的多边形判断之前，先进行边界框判断，大幅提高性能：

```typescript
// 快速边界框检测
if (
  lng < bounds.minLng ||
  lng > bounds.maxLng ||
  lat < bounds.minLat ||
  lat > bounds.maxLat
) {
  return false;
}
```

### 支持复杂几何类型

支持以下 GeoJSON 几何类型：

- `Polygon`：单个多边形
- `MultiPolygon`：多个多边形（如有飞地的国家）

## 特殊说明

### 世界地图层级

当地图层级为 `world` 时，不进行过滤，显示所有点位和线条：

```typescript
if (MapStateManager.curLevel === 'world') {
  return points; // 返回所有点位
}
```

### 数据持久化

所有原始数据都存储在 `MapStateManager` 中，确保在层级切换时不会丢失数据。

### 线条过滤策略

如果需要修改线条的过滤策略（例如改为"至少一端在区域内"），可以在 `main.ts` 的 `filterLinesByCurrentLevel` 方法中修改：

```typescript
// 修改第 232 行
return fromInRegion || toInRegion; // 至少一端在区域内
```

## API 文档

### MapStateManager

#### 新增属性

- `allPoints: BaseMapPoint[]` - 存储所有原始点位数据
- `allLines: BaseMapLine[]` - 存储所有原始线条数据

### GeoUtils

#### 新增方法

##### `isPointInGeoJSON(lng: number, lat: number, geoData: GeoJSON): boolean`

判断点是否在 GeoJSON 区域内。

**参数：**

- `lng: number` - 经度
- `lat: number` - 纬度
- `geoData: GeoJSON` - GeoJSON 数据

**返回值：**

- `boolean` - 是否在区域内

##### `filterPointsInGeoJSON<T>(points: T[], geoData: GeoJSON): T[]`

过滤点位数组，只保留在 GeoJSON 区域内的点位。

**泛型约束：**

- `T extends { coordinate: [number, number] }`

**参数：**

- `points: T[]` - 点位数组
- `geoData: GeoJSON` - GeoJSON 数据

**返回值：**

- `T[]` - 过滤后的点位数组

## 测试建议

1. **基础测试**：在世界地图上设置点位，双击进入某个国家，验证只显示该国家的点位
2. **边界测试**：测试位于边界附近的点位是否正确过滤
3. **性能测试**：使用大量点位（1000+）测试过滤性能
4. **多层级测试**：测试从世界 → 国家 → 省份的多级切换
5. **线条测试**：测试跨区域线条的过滤效果

## 已知限制

1. 仅支持 `Polygon` 和 `MultiPolygon` 几何类型
2. 不支持 `LineString`、`Point` 等其他几何类型的 GeoJSON
3. 线条过滤默认要求两端都在区域内（可配置）
