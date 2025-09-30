/**
 * GeoJSON 工具函数
 */
import { Coordinate, GeoJsonFeature, HcTransform } from '@orch-map/types';

/**
 * GeoJSON 工具类
 */
export class GeoJsonUtils {
  /**
   * 检查点是否在多边形内（使用射线算法）
   */
  static isPointInPolygon(point: Coordinate, polygon: number[][]): boolean {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  /**
   * 检查点是否在 GeoJSON 特征内
   */
  static isPointInFeature(point: Coordinate, feature: GeoJsonFeature): boolean {
    const { geometry } = feature;
    
    if (geometry.type === 'Polygon') {
      return this.isPointInPolygon(point, geometry.coordinates[0]);
    }
    
    if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates.some((polygon: number[][][]) => 
        this.isPointInPolygon(point, polygon[0])
      );
    }
    
    return false;
  }

  /**
   * 将经纬度转换为投影坐标
   */
  static lngLatToProjected(
    transform: HcTransform,
    lngLat: Coordinate
  ): Coordinate {
    if (!transform?.default) {
      return lngLat;
    }
    
    const { scale, translate } = transform.default;
    const [lng, lat] = lngLat;
    
    return [
      lng * scale[0] + translate[0],
      lat * scale[1] + translate[1]
    ];
  }

  /**
   * 计算多边形的中心点
   */
  static getPolygonCenter(coordinates: number[][][]): Coordinate {
    if (!coordinates || coordinates.length === 0) {
      return [0, 0];
    }

    const ring = coordinates[0]; // 外环
    if (!ring || ring.length === 0) {
      return [0, 0];
    }

    let x = 0;
    let y = 0;
    let area = 0;

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0];
      const yi = ring[i][1];
      const xj = ring[j][0];
      const yj = ring[j][1];
      
      const a = xi * yj - xj * yi;
      area += a;
      x += (xi + xj) * a;
      y += (yi + yj) * a;
    }

    area *= 0.5;
    return area === 0 ? [0, 0] : [x / (6.0 * area), y / (6.0 * area)];
  }

  /**
   * 计算 GeoJSON 特征的边界框
   */
  static getBounds(feature: GeoJsonFeature): [Coordinate, Coordinate] {
    const { geometry } = feature;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const processCoordinate = (coord: number[]) => {
      const [x, y] = coord;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    };

    const processCoordinates = (coords: any) => {
      if (typeof coords[0] === 'number') {
        processCoordinate(coords);
      } else {
        coords.forEach(processCoordinates);
      }
    };

    processCoordinates(geometry.coordinates);

    return [[minX, minY], [maxX, maxY]];
  }

  /**
   * 创建空的 GeoJSON FeatureCollection
   */
  static createFeatureCollection(features: GeoJsonFeature[] = []) {
    return {
      type: 'FeatureCollection' as const,
      features
    };
  }

  /**
   * 创建 GeoJSON Point 特征
   */
  static createPointFeature(
    coordinate: Coordinate,
    properties: Record<string, any> = {}
  ): GeoJsonFeature {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coordinate
      },
      properties
    };
  }

  /**
   * 创建 GeoJSON LineString 特征
   */
  static createLineFeature(
    coordinates: Coordinate[],
    properties: Record<string, any> = {}
  ): GeoJsonFeature {
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates
      },
      properties
    };
  }
}