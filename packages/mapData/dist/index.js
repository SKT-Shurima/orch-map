"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  MapDataPathManager: () => MapDataPathManager,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);

// src/pathManager.ts
var import_types = require("@orch-map/types");
var MapDataPathManager = class {
  /**
   * 获取地图数据的基础路径
   * 根据运行环境返回适当的基础路径
   *
   * @returns {string} 基础路径字符串
   */
  static getBasePath() {
    if (typeof window !== "undefined") {
      return "/mapData";
    } else {
      return "./data";
    }
  }
  /**
   * 根据参数生成数据路径
   *
   * @param {Object} params - 路径生成参数
   * @param {MapLevel} params.currentLevel - 当前地图级别
   * @param {string} params.region - 区域代码或名称
   * @param {string} params.country - 国家代码或名称
   * @returns {string} 相对路径字符串
   */
  static generateDataPath(params) {
    const { currentLevel, region, country, mapVersion = "standard" /* STANDARD */ } = params;
    switch (currentLevel) {
      case import_types.MapLevel.WORLD:
        return this.getWorldMapPath(mapVersion);
      case import_types.MapLevel.COUNTRY:
        return this.getCountryMapPath(country, mapVersion);
      case import_types.MapLevel.PROVINCE:
        return this.getProvinceMapPath(country, region);
      case import_types.MapLevel.CITY:
        return this.getCityMapPath(country, region);
      case import_types.MapLevel.COUNTY:
        return this.getCountyMapPath(country, region);
      default:
        return "";
    }
  }
  /**
   * 获取世界地图数据路径
   *
   * @param {MapVersion} mapVersion - 地图版本
   * @returns {string} 世界地图数据相对路径
   */
  static getWorldMapPath(mapVersion) {
    switch (mapVersion) {
      case "international":
        return "world/wgs84_world_for_US.geo.json" /* WORLD_WGS84_FOR_US */;
      case "standard":
      default:
        return "world/wgs84_world.geo.json" /* WORLD_WGS84 */;
    }
  }
  /**
   * 获取国家地图数据路径
   *
   * @param {string} country - 国家代码或名称
   * @param {MapVersion} mapVersion - 地图版本
   * @returns {string} 国家地图数据相对路径
   */
  static getCountryMapPath(country, mapVersion) {
    if (country === "China" || country === "100000") {
      switch (mapVersion) {
        case "international" /* INTERNATIONAL */:
          return "world/countries/cn-all.geo.json";
        case "standard" /* STANDARD */:
        default:
          return "china/100000.json";
      }
    } else {
      return `world/countries/${country}-all.geo.json`;
    }
  }
  /**
   * 获取省级地图数据路径
   *
   * @param {string} country - 国家代码或名称
   * @param {string} region - 省级区域代码或名称
   * @returns {string} 省级地图数据相对路径
   */
  static getProvinceMapPath(country, region) {
    if (country === "China" || country === "100000") {
      return `china/${region}_full.json`;
    } else if (country === "USA" || country === "840") {
      return `usa/states/${region}.json`;
    } else {
      return `world/regions/${country}/${region}.json`;
    }
  }
  /**
   * 获取城市级地图数据路径
   *
   * @param {string} country - 国家代码或名称
   * @param {string} region - 城市区域代码或名称
   * @returns {string} 城市级地图数据相对路径
   */
  static getCityMapPath(country, region) {
    if (country === "China" || country === "100000") {
      return `china/${region}.json`;
    } else if (country === "USA" || country === "840") {
      return `usa/cities/${region}.json`;
    } else {
      return `world/cities/${country}/${region}.json`;
    }
  }
  /**
   * 获取县级地图数据路径
   *
   * @param {string} country - 国家代码或名称
   * @param {string} region - 县级区域代码或名称
   * @returns {string} 县级地图数据相对路径
   */
  static getCountyMapPath(country, region) {
    if (country === "China" || country === "100000") {
      return `china/${region}.json`;
    } else if (country === "USA" || country === "840") {
      return `usa/counties/${region}.json`;
    } else {
      return `world/counties/${country}/${region}.json`;
    }
  }
  /**
   * 获取完整的数据路径
   *
   * @param {string} relativePath - 相对路径
   * @returns {string} 完整的数据访问路径
   */
  static getFullPath(relativePath) {
    const basePath = this.getBasePath();
    return `${basePath}/${relativePath}`;
  }
};

// src/dataService.ts
var MapDataService = class _MapDataService {
  /**
   * 根据路径获取地图数据
   */
  static async getMapData(path) {
    let data;
    try {
      const fullPath = MapDataPathManager.getFullPath(path);
      const response = await fetch(fullPath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      data = await response.json();
    } catch (error) {
      console.error(`Failed to fetch map data from ${path}:`, error);
      return {
        type: "FeatureCollection",
        features: []
      };
    }
    return data || {
      type: "FeatureCollection",
      features: []
    };
  }
  /**
   * 处理中国地图特殊数据（移除9段线等）
   */
  static processChinaMapData(data) {
    data.features = data.features.filter((feature) => {
      if (!feature.properties?.name) {
        return false;
      }
      if (feature.properties.name === "\u6D77\u5357\u7701") {
        if (feature.geometry && feature.geometry.type === "MultiPolygon" && feature.geometry.coordinates && Array.isArray(feature.geometry.coordinates)) {
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
  static async getGeoJsonData(params) {
    const path = MapDataPathManager.generateDataPath({
      currentLevel: params.mapLevel,
      country: params.country,
      region: params.region
    });
    if (!path) {
      throw new Error("Detail data path not found");
    }
    return await _MapDataService.getMapData(path);
  }
};

// src/index.ts
var index_default = MapDataService;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MapDataPathManager
});
//# sourceMappingURL=index.js.map