# 地图渲染器统一接口 - 目录结构

本目录已按照统一接口设计模式重新组织，提供清晰的文件结构和模块化设计。

## 目录结构

```
src/
├── index.ts                    # 主入口文件，暴露统一API
├── interfaces/                 # 接口定义
│   └── IMapRenderer.ts        # 地图渲染器统一接口定义
├── adapters/                   # 适配器目录
│   ├── EchartsMapAdapter.ts   # ECharts 地图渲染器适配器
│   ├── DeckglMapAdapter.ts    # DeckGL 地图渲染器适配器
│   ├── UnifiedMapComponent.ts # 统一地图组件
│   ├── EChartsRenderer.ts     # ECharts 渲染器（旧版，向后兼容）
│   ├── DeckGLRenderer.ts      # DeckGL 渲染器（旧版，向后兼容）
│   └── IMapRenderer.ts        # 地图渲染器接口定义
├── factory/                    # 工厂模式目录
│   └── MapRendererFactory.ts  # 地图渲染器工厂
├── utils/                      # 工具函数
│   ├── helpers.ts             # 便捷函数
│   └── curvatureCalculator.ts # 曲率计算工具
├── constants/                  # 常量定义
│   └── index.ts               # 常量导出
├── deckgl/                     # DeckGL 相关实现
├── echarts-geo/               # ECharts 地理相关实现
├── static/                     # 静态资源
└── types/                      # 类型定义
```

## 核心模块说明

### 1. interfaces/IMapRenderer.ts

统一的地图渲染器接口，定义所有地图渲染器都必须实现的方法：

- `getType()`: 获取渲染器类型
- `setGeoData()`: 设置地理数据
- `setPoints()`: 设置点数据
- `setLines()`: 设置线数据
- `resize()`: 调整地图大小
- `destroy()`: 销毁渲染器

### 2. adapters/

包含各种地图渲染器的适配器实现：

- **EchartsMapAdapter**: 将 ECharts 地图适配为统一接口
- **DeckglMapAdapter**: 将 DeckGL 地图适配为统一接口
- **UnifiedMapComponent**: 提供统一的组件接口，支持自动切换渲染器
- **EChartsMapRenderer**: ECharts 渲染器（旧版，向后兼容）
- **DeckGLMapRenderer**: DeckGL 渲染器（旧版，向后兼容）
- **IMapRenderer**: 地图渲染器接口定义

### 3. factory/MapRendererFactory.ts

工厂类，根据配置创建对应的地图渲染器：

- `createRenderer()`: 创建指定类型的渲染器
- `getRecommendedType()`: 根据环境推荐最佳渲染器
- `isSupported()`: 检查是否支持指定渲染器类型

### 4. utils/helpers.ts

提供便捷的创建函数：

- `createMapRenderer()`: 创建地图渲染器
- `createUnifiedMap()`: 创建统一地图组件
- `createEchartsMap()`: 快速创建 ECharts 地图
- `createDeckglMap()`: 快速创建 DeckGL 地图

## 使用示例

```typescript
import {
  MapRendererFactory,
  createUnifiedMap,
  type MapRendererConfig,
} from '@orch-map/core';

// 方式1: 使用工厂创建
const renderer = MapRendererFactory.createRenderer('echarts', config);

// 方式2: 使用便捷函数
const map = createUnifiedMap({
  container: '#map-container',
  renderType: 'deckgl',
  autoFallback: true,
});

// 方式3: 直接使用适配器
import { EchartsMapAdapter } from '@orch-map/core';
const adapter = new EchartsMapAdapter(config);
```

## 优势

1. **统一接口**: 对外提供一致的API，隐藏底层实现细节
2. **可扩展性**: 容易添加新的地图渲染器支持
3. **模块化**: 清晰的目录结构，便于维护和理解
4. **向后兼容**: 保持现有API的兼容性
5. **类型安全**: 完整的TypeScript类型定义
