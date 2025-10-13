import { FeatureCollection, GeoJSON } from "geojson";
import { MapDataPathManager } from "./pathManager";
import { GetGeoJsonParams } from "./types";

/**
 * 地图数据服务类
 * 负责获取和处理地图数据
 */
export default class MapDataService {
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
   * 处理中国地图特殊数据（移除9段线等）
   */
  private static processChinaMapData(data: FeatureCollection): FeatureCollection {
    // 移除空名称的特征和处理海南省数据
    data.features = data.features.filter(feature => {
      if (!feature.properties?.name) {
        return false;
      }

      // 处理海南省，只保留海南岛
      if (feature.properties.name === "海南省") {
        if (feature.geometry &&
            feature.geometry.type === "MultiPolygon" &&
            feature.geometry.coordinates &&
            Array.isArray(feature.geometry.coordinates)) {
          // 只保留第一个坐标组（海南岛），移除其他小岛
          feature.geometry.coordinates = feature.geometry.coordinates.slice(0, 1);
        }
      }

      return true;
    });

    return data;
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
