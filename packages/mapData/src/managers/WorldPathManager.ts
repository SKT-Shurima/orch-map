/**
 * 世界地图路径管理器
 * 负责处理世界级别的 GeoJSON 数据路径
 */

// 地图版本枚举
export enum MapVersion {
  STANDARD = "standard",
  INTERNATIONAL = "international",
}

// 世界地图数据路径
enum MapDataPath {
  WORLD_WGS84 = "world/wgs84_world.geo.json",
  WORLD_WGS84_FOR_US = "world/wgs84_world_for_US.geo.json",
}

/**
 * 世界地图路径管理器
 */
export class WorldPathManager {
  /**
   * 获取世界地图数据路径
   *
   * @param {MapVersion} mapVersion - 地图版本
   * @returns {string} 世界地图数据相对路径
   */
  public static getWorldMapPath(mapVersion: MapVersion = MapVersion.STANDARD): string {
    switch (mapVersion) {
      case MapVersion.INTERNATIONAL:
        return MapDataPath.WORLD_WGS84_FOR_US;
      case MapVersion.STANDARD:
      default:
        return MapDataPath.WORLD_WGS84;
    }
  }

  /**
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

