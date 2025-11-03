/**
 * 模块：2D 线图层管理器
 * 说明：负责 2D 模式下的曲线路径渲染和图层管理
 * 设计：
 * - 依赖 `CurvatureCalculator` 计算每条线的曲率；
 * - 使用二次贝塞尔曲线在地理坐标空间生成曲线点；
 * - 常驻曲线使用 PathLayer，尾迹使用 ScatterplotLayer；
 * - 所有动画点同步按统一进度推进，避免交错时序；
 * - 支持 buddy 双向连线：为每条线生成镜像线（起终点互换），实现双向流动效果。
 * - 完全独立的 2D 模式管理逻辑，包含时间管理和配置
 */
import type { BaseMapLine } from "@orch-map/types";
import CurvatureCalculator from "../../utils/curvatureCalculator";
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import { LayerId } from "./types";

// 默认连接线颜色（回退）
const DEFAULT_LINE_RGBA: [number, number, number, number] = [170, 170, 170, 90];
// 默认移动点颜色（回退，alpha 在尾迹中会被覆盖）
const DEFAULT_DOT_RGB: [number, number, number] = [255, 255, 255];

/**
 * 2D 尾迹点数据结构
 */
export interface DotPoint {
  /** 小圆点在地理坐标中的位置 [lng, lat] */
  position: [number, number]
  /** 小圆点填充颜色，RGBA（0-255），用于实现由深到浅的尾迹渐变 */
  color: [number, number, number, number]
  /** 小圆点半径（像素），用于实现由大到小的尾迹渐变 */
  radius: number
}
/**
 * 2D 常驻曲线路数据结构
 */
export interface FullPath {
  /** 曲线的离散采样点数组，单位为地理坐标（经纬度） */
  path: [number, number][]
  /** 曲线颜色，RGBA（0-255） */
  color: [number, number, number, number]
  /** 曲线宽度（像素） */
  width: number
}

/**
 * 2D 线图层动画配置
 */
export interface Line2DAnimationConfig {
  /** 每 tick 前进的"秒数"（逻辑时间） */
  animationSpeed?: number;
  /** 可见尾迹长度（逻辑时间） */
  trailLength?: number;
  /** 时间循环区间（逻辑时间），默认 6 小时 */
  timeLoop?: number;
  /** 尾迹外观参数 */
  trailOptions?: {
    dotsPerLine?: number;
    headRadius?: number;
    tailRadius?: number;
    headAlpha?: number;
    tailAlpha?: number;
    trailSpan?: number;
  };
}

/**
 * 工具函数：根据起终点与曲率生成二次贝塞尔曲线路径
 * @param start 起点经纬度 [lng, lat]
 * @param end 终点经纬度 [lng, lat]
 * @param curvature 曲率（0~1）；值越大弯曲越明显
 * @param segments 采样点数量；更大更平滑，性能成本更高，默认 64
 * @returns 采样后的路径坐标点数组（经纬度）
 */
