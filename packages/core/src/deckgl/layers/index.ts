/**
 * 模块：Layers 导出
 * 说明：统一导出所有图层相关模块
 */

// 通用类型
export type { LayerUpdateCallback, LayerRemoveCallback } from "./types";

// 地理图层
export { default as GeoLayer } from "./geoLayer";

// 图标图层
export {
  IconLayer,
  type IconLayerConfig,
  type IconPoint,
} from "./iconLayer";

// 文本图层
export {
  TextLayer,
  type TextLayerConfig,
  type TextPoint,
} from "./textLayer";


export {
  Line2DManager,
  type Line2DAnimationConfig,
} from "./lineLayer";

export {
  Line3DManager,
} from "./lineLayerFor3d";
