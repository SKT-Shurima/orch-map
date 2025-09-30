/**
 * DeckGL 渲染器
 * 基于 DeckGL 的 3D 地图渲染实现
 */
import { BaseMapPoint, BaseMapLine, MapLevel, LayerData, LayerType } from "../interfaces";
import { IMapRenderer, MapRendererConfig } from "../interfaces/IMapRenderer";
import GlMap from "../deckgl";
import type { FeatureCollection } from "@orch-map/types";
import { getGeoJsonData } from "../utils/geoDataService";

type MapEventHandler = (data: unknown) => void;

export class DeckGLMapRenderer implements IMapRenderer {
  private container: HTMLElement;
  private config: MapRendererConfig;
  private glMap!: GlMap;
  private eventHandlers: Map<string, MapEventHandler[]> = new Map();

  constructor(container: HTMLElement, config: MapRendererConfig) {
    this.container = container;
    this.config = config;
    this.initDeckGL();
  }

  /**
   * 初始化 DeckGL
   */
  private initDeckGL(): void {
    try {
      // 为 DeckGL 创建 canvas 元素
      const canvas = document.createElement("canvas")
      canvas.style.width = "100%"
      canvas.style.height = "100%"
      this.container.appendChild(canvas)

      const instanceId = `deckgl-renderer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    } catch (error) {
      console.error("Failed to initialize DeckGL:", error);
      throw error;
    }
  }


  resize(): void {
    // this.glMap.resize(); 
  }

  /**
   * 渲染图层数据
   */
  render(data: LayerData[]): void {
    data.forEach((layer) => {
      switch (layer.type) {
        case LayerType.POINT:
          this.addPointLayer(layer);
          break;
        case LayerType.LINE:
          this.addLineLayer(layer);
          break;
        case LayerType.GEO:
          this.addGeoLayer(layer);
          break;
      }
    });
  }

  /**
   * 添加点图层
   */
  private addPointLayer(layer: LayerData): void {
    const points = layer.data as BaseMapPoint[];
    this.glMap.setPoints(points);
  }

  /**
   * 添加线图层
   */
  private addLineLayer(layer: LayerData): void {
    const lines = layer.data as BaseMapLine[];
    this.glMap.setLines(lines);
  }

  /**
   * 添加地理图层
   */
  private addGeoLayer(layer: LayerData): void {
    const geoData = layer.data as FeatureCollection;
    if (this.isFeatureCollection(geoData)) {
      this.glMap.setGEOData(geoData);
    }
  }

  /**
   * 设置地图级别
   */
  async setMapLevel(level: MapLevel, region?: string): Promise<void> {
    try {
      const geoData = await getGeoJsonData({
        mapLevel: level,
        country: region ?? "",
        region: region ?? "",
        mapType: "deckgl",
      });
      this.setGeoData(geoData);
    } catch (error) {
      console.error("Failed to set map level:", error);
    }
  }

  /**
   * 添加点数据
   */
  setPoints(points: BaseMapPoint[]): Promise<void> {
    this.glMap.setPoints(points);
    return Promise.resolve();
  }

  /**
   * 添加线数据
   */
  setLines(lines: BaseMapLine[]): Promise<void> {
    this.glMap.setLines(lines);
    return Promise.resolve();
  }

  /**
   * 设置地图数据
   */
  setGeoData(geoData: FeatureCollection): Promise<void> {
    if (this.isFeatureCollection(geoData)) {
      this.glMap.setGEOData(geoData);
    }
    return Promise.resolve();
  }

  /**
   * 监听事件
   */
  on(event: string, callback: MapEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(callback);
  }

  /**
   * 取消监听事件
   */
  off(event: string, callback: MapEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  private isFeatureCollection(data: unknown): data is FeatureCollection {
    if (!data || typeof data !== "object") return false;
    const d = data as { type?: unknown; features?: unknown };
    return d.type === "FeatureCollection" && Array.isArray(d.features);
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    if (this.glMap) {
      this.glMap.destroy();
    }
    this.eventHandlers.clear();
  }
}

// cleanup
export { };