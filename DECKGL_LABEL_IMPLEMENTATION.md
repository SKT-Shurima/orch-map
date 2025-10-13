# DeckGL 点位标签功能实现说明

## 需求背景

参考 echarts-geo 中关于点位 label 的实现方式，为 deckgl 增加点位的 label 显示功能。

## 实现概述

通过引入 deck.gl 的 `TextLayer` 来实现点位标签显示，支持与 echarts-geo 一致的配置方式和显示逻辑。

## 主要修改

### 1. 核心文件修改：`packages/core/src/deckgl/core/index.ts`

#### 新增类型定义

```typescript
export type TextPoint = BaseMapPoint & {
  position: [number, number, number?];
  text: string;
  size: number;
  color: [number, number, number, number];
  anchorY: 'top' | 'middle' | 'bottom';
};
```

#### 新增状态管理

- `hoveredPointId`: 跟踪当前悬停的点位 ID，用于控制 hover 标签显示

#### 新增核心方法

1. **`generateTextLayerData(points: BaseMapPoint[]): TextPoint[]`**
   - 将点位数据转换为文本图层数据
   - 根据 `label.show` 和 `label.hoverShow` 过滤需要显示的标签
   - 使用 `label.formatter` 格式化文本内容

2. **`generateTextLayer(textLayerData: TextPoint[])`**
   - 创建 TextLayer 实例
   - 配置文本样式（字体、描边、位置等）

3. **`updateLabelLayer()`**
   - 更新标签图层
   - 响应数据和状态变化

4. **`handleHoverPoint(info: unknown)`**
   - 处理点位悬停事件
   - 更新悬停状态并触发标签更新

#### 修改现有方法

- **`generateIconLayer`**: 添加 `onHover` 事件处理
- **`updateSelectionOverlay`**: 在更新点位图层时同时更新标签图层

### 2. 导出类型更新：`packages/core/src/deckgl/index.ts`

导出新增的 `TextPoint` 类型供外部使用。

### 3. 示例更新：`examples/src/App.tsx`

添加 `label.formatter` 函数配置，完善点位标签配置示例。

## 功能特性

### 1. 标签显示控制

- **`label.show`**: 控制标签是否始终显示
  - `true`: 标签始终可见
  - `false`: 标签默认隐藏

- **`label.hoverShow`**: 控制悬停时是否显示标签
  - `true`: 悬停或选中时显示标签
  - `false`: 悬停时不显示标签

### 2. 文本格式化

通过 `label.formatter` 函数自定义标签文本：

```typescript
formatter: (params) => {
  return params.data.name;
};
```

### 3. 视觉效果

- 白色文本，黑色描边（提高可读性）
- 标签位于点位下方（避免遮挡图标）
- Billboard 模式（文本始终朝向用户）
- Z 轴高度提升（避免被地图遮挡）

## 使用示例

```typescript
const points: BaseMapPoint[] = [
  {
    id: '1',
    name: '北京',
    coordinate: [116.4074, 39.9042],
    icon: 'star',
    size: 16,
    label: {
      show: true, // 始终显示
      hoverShow: false,
      formatter: (params) => params.data.name,
    },
  },
  {
    id: '2',
    name: '上海',
    coordinate: [121.4737, 31.2304],
    icon: 'cpe',
    size: 16,
    label: {
      show: false, // 默认隐藏
      hoverShow: true, // 悬停时显示
      formatter: (params) => `城市: ${params.data.name}`,
    },
  },
];

mapInstance.setPoints(points);
```

## 与 ECharts-Geo 的一致性

### 配置接口一致

两者都使用相同的 `BaseMapPoint` 接口和 label 配置结构：

```typescript
interface BaseMapPoint {
  // ... 其他属性
  label: {
    show: boolean;
    hoverShow: boolean;
    formatter: (params: AnyObj) => string;
  };
}
```

### 显示逻辑一致

1. `label.show === true`: 标签始终显示
2. `label.hoverShow === true`: 悬停/选中时显示标签
3. 两个条件可以组合使用

### 文本格式化一致

都支持通过 `formatter` 函数自定义标签文本内容。

## 性能考虑

1. **按需更新**: 只在悬停状态变化时更新标签图层
2. **数据过滤**: 在数据生成阶段就过滤不需要显示的标签
3. **WebGL 渲染**: 使用 GPU 加速，适合大规模数据

## 技术栈

- **deck.gl**: v9.x
- **TextLayer**: deck.gl 的文本渲染图层
- **TypeScript**: 类型安全

## 相关文件

- `packages/core/src/deckgl/core/index.ts` - 核心实现
- `packages/core/src/deckgl/index.ts` - 类型导出
- `packages/core/src/deckgl/LABEL_FEATURE.md` - 详细功能文档
- `examples/src/App.tsx` - 使用示例

## 测试建议

1. 测试 `label.show = true` 的标签始终显示
2. 测试 `label.hoverShow = true` 的悬停显示
3. 测试 `formatter` 函数的文本格式化
4. 测试大量点位时的性能表现
5. 测试标签在不同缩放级别下的显示效果

## 已知限制

1. 暂不支持标签碰撞检测（可能会重叠）
2. 文本样式配置有限（固定字体大小和颜色）
3. 暂无标签显示/隐藏的过渡动画

## 未来改进方向

1. 添加标签碰撞检测和自动避让
2. 支持更丰富的文本样式配置
3. 添加标签显示/隐藏的动画效果
4. 支持多行文本和更复杂的布局
5. 添加 LOD（Level of Detail）策略优化大数据场景
