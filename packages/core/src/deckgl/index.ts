/**
 * 模块：GL 地图入口
 * 说明：负责 DeckGL 实例的使用与业务图层（Geo、点、弧线）装配与更新。
 * 设计要点：
 * - 尽量将渲染状态（选中、时间轴）与数据状态（points/lines/geo）分离；
 * - 通过 `MapLayerManager` 进行图层注册与替换，降低对 Deck 实例的直接依赖；
 * - 动画与交互尽量采用轻量更新（避免重建不必要对象）。
 */
  import type { FeatureCollection , Feature } from "@orch-map/types"
import { DeckInstance } from "./deckInstance"

import type { MjolnirGestureEvent, MjolnirPointerEvent } from "mjolnir.js"
import { CurvatureCalculator } from "../utils/curvatureCalculator"
import { LineRenderer2D } from "./line2d"
import { LineRenderer3D } from "./line3d"
import { DEFAULT_GEO_FILL_COLOR, DEFAULT_GEO_LAYER_PROPS } from "./glMap.const"
import { isDef, TaskManager,type TimerTask } from "@orch-map/utils"
import { type BaseMapPoint, type BaseMapLine } from "@orch-map/types"
import { DEFAULT_SVG_ICONS } from "./icon.layer"
import IconAtlas, { type IconAtlasResult } from "./iconAtlas"
import MapLayerManager from "./layerManager"
import { GeoJsonLayer, IconLayer } from "@deck.gl/layers"
import MapStateManager from "../MapStateManager"

type IconPoint = BaseMapPoint & {
  position: [number, number, number?]
  icon: string
  size: number
  color: [number, number, number, number]
}
/**
 * GlMap
 * - 负责初始化 DeckGL 场景与各业务图层
 * - 暴露数据写入（setPoints/setLines/setGEOData）与销毁接口
 */
export default class  DeckglMap {
  /** 实例唯一标识（用于从 DeckInstance Map 中获取实例） */
  private instanceId!: string
  /** 图标图集构建结果（iconAtlas、iconMapping）。注意：DataURL 字符串占用内存较大，后续可考虑缓存与复用。 */
  private iconAtlasResult: IconAtlasResult | null = null
  // 动画相关状态（对齐 test01.html 的思路，但不依赖数据上的时间戳字段）
  /** 当前动画时间（单位：秒的逻辑刻度） */
  private currentTime = 0
  /** 动画计时器任务句柄 */
  private animationTimer: TimerTask | null = null
  /** 折线数据源 */
  private lines: BaseMapLine[] = []
  /** 点数据源 */
  private points: BaseMapPoint[] = []
  // 当前选中的点 id
  /** 选中点 ID（用于放大/高亮显示） */
  private selectedPointId: string | null = null
  /** 每 tick 前进的“秒数”（逻辑时间） */
  private  readonly ANIMATION_SPEED = 60 // 每tick前进的“秒数”
  /** 可见尾迹长度（逻辑时间） */
  private readonly TRAIL_LENGTH = 60 * 60 // 可见尾迹长度
  /** 时间循环区间（逻辑时间），默认 6 小时 */
  private readonly TIME_LOOP = 6 * 60 * 60 // 循环区间，默认6小时

  private mode: "2d" | "3d" = "2d"
  /** 曲率计算器，用于为 2D 曲线路径生成控制点偏移量 */
  private readonly curvatureCalculator = new CurvatureCalculator()
  /** 2D 线路渲染器 */
  private readonly lineRenderer2D = new LineRenderer2D(this.curvatureCalculator)
  /** 3D 线路渲染器 */
  private readonly lineRenderer3D = new LineRenderer3D()
  /** 额外注册的 SVG 图标集合（由业务侧注入），键为 icon key，值为 SVG 字符串 */
  private extraSvgIcons: Record<string, string> = {}

  /**
   * 构造函数
   * @param instanceId Deck 实例标识
   * @param container Canvas 容器
   * @param callback 初始化完成回调（图标图集构建完毕后触发）
   */
  public constructor(container: HTMLCanvasElement, mode: "2d" | "3d", callback: () => void) {
    this.instanceId = `deckgl-${Date.now()}-${Math.random()}`
    this.mode = mode
    const canvas = this.createCanvas(container)
    this.initDeck(canvas, callback)
  }

  private get currentDeckInstance() {
    return DeckInstance.getInstance(this.instanceId)
  }

