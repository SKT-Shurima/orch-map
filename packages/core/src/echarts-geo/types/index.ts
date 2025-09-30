import { type AnyObj, type MapLevel } from "@orch-map/types"

export * from "./line.type"
export * from "./node.type"

import { type PointParam } from "./node.type"
import { FeatureCollection } from "geojson"

export interface EchartsMapEvents<T> {
  onHoverPoint?: (params: PointParam<T>) => void
  onClickPoint?: (params: PointParam<T>) => void
  onClickArea?: (params?: GEOParam) => void
  onDoubleClickArea?: (nextLevel: MapLevel, params: GEOParam) => void
  onHoverArea?: (params?: GEOParam, pointsInRegion?: string[]) => void
  onUpdateGeo?: (params: FeatureCollection) => void
  onZoom?: (zoom: number) => void
}

export interface GeoData {
  mapId: string
  mapName: string
  level: MapLevel
}

export interface GEOParam {
  name: string
  componentType: "geo"
  event: {
    event: AnyObj
  }
  geoIndex: number
  // 这里的 region 扒了一下 eCharts 4.5  的源码，发现在地图上点击的时候，会有一个 region 的信息
  // 但是 region 里面只有一个 name 信息，这样的话，我们没法从 region 里面获取到 adcode 的信息
  // 然而在使用的过程中，我们要 adcode 的，因为只有 adcode 才能拿到对应的详细地图信息
  // 所以我们这里追加一个 adcode 的信息，然后在使用的时候，在geoChart中对 GEOParam 进行处理 让其返回的时候带上 adcode
  // 这样对于使用的地方就可以直接获取到 adcode 信息了
  // 注意这个 adcode 不一定是省市区的 adcode，可能是国家的 简称
  region: {
    name: string
    adcode?: string
  }
}

/**
 * @description: 前端维护的国家列表信息
 */
export interface CountryItemInfo {
  code: string
  name: string
  zhName: string
}
