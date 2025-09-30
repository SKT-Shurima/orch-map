import { BaseMapPoint, BaseMapLine, MapLevel } from "./interfaces"
import type { FeatureCollection } from "@orch-map/types"
import { getGeoJsonData } from "./utils/geoDataService"

/**
 * 特定属性变化监听器
 */
export type PropertyChangeListener<T = any> = (newValue: T, oldValue: T) => void

/**
 * 地图状态管理器
 * 单例模式，用于统一管理所有地图相关的状态，支持直接通过静态属性访问
 */
export default class MapStateManager {
  // 静态属性，可直接访问
  private static _curLevel: MapLevel = MapLevel.WORLD
  private static _country: string = "100000" // 默认中国
  private static _adcode: string = "100000"
  private static _geoData?: FeatureCollection
  private static _detailGeoData?: FeatureCollection

  // 属性监听器
  private static propertyListeners: Map<string, PropertyChangeListener[]> = new Map()

  // 私有构造函数，防止外部实例化
  private constructor() {}

  // 静态 getter/setter - curLevel
  public static get curLevel(): MapLevel {
    return MapStateManager._curLevel
  }

  public static set curLevel(level: MapLevel) {
    const oldValue = MapStateManager._curLevel
    MapStateManager._curLevel = level
    MapStateManager.notifyPropertyChange('curLevel', level, oldValue)
  }

  // 静态 getter/setter - country
  public static get country(): string {
    return MapStateManager._country
  }

  public static set country(country: string) {
    const oldValue = MapStateManager._country
    MapStateManager._country = country
    MapStateManager.notifyPropertyChange('country', country, oldValue)
  }

  // 静态 getter/setter - adcode
  public static get adcode(): string {
    return MapStateManager._adcode
  }

  public static set adcode(adcode: string) {
    const oldValue = MapStateManager._adcode
    MapStateManager._adcode = adcode
    MapStateManager.notifyPropertyChange('adcode', adcode, oldValue)
  }

  // 静态 getter/setter - geoData
  public static get geoData(): FeatureCollection | undefined {
    return MapStateManager._geoData
  }

  public static set geoData(data: FeatureCollection | undefined) {
    const oldValue = MapStateManager._geoData
    MapStateManager._geoData = data
    MapStateManager.notifyPropertyChange('geoData', data, oldValue)
  }


  /**
   * 设置地理数据（包括详情数据）
   */
  public static setGeoData(geoData: FeatureCollection): void {
    MapStateManager.geoData = geoData
  }

  public static async getGeoJsonData(config: {
    mapLevel: MapLevel
    country: string
    region: string
  }): Promise<FeatureCollection> {
    const result = await getGeoJsonData(config)
    MapStateManager.setGeoData(result)
    return result
  }

  /**
   * 重置到默认状态
   */
  public static reset(): void {
    MapStateManager._curLevel = MapLevel.WORLD
    MapStateManager._country = "100000"
    MapStateManager._adcode = "100000"
    MapStateManager._geoData = undefined
    MapStateManager._detailGeoData = undefined
  }

  /**
   * 监听特定属性变化
   */
  public static onPropertyChange<T>(
    property: string,
    listener: PropertyChangeListener<T>
  ): () => void {
    const key = `property-${property}`
    if (!MapStateManager.propertyListeners.has(key)) {
      MapStateManager.propertyListeners.set(key, [])
    }
    MapStateManager.propertyListeners.get(key)!.push(listener as PropertyChangeListener)

    // 返回取消监听的函数
    return () => {
      const listeners = MapStateManager.propertyListeners.get(key)
      if (listeners) {
        const index = listeners.indexOf(listener as PropertyChangeListener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
        if (listeners.length === 0) {
          MapStateManager.propertyListeners.delete(key)
        }
      }
    }
  }

  /**
   * 通知属性变化
   */
  private static notifyPropertyChange<T>(
    property: string, 
    newValue: T, 
    oldValue: T
  ): void {
    const key = `property-${property}`
    const listeners = MapStateManager.propertyListeners.get(key)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(newValue, oldValue)
        } catch (error) {
          console.error(`Error in property change listener for ${property}:`, error)
        }
      })
    }
  }

  /**
   * 销毁状态管理器
   */
  public static destroy(): void {
    MapStateManager.propertyListeners.clear()
    MapStateManager.reset()
  }
}
