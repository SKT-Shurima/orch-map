/**
 * 地图渲染器统一接口 - 主入口文件
 * 提供统一的地图渲染 API，支持多种渲染引擎
 */

// 导出接口
export type { 
  IMapRenderer, 
  MapRendererConfig, 
  MapRendererEvents 
} from "./interfaces/IMapRenderer"

// 导出地图渲染器
export { default as EchartsMap } from "./echarts-geo"
export { DeckglMapAdapter } from "./adapters/DeckglMapAdapter"
export { UnifiedMapComponent, type UnifiedMapConfig } from "./adapters/UnifiedMapComponent"

// 导出旧版渲染器（向后兼容）
export { EChartsMapRenderer } from "./adapters/EChartsRenderer"
export { DeckGLMapRenderer } from "./adapters/DeckGLRenderer"

// 导出工厂类
export { MapRendererFactory, MapRendererType } from "./factory/MapRendererFactory"


// 导出便捷函数
export { 
  createMapRenderer, 
  createUnifiedMap, 
  createEchartsMap, 
  createDeckglMap 
} from "./utils/helpers"

// 导出常量
export * from "./constants"

