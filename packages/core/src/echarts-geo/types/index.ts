import type { AnyObj, MapLevel } from "@orch-map/types";
import type { FeatureCollection } from "geojson";
import type { PointParam } from "./node.type";

export * from "./line.type";
export * from "./node.type";

/**
 * ECharts 地图事件接口
 * @template T - 点数据的业务信息类型
 */
export interface EchartsMapEvents<T = unknown> {
  /** 鼠标悬停在点上时触发 */
  onHoverPoint?: (params: PointParam<T>) => void
  /** 点击点时触发 */
  onClickPoint?: (params: PointParam<T>) => void
  /** 点击区域时触发 */
  onClickArea?: (params?: GEOParam) => void
  /** 双击区域时触发（用于地图层级切换） */
  onDoubleClickArea?: (nextLevel: MapLevel, params: GEOParam) => void
  /** 鼠标悬停在区域上时触发 */
  onHoverArea?: (params?: GEOParam, pointsInRegion?: string[]) => void
  /** 地理数据更新时触发 */
  onUpdateGeo?: (params: FeatureCollection) => void
  /** 地图缩放时触发 */
  onZoom?: (zoom: number) => void
}

/**
 * 地理数据接口
 */
export interface GeoData {
  /** 地图ID */
  mapId: string
  /** 地图名称 */
  mapName: string
  /** 地图层级 */
  level: MapLevel
}

/**
 * 地理事件参数接口
 */
export interface GEOParam {
  /** 区域名称 */
  name: string
  /** 组件类型 */
  componentType: "geo"
  /** 事件对象 */
  event: {
    event: AnyObj
  }
  /** 地理组件索引 */
  geoIndex: number
  /**
   * 区域信息
   *
   * 这里的 region 扒了一下 eCharts 4.5 的源码，发现在地图上点击的时候，会有一个 region 的信息
   * 但是 region 里面只有一个 name 信息，这样的话，我们没法从 region 里面获取到 postcode 的信息
   * 然而在使用的过程中，我们要 postcode 的，因为只有 postcode 才能拿到对应的详细地图信息
   * 所以我们这里追加一个 postcode 的信息，然后在使用的时候，在geoChart中对 GEOParam 进行处理 让其返回的时候带上 postcode
   * 这样对于使用的地方就可以直接获取到 postcode 信息了
   * 注意这个 postcode 不一定是省市区的 postcode，可能是国家的简称
   */
  region: {
    /** 区域名称 */
    name: string
    /** 行政区划代码或国家简称 */
    postcode?: string
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
