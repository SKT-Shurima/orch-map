import { MapLevel, type GeoJSON } from "@orch-map/types";
import { CHINA_AD_CODE_JUST_FOR_FE, G2, US_AD_CODE_JUST_FOR_FE } from "../constants";
import { POST_CODE_KEY } from "../echarts-geo/echart.option";
import MapStateManager from "../MapStateManager";

// China postcode used internally for FE logic
const CHINA_POSTCODE_JUST_FOR_FE = "100000";

type GeoBounds = {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
};

/**
 * @description: 地理工具类
 * 主要处理地图的 title、中心点、缩放大小、postcode 等相关功能
 */
export default class GeoUtils {
  /**
   * 获取 geoJSON 的 title
   * @param geoJson - GeoJSON 对象
   * @param level - 地图层级
   * @returns title 字段值，如果没有则返回空字符串
   */
  public static getGeoJsonTitle(geoJson: GeoJSON, level: MapLevel): string {
    if (
      !geoJson ||
      typeof geoJson !== "object" ||
      geoJson.type !== "FeatureCollection"
    ) {
      return "";
    }

    // 标准的 title 字段
    if ("title" in geoJson && typeof geoJson.title === "string") {
      return geoJson.title;
    }

    // 兜底策略
    let defaultTitle = "";

    switch (level) {
      case MapLevel.COUNTRY:
        defaultTitle = "country";
        break;
      case MapLevel.PROVINCE:
        defaultTitle = "province";
        break;
      case MapLevel.CITY:
        defaultTitle = "city";
        break;
      case MapLevel.COUNTY:
        defaultTitle = "county";
        break;
      case MapLevel.WORLD:
        defaultTitle = "world";
        break;
    }

    // 有些数据 title 可能放在 properties 里
    if (
      Array.isArray(geoJson.features) &&
      geoJson.features.length > 0 &&
      typeof geoJson.features[0] === "object" &&
      geoJson.features[0] !== null &&
      "properties" in geoJson.features[0] &&
      geoJson.features[0].properties &&
      typeof (geoJson.features[0].properties as { title?: unknown }).title === "string"
    ) {
      return (geoJson.features[0].properties as { title?: string }).title ?? defaultTitle;
    }

    return defaultTitle;
  }


  /**
   * @description: 矫正地级市postcode
   * @warning 注意矫正地级市的postcode仅限在中国地图内，国外地图的postcode拿不到
   * @param start - 起始postcode
   * @param end - 结束postcode
   * @param currLev - 当前地图层级
   * @returns 矫正后的postcode数组 [start, end]
   */
  public static correctPostcodeByLevel(start: string, end: string, currLev: MapLevel): string[] {
    let bit = 0;
    switch (currLev) {
      case MapLevel.PROVINCE:
        bit = 2;
        break;
      case MapLevel.CITY:
        bit = 4;
        break;
      case MapLevel.COUNTY:
        bit = 6;
        break;
      case MapLevel.COUNTRY:
      case MapLevel.WORLD:
      default:
        bit = 0;
        break;
    }

    if (bit) {
      const FULL = 6;
      const suffix: string = new Array(FULL - bit).fill("0").join("");
      return [start ? start.slice(0, bit) + suffix : "", end ? end.slice(0, bit) + suffix : ""];
    } else {
      return [CHINA_POSTCODE_JUST_FOR_FE, ""];
    }
  }

  /**
   * 根据地理要素名称获取行政区划代码
   * @param name - 地理要素名称
   * @returns 行政区划代码
   */
  public static getPostCodeByGeoFeatures(name: string): string {
    const detailGeojson = MapStateManager.geoData;
    if (typeof detailGeojson === "string" || detailGeojson.type !== "FeatureCollection") {
      return "";
    }
    const features = detailGeojson.features;
    if (!Array.isArray(features)) {
      return "";
    }

    const target = features.find(item => item.properties?.name === name);
    if (!target) {
      return "";
    }

    const currentMapIsChina = GeoUtils.getCurrentMapIsChina();
    if (currentMapIsChina) {
      const props = target.properties as { adcode?: string } | undefined;
      return props?.adcode ? String(props.adcode) : "";
    }

    const props = target.properties as Record<string, unknown> | undefined;
    if (!props) {
      return "";
    }

    const code = props[POST_CODE_KEY];
    return typeof code === "string" ? code : "";
  }

