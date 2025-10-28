/**
 * @fileoverview World Map Path Adapter
 *
 * 负责处理世界级别的 GeoJSON 数据路径，提供基础路径配置。
 *
 * ⚠️ 重要提示：
 * - 数据路径指向 @orch-map/geo-json 项目
 * - 浏览器环境：从 /mapData 路径获取
 * - Node.js 环境：从 ./mapData 相对路径获取
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
 * World Map Path Adapter
 *
 * 提供世界地图的路径适配功能，将数据请求转换为指向 @orch-map/geo-json 的路径。
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
      // 浏览器环境 - 通过 /mapData/ 路径访问（从项目根目录）
      return "/mapData";
    } else {
      // Node.js 环境 - 从项目根目录的 mapData 获取
      return "./mapData";
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

