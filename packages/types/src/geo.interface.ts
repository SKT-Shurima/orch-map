/**
 * @orch-map/types - 地图组件类型定义
 * 地理空间数据类型定义
 */

// 基础坐标类型
export type Coordinate = [number, number];
export type CoordinateNumber = [number, number];

// 3D 坐标类型
export type Coordinate3D = [number, number, number];

// 边界框类型
export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// GeoJSON 相关类型
// export interface GeoJsonData {
//   type: 'FeatureCollection';
//   features: GeoJsonFeature[];
//   'hc-transform'?: {
//     default?: HcTransform;
//   };
//   bbox?: [number, number, number, number];
//   [key: string]: any;
// }

export interface GeoJsonFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: GeoJsonGeometry;
  id?: string | number;
  bbox?: [number, number, number, number];
  [key: string]: any;
}

export interface GeoJsonGeometry {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon' | 'GeometryCollection';
  coordinates: any;
  bbox?: [number, number, number, number];
}

export interface HcTransform {
  default: {
    crs: string;
    scale: [number, number];
    translate: [number, number];
  };
}

// 地图投影相关类型
export interface MapProjection {
  name: string;
  center?: [number, number];
  scale?: number;
  translate?: [number, number];
  rotate?: [number, number, number];
}


export type { FeatureCollection, Feature } from "geojson"