  /**
   * 获取当前地图是否为中国地图
   * @returns 是否为中国地图
   */
  public static getCurrentMapIsChina(): boolean {
    return MapStateManager.country === "China";
  }

  /**
   * 获取下一级地图的行政区划代码
   * @param name - 区域名称
   * @returns 下一级行政区划代码
   */
  public static getNextPostcode(name: string): string {
    let nextPostcode = "";
    if (MapStateManager.curLevel === MapLevel.WORLD) {
      if (name === G2.CHINA) {
        nextPostcode = CHINA_AD_CODE_JUST_FOR_FE;
      } else if (name === G2.USA) {
        nextPostcode = US_AD_CODE_JUST_FOR_FE;
      } else {
        nextPostcode = GeoUtils.getPostCodeByGeoFeatures(name || "");
      }
    } else {
      nextPostcode = GeoUtils.getPostCodeByGeoFeatures(name || "");
    }
    return nextPostcode;
  }

  /**
   * 计算 GeoJSON 的边界框
   * @param geojsonData - GeoJSON 数据
   * @returns 边界框对象，包含 minLng、maxLng、minLat、maxLat
   */
  private static calculateGeoBounds(geojsonData: GeoJSON): GeoBounds | null {
    if (geojsonData.type !== "FeatureCollection" || !geojsonData.features?.length) {
      return null;
    }

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    const extractCoordinates = (coords: any) => {
      if (Array.isArray(coords)) {
        if (coords.length === 2 && typeof coords[0] === "number" && typeof coords[1] === "number") {
          const [lng, lat] = coords;
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        } else {
          coords.forEach((item) => extractCoordinates(item));
        }
      }
    };

    geojsonData.features.forEach((feature) => {
      if (feature.geometry && "coordinates" in feature.geometry) {
        extractCoordinates(feature.geometry.coordinates);
      }
    });

    if (minLng === Infinity || maxLng === -Infinity || minLat === Infinity || maxLat === -Infinity) {
      return null;
    }

    return { minLng, maxLng, minLat, maxLat };
  }

  /**
   * 计算边界框中心点
   * @param bounds - 边界框对象
   * @returns 中心点坐标 [lng, lat]
   */
  private static calculateBoundsCenter(bounds: GeoBounds): [number, number] {
    return [
      (bounds.minLng + bounds.maxLng) / 2,
      (bounds.minLat + bounds.maxLat) / 2,
    ];
  }

  /**
   * 根据边界框计算合适的缩放级别
   * @param bounds - 边界框对象
   * @param containerWidth - 容器宽度（默认 1000）
   * @param containerHeight - 容器高度（默认 800）
   * @param padding - 内边距比例（默认 0.8）
   * @returns 缩放级别
   */
  private static calculateZoomForBounds(
    bounds: GeoBounds,
    containerWidth = 1000,
    containerHeight = 800,
    padding = 0.8,
  ): number {
    const lngDiff = Math.abs(bounds.maxLng - bounds.minLng);
    const latDiff = Math.abs(bounds.maxLat - bounds.minLat);

    // 基于经度差计算缩放级别
    const zoomLng = Math.log2((containerWidth * padding * 360) / (256 * lngDiff));

    // 基于纬度差计算缩放级别，考虑纬度的投影变形
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const latScale = 1 / Math.cos((centerLat * Math.PI) / 180);
    const zoomLat = Math.log2((containerHeight * padding * 180) / (256 * latDiff * latScale));

    // 取较小的缩放级别，确保所有内容都可见
    const zoom = Math.min(zoomLng, zoomLat);

    // 限制缩放级别在合理范围内
    return Math.max(0, Math.min(12, zoom));
  }

