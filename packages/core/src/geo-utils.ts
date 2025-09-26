import type { GeoData, GeoConfig } from '@orch-map/types';

/**
 * Geo 组件工具类
 * 提供常用的地图操作和数据处理功能
 */
export class GeoUtils {
  /**
   * 计算地理边界框
   */
  public static calculateBounds(data: GeoData[]): {
    minLng: number;
    maxLng: number;
    minLat: number;
    maxLat: number;
  } {
    if (data.length === 0) {
      return { minLng: 0, maxLng: 0, minLat: 0, maxLat: 0 };
    }

    let minLng = data[0].value[0];
    let maxLng = data[0].value[0];
    let minLat = data[0].value[1];
    let maxLat = data[0].value[1];

    data.forEach(item => {
      const [lng, lat] = item.value;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    return { minLng, maxLng, minLat, maxLat };
  }

  /**
   * 计算地理中心点
   */
  public static calculateCenter(data: GeoData[]): [number, number] {
    if (data.length === 0) {
      return [0, 0];
    }

    const bounds = this.calculateBounds(data);
    const centerLng = (bounds.minLng + bounds.maxLng) / 2;
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;

    return [centerLng, centerLat];
  }

  /**
   * 计算合适的缩放级别
   */
  public static calculateZoom(data: GeoData[], containerSize: { width: number; height: number }): number {
    if (data.length === 0) {
      return 1;
    }

    const bounds = this.calculateBounds(data);
    const lngDiff = bounds.maxLng - bounds.minLng;
    const latDiff = bounds.maxLat - bounds.minLat;
    
    const maxDiff = Math.max(lngDiff, latDiff);
    
    // 简单的缩放计算，可以根据需要调整
    if (maxDiff > 50) return 1;
    if (maxDiff > 20) return 2;
    if (maxDiff > 10) return 3;
    if (maxDiff > 5) return 4;
    if (maxDiff > 2) return 5;
    if (maxDiff > 1) return 6;
    if (maxDiff > 0.5) return 7;
    if (maxDiff > 0.2) return 8;
    if (maxDiff > 0.1) return 9;
    return 10;
  }

  /**
   * 根据数据自动配置 Geo
   */
  public static autoConfigGeo(data: GeoData[], containerSize: { width: number; height: number }): Partial<GeoConfig> {
    const center = this.calculateCenter(data);
    const zoom = this.calculateZoom(data, containerSize);

    return {
      center,
      zoom
    };
  }

  /**
   * 数据过滤 - 按数值范围
   */
  public static filterByValue(data: GeoData[], minValue: number, maxValue: number): GeoData[] {
    return data.filter(item => {
      const value = item.value[2];
      return value >= minValue && value <= maxValue;
    });
  }

  /**
   * 数据过滤 - 按地理范围
   */
  public static filterByBounds(
    data: GeoData[], 
    bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number }
  ): GeoData[] {
    return data.filter(item => {
      const [lng, lat] = item.value;
      return lng >= bounds.minLng && lng <= bounds.maxLng &&
             lat >= bounds.minLat && lat <= bounds.maxLat;
    });
  }

  /**
   * 数据排序 - 按数值
   */
  public static sortByValue(data: GeoData[], ascending: boolean = true): GeoData[] {
    return [...data].sort((a, b) => {
      const valueA = a.value[2];
      const valueB = b.value[2];
      return ascending ? valueA - valueB : valueB - valueA;
    });
  }

  /**
   * 数据排序 - 按距离中心点的距离
   */
  public static sortByDistance(data: GeoData[], center: [number, number], ascending: boolean = true): GeoData[] {
    return [...data].sort((a, b) => {
      const distanceA = this.calculateDistance(a.value, center);
      const distanceB = this.calculateDistance(b.value, center);
      return ascending ? distanceA - distanceB : distanceB - distanceA;
    });
  }

  /**
   * 计算两点间距离（简单欧几里得距离）
   */
  public static calculateDistance(point1: [number, number, number], point2: [number, number]): number {
    const dx = point1[0] - point2[0];
    const dy = point1[1] - point2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 数据聚合 - 按区域
   */
  public static aggregateByRegion(data: GeoData[], regionKey: string): Record<string, GeoData[]> {
    const result: Record<string, GeoData[]> = {};
    
    data.forEach(item => {
      const region = (item as any)[regionKey] || 'unknown';
      if (!result[region]) {
        result[region] = [];
      }
      result[region].push(item);
    });

    return result;
  }

  /**
   * 生成颜色映射
   */
  public static generateColorMap(data: GeoData[], colorScheme: string[] = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57']): Map<number, string> {
    const values = data.map(item => item.value[2]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;

    const colorMap = new Map<number, string>();
    
    data.forEach(item => {
      const value = item.value[2];
      const normalizedValue = (value - minValue) / valueRange;
      const colorIndex = Math.floor(normalizedValue * (colorScheme.length - 1));
      const color = colorScheme[colorIndex] || colorScheme[0];
      colorMap.set(value, color);
    });

    return colorMap;
  }
}
