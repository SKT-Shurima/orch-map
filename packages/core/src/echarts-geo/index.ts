import { MapLevel, type BaseMapPoint, type BaseMapLine, type GeoJSON, FeatureCollection, GeoJSONSourceInput } from "@orch-map/types";
import { debounce, isEmptyArray, isUndef } from "@orch-map/utils";
import type { EChartsOption, SeriesOption, GeoComponentOption } from "echarts";
import { ScatterChart, LinesChart } from "echarts/charts";
import * as echarts from "echarts/core";
import type { ECElementEvent } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { GeoComponent, TooltipComponent, TitleComponent } from "echarts/components";
import type { IMapRenderer, MapRendererConfig } from "../interfaces/IMapRenderer";
import MapStateManager from "../MapStateManager";

import type { GEOParam } from "./types";
import type { PointSeriesDataItem } from "./types/node.type";
import GeoComponentUtils from "./components/geo";
import ScatterComponent from "./components/scatter";
import LinesComponent from "./components/lines";
import { getGeoJsonTitle } from "../utils/geo.helper";

// 注册必要的 ECharts 组件
echarts.use([CanvasRenderer, GeoComponent, TooltipComponent, TitleComponent, ScatterChart, LinesChart]);

// 常量与工具 - 已移至 GeoComponentUtils 静态类


/**
 * ECharts 地图事件接口
 */
interface EchartsMapEvents {
  /** 鼠标悬停在点上时触发 */
  onHoverPoint?: (params: BaseMapPoint) => void
  /** 点击点时触发 */
  onClickPoint?: (params: BaseMapPoint) => void
  /** 点击区域时触发 */
  onClickArea?: (params?: GEOParam) => void
  /** 双击区域时触发（用于地图层级切换） */
  onDoubleClickArea?: (nextLevel: MapLevel, params: GEOParam) => void
  /** 鼠标悬停在区域上时触发 */
  onHoverArea?: (params?: GEOParam, pointsInRegion?: string[]) => void
  /** 地理数据更新时触发 */
  onUpdateGeo?: (params: FeatureCollection) => void
  /** 地图缩放时触发 */
  onZoom?: (zoom: number) => void
}

/**
 * ECharts 地图配置选项
 */
interface EchartsMapOptions {
  /** 地图事件处理器 */
  events?: EchartsMapEvents
}

/**
 * ECharts 地图渲染器类
 * 基于 ECharts 实现的地图可视化组件，支持多层级地图切换、点线数据展示和交互事件
 * @template T - 点数据的业务信息类型，默认为 unknown
 */
export default class EchartsMap<T = unknown> implements IMapRenderer {
  /** 当前详细地图名称 */
  private detailMap: string = "";

  /** 中心国家代码 */
  private centralCountry?: string;

  /** 地图容器 DOM 元素 */
  private container: HTMLElement;

  /** ECharts 实例 */
  private chartInstance!: echarts.ECharts;


  /** 边界数据加载状态 */
  private boundaryLoading = false;

  /** 地图渲染器配置 */
  private config: MapRendererConfig;

  /** 状态管理器取消订阅函数 */
  private unsubscribeState: (() => void) | null = null;

  // 曲率计算器已移至 LinesComponent 静态类

  /**
   * 构造函数
   * @param container - 地图容器，可以是 DOM 元素或元素 ID 字符串
   * @param options - 地图配置选项，支持 EchartsMapOptions 或 MapRendererConfig 格式
   * @throws {Error} 当通过 ID 查找容器元素失败时抛出错误
   */
  public constructor(
    container: HTMLElement | string,
    options: EchartsMapOptions | MapRendererConfig,
    geoJson: GeoJSON,
  ) {
    // 处理容器参数
    if (typeof container === "string") {
      const element = document.getElementById(container);
      if (!element) {
        throw new Error(`找不到ID为"${container}"的容器元素`);
      }
      this.container = element;
    } else {
      this.container = container;
    }

    // 初始化配置
    this.config = options as MapRendererConfig;

    // 初始化图表和事件
    void this.initChart(geoJson).catch(error => {
      // eslint-disable-next-line no-console
      console.error(error);
    });
    this.registerEvents();
  }

