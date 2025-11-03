/**
 * DeckGL 3D 模式地图类（Globe 模式）
 * @module DeckglMap3D
 */
import { Deck, MapViewState, ViewStateChangeParameters, COORDINATE_SYSTEM, LightingEffect, AmbientLight, _GlobeView, _SunLight } from "@deck.gl/core";
import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import type { MjolnirGestureEvent } from "mjolnir.js";
import { GeoJSON } from "geojson";
import { Line2DManager, Line3DManager, IconLayer, TextLayer, LayerId } from "./layers";
import GeoLayer from "./layers/geoLayer";
import { BaseDeckglMap } from "./BaseDeckglMap";
import { createSphereGeometry, EARTH_RADIUS_METERS } from "./utils/sphereGeometry";

type LayerLike = any;

/** 初始视图状态，zoom 值会在 setGEOData 中根据容器尺寸动态计算 */
const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.5,
};

/** 地球自转速度（度/秒） */
const ROTATION_SPEED_DEG_PER_SEC = 20;

/**
 * DeckGL 3D 模式地图类（Globe 模式）
 */
export class DeckglMap3D extends BaseDeckglMap {
  /** 地球球体几何体 */
  private sphereGeometry: ReturnType<typeof createSphereGeometry> | null = null;

  /** 当前视图状态 */
  private currentViewState: MapViewState = { ...INITIAL_VIEW_STATE };

  /** 上次更新时间戳 */
  private lastTime: number = (typeof window !== "undefined" && window.performance) ? window.performance.now() : Date.now();

  /** 鼠标是否悬停在球体上 */
  private isMouseOver: boolean = false;

  /** 悬停开始定时器（用于延迟停止自转） */
  private hoverStartTimeout: ReturnType<typeof setTimeout> | null = null;

  /** 悬停结束定时器（用于延迟恢复自转） */
  private hoverEndTimeout: ReturnType<typeof setTimeout> | null = null;

  /** 动画帧 ID */
  private animationFrameId: number | null = null;

