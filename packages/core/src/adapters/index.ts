/**
 * 地图渲染器适配器模块导出
 * 包含所有地图渲染器的适配器实现
 */

// 导出接口
export type { 
  IMapRenderer, 
  MapRendererConfig, 
  MapRendererEvents 
} from "./IMapRenderer"

// 导出适配器
export { DeckglMapAdapter } from "./DeckglMapAdapter"
export { UnifiedMapComponent, type UnifiedMapConfig } from "./UnifiedMapComponent"

// 导出旧版渲染器（向后兼容）
export { EChartsMapRenderer } from "./EChartsRenderer"
export { DeckGLMapRenderer } from "./DeckGLRenderer"

// 重新导出所有内容，保持向后兼容
export * from "../index"
