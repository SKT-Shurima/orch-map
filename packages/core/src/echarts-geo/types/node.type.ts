import { type AnyObj } from "@orch-map/types"

/**
 * @description: Series 中的点的基本信息
 * 用于渲染数据列的时候，每个点所必备的信息
 */
export interface PointSeriesDataItem<T> {
  name: string
  value: [number, number]
  businessInfo?: T
  graphInfo?: AnyObj
  // Explicit v5 option fields used across adapters
  symbol?: string
  symbolSize?: number | [number, number]
  itemStyle?: AnyObj
  label?: AnyObj
  tooltip?: AnyObj
}

export enum PointTypeEnum {
  SCATTER = "scatter",
  EFFECT_SCATTER = "effectScatter",
}

/**
 * @description: 散点图的数据列信息
 */
export interface PointSeries<T> {
  name?: string
  type?: "scatter"
  data: PointSeriesDataItem<T>[]
}

/**
 * @description: 点击或者hover的散点图的信息
 */
export interface PointParam<T> {
  name: string
  componentType: "series"
  componentSubType: "scatter"
  seriesName: string
  seriesType: PointTypeEnum
  componentIndex: number
  event: {
    event: AnyObj
  }
  geoIndex: number
  data: PointSeriesDataItem<T>
}
