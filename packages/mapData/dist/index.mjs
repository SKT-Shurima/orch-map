// src/types.ts
var MapDataPath = /* @__PURE__ */ ((MapDataPath2) => {
  MapDataPath2["WORLD"] = "world/world-highres3.geo.json";
  MapDataPath2["WORLD_BOUNDARY"] = "world/world_edge.geo.json";
  MapDataPath2["WORLD_WGS84"] = "world/wgs84_world.geo.json";
  MapDataPath2["WORLD_WGS84_FOR_US"] = "world/wgs84_world_for_US.geo.json";
  MapDataPath2["CHINA"] = "china/100000_full.json";
  MapDataPath2["CHINA_BOUNDARY"] = "china/000000_edge.json";
  MapDataPath2["US_BOUNDARY"] = "us/united-states.json";
  return MapDataPath2;
})(MapDataPath || {});

// src/pathManager.ts
import { MapLevel } from "@orch-map/types";
var MapDataPathManager = class {
  /**
   * 获取地图数据的基础路径
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
   */
  static generateDataPath(params) {
    const { currentLevel, region, country, mapVersion = "default" } = params;
    switch (currentLevel) {
      case MapLevel.WORLD:
        return mapVersion === "international" ? "world/wgs84_world_for_US.geo.json" /* WORLD_WGS84_FOR_US */ : "world/wgs84_world.geo.json" /* WORLD_WGS84 */;
      case MapLevel.COUNTRY:
        if (region === "100000") {
          return "china/100000-2.json";
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
   * 获取完整的数据路径
   */
  static getFullPath(relativePath) {
    const basePath = this.getBasePath();
    return `${basePath}/${relativePath}`;
  }
  /**
   * 获取所有可用的地图数据路径
   */
  static getAllPaths() {
    return {
      // 世界地图
      world: "world/wgs84_world.geo.json" /* WORLD_WGS84 */,
      worldBoundary: "world/world_edge.geo.json" /* WORLD_BOUNDARY */,
      worldWgs84: "world/wgs84_world.geo.json" /* WORLD_WGS84 */,
      worldWgs84ForUs: "world/wgs84_world_for_US.geo.json" /* WORLD_WGS84_FOR_US */,
      // 中国地图
      china: "china/100000_full.json" /* CHINA */,
      chinaBoundary: "china/000000_edge.json" /* CHINA_BOUNDARY */,
      // 美国地图
      usBoundary: "us/united-states.json" /* US_BOUNDARY */
    };
  }
};

// src/dataService.ts
var MapDataService = class {
  /**
   * 根据路径获取地图数据
   */
  static async getMapData(path) {
    if (this.cache[path]) {
      return this.cache[path];
    }
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
    this.cache[path] = data;
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
   * 根据参数获取地图数据
   */
  static async fetchGeoJson(params) {
    const path = MapDataPathManager.generateDataPath(params);
    if (!path) {
      throw new Error("Detail data path not found");
    }
    let data = await this.getMapData(path);
    if (params.currentLevel === "country" && params.region === "100000") {
      data = this.processChinaMapData(data);
    }
    return data;
  }
  /**
   * 获取地图 GeoJSON 数据（对外接口）
   */
  static async getGeoJsonData(params) {
    return await this.fetchGeoJson({
      currentLevel: params.mapLevel,
      country: params.country,
      region: params.region,
      mapType: params.mapType ?? "echart"
    });
  }
  /**
   * 清除缓存
   */
  static clearCache() {
    this.cache = {};
  }
  /**
   * 获取缓存状态
   */
  static getCacheStatus() {
    return {
      size: Object.keys(this.cache).length,
      keys: Object.keys(this.cache)
    };
  }
};
MapDataService.cache = {};
export {
  MapDataPath,
  MapDataPathManager,
  MapDataService,
  MapDataService as getGeoJsonData
};
//# sourceMappingURL=index.mjs.map