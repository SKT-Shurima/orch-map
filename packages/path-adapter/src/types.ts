import { MapLevel } from "@orch-map/types";

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
