import { MapLevel } from '@orch-map/types';
import { FeatureCollection, GeoJSON } from 'geojson';

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

declare enum MapVersion {
    STANDARD = "standard",
    INTERNATIONAL = "international"
}
/**
 * 地图数据路径管理器
 * 负责根据不同条件生成和管理地图数据的访问路径
 */
declare class MapDataPathManager {
    /**
     * 获取地图数据的基础路径
     * 根据运行环境返回适当的基础路径
     *
     * @returns {string} 基础路径字符串
     */
    static getBasePath(): string;
    /**
     * 根据参数生成数据路径
     *
     * @param {Object} params - 路径生成参数
     * @param {MapLevel} params.currentLevel - 当前地图级别
     * @param {string} params.region - 区域代码或名称
     * @param {string} params.country - 国家代码或名称
     * @returns {string} 相对路径字符串
     */
    static generateDataPath(params: {
        currentLevel: MapLevel;
        region: string;
        country: string;
        mapVersion?: MapVersion;
    }): string;
    /**
     * 获取世界地图数据路径
     *
     * @param {MapVersion} mapVersion - 地图版本
     * @returns {string} 世界地图数据相对路径
     */
    private static getWorldMapPath;
    /**
     * 获取国家地图数据路径
     *
     * @param {string} country - 国家代码或名称
     * @param {MapVersion} mapVersion - 地图版本
     * @returns {string} 国家地图数据相对路径
     */
    private static getCountryMapPath;
    /**
     * 获取省级地图数据路径
     *
     * @param {string} country - 国家代码或名称
     * @param {string} region - 省级区域代码或名称
     * @returns {string} 省级地图数据相对路径
     */
    private static getProvinceMapPath;
    /**
     * 获取城市级地图数据路径
     *
     * @param {string} country - 国家代码或名称
     * @param {string} region - 城市区域代码或名称
     * @returns {string} 城市级地图数据相对路径
     */
    private static getCityMapPath;
    /**
     * 获取县级地图数据路径
     *
     * @param {string} country - 国家代码或名称
     * @param {string} region - 县级区域代码或名称
     * @returns {string} 县级地图数据相对路径
     */
    private static getCountyMapPath;
    /**
     * 获取完整的数据路径
     *
     * @param {string} relativePath - 相对路径
     * @returns {string} 完整的数据访问路径
     */
    static getFullPath(relativePath: string): string;
}

/**
 * 地图数据服务类
 * 负责获取和处理地图数据
 */
declare class MapDataService {
    /**
     * 根据路径获取地图数据
     */
    static getMapData(path: string): Promise<FeatureCollection>;
    /**
     * 处理中国地图特殊数据（移除9段线等）
     */
    private static processChinaMapData;
    /**
   * 获取地图 GeoJSON 数据（对外接口，合并了 fetchGeoJson 和 getGeoJsonData）
   */
    static getGeoJsonData(params: GetGeoJsonParams): Promise<GeoJSON>;
}

export { type GeoDataParams, type GetGeoJsonParams, type MapDataCache, MapDataPathManager, MapDataService as default };
