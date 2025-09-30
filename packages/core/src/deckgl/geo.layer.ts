/**
 * 模块：Geo 基础图层
 * 说明：提供一个空数据的 GeoJsonLayer 构造器，便于初始化占位，避免空图层导致的渲染空指针问题。
 */

import { GeoJsonLayer } from "@deck.gl/layers"
import { DEFAULT_GEO_LAYER_PROPS } from "./glMap.const"

export default class GeoLayer {
  /**
   * 创建一个空数据的 GeoJsonLayer
   */
  public static create() {
    return new GeoJsonLayer({
      ...DEFAULT_GEO_LAYER_PROPS,
      id: "geojson-layer",
      data: [],
    })
  }
}