  /**
   * 初始化 Deck 实例与图标图集
   * 注意：
   * - 这里通过容器宽度估算 minZoom，存在不同屏幕 DPR 下的视觉差异，可在后续优化中考虑；
   * - 图标图集构建是异步的，构建完成前不应创建依赖图集的图层（本实现已在回调后触发动画）。
   */
  private async initDeck(canvas: HTMLCanvasElement, callback: () => void) {
    const calculateMinZoom = (containerWidth: number): number => {
      const zoom = Math.log2(containerWidth / 256)
      return zoom - 1
    }
    const minZoom = calculateMinZoom((canvas.parentNode as HTMLElement).clientWidth)
    await DeckInstance.setInstance(
      this.instanceId,
      canvas,
      {
        zoom: Math.max(0, Math.min(20, minZoom)),
        latitude: 30,
        longitude: 0,
        // maxZoom 不在 MapViewState，交由 Deck 的控制器约束
      },
      {
        mode: this.mode,
        // @ts-ignore
        onClick: async (info: unknown, event: MjolnirGestureEvent) => {
          await this.handleClickMapView(info, event);
        },
      },
    )
    MapStateManager.geoData && this.setGEOData(MapStateManager.geoData)
    // 注意：buildIconAtlas 会对 SVG 进行多次 rasterize，内存与耗时与图标数量成正比，
    // 可在外层做缓存或离线预构建，以降低首次进入成本。
    const iconAtlasResult = await IconAtlas.buildIconAtlas({ ...DEFAULT_SVG_ICONS })
    this.iconAtlasResult = iconAtlasResult

    // 若已注入自定义图标，初始化后重建一次图集
    if (Object.keys(this.extraSvgIcons).length > 0) {
      await this.rebuildIconAtlas()
    }

    callback()
    this.startArcAnimation()
  }


    /**
   * 创建 Canvas 元素
   */
    private createCanvas(container: HTMLElement): HTMLCanvasElement {
      // 清空容器
      container.innerHTML = ''
      
      // 创建 canvas
      const canvas = document.createElement('canvas')
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      container.appendChild(canvas)
      
      return canvas
    }

  /**
   * 地图空白处点击处理（取消点选中）
   * 注意：`info` 为 deck 提供的拾取信息，这里仅判断 id 与图层，业务可按需扩展。
   */
  private async handleClickMapView(info: unknown, _event: MjolnirGestureEvent) {
    const pick = info as { object?: { id?: string }; layer?: { id?: string } } | null
    // 如果点击的不是任何对象，或者点击的对象不属于点图层，则取消选择
    if (!pick?.object || pick.layer?.id !== "point-layer") {
      if (this.selectedPointId) {
        this.selectedPointId = null
        await this.updateSelectionOverlay()
      }
    }
  }

  /**
   * 设置国家/省份 GeoJSON 数据并注册基础底图图层
   * @param geojsonData GeoJSON FeatureCollection
   */
  public async setGEOData(geojsonData: FeatureCollection) {
    
    let hoveredFeatureName: string | null = null
    const geojsonLayer = new GeoJsonLayer({
      ...DEFAULT_GEO_LAYER_PROPS,
      id: "geojson-layer",
      data: geojsonData,
      // 防止在倾斜视角下遮挡后绘制的图层（例如 IconLayer）
      getFillColor: (feature: Feature) => {
        if (isDef(hoveredFeatureName) && hoveredFeatureName === feature.properties?.name) {
          return [255, 255, 255, 255]
        }
        return DEFAULT_GEO_FILL_COLOR
      },
      updateTriggers: {
        getFillColor: hoveredFeatureName,
      },
      onHover: (info: unknown) => {
        const hover = info as { object?: { properties?: { name?: string } } } | null
        if (hoveredFeatureName !== hover?.object?.properties?.name) {
          this.currentDeckInstance?.redraw()
        }
        if (hover?.object) {
          hoveredFeatureName = hover.object.properties?.name ?? null
        } else {
          hoveredFeatureName = null
        }
        return true
      },
    })
    MapLayerManager.addLayer("geojson-layer", geojsonLayer)
    this.updateLayer()
  }

  /**
   * 点对象点击处理（设置选中）
   */
  private async handleClickPoint(info: unknown) {
    const pick = info as { object?: { id?: string | null } } | null
    const clickedId: string | null = pick?.object?.id ?? null
    this.selectedPointId = clickedId
    // 触发重建相关图层以反映选中样式
    await this.updateSelectionOverlay()
  }

  /**
   * 将业务点数据转换为 IconLayer 需要的数据结构
   * 注意：此处统一在 z 轴抬升避免深度冲突；可通过 `size` 与 `color` 做运行时调优。
   */
  private generateIconLayerData(points: Array<BaseMapPoint & { icon?: string; color?: [number, number, number, number] }>) {
    type IconPoint = BaseMapPoint & {
      position: [number, number, number?]
      icon: string
      size: number
      color: [number, number, number, number]
    }
    // 转换 BaseMapPoint 数据为 IconLayer 需要的格式
    const iconLayerData: IconPoint[] = points.map(point => ({
      ...point,
      // 抬升少量高度，避免与地面发生深度冲突/遮挡
      position: [point.coordinate[0], point.coordinate[1], 50],
      icon: point.icon ?? "star",
      size: 24,
      color: point.color ?? [255, 255, 255, 255],
    }))
    return iconLayerData
  }

