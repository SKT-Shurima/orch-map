import { GeoJSON } from "@orch-map/types";
import { MapDataService, GeoDataParams, GetGeoJsonParams } from "@orch-map/mapdata";
import MapStateManager from "../MapStateManager";

/**
 * 内置地图数据服务类
 * 现在作为 MapDataService 的包装器，保持向后兼容
 */
export class GeoDataService {
  /**
   * 获取详细地图数据
   */
  public static async fetchGeoJson(params: GeoDataParams): Promise<GeoJSON> {
    // 添加 mapVersion 参数
    const paramsWithVersion = {
      ...params,
      mapVersion: MapStateManager.mapVersion,
    };
    
    return await MapDataService.fetchGeoJson(paramsWithVersion);
  }

  /**
   * 清除缓存
   */
  public static clearCache(): void {
    MapDataService.clearCache();
  }

  /**
   * 获取缓存状态
   */
  public static getCacheStatus(): { size: number; keys: string[] } {
    return MapDataService.getCacheStatus();
  }
}


/**
 * 获取地图 GeoJSON 数据
 * 通过统一的接口获取边界和详细地图数据
 * 
 * @param params 地图数据参数
 * @returns 包含边界和详细地图数据的对象
 */
export async function getGeoJsonData(params: GetGeoJsonParams): Promise<GeoJSON> {
  // 直接使用 MapDataService 获取数据
  return await MapDataService.getGeoJsonData(params);
}