  /**
   * 初始化 ECharts 图表实例
   * @private
   */
  private async initChart(geoJson: GeoJSON): Promise<void> {
    if (!this.container) {
      return;
    }

    // 创建实例
    const instance = echarts.init(this.container);
    const title = getGeoJsonTitle(geoJson, MapStateManager.curLevel);
    echarts.registerMap(title, geoJson as GeoJSONSourceInput);
    this.chartInstance = instance;
    const geoOption = GeoComponentUtils.defaultGeoOption;
    geoOption.map = title;
    const baseOption: EChartsOption = {
      tooltip: {
        show: true,
      },
      geo: GeoComponentUtils.defaultGeoOption,
      series: [
        ScatterComponent.defaultScatterSeries,
        LinesComponent.defaultLinesSeries,
        {
          ...LinesComponent.defaultLinesSeries,
          name: "lines-buddy",
        },
      ],
    };
    this.chartInstance?.setOption(baseOption, true);


    instance.on("dblclick", this.dbClickHandler);
    instance.on("georoam", this.redrawMap);
  }

  /**
   * 注册事件监听器
   * @private
   */
  private registerEvents(): void {
    window.addEventListener("resize", this.resizeMap);

    // 订阅状态管理器的变化
    this.unsubscribeState = MapStateManager.onPropertyChange("geoData", () => {
      // 状态变化时的处理逻辑
      if (this.chartInstance) {
        this.redrawMap();
      }
    });
  }


  /**
   * 设置 ECharts 图表配置选项
   * @param option - ECharts 配置选项
   * @private
   */
  private setChartOption(option: EChartsOption): void {
    if (!this.chartInstance) return;
    this.chartInstance.setOption(option);
  }

  private updateGeoOption(): void {
    GeoComponentUtils.updateGeoOption(this.chartInstance, this.centralCountry);
  }

  /**
   * 设置地理数据并更新地图显示
   * @param boundary - 边界地理数据
   * @public
   */
  public setGEOData(boundary: GeoJSON): void {
    // 注册地图并设置选项
    const geojson = MapStateManager.geoData;
    GeoComponentUtils.registerMap(geojson);
    this.updateGeoOption();

    if (!boundary || boundary.type !== "FeatureCollection" || !boundary.features || !Array.isArray(boundary.features) ) {
      this.boundaryLoading = false;
      return;
    }

    this.boundaryLoading = false;
  }


  /**
   * 双击事件处理器（用于地图层级切换）
   * @param params - 事件参数，包含组件类型和区域信息
   * @private
   */
  private dbClickHandler = (params: ECElementEvent) => {
    if (!params?.event?.event || !params.componentType) {
      return;
    }

    params.event.event.stopPropagation();

    if (params.componentType === "geo") {
      this.config.events?.onAreaDoubleClick?.(params.name || "");
    }
  };