  /**
   * 初始化模式特定的资源（3D Globe 模式）
   */
  protected async initializeModeSpecificResources(): Promise<void> {
    try {
      if (typeof EARTH_RADIUS_METERS !== "number" || isNaN(EARTH_RADIUS_METERS) || EARTH_RADIUS_METERS <= 0) {
        throw new Error(`Invalid EARTH_RADIUS_METERS: ${EARTH_RADIUS_METERS}`);
      }

      const geometry = createSphereGeometry(EARTH_RADIUS_METERS, 18, 36);
      if (!geometry) {
        throw new Error("createSphereGeometry returned null or undefined");
      }

      if (!geometry?.attributes?.positions || !geometry.indices) {
        throw new Error("createSphereGeometry returned incomplete geometry structure");
      }

      this.sphereGeometry = geometry;
    } catch (error) {
      console.error("Failed to create sphere geometry:", error);
      throw new Error(`Failed to initialize sphere geometry: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取动画速度
   * @returns 根据模式返回对应的动画速度
   */
  protected getAnimationSpeed(): number {
    return this.mode === "2d" ? 12 : 0.1;
  }

  /**
   * 创建并初始化 Deck 实例（3D Globe 模式）
   * @param container - 画布容器元素
   * @param initialViewState - 初始视图状态
   * @param props - 额外的 Deck 属性
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

    if (!this.sphereGeometry) {
      try {
        const geometry = createSphereGeometry(EARTH_RADIUS_METERS, 18, 36);
        if (!geometry) {
          throw new Error("createSphereGeometry returned null or undefined");
        }
        this.sphereGeometry = geometry;
      } catch (error) {
        console.error("Failed to create sphere geometry in createDeckInstance:", error);
        throw new Error(`Failed to create sphere geometry: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.currentViewState = {
      ...INITIAL_VIEW_STATE,
      ...initialViewState,
    };
    this.lastTime = (typeof window !== "undefined" && window.performance) ? window.performance.now() : Date.now();

    // @ts-ignore - GlobeView 是内部 API，类型不完整
    const view = _GlobeView
      ? new _GlobeView({
        controller: {
          dragPan: true,
          dragRotate: false,
          scrollZoom: true,
          doubleClickZoom: false,
          touchZoom: true,
          keyboard: false,
        },
      })
      : null;

    if (!view) {
      throw new Error("GlobeView is not available");
    }

    // 创建光照效果：使用高强度环境光，禁用太阳光以保持统一颜色
    const ambientLight = new AmbientLight({
      color: [255, 255, 255],
      intensity: 1.0,
    });

    // @ts-ignore - SunLight 是内部 API，类型不完整
    const sunLight = _SunLight
      ? new (_SunLight as new (props: {
        color: [number, number, number];
        intensity: number;
        timestamp: number;
      }) => unknown)({
        color: [255, 255, 255],
        intensity: 0.0,
        timestamp: Date.now(),
      })
      : null;

    const lightingEffectProps: { ambientLight: AmbientLight; sunLight?: typeof sunLight } = { ambientLight };
    if (sunLight) {
      lightingEffectProps.sunLight = sunLight;
    }
    // @ts-ignore - 类型定义可能不完整
    const lightingEffect: LightingEffect = new LightingEffect(
      lightingEffectProps as any,
    );

    this.deckInstance = new Deck({
      canvas: container,
      width: container.parentElement?.clientWidth,
      height: container.parentElement?.clientHeight,
      initialViewState: this.currentViewState,
      // @ts-ignore - view 可能是 GlobeView，类型不完整
      views: view,
      controller: {
        dragPan: true,
        dragRotate: false,
        scrollZoom: true,
        doubleClickZoom: false,
        touchZoom: true,
        keyboard: false,
      },
      effects: [lightingEffect],
      layers: [],
      ...props,
      // @ts-ignore - 类型定义不完整，需要支持不同的 ViewState 类型
      onViewStateChange: <ViewStateT extends MapViewState>(
        params: ViewStateChangeParameters<ViewStateT>,
      ): ViewStateT | void => {
        const { viewState } = params as { viewState: MapViewState };
        this.currentViewState = viewState;
        return viewState as unknown as ViewStateT;
      },
      onHover: (info: unknown) => {
        this.handleHover(info);
      },
      onLoad: () => {
        // DeckGL 加载完成
      },
    });

    // 添加地球球体图层
    const earthSphereLayer = new (SimpleMeshLayer as new (props: {
        id: string;
        data: number[];
        mesh: ReturnType<typeof createSphereGeometry>;
        coordinateSystem: number;
        getPosition: [number, number, number];
        getColor: [number, number, number];
        material: boolean;
        pickable: boolean;
      }) => unknown)({
      id: "earth-sphere",
      data: [0],
      mesh: this.sphereGeometry,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      getPosition: [0, 0, 0],
      getColor: [180, 210, 240],
      material: false,
      pickable: true,
    });
    this.addLayer("earth-sphere", earthSphereLayer);
    this.updateLayer();

    this.startRotationAnimation();
  }

  /**
   * 处理鼠标悬停事件
   * @param info - 悬停信息
   */
  private handleHover(info: unknown): void {
    const hoverInfo = info as { layer?: { id?: string } };
    const hoveringSphere = hoverInfo.layer?.id === "earth-sphere";

    if (hoveringSphere) {
      // 如果尚未停止自转，设置延迟定时器
      if (!this.isMouseOver) {
        // 清除之前的结束定时器（如果存在）
        if (this.hoverEndTimeout) {
          clearTimeout(this.hoverEndTimeout);
          this.hoverEndTimeout = null;
        }

        // 清除之前的开始定时器（如果存在），重新开始计时
        if (this.hoverStartTimeout) {
          clearTimeout(this.hoverStartTimeout);
        }

        // 设置600ms延迟，超时后才停止自转
        this.hoverStartTimeout = setTimeout(() => {
          this.isMouseOver = true;
          this.updateController(true);
          this.lastTime = (typeof window !== "undefined" && window.performance) ? window.performance.now() : Date.now();
          this.hoverStartTimeout = null;
        }, 600);
      }
    } else {
      // 鼠标离开球体
      // 清除开始定时器（如果在600ms内移开，不停止自转）
      if (this.hoverStartTimeout) {
        clearTimeout(this.hoverStartTimeout);
        this.hoverStartTimeout = null;
      }

      // 如果已经停止自转，延迟恢复
      if (this.isMouseOver) {
        if (this.hoverEndTimeout) {
          clearTimeout(this.hoverEndTimeout);
        }
        // 延迟150ms恢复自转，避免快速移动鼠标时频繁切换
        this.hoverEndTimeout = setTimeout(() => {
          this.isMouseOver = false;
          this.updateController(false);
          this.lastTime = (typeof window !== "undefined" && window.performance) ? window.performance.now() : Date.now();
          this.hoverEndTimeout = null;
        }, 150);
      }
    }
  }

  /**
   * 更新控制器配置
   * @param enabled - 是否启用交互控制
   */
  private updateController(enabled: boolean): void {
    if (!this.deckInstance) {
      return;
    }

    this.deckInstance?.setProps({
      controller: {
        dragPan: enabled,
        dragRotate: false,
        scrollZoom: enabled
          ? {
            speed: 0.01,
            smooth: false,
          }
          : false,
        doubleClickZoom: false,
        touchZoom: enabled,
        keyboard: false,
      },
    });
  }

  /**
   * 启动地球自转动画
   */
  private startRotationAnimation(): void {
    const animateRotation = () => {
      this.animationFrameId = requestAnimationFrame(animateRotation);

      if (this.isMouseOver) {
        this.lastTime = (typeof window !== "undefined" && window.performance) ? window.performance.now() : Date.now();
        return;
      }

      const currentTime = (typeof window !== "undefined" && window.performance) ? window.performance.now() : Date.now();
      const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      if (deltaTime > 0) {
        this.currentViewState.longitude += ROTATION_SPEED_DEG_PER_SEC * deltaTime;

        if (this.currentViewState.longitude > 180) {
          this.currentViewState.longitude -= 360;
        } else if (this.currentViewState.longitude < -180) {
          this.currentViewState.longitude += 360;
        }

        if (this.deckInstance) {
          this.deckInstance.setProps({
            viewState: { ...this.currentViewState },
          });
        }
      }
    };

    animateRotation();
  }

  /**
   * 停止地球自转动画
   */
  private stopRotationAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.hoverStartTimeout) {
      clearTimeout(this.hoverStartTimeout);
      this.hoverStartTimeout = null;
    }
    if (this.hoverEndTimeout) {
      clearTimeout(this.hoverEndTimeout);
      this.hoverEndTimeout = null;
    }
  }

