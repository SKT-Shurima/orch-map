# 地图状态管理重构总结

## 重构概述

本次重构将 adapters 目录中的 `country`、`curLevel` 等属性信息提取到统一的状态管理单例中，实现了类似 Vuex 的状态管理功能，但专门为地图渲染器设计。

## 主要变更

### 1. 新增状态管理系统

#### 文件结构

```
packages/core/src/state/
├── MapStateManager.ts    # 状态管理器核心实现
├── index.ts             # 导出文件
└── README.md           # 使用文档
```

#### 核心特性

- **单例模式**: 全局唯一的状态管理器实例
- **状态同步**: 自动同步状态到所有注册的渲染器
- **事件监听**: 支持状态变化和属性变化监听
- **类型安全**: 完整的 TypeScript 类型支持
- **内存管理**: 自动清理监听器，防止内存泄漏

### 2. 状态结构定义

```typescript
interface MapState {
  curLevel: MapLevel; // 当前地图层级
  country: string; // 国家代码
  adcode: string; // 区域代码
  points: BaseMapPoint[]; // 点数据数组
  lines: BaseMapLine[]; // 线数据数组
  geoData?: GeoJsonData; // 地理边界数据
  detailGeoData?: GeoJsonData; // 详细地理数据
}
```

### 3. 适配器重构

#### EchartsMapAdapter

- 移除了本地状态管理（`points`, `lines` 等）
- 添加了状态监听器，自动响应状态变化
- 通过状态管理器统一管理数据

#### DeckglMapAdapter

- 移除了本地状态管理
- 添加了状态监听器，自动响应状态变化
- 通过状态管理器统一管理数据

#### UnifiedMapComponent

- 所有数据操作都通过状态管理器进行
- 实现了渲染器切换时的状态保持
- 简化了状态管理逻辑

### 4. 核心 API

#### 状态管理

```typescript
// 获取状态
const state = mapStateManager.getState();
const points = mapStateManager.getProperty('points');

// 更新状态
mapStateManager.setMapLevel(MapLevel.PROVINCE);
mapStateManager.setPoints(points);
mapStateManager.updateState({ curLevel, country, adcode });

// 监听变化
const unsubscribe = mapStateManager.onStateChange((newState, oldState) => {
  // 处理状态变化
});
```

#### 数据操作

```typescript
// 添加数据
mapStateManager.addPoints(newPoints);
mapStateManager.addLines(newLines);

// 移除数据
mapStateManager.removePoints(['point1']);
mapStateManager.removeLines(['line1']);

// 清空数据
mapStateManager.clearData();
mapStateManager.reset();
```

## 使用示例

### 基本使用

```typescript
import {
  mapStateManager,
  EchartsMapAdapter,
  DeckglMapAdapter,
} from '@orch-map/core';

// 创建多个渲染器
const echartsAdapter = new EchartsMapAdapter(config1);
const deckglAdapter = new DeckglMapAdapter(config2);

// 更新状态 - 两个渲染器会自动同步
mapStateManager.setPoints(points);
mapStateManager.setLines(lines);
```

### 统一地图组件

```typescript
import { UnifiedMapComponent } from '@orch-map/core';

const mapComponent = new UnifiedMapComponent(config);

// 设置数据 - 自动同步到状态管理器
mapComponent.setPoints(points);

// 切换渲染器 - 状态会自动保持
mapComponent.switchRenderer('deckgl');
```

## 优势

### 1. 状态统一管理

- 所有地图相关状态集中管理
- 避免了状态分散和同步问题
- 提供了统一的状态操作接口

### 2. 自动同步

- 状态变化自动同步到所有渲染器
- 支持多渲染器同时使用
- 简化了状态同步逻辑

### 3. 类型安全

- 完整的 TypeScript 类型支持
- 编译时类型检查
- 更好的开发体验

### 4. 内存管理

- 自动清理监听器
- 防止内存泄漏
- 更好的性能表现

### 5. 扩展性

- 易于添加新的状态属性
- 支持自定义监听器
- 便于功能扩展

## 向后兼容性

- 保持了所有现有的 API 接口
- 现有代码无需修改即可使用
- 提供了渐进式迁移方案

## 文件变更清单

### 新增文件

- `packages/core/src/state/MapStateManager.ts`
- `packages/core/src/state/index.ts`
- `packages/core/src/state/README.md`
- `packages/core/src/examples/StateManagerExample.ts`

### 修改文件

- `packages/core/src/adapters/EchartsMapAdapter.ts`
- `packages/core/src/adapters/DeckglMapAdapter.ts`
- `packages/core/src/adapters/UnifiedMapComponent.ts`
- `packages/core/src/adapters/EChartsRenderer.ts`
- `packages/core/src/echarts-geo/index.ts`
- `packages/core/src/index.ts`

## 测试建议

1. **单元测试**: 测试状态管理器的各种操作
2. **集成测试**: 测试多渲染器状态同步
3. **性能测试**: 测试大量数据时的性能表现
4. **内存测试**: 测试监听器清理和内存泄漏

## 后续优化

1. **状态持久化**: 添加状态序列化和反序列化功能
2. **状态历史**: 添加状态变更历史记录
3. **状态验证**: 添加状态数据验证机制
4. **性能优化**: 优化大量数据时的性能表现
