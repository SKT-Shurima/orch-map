import type { IMapRenderer, MapRendererConfig, MapRendererEvents } from "../interfaces"
import type{ BaseMapPoint, BaseMapLine } from "../interfaces"
import { MapLevel } from "@orch-map/types"
import type { FeatureCollection } from "@orch-map/types"
import GlMap from "../deckgl"
import MapStateManager from  "../MapStateManager"

/**
 * DeckGL 地图渲染器适配器
 * 将 GlMap 类适配为统一的 IMapRenderer 接口
 */
export class DeckglMapAdapter implements IMapRenderer {
  private glMap: GlMap | null = null
  private config: MapRendererConfig
  private instanceId: string
  private isInitialized = false
  private initPromise: Promise<void> | null = null
  private unsubscribeState: (() => void) | null = null

  constructor(config: MapRendererConfig) {
    this.config = config
    this.instanceId = `deckgl-${Date.now()}-${Math.random()}`
    this.initPromise = this.initDeckGL()
  }

  /**
   * 初始化 DeckGL
   */
  private async initDeckGL(): Promise<void> {
    const canvas = this.createCanvas()
    
    return new Promise<void>((resolve ) => {
      this.glMap = new GlMap(
        this.instanceId,
        canvas,
        this.config.mode || "2d",
        async () => {
          this.isInitialized = true
          const geoJsonData = await MapStateManager.getGeoJsonData({
            mapLevel: MapLevel.WORLD,
            country: this.config.country ?? "100000",
            region: this.config.adcode ?? "100000"
          })
          this.glMap?.setGEOData(geoJsonData)
          this.setupEventHandlers()
          resolve()
        }
      )
    })
  }

  /**
   * 创建 Canvas 元素
   */
  private createCanvas(): HTMLCanvasElement {
    const container = this.config.container as HTMLElement
    
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
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // DeckGL 的事件处理在内部已经实现
    // 这里可以添加额外的事件桥接逻辑
    if (this.config.events) {
      // 可以通过扩展 GlMap 类来支持更多事件
      // 或者通过监听 DOM 事件来实现
    }
  }

  /**
   * 处理状态变化
   */
  private handleStateChange(newState: any, oldState: any) {
    if (!this.glMap || !this.isInitialized) return

    // 处理地理数据变化
    if (newState.geoData !== oldState.geoData) {
      this.updateGeoDataInDeckGL(newState.geoData)
    }

    // 处理点数据变化
    if (newState.points !== oldState.points) {
      this.updatePointsInDeckGL(newState.points)
    }

    // 处理线数据变化
    if (newState.lines !== oldState.lines) {
      this.updateLinesInDeckGL(newState.lines)
    }
  }

  /**
   * 在 DeckGL 中更新地理数据
   */
  private async updateGeoDataInDeckGL(geoData: FeatureCollection) {
    if (!this.glMap) return
    
    const normalizedData = this.normalizeToFeatureCollection(geoData)
    this.glMap.setGEOData(normalizedData)
  }

  /**
   * 在 DeckGL 中更新点数据
   */
  private async updatePointsInDeckGL(points: BaseMapPoint[]) {
    if (!this.glMap) return
    
    const deckglPoints = this.convertPointsForDeckGL(points)
    await this.glMap.setPoints(deckglPoints)
  }

  /**
   * 在 DeckGL 中更新线数据
   */
  private async updateLinesInDeckGL(lines: BaseMapLine[]) {
    if (!this.glMap) return
    
    const deckglLines = this.convertLinesForDeckGL(lines)
    this.glMap.setLines(deckglLines)
  }

