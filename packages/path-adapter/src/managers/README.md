# 路径管理器架构说明

## 概述

地图数据路径管理器采用策略模式设计，将不同国家/地区的地图数据路径管理逻辑分离到独立的管理器中，实现高度的解耦和可扩展性。

## 架构设计

```
MapDataPathManager (协调器)
    ├── WorldPathManager (世界地图)
    └── PathManagerFactory (工厂)
           ├── ChinaPathManager (中国)
           ├── USPathManager (美国)
           ├── CountryPathManager (通用国家)
           └── [可扩展] JapanPathManager, RussiaPathManager...
```

## 核心组件

### 1. IPathManager (接口)

定义所有路径管理器必须实现的接口：

- `getCountryPath(country: string): string` - 获取国家地图路径
- `getProvincePath(region: string): string` - 获取省级地图路径
- `getCityPath(region: string): string` - 获取城市地图路径
- `getCountyPath(region: string): string` - 获取县级地图路径
- `getPathByLevel(level: MapLevel, region: string): string` - 根据级别获取路径

### 2. WorldPathManager (世界地图管理器)

处理世界级别的 GeoJSON 数据：

- 支持标准版本和国际版本
- 处理基础路径（浏览器/Node.js 环境）
- 生成完整路径

```typescript
WorldPathManager.getWorldMapPath(MapVersion.STANDARD); // → "world/wgs84_world.geo.json"
WorldPathManager.getWorldMapPath(MapVersion.INTERNATIONAL); // → "world/wgs84_world_for_US.geo.json"
```

### 3. ChinaPathManager (中国地图管理器)

处理中国地图的特殊数据结构和路径规则：

**数据特点：**

- 使用6位数字编码（省码 + 市码）
- 国家：`100000.json`
- 省级：`{code}.json` 如 `110000.json`（北京）
- 城市/县级：`china/{provinceCode}/{cityCode}.json` 如 `china/330000/330100.json`（杭州）

**示例：**

```typescript
const manager = new ChinaPathManager();
manager.getProvincePath('330000'); // → "china/330000.json"
manager.getCityPath('330100'); // → "china/330000/330100.json"
```

### 4. USPathManager (美国地图管理器)

处理美国地图的特殊数据结构和路径规则：

**数据特点：**

- 国家级别：`united-states.json`
- 州级：`us-us-{state}.geo.json` 如 `us-us-ny-all.geo.json`（纽约州）

**示例：**

```typescript
const manager = new USPathManager();
manager.getProvincePath('NY'); // → "us/us-ny-all.geo.json"
```

### 5. CountryPathManager (通用国家管理器)

处理通用国家的标准地图数据（从 countries 目录加载）。

**数据特点：**

- 基于 `countryMapFile.ts` 映射表
- 格式：`countries/{country-code}-all.geo.json`

**示例：**

```typescript
const manager = new CountryPathManager();
manager.getCountryPath('Japan'); // → "countries/jp-all.geo.json"
manager.getCountryPath('France'); // → "countries/fr-all.geo.json"
```

### 6. PathManagerFactory (工厂类)

根据国家代码或名称返回对应的路径管理器实例。

```typescript
const manager = PathManagerFactory.getManager('China'); // → ChinaPathManager
const manager = PathManagerFactory.getManager('USA'); // → USPathManager
const manager = PathManagerFactory.getManager('Japan'); // → CountryPathManager
```

## 扩展性

### 如何添加新的国家管理器

1. **创建新的管理器类**

```typescript
// packages/path-adapter/src/managers/JapanPathManager.ts
import { IPathManager } from './IPathManager';

export class JapanPathManager implements IPathManager {
  public getCountryPath(_country: string): string {
    return 'countries/jp-all.geo.json';
  }

  public getProvincePath(region: string): string {
    // 日本省级数据路径规则
    return `japan/prefectures/${region}.json`;
  }

  // ... 实现其他方法
}
```

2. **更新工厂类**

```typescript
// packages/path-adapter/src/managers/PathManagerFactory.ts
import { JapanPathManager } from './JapanPathManager';

export class PathManagerFactory {
  public static getManager(country: string): IPathManager {
    // ... 现有逻辑

    // 添加日本特殊处理
    if (country === 'Japan' || country === '392' || country === 'JP') {
      return new JapanPathManager();
    }

    return new CountryPathManager();
  }
}
```

3. **更新枚举**

```typescript
// packages/path-adapter/src/managers/PathManagerFactory.ts
export enum CountryCode {
  // ... 现有枚举
  JAPAN = '392',
}
```

## 使用示例

### 基本用法（推荐）

```typescript
import { MapDataPathManager } from '@orch-map/path-adapter';

// 世界地图
const worldPath = MapDataPathManager.generateDataPath({
  currentLevel: MapLevel.WORLD,
  region: '',
  country: '',
  mapVersion: MapVersion.STANDARD,
});

// 中国地图
const chinaPath = MapDataPathManager.generateDataPath({
  currentLevel: MapLevel.PROVINCE,
  region: '330000', // 浙江省
  country: 'China',
});

// 美国地图
const usPath = MapDataPathManager.generateDataPath({
  currentLevel: MapLevel.PROVINCE,
  region: 'NY', // 纽约州
  country: 'USA',
});
```

### 高级用法（直接使用管理器）

```typescript
import { PathManagerFactory, MapVersion } from '@orch-map/path-adapter';

// 获取中国管理器
const chinaManager = PathManagerFactory.getManager('China');
const path = chinaManager.getCityPath('330100'); // 杭州

// 获取美国管理器
const usManager = PathManagerFactory.getManager('USA');
const statePath = usManager.getProvincePath('CA'); // 加州
```

## 数据目录结构

```
data/
├── world/                      # 世界地图
│   ├── wgs84_world.geo.json
│   └── wgs84_world_for_US.geo.json
├── countries/                  # 国家地图（标准格式）
│   ├── cn-all.geo.json
│   ├── us-all.geo.json
│   └── ...
├── china/                      # 中国地图
│   ├── 100000.json           # 国家级别
│   ├── 110000.json           # 省级
│   ├── 330000/               # 浙江省目录
│   │   ├── 330000.json
│   │   ├── 330100.json       # 杭州市
│   │   └── ...
│   └── ...
└── us/                        # 美国地图
    ├── united-states.json     # 国家级别
    ├── us-ny-all.geo.json    # 纽约州
    └── ...
```

## 优势

1. **解耦**：每个国家的路径逻辑独立，互不影响
2. **可扩展**：添加新国家只需实现新的管理器类
3. **类型安全**：TypeScript 接口确保实现一致性
4. **易于维护**：单一职责原则，每个管理器只负责一种数据格式
5. **可测试**：每个管理器可以独立测试

## 设计模式

- **策略模式**：不同的路径生成策略封装在不同管理器中
- **工厂模式**：PathManagerFactory 负责创建合适的管理器
- **接口隔离**：IPathManager 定义了清晰的契约
