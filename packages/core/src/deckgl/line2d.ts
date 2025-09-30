/**
 * 模块：2D 线路渲染器
 * 说明：负责 2D 模式下的曲线路径渲染（常驻曲线 + 尾迹小圆点）。
 * 设计：
 * - 依赖 `CurvatureCalculator` 计算每条线的曲率；
 * - 使用二次贝塞尔曲线在地理坐标空间生成曲线点；
 * - 常驻曲线使用 PathLayer，尾迹使用 ScatterplotLayer；
 * - 所有动画点同步按统一进度推进，避免交错时序。
 */
import type { BaseMapLine } from "@orch-map/types"
import type { CurvatureCalculator } from "../utils/curvatureCalculator"
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers"

// 默认连接线颜色（回退）
const DEFAULT_LINE_RGBA: [number, number, number, number] = [170, 170, 170, 90]
// 默认移动点颜色（回退，alpha 在尾迹中会被覆盖）
const DEFAULT_DOT_RGB: [number, number, number] = [255, 255, 255]

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
  const sx = start[0]
  const sy = start[1]
  const ex = end[0]
  const ey = end[1]
  const mx = (sx + ex) / 2
  const my = (sy + ey) / 2
  const dx = ex - sx
  const dy = ey - sy
  const length = Math.hypot(dx, dy) || 1
  // 垂直方向单位向量
  const nx = -dy / length
  const ny = dx / length
  // 控制点偏移（系数 0.3 约束弯曲强度，可外部调优）
  const offset = curvature * 0.3 * length
  const cx = mx + nx * offset
  const cy = my + ny * offset

  const path: [number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const oneMinusT = 1 - t
    const x = oneMinusT * oneMinusT * sx + 2 * oneMinusT * t * cx + t * t * ex
    const y = oneMinusT * oneMinusT * sy + 2 * oneMinusT * t * cy + t * t * ey
    path.push([x, y])
  }
  return path
}

/**
 * 类：LineRenderer2D
 * 说明：封装 2D 曲线渲染与尾迹渲染逻辑，供地图主类组合使用。
 */
export class LineRenderer2D {
  private readonly curvatureCalculator: CurvatureCalculator

  /**
   * @param curvatureCalculator 曲率计算器实例
   */
  public constructor(curvatureCalculator: CurvatureCalculator) {
    this.curvatureCalculator = curvatureCalculator
  }

  /**
   * 创建常驻曲线图层（PathLayer）
   * @param lines 业务线数据数组；每条线包含起终点经纬度
   * @returns PathLayer 实例（包含所有曲线，禁用拾取）
   */
  public buildFullCurveLayer(lines: BaseMapLine[]): any {
    const fullData: FullPath[] = lines.map(line => {
      const curvature = this.curvatureCalculator.calculateCurvatureByCoordinates(
        line.id,
        line.startCoordinate,
        line.endCoordinate,
      )
      const path = buildQuadraticBezierPath(line.startCoordinate, line.endCoordinate, curvature, 64)
      const color = (line.color ?? DEFAULT_LINE_RGBA) as [number, number, number, number]
      return { path, color, width: 0.3 }
    })
    return new PathLayer({
      id: "line-layer",
      data: fullData,
      pickable: false,
      widthScale: 1,
      widthMinPixels: 0.3,
      getPath: (d: FullPath) => d.path,
      getColor: (d: FullPath) => d.color,
      getWidth: (d: FullPath) => d.width,
      // 启用虚线以降低视觉重量
      dashJustified: true,
      parameters: { cullMode: "none" },
    })
  }

