/**
 * 模块：图层通用类型定义
 * 说明：定义所有图层相关的通用类型，避免重复定义
 */

/**
 * 图层 ID 枚举类型
 * 说明：包含所有图层的唯一标识符，用于统一管理和引用
 */
export enum LayerId {
  /** GeoJSON 地理图层 ID */
  GEOJSON_LAYER = "geojson-layer",
  /** 点图标图层 ID */
  POINT_LAYER = "point-layer",
  /** 文本标签图层 ID */
  LABEL_LAYER = "label-layer",
  /** 2D 线图层 ID */
  LINE_LAYER = "line-layer",
  /** 2D 线尾迹图层 ID */
  LINE_TRAIL_LAYER = "line-trail-layer",
  /** 3D 弧线基础图层 ID */
  ARC_BASE_LAYER = "arc-base-layer",
  /** 3D 弧线尾迹图层 ID */
  ARC_TRAIL_LAYER = "arc-trail-layer",
}

/**
 * 图层更新回调函数类型
 */
export type LayerUpdateCallback = (layerId: string, layer: unknown) => void;

/**
 * 图层移除回调函数类型
 */
export type LayerRemoveCallback = (layerId: string) => void;
