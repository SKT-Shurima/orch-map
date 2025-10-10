import { MapLevel } from "@orch-map/types";

// 地图数据路径枚举
export enum MapDataPath {
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
export interface MapDataCache {
  [key: string]: any;
}

// 获取地图数据的参数
export interface GetGeoJsonParams {
  mapLevel: MapLevel;
  country: string;
  region: string;
  mapType?: "echart" | "deckgl";
}
