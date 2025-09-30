/**
 * 坐标计算工具函数
 */
import { Coordinate, MapConfig } from '@orch-map/types';

/**
 * 坐标工具类
 */
export class CoordinateUtils {
  /**
   * 计算两点之间的距离（米）
   */
  static getDistance(coord1: Coordinate, coord2: Coordinate): number {
    const R = 6371000; // 地球半径（米）
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * 计算两点之间的方位角（度）
   */
  static getBearing(coord1: Coordinate, coord2: Coordinate): number {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);

    return (θ * 180 / Math.PI + 360) % 360;
  }

  /**
   * 计算中点坐标
   */
  static getMidpoint(coord1: Coordinate, coord2: Coordinate): Coordinate {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const Bx = Math.cos(φ2) * Math.cos(Δλ);
    const By = Math.cos(φ2) * Math.sin(Δλ);
    
    const φ3 = Math.atan2(Math.sin(φ1) + Math.sin(φ2), 
                         Math.sqrt((Math.cos(φ1) + Bx) * (Math.cos(φ1) + Bx) + By * By));
    const λ3 = (lon1 * Math.PI / 180) + Math.atan2(By, Math.cos(φ1) + Bx);

    return [λ3 * 180 / Math.PI, φ3 * 180 / Math.PI];
  }

  /**
   * 计算边界框
   */
  static getBounds(coordinates: Coordinate[]): [Coordinate, Coordinate] {
    if (coordinates.length === 0) {
      return [[0, 0], [0, 0]];
    }

    let minLng = coordinates[0][0];
    let maxLng = coordinates[0][0];
    let minLat = coordinates[0][1];
    let maxLat = coordinates[0][1];

    coordinates.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    return [[minLng, minLat], [maxLng, maxLat]];
  }

  /**
   * 计算边界框中心点
   */
  static getBoundsCenter(bounds: [Coordinate, Coordinate]): Coordinate {
    const [[minLng, minLat], [maxLng, maxLat]] = bounds;
    return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
  }

  /**
   * 根据边界框计算合适的缩放级别
   */
  static getZoomFromBounds(
    bounds: [Coordinate, Coordinate],
    containerSize: { width: number; height: number }
  ): number {
    const [[minLng, minLat], [maxLng, maxLat]] = bounds;
    const lngDiff = Math.abs(maxLng - minLng);
    const latDiff = Math.abs(maxLat - minLat);
    
    const lngZoom = Math.log2(360 / lngDiff);
    const latZoom = Math.log2(180 / latDiff);
    
    return Math.min(lngZoom, latZoom, 18); // 最大缩放级别18
  }

  /**
   * 生成二次贝塞尔曲线路径点
   */
  static generateBezierPath(
    start: Coordinate,
    end: Coordinate,
    curvature = 0.3,
    segments = 64
  ): Coordinate[] {
    const [sx, sy] = start;
    const [ex, ey] = end;
    const mx = (sx + ex) / 2;
    const my = (sy + ey) / 2;
    
    // 计算垂直方向的控制点偏移
    const dx = ex - sx;
    const dy = ey - sy;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    
    const offset = curvature * length * 0.3;
    const cx = mx + nx * offset;
    const cy = my + ny * offset;

    const path: Coordinate[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const oneMinusT = 1 - t;
      const x = oneMinusT * oneMinusT * sx + 2 * oneMinusT * t * cx + t * t * ex;
      const y = oneMinusT * oneMinusT * sy + 2 * oneMinusT * t * cy + t * t * ey;
      path.push([x, y]);
    }
    
    return path;
  }

  /**
   * 计算曲率值（基于距离和角度）
   */
  static calculateCurvature(start: Coordinate, end: Coordinate): number {
    const distance = this.getDistance(start, end);
    // 基于距离计算曲率，距离越远曲率越大
    const baseCurvature = Math.min(distance / 1000000, 1); // 最大曲率为1
    return baseCurvature * 0.5; // 适中的曲率值
  }
}

/**
 * 曲率计算器类
 */
export class CurvatureCalculator {
  private curvatureCache: Map<string, number> = new Map();

  /**
   * 根据坐标计算曲率
   */
  calculateCurvatureByCoordinates(
    id: string,
    start: Coordinate,
    end: Coordinate
  ): number {
    if (this.curvatureCache.has(id)) {
      return this.curvatureCache.get(id)!;
    }

    const curvature = CoordinateUtils.calculateCurvature(start, end);
    this.curvatureCache.set(id, curvature);
    return curvature;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.curvatureCache.clear();
  }
}