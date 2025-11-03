/**
 * 模块：DeckGL 主模块
 * 说明：DeckGL 地图主类，整合了实例管理、图层管理和业务逻辑
 */
import { Deck, MapView, MapViewState, ViewStateChangeParameters, FlyToInterpolator } from "@deck.gl/core";
import type { MjolnirGestureEvent } from "mjolnir.js";
import { GeoJSON } from "geojson";
import { type BaseMapPoint, type BaseMapLine, MapLevel } from "@orch-map/types";
import { Line2DManager, Line3DManager, IconLayer, TextLayer } from "./layers";
import type { MapRendererEvents } from "../interfaces/IMapRenderer";
import GeoLayer from "./layers/geoLayer";
import type { PointState, LayerUpdateCallback } from "./layers/iconLayer";
import MapStateManager from "../MapStateManager";

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
    latitude: 0,
    zoom: 1,
    pitch: 0,
  };

  //===== 实例标识和核心组件 =====

  /** 实例唯一标识 */
  private instanceId: string = "deckgl-instance";

  /** DeckGL 实例 */
  private deckInstance: Deck<any> | null = null;

  private container: HTMLCanvasElement | null = null;

  /** 图层存储：layerId -> layer 实例 */
  private layerMap: Map<string, LayerLike> = new Map();

  //===== 数据源 =====

  /** 折线数据源 */
  private lines: BaseMapLine[] = [];

  /** 点数据源 */
  private points: BaseMapPoint[] = [];

  //===== 状态管理 =====

  /** 点状态管理 */
  private pointState: PointState = {
    selectedPointId: null,
    hoveredPointId: null,
  };

  /** 2D/3D 模式 */
  private mode: "2d" | "3d" = "2d";

  /** 第一次加载时计算的最小缩放比例 */
  private initialMinZoom: number | null = null;

  /** 当前设置的中心点（仅用于初始化） */
  private configuredCenter?: { lat: number; lng: number };

  /** 是否已经初始化完成（用于判断是否使用初始 center） */
  private _hasInitialized: boolean = false;

  //===== 事件配置 =====

  /** 事件处理器配置 */
  private events?: MapRendererEvents;

  //===== 点击事件控制 =====

  /** 单击延迟计时器 */
  private clickTimer: ReturnType<typeof setTimeout> | null = null;

  /** 点击延迟时间（毫秒） */
  private readonly CLICK_DELAY = 250;

  //===== 动画控制 =====

  /** 当前动画时间（单位：秒的逻辑刻度） */
  private currentTime = 0;

  //===== 生命周期管理 =====

  /**
   * 构造函数
   * @param container - 容器元素
   * @param mode - 地图模式（2D/3D）
   * @param callback - 初始化完成回调函数
   * @param events - 事件处理器配置（可选）
   * @param center - 可选的中心点配置 { lat, lng }
   */
  public constructor(
    container: HTMLCanvasElement,
    mode: "2d" | "3d",
    callback: () => void,
    events?: MapRendererEvents,
    center?: { lat: number; lng: number },
  ) {
    this.mode = mode;
    this.events = events;
    this.container = container;
    this.configuredCenter = center;
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
    await this.createDeckInstance(
      canvas,
      {
        zoom: 1,
        latitude: 0,
        longitude: 0,
      },
      {
        mode: this.mode,
        // @ts-ignore
        onClick: async (info: unknown, event: MjolnirGestureEvent) => {
          await this.handleClickMapView(info, event);
        },
        // @ts-ignore
        onDblClick: async (info: unknown, event: MjolnirGestureEvent) => {
          await this.handleDoubleClickMapView(info, event);
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
    if (GeoLayer.shouldInitializeDefaultLayers()) {
      const geoData = GeoLayer.getDefaultGeoData();
      if (geoData) {
        void this.setGEOData(geoData);
      }
    }
  }

  private get lineLayerManager() {
    return this.mode === "2d" ? Line2DManager : Line3DManager;
  }

  /**
   * 图层更新回调方法
   */
  private get layerUpdateCallback(): LayerUpdateCallback {
    return (layerId?: string, layer?: any) => {
      if (layerId && layer) {
        this.updateLayerById(layerId, layer);
      } else {
        this.updateLayer();
      }
    };
  }

  /**
   * 销毁内部资源
   */
  public destroy() {
    // 清理点击计时器
    if (this.clickTimer) {
      clearTimeout(this.clickTimer);
      this.clickTimer = null;
    }

    // 停止动画
    this.stopArcAnimation();

    // 销毁 Deck 实例
    if (this.deckInstance) {
      this.deckInstance.finalize();
      this.deckInstance = null;
    }

    // 清理图层
    this.layerMap.clear();
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
    canvas.setAttribute("width", "100%");
    canvas.setAttribute("height", "100%");
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
      onDblClick?: (info: unknown, event: unknown) => void
    },
  ): Promise<void> {
    if (this.deckInstance) {
      throw new Error(`Deck instance already exists for ${this.instanceId}`);
    }

    const mode = props?.mode ?? "2d";
    const mapView = new MapView({
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

    this.deckInstance = new Deck({
      canvas: container,
      width: container.parentElement?.clientWidth,
      height: container.parentElement?.clientHeight,
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
    const layerIds = [
      GeoLayer.getLayerId(),
      IconLayer.getLayerId(),
      "line-layer",
      "line-trail-layer",
      "arc-base-layer",
      "arc-trail-layer",
      TextLayer.getLayerId(),
    ];
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
   * @param event - 事件对象
   */
  private async handleClickMapView(info: unknown, event: MjolnirGestureEvent) {
    // 检查是否为双击事件（通过原生事件的 detail 属性）
    const nativeEvent = event?.srcEvent;
    if (nativeEvent && "detail" in nativeEvent && (nativeEvent as { detail: number }).detail === 2) {
      // 这是双击的第二次点击，忽略以避免干扰双击处理
      return;
    }

    if (!IconLayer.isPointLayerClick(info)) {
      // 延迟处理单击，给双击事件留出时间
      if (this.clickTimer) {
        clearTimeout(this.clickTimer);
      }
      this.clickTimer = setTimeout(async () => {
        if (this.pointState.selectedPointId) {
          this.pointState = await IconLayer.clearSelection(
            { ...this.pointState, points: this.points },
            this.layerUpdateCallback,
          );
        }
      }, this.CLICK_DELAY);
    }
  }

  /**
   * 地图双击处理（获取区域信息）
   * @param info - 双击信息
   * @param event - 事件对象
   */
  private async handleDoubleClickMapView(info: unknown, event: MjolnirGestureEvent) {
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
   * 点对象点击处理
   * @param info - 点击信息
   */
  private async handleClickPoint(info: unknown) {
    this.pointState = await IconLayer.handleClickPoint(
      info,
      { ...this.pointState, points: this.points },
      this.layerUpdateCallback,
    );
  }

  /**
   * 点对象悬停处理
   * @param info - 悬停信息
   */
  private async handleHoverPoint(info: unknown) {
    this.pointState = await IconLayer.handleHoverPoint(
      info,
      { ...this.pointState, points: this.points },
      this.layerUpdateCallback,
    );
  }

  //===== 数据设置与更新 =====

  /**
   * 设置国家/省份 GeoJSON 数据并注册基础底图图层
   * @param geojsonData - GeoJSON 数据
   */
  public async setGEOData(geojsonData: GeoJSON) {
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

  /**
   * 根据地理数据调整视图，使其居中并适应缩放
   * @param geojsonData - GeoJSON 数据
   * @param useInitialCenter - 是否使用初始 center 配置（仅在初始化时使用）
   */
  private fitBoundsToGeoData(geojsonData: GeoJSON, useInitialCenter: boolean = false): void {
    // 获取容器尺寸
    const canvasElement = this.container;
    const containerWidth = canvasElement?.parentElement?.clientWidth ?? 1000;
    const containerHeight = canvasElement?.parentElement?.clientHeight ?? 800;

    // 使用 GeoLayer 静态方法计算视图状态
    // 只在初始化时使用 configuredCenter，后续更新使用自动计算
    const viewState = GeoLayer.calculateViewState(
      geojsonData,
      { width: containerWidth, height: containerHeight },
      this.mode,
      useInitialCenter ? this.configuredCenter : undefined,
    );

    // 如果是第一次加载，计算并存储最小缩放比例
    this.initialMinZoom ??= this.calculateInitialMinZoom(containerWidth, containerHeight);

    this.updateViewState([viewState.longitude, viewState.latitude], viewState.zoom);
  }

  /**
   * 计算初始最小缩放比例
   * 基于容器尺寸计算能够显示整个世界地图的最小缩放级别
   * @param containerWidth - 容器宽度
   * @param containerHeight - 容器高度
   * @returns 最小缩放级别
   */
  private calculateInitialMinZoom(containerWidth: number, containerHeight: number): number {
    // 世界地图的经纬度范围
    const worldLngRange = 360; // 经度范围：-180 到 180
    const worldLatRange = 180; // 纬度范围：-90 到 90

    // 计算基于容器尺寸的最小缩放级别
    // 使用与 GeoUtils.calculateZoomForBounds 类似的逻辑
    const zoomLng = Math.log2((containerWidth * 0.8 * worldLngRange) / (256 * worldLngRange));
    const zoomLat = Math.log2((containerHeight * 0.8 * worldLatRange) / (256 * worldLatRange));

    // 取较小的缩放级别，确保整个世界地图都能在容器中显示
    const minZoom = Math.min(zoomLng, zoomLat);

    // 限制在合理范围内，确保不会太小
    return Math.max(0, Math.min(2, minZoom));
  }

  /**
   * 更新视图状态
   * @param center - 中心点 [lng, lat]
   * @param zoom - 缩放级别
   */
  private updateViewState(center: [number, number], zoom: number): void {
    // 使用 initialViewState 而不是 viewState，保持非受控模式
    // 这样用户仍然可以进行缩放、平移等交互
    const newViewState = {
      longitude: center[0],
      latitude: center[1],
      zoom,
      pitch: this.mode === "3d" ? 45 : 0,
      transitionDuration: 500, // 500ms 动画过渡
      transitionInterpolator: new FlyToInterpolator(),
    };

    this.currentDeckInstance?.setProps({
      initialViewState: newViewState,
    });
  }

  /**
   * 设置点数据
   * @param points - 点数据数组
   */
  public async setPoints(points: BaseMapPoint[]) {
    this.points = points;
    this.pointState = await IconLayer.setPoints(
      points,
      this.pointState,
      this.layerUpdateCallback,
    );
  }

  /**
   * 设置折线数据
   * @param lines - 折线数据数组
   */
  public setLines(lines: BaseMapLine[]) {
    this.lines = lines;
  }

  //===== 动画控制 =====

  // ==================== 时间管理方法 ====================

  /** RAF 动画 ID */
  private rafId: number | null = null;

  /** 动画开始时间 */
  private animationStartTime: number = 0;

  /** 动画是否正在运行 */
  private isAnimating: boolean = false;

  /**
   * 获取当前动画时间
   */
  public getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * 设置当前动画时间
   */
  public setCurrentTime(time: number): void {
    this.currentTime = time;
  }

  /**
   * 重置动画时间
   */
  public resetTime(): void {
    this.currentTime = 0;
  }

  /**
   * 启动动画定时器（使用 requestAnimationFrame）
   */
  private startArcAnimation() {
    if (this.isAnimating) {
      this.stopArcAnimation();
    }

    this.isAnimating = true;
    this.animationStartTime = Date.now();
    this.animate();
  }

  /**
   * 停止动画
   */
  private stopArcAnimation() {
    this.isAnimating = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * RAF 动画循环
   */
  private animate = () => {
    if (!this.isAnimating) {
      return;
    }

    const currentTime = Date.now();
    const deltaTime = currentTime - this.animationStartTime;

    // 根据模式设置不同的动画速度
    // 原实现：每10ms推进60单位，即每毫秒推进6单位
    // 原实现：每10ms推进1.0单位，即每毫秒推进0.1单位
    const animationSpeed = this.mode === "2d" ? 12 : 0.1; // 每毫秒的时间单位
    const timeLoop = 6 * 60 * 60; // 时间循环周期

    // 计算新的动画时间
    const newTime = (deltaTime * animationSpeed) % timeLoop;
    this.setCurrentTime(newTime);

    // 更新图层
    this.updateArcAnimation();

    // 继续下一帧
    this.rafId = requestAnimationFrame(this.animate);
  };

  /**
   * 更新动画
   */
  private updateArcAnimation() {
    const currentTime = this.getCurrentTime();

    if (this.mode === "2d") {
      // 使用 createLayers 创建图层
      const layers = Line2DManager.createLayers(this.lines, {}, currentTime);

      // 更新图层
      this.updateLayerById("line-layer", layers[0]);
      this.updateLayerById("line-trail-layer", layers[1]);
    } else {
      // 使用 createLayers 创建图层
      const [baseLayer, trailLayer] = Line3DManager.createLayers(this.lines, {}, currentTime);

      // 更新图层
      this.updateLayerById("arc-base-layer", baseLayer);
      this.updateLayerById("arc-trail-layer", trailLayer);
    }

    this.updateLayer();
  }
}
