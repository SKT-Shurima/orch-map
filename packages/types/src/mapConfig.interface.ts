import { Coordinate, MapProjection } from "./geo.interface";
import { MapLevel, MapRendererType, MapInteraction, MapStyle } from "./map.interface";

// 地图配置类型 (保留向后兼容)
export interface MapConfig {
  name: string;
  center: Coordinate;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  projection?: MapProjection;
  renderer?: MapRendererType;
  interaction?: MapInteraction;
  style?: MapStyle;
  [key: string]: any;
}

// 数据点类型
export interface DataPoint {
  name: string;
  value: [number, number, number]; // [经度, 纬度, 数值]
  properties?: Record<string, any>;
}

// 地图初始化配置
export interface MapInitConfig {
  container: string | HTMLElement;
  center?: Coordinate;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  projection?: MapProjection;
  renderer?: MapRendererType;
  interaction?: MapInteraction;
  style?: MapStyle;
  width?: number | string;
  height?: number | string;
  [key: string]: any;
}

// 地图更新配置
export interface MapUpdateConfig {
  center?: Coordinate;
  zoom?: number;
  projection?: MapProjection;
  style?: MapStyle;
  interaction?: MapInteraction;
  [key: string]: any;
}

// 地图层级配置
export interface MapLevelConfig {
  level: MapLevel;
  center: Coordinate;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  bounds?: [Coordinate, Coordinate];
  [key: string]: any;
}

