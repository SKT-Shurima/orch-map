/**
 * ECharts 渲染器
 * 基于 ECharts 的 2D 地图渲染实现
 */
import { BaseMapPoint, BaseMapLine, MapLevel, LayerData, LayerType, FeatureCollection } from "../interfaces";
import { IMapRenderer, MapRendererConfig } from "../interfaces";
import EchartsMap from "../echarts-geo";
import { type PointSeries, type LineSeriesDataItem, type PointSeriesDataItem } from "../echarts-geo/types";
import type { SeriesOption } from "echarts";
import MapStateManager from "../MapStateManager";
import { getGeoJsonData } from "../utils/geoDataService";

type MapEventHandler = (data: unknown) => void;

function isPointEventParams(params: unknown): params is { coordinate?: [number, number]; data?: { properties?: Record<string, unknown> } } {
  if (!params || typeof params !== "object") return false
  const p = params as { coordinate?: unknown; data?: unknown }
  const coordOk = !p.coordinate || (Array.isArray(p.coordinate) && typeof p.coordinate[0] === "number" && typeof p.coordinate[1] === "number")
  const dataOk = !p.data || typeof p.data === "object"
  return coordOk && dataOk
}

function isAreaEventParams(params: unknown): params is { region?: Record<string, unknown> } {
  if (!params || typeof params !== "object") return false
  const p = params as { region?: unknown }
  return !p.region || typeof p.region === "object"
}

export class EChartsMapRenderer implements IMapRenderer {
  private container: HTMLElement;
  private config: MapRendererConfig;
  private echartsMap!: EchartsMap;
  private eventHandlers: Map<string, MapEventHandler[]> = new Map();

  constructor(container: HTMLElement, config: MapRendererConfig) {
    this.container = container;
    this.config = config;
    this.initECharts();
  }

  /**
   * 初始化 ECharts
   */
  private initECharts(): void {
    try {
      this.echartsMap = new EchartsMap(this.container, {
        events: {
          onClickPoint: (params: unknown) => {
            const coord = isPointEventParams(params) && params.coordinate ? params.coordinate : [0, 0]
            const data = isPointEventParams(params) ? params.data : undefined
            this.emit("click", {
              coordinate: coord,
              feature: data,
              properties: (data as { properties?: Record<string, unknown> } | undefined)?.properties
            });
          },
          onHoverPoint: (params: unknown) => {
            const coord = isPointEventParams(params) && params.coordinate ? params.coordinate : [0, 0]
            const data = isPointEventParams(params) ? params.data : undefined
            this.emit("hover", {
              coordinate: coord,
              feature: data,
              properties: (data as { properties?: Record<string, unknown> } | undefined)?.properties
            });
          },
          onClickArea: (params?: unknown) => {
            const region = isAreaEventParams(params) ? params.region : undefined
            this.emit("click", {
              coordinate: [0, 0],
              feature: params,
              properties: region
            });
          },
          onDoubleClickArea: (nextLevel: MapLevel, params?: unknown) => {
            const region = isAreaEventParams(params) ? params.region : undefined
            MapStateManager.curLevel = nextLevel;
            this.emit("doubleClick", {
              coordinate: [0, 0],
              feature: params,
              properties: region
            });
          },
          onHoverArea: (params?: unknown) => {
            const region = isAreaEventParams(params) ? params.region : undefined
            this.emit("hover", {
              coordinate: [0, 0],
              feature: params,
              properties: region
            });
          }
        }
      });
    } catch (error) {
      console.error("Failed to initialize ECharts:", error);
      throw error;
    }
  }

  /**
   * 渲染图层数据
   */
  render(data: LayerData[]): void {
    const series: SeriesOption[] = [];

    data.forEach(layer => {
      switch (layer.type) {
        case LayerType.POINT:
          this.addPointSeries(series, layer);
          break;
        case LayerType.LINE:
          this.addLineSeries(series, layer);
          break;
        case LayerType.GEO:
          this.addGeoSeries(layer);
          break;
      }
    });

    if (series.length > 0) {
      this.echartsMap.updateSeries(series);
    }
  }

  /**
   * 添加点图层
   */
  private addPointSeries(series: SeriesOption[], layer: LayerData): void {
    const points = layer.data as BaseMapPoint[];
    const pointSeries: PointSeries<{ raw: BaseMapPoint }> = {
      type: "scatter",
      data: points.map<PointSeriesDataItem<{ raw: BaseMapPoint }>>(point => ({
        name: point.id,
        value: [point.coordinate[0], point.coordinate[1]],
        businessInfo: { raw: point },
        symbol: point.icon || "circle",
        itemStyle: {
          color: point.color ? `rgba(${point.color.join(",")})` : "#1890ff"
        }
      }))
    }
    series.push(pointSeries as unknown as SeriesOption)
  }

  /**
   * 添加线图层
   */
  private addLineSeries(series: SeriesOption[], layer: LayerData): void {
    const lines = layer.data as BaseMapLine[];
    const lineSeries = {
      type: "lines",
      coordinateSystem: "geo",
      data: lines.map<LineSeriesDataItem<{ raw: BaseMapLine }>>(line => ({
        name: line.id,
        raw: line,
        coords: [line.startCoordinate, line.endCoordinate],
        lineStyle: {
          color: line.color ? `rgba(${line.color.join(",")})` : "#1890ff",
          width: 2,
          opacity: 1,
          curveness: 0
        }
      }))
    }
    series.push(lineSeries as unknown as SeriesOption)
  }

  /**
   * 添加地理图层
   */
  private addGeoSeries(layer: LayerData): void {
    const geoData = layer.data as FeatureCollection;
    this.echartsMap.setGEOData(geoData, geoData);
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
        mapType: "echart",
      });
      this.echartsMap.updateMapLevel(level);
      this.setGeoData(geoData);
    } catch (error) {
      console.error("Failed to set map level:", error);
    }
  }

  /**
   * 设置点数据
   */
  setPoints(points: BaseMapPoint[]): Promise<void> {
    this.render([{
      type: LayerType.POINT,
      data: points
    }]);
    return Promise.resolve();
  }

  /**
   * 设置线数据
   */
  setLines(lines: BaseMapLine[]): Promise<void> {
    this.render([{
      type: LayerType.LINE,
      data: lines
    }]);
    return Promise.resolve();
  }


  /**
   * 设置地图数据
   */
  setGeoData(geoData: FeatureCollection): Promise<void>  {
    this.echartsMap.setGEOData(geoData, geoData);
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

  /**
   * 调整地图大小
   */
  resize(): void {
    if (this.echartsMap) {
      this.echartsMap.resizeMap();
    }
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    if (this.echartsMap) {
      this.echartsMap.destroy();
    }
    this.eventHandlers.clear();
  }
}