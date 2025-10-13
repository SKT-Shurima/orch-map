import { MapRendererConfig, MapRendererType } from "./interfaces";
import { BaseMapLine, BaseMapPoint } from "@orch-map/types";
import DeckglMap from "./deckgl";
import EchartsMap from "./echarts-geo";
import MapDataService, { GeoDataParams } from "@orch-map/mapData";
import MapStateManager from "./MapStateManager";
import { GeoUtils } from "./utils/geo.utils";
import { isUndef, svgToEChartsSymbol } from "@orch-map/utils";


/**
 * 地图渲染器工厂类
 * 负责根据配置创建对应的渲染器实例，支持 ECharts 和 DeckGL 两种渲染方式
 * @class OrchMap
 */
export default class OrchMap {

  /** 地图渲染器配置 */
  private config: MapRendererConfig;
  /** 地图渲染器实例 */
  protected instance!: EchartsMap | DeckglMap;
  /** 是否已初始化 */
  private _initialized = false;
  /** 初始化 Promise */
  private _initPromise: Promise<void>;
  /** 初始化回调队列 */
  private _initCallbacks: Array<() => void> = [];

  private get mapType(): "echart" | "deckgl" {
    return this.config.renderType === MapRendererType.ECHARTS ? "echart" : "deckgl";
  }

  /**
   * 构造函数
   * @param {MapRendererConfig} config - 地图渲染器配置
   * @param {Record<string, string>} extraSvgIcons - 额外的 SVG 图标（原始 SVG 字符串）
   */
  public constructor(config: MapRendererConfig, extraSvgIcons: Record<string, string> = {}) {
    this.config = config;
    MapStateManager.mapVersion = this.config.mapVersion || "standard";
    // 存储原始 SVG（供 DeckGL 使用）
    MapStateManager.extraSvgIcons = extraSvgIcons;
    // 转换为 ECharts symbol 格式（供 ECharts 使用）
    const echartsSymbols: Record<string, string> = {};
    Object.keys(extraSvgIcons).forEach(key => {
      echartsSymbols[key] = svgToEChartsSymbol(extraSvgIcons[key]);
    });
    MapStateManager.echartsSymbols = echartsSymbols;

    this._initPromise = this.initMap().then(() => {
      this._initialized = true;
      // 初始化完成后调用所有回调
      this._initCallbacks.forEach(callback => callback());
      this._initCallbacks = [];
    });
  }

  /**
   * 初始化地图
   * @private
   * @returns {Promise<void>} 初始化 Promise
   */
  public async initMap() {
    MapStateManager.curLevel = this.config.curLevel;
    MapStateManager.postcode = this.config.postcode ?? "";
    MapStateManager.country = this.config.country ?? "";
    await this.getGeoData({
      currentLevel: this.config.curLevel,
      country: this.config.country ?? "",
      region: this.config.postcode ?? "",
    });
    switch (this.config.renderType) {
      case MapRendererType.ECHARTS:
        this.instance = new EchartsMap(this.config.container, {
          ...this.config,
          events: {
            ...this.config.events,
            onAreaDoubleClick: async (region: string) => {
              this.config.events?.onAreaDoubleClick?.(region);
              void await this.entryNextLevel(region) ;

            },
          },
        },
        MapStateManager.geoData);
        break;
      case MapRendererType.DECKGL:
        this.instance = new DeckglMap(this.config.container as HTMLCanvasElement, this.config.mode ?? "2d", () => {
          console.log("DeckGL initialized");
        });
        break;
    }
  }

  /**
   * 设置地图点位数据
   * @param {BaseMapPoint[]} points - 点位数据数组
   */
  public setPoints(points: BaseMapPoint[]) {
    this._executeWhenReady(() => {
      void this.instance.setPoints(points);
    });
  }

  /**
   * 设置地图线条数据
   * @param {BaseMapLine[]} lines - 线条数据数组
   */
  public setLines(lines: BaseMapLine[]) {
    this._executeWhenReady(() => {
      void this.instance.setLines(lines);
    });
  }


  /**
   * @description: 计算中国地图的行政区划代码
   */
  private calculateChinaPostcode(region: string) {
    // 获取下一级地图的行政区划代码
    const nextPostcode = GeoUtils.getPostCodeByGeoFeatures(region);
    MapStateManager.postcode = nextPostcode;
  }


  private async entryNextLevel(region: string) {
    const nextLevel = GeoUtils.checkMapEntryEligibility();
    if (isUndef(nextLevel)) {
      return;
    }

    // 检查是否支持下一级地图
    if (nextLevel && !GeoUtils.isNextLevelSupported(nextLevel)) {
      return;
    }

    this.calculateChinaPostcode(region);
    MapStateManager.country = MapStateManager.country || region;
    MapStateManager.region = region;
    MapStateManager.curLevel = nextLevel;
    await this.getGeoData({
      currentLevel: nextLevel,
      country: MapStateManager.country,
      region: MapStateManager.country === "China" ? MapStateManager.postcode : region,
    });
    void this.instance.setGEOData(MapStateManager.geoData);
  }


  private async getGeoData(params: Omit<GeoDataParams, "mapType">) {
    const geoData = await MapDataService.getGeoJsonData({
      mapLevel: params.currentLevel,
      country: params.country,
      region: params.region,
      mapType: this.mapType,
    });
    MapStateManager.setGeoData(geoData);
  }


  /**
   * 在初始化完成后执行回调
   * @private
   * @param {() => void} callback - 回调函数
   */
  private _executeWhenReady(callback: () => void) {
    if (this._initialized) {
      // 如果已经初始化完成，直接执行
      callback();
    } else {
      // 否则添加到回调队列
      this._initCallbacks.push(callback);
    }
  }

  /**
   * 检查是否已初始化
   * @returns {boolean} 是否已初始化
   */
  public isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * 等待初始化完成
   * @returns {Promise<void>} 初始化完成的 Promise
   */
  public waitForInitialization(): Promise<void> {
    return this._initPromise;
  }


  /**
   * 根据环境自动选择最佳渲染器
   * @param {Partial<MapRendererConfig>} [config] - 渲染器配置
   * @returns {MapRendererType} 推荐的渲染器类型
   */
  public static getRecommendedType(config?: Partial<MapRendererConfig>): MapRendererType {
    // 如果指定了 3D 模式，推荐使用 DeckGL
    if (config?.mode === "3d") {
      return MapRendererType.DECKGL;
    }

    // 检查是否支持 WebGL
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");

    if (gl) {
      // 如果支持 WebGL，默认使用 DeckGL 以获得更好的性能
      return MapRendererType.DECKGL;
    }

    // 否则回退到 ECharts
    return MapRendererType.ECHARTS;
  }
}