  /**
   * 创建同步移动的多圆点尾迹图层（ScatterplotLayer）
   * @param lines 业务线数据数组；每条线包含起终点经纬度
   * @param progress 动画归一化进度 [0, 1)；所有线条共享进度，实现同步动画
   * @param options 尾迹外观参数（可选）
   *
   * 间距说明：
   * - 尾迹点之间的"参数间距"由 step = trailSpan / (dotsPerLine - 1) 决定；
   * - 想更密：增大 dotsPerLine 或减小 trailSpan；想更疏：相反调整。
   *
   * 大小说明：
   * - 点半径沿尾迹从头到尾插值：radius = tailRadius + (headRadius - tailRadius) * w；
   * - headRadius 控制最大半径，tailRadius 控制最小半径。
   * @param options.dotsPerLine 每条线的尾迹圆点数量；越大越密集，默认 12
   * @param options.headRadius 尾迹最前端（头部）圆点半径（像素），默认 3
   * @param options.tailRadius 尾迹末端（尾部）圆点半径（像素），默认 1
   * @param options.headAlpha 尾迹头部圆点透明度（0-255），默认 255
   * @param options.tailAlpha 尾迹尾部圆点透明度（0-255），默认 60
   * @param options.trailSpan 尾迹覆盖曲线参数长度（0~1），控制"队列"长度，默认 0.06
   * @returns ScatterplotLayer 实例（尾迹小圆点）
   */
  public buildMovingDotsLayer(
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
  ): any {
    const dots: DotPoint[] = []
    const dotsPerLine = options?.dotsPerLine ?? 12
    const headRadius = options?.headRadius ?? 1
    const tailRadius = options?.tailRadius ?? 0.5
    const headAlpha = options?.headAlpha ?? 255
    const tailAlpha = options?.tailAlpha ?? 60
    const trailSpan = options?.trailSpan ?? 0.01
    const step = trailSpan / Math.max(1, dotsPerLine - 1)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const curvature = this.curvatureCalculator.calculateCurvatureByCoordinates(
        line.id,
        line.startCoordinate,
        line.endCoordinate,
      )

      // 预计算二次贝塞尔控制点
      const sx = line.startCoordinate[0]
      const sy = line.startCoordinate[1]
      const ex = line.endCoordinate[0]
      const ey = line.endCoordinate[1]
      const mx = (sx + ex) / 2
      const my = (sy + ey) / 2
      const dx = ex - sx
      const dy = ey - sy
      const length = Math.hypot(dx, dy) || 1
      const nx = -dy / length
      const ny = dx / length
      const offset = curvature * 0.3 * length
      const cx = mx + nx * offset
      const cy = my + ny * offset

      const baseRgb: [number, number, number] = Array.isArray(line.color)
        ? [line.color[0] ?? DEFAULT_DOT_RGB[0], line.color[1] ?? DEFAULT_DOT_RGB[1], line.color[2] ?? DEFAULT_DOT_RGB[2]]
        : DEFAULT_DOT_RGB

      for (let j = 0; j < dotsPerLine; j++) {
        const w = 1 - j / Math.max(1, dotsPerLine - 1) // 头部权重 1 -> 尾部 0
        const tRaw = progress - j * step
        const t = ((tRaw % 1) + 1) % 1 // wrap 到 [0,1)
        const oneMinusT = 1 - t
        const px = oneMinusT * oneMinusT * sx + 2 * oneMinusT * t * cx + t * t * ex
        const py = oneMinusT * oneMinusT * sy + 2 * oneMinusT * t * cy + t * t * ey
        const radius = Math.round(tailRadius + (headRadius - tailRadius) * w)
        const alpha = Math.round(tailAlpha + (headAlpha - tailAlpha) * Math.pow(w, 1.5))
        dots.push({ position: [px, py], color: [baseRgb[0], baseRgb[1], baseRgb[2], alpha], radius })
      }
    }

    return new ScatterplotLayer({
      id: "line-trail-layer",
      data: dots,
      pickable: false,
      radiusUnits: "pixels",
      radiusMinPixels: tailRadius,
      radiusMaxPixels: headRadius + 2,
      getPosition: (d: DotPoint) => d.position,
      getFillColor: (d: DotPoint) => d.color,
      getRadius: (d: DotPoint) => d.radius,
      parameters: { cullMode: "none" },
    })
  }
}