  /**
   * 等待边界数据加载完成
   * @param timeout - 超时时间（毫秒），默认 5000ms
   * @returns Promise - 加载完成时 resolve，超时时 reject
   * @private
   */
  private waitForBoundaryLoadingToBeFalse(timeout = 5000): Promise<true> {
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      const checkState = () => {
        if (!this.boundaryLoading) {
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error("获取地图轮廓加载状态超时"));
        } else {
          setTimeout(checkState, 1000);
        }
      };
      checkState();
    });
  }

  /**
   * 更新系列数据的具体实现
   * @param series - ECharts 系列配置数组
   * @private
   */
  private updateSeriesImpl = async (series: SeriesOption[]) => {
    await this.waitForBoundaryLoadingToBeFalse();

    // 根据是否为中国或美国等，选择是否需要投影变换
    if (GeoComponentUtils.needsProjectionTransform()) {
      // const newSeries = this.transSeriesCoordinate2GeoJsonXY(series)
      const option: EChartsOption = { series };
      this.setChartOption(option);
    } else {
      const option: EChartsOption = { series };
      this.setChartOption(option);
    }
  };

  /**
   * 在 ECharts 中为指定系列设置点样式
   * @param targetSeriesName - 目标系列名称
   * @param processFn - 处理函数，用于修改点数据项
   * @public
   */
  public setPointStyleInternal(targetSeriesName: string, processFn: (dataItem: PointSeriesDataItem<T>) => void): void {
    ScatterComponent.setPointStyleInternal(this.chartInstance, targetSeriesName, processFn);
  }

  /**
   * 重绘地图
   * @private
   */
  private redrawMap = (): void => {
    const chartInstance = this.chartInstance;
    if (!chartInstance) {
      return;
    }
    const newOption = chartInstance.getOption();
    const geo = newOption.geo as GeoComponentOption[] | undefined;
    if (!geo || isEmptyArray(geo) || isUndef(geo[0])) {
      return;
    }
    const geoComponent = geo[0];
    const mapType = geoComponent.map;

    chartInstance.dispatchAction({
      type: "changeGeoRoam",
      componentType: "geo",
      map: mapType,
      center: geoComponent.center,
      zoom: geoComponent.zoom,
    });


    if (this.config.events?.onZoom && typeof geoComponent.zoom === "number") {
      this.config.events.onZoom(geoComponent.zoom);
    }
  };

  /**
   * 调整地图大小
   * @public
   */
  public resizeMap = (): void => {
    this.chartInstance?.resize();
  };


  /**
   * 更新地图层级
   * @param curLevel - 当前地图层级
   * @public
   */
  public updateMapLevel(curLevel: MapLevel): void {
    MapStateManager.curLevel = curLevel;

    const currentOption = this.chartInstance?.getOption() as EChartsOption | undefined;
    if (!currentOption) return;

    const geo = (currentOption.geo as GeoComponentOption[]) || [];
    const hasInitializedGeo = Array.isArray(geo) && geo[0]?.map;
    if (!hasInitializedGeo) {
      return;
    }

    this.updateGeoOption();
  }

  /**
   * 销毁地图实例，清理资源
   * @public
   */
  public destroy(): void {

    if (this.detailMap) {
      this.chartInstance?.clear();
    }

    window.removeEventListener("resize", this.resizeMap);
    this.chartInstance?.dispose();

    // 清理状态监听器
    if (this.unsubscribeState) {
      this.unsubscribeState();
      this.unsubscribeState = null;
    }
  }


  /**
   * 地图系列数据更新方法（防抖，300ms 延迟）
   * @param series - ECharts 系列配置
   * @public
   */
  public updateSeries = debounce((...args: unknown[]) => {
    const series = args[0] as SeriesOption[];
    // eslint-disable-next-line no-console
    void this.updateSeriesImpl(series).catch(console.error);
  }, 300);


  /**
   * # 更新地图上的点位
   * 该方法会移除旧的点位系列，然后添加新的点位系列
   * @param points 点位数组
   */
  public setPoints(points: BaseMapPoint[]) {
    ScatterComponent.setPoints(this.chartInstance, points);
  }


  /**
   * 在 ECharts 中更新线数据
   * @param lines - 线数据数组
   * @public
   */
  public async setLines(lines: BaseMapLine[]): Promise<void> {
    LinesComponent.setLines(this.chartInstance, lines);
  }

  /**
   * 设置地理数据（IMapRenderer 接口实现）
   * @param boundary - 地理边界数据
   * @public
   */
  public async setGeoData(boundary: GeoJSONSourceInput): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.chartInstance) {
        reject(new Error("图表实例不存在"));
        return;
      }

      const geoData = GeoComponentUtils.normalizeGeoData(boundary);
      // 更新状态管理器
      MapStateManager.setGeoData(geoData);
      resolve();
    });
  }


  /**
   * 设置点样式（IMapRenderer 接口实现）
   * @param seriesName - 系列名称
   * @param styleProcessor - 样式处理函数
   * @public
   */
  public setPointStyle(seriesName: string, styleProcessor: (point: BaseMapPoint) => void): void {
    ScatterComponent.setPointStyle(this.chartInstance, seriesName, styleProcessor);
  }

  /**
   * 调整地图大小（IMapRenderer 接口实现）
   * @public
   */
  public resize(): void {
    this.resizeMap();
  }

  /**
   * 获取渲染器类型（IMapRenderer 接口实现）
   * @returns 渲染器类型标识
   * @public
   */
  public getType(): "echarts" {
    return "echarts";
  }


}
