import { FeatureCollection } from "geojson";
import { MapLevel } from "../interfaces";
import MapStateManager from "../MapStateManager";

// 地图数据路径枚举
enum MapDataPath {
  // 世界地图
  WORLD = "world/world-highres3.geo.json",
  WORLD_BOUNDARY = "world/world_edge.geo.json",
  WORLD_WGS84 = "world/wgs84_world.geo.json",
  WORLD_WGS84_FOR_US = "world/wgs84_world_for_US.geo.json",

  // 中国地图
  CHINA = "china/100000_full.json",
  CHINA_BOUNDARY = "china/000000_edge.json",

  // 美国地图
  US_BOUNDARY = "us/united-states.json",
}

// 地图数据获取参数
export interface GeoDataParams {
  currentLevel: MapLevel;
  region: string;
  country: string;
  mapType: "echart" | "deckgl";
}

// 地图数据缓存
interface MapDataCache {
  [key: string]: FeatureCollection;
}

/**
 * 内置地图数据服务类
 */
export class GeoDataService {
  private static cache: MapDataCache = {};
  
  // 配置 public 目录的基础路径
  private static getPublicBasePath(): string {
    // 在开发环境中，可能需要使用相对路径
    // 在生产环境中，public 目录通常作为静态资源提供
    if (typeof window !== 'undefined') {
      // 浏览器环境 - 直接访问根目录下的 public
      return '/mapData';
    } else {
      // Node.js 环境（如 SSR）- 直接访问根目录下的 public
      return '../../mapData';
    }
  }

  /**
   * 根据键值获取地图数据
   */
   private static async getMapData(path: string): Promise<FeatureCollection> {
    // 检查缓存
    if (this.cache[path]) {
      return this.cache[path];
    }
    
    let data: FeatureCollection;
    try {
      // 使用 fetch 从 public 目录获取 JSON 数据
      const basePath = this.getPublicBasePath();
      const response = await fetch(`${basePath}/${path}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      data = await response.json() as FeatureCollection;
    } catch (error) {
      console.error(`Failed to fetch map data from ${path}:`, error);
      return {
        type: "FeatureCollection",
        features: []
      };
    }
    
    this.cache[path] = data;  
    return data ? data : {
      type: "FeatureCollection",
      features: []
    };
  }
  /**
   * 获取详细地图数据路径
   */
  private static getDetailDataPath(params: GeoDataParams): string {
    const mapVersion = MapStateManager.mapVersion;
    const { currentLevel, region, country, mapType } = params;

    switch (currentLevel) {
      case MapLevel.WORLD:
        return mapVersion === 'standard' ? MapDataPath.WORLD_WGS84_FOR_US : MapDataPath.WORLD_WGS84;
      case MapLevel.COUNTRY:
        if (region === "100000") { // 中国
          // return MapDataPath.CHINA;
          return 'china/100000-2.json';
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
        if (feature.geometry && feature.geometry.type === "MultiPolygon" && feature.geometry.coordinates && Array.isArray(feature.geometry.coordinates)) {
          // 只保留第一个坐标组（海南岛），移除其他小岛
          feature.geometry.coordinates = feature.geometry.coordinates.slice(0, 1);
        }
      }

      return true;
    });

    return data;
  }

  /**
   * 获取详细地图数据
   */
   public static async fetchGeoJson(params: GeoDataParams): Promise<FeatureCollection> {
    const path = this.getDetailDataPath(params);
    if (!path) {
      throw new Error("Detail data path not found");
    }

    let data = await this.getMapData(path);

    // 对中国地图数据进行特殊处理
    if (params.currentLevel === MapLevel.COUNTRY && params.region === "100000") {
      data = this.processChinaMapData(data);
    }

    return data;
  }



  /**
   * 清除缓存
   */
   private static clearCache(): void {
    this.cache = {};
  }
}




/**
 * 获取地图数据的参数
 */
export interface GetGeoJsonParams {
  mapLevel: MapLevel;
  country: string;
  region: string;
  mapType?: "echart" | "deckgl";
}


/**
 * 获取地图 GeoJSON 数据
 * 通过统一的接口获取边界和详细地图数据
 * 
 * @param params 地图数据参数
 * @returns 包含边界和详细地图数据的对象
 */
export async function getGeoJsonData(params: GetGeoJsonParams): Promise<FeatureCollection> {
  return await GeoDataService.fetchGeoJson({
    currentLevel: params.mapLevel,
    country: params.country,
    region: params.region,
    mapType: params.mapType ?? "echart",
  });
}
