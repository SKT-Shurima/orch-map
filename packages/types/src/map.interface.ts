import { Coordinate, Coordinate3D } from "./geo.interface";

// 地图等级枚举
export enum MapLevel {
  WORLD = 'world',
  COUNTRY = 'country',
  PROVINCE = 'province',
  CITY = 'city',
  COUNTY = 'county'
}

// 地图渲染器类型
export enum MapRendererType {
  ECHARTS = 'echarts',
  DECKGL = 'deckgl',
  LEAFLET = 'leaflet',
  MAPBOX = 'mapbox'
}

// 基础地图点接口
export interface BaseMapPoint {
  id: string;
  coordinate: Coordinate;
  icon?: string;
  color?: [number, number, number, number];
  size?: number;
  label?: string;
  tooltip?: string;
  [key: string]: any; // 允许扩展属性
}

// 3D 地图点接口
export interface BaseMapPoint3D {
  id: string;
  coordinate: Coordinate3D;
  icon?: string;
  color?: [number, number, number, number];
  size?: number;
  label?: string;
  tooltip?: string;
  height?: number;
  [key: string]: any; // 允许扩展属性
}

// 基础地图线接口
export interface BaseMapLine {
  id: string;
  startCoordinate: Coordinate;
  endCoordinate: Coordinate;
  color?: [number, number, number, number];
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  [key: string]: any; // 允许扩展属性
}

// 3D 地图线接口
export interface BaseMapLine3D {
  id: string;
  startCoordinate: Coordinate3D;
  endCoordinate: Coordinate3D;
  color?: [number, number, number, number];
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  height?: number;
  [key: string]: any; // 允许扩展属性
}

// 地图区域接口
export interface BaseMapArea {
  id: string;
  coordinates: Coordinate[];
  color?: [number, number, number, number];
  fillColor?: [number, number, number, number];
  strokeColor?: [number, number, number, number];
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
  type: 'geojson' | 'vector' | 'raster' | 'image';
  url?: string;
  data?: any;
  options?: Record<string, any>;
}