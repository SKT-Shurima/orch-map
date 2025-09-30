/**
 * 地图渲染器常量定义
 */

/**
 * 地图渲染器类型
 */
export const MAP_RENDERER_TYPES = {
  ECHARTS: 'echarts',
  DECKGL: 'deckgl'
} as const

/**
 * 渲染模式
 */
export const RENDER_MODES = {
  MODE_2D: '2d',
  MODE_3D: '3d'
} as const

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  ZOOM: 10,
  CENTER: { lat: 39.9, lng: 116.3 },
  MODE: RENDER_MODES.MODE_2D,
  INTERACTIVE: true,
  SHOW_CONTROLS: false
} as const

/**
 * 事件类型
 */
export const EVENT_TYPES = {
  POINT_CLICK: 'pointClick',
  POINT_HOVER: 'pointHover',
  LINE_CLICK: 'lineClick',
  LINE_HOVER: 'lineHover',
  MAP_CLICK: 'mapClick',
  ZOOM: 'zoom',
  PAN: 'pan'
} as const
