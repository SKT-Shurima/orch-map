/**
 * GeoJSON 工具函数
 */
import { Coordinate, GeoJsonFeature, HcTransform, GeoJsonGeometry, FeatureCollection, Feature } from "@orch-map/types";

/**
 * GeoJSON 工具类
 */
export class GeoJsonUtils {
  /**
   * 检查点是否在多边形内（使用射线算法）
   * @param point 坐标点 [x, y]
   * @param polygon 多边形坐标数组
   * @returns 如果点在多边形内返回 true，否则返回 false
   */
  public static isPointInPolygon(point: Coordinate, polygon: number[][]): boolean {
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
 * @param point 坐标点 [x, y]
 * @param feature GeoJSON 特征
 * @returns 如果点在特征内返回 true，否则返回 false
 */
  public static isPointInFeature(point: Coordinate, feature: GeoJsonFeature): boolean {
    const { geometry } = feature;

    if (geometry.type === "Polygon") {
      return this.isPointInPolygon(point, geometry.coordinates[0] as number[][]);
    }

    if (geometry.type === "MultiPolygon") {
      return (geometry.coordinates as number[][][][]).some((polygon) =>
        this.isPointInPolygon(point, polygon[0]),
      );
    }

    return false;
  }
  /**
   * 将经纬度转换为投影坐标
   * @param transform 坐标转换对象
   * @param lngLat 经纬度坐标 [经度, 纬度]
   * @returns 投影后的坐标 [x, y]
   */
  public static lngLatToProjected(
    transform: HcTransform,
    lngLat: Coordinate,
  ): Coordinate {
    if (!transform?.default) {
      return lngLat;
    }

    const { scale, translate } = transform.default;
    const [lng, lat] = lngLat;

    return [
      lng * scale[0] + translate[0],
      lat * scale[1] + translate[1],
    ];
  }

  /**
   * 将投影坐标转换回经纬度
   * @param transform 坐标转换对象
   * @param projected 投影坐标 [x, y]
   * @returns 经纬度坐标 [经度, 纬度]
   */
  public static projectedToLngLat(
    transform: HcTransform,
    projected: Coordinate,
  ): Coordinate {
    if (!transform?.default) {
      return projected;
    }

    const { scale, translate } = transform.default;
    const [x, y] = projected;

    return [
      (x - translate[0]) / scale[0],
      (y - translate[1]) / scale[1],
    ];
  }

  /**
   * 计算多边形的中心点
   * @param coordinates 多边形坐标数组
   * @returns 中心点坐标 [x, y]
   */
  public static getPolygonCenter(coordinates: number[][][]): Coordinate {
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
   * 计算 GeoJSON 特征的中心点
   * @param feature GeoJSON 特征
   * @returns 中心点坐标 [x, y]
   */
  public static getFeatureCenter(feature: GeoJsonFeature): Coordinate {
    const { geometry } = feature;

    switch (geometry.type) {
      case "Point":
        return geometry.coordinates as Coordinate;

      case "MultiPoint":
      case "LineString":
        return this.getLineCentroid(geometry.coordinates as Coordinate[]);

      case "MultiLineString":
        return this.getLineCentroid(geometry.coordinates.flat() as Coordinate[]);

      case "Polygon":
        return this.getPolygonCenter(geometry.coordinates as number[][][]);

      case "MultiPolygon": {
        // 计算每个多边形的中心点，然后取平均值
        const centers = geometry.coordinates.map((polygon: unknown) =>
          this.getPolygonCenter(polygon as number[][][]),
        );
        return this.getLineCentroid(centers);
      }

      default:
        return [0, 0];
    }
  }

  /**
   * 计算线或点集的质心
   * @param coordinates 坐标数组
   * @returns 质心坐标 [x, y]
   */
  public static getLineCentroid(coordinates: Coordinate[]): Coordinate {
    if (!coordinates || coordinates.length === 0) {
      return [0, 0];
    }

    const sumX = coordinates.reduce((sum, coord) => sum + coord[0], 0);
    const sumY = coordinates.reduce((sum, coord) => sum + coord[1], 0);

    return [sumX / coordinates.length, sumY / coordinates.length];
  }

  /**
   * 计算 GeoJSON 特征的边界框
   * @param feature GeoJSON 特征
   * @returns 边界框坐标 [[minX, minY], [maxX, maxY]]
   */
  public static getBounds(feature: GeoJsonFeature): [Coordinate, Coordinate] {
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

    const processCoordinates = (coords: unknown[]) => {
      if (Array.isArray(coords) && typeof coords[0] === "number") {
        processCoordinate(coords as number[]);
      } else if (Array.isArray(coords)) {
        coords.forEach((coord) => processCoordinates(coord as unknown[]));
      }
    };

    processCoordinates(geometry.coordinates);

    return [[minX, minY], [maxX, maxY]];
  }

  /**
   * 计算 GeoJSON FeatureCollection 的边界框
   * @param featureCollection GeoJSON FeatureCollection
   * @returns 边界框坐标 [[minX, minY], [maxX, maxY]]
   */
  public static getFeatureCollectionBounds(featureCollection: FeatureCollection): [Coordinate, Coordinate] {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    featureCollection.features.forEach(feature => {
      const [[fMinX, fMinY], [fMaxX, fMaxY]] = this.getBounds(feature as GeoJsonFeature);
      minX = Math.min(minX, fMinX);
      minY = Math.min(minY, fMinY);
      maxX = Math.max(maxX, fMaxX);
      maxY = Math.max(maxY, fMaxY);
    });

    return [[minX, minY], [maxX, maxY]];
  }

  /**
   * 创建空的 GeoJSON FeatureCollection
   * @param features GeoJSON 特征数组
   * @returns GeoJSON FeatureCollection
   */
  public static createFeatureCollection(features: Feature[] = []): FeatureCollection {
    return {
      type: "FeatureCollection" as const,
      features,
    };
  }

  /**
   * 创建 GeoJSON Point 特征
   * @param coordinate 点坐标 [x, y]
   * @param properties 特征属性
   * @returns GeoJSON Point 特征
   */
  public static createPointFeature(
    coordinate: Coordinate,
    properties: Record<string, unknown> = {},
  ): GeoJsonFeature {
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: coordinate,
      },
      properties,
    };
  }

