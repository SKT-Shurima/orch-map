import type { Coordinate } from "@orch-map/types";

/**
 * 基础线条接口
 */
export interface BaseLine {
  /** 线条唯一标识 */
  id: string
  /** 起点行政区划代码 */
  startPostcode: string
  /** 终点行政区划代码 */
  endPostcode: string
  /** 起点坐标 */
  startCoordinate: Coordinate
  /** 终点坐标 */
  endCoordinate: Coordinate
}

/**
 * 线条数据数组类型
 * @template T - 继承自 BaseLine 的线条类型
 */
export type LineData<T extends BaseLine> = T[]

/**
 * 线条特效配置接口
 */
interface Effect {
  /** 是否显示特效 */
  show: boolean
  /** 特效动画周期 */
  period: number
  /** 特效尾迹长度 */
  trailLength: number
  /** 特效符号 */
  symbol: string
  /** 特效符号大小 */
  symbolSize: number
}

/**
 * 线条样式配置接口
 */
interface LineStyle {
  /** 线条颜色 */
  color: string
  /** 线条宽度 */
  width: number
  /** 线条透明度 */
  opacity: number
  /** 线条曲度 */
  curveness: number
}

/**
 * 线条系列数据项类型
 * @template T - 线条数据类型
 */
export type LineSeriesDataItem<T = unknown> = T & {
  /** 线条坐标点数组 */
  coords: [number, number][]
  /** 线条样式 */
  lineStyle: LineStyle
}

/**
 * 线条系列配置接口
 * @template T - 线条数据类型
 */
export interface LineSeries<T = unknown> {
  /** 系列名称 */
  name: string
  /** 系列类型 */
  type: string
  /** 层级 */
  zlevel: number
  /** 是否开启动画 */
  animation: boolean
  /** 特效配置 */
  effect: Effect
  /** 坐标系类型 */
  coordinateSystem: string
  /** 地理组件索引 */
  geoIndex: number
  /** 系列数据 */
  data: LineSeriesDataItem<T>[]
  /** 渐进式渲染阈值 */
  progressiveThreshold: number
  /** 渐进式渲染分片数 */
  progressive: number
}