export function buildQuadraticBezierPath(
  start: [number, number],
  end: [number, number],
  curvature: number,
  segments = 64,
): [number, number][] {
  const [sx, sy] = start;
  const [ex, ey] = end;
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  const dx = ex - sx;
  const dy = ey - sy;
  const length = Math.hypot(dx, dy) || 1;
  // 垂直方向单位向量
  const nx = -dy / length;
  const ny = dx / length;
  // 控制点偏移（系数 0.3 约束弯曲强度，可外部调优）
  const offset = curvature * 0.3 * length;
  const cx = mx + nx * offset;
  const cy = my + ny * offset;

  const path: [number, number][] = [];
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
 * 2D 线图层管理器（静态工具类）
 * 包含渲染器和管理器的所有功能
 */
export class Line2DManager {
  /** 曲率计算器实例（用于 2D 模式） */
  private static curvatureCalculator: CurvatureCalculator = new CurvatureCalculator();

  /** 默认动画配置 */
  private static readonly DEFAULT_CONFIG: Required<Line2DAnimationConfig> = {
    animationSpeed: 60,
    trailLength: 1000,
    timeLoop: 6 * 60 * 60,
    trailOptions: {
      dotsPerLine: 12,
      headRadius: 1,
      tailRadius: 0.5,
      headAlpha: 255,
      tailAlpha: 60,
      trailSpan: 0.01,
    },
  };

  // ==================== 曲率计算器管理 ====================

  /**
   * 获取当前曲率计算器实例
   */
  public static getCurvatureCalculator(): CurvatureCalculator {
    return Line2DManager.curvatureCalculator;
  }

  /**
   * 重置曲率计算器（用于清理缓存）
   */
  public static resetCurvatureCalculator(): void {
    Line2DManager.curvatureCalculator = new CurvatureCalculator();
  }

  // ==================== 渲染器方法 ====================

  /**
   * 创建常驻曲线图层（PathLayer）
   * 实现 buddy 双向连线：为每条线生成原始线（起点→终点）和 buddy 镜像线（终点→起点）
   * @param lines 业务线数据数组；每条线包含起终点经纬度
   * @returns PathLayer 实例（包含所有曲线及其 buddy 线，禁用拾取）
   */
  public static buildFullCurveLayer(lines: BaseMapLine[]) {
    const fullData: FullPath[] = [];

    // 为每条线生成原始线和 buddy 镜像线
    lines.forEach(line => {
      const curvature = Line2DManager.curvatureCalculator.calculateCurvatureByCoordinates(
        line.id,
        line.startCoordinate,
        line.endCoordinate,
        { min: 0.5, max: 1 },
      );
      const color = (line.color ?? DEFAULT_LINE_RGBA) as [number, number, number, number];

      // 原始线（起点 -> 终点）
      const path = buildQuadraticBezierPath(line.startCoordinate, line.endCoordinate, curvature, 64);
      fullData.push({ path, color, width: 0.3 });

      // Buddy 线（终点 -> 起点，镜像方向）
      const buddyPath = buildQuadraticBezierPath(line.endCoordinate, line.startCoordinate, curvature, 64);
      fullData.push({ path: buddyPath, color, width: 0.3 });
    });

    return new PathLayer({
      id: LayerId.LINE_LAYER,
      data: fullData,
      pickable: false,
      widthScale: 1,
      widthMinPixels: 0.5,
      getPath: (d: FullPath) => d.path,
      getColor: (d: FullPath) => d.color,
      getWidth: (d: FullPath) => d.width,
      // 启用虚线以降低视觉重量
      dashJustified: true,
      parameters: { cullMode: "none" },
    });
  }

  /**
   * 创建同步移动的多圆点尾迹图层（ScatterplotLayer）
   * 实现 buddy 双向连线：为每条线生成原始尾迹和 buddy 镜像尾迹，实现双向流动效果
   * @param lines 业务线数据数组；每条线包含起终点经纬度
   * @param progress 动画归一化进度 [0, 1)；所有线条共享进度，实现同步动画
   * @param options 尾迹外观参数（可选）
   * @returns ScatterplotLayer 实例（尾迹小圆点）
   */
  public static buildMovingDotsLayer(
    lines: BaseMapLine[],
    progress: number,
    options?: {
      dotsPerLine?: number
      headRadius?: number
      tailRadius?: number
      headAlpha?: number
      tailAlpha?: number
      trailSpan?: number
    },
  ) {
    const dots: DotPoint[] = [];
    const dotsPerLine = options?.dotsPerLine ?? 12;
    const headRadius = options?.headRadius ?? 1;
    const tailRadius = options?.tailRadius ?? 0.5;
    const headAlpha = options?.headAlpha ?? 255;
    const tailAlpha = options?.tailAlpha ?? 60;
    const trailSpan = options?.trailSpan ?? 0.01;
    const step = trailSpan / Math.max(1, dotsPerLine - 1);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const curvature = Line2DManager.curvatureCalculator.calculateCurvatureByCoordinates(
        line.id,
        line.startCoordinate,
        line.endCoordinate,
      );

      const baseRgb: [number, number, number] = Array.isArray(line.color)
        ? [line.color[0] ?? DEFAULT_DOT_RGB[0],
          line.color[1] ?? DEFAULT_DOT_RGB[1],
          line.color[2] ?? DEFAULT_DOT_RGB[2]]
        : DEFAULT_DOT_RGB;

      // 生成原始线的尾迹点（起点 -> 终点）
      const generateDots = (start: [number, number], end: [number, number]) => {
        const sx = start[0];
        const sy = start[1];
        const ex = end[0];
        const ey = end[1];
        const mx = (sx + ex) / 2;
        const my = (sy + ey) / 2;
        const dx = ex - sx;
        const dy = ey - sy;
        const length = Math.hypot(dx, dy) || 1;
        const nx = -dy / length;
        const ny = dx / length;
        const offset = curvature * 0.3 * length;
        const cx = mx + nx * offset;
        const cy = my + ny * offset;

        for (let j = 0; j < dotsPerLine; j++) {
          const w = 1 - j / Math.max(1, dotsPerLine - 1); // 头部权重 1 -> 尾部 0
          const tRaw = progress - j * step;
          const t = ((tRaw % 1) + 1) % 1; // wrap 到 [0,1)
          const oneMinusT = 1 - t;
          const px = oneMinusT * oneMinusT * sx + 2 * oneMinusT * t * cx + t * t * ex;
          const py = oneMinusT * oneMinusT * sy + 2 * oneMinusT * t * cy + t * t * ey;
          const radius = Math.round(tailRadius + (headRadius - tailRadius) * w);
          const alpha = Math.round(tailAlpha + (headAlpha - tailAlpha) * Math.pow(w, 1.5));
          dots.push({ position: [px, py], color: [baseRgb[0], baseRgb[1], baseRgb[2], alpha], radius });
        }
      };

      // 生成原始线的尾迹点
      generateDots(line.startCoordinate, line.endCoordinate);

      // 生成 buddy 线的尾迹点（终点 -> 起点）
      generateDots(line.endCoordinate, line.startCoordinate);
    }

    return new ScatterplotLayer({
      id: LayerId.LINE_TRAIL_LAYER,
      data: dots,
      pickable: false,
      radiusUnits: "pixels",
      radiusMinPixels: tailRadius,
      radiusMaxPixels: headRadius + 2,
      getPosition: (d: DotPoint) => d.position,
      getFillColor: (d: DotPoint) => d.color,
      getRadius: (d: DotPoint) => d.radius,
      parameters: { cullMode: "none" },
    });
  }

  // ==================== 管理器方法 ====================

  /**
   * 构造 2D 线图层（常驻曲线 + 移动尾迹）
   * @param lines 线数据数组
   * @param config 动画配置
   * @param currentTime 当前动画时间（可选，默认从外部获取）
   * @returns 图层数组，包含常驻曲线图层和移动尾迹图层
   */
  public static createLayers(
    lines: BaseMapLine[],
    config: Line2DAnimationConfig = {},
    currentTime?: number,
  ): [PathLayer, ScatterplotLayer] {
    const mergedConfig = { ...Line2DManager.DEFAULT_CONFIG, ...config };

    // 构建常驻曲线图层
    const baseLayer = Line2DManager.buildFullCurveLayer(lines);

    // 计算当前进度并构建移动尾迹图层
    const time = currentTime ?? 0;
    const progress = time / mergedConfig.timeLoop;
    const dotsLayer = Line2DManager.buildMovingDotsLayer(lines, progress, mergedConfig.trailOptions);

    return [baseLayer, dotsLayer];
  }


  /**
   * 获取需要清理的 2D 线图层 ID 列表
   * @returns 图层 ID 数组
   */
  public static getLayerIdsToRemove(): string[] {
    return [LayerId.LINE_LAYER, LayerId.LINE_TRAIL_LAYER];
  }
}