  /**
   * 创建 GeoJSON LineString 特征
   * @param coordinates 线坐标数组
   * @param properties 特征属性
   * @returns GeoJSON LineString 特征
   */
  public static createLineFeature(
    coordinates: Coordinate[],
    properties: Record<string, unknown> = {},
  ): GeoJsonFeature {
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates,
      },
      properties,
    };
  }

  /**
   * 创建 GeoJSON Polygon 特征
   * @param coordinates 多边形坐标数组
   * @param properties 特征属性
   * @returns GeoJSON Polygon 特征
   */
  public static createPolygonFeature(
    coordinates: Coordinate[][],
    properties: Record<string, unknown> = {},
  ): GeoJsonFeature {
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates,
      },
      properties,
    };
  }

  /**
   * 计算两点之间的距离
   * @param point1 点1坐标 [x, y]
   * @param point2 点2坐标 [x, y]
   * @returns 欧几里得距离
   */
  public static distance(point1: Coordinate, point2: Coordinate): number {
    const dx = point2[0] - point1[0];
    const dy = point2[1] - point1[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算线段的长度
   * @param line 线段坐标数组
   * @returns 线段长度
   */
  public static lineLength(line: Coordinate[]): number {
    let length = 0;
    for (let i = 0; i < line.length - 1; i++) {
      length += this.distance(line[i], line[i + 1]);
    }
    return length;
  }

  /**
   * 计算多边形的面积
   * @param polygon 多边形坐标数组
   * @returns 多边形面积
   */
  public static polygonArea(polygon: Coordinate[]): number {
    let area = 0;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      area += polygon[i][0] * polygon[j][1];
      area -= polygon[j][0] * polygon[i][1];
    }
    return Math.abs(area) / 2;
  }

  /**
   * 简化 GeoJSON 几何体 (按采样间隔简化)
   * @param geometry GeoJSON 几何体
   * @param tolerance 简化容差
   * @returns 简化后的几何体
   */
  public static simplifyGeometry(geometry: GeoJsonGeometry, tolerance: number): GeoJsonGeometry {
    const simplifyCoords = (coords: Coordinate[]): Coordinate[] => {
      if (coords.length <= 2) return coords;

      const result: Coordinate[] = [coords[0]];
      let prevPoint = coords[0];

      for (let i = 1; i < coords.length - 1; i++) {
        if (this.distance(prevPoint, coords[i]) >= tolerance) {
          result.push(coords[i]);
          prevPoint = coords[i];
        }
      }

      // 确保包含最后一个点
      if (coords.length > 1) {
        result.push(coords[coords.length - 1]);
      }

      return result;
    };

    const processGeometry = (geom: GeoJsonGeometry): GeoJsonGeometry => {
      switch (geom.type) {
        case "Point":
          return geom;

        case "LineString":
          return {
            ...geom,
            coordinates: simplifyCoords(geom.coordinates as Coordinate[]),
          };

        case "Polygon":
          return {
            ...geom,
            coordinates: (geom.coordinates as Coordinate[][]).map(ring =>
              simplifyCoords(ring),
            ),
          };

        case "MultiPoint":
          return geom;

        case "MultiLineString":
          return {
            ...geom,
            coordinates: (geom.coordinates as Coordinate[][]).map(line =>
              simplifyCoords(line),
            ),
          };

        case "MultiPolygon":
          return {
            ...geom,
            coordinates: (geom.coordinates as Coordinate[][][]).map(polygon =>
              polygon.map(ring => simplifyCoords(ring)),
            ),
          };

        default:
          return geom;
      }
    };

    return processGeometry(geometry);
  }

  /**
   * 简化 GeoJSON 特征
   * @param feature GeoJSON 特征
   * @param tolerance 简化容差
   * @returns 简化后的特征
   */
  public static simplifyFeature(feature: GeoJsonFeature, tolerance: number): GeoJsonFeature {
    return {
      ...feature,
      geometry: this.simplifyGeometry(feature.geometry, tolerance),
    };
  }

  /**
   * 合并多个 GeoJSON FeatureCollection
   * @param collections GeoJSON FeatureCollection 数组
   * @returns 合并后的 FeatureCollection
   */
  public static mergeFeatureCollections(...collections: FeatureCollection[]): FeatureCollection {
    const features = collections.reduce((acc, collection) =>
      acc.concat(collection.features), [] as Feature[]);

    return this.createFeatureCollection(features);
  }

  /**
   * 将 GeoJSON 特征转换为 WKT (Well-Known Text) 格式
   * @param feature GeoJSON 特征
   * @returns WKT 字符串
   */
  public static featureToWKT(feature: GeoJsonFeature): string {
    const { geometry } = feature;

    const coordsToWKT = (coords: number[]): string =>
      `${coords[0]} ${coords[1]}`;

    const ringsToWKT = (rings: number[][][]): string => {
      const ringsWKT = rings.map(ring => {
        const pointsWKT = ring.map(coordsToWKT).join(", ");
        return `(${pointsWKT})`;
      }).join(", ");

      return ringsWKT;
    };

    switch (geometry.type) {
      case "Point":
        return `POINT(${coordsToWKT(geometry.coordinates as number[])})`;

      case "LineString":
        return `LINESTRING(${(geometry.coordinates as number[][]).map(coordsToWKT).join(", ")})`;

      case "Polygon":
        return `POLYGON(${ringsToWKT(geometry.coordinates as number[][][])})`;

      case "MultiPoint":
        return `MULTIPOINT(${(geometry.coordinates as number[][]).map(coord => `(${coordsToWKT(coord)})`).join(", ")})`;

      case "MultiLineString":
        return `MULTILINESTRING(${(geometry.coordinates as number[][][]).map(line =>
          `(${line.map(coordsToWKT).join(", ")})`).join(", ")})`;

      case "MultiPolygon":
        return `MULTIPOLYGON(${(geometry.coordinates as number[][][][]).map(polygon =>
          `(${ringsToWKT(polygon)})`).join(", ")})`;

      default:
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }
  }
}
