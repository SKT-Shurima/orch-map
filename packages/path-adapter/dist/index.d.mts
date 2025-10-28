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

/**
 * 世界地图路径管理器
 * 负责处理世界级别的 GeoJSON 数据路径
 */
declare enum MapVersion {
    STANDARD = "standard",
    INTERNATIONAL = "international"
}
/**
 * 世界地图路径管理器
 */
declare class WorldPathManager {
    /**
     * 获取世界地图数据路径
     *
     * @param {MapVersion} mapVersion - 地图版本
     * @returns {string} 世界地图数据相对路径
     */
    static getWorldMapPath(mapVersion?: MapVersion): string;
    /**
     * 根据运行环境返回适当的基础路径
     *
     * @returns {string} 基础路径字符串
     */
    static getBasePath(): string;
    /**
     * 获取完整的数据路径
     *
     * @param {string} relativePath - 相对路径
     * @returns {string} 完整的数据访问路径
     */
    static getFullPath(relativePath: string): string;
}

/**
 * 中国地图路径管理器（静态类）
 * 负责处理中国地图的特殊数据结构和路径规则
 */
declare class ChinaPathManager {
    /**
     * 获取国家级别的地图数据路径
     *
     * @param {string} _country - 国家代码或名称（应该是 "China" 或 "100000"）
     * @returns {string} 国家地图数据相对路径
     */
    static getCountryPath(_country: string): string;
    /**
     * 获取省级地图数据路径
     *
     * 中国省份使用6位数字编码（前两位表示省）
     * 直辖市（11-北京, 12-天津, 31-上海, 50-重庆, 81-香港, 82-澳门）文件在 china/ 目录下
     * 其他省份文件在 china/xxxxx/xxxxxx.json 目录下
     *
     * @param {string} region - 省级区域代码（如 "110000"）
     * @returns {string} 省级地图数据相对路径
     */
    static getProvincePath(region: string): string;
    /**
     * 获取城市级地图数据路径
     *
     * 中国城市使用6位数字编码（前四位表示省+市）
     * 例如：110100 - 北京市（北京直辖市的区县）
     *       330100 - 杭州市
     *
     * @param {string} region - 城市区域代码（如 "110100"）
     * @returns {string} 城市级地图数据相对路径
     */
    static getCityPath(region: string): string;
    /**
     * 获取县级地图数据路径
     *
     * 中国县级使用6位数字编码
     * 例如：110101 - 东城区
     *
     * @param {string} region - 县级区域代码（如 "110101"）
     * @returns {string} 县级地图数据相对路径
     */
    static getCountyPath(region: string): string;
    /**
     * 根据地图级别获取路径
     *
     * @param {MapLevel} level - 地图级别
     * @param {string} region - 区域代码或名称
     * @returns {string} 地图数据相对路径
     */
    static getPathByLevel(level: MapLevel, region: string): string;
}

/**
 * 美国地图路径管理器（静态类）
 * 负责处理美国地图的特殊数据结构和路径规则
 */
declare class USPathManager {
    /**z
     * 获取国家级别的地图数据路径
     *
     * @param {string} _country - 国家代码或名称（应该是 "USA" 或 "840"）
     * @returns {string} 国家地图数据相对路径
     */
    static getCountryPath(_country: string): string;
    /**
     * 获取省级地图数据路径（美国州级）
     *
     * 支持州名或州代码作为输入，自动通过 usa-state-map 映射
     * 例如："California" -> "ca" -> "usa/states/ca.json"
     *       "CA" -> "ca" -> "usa/states/ca.json"
     *
     * @param {string} region - 州名或州代码（如 "California", "CA", "New York", "NY"）
     * @returns {string} 州级地图数据相对路径
     */
    static getProvincePath(region: string): string;
    /**
     * 获取城市级地图数据路径
     *
     * @param {string} region - 城市区域代码或名称
     * @returns {string} 城市级地图数据相对路径
     */
    static getCityPath(region: string): string;
    /**
     * 获取县级地图数据路径
     *
     * @param {string} region - 县级区域代码或名称
     * @returns {string} 县级地图数据相对路径
     */
    static getCountyPath(_region: string): string;
    /**
     * 根据地图级别获取路径
     *
     * @param {MapLevel} level - 地图级别
     * @param {string} region - 区域代码或名称
     * @returns {string} 地图数据相对路径
     */
    static getPathByLevel(level: MapLevel, region: string): string;
}

