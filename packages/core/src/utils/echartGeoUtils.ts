import type { GeoJSON } from "@orch-map/types";

/**
 * 根据世界地图宽度(像素)计算对应的缩放级别
 * @param {number} worldWidth - 世界地图宽度，单位是像素
 * @returns {number} 对应的缩放级别(zoom level)
 */
function getZoomLevelFromWorldWidth(worldWidth: number): number {
  // 基本公式: worldWidth = 256 * 2^zoomLevel
  // 因此: zoomLevel = log2(worldWidth / 256)

  const zoomLevel = Math.log2(worldWidth / 256);
  return zoomLevel;
}

/**
 * GeoJSON 数据处理工具类
 * 用于计算 GeoJSON 数据的中心点和在容器中的最佳比例
 */
export default class EchartGeoUtils {

  /**
   * 获取 GeoJSON 中的所有坐标数据
   * @param geoJson GeoJSON 数据
   * @returns 所有坐标数组
   */
  private static getAllCoordinates(geoJson: any): any[] {
    const coordinates: any[] = [];

    if (geoJson.type === "FeatureCollection") {
      geoJson.features.forEach((feature: any) => {
        if (feature.geometry?.coordinates) {
          coordinates.push(feature.geometry.coordinates);
        }
      });
    } else if (geoJson.type === "Feature") {
      if (geoJson.geometry?.coordinates) {
        coordinates.push(geoJson.geometry.coordinates);
      }
    } else if (geoJson.coordinates) {
      coordinates.push(geoJson.coordinates);
    }

    return coordinates;
  }

  /**
   * 将地图坐标扁平化为 [number, number] 数组
   * 处理多层嵌套的坐标数据，转为一维数组
   * @param arr 嵌套的坐标数据
   * @returns 扁平化后的坐标数组
   */
  private static flattenCoordinate(arr: any[]): [number, number][] {
    const result: [number, number][] = [];

    function flatten(item: any) {
      if (Array.isArray(item)) {
        if (Array.isArray(item[0]) || typeof item[0] === "object") {
          item.forEach(flatten);
        } else if (typeof item[0] === "number" && typeof item[1] === "number") {
          result.push(item as [number, number]);
        }
      }
    }

    arr.forEach(flatten);
    return result;
  }

  /**
   * 通过坐标列表计算地图的中心点和缩放比例
   * @param coordinateList 扁平化后的坐标列表
   * @returns 中心点和缩放比例
   */
  public static getCenterAndZoom(
    geoJson: GeoJSON,
    {
      containerWidth,
      containerHeight,
    }: {
      containerWidth: number;
      containerHeight: number;
    },
  ): { center: [number, number] | null; zoom: number } {
    const coordinateList = this.getAllCoordinates(geoJson);
    // 处理空数组情况
    if (coordinateList.length === 0) {
      return {
        center: null,
        zoom: 1,
      };
    }

    // 提取所有经纬度值
    const lngList = EchartGeoUtils.flattenCoordinate(coordinateList).map(item => item[0]);
    const latList = EchartGeoUtils.flattenCoordinate(coordinateList).map(item => item[1]);

    // 计算边界
    const minLng = Math.min(...lngList);
    const maxLng = Math.max(...lngList);
    const minLat = Math.min(...latList);
    const maxLat = Math.max(...latList);

    const lngDelta = Math.abs(maxLng - minLng) || 1; // 避免除以零
    const latDelta = Math.abs(maxLat - minLat) || 1; // 避免除以零

    // 计算像素与经纬度的比例关系
    // const ratio = containerWidth / lngDelta;
    const ratio = getZoomLevelFromWorldWidth(containerWidth);
    const latScale = containerHeight / (latDelta * ratio);
    const lngScale = containerWidth / (lngDelta * ratio);

    // 确保缩放比例不小于 1
    const zoom = Math.min(lngScale, latScale);

    return {
      center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
      zoom,
    };
  }
}
