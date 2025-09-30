import { type Coordinate } from "@orch-map/types"

export interface BaseLine {
  id: string
  startAdCode: string
  endAdCode: string
  startCoordinate: Coordinate
  endCoordinate: Coordinate
}

export type LineData<T extends BaseLine> = T[]

interface Effect {
  show: boolean
  period: number
  trailLength: number
  symbol: string
  symbolSize: number
}

interface LineStyle {
  color: string
  width: number
  opacity: number
  curveness: number
}

export type LineSeriesDataItem<T> = T & {
  coords: [number, number][]
  lineStyle: LineStyle
}

export interface LineSeries<T> {
  name: string
  type: string
  zlevel: number
  animation: boolean
  effect: Effect
  coordinateSystem: string
  geoIndex: number
  data: LineSeriesDataItem<T>[]
  progressiveThreshold: number
  progressive: number
}
