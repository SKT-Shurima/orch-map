import { FeatureCollection, GeoJSON } from "geojson";
import { MapDataPathManager } from "./pathManager";
import { GetGeoJsonParams } from "./types";

/**
 * 地图数据服务类
 * 负责获取和处理地图数据
 */
export default class MapDataService {
  /**
   * 检查 geo JSON 文件是否存在
   * @param path - 相对路径
   * @returns {Promise<boolean>} 文件是否存在
   */
  public static async checkGeoJsonExists(path: string): Promise<boolean> {
    if (!path) {
      return false;
    }

    try {
      // 获取完整路径
      const fullPath = MapDataPathManager.getFullPath(path);
      const response = await fetch(fullPath, { method: "HEAD" });

      return response.ok;
    } catch (error) {
      console.error(`Failed to check geo JSON file exists: ${path}:`, error);
      return false;
    }
  }

  /**
   * 根据路径获取地图数据
   */
  public static async getMapData(path: string): Promise<FeatureCollection> {


    let data: FeatureCollection;
    try {
      // 获取完整路径
      const fullPath = MapDataPathManager.getFullPath(path);
      const response = await fetch(fullPath);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      data = await response.json() as FeatureCollection;
    } catch (error) {
      console.error(`Failed to fetch map data from ${path}:`, error);
      return {
        type: "FeatureCollection",
        features: [],
      };
    }

    return data || {
      type: "FeatureCollection",
      features: [],
    };
  }


  /**
   * 检查是否可以为指定的参数获取 geo JSON 数据
   * @param params - 地图数据获取参数
   * @returns {Promise<boolean>} 数据是否存在
   */
  public static async checkGeoJsonExistsForParams(params: GetGeoJsonParams): Promise<boolean> {
    const path = MapDataPathManager.generateDataPath({
      currentLevel: params.mapLevel,
      country: params.country,
      region: params.region,
    });

    if (!path) {
      return false;
    }

    return await MapDataService.checkGeoJsonExists(path);
  }

  /**
 * 获取地图 GeoJSON 数据（对外接口，合并了 fetchGeoJson 和 getGeoJsonData）
 */
  public static async getGeoJsonData(params: GetGeoJsonParams): Promise<GeoJSON> {
  // 生成数据路径
    const path = MapDataPathManager.generateDataPath({
      currentLevel: params.mapLevel,
      country: params.country,
      region: params.region,
    });

    if (!path) {
      throw new Error("Detail data path not found");
    }

    return await MapDataService.getMapData(path);
  }
}