  /**
   * 获取 GeoJSON 的中心点和缩放级别
   * @param geojsonData - GeoJSON 数据
   * @param containerWidth - 容器宽度
   * @param containerHeight - 容器高度
   * @returns 包含中心点和缩放级别的对象，如果计算失败则返回 null
   */
  public static getCenterAndZoom(
    geojsonData: GeoJSON,
    {
      containerWidth,
      containerHeight,
    }: {
      containerWidth: number;
      containerHeight: number;
    },
  ): { center: [number, number]; zoom: number } | null {
    const bounds = GeoUtils.calculateGeoBounds(geojsonData);
    if (!bounds) {
      return null;
    }

    const center = GeoUtils.calculateBoundsCenter(bounds);
    const zoom = GeoUtils.calculateZoomForBounds(bounds, containerWidth, containerHeight);

    return { center, zoom };
  }

  /**
   * 根据容器宽度计算最小缩放级别
   * @param containerWidth - 容器宽度
   * @returns 最小缩放级别
   */
  public static calculateMinZoom(containerWidth: number): number {
    const zoom = Math.log2(containerWidth / 256);
    return zoom - 1;
  }

  /**
   * 判断点是否在多边形内（射线法）
   * @param point - 点坐标 [lng, lat]
   * @param polygon - 多边形坐标数组
   * @returns 是否在多边形内
   */
  private static isPointInPolygon(point: [number, number], polygon: number[][][]): boolean {
    const [x, y] = point;

    for (const ring of polygon) {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0];
        const yi = ring[i][1];
        const xj = ring[j][0];
        const yj = ring[j][1];

        const intersect = ((yi > y) !== (yj > y)) &&
          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      if (inside) return true;
    }
    return false;
  }

  /**
   * 判断点是否在 MultiPolygon 内
   * @param point - 点坐标 [lng, lat]
   * @param multiPolygon - MultiPolygon 坐标数组
   * @returns 是否在 MultiPolygon 内
   */
  private static isPointInMultiPolygon(point: [number, number], multiPolygon: number[][][][]): boolean {
    for (const polygon of multiPolygon) {
      if (GeoUtils.isPointInPolygon(point, polygon)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 判断点是否在 GeoJSON 区域内
   * @param lng - 经度
   * @param lat - 纬度
   * @param geoData - GeoJSON 数据
   * @returns 是否在区域内
   */
  public static isPointInGeoJSON(lng: number, lat: number, geoData: GeoJSON): boolean {
    if (!geoData || geoData.type !== "FeatureCollection" || !geoData.features) {
      return false;
    }

    const point: [number, number] = [lng, lat];

    // 首先检查边界框
    const bounds = GeoUtils.calculateGeoBounds(geoData);
    if (!bounds) {
      return false;
    }

    // 快速边界框检测
    if (lng < bounds.minLng || lng > bounds.maxLng || lat < bounds.minLat || lat > bounds.maxLat) {
      return false;
    }

    // 精确检测：遍历所有 feature
    for (const feature of geoData.features) {
      if (!feature.geometry || !("coordinates" in feature.geometry)) continue;

      const { type, coordinates } = feature.geometry;

      if (type === "Polygon") {
        if (GeoUtils.isPointInPolygon(point, coordinates as number[][][])) {
          return true;
        }
      } else if (type === "MultiPolygon") {
        if (GeoUtils.isPointInMultiPolygon(point, coordinates as number[][][][])) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 过滤在 GeoJSON 区域内的点位
   * @param points - 点位数组
   * @param geoData - GeoJSON 数据
   * @returns 过滤后的点位数组
   */
  public static filterPointsInGeoJSON<T extends { coordinate: [number, number] }>(
    points: T[],
    geoData: GeoJSON,
  ): T[] {
    if (!points || points.length === 0) {
      return [];
    }

    if (!geoData || geoData.type !== "FeatureCollection") {
      return points;
    }

    return points.filter(point => {
      const [lng, lat] = point.coordinate;
      return GeoUtils.isPointInGeoJSON(lng, lat, geoData);
    });
  }
}
