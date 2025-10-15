/**
 * 模块：Geo 基础图层
 * 说明：提供一个空数据的 GeoJsonLayer 构造器，便于初始化占位，避免空图层导致的渲染空指针问题。
 */

import { GeoJsonLayer } from "@deck.gl/layers";

/**
 * GeoJSON 图层属性配置接口
 * 定义 GeoJsonLayer 支持的配置选项
 */
export interface GeoJsonLayerProps {
  /** 是否启用拾取功能，启用后可以与图层元素进行交互 */
  pickable?: boolean;
  /** 是否绘制要素的边框线条 */
  stroked?: boolean;
  /** 是否填充要素的内部区域 */
  filled?: boolean;
  /** 线宽缩放比例，用于调整线条粗细 */
  lineWidthScale?: number;
  /** 线条最小宽度（像素），确保线条在任何缩放级别下的可见性 */
  lineWidthMinPixels?: number;
  /** 是否启用经度无限滚动，解决地图跨越180度经线的显示问题 */
  wrapLongitude?: boolean;
  /** 是否自动高亮鼠标悬停的要素 */
  autoHighlight?: boolean;
  /** 高亮状态下要素的颜色，RGBA格式 [r, g, b, a]，取值范围 0-255 */
  highlightColor?: [number, number, number, number];
  /**
   * 要素边框的颜色获取函数
   * @param d - GeoJSON 要素数据
   * @returns RGBA 颜色数组 [r, g, b, a]
   */
  getLineColor?: (d: unknown) => [number, number, number, number];
  /**
   * 要素边框的宽度获取函数
   * @param d - GeoJSON 要素数据
   * @returns 线条宽度（像素）
   */
  getLineWidth?: (d: unknown) => number;
  /** 其他扩展属性 */
  [key: string]: unknown;
}

/** 默认填充色 RGBA */
export const DEFAULT_GEO_FILL_COLOR: [number, number, number, number] = [9, 71, 119, 255];
/** 默认边线色 RGBA */
export const DEFAULT_GEO_LINE_COLOR: [number, number, number, number] = [20, 128, 197, 255];
/** 默认高亮色 RGBA */
export const DEFAULT_GEO_HIGHLIGHT_COLOR: [number, number, number, number] = [48, 121, 200, 255];

/**
 * 地理图层的默认属性配置
 */
export const DEFAULT_GEO_LAYER_PROPS: Partial<GeoJsonLayerProps> = {
  /** 是否启用拾取功能，启用后可以与图层元素进行交互 */
  pickable: true,

  /** 是否绘制要素的边框线条 */
  stroked: true,

  /** 是否填充要素的内部区域 */
  filled: true,

  /** 线宽缩放比例，用于调整线条粗细 */
  lineWidthScale: 1,

  /** 线条最小宽度（像素），确保线条在任何缩放级别下的可见性 */
  lineWidthMinPixels: 1,

  /** 是否启用经度无限滚动，解决地图跨越180度经线的显示问题 */
  wrapLongitude: true,

  /** 是否自动高亮鼠标悬停的要素 */
  autoHighlight: true,

  /** 高亮状态下要素的颜色，RGBA 格式 [r, g, b, a]，取值范围 0-255 */
  highlightColor: DEFAULT_GEO_HIGHLIGHT_COLOR,

  /** 要素边框的默认颜色，返回 RGBA 数组 */
  getLineColor: (_d) => DEFAULT_GEO_LINE_COLOR,

  /** 要素边框的宽度，单位为像素 */
  getLineWidth: () => 1,
};

export default class GeoLayer {
  /**
   * 创建一个空数据的 GeoJsonLayer
   */
  public static create() {
    return new GeoJsonLayer({
      ...DEFAULT_GEO_LAYER_PROPS,
      id: "geojson-layer",
      data: [],
    });
  }
}

