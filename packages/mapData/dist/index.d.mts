import { MapLevel } from '@orch-map/types';
import { FeatureCollection, GeoJSON } from 'geojson';

declare enum MapDataPath {
    WORLD = "world/world-highres3.geo.json",
    WORLD_BOUNDARY = "world/world_edge.geo.json",
    WORLD_WGS84 = "world/wgs84_world.geo.json",
    WORLD_WGS84_FOR_US = "world/wgs84_world_for_US.geo.json",
    CHINA = "china/100000_full.json",
    CHINA_BOUNDARY = "china/000000_edge.json",
    US_BOUNDARY = "us/united-states.json"
}
interface GeoDataParams {
    currentLevel: MapLevel;
    region: string;
    country: string;
    mapType: "echart" | "deckgl";
}
interface MapDataCache {
    [key: string]: any;
}
interface GetGeoJsonParams {
    mapLevel: MapLevel;
    country: string;
    region: string;
    mapType?: "echart" | "deckgl";
}

/**
 * 地图数据路径管理器
 */
declare class MapDataPathManager {
    /**
     * 获取地图数据的基础路径
     */
    static getBasePath(): string;
    /**
     * 根据参数生成数据路径
     */
    static generateDataPath(params: {
        currentLevel: MapLevel;
        region: string;
        country: string;
        mapVersion?: string;
    }): string;
    /**
     * 获取完整的数据路径
     */
    static getFullPath(relativePath: string): string;
    /**
     * 获取所有可用的地图数据路径
     */
    static getAllPaths(): Record<string, string>;
}

/**
 * 地图数据服务类
 * 负责获取和处理地图数据
 */
declare class MapDataService {
    private static cache;
    /**
     * 根据路径获取地图数据
     */
    static getMapData(path: string): Promise<FeatureCollection>;
    /**
     * 处理中国地图特殊数据（移除9段线等）
     */
    private static processChinaMapData;
    /**
     * 根据参数获取地图数据
     */
    static fetchGeoJson(params: GeoDataParams): Promise<GeoJSON>;
    /**
     * 获取地图 GeoJSON 数据（对外接口）
     */
    static getGeoJsonData(params: GetGeoJsonParams): Promise<GeoJSON>;
    /**
     * 清除缓存
     */
    static clearCache(): void;
    /**
     * 获取缓存状态
     */
    static getCacheStatus(): {
        size: number;
        keys: string[];
    };
}

export { type GeoDataParams, type GetGeoJsonParams, type MapDataCache, MapDataPath, MapDataPathManager, MapDataService, MapDataService as getGeoJsonData };
