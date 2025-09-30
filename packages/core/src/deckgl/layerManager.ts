/**
 * 模块：图层管理器
 * 说明：集中管理图层的增删改查，降低业务代码直接依赖 Deck 层对象；
 * 注意：当前实现未对返回数组进行空值过滤，外部在 setProps 时需接受 undefined；
 *       可在不改变逻辑的前提下通过注释给出优化建议。
 */
// Layer 类型定义（临时，直到从 DeckGL 库中获取）
export type Layer = any;

export default class MapLayerManager {
  /** 内部存储：layerId -> layer 实例 */
  private static layerMap: Map<string, LayerLike> = new Map()

  /**
   * 新增图层（若已存在则委托为 update）
   */
  public static addLayer(id: string, layer: LayerLike) {
    if (MapLayerManager.layerMap.has(id)) {
      MapLayerManager.updateLayer(id, layer)
      return
    }
    MapLayerManager.layerMap.set(id, layer)
  }

  /**
   * 更新图层：
   * - 若传入 Layer 实例，直接替换（必要时校正 id）；
   * - 若传入 props 片段，基于旧实例构造器重建（浅合并 props）。
   * 性能提示：重建 Layer 实例有一定开销，数据量大时可考虑 updateTriggers 或 attribute 更新。
   */
  public static updateLayer(id: string, layerOrProps: LayerLike | LayerPropsObject) {
    const isLayerInstance = (candidate: unknown): candidate is LayerLike =>
      !!candidate &&
      typeof candidate === "object" &&
      "constructor" in candidate &&
      typeof (candidate as { constructor: unknown }).constructor === "function"

    // 如果该 id 的图层尚不存在
    if (!MapLayerManager.layerMap.has(id)) {
      if (isLayerInstance(layerOrProps)) {
        MapLayerManager.layerMap.set(id, layerOrProps)
      }
      return
    }

    const oldLayer = MapLayerManager.layerMap.get(id) as LayerLike

    // 如果传入的是完整的 Layer 实例，直接替换（必要时重建以确保 id 一致）
    if (isLayerInstance(layerOrProps)) {
      const incomingLayer = layerOrProps
      const incomingProps = incomingLayer.props ?? {}
      const incomingId = (incomingProps as Record<string, unknown>)["id"]
      if (typeof incomingId === "string" && incomingId !== id) {
        const Ctor = (incomingLayer as unknown as { constructor: new (p: LayerPropsObject) => LayerLike }).constructor
        const rebuilt = new Ctor({
          ...incomingProps,
          id,
        })
        MapLayerManager.layerMap.set(id, rebuilt)
      } else {
        MapLayerManager.layerMap.set(id, incomingLayer)
      }
      return
    }

    // 否则视为部分 props，合并旧 props 与新 props 后重建，新 props 覆盖旧值
    const OldCtor = (oldLayer as unknown as { constructor: new (p: LayerPropsObject) => LayerLike }).constructor
    const newLayer = new OldCtor({
      ...(oldLayer.props ?? {}),
      ...(layerOrProps as LayerPropsObject),
      id,
    })
    MapLayerManager.layerMap.set(id, newLayer)
  }

  /**
   * 移除图层
   */
  public static removeLayer(id: string) {
    if (MapLayerManager.layerMap.has(id)) {
      MapLayerManager.layerMap.delete(id)
    }
  }

  /**
   * 以固定顺序返回所有图层实例
   * 风险提示：若对应 id 不存在，返回数组中会包含 undefined。
   * 可选优化（不改变逻辑）：在此处过滤空值，减少每帧渲染时 Deck 对无效项的处理成本。
   */
  public static getLayers() {
    return ["geojson-layer", "point-layer", "line-layer", "line-trail-layer"].map(id => MapLayerManager.layerMap.get(id))
  }
}

/** Layer 实例的最小约束：需可通过构造器以 props 重建，并带有可读 props */
export type LayerPropsObject = Record<string, unknown>

// 使用 deck.gl 的 Layer 类型作为 LayerLike
export type LayerLike = Layer