  /**
   * 等待初始化完成
   */
  private async waitForInit(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise
    }
  }

  /**
   * 设置地理数据
   */
  async setGeoData(boundary: FeatureCollection): Promise<void> {
    await this.waitForInit()
    if (!this.glMap) return

    // 更新状态管理器
    MapStateManager.setGeoData(boundary)
  }

  /**
   * 规范化为 FeatureCollection 格式
   */
  private normalizeToFeatureCollection(data: FeatureCollection): FeatureCollection {
    // 检查是否已经是 FeatureCollection
    if ('type' in data && data.type === 'FeatureCollection') {
      return data as FeatureCollection
    }
    
    // 如果是 GeoJsonData，尝试转换
    const geoJsonData = data as FeatureCollection
    return {
      type: 'FeatureCollection',
      features: (geoJsonData.features || []) as any
    }
  }

  /**
   * 设置点数据
   */
  async setPoints(points: BaseMapPoint[]): Promise<void> {
    await this.waitForInit()
    if (!this.glMap) return
    
  }

  /**
   * 转换点数据为 DeckGL 格式
   */
  private convertPointsForDeckGL(points: BaseMapPoint[]): BaseMapPoint[] {
    return points.map(point => ({
      ...point,
      // 确保坐标格式正确
      coordinate: Array.isArray(point.coordinate) 
        ? point.coordinate as [number, number]
        : [point.coordinate[0], point.coordinate[1]],
      // 添加 DeckGL 特定的属性
      icon: point.icon || 'star',
      color: this.parseColor(point.style?.color),
    }))
  }

  /**
   * 解析颜色值
   */
  private parseColor(color?: string): [number, number, number, number] {
    if (!color) return [255, 255, 255, 255]
    
    // 如果是十六进制颜色
    if (color.startsWith('#')) {
      const hex = color.slice(1)
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255
      return [r, g, b, a]
    }
    
    // 如果是 rgb/rgba 格式
    if (color.startsWith('rgb')) {
      const matches = color.match(/\d+/g)
      if (matches) {
        const [r, g, b, a = 255] = matches.map(Number)
        return [r, g, b, a]
      }
    }
    
    return [255, 255, 255, 255]
  }

  /**
   * 设置线数据
   */
  async setLines(lines: BaseMapLine[]): Promise<void> {
    await this.waitForInit()
    if (!this.glMap) return
 
  }

  /**
   * 转换线数据为 DeckGL 格式
   */
  private convertLinesForDeckGL(lines: BaseMapLine[]): BaseMapLine[] {
    return lines.map(line => ({
      ...line,
      // 确保坐标格式正确
      from: Array.isArray(line.from) 
        ? line.from as [number, number]
        : [line.from[0], line.from[1]],
      to: Array.isArray(line.to)
        ? line.to as [number, number] 
        : [line.to[0], line.to[1]],
      // 添加 DeckGL 特定的属性
      color: this.parseColor(line.color?.toString()),
      width: line.width || 2,
    }))
  }

  /**
   * 更新地图层级
   */
  updateMapLevel(level: MapLevel): void {
    // DeckGL 不需要显式的层级管理，通过 zoom 控制
    // 可以根据 level 调整视图状态
    console.log('Update map level to:', level)
  }

  /**
   * 设置点样式
   */
  setPointStyle(seriesName: string, styleProcessor: (point: BaseMapPoint) => void): void {
    // DeckGL 通过重新设置数据来更新样式
    // const points = MapStateManager.getProperty('points')
    // const updatedPoints = points.map(point => {
    //   const updatedPoint = { ...point }
    //   styleProcessor(updatedPoint)
    //   return updatedPoint
    // })
    
    // mapStateManager.setPoints(updatedPoints)
  }

  /**
   * 注册额外的图标
   */
  async registerExtraIcons(icons: Record<string, string>): Promise<void> {
    await this.waitForInit()
    if (!this.glMap) return
    
    await this.glMap.registerExtraSvgIcons(icons)
  }

  /**
   * 调整地图大小
   */
  resize(): void {
    // DeckGL 会自动处理 resize
    // 如果需要手动触发，可以调用 deck 实例的 resize 方法
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    if (!this.glMap) return
    
    this.glMap.destroy()
    this.glMap = null
    
    // 清理状态监听器
    if (this.unsubscribeState) {
      this.unsubscribeState()
      this.unsubscribeState = null
    }
    
    // 清理容器
    const container = this.config.container as HTMLElement
    container.innerHTML = ''
  }

  /**
   * 获取渲染器类型
   */
  getType(): "deckgl" {
    return "deckgl"
  }
}