import { Coordinate, Coordinate3D } from "./geo.interface";

// 颜色类型定义
export type ColorValue =
  | [number, number, number] // RGB 数组
  | [number, number, number, number] // RGBA 数组
  | string; // 16进制颜色值或颜色名称

// 地图等级枚举
export enum MapLevel {
  WORLD = "world",
  COUNTRY = "country",
  PROVINCE = "province",
  CITY = "city",
  COUNTY = "county"
}

// 地图渲染器类型
export enum MapRendererType {
  ECHARTS = "echarts",
  DECKGL = "deckgl",
  LEAFLET = "leaflet",
  MAPBOX = "mapbox"
}

// 基础地图点接口
export interface BaseMapPoint {
  id: string;
  name: string;
  coordinate: Coordinate;
  icon?: string;
  color?: ColorValue;
  opacity?: number;
  size?: number;
  label: {
    show: boolean;
    hoverShow: boolean;
    formatter: (formatterParams: AnyObj) => string;
  };
  tooltip?: string;
  siblingPointId?: string[];
  [key: string]: unknown;
}

// 3D 地图点接口
export interface BaseMapPoint3D extends Omit<BaseMapPoint, "coordinate"> {
  coordinate: Coordinate3D;
  height?: number;
  [key: string]: unknown;
}

// 基础地图线接口
export interface BaseMapLine {
  id: string;
  startCoordinate: Coordinate;
  endCoordinate: Coordinate;
  color?: ColorValue;
  width?: number;
  style?: "solid" | "dashed" | "dotted";
  [key: string]: any; // 允许扩展属性
}

// 3D 地图线接口
export interface BaseMapLine3D {
  id: string;
  startCoordinate: Coordinate3D;
  endCoordinate: Coordinate3D;
  color?: ColorValue;
  width?: number;
  style?: "solid" | "dashed" | "dotted";
  height?: number;
  [key: string]: any; // 允许扩展属性
}

// 地图区域接口
export interface BaseMapArea {
  id: string;
  coordinates: Coordinate[];
  color?: ColorValue;
  fillColor?: ColorValue;
  strokeColor?: ColorValue;
  strokeWidth?: number;
  opacity?: number;
  [key: string]: any;
}

// 地图事件类型
export interface MapEvent {
  type: string;
  coordinate?: Coordinate;
  feature?: any;
  originalEvent?: Event;
  [key: string]: any;
}

// 地图交互配置
export interface MapInteraction {
  zoom?: boolean;
  pan?: boolean;
  rotate?: boolean;
  pitch?: boolean;
  doubleClickZoom?: boolean;
  keyboard?: boolean;
  dragPan?: boolean;
  dragRotate?: boolean;
  scrollZoom?: boolean;
  touchZoom?: boolean;
  touchRotate?: boolean;
}

// 地图样式配置
export interface MapStyle {
  background?: string;
  opacity?: number;
  visibility?: boolean;
  [key: string]: any;
}

// 通用对象类型
export type AnyObj = Record<string, any>;

// 地图数据源类型
export interface MapDataSource {
  id: string;
  type: "geojson" | "vector" | "raster" | "image";
  url?: string;
  data?: any;
  options?: Record<string, any>;
}
