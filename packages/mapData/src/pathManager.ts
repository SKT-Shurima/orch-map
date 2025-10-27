import { MapLevel } from "@orch-map/types";
import { WorldPathManager, PathManagerFactory, MapVersion } from "./managers";

/**
 * 地图数据路径管理器（协调器）
 * 使用策略模式委托给具体的路径管理器
 *
 * 架构说明：
 * - WorldPathManager: 处理世界级别的地图路径（静态类）
 * - PathManagerFactory: 根据国家路由到对应的路径管理器（静态类）
 * - 各个国家的专用管理器（ChinaPathManager, USPathManager 等）都是静态类
 */
export class MapDataPathManager {
  /**
   * 获取地图数据的基础路径
   * 根据运行环境返回适当的基础路径
   *
   * @returns {string} 基础路径字符串
   */
  public static getBasePath(): string {
    return WorldPathManager.getBasePath();
  }

  /**
   * 根据参数生成数据路径
   *
   * @param {Object} params - 路径生成参数
   * @param {MapLevel} params.currentLevel - 当前地图级别
   * @param {string} params.region - 区域代码或名称
   * @param {string} params.country - 国家代码或名称
   * @param {MapVersion} params.mapVersion - 地图版本（仅用于世界和国家级别）
   * @returns {string} 相对路径字符串
   */
  public static generateDataPath(params: {
    currentLevel: MapLevel;
    region: string;
    country: string;
    mapVersion?: MapVersion;
  }): string {
    const { currentLevel, region, country, mapVersion = MapVersion.STANDARD } = params;

    switch (currentLevel) {
      case MapLevel.WORLD:
        // 世界地图根据 mapVersion 加载不同数据
        return WorldPathManager.getWorldMapPath(mapVersion);

      case MapLevel.COUNTRY:
        // 国家地图根据 mapVersion 和国家代码加载不同数据
        // 中国特殊处理：支持 international 版本
        if (country === "China" || country === "100000") {
          if (mapVersion === MapVersion.INTERNATIONAL) {
            return "countries/cn-all.geo.json";
          }
        }
        return PathManagerFactory.getCountryPath(country);

      case MapLevel.PROVINCE:
        // 省级地图根据国家适配不同数据源
        return PathManagerFactory.getProvincePath(country, region);

      case MapLevel.CITY:
        // 城市级地图根据国家适配不同数据源
        return PathManagerFactory.getCityPath(country, region);

      case MapLevel.COUNTY:
        // 县级地图根据国家适配不同数据源
        return PathManagerFactory.getCountyPath(country, region);

      default:
        return "";
    }
  }


  /**
   * 获取完整的数据路径
   *
   * @param {string} relativePath - 相对路径
   * @returns {string} 完整的数据访问路径
   */
  public static getFullPath(relativePath: string): string {
    return WorldPathManager.getFullPath(relativePath);
  }
}

// 导出类型和枚举供外部使用
export { MapVersion } from "./managers";
