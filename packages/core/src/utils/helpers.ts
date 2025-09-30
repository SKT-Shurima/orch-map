import type { IMapRenderer, MapRendererConfig } from "../interfaces/IMapRenderer"
import { MapRendererFactory, MapRendererType } from "../factory/MapRendererFactory"
import { UnifiedMapComponent, type UnifiedMapConfig } from "../adapters/UnifiedMapComponent"

/**
 * 创建地图渲染器的便捷函数
 * @param type 渲染器类型
 * @param config 渲染器配置
 * @returns 地图渲染器实例
 */
export function createMapRenderer(
  type: MapRendererType,
  config: MapRendererConfig
): IMapRenderer {
  return MapRendererFactory.createRenderer(type, config)
}

/**
 * 创建统一地图组件的便捷函数
 * @param config 统一地图配置
 * @returns 统一地图组件实例
 */
export function createUnifiedMap(config: UnifiedMapConfig): UnifiedMapComponent {
  return new UnifiedMapComponent(config)
}

/**
 * 快速创建 ECharts 地图
 * @param config 地图配置
 * @returns 地图渲染器实例
 */
export function createEchartsMap(config: MapRendererConfig): IMapRenderer {
  return createMapRenderer(MapRendererType.ECHARTS, config)
}

/**
 * 快速创建 DeckGL 地图
 * @param config 地图配置
 * @returns 地图渲染器实例
 */
export function createDeckglMap(config: MapRendererConfig): IMapRenderer {
  return createMapRenderer(MapRendererType.DECKGL, config)
}