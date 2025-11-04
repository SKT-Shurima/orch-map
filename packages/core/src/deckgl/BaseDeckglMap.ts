/**
 * 模块：DeckGL 基础地图类
 * 说明：包含所有模式的公共逻辑
 */
import { Deck, MapViewState, FlyToInterpolator } from "@deck.gl/core";
import type { MjolnirGestureEvent } from "mjolnir.js";
import { GeoJSON } from "geojson";
import { type BaseMapPoint, type BaseMapLine } from "@orch-map/types";
import { IconLayer, TextLayer } from "./layers";
import type { MapRendererEvents } from "../interfaces/IMapRenderer";
import GeoLayer from "./layers/geoLayer";
import type { PointState, LayerUpdateCallback } from "./layers/iconLayer";
import AnimationManager from "./animationManager";

// 类型定义
type LayerLike = any;
type LayerPropsObject = Record<string, any>;

/**
 * DeckGL 基础地图类
 * 说明：包含所有模式的公共逻辑，由具体模式类继承
 */
export abstract class BaseDeckglMap {
  //===== 静态常量 =====

  /** 默认视图状态 */
  protected static readonly DEFAULT_VIEW_STATE: MapViewState = {
    longitude: 0,
    latitude: 0,
    zoom: 1,
    pitch: 0,
  };

  //===== 实例标识和核心组件 =====

  /** 实例唯一标识 */
  protected instanceId: string = "deckgl-instance";

  /** DeckGL 实例 */
  protected deckInstance: Deck<any> | null = null;

  protected container: HTMLCanvasElement | null = null;

  /** 图层存储：layerId -> layer 实例 */
  protected layerMap: Map<string, LayerLike> = new Map();

  //===== 数据源 =====

  /** 折线数据源 */
  protected lines: BaseMapLine[] = [];

  /** 点数据源 */
  protected points: BaseMapPoint[] = [];

  //===== 状态管理 =====

  /** 点状态管理 */
  protected pointState: PointState = {
    selectedPointId: null,
    hoveredPointId: null,
  };

  /** 2D/2.5D/3D 模式 */
  protected mode: "2d" | "2.5d" | "3d";

  /** 第一次加载时计算的最小缩放比例 */
  protected initialMinZoom: number | null = null;

  /** 当前设置的中心点（仅用于初始化） */
  protected configuredCenter?: { lat: number; lng: number };

  /** 是否已经初始化完成（用于判断是否使用初始 center） */
  protected _hasInitialized: boolean = false;

  //===== 事件配置 =====

  /** 事件处理器配置 */
  protected events?: MapRendererEvents;

  //===== 点击事件控制 =====

  /** 单击延迟计时器 */
  protected clickTimer: ReturnType<typeof setTimeout> | null = null;

  /** 点击延迟时间（毫秒） */
  protected readonly CLICK_DELAY = 250;

  //===== 动画控制 =====

  /** 弧线动画管理器 */
  protected animationManager: AnimationManager;

  /**
   * 构造函数
   * @param container - 容器元素
   * @param mode - 地图模式（2D/2.5D/3D）
   * @param callback - 初始化完成回调函数
   * @param events - 事件处理器配置（可选）
   * @param center - 可选的中心点配置 { lat, lng }
   */
  public constructor(
    container: HTMLCanvasElement,
    mode: "2d" | "2.5d" | "3d",
    callback: () => void,
    events?: MapRendererEvents,
    center?: { lat: number; lng: number },
  ) {
    this.mode = mode;
    this.events = events;
    this.container = container;
    this.configuredCenter = center;

    // 根据模式设置不同的动画速度
    const animationSpeed = this.getAnimationSpeed();

    // 初始化动画管理器，只负责时间管理和状态
    this.animationManager = new AnimationManager(animationSpeed, (currentTime) => {
      // 动画更新回调：根据当前时间和模式更新图层
      this.updateArcAnimation(currentTime);
    });

    void this.initializeMap(container, callback);
  }

  /**
   * 获取动画速度（由子类实现）
   */
  protected abstract getAnimationSpeed(): number;

  /**
   * 初始化地图
   * @param container - 容器元素
   * @param callback - 初始化完成回调函数
   */
  protected async initializeMap(container: HTMLCanvasElement, callback: () => void) {
    const canvas = this.createCanvas(container);

    // 执行模式特定的初始化逻辑
    await this.initializeModeSpecificResources();

    await this.initDeck(canvas, callback);
    this.registerEvents();
  }

  /**
   * 初始化模式特定的资源（由子类实现）
   */
  protected async initializeModeSpecificResources(): Promise<void> {
    // 子类实现
  }

  /**
   * 注册事件监听
   */
  protected registerEvents() {
    this.container?.addEventListener("mouseleave", () => {
      GeoLayer.setHoveredFeatureName(null);
    });
  }

  /**
   * 初始化 Deck 实例与图标图集
   * @param canvas - Canvas 元素
   * @param callback - 初始化完成回调函数
   */
  protected async initDeck(canvas: HTMLCanvasElement, callback: () => void) {
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
    this.animationManager.start();
  }

  /**
   * 初始化默认图层
   */
  protected initializeDefaultLayers(): void {
    if (GeoLayer.shouldInitializeDefaultLayers()) {
      const geoData = GeoLayer.getDefaultGeoData();
      if (geoData) {
        void this.setGEOData(geoData);
      }
    }
  }

