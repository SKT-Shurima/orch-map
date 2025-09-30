/**
 * 模块：地理图层常量
 * 说明：集中管理 Geo 图层的默认配色与默认属性，避免散落在业务中导致风格不一致。
 */
// GeoJsonLayerProps 类型定义（临时，直到从 DeckGL 库中获取）
export interface GeoJsonLayerProps {
  pickable?: boolean;
  stroked?: boolean;
  filled?: boolean;
  lineWidthScale?: number;
  lineWidthMinPixels?: number;
  wrapLongitude?: boolean;
  autoHighlight?: boolean;
  highlightColor?: [number, number, number, number];
  getLineColor?: (d: any) => [number, number, number, number];
  getLineWidth?: (d: any) => number;
  getPointRadius?: number;
  getTextSize?: number;
  getTextColor?: [number, number, number, number];
  [key: string]: any;
}

/** 默认填充色 RGBA */
export const DEFAULT_GEO_FILL_COLOR: [number, number, number, number] = [9, 71, 119, 255]
/** 默认边线色 RGBA */
export const DEFAULT_GEO_LINE_COLOR: [number, number, number, number] = [20, 128, 197, 255]
/** 默认高亮色 RGBA */
export const DEFAULT_GEO_HIGHLIGHT_COLOR: [number, number, number, number] = [48, 121, 200, 255]

/**
 * 地理图层的默认属性配置
 * @const {Object} DEFAULT_GEO_LAYER_PROPS
 */
export const DEFAULT_GEO_LAYER_PROPS: Partial<GeoJsonLayerProps> = {
  /**
   * 是否启用拾取功能，启用后可以与图层元素进行交互
   */
  pickable: true,

  /**
   * 是否绘制要素的边框线条
   */
  stroked: true,

  /**
   * 是否填充要素的内部区域
   */
  filled: true,

  /**
   * 是否将2D要素挤出为3D效果
   */
  // extruded: false, // Not part of local GeoJsonLayerProps

  /**
   * 线宽缩放比例，用于调整线条粗细
   */
  lineWidthScale: 1,

  /**
   * 线条最小宽度（像素），确保线条在任何缩放级别下的可见性
   */
  lineWidthMinPixels: 1,

  /**
   * 是否启用经度无限滚动，解决地图跨越180度经线的显示问题
   */
  wrapLongitude: true,

  /**
   * 是否自动高亮鼠标悬停的要素
   */
  autoHighlight: true,

  /**
   * 高亮状态下要素的颜色，RGBA格式 - 格式为[r, g, b, a]，取值范围0-255
   */
  highlightColor: DEFAULT_GEO_HIGHLIGHT_COLOR,

  /**
   * 要素边框的默认颜色，RGBA格式 - 格式为[r, g, b, a]，取值范围0-255
   */
  getLineColor: (_d) => DEFAULT_GEO_LINE_COLOR,

  /**
   * 要素边框的宽度，单位为像素
   */
  getLineWidth: () => 1,

  /**
   * 点要素的半径，单位为像素
   */
  getPointRadius: 100,

  /**
   * 文本标签的字体大小，单位为像素
   */
  getTextSize: 12,

  /**
   * 文本标签的颜色，RGBA格式
   */
  getTextColor: [255, 255, 255, 255],
}
