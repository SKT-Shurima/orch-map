import MapDataService from "@orch-map/mapdata";
import { MapLevel, GeoJSON } from "@orch-map/types";

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
  private static _curLevel: MapLevel = MapLevel.WORLD;
  /**
   * 当前地图所属国家
   */
  private static _country: string = "";
  /**
   * 当前地图所属地区
   */
  private static _region: string = "";
  /**
   * 当前地图所属地区代码
   */
  private static _postcode: string = "";
  /**
   * 当前地图数据
   */
  private static _geoData: GeoJSON = {} as GeoJSON;
  private static _mapVersion: "standard" | "international" = "standard";
  /** 自定义图标库 */
  private static _extraSvgIcons: Record<string, string> = {};

  // 属性监听器
  private static propertyListeners: Map<string, PropertyChangeListener[]> = new Map();

  // 私有构造函数，防止外部实例化
  private constructor() {}

  // 静态 getter/setter - curLevel
  public static get curLevel(): MapLevel {
    return MapStateManager._curLevel;
  }

  public static set curLevel(level: MapLevel) {
    const oldValue = MapStateManager._curLevel;
    MapStateManager._curLevel = level;
    MapStateManager.notifyPropertyChange("curLevel", level, oldValue);
  }

  // 静态 getter/setter - country
  public static get country(): string {
    return MapStateManager._country;
  }

  public static set country(country: string) {
    const oldValue = MapStateManager._country;
    MapStateManager._country = country;
    MapStateManager.notifyPropertyChange("country", country, oldValue);
  }

  // 静态 getter/setter - postcode
  public static get postcode(): string {
    return MapStateManager._postcode;
  }

  public static set postcode(postcode: string) {
    const oldValue = MapStateManager._postcode;
    MapStateManager._postcode = postcode;
    MapStateManager.notifyPropertyChange("postcode", postcode, oldValue);
  }

  // 静态 getter/setter - region
  public static get region(): string {
    return MapStateManager._region;
  }

  public static set region(region: string) {
    const oldValue = MapStateManager._region;
    MapStateManager._region = region;
    MapStateManager.notifyPropertyChange("region", region, oldValue);
  }

  // 静态 getter/setter - mapVersion
  public static get mapVersion(): "standard" | "international" {
    return MapStateManager._mapVersion;
  }

  public static set mapVersion(version: "standard" | "international") {
    MapStateManager._mapVersion = version;
  }

  // 静态 getter/setter - geoData
  public static get geoData(): GeoJSON {
    return MapStateManager._geoData;
  }

  public static set geoData(data: GeoJSON) {
    const oldValue = MapStateManager._geoData;
    MapStateManager._geoData = data;
    MapStateManager.notifyPropertyChange("geoData", data, oldValue);
  }


  /**
   * 设置地理数据（包括详情数据）
   */
  public static setGeoData(geoData: GeoJSON): void {
    MapStateManager.geoData = geoData;
  }

  public static async getGeoJsonData(config: {
    mapLevel: MapLevel
    country: string
    region: string
  }): Promise<GeoJSON> {
    const result = await MapDataService.getGeoJsonData(config);
    MapStateManager.setGeoData(result);
    return result;
  }

  public static get extraSvgIcons(): Record<string, string> {
    return MapStateManager._extraSvgIcons;
  }

  public static set extraSvgIcons(icons: Record<string, string>) {
    MapStateManager._extraSvgIcons = icons;
  }

  /**
   * 重置到默认状态
   */
  public static reset(): void {
    MapStateManager._curLevel = MapLevel.WORLD;
    MapStateManager._country = "100000";
    MapStateManager._postcode = "100000";
    MapStateManager._geoData = {} as GeoJSON;
  }

  /**
   * 监听特定属性变化
   */
  public static onPropertyChange<T>(
    property: string,
    listener: PropertyChangeListener<T>,
  ): () => void {
    const key = `property-${property}`;
    if (!MapStateManager.propertyListeners.has(key)) {
      MapStateManager.propertyListeners.set(key, []);
    }
    MapStateManager.propertyListeners.get(key)!.push(listener as PropertyChangeListener);

    // 返回取消监听的函数
    return () => {
      const listeners = MapStateManager.propertyListeners.get(key);
      if (listeners) {
        const index = listeners.indexOf(listener as PropertyChangeListener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
        if (listeners.length === 0) {
          MapStateManager.propertyListeners.delete(key);
        }
      }
    };
  }

  /**
   * 通知属性变化
   */
  private static notifyPropertyChange<T>(
    property: string,
    newValue: T,
    oldValue: T,
  ): void {
    const key = `property-${property}`;
    const listeners = MapStateManager.propertyListeners.get(key);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(newValue, oldValue);
        } catch (error) {
          console.error(`Error in property change listener for ${property}:`, error);
        }
      });
    }
  }

  /**
   * 销毁状态管理器
   */
  public static destroy(): void {
    MapStateManager.propertyListeners.clear();
    MapStateManager.reset();
  }
}