  /**
   * 图层更新回调方法
   */
  protected get layerUpdateCallback(): LayerUpdateCallback {
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

    // 停止并销毁动画管理器
    this.animationManager.destroy();

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
  protected createCanvas(container: HTMLElement): HTMLCanvasElement {
    container.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.setAttribute("width", "100%");
    canvas.setAttribute("height", "100%");
    container.appendChild(canvas);
    return canvas;
  }

  /**
   * 创建并初始化 Deck 实例（由子类实现）
   * @param container - Canvas 容器
   * @param initialViewState - 初始视图状态
   * @param props - 附加属性
   */
  protected abstract createDeckInstance(
    container: HTMLCanvasElement,
    initialViewState: Partial<MapViewState>,
    props?: Partial<Record<string, unknown>> & {
      mode?: "2d" | "2.5d" | "3d"
      onClick?: (info: unknown, event: unknown) => void
      onDblClick?: (info: unknown, event: unknown) => void
    },
  ): Promise<void>;

  /**
   * 获取当前 Deck 实例
   * @returns 当前的 Deck 实例
   * @throws 如果实例未初始化则抛出错误
   */
  protected get currentDeckInstance(): Deck<any> {
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
  protected addLayer(id: string, layer: LayerLike): void {
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
  protected updateLayerById(id: string, layerOrProps: LayerLike | LayerPropsObject): void {
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
  protected removeLayer(id: string): void {
    if (this.layerMap.has(id)) {
      this.layerMap.delete(id);
    }
  }

  /**
   * 以固定顺序返回所有图层实例（由子类实现）
   * @returns 图层数组
   */
  protected abstract getLayers(): (LayerLike | undefined)[];

  /**
   * 将当前图层刷新到 Deck 实例
   */
  protected updateLayer() {
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
  protected async handleClickMapView(info: unknown, event: MjolnirGestureEvent) {
    // 检查是否为双击事件（通过原生事件的 detail 属性）
    const nativeEvent = event?.srcEvent;
    if (nativeEvent && "detail" in nativeEvent && (nativeEvent as { detail: number }).detail === 2) {
      // 这是双击的第二次点击，忽略以避免干扰双击处理
      return;
    }

    if (IconLayer.isPointLayerClick(info)) {
      // 延迟处理点位点击，给双击事件留出时间
      if (this.clickTimer) {
        clearTimeout(this.clickTimer);
      }
      this.clickTimer = setTimeout(async () => {
        // 处理点位点击
        await this.handleClickPoint(info, event);
      }, this.CLICK_DELAY);
    } else {
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
  protected abstract handleDoubleClickMapView(info: unknown, event: MjolnirGestureEvent): Promise<void>;

  /**
   * 点对象点击处理
   * @param info - 点击信息
   * @param event - 事件对象
   */
  protected async handleClickPoint(info: unknown, event?: MjolnirGestureEvent) {
    const pick = info as { object?: { id?: string | null } } | null;
    const clickedId: string | null = pick?.object?.id ?? null;

    // 更新点状态
    this.pointState = await IconLayer.handleClickPoint(
      info,
      { ...this.pointState, points: this.points },
      this.layerUpdateCallback,
    );

    // 触发 onPointClick 事件
    if (clickedId && this.events?.onPointClick && this.container) {
      // 获取点击位置相对于容器的坐标
      const nativeEvent = event?.srcEvent as MouseEvent | undefined;
      if (nativeEvent) {
        const rect = this.container.getBoundingClientRect();
        const x = nativeEvent.clientX - rect.left;
        const y = nativeEvent.clientY - rect.top;

        this.events.onPointClick(clickedId, {
          position: { x, y },
        });
      }
    }
  }

  /**
   * 点对象悬停处理
   * @param info - 悬停信息
   */
  protected async handleHoverPoint(info: unknown) {
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
  public abstract setGEOData(geojsonData: GeoJSON): Promise<void>;

  /**
   * 根据地理数据调整视图，使其居中并适应缩放
   * @param geojsonData - GeoJSON 数据
   * @param useInitialCenter - 是否使用初始 center 配置（仅在初始化时使用）
   */
  protected fitBoundsToGeoData(geojsonData: GeoJSON, useInitialCenter: boolean = false): void {
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
    if (this.initialMinZoom === null) {
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
      this.initialMinZoom = Math.max(0, Math.min(2, minZoom));
      this.updateViewState([viewState.longitude, viewState.latitude], this.initialMinZoom);
    } else {
      this.updateViewState([viewState.longitude, viewState.latitude], viewState.zoom);
    }
  }

  /**
   * 更新视图状态
   * @param center - 中心点 [lng, lat]
   * @param zoom - 缩放级别
   */
  protected updateViewState(center: [number, number], zoom: number): void {
    // 使用 initialViewState 而不是 viewState，保持非受控模式
    // 这样用户仍然可以进行缩放、平移等交互
    const newViewState = {
      longitude: center[0],
      latitude: center[1],
      zoom,
      pitch: this.getPitch(),
      transitionDuration: 500, // 500ms 动画过渡
      transitionInterpolator: new FlyToInterpolator(),
    };

    this.currentDeckInstance?.setProps({
      initialViewState: newViewState,
    });
  }

  /**
   * 获取俯仰角（由子类实现）
   */
  protected abstract getPitch(): number;

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

  /**
   * 更新动画图层（根据当前时间和模式渲染）
   * @param currentTime - 当前动画时间
   */
  protected abstract updateArcAnimation(currentTime: number): void;
}