  /**
   * 以固定顺序返回所有图层实例（3D 模式，earth-sphere 在最底层）
   * @returns 图层实例数组
   */
  protected getLayers(): (LayerLike | undefined)[] {
    const layerIds = [
      "earth-sphere",
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
   * 地图双击处理（3D 模式禁用下钻功能）
   * @param info - 点击信息
   * @param event - 手势事件
   */
  protected async handleDoubleClickMapView(info: unknown, event: MjolnirGestureEvent) {
    if (event?.srcEvent) {
      event.srcEvent.stopPropagation();
      event.srcEvent.preventDefault();
    }
    return;
  }

  /**
   * 设置国家/省份 GeoJSON 数据并注册基础底图图层（3D 模式）
   * @param geojsonData - GeoJSON 数据
   */
  public async setGEOData(geojsonData: GeoJSON) {
    const geojsonLayer = GeoLayer.createWithData(geojsonData, undefined);
    this.addLayer(GeoLayer.getLayerId(), geojsonLayer);
    this.updateLayer();

    // 使用 requestAnimationFrame 确保 DOM 更新后再计算视图
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const canvasElement = this.container;
          const containerWidth = canvasElement?.parentElement?.clientWidth ?? 1000;
          const containerHeight = canvasElement?.parentElement?.clientHeight ?? 800;

          // 根据容器尺寸计算适合显示整个地球的 zoom 值
          const minDimension = Math.min(containerWidth, containerHeight);
          const targetDiameter = minDimension * 1.2;
          const zoom = Math.max(0, Math.min(2.5, Math.log2(targetDiameter / 256)));

          const newViewState = {
            longitude: 0,
            latitude: 20,
            zoom,
            pitch: 0,
          };
          this.currentViewState = newViewState;
          if (this.currentDeckInstance) {
            this.currentDeckInstance.setProps({
              viewState: newViewState,
            });
          }
          this._hasInitialized = true;
          resolve();
        });
      });
    });
  }

  /**
   * 获取俯仰角（3D Globe 模式固定 pitch 为 0）
   * @returns 俯仰角度
   */
  protected getPitch(): number {
    return 0;
  }

  /**
   * 更新动画图层（根据模式决定使用 2D 或 3D 图层）
   * @param currentTime - 当前动画时间
   */
  protected updateArcAnimation(currentTime: number): void {
    if (this.mode === "2d") {
      const layers = Line2DManager.createLayers(this.lines, {}, currentTime);
      this.updateLayerById(LayerId.LINE_LAYER, layers[0]);
      this.updateLayerById(LayerId.LINE_TRAIL_LAYER, layers[1]);
    } else {
      const [baseLayer, trailLayer] = Line3DManager.createLayers(this.lines, {}, currentTime);
      this.updateLayerById(LayerId.ARC_BASE_LAYER, baseLayer);
      this.updateLayerById(LayerId.ARC_TRAIL_LAYER, trailLayer);
    }

    this.updateLayer();
  }

  /**
   * 销毁内部资源
   */
  public destroy(): void {
    this.stopRotationAnimation();
    super.destroy();
  }
}
