import EchartsMap from "./echarts-geo"
import { MapLevel, MapRendererConfig, MapRendererType } from "./interfaces"
import DeckglMap from "./deckgl"
import { getGeoJsonData } from "./utils/geoDataService"
import MapStateManager from "./MapStateManager"
/**
 * 地图渲染器工厂
 * 负责根据配置创建对应的渲染器实例
 */
export default class OrchMap {

  private config: MapRendererConfig
  protected instance!: EchartsMap | DeckglMap

  constructor(config: MapRendererConfig) {
    this.config = config
    MapStateManager.mapVersion = this.config.mapVersion || 'standard'
    this.initMap()
  }

  async initMap() {
    const geoData = await getGeoJsonData({
      mapLevel: this.config.curLevel ?? MapLevel.WORLD,
      country: this.config.country ?? "100000",
      region: this.config.adcode ?? "100000",
    })
    MapStateManager.setGeoData(geoData)
    switch (this.config.renderType) {
      case MapRendererType.ECHARTS:
        this.instance = new EchartsMap(this.config.container, this.config)
        break
        
      case MapRendererType.DECKGL:
        this.instance = new DeckglMap(this.config.container as HTMLCanvasElement, this.config.mode || "2d", () => {
          console.log("DeckGL initialized")
        })
        break
    }
  }


  /**
   * 创建地图渲染器
   * @param type 渲染器类型
   * @param config 渲染器配置
   * @returns 地图渲染器实例
   */
  static createRenderer(type: MapRendererType, config: MapRendererConfig) {
  }

  /**
   * 检查是否支持指定的渲染器类型
   * @param type 渲染器类型
   * @returns 是否支持
   */
  static isSupported(type: string): type is MapRendererType {
    return type === MapRendererType.ECHARTS || type === MapRendererType.DECKGL
  }

  /**
   * 获取所有支持的渲染器类型
   * @returns 支持的渲染器类型列表
   */
  static getSupportedTypes(): MapRendererType[] {
    return Object.values(MapRendererType)
  }

  /**
   * 根据环境自动选择最佳渲染器
   * @param config 渲染器配置
   * @returns 推荐的渲染器类型
   */
  static getRecommendedType(config?: Partial<MapRendererConfig>): MapRendererType {
    // 如果指定了 3D 模式，推荐使用 DeckGL
    if (config?.mode === "3d") {
      return MapRendererType.DECKGL
    }

    // 检查是否支持 WebGL
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    
    if (gl) {
      // 如果支持 WebGL，默认使用 DeckGL 以获得更好的性能
      return MapRendererType.DECKGL
    }

    // 否则回退到 ECharts
    return MapRendererType.ECHARTS
  }
}

// 导出 MapRendererType 枚举
export { MapRendererType }