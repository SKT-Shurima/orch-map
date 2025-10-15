/**
 * 模块：DeckGL 主模块
 * 说明：DeckGL 地图主类，整合了实例管理、图层管理和业务逻辑
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AnimatedArcLayer, GeoJsonLayer } from "@deck.gl/layers";
import { Deck, MapView, MapViewState, ViewStateChangeParameters } from "@deck.gl/core";
import type { MjolnirGestureEvent } from "mjolnir.js";
import { Feature, GeoJSON } from "geojson";
import { DEFAULT_GEO_FILL_COLOR, DEFAULT_GEO_LAYER_PROPS } from "./utils/glMap.const";
import { isDef, TaskManager, type TimerTask } from "@orch-map/utils";
import { type BaseMapPoint, type BaseMapLine } from "@orch-map/types";
import MapStateManager from "../MapStateManager";
import { LineLayer, IconLayer, TextLayer } from "./layers";

// 类型定义
type LayerLike = any;
type LayerPropsObject = Record<string, any>;

/**
 * DeckGL 地图主类
 * 说明：负责 DeckGL 实例的管理、图层管理与业务图层（Geo、点、弧线）装配与更新
 */
export default class DeckglMap {
  //===== 静态常量 =====

  /** 默认视图状态 */
  private static readonly DEFAULT_VIEW_STATE: MapViewState = {
    longitude: 0,
    latitude: 30,
    zoom: 1,
    pitch: 0,
  };

  //===== 实例标识和核心组件 =====

  /** 实例唯一标识 */
  private instanceId: string = "deckgl-instance";

  /** DeckGL 实例 */
  private deckInstance: Deck<any> | null = null;

  /** 图层存储：layerId -> layer 实例 */
  private layerMap: Map<string, LayerLike> = new Map();

  //===== 数据源 =====

  /** 折线数据源 */
  private lines: BaseMapLine[] = [];

  /** 点数据源 */
  private points: BaseMapPoint[] = [];

  //===== 状态管理 =====

  /** 选中点 ID */
  private selectedPointId: string | null = null;

  /** 当前悬停的点 ID */
  private hoveredPointId: string | null = null;

  /** 2D/3D 模式 */
  private mode: "2d" | "3d" = "2d";

  //===== 动画控制 =====

  /** 动画计时器任务句柄 */
  private animationTimer: TimerTask | null = null;

  //===== 生命周期管理 =====

  /**
   * 构造函数
   * @param container - 容器元素
   * @param mode - 地图模式（2D/3D）
   * @param callback - 初始化完成回调函数
   */
  public constructor(container: HTMLCanvasElement, mode: "2d" | "3d", callback: () => void) {
    this.mode = mode;
    void this.initializeMap(container, callback);
  }

  /**
   * 初始化地图
   * @param container - 容器元素
   * @param callback - 初始化完成回调函数
   */
  private async initializeMap(container: HTMLCanvasElement, callback: () => void) {
    const canvas = this.createCanvas(container);
    await this.initDeck(canvas, callback);
  }

  /**
   * 初始化 Deck 实例与图标图集
   * @param canvas - Canvas 元素
   * @param callback - 初始化完成回调函数
   */
  private async initDeck(canvas: HTMLCanvasElement, callback: () => void) {
    const calculateMinZoom = (containerWidth: number): number => {
      const zoom = Math.log2(containerWidth / 256);
      return zoom - 1;
    };
    const minZoom = calculateMinZoom((canvas.parentNode as HTMLElement).clientWidth);

    await this.createDeckInstance(
      canvas,
      {
        zoom: Math.max(0, Math.min(20, minZoom)),
        latitude: 30,
        longitude: 0,
      },
      {
        mode: this.mode,
        // @ts-ignore
        onClick: async (info: unknown, event: MjolnirGestureEvent) => {
          await this.handleClickMapView(info, event);
        },
      },
    );

    // 初始化默认图层
    this.initializeDefaultLayers();

    callback();
    this.startArcAnimation();
  }

  /**
   * 初始化默认图层
   */
  private initializeDefaultLayers(): void {
    if (MapStateManager.geoData) {
      void this.setGEOData(MapStateManager.geoData);
    }
  }

  /**
   * 销毁内部资源
   */
  public destroy() {
    // 清理动画定时器
    if (this.animationTimer) {
      this.animationTimer.destroy();
      this.animationTimer = null;
    }

    // 销毁 Deck 实例
    if (this.deckInstance) {
      this.deckInstance.finalize();
      this.deckInstance = null;
    }

    // 清理图层
    this.layerMap.clear();
    LineLayer.clearLayers(this.removeLayer.bind(this));
    LineLayer.resetTime();
    this.removeLayer(IconLayer.getLayerId());
    this.removeLayer(TextLayer.getLayerId());
  }

  //===== 核心实例管理 =====

  /**
   * 创建 Canvas 元素
   * @param container - 容器元素
   * @returns Canvas 元素
   */
  private createCanvas(container: HTMLElement): HTMLCanvasElement {
    container.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);
    return canvas;
  }

  /**
   * 创建并初始化 Deck 实例
   * @param container - Canvas 容器
   * @param initialViewState - 初始视图状态
   * @param props - 附加属性
   */
  private async createDeckInstance(
    container: HTMLCanvasElement,
    initialViewState: Partial<MapViewState>,
    props?: Partial<Record<string, unknown>> & {
      mode?: "2d" | "3d"
      onClick?: (info: unknown, event: unknown) => void
    },
  ): Promise<void> {
    if (this.deckInstance) {
      throw new Error(`Deck instance already exists for ${this.instanceId}`);
    }

    const mode = props?.mode ?? "2d";
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
    });

    this.deckInstance = new Deck({
      canvas: container,
      initialViewState: {
        ...DeckglMap.DEFAULT_VIEW_STATE,
        ...(mode === "3d" ? { pitch: 45 } : {}),
        ...initialViewState,
      },
      views: mapView,
      ...props,
      onViewStateChange: <ViewStateT extends MapViewState>(
        params: ViewStateChangeParameters<ViewStateT>,
      ): ViewStateT | void => {
        const { viewState } = params as { viewState: MapViewState };
        // 限制纬度范围，防止上下拖动超出边界
        const constrainedLatitude = Math.max(-30, Math.min(30, viewState.latitude));
        const nextViewState = { ...viewState, latitude: constrainedLatitude } as unknown as ViewStateT;
        return nextViewState;
      },
      layers: [],
    });
  }

  /**
   * 获取当前 Deck 实例
   * @returns 当前的 Deck 实例
   * @throws 如果实例未初始化则抛出错误
   */
  private get currentDeckInstance(): Deck<any> {
    if (!this.deckInstance) {
      throw new Error(`Deck instance not initialized for ${this.instanceId}`);
    }
    return this.deckInstance;
  }

  //===== 图层管理 =====

  /**
   * 新增图层（若已存在则委托为 update）
   * @param id - 图层 ID
   * @param layer - 图层实例
   */
  private addLayer(id: string, layer: LayerLike): void {
    if (this.layerMap.has(id)) {
      this.updateLayerById(id, layer);
      return;
    }
    this.layerMap.set(id, layer);
  }

  /**
   * 更新图层
   * @param id - 图层 ID
   * @param layerOrProps - 图层实例或图层属性
   */
  private updateLayerById(id: string, layerOrProps: LayerLike | LayerPropsObject): void {
    const isLayerInstance = (candidate: unknown): candidate is LayerLike =>
      !!candidate &&
      typeof candidate === "object" &&
      "constructor" in candidate &&
      typeof (candidate as { constructor: unknown }).constructor === "function";

    // 如果该 id 的图层尚不存在
    if (!this.layerMap.has(id)) {
      if (isLayerInstance(layerOrProps)) {
        this.layerMap.set(id, layerOrProps);
        // eslint-disable-next-line no-console
        console.log("[DeckglMap] Layer added to layerMap:", id);
      }
      return;
    }

    const oldLayer = this.layerMap.get(id);

    // 如果传入的是完整的 Layer 实例，直接替换
    if (isLayerInstance(layerOrProps)) {
      const incomingLayer = layerOrProps;
      const incomingProps = incomingLayer.props ?? {};
      const incomingId = (incomingProps as Record<string, unknown>)["id"];
      if (typeof incomingId === "string" && incomingId !== id) {
        const Ctor = (incomingLayer as unknown as { constructor: new (p: LayerPropsObject) => LayerLike }).constructor;
        const rebuilt = new Ctor({
          ...incomingProps,
          id,
        });
        this.layerMap.set(id, rebuilt);
        // eslint-disable-next-line no-console
        console.log("[DeckglMap] Layer updated (rebuilt) in layerMap:", id);
      } else {
        this.layerMap.set(id, incomingLayer);
      }
      return;
    }

    // 否则视为部分 props，合并后重建
    const OldCtor = (oldLayer as unknown as { constructor: new (p: LayerPropsObject) => LayerLike }).constructor;
    const newLayer = new OldCtor({
      ...(oldLayer.props ?? {}),
      ...(layerOrProps as LayerPropsObject),
      id,
    });
    this.layerMap.set(id, newLayer);
  }

  /**
   * 移除图层
   * @param id - 图层 ID
   */
  private removeLayer(id: string): void {
    if (this.layerMap.has(id)) {
      this.layerMap.delete(id);
    }
  }

  /**
   * 以固定顺序返回所有图层实例
   * @returns 图层数组
   */
  private getLayers(): (LayerLike | undefined)[] {
    const layerIds = ["geojson-layer", "point-layer", "line-layer", "line-trail-layer", "label-layer"];
    const layers = layerIds.map(id => this.layerMap.get(id));
    return layers;
  }

  /**
   * 将当前图层刷新到 Deck 实例
   */
  private updateLayer() {
    const layers = this.getLayers();
    const validLayers = layers.filter(layer => layer !== undefined);
    this.currentDeckInstance?.setProps({
      layers: validLayers,
    });
  }

  //===== 事件处理 =====

  /**
   * 地图空白处点击处理（取消点选中）
   * @param info - 点击信息
   * @param _event - 事件对象
   */
  private async handleClickMapView(info: unknown, _event: MjolnirGestureEvent) {
    const pick = info as { object?: { id?: string }; layer?: { id?: string } } | null;
    if (!pick?.object || pick.layer?.id !== "point-layer") {
      if (this.selectedPointId) {
        this.selectedPointId = null;
        await this.updateIconLayers();
      }
    }
  }

  /**
   * 点对象点击处理
   * @param info - 点击信息
   */
  private async handleClickPoint(info: unknown) {
    const pick = info as { object?: { id?: string | null } } | null;
    const clickedId: string | null = pick?.object?.id ?? null;
    this.selectedPointId = clickedId;
    await this.updateIconLayers();
  }

  /**
   * 点对象悬停处理
   * @param info - 悬停信息
   */
  private async handleHoverPoint(info: unknown) {
    const pick = info as { object?: { id?: string | null } } | null;
    const hoveredId: string | null = pick?.object?.id ?? null;

    if (this.hoveredPointId !== hoveredId) {
      this.hoveredPointId = hoveredId;
      const textLayer = TextLayer.create(
        this.points,
        {
          selectedPointId: this.selectedPointId,
          hoveredPointId: this.hoveredPointId,
        },
      );
      this.updateLayerById(TextLayer.getLayerId(), textLayer);
      this.updateLayer();
    }
  }

  //===== 数据设置与更新 =====

  /**
   * 设置国家/省份 GeoJSON 数据并注册基础底图图层
   * @param geojsonData - GeoJSON 数据
   */
  public async setGEOData(geojsonData: GeoJSON) {
    let hoveredFeatureName: string | null = null;
    const geojsonLayer = new GeoJsonLayer({
      ...DEFAULT_GEO_LAYER_PROPS,
      id: "geojson-layer",
      data: geojsonData,
      getFillColor: (feature: Feature) => {
        if (isDef(hoveredFeatureName) && hoveredFeatureName === feature.properties?.name) {
          return [255, 255, 255, 255];
        }
        return DEFAULT_GEO_FILL_COLOR;
      },
      updateTriggers: {
        getFillColor: hoveredFeatureName,
      },
      onHover: (info: unknown) => {
        const hover = info as { object?: { properties?: { name?: string } } } | null;
        if (hoveredFeatureName !== hover?.object?.properties?.name) {
          this.currentDeckInstance?.redraw();
        }
        if (hover?.object) {
          hoveredFeatureName = hover.object.properties?.name ?? null;
        } else {
          hoveredFeatureName = null;
        }
        return true;
      },
    });
    this.addLayer("geojson-layer", geojsonLayer);
    this.updateLayer();
  }

  /**
   * 设置点数据
   * @param points - 点数据数组
   */
  public async setPoints(points: BaseMapPoint[]) {
    this.points = points;
    await this.updateIconLayers();
  }

  /**
   * 设置折线数据
   * @param lines - 折线数据数组
   */
  public setLines(lines: BaseMapLine[]) {
    this.lines = lines;
  }

  /**
   * 更新图标和文本图层
   */
  private async updateIconLayers() {
    // eslint-disable-next-line no-console
    console.log("[DeckglMap] updateIconLayers called, points count:", this.points.length);

    // 创建图标图层
    const iconLayer = await IconLayer.create(
      this.points,
      {
        selectedPointId: this.selectedPointId,
        hoveredPointId: this.hoveredPointId,
        onClick: (info: unknown) => {
          void this.handleClickPoint(info);
        },
        onHover: (info: unknown) => {
          void this.handleHoverPoint(info);
        },
      },
    );

    // 将图层添加到渲染管理器
    if (iconLayer) {
      this.updateLayerById(IconLayer.getLayerId(), iconLayer);
    }

    // eslint-disable-next-line no-console
    console.log("[DeckglMap] IconLayer updated, now updating TextLayer");

    // 创建文本图层
    const textLayer = TextLayer.create(
      this.points,
      {
        selectedPointId: this.selectedPointId,
        hoveredPointId: this.hoveredPointId,
      },
    );
    this.updateLayerById(TextLayer.getLayerId(), textLayer);

    // eslint-disable-next-line no-console
    console.log("[DeckglMap] TextLayer updated, now calling updateLayer()");

    this.updateLayer();
  }

  //===== 动画控制 =====

  /**
   * 启动动画定时器
   */
  private startArcAnimation() {
    if (this.animationTimer) {
      this.animationTimer.destroy();
      this.animationTimer = null;
    }
    this.animationTimer = new TaskManager.Timer({
      description: "glmap-arc-animation",
      time: 10,
      once: false,
      fn: this.updateArcAnimation.bind(this),
    });
  }

  /**
   * 更新动画
   */
  private updateArcAnimation() {
    LineLayer.advanceAnimation(this.mode, this.lines, {}, this.updateLayerById.bind(this));
    this.updateLayer();
  }
}
