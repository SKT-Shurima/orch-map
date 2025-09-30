import type { IMapRenderer, MapRendererConfig, MapRendererEvents } from "../interfaces/IMapRenderer"
import type { BaseMapPoint, BaseMapLine, MapLevel } from "../interfaces"
import type { FeatureCollection } from "@orch-map/types"
import { MapRendererFactory, MapRendererType } from "../factory/MapRendererFactory"
import { DeckglMapAdapter } from "./DeckglMapAdapter" 
import MapStateManager from "../MapStateManager"

/**
 * 统一地图组件配置
 */
export interface UnifiedMapConfig extends MapRendererConfig {
  /**
   * 渲染器类型
   * 如果不指定，将自动选择最佳渲染器
   */
  renderType?: MapRendererType
  
  /**
   * 是否启用自动切换
   * 当渲染器初始化失败时自动切换到备用渲染器
   */
  autoFallback?: boolean
  
  /**
   * 自定义图标（仅 DeckGL 支持）
   */
  customIcons?: Record<string, string>
}

/**
 * 统一地图组件
 * 提供统一的 API 来使用不同的地图渲染器
 */
export class UnifiedMapComponent {
  private renderer: IMapRenderer | null = null
  private config: UnifiedMapConfig
  private renderType: MapRendererType
  private isInitialized = false

  constructor(config: UnifiedMapConfig) {
    this.config = config
    
    // 确定渲染器类型
    this.renderType = config.renderType || MapRendererFactory.getRecommendedType(config)
    
    // 初始化渲染器
    this.initRenderer()
  }

  /**
   * 初始化渲染器
   */
  private async initRenderer(): Promise<void> {
    try {
      // 创建渲染器实例
      this.renderer = MapRendererFactory.createRenderer(this.renderType, this.config)
      
      // 如果有自定义图标且是 DeckGL 渲染器，注册图标
      if (this.config.customIcons && this.renderer instanceof DeckglMapAdapter) {
        await this.renderer.registerExtraIcons?.(this.config.customIcons)
      }
      
      this.isInitialized = true
    } catch (error) {
      console.error(`Failed to initialize ${this.renderType} renderer:`, error)
      
      // 如果启用了自动回退，尝试使用备用渲染器
      if (this.config.autoFallback) {
        this.fallbackToAlternativeRenderer()
      } else {
        throw error
      }
    }
  }

  /**
   * 回退到备用渲染器
   */
  private fallbackToAlternativeRenderer(): void {
    const alternativeType = this.renderType === MapRendererType.DECKGL ? MapRendererType.ECHARTS : MapRendererType.DECKGL
    
    console.warn(`Falling back to ${alternativeType} renderer`)
    
    try {
      this.renderType = alternativeType
      this.renderer = MapRendererFactory.createRenderer(alternativeType, this.config)
      this.isInitialized = true
    } catch (error) {
      console.error("Failed to initialize fallback renderer:", error)
      throw new Error("Failed to initialize any available renderer")
    }
  }

  /**
   * 获取当前使用的渲染器类型
   */
  getCurrentRendererType(): MapRendererType {
    return this.renderType
  }

  /**
   * 切换渲染器类型
   * @param type 新的渲染器类型
   */
  async switchRenderer(type: MapRendererType): Promise<void> {
    if (type === this.renderType) {
      return
    }

    // 保存当前数据
    const currentState = this.saveCurrentState()
    
    // 销毁当前渲染器
    if (this.renderer) {
      this.renderer.destroy()
    }

    // 创建新渲染器
    this.renderType = type
    this.renderer = MapRendererFactory.createRenderer(type, this.config)
    
    // 恢复数据
    await this.restoreState(currentState)
    
    this.isInitialized = true
  }

  /**
   * 保存当前状态
   */
  private saveCurrentState(): any {
    // 这里可以保存当前的数据状态
    // 实际实现需要根据具体需求来定
    return {
      // points, lines, geoData, etc.
    }
  }

  /**
   * 恢复状态
   */
  private async restoreState(state: any): Promise<void> {
    // 恢复之前保存的状态
    // 实际实现需要根据具体需求来定
  }

  /**
   * 设置地理数据
   */
  async setGeoData(boundary: FeatureCollection): Promise<void> {
    if (!this.renderer) {
      throw new Error("Renderer not initialized")
    }
    // 通过状态管理器更新，会自动同步到所有渲染器
    MapStateManager.setGeoData(boundary)
  }

  /**
   * 设置点数据
   */
  async setPoints(points: BaseMapPoint[]): Promise<void> {
    if (!this.renderer) {
      throw new Error("Renderer not initialized")
    }
  }

  /**
   * 设置线数据
   */
  async setLines(lines: BaseMapLine[]): Promise<void> {
    if (!this.renderer) {
      throw new Error("Renderer not initialized")
    }
  }

  /**
   * 更新地图层级
   */
  updateMapLevel(level: MapLevel): void {
    if (!this.renderer) {
      throw new Error("Renderer not initialized")
    }
  }

  /**
   * 设置点样式
   */
  setPointStyle(seriesName: string, styleProcessor: (point: BaseMapPoint) => void): void {
    if (!this.renderer) {
      throw new Error("Renderer not initialized")
    }
    this.renderer.setPointStyle?.(seriesName, styleProcessor)
  }

  /**
   * 注册额外的图标（仅 DeckGL 支持）
   */
  async registerExtraIcons(icons: Record<string, string>): Promise<void> {
    if (!this.renderer) {
      throw new Error("Renderer not initialized")
    }
    
    if (this.renderer instanceof DeckglMapAdapter) {
      return this.renderer.registerExtraIcons?.(icons)
    } else {
      console.warn("Current renderer does not support custom icons")
    }
  }

  /**
   * 调整地图大小
   */
  resize(): void {
    if (!this.renderer) {
      throw new Error("Renderer not initialized")
    }
    this.renderer.resize()
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    if (this.renderer) {
      this.renderer.destroy()
      this.renderer = null
    }
    this.isInitialized = false
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * 等待初始化完成
   */
  async waitForReady(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isInitialized) {
        resolve()
      } else {
        const checkInterval = setInterval(() => {
          if (this.isInitialized) {
            clearInterval(checkInterval)
            resolve()
          }
        }, 100)
      }
    })
  }
}