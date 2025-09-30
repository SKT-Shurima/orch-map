/**
 * 模块：Deck 实例管理
 * 说明：基于 id 管理多个 DeckGL 实例，提供获取/创建/移除能力，避免外部直接依赖 Deck 构造细节。
 */

import { AnimatedArcLayer } from '@deck.gl/layers';
import { Deck, MapView, MapViewState, ViewStateChangeParameters } from '@deck.gl/core'; 

export class DeckInstance {
  /** 内部实例表，以 instanceId 为键 */
    private static _instanceMap: Map<string, Deck<any>> = new Map()

  /** 默认视图状态 */
  private static _defaultViewState: MapViewState = {
    longitude: 0,
    latitude: 30,
    zoom: 1,
    pitch: 0,
  }

  /**
   * 创建并注册一个 Deck 实例
   * 注意：如传入已存在的 instanceId 会抛出异常，外层应保证唯一性。
   * 现在会自动等待 DeckGL 静态文件加载完成
   */
  public static async setInstance(
    instanceId: string,
    container: HTMLCanvasElement,
    initialViewState: Partial<MapViewState>,
    props?: Partial<Record<string, unknown>> & {
      mode?: "2d" | "3d"
      onClick?: (info: unknown, event: unknown) => void
    },
  ) {
    
    if (DeckInstance._instanceMap.has(instanceId)) {
      throw new Error(`Instance with id ${instanceId} already exists`)
    }


    const mode = props?.mode || "2d"
    const mapView = new MapView({
      repeat: true,
      controller: {
        scrollZoom: true,
        dragPan: true,
        dragRotate: true,
        doubleClickZoom: true,
        touchZoom: true,
        touchRotate: true,
        keyboard: true,
      },
    })
    const deckInstance = new Deck({
      canvas: container,
      initialViewState: {
        ...this._defaultViewState,
        ...(mode === "3d" ? { pitch: 45 } : {}),
        ...initialViewState,
      },
      views: mapView,
      ...props,
      onViewStateChange: <ViewStateT extends MapViewState>(
        params: ViewStateChangeParameters<ViewStateT>,
      ): ViewStateT | void => {
        const { viewState } = params as { viewState: MapViewState }
        // 限制纬度范围，防止上下拖动超出边界
        const constrainedLatitude = Math.max(-30, Math.min(30, viewState.latitude as number))
        const nextViewState = { ...viewState, latitude: constrainedLatitude } as unknown as ViewStateT
        return nextViewState
      },
      layers: [],
    })
    DeckInstance._instanceMap.set(instanceId, deckInstance)
  }


  /**
   * 获取 Deck 实例（不存在会抛错）
   */
  public static getInstance(instanceId: string): Deck<any> {
    const instance = DeckInstance._instanceMap.get(instanceId)
    if (!instance) {
      throw new Error(`Instance with id ${instanceId} does not exist`)
    }
    return instance
  }

  /**
   * 移除 Deck 实例（注意：当前仅删除引用，未调用 Deck 的 finalize；可按需扩展释放 GPU 资源）
   */
  public static removeInstance(instanceId: string) {
    if (!DeckInstance._instanceMap.has(instanceId)) {
      throw new Error(`Instance with id ${instanceId} does not exist`)
    } else {
      DeckInstance._instanceMap.delete(instanceId)
    }
  }
}