/**
 * 国家代码映射
 */
declare enum CountryCode {
    CHINA = "100000",
    CHINA_NAME = "China",
    USA = "840",
    USA_NAME = "USA",
    JAPAN = "392",
    RUSSIA = "643"
}
/**
 * 路径管理器工厂（静态类）
 * 提供静态方法根据国家路由到对应的路径管理器
 */
declare class PathManagerFactory {
    /**
     * 判断国家是否为中国
     *
     * @param {string} country - 国家代码或名称
     * @returns {boolean} 是否为中国
     */
    static isChina(country: string): boolean;
    /**
     * 判断国家是否为美国
     *
     * @param {string} country - 国家代码或名称
     * @returns {boolean} 是否为美国
     */
    static isUSA(country: string): boolean;
    /**
     * 获取国家地图路径
     *
     * @param {string} country - 国家代码或名称
     * @returns {string} 国家地图数据相对路径
     */
    static getCountryPath(country: string): string;
    /**
     * 获取省级地图路径
     *
     * @param {string} country - 国家代码或名称
     * @param {string} region - 省级区域代码或名称
     * @returns {string} 省级地图数据相对路径
     */
    static getProvincePath(country: string, region: string): string;
    /**
     * 获取城市级地图路径
     *
     * @param {string} country - 国家代码或名称
     * @param {string} region - 城市区域代码或名称
     * @returns {string} 城市级地图数据相对路径
     */
    static getCityPath(country: string, region: string): string;
    /**
     * 获取县级地图路径
     *
     * @param {string} country - 国家代码或名称
     * @param {string} region - 县级区域代码或名称
     * @returns {string} 县级地图数据相对路径
     */
    static getCountyPath(country: string, region: string): string;
    /**
     * 检查是否为支持的国家
     *
     * @param {string} country - 国家代码或名称
     * @returns {boolean} 是否为支持的国家
     */
    static isSupportedCountry(country: string): boolean;
}

/**
 * 地图数据路径管理器（协调器）
 * 使用策略模式委托给具体的路径管理器
 *
 * 架构说明：
 * - WorldPathManager: 处理世界级别的地图路径（静态类）
 * - PathManagerFactory: 根据国家路由到对应的路径管理器（静态类）
 * - 各个国家的专用管理器（ChinaPathManager, USPathManager 等）都是静态类
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
     * @param {MapVersion} params.mapVersion - 地图版本（仅用于世界和国家级别）
     * @returns {string} 相对路径字符串
     */
    static generateDataPath(params: {
        currentLevel: MapLevel;
        region: string;
        country: string;
        mapVersion?: MapVersion;
    }): string;
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
     * 检查 geo JSON 文件是否存在
     * @param path - 相对路径
     * @returns {Promise<boolean>} 文件是否存在
     */
    static checkGeoJsonExists(path: string): Promise<boolean>;
    /**
     * 根据路径获取地图数据
     */
    static getMapData(path: string): Promise<FeatureCollection>;
    /**
     * 检查是否可以为指定的参数获取 geo JSON 数据
     * @param params - 地图数据获取参数
     * @returns {Promise<boolean>} 数据是否存在
     */
    static checkGeoJsonExistsForParams(params: GetGeoJsonParams): Promise<boolean>;
    /**
   * 获取地图 GeoJSON 数据（对外接口，合并了 fetchGeoJson 和 getGeoJsonData）
   */
    static getGeoJsonData(params: GetGeoJsonParams): Promise<GeoJSON>;
}

export { ChinaPathManager, CountryCode, type GeoDataParams, type GetGeoJsonParams, type MapDataCache, MapDataPathManager, MapVersion, PathManagerFactory, USPathManager, WorldPathManager, MapDataService as default };