  /**
   * 根据输入数据构建 IconLayer 图层实例
   * 注意：依赖 iconAtlasResult，如为空会导致图层纹理缺失，生产中建议增加兜底或等待图集就绪。
   */
  private async generateIconLayer(
    iconLayerData: Array<
      BaseMapPoint & {
        position: [number, number, number?]
        icon: string
        size: number
        color: [number, number, number, number]
      }
    >,
  ) {``
    
    const iconLayer = new IconLayer({
      id: "point-layer",
      data: iconLayerData,
      iconAtlas: this.iconAtlasResult?.iconAtlas,
      iconMapping: this.iconAtlasResult?.iconMapping,
      getPosition: (d) => d.position,
      getIcon: (d) => d.icon,
      getSize: (d) => (this.selectedPointId && d.id === this.selectedPointId ? d.size * 1.6 : d.size),
      getColor: (d) => d.color,
      pickable: true,
      updateTriggers: {
        getSize: this.selectedPointId,
      },
      onClick: (info: unknown) => {
        this.handleClickPoint(info)
      },
    })
    return iconLayer
  }

  /**
   * 设置点数据（内部仅记录与触发覆盖层更新）
   */
  public async setPoints(points: BaseMapPoint[]) {
    this.points = points
    await this.updateSelectionOverlay()
  }

  /**
   * 设置折线数据
   */
  public setLines(lines: BaseMapLine[]) {
    this.lines = lines
  }

  // 3D/2D 线路渲染已拆分至 `line3d.ts` 与 `line2d.ts`，此方法不再需要。

  /**
   * 将当前 LayerManager 中的图层刷新到 Deck 实例
   * 注意：`getLayers` 返回包含固定顺序 id 的数组，若某些图层未注册，则返回可能包含 undefined，
   * 生产中建议在 `MapLayerManager` 内部过滤空值以降低渲染层判断成本（此处仅注释，不改变逻辑）。
   */
  private updateLayer() {
    const layers = MapLayerManager.getLayers()
    // Filter out undefined layers and ensure they are valid Layer instances
    const validLayers = layers.filter(layer => layer !== undefined)
    this.currentDeckInstance?.setProps({
      layers: validLayers,
    })
  }

  /**
   * 根据当前时间推进动画并更新图层
   * 性能注意：每次都会重建 AnimatedArcLayer 实例，数量大时有创建开销，可考虑用 updateTriggers 或 attribute 更新替代。
   */
  private updateArcAnimation() {
    this.currentTime = (this.currentTime + this.ANIMATION_SPEED) % this.TIME_LOOP
    const startTime = Math.max(0, this.currentTime - this.TRAIL_LENGTH)
    const timeRange: [number, number] = [startTime, this.currentTime]

    if (this.mode === "3d") {
      const animatedLayer = this.lineRenderer3D.buildAnimatedLayer(this.lines, timeRange, 300, 1000)
      MapLayerManager.updateLayer("line-layer", animatedLayer)
    } else {
      const baseLayer = this.lineRenderer2D.buildFullCurveLayer(this.lines)
      const progress = this.currentTime / this.TIME_LOOP
      const dotsLayer = this.lineRenderer2D.buildMovingDotsLayer(this.lines, progress)
      MapLayerManager.updateLayer("line-layer", baseLayer)
      MapLayerManager.updateLayer("line-trail-layer", dotsLayer)
    }
    this.updateLayer()
  }

  // 构建/更新选中点的发光边框覆盖层
  /**
   * 根据选中状态重建点图层（用于同步 size/颜色等样式）
   */
  private async updateSelectionOverlay() {
    const iconLayerData = this.generateIconLayerData(this.points)
    const iconLayer = await this.generateIconLayer(iconLayerData)
    MapLayerManager.updateLayer("point-layer", iconLayer)
    this.updateLayer()
  }

  /**
   * 业务无关 API：注册额外 SVG 图标，键为 icon key，值为内联 SVG 字符串。
   * 若图集已构建，则重建图集并刷新当前点图层。
   */
  public async registerExtraSvgIcons(icons: Record<string, string>) {
    this.extraSvgIcons = { ...this.extraSvgIcons, ...icons }
    if (this.iconAtlasResult) {
      await this.rebuildIconAtlas()
    }
  }

  /**
   * 重建 IconAtlas：合并默认与额外图标，更新图层
   */
  private async rebuildIconAtlas() {
    const merged = { ...DEFAULT_SVG_ICONS, ...this.extraSvgIcons }
    this.iconAtlasResult = await IconAtlas.buildIconAtlas(merged)
    await this.updateSelectionOverlay()
  }

  /**
   * 启动动画定时器
   * 注意：外部需在组件卸载时调用 `destroy` 释放计时器；也可进一步与 `DeckInstance` 生命周期对齐管理。
   */
  private startArcAnimation() {
    if (this.animationTimer) {
      this.animationTimer.destroy()
      this.animationTimer = null
    }
    this.animationTimer = new TaskManager.Timer({
      description: "glmap-arc-animation",
      time: 10,
      once: false,
      fn: this.updateArcAnimation.bind(this),
    })
  }

  /**
   * 销毁内部资源
   * 注意：目前仅销毁计时器，Deck 实例的销毁需由外部调用 `DeckInstance.removeInstance` 完成资源回收。
   */
  public destroy() {
    if (this.animationTimer) {
      this.animationTimer.destroy()
      this.animationTimer = null
    }
  }
}
