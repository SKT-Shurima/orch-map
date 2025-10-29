import { MapRendererConfig } from "./interfaces";
import { BaseMapLine, BaseMapPoint, MapLevel, MapRendererType } from "@orch-map/types";
import DeckglMap from "./deckgl";
import EchartsMap from "./echarts-geo";
import MapDataService from "@orch-map/path-adapter";
import MapStateManager from "./MapStateManager";
import { GeoUtils, MapLevelUtils } from "./utils";
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

    const params = {
      currentLevel: this.config.curLevel,
      country: this.config.country ?? "",
      region: this.config.postcode ?? "",
    };

    // 检查数据是否存在
    const exists = await MapDataService.checkGeoJsonExistsForParams({
      mapLevel: params.currentLevel,
      country: params.country,
      region: params.region,
      mapType: this.mapType,
    });

    if (!exists) {
      // 如果数据不存在，阻断执行
      // eslint-disable-next-line no-console
      console.warn(`Geo JSON data not found for level: ${params.currentLevel}, country: ${params.country}, region: ${params.region}`);
      return;
    }

    await this.getGeoData(params);

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
        this.instance = new DeckglMap(
          this.config.container as HTMLCanvasElement,
          this.config.mode ?? "2d",
          () => {
            // eslint-disable-next-line no-console
            console.log("DeckGL initialized");
          },
          {
            ...this.config.events,
            onAreaDoubleClick: async (region: string) => {
              this.config.events?.onAreaDoubleClick?.(region);
              void await this.entryNextLevel(region);
            },
          },
        );
        break;
    }
  }

  /**
   * 设置地图点位数据
   * @param {BaseMapPoint[]} points - 点位数据数组
   */
  public setPoints(points: BaseMapPoint[]) {
    // 存储所有原始点位数据
    MapStateManager.allPoints = points;

    this._executeWhenReady(() => {
      // 根据当前地图层级过滤点位
      const filteredPoints = this.filterPointsByCurrentLevel(points);
      void this.instance.setPoints(filteredPoints);
    });
  }

  /**
   * 设置地图线条数据
   * @param {BaseMapLine[]} lines - 线条数据数组
   */
  public setLines(lines: BaseMapLine[]) {
    // 存储所有原始线条数据
    MapStateManager.allLines = lines;

    this._executeWhenReady(() => {
      // 根据当前地图层级过滤线条
      const filteredLines = this.filterLinesByCurrentLevel(lines);
      void this.instance.setLines(filteredLines);
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


  public async entryNextLevel(region: string) {
    const nextLevel = MapLevelUtils.checkMapEntryEligibility();
    if (isUndef(nextLevel)) {
      return;
    }

    // 检查是否支持下一级地图
    if (nextLevel && !MapLevelUtils.isNextLevelSupported(nextLevel)) {
      return;
    }

    this.calculateChinaPostcode(region);
    MapStateManager.country = MapStateManager.country || region;
    MapStateManager.region = region;
    MapStateManager.curLevel = nextLevel;

    const params = {
      currentLevel: nextLevel,
      country: MapStateManager.country,
      region: MapStateManager.country === "China" ? MapStateManager.postcode : region,
    };

    // 检查数据是否存在
    const exists = await MapDataService.checkGeoJsonExistsForParams({
      mapLevel: params.currentLevel,
      country: params.country,
      region: params.region,
      mapType: this.mapType,
    });

    if (!exists) {
      // 如果数据不存在，阻断执行
      // eslint-disable-next-line no-console
      console.warn(`Geo JSON data not found for level: ${params.currentLevel}, country: ${params.country}, region: ${params.region}`);
      return;
    }

    await this.getGeoData(params);
    void this.instance.setGEOData(MapStateManager.geoData);

    // 进入新层级后，重新过滤并更新点位和线条
    this.updatePointsAndLinesForCurrentLevel();
  }

  /**
   * 导航到指定地图层级
   * @description 切换到指定的地图层级和区域
   * @param {MapLevel} targetLevel - 目标地图层级
   * @param {string} [country=""] - 国家代码（country 或 region 层级时需要）
   * @param {string} [region=""] - 地区名称（region 层级时需要）
   * @param {string} [postcode=""] - 邮政编码（用于中国地图的行政区划）
   * @returns {Promise<void>} 导航操作的 Promise
   * @example
   * // 返回世界地图
   * await mapInstance.navigateToLevel(MapLevel.WORLD);
   *
   * // 导航到美国地图
   * await mapInstance.navigateToLevel(MapLevel.COUNTRY, "United States");
   *
   * // 导航到中国某个省份
   * await mapInstance.navigateToLevel(MapLevel.REGION, "China", "北京", "110000");
   */
  public async navigateToLevel(
    targetLevel: MapLevel,
    country: string = "",
    region: string = "",
    postcode: string = "",
  ): Promise<void> {
    // 更新地图状态
    MapStateManager.curLevel = targetLevel;
    MapStateManager.country = country;
    MapStateManager.region = region;
    MapStateManager.postcode = postcode;

    const params = {
      currentLevel: targetLevel,
      country,
      region: country === "China" ? postcode : region,
    };

    // 检查数据是否存在
    const exists = await MapDataService.checkGeoJsonExistsForParams({
      mapLevel: params.currentLevel,
      country: params.country,
      region: params.region,
      mapType: this.mapType,
    });

    if (!exists) {
      // 如果数据不存在，阻断执行
      // eslint-disable-next-line no-console
      console.warn(`Geo JSON data not found for level: ${params.currentLevel}, country: ${params.country}, region: ${params.region}`);
      return;
    }

    // 加载指定层级的地图数据
    await this.getGeoData(params);

    // 更新地图实例的地理数据
    void this.instance.setGEOData(MapStateManager.geoData);

    // 重新过滤并更新点位和线条
    this.updatePointsAndLinesForCurrentLevel();
  }

  /**
   * 返回到世界地图
   * @description 快捷方法，重置地图状态并返回到世界地图视图
   * @returns {Promise<void>} 返回操作的 Promise
   */
  public async returnToWorldMap(): Promise<void> {
    return this.navigateToLevel(MapLevel.WORLD);
  }


  private async getGeoData(params: { currentLevel: MapLevel; country: string; region: string }) {
    const geoData = await MapDataService.getGeoJsonData({
      mapLevel: params.currentLevel,
      country: params.country,
      region: params.region,
      mapType: this.mapType,
    });
    MapStateManager.setGeoData(geoData);
  }

  /**
   * 根据当前地图层级过滤点位
   * @param points - 点位数据数组
   * @returns 过滤后的点位数组
   */
  private filterPointsByCurrentLevel(points: BaseMapPoint[]): BaseMapPoint[] {
    // 如果是世界地图，显示所有点位
    if (MapStateManager.curLevel === "world") {
      return points;
    }

    // 根据当前 GeoJSON 过滤点位
    return GeoUtils.filterPointsInGeoJSON(points, MapStateManager.geoData);
  }

  /**
   * 根据当前地图层级过滤线条
   * @param lines - 线条数据数组
   * @returns 过滤后的线条数组
   */
  private filterLinesByCurrentLevel(lines: BaseMapLine[]): BaseMapLine[] {
    // 如果是世界地图，显示所有线条
    if (MapStateManager.curLevel === "world") {
      return lines;
    }

    const geoData = MapStateManager.geoData;

    // 过滤：起点和终点都在当前区域内的线条
    return lines.filter(line => {
      const [startLng, startLat] = line.startCoordinate;
      const [endLng, endLat] = line.endCoordinate;

      const fromInRegion = GeoUtils.isPointInGeoJSON(
        startLng,
        startLat,
        geoData,
      );
      const toInRegion = GeoUtils.isPointInGeoJSON(
        endLng,
        endLat,
        geoData,
      );

      // 可以根据需求调整过滤策略：
      // 1. 两端都在区域内：fromInRegion && toInRegion
      // 2. 至少一端在区域内：fromInRegion || toInRegion
      return fromInRegion && toInRegion;
    });
  }

  /**
   * 更新当前层级的点位和线条
   */
  private updatePointsAndLinesForCurrentLevel(): void {
    // 过滤并更新点位
    if (MapStateManager.allPoints.length > 0) {
      const filteredPoints = this.filterPointsByCurrentLevel(MapStateManager.allPoints);
      void this.instance.setPoints(filteredPoints);
    }

    // 过滤并更新线条
    if (MapStateManager.allLines.length > 0) {
      const filteredLines = this.filterLinesByCurrentLevel(MapStateManager.allLines);
      void this.instance.setLines(filteredLines);
    }
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
