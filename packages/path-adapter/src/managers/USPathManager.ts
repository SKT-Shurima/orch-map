import { MapLevel } from "@orch-map/types";
import usaStateMap from "./usaStateMap";

/**
 * 美国地图路径管理器（静态类）
 * 负责处理美国地图的特殊数据结构和路径规则
 */
export class USPathManager {
  /**z
   * 获取国家级别的地图数据路径
   *
   * @param {string} _country - 国家代码或名称（应该是 "USA" 或 "840"）
   * @returns {string} 国家地图数据相对路径
   */
  public static getCountryPath(_country: string): string {
    return "countries/us-all.geo.json";
  }

  /**
   * 获取省级地图数据路径（美国州级）
   *
   * 支持州名或州代码作为输入，自动通过 usa-state-map 映射
   * 例如："California" -> "ca" -> "usa/states/ca.json"
   *       "CA" -> "ca" -> "usa/states/ca.json"
   *
   * @param {string} region - 州名或州代码（如 "California", "CA", "New York", "NY"）
   * @returns {string} 州级地图数据相对路径
   */
  public static getProvincePath(region: string): string {
    // 尝试从映射表中获取州代码
    let stateCode = "";

    // 查找映射表中的州名或州代码
    for (const [stateName, code] of Object.entries(usaStateMap)) {
      if (stateName.toLowerCase() === region.toLowerCase()) {
        stateCode = code;
        break;
      }
      if (code.toLowerCase() === region.toLowerCase()) {
        stateCode = code;
        break;
      }
    }

    // 如果找到了对应的州代码，使用它；否则直接使用输入的 region（假设已经是小写的代码）
    stateCode = stateCode || region.toLowerCase();

    return `usa/${stateCode}.geo.json`;
  }

  /**
   * 获取城市级地图数据路径
   *
   * @param {string} region - 城市区域代码或名称
   * @returns {string} 城市级地图数据相对路径
   */
  public static getCityPath(region: string): string {
    // 将 region 前三个字母与后面分开
    const stateCode = region.slice(0, 3).split("-")[0];
    const cityName = region.slice(3);
    return `usa/${stateCode}/${cityName}.geo.json`;
  }

  /**
   * 获取县级地图数据路径
   *
   * @param {string} region - 县级区域代码或名称
   * @returns {string} 县级地图数据相对路径
   */
  public static getCountyPath(_region: string): string {
    // 美国县级数据暂时不支持，或按需扩展
    return "";
  }

  /**
   * 根据地图级别获取路径
   *
   * @param {MapLevel} level - 地图级别
   * @param {string} region - 区域代码或名称
   * @returns {string} 地图数据相对路径
   */
  public static getPathByLevel(level: MapLevel, region: string): string {
    switch (level) {
      case MapLevel.COUNTRY:
        return USPathManager.getCountryPath(region);
      case MapLevel.PROVINCE:
        return USPathManager.getProvincePath(region);
      case MapLevel.CITY:
        return USPathManager.getCityPath(region);
      case MapLevel.COUNTY:
        return USPathManager.getCountyPath(region);
      default:
        return "";
    }
  }
}

