import { MapLevel } from "@orch-map/types";
import { MapDataPath } from "./types";

/**
 * 地图数据路径管理器
 */
export class MapDataPathManager {
  /**
   * 获取地图数据的基础路径
   */
  static getBasePath(): string {
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
   */
  static generateDataPath(params: {
    currentLevel: MapLevel;
    region: string;
    country: string;
    mapVersion?: string;
  }): string {
    const { currentLevel, region, country, mapVersion = "default" } = params;

    switch (currentLevel) {
      case MapLevel.WORLD:
        return mapVersion === "international" ? MapDataPath.WORLD_WGS84_FOR_US : MapDataPath.WORLD_WGS84;
      
      case MapLevel.COUNTRY:
        if (region === "100000") { // 中国
          return "china/100000-2.json";
        } else {
          return `world/countries/${region}-all.geo.json`;
        }

      case MapLevel.PROVINCE:
        return country === "100000" ? `china/${region}_full.json` : "";

      case MapLevel.CITY:
        return country === "100000" ? `china/${region}.json` : "";
        
      case MapLevel.COUNTY:
        return country === "100000" ? `china/${region}.json` : "";

      default:
        return "";
    }
  }

  /**
   * 获取完整的数据路径
   */
  static getFullPath(relativePath: string): string {
    const basePath = this.getBasePath();
    return `${basePath}/${relativePath}`;
  }

  /**
   * 获取所有可用的地图数据路径
   */
  static getAllPaths(): Record<string, string> {
    return {
      // 世界地图
      world: MapDataPath.WORLD_WGS84,
      worldBoundary: MapDataPath.WORLD_BOUNDARY,
      worldWgs84: MapDataPath.WORLD_WGS84,
      worldWgs84ForUs: MapDataPath.WORLD_WGS84_FOR_US,
      
      // 中国地图
      china: MapDataPath.CHINA,
      chinaBoundary: MapDataPath.CHINA_BOUNDARY,
      
      // 美国地图
      usBoundary: MapDataPath.US_BOUNDARY,
    };
  }
}
