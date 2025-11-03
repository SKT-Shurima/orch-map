import { MapLevel, type GeoJSON } from "@orch-map/types";
import MapStateManager from "../MapStateManager";

/**
 * GeoJSON 边界信息
 */
interface GeoBounds {
  left: number; // 最小经度
  right: number; // 最大经度
  top: number; // 最大纬度
  bottom: number; // 南纬度
  width: number; // 经度范围
  height: number; // 纬度范围
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
   * 从 GeoJSON 获取边界信息
   * @param geoJson GeoJSON 数据
   * @returns 边界信息，如果无法计算则返回 null
   */
  private static getBoundsFromGeoJSON(geoJson: GeoJSON): GeoBounds | null {
    if (!geoJson?.type || geoJson.type !== "FeatureCollection" || !geoJson.features?.length) {
      return null;
    }

    const coordinateList = this.getAllCoordinates(geoJson);
    if (coordinateList.length === 0) {
      return null;
    }

    const flattenedCoords = EchartGeoUtils.flattenCoordinate(coordinateList);
    if (flattenedCoords.length === 0) {
      return null;
    }

    const lngList = flattenedCoords.map(item => item[0]);
    const latList = flattenedCoords.map(item => item[1]);

    const left = Math.min(...lngList);
    const right = Math.max(...lngList);
    const bottom = Math.min(...latList);
    const top = Math.max(...latList);

    return {
      left,
      right,
      top,
      bottom,
      width: right - left,
      height: top - bottom,
    };
  }

  /**
   * 计算地图的中心点和缩放比例
   * - 对于世界地图：根据边界计算能够铺满整个可视区域的缩放比例
   * - 对于其他地图：zoom 置为 1，地图中心不需要处理
   *
   * 新的计算算法：
   * ECharts geo 组件的 zoom 参数是相对于基准大小的缩放倍数。
   * 在 zoom=1 时，ECharts 会根据 layoutSize (90%) 自动计算地图大小。
   *
   * 算法思路：
   * 1. 计算在 zoom=1 时，地图边界对应的像素尺寸
   * 2. 根据可用容器大小和地图像素尺寸的比值计算 zoom
   *
   * @param geoJson GeoJSON 数据
   * @param containerWidth 容器宽度（像素）
   * @param containerHeight 容器高度（像素）
   * @param center 可选的中心点配置 { lat, lng }，如果提供则优先使用
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
    center?: { lat: number; lng: number },
  ): { center: [number, number] | null; zoom: number } {
    // 判断是否为世界地图
    const isWorldMap = MapStateManager.curLevel === MapLevel.WORLD;

    // 计算边界信息（无论是否提供了 center，都需要用于计算 zoom）
    const mapBounds = EchartGeoUtils.getBoundsFromGeoJSON(geoJson);

    // 如果提供了 center 配置，优先使用（无论是世界地图还是其他地图）
    if (center) {
      // 仍然计算合适的 zoom 级别
      let zoom = 1;
      if (isWorldMap && mapBounds) {
        // 世界地图需要计算合适的缩放比例
        const layoutSizeRatio = 0.9;
        const padding = 0.95;
        const availableWidth = containerWidth * layoutSizeRatio * padding;
        const availableHeight = containerHeight * layoutSizeRatio * padding;
        const baseZoomCoefficient = 0.5;
        const geoAspectRatio = mapBounds.width / mapBounds.height;
        const containerAspectRatio = availableWidth / availableHeight;

        if (geoAspectRatio > containerAspectRatio) {
          const pixelsAtZoom1 = containerWidth * layoutSizeRatio * baseZoomCoefficient * (mapBounds.width / 360);
          zoom = availableWidth / pixelsAtZoom1;
        } else {
          const pixelsAtZoom1 = containerHeight * layoutSizeRatio * baseZoomCoefficient * (mapBounds.height / 180);
          zoom = availableHeight / pixelsAtZoom1;
        }
      }
      return {
        center: [center.lng, center.lat],
        zoom,
      };
    }

    if (!isWorldMap) {
      // 非世界地图：zoom 置为 1，地图中心不需要处理（使用自动计算）
      return {
        center: null,
        zoom: 1,
      };
    }

    // 世界地图：计算能够铺满整个可视区域的缩放比例
    if (!mapBounds) {
      return {
        center: null,
        zoom: 1,
      };
    }

    // layoutSize = "90%"，实际可用空间为容器的 90%
    const layoutSizeRatio = 0.9;
    // 留出一些边距（约 5%）
    const padding = 0.95;
    const availableWidth = containerWidth * layoutSizeRatio * padding;
    const availableHeight = containerHeight * layoutSizeRatio * padding;

    // ECharts geo 在 zoom=1 时的基准映射关系
    // 当 zoom=1 且 layoutSize="90%" 时：
    // - 整个世界地图（360度经度）会映射到 layoutSize * 容器宽度 * 某个系数
    // - 这个系数表示在 zoom=1 时，世界地图相对于 layoutSize 的尺寸比例
    //
    // 根据实际观察和测试，zoom=1 时，360度经度约对应 layoutSize * 容器宽度 * 0.5
    const baseZoomCoefficient = 0.5;

    // 计算地图宽高比和容器宽高比
    const geoAspectRatio = mapBounds.width / mapBounds.height;
    const containerAspectRatio = availableWidth / availableHeight;

    let zoom: number;

    if (geoAspectRatio > containerAspectRatio) {
      // 地图更宽，以宽度为准
      // 在 zoom=1 时，mapBounds.width 度经度对应的像素：
      // pixelsAtZoom1 = containerWidth * layoutSizeRatio * baseZoomCoefficient * (mapBounds.width / 360)
      //
      // 我们需要的像素：availableWidth
      // 所以：zoom = availableWidth / pixelsAtZoom1
      const pixelsAtZoom1 = containerWidth * layoutSizeRatio * baseZoomCoefficient * (mapBounds.width / 360);
      zoom = availableWidth / pixelsAtZoom1;
    } else {
      // 地图更高，以高度为准
      // 在 zoom=1 时，mapBounds.height 度纬度对应的像素：
      // pixelsAtZoom1 = containerHeight * layoutSizeRatio * baseZoomCoefficient * (mapBounds.height / 180)
      const pixelsAtZoom1 = containerHeight * layoutSizeRatio * baseZoomCoefficient * (mapBounds.height / 180);
      zoom = availableHeight / pixelsAtZoom1;
    }

    // 计算中心点（使用边界中心）
    const centerPoint: [number, number] = [
      (mapBounds.left + mapBounds.right) / 2,
      (mapBounds.top + mapBounds.bottom) / 2,
    ];

    return {
      center: centerPoint,
      zoom,
    };
  }
}
