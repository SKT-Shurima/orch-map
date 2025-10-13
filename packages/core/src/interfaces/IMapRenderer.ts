import { BaseMapPoint, BaseMapLine, MapLevel, GeoJSONSourceInput, MapRendererType } from "@orch-map/types";


export interface DbClickEvent {
  level: MapLevel
  region: string
  postCode: string
  country: string
}


/**
 * 地图渲染器事件接口
 */
export interface MapRendererEvents {
  /** 点击点事件 */
  onPointClick?: (point: string ) => void
  /** 悬停点事件 */
  onPointHover?: (point: string | null) => void
  /** 悬停区域事件 */
  onAreaHover?: (region: string) => void
  /** 双击区域事件 */
  onAreaDoubleClick?: (region: string) => void
  /** 地图点击事件 */
  onMapClick?: (event: { lat: number; lng: number }) => void
  /** 地图缩放事件 */
  onZoom?: (level: number) => void
  /** 地图平移事件 */
  onPan?: (center: { lat: number; lng: number }) => void
  /** 地理数据更新事件 */
  onUpdateGeo?: (params: GeoJSONSourceInput) => void
}

/**
 * 地图渲染器配置接口
 */
export interface MapRendererConfig {
  /** 容器元素 */
  container: HTMLElement | string
  /** 地图版本，所应用的场景：标准版/国际版，不同的版本的geojson数据不同 */
  mapVersion:"standard" | "international"
  /** 渲染器类型 */
  renderType: MapRendererType
  /** 当前地图层级 */
  curLevel: MapLevel
  /** 行政区划代码 */
  postcode?: string
  /** 国家代码 */
  country?: string
  /** 中心国家 */
  centralCountry?: string
  /** 渲染模式 */
  mode?: "2d" | "3d"
  /** 事件处理器 */
  events?: MapRendererEvents
  /** 地图中心点 */
  center?: { lat: number; lng: number }
  /** 缩放级别 */
  zoom?: number
  /** 地图样式 */
  style?: string
  /** 是否显示控制面板 */
  showControls?: boolean
  /** 是否启用交互 */
  interactive?: boolean
}

/**
 * 地图渲染器统一接口
 * 所有地图渲染器都必须实现此接口
 */
export interface IMapRenderer {

  /**
   * 设置地理数据
   * @param boundary 边界数据
   * @param detail 详细数据（可选）
   */
  setGeoData(boundary: GeoJSONSourceInput): Promise<void>

  /**
   * 设置点数据
   * @param points 点数据数组
   */
  setPoints(points: BaseMapPoint[]): Promise<void> | void

  /**
   * 设置线数据
   * @param lines 线数据数组
   */
  setLines(lines: BaseMapLine[]): Promise<void> | void

  /**
   * 更新地图层级
   * @param level 新的地图层级
   */
  updateMapLevel?(level: MapLevel): void

  /**
   * 设置点样式
   * @param seriesName 系列名称
   * @param styleProcessor 样式处理函数
   */
  setPointStyle?(seriesName: string, styleProcessor: (point: BaseMapPoint) => void): void

  /**
   * 注册额外的图标（仅部分渲染器支持）
   * @param icons 图标映射
   */
  registerExtraIcons?(icons: Record<string, string>): Promise<void>

  /**
   * 调整地图大小
   */
  resize(): void

  /**
   * 销毁渲染器
   */
  destroy(): void
}
