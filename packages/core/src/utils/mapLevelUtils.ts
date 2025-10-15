import { MapLevel } from "@orch-map/types";
import MapStateManager from "../MapStateManager";
import { isMunicipality } from "./mapHelper";

/**
 * @description: 地图层级工具类
 * 主要处理地图层级相关的功能
 */
export default class MapLevelUtils {
  /**
   * @description: 判断地图下钻层级
   * 根据地图下钻层级 来判断是否能继续下钻
   * @param level - 地图层级
   * @returns 层级数值 (0-4)
   */
  public static mapLevelMatrix(level: MapLevel): number {
    switch (level) {
      case MapLevel.COUNTRY:
        return 1;
      case MapLevel.PROVINCE:
        return 2;
      case MapLevel.CITY:
        return 3;
      case MapLevel.COUNTY:
        return 4;
      case MapLevel.WORLD:
      default:
        return 0;
    }
  }

  /**
   * 将层级数值转换为地图层级枚举
   * @param level - 层级数值
   * @returns 地图层级枚举
   */
  public static levelNumToLevel(level: number): MapLevel {
    switch (level) {
      case 1:
        return MapLevel.COUNTRY;
      case 2:
        return MapLevel.PROVINCE;
      case 3:
        return MapLevel.CITY;
      case 4:
        return MapLevel.COUNTY;
      default:
        return MapLevel.WORLD;
    }
  }

  /**
   * 检查地图入口资格，确定是否可以进入下一级地图
   * @returns 下一级地图层级，如果无法进入则返回 undefined
   */
  public static checkMapEntryEligibility(): MapLevel | undefined {
    switch (MapStateManager.curLevel) {
      case MapLevel.WORLD: {
        return MapLevel.COUNTRY;
      }
      case MapLevel.COUNTRY: {
        return MapLevel.PROVINCE;
      }
      case MapLevel.PROVINCE:
        return MapLevel.CITY;
      case MapLevel.CITY:
        if (!isMunicipality(MapStateManager.postcode)) {
          return MapLevel.COUNTY;
        }
        return undefined;
      case MapLevel.COUNTY:
      default:
        return undefined;
    }
  }

  /**
   * 检查是否支持下一级地图
   * @param nextLevel - 下一级地图层级
   * @returns 是否支持
   */
  public static isNextLevelSupported(nextLevel: MapLevel): boolean {
    if (MapStateManager.curLevel === MapLevel.COUNTRY && nextLevel === MapLevel.PROVINCE) {
      return MapStateManager.country === "China" || MapStateManager.country === "United States";
    }
    return true;
  }
}

