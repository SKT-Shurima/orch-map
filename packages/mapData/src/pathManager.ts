import { MapLevel } from "@orch-map/types";

// 地图数据路径枚举
enum MapDataPath {
  WORLD_WGS84 = "world/wgs84_world.geo.json",
  WORLD_WGS84_FOR_US = "world/wgs84_world_for_US.geo.json",
}

enum MapVersion {
  STANDARD = "standard",
  INTERNATIONAL = "international",
}


/**
 * 地图数据路径管理器
 * 负责根据不同条件生成和管理地图数据的访问路径
 */
export class MapDataPathManager {
  /**
   * 获取地图数据的基础路径
   * 根据运行环境返回适当的基础路径
   *
   * @returns {string} 基础路径字符串
   */
  public static getBasePath(): string {
    if (typeof window !== "undefined") {
      // 浏览器环境 - 通过 /mapData/ 路径访问
      return "/mapData";
    } else {
      // Node.js 环境 - 使用相对路径
      return "./data";
    }
  }

  /**
   * 根据参数生成数据路径
   *
   * @param {Object} params - 路径生成参数
   * @param {MapLevel} params.currentLevel - 当前地图级别
   * @param {string} params.region - 区域代码或名称
   * @param {string} params.country - 国家代码或名称
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
        return this.getWorldMapPath(mapVersion);

      case MapLevel.COUNTRY:
        // 国家地图根据 mapVersion 和国家代码加载不同数据
        return this.getCountryMapPath(country, mapVersion);

      case MapLevel.PROVINCE:
        // 省级地图根据国家适配不同数据源
        return this.getProvinceMapPath(country, region);

      case MapLevel.CITY:
        // 城市级地图根据国家适配不同数据源
        return this.getCityMapPath(country, region);

      case MapLevel.COUNTY:
        // 县级地图根据国家适配不同数据源
        return this.getCountyMapPath(country, region);

      default:
        return "";
    }
  }

  /**
   * 获取世界地图数据路径
   *
   * @param {MapVersion} mapVersion - 地图版本
   * @returns {string} 世界地图数据相对路径
   */
  private static getWorldMapPath(mapVersion: MapVersion): string {
    switch (mapVersion) {
      case "international":
        return MapDataPath.WORLD_WGS84_FOR_US;
      case "standard":
      default:
        return MapDataPath.WORLD_WGS84;
    }
  }

  /**
   * 获取国家地图数据路径
   *
   * @param {string} country - 国家代码或名称
   * @param {MapVersion} mapVersion - 地图版本
   * @returns {string} 国家地图数据相对路径
   */
  private static getCountryMapPath(country: string, mapVersion: MapVersion): string {
    if (country === "China" || country === "100000") {
      // 中国地图特殊处理
      switch (mapVersion) {
        case MapVersion.INTERNATIONAL:
          return "world/countries/cn-all.geo.json";
        case MapVersion.STANDARD:
        default:
          return "china/100000.json";
      }
    } else {
      // 其他国家通用处理
      return `world/countries/${country}-all.geo.json`;
    }
  }

  /**
   * 获取省级地图数据路径
   *
   * @param {string} country - 国家代码或名称
   * @param {string} region - 省级区域代码或名称
   * @returns {string} 省级地图数据相对路径
   */
  private static getProvinceMapPath(country: string, region: string): string {
    if (country === "China" || country === "100000") {
      // 中国省级地图
      return `china/${region}_full.json`;
    } else if (country === "USA" || country === "840") {
      // 美国州级地图
      return `usa/states/${region}.json`;
    } else {
      // 其他国家的省级数据
      return `world/regions/${country}/${region}.json`;
    }
  }

  /**
   * 获取城市级地图数据路径
   *
   * @param {string} country - 国家代码或名称
   * @param {string} region - 城市区域代码或名称
   * @returns {string} 城市级地图数据相对路径
   */
  private static getCityMapPath(country: string, region: string): string {
    if (country === "China" || country === "100000") {
      // 中国城市地图
      return `china/${region}.json`;
    } else if (country === "USA" || country === "840") {
      // 美国城市地图
      return `usa/cities/${region}.json`;
    } else {
      // 其他国家的城市数据
      return `world/cities/${country}/${region}.json`;
    }
  }

  /**
   * 获取县级地图数据路径
   *
   * @param {string} country - 国家代码或名称
   * @param {string} region - 县级区域代码或名称
   * @returns {string} 县级地图数据相对路径
   */
  private static getCountyMapPath(country: string, region: string): string {
    if (country === "China" || country === "100000") {
      // 中国县级地图
      return `china/${region}.json`;
    } else if (country === "USA" || country === "840") {
      // 美国县级地图
      return `usa/counties/${region}.json`;
    } else {
      // 其他国家的县级数据
      return `world/counties/${country}/${region}.json`;
    }
  }

  /**
   * 获取完整的数据路径
   *
   * @param {string} relativePath - 相对路径
   * @returns {string} 完整的数据访问路径
   */
  public static getFullPath(relativePath: string): string {
    const basePath = this.getBasePath();
    return `${basePath}/${relativePath}`;
  }
}
