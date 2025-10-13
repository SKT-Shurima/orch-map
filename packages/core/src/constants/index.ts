/**
 * 地图渲染器常量定义
 */

/**
 * 地图渲染器类型
 */
export const MAP_RENDERER_TYPES = {
  ECHARTS: "echarts",
  DECKGL: "deckgl",
} as const;

/**
 * 渲染模式
 */
export const RENDER_MODES = {
  MODE_2D: "2d",
  MODE_3D: "3d",
} as const;

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  ZOOM: 10,
  CENTER: { lat: 39.9, lng: 116.3 },
  MODE: RENDER_MODES.MODE_2D,
  INTERACTIVE: true,
  SHOW_CONTROLS: false,
} as const;

/**
 * 事件类型
 */
export const EVENT_TYPES = {
  POINT_CLICK: "pointClick",
  POINT_HOVER: "pointHover",
  LINE_CLICK: "lineClick",
  LINE_HOVER: "lineHover",
  MAP_CLICK: "mapClick",
  ZOOM: "zoom",
  PAN: "pan",
} as const;


/**
 * 中国行政区划代码
 */
export const CHINA_AD_CODE_JUST_FOR_FE = "100000";

/**
 * 美国行政区划代码
 */
export const US_AD_CODE_JUST_FOR_FE = "us";

/**
 * 直辖市代码集合（北京、天津、上海、重庆）
 */
export const MUNICIPALITY_CODES = new Set(["110000", "120000", "310000", "500000"]);

/**
 * 支持下一级地图的国家代码列表
 */
export const JUST_SUPPORTED_NEXT_LEVEL_COUNTRIES_AD_CODE = [CHINA_AD_CODE_JUST_FOR_FE, US_AD_CODE_JUST_FOR_FE];


/**
 * 国家名称常量
 */
export const G2 = { CHINA: "中国", USA: "美国" } as const;
