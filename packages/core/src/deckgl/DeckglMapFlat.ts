/**
 * 模块：DeckGL 平面地图基类
 * 说明：2D 和 2.5D 模式的公共基类（非 Globe 模式）
 */
import { Deck, MapView, MapViewState, ViewStateChangeParameters } from "@deck.gl/core";
import type { MjolnirGestureEvent } from "mjolnir.js";
import { GeoJSON } from "geojson";
import { MapLevel } from "@orch-map/types";
import { IconLayer, TextLayer, LayerId } from "./layers";
import GeoLayer from "./layers/geoLayer";
import MapStateManager from "../MapStateManager";
import { BaseDeckglMap } from "./BaseDeckglMap";

// 类型定义
type LayerLike = any;

/**
 * DeckGL 平面地图基类
 * 说明：2D 和 2.5D 模式的公共基类，包含非 Globe 模式的共享逻辑
 */
export abstract class DeckglMapFlat extends BaseDeckglMap {
  /**
   * 创建并初始化 Deck 实例（2D/2.5D 模式共享）
   */
  protected async createDeckInstance(
    container: HTMLCanvasElement,
    initialViewState: Partial<MapViewState>,
    props?: Partial<Record<string, unknown>> & {
      mode?: "2d" | "2.5d" | "3d"
      onClick?: (info: unknown, event: unknown) => void
      onDblClick?: (info: unknown, event: unknown) => void
    },
  ): Promise<void> {
    if (this.deckInstance) {
      throw new Error(`Deck instance already exists for ${this.instanceId}`);
    }

    const mode = props?.mode ?? "2d";

    // 使用 MapView（2D/2.5D 模式共享）
    const view = new MapView({
      repeat: MapStateManager.curLevel === MapLevel.WORLD,
      controller: {
        scrollZoom: true,
        dragPan: true,
        dragRotate: true,
        doubleClickZoom: false, // 禁用双击放大
        touchZoom: true,
        touchRotate: true,
        keyboard: true,
      },
    });

    // 2D/2.5D 模式不使用光照效果
    const effects: never[] = [];

    this.deckInstance = new Deck({
      canvas: container,
      width: container.parentElement?.clientWidth,
      height: container.parentElement?.clientHeight,
      initialViewState: {
        ...BaseDeckglMap.DEFAULT_VIEW_STATE,
        ...(mode === "2.5d" ? { pitch: 45 } : {}),
        ...initialViewState,
      },
      views: view,
      effects,
      ...props,
      // @ts-ignore - 类型定义不完整，需要支持不同的 ViewState 类型
      onViewStateChange: <ViewStateT extends MapViewState>(
        params: ViewStateChangeParameters<ViewStateT>,
      ): ViewStateT | void => {
        const { viewState } = params as { viewState: MapViewState };

        // 限制纬度范围，防止上下拖动超出北极圈和南极圈边界
        const constrainedLatitude = Math.max(-66.5, Math.min(66.5, viewState.latitude));

        // 限制最小缩放级别，使用第一次加载时计算的比例
        // 如果还没有计算过初始最小缩放比例，则使用默认值 0
        const minZoom = this.initialMinZoom ?? 0;
        const constrainedZoom = Math.max(minZoom, viewState.zoom);

        const nextViewState = {
          ...viewState,
          latitude: constrainedLatitude,
          zoom: constrainedZoom,
        } as unknown as ViewStateT;
        return nextViewState;
      },
      layers: [],
    });
  }

  /**
   * 以固定顺序返回所有图层实例（2D/2.5D 模式共享，无 earth-sphere）
   */
  protected getLayers(): (LayerLike | undefined)[] {
    const layerIds = [
      GeoLayer.getLayerId(),
      IconLayer.getLayerId(),
      LayerId.LINE_LAYER,
      LayerId.LINE_TRAIL_LAYER,
      LayerId.ARC_BASE_LAYER,
      LayerId.ARC_TRAIL_LAYER,
      TextLayer.getLayerId(),
    ];
    const layers = layerIds.map(id => this.layerMap.get(id));
    return layers;
  }

  /**
   * 地图双击处理（2D/2.5D 模式支持下钻功能）
   */
  protected async handleDoubleClickMapView(info: unknown, event: MjolnirGestureEvent) {
    // 取消之前的单击延迟处理
    if (this.clickTimer) {
      clearTimeout(this.clickTimer);
      this.clickTimer = null;
    }

    const pick = info as {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      object?: any;
      layer?: { id?: string };
      coordinate?: [number, number];
    } | null;

    // 阻止事件冒泡
    if (event?.srcEvent) {
      event.srcEvent.stopPropagation();
      event.srcEvent.preventDefault();
    }

    // 如果双击的是 GeoJSON 图层（地图区域）
    if (pick?.object && pick.layer?.id === GeoLayer.getLayerId()) {
      const regionName = pick.object.properties?.name ?? "";

      // 触发双击区域事件回调
      if (this.events?.onAreaDoubleClick) {
        this.events.onAreaDoubleClick(regionName);
      }
    }
  }

  /**
   * 设置国家/省份 GeoJSON 数据并注册基础底图图层（2D/2.5D 模式共享）
   */
  public async setGEOData(geojsonData: GeoJSON) {
    // 创建 GeoJSON 图层（2D/2.5D 模式支持事件）
    const geojsonLayer = GeoLayer.createWithData(geojsonData, this.events);
    this.addLayer(GeoLayer.getLayerId(), geojsonLayer);
    this.updateLayer();

    // 使用 requestAnimationFrame 确保 DOM 更新后再计算视图
    // 这样可以确保容器尺寸已更新，计算出的视图状态更准确
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // 只在第一次初始化时使用 center 配置，后续更新使用自动计算
          const isInitialSetup = !this._hasInitialized;
          this.fitBoundsToGeoData(geojsonData, isInitialSetup);
          this._hasInitialized = true;
          resolve();
        });
      });
    });
  }
}

