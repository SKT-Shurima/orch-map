import type { AnyObj } from "@orch-map/types";

/**
 * Series 中的点的基本信息
 * 用于渲染数据列的时候，每个点所必备的信息
 * @template T - 点数据的业务信息类型
 */
export interface PointSeriesDataItem<T = unknown> {
  /** 点的唯一标识 */
  id: string
  /** 点的名称 */
  name: string
  /** 点的坐标值 [经度, 纬度] */
  value: [number, number]
  /** 业务信息 */
  businessInfo?: T
  /** 图表信息 */
  graphInfo?: AnyObj
  /** 点的符号类型 */
  symbol?: string
  /** 点的符号大小 */
  symbolSize?: number | [number, number]
  /** 点的样式配置 */
  itemStyle?: AnyObj
  /** 点的标签配置 */
  label?: AnyObj
  /** 点的提示框配置 */
  tooltip?: AnyObj
  /** 符号旋转角度 */
  symbolRotate?: number
  /** 点的层级 */
  z?: number
  /** 数据编码配置 */
  encode?: AnyObj
  /** 强调样式 */
  emphasis?: AnyObj
}

/**
 * 点类型枚举
 */
export enum PointTypeEnum {
  /** 散点图 */
  SCATTER = "scatter",
  /** 涟漪特效散点图 */
  EFFECT_SCATTER = "effectScatter",
}

/**
 * 散点图的数据列信息
 * @template T - 点数据的业务信息类型
 */
export interface PointSeries<T = unknown> {
  /** 系列名称 */
  name?: string
  /** 系列类型 */
  type?: "scatter"
  /** 系列数据 */
  data: PointSeriesDataItem<T>[]
}

/**
 * 点击或者hover的散点图的信息
 * @template T - 点数据的业务信息类型
 */
export interface PointParam<T = unknown> {
  /** 点的唯一标识 */
  id: string
  /** 点的名称 */
  name: string
  /** 组件类型 */
  componentType: "series"
  /** 组件子类型 */
  componentSubType: "scatter"
  /** 系列名称 */
  seriesName: string
  /** 系列类型 */
  seriesType: PointTypeEnum
  /** 组件索引 */
  componentIndex: number
  /** 事件对象 */
  event: {
    event: AnyObj
  }
  /** 地理组件索引 */
  geoIndex: number
  /** 点数据 */
  data: PointSeriesDataItem<T>
}
