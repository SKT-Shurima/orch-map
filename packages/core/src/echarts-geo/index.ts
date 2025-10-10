import { MapLevel, type AnyObj, type BaseMapPoint, type BaseMapLine, type GeoJSON, Feature, FeatureCollection, GeoJSONSourceInput } from "@orch-map/types";
import { debounce, findFirstKeyByValue, GeoJsonUtils, isEmptyArray, isUndef } from "@orch-map/utils";
import { CurvatureCalculator } from "../utils/curvatureCalculator";
import { EChartsOption, GeoComponentOption, type SeriesOption } from "echarts";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { GeoComponent, TooltipComponent, TitleComponent } from "echarts/components"; 
import type { IMapRenderer, MapRendererConfig } from "../interfaces/IMapRenderer";
import { ScatterChart, LinesChart } from "echarts/charts";
import MapStateManager from "../MapStateManager"; 

import { BOUNDARY_OPTIONS, POST_CODE_KEY } from "./echart.option";
import { type GEOParam } from "./types";
import { PointTypeEnum, type PointParam, type PointSeries, type PointSeriesDataItem } from "./types/node.type";
import { getCenterAndZoomByGeometryCoordinates } from "../utils/geo.helper";
import EChartsGeoUtils from "../utils/echartsGeoUtils";
import { AdapterParams } from "../interfaces";

// 注册必要的 ECharts 组件
echarts.use([CanvasRenderer, GeoComponent, TooltipComponent, TitleComponent,ScatterChart, LinesChart]);

// 常量与工具
/** 国家名称常量 */
const G2 = { CHINA: "中国", USA: "美国" } as const;

/** 中国行政区划代码 */
const CHINA_AD_CODE_JUST_FOR_FE = "100000";

/** 美国行政区划代码 */
const US_AD_CODE_JUST_FOR_FE = "us";

/** 直辖市代码集合（北京、天津、上海、重庆） */
const MUNICIPALITY_CODES = new Set(["110000", "120000", "310000", "500000"]);

/**
 * 判断是否为直辖市
 * @param adcode - 行政区划代码
 * @returns 是否为直辖市
 */
const isMunicipality = (adcode: string): boolean => MUNICIPALITY_CODES.has(adcode);

/** 支持下一级地图的国家代码列表 */
const JUST_SUPPORTED_NEXT_LEVEL_COUNTRIES_AD_CODE = [CHINA_AD_CODE_JUST_FOR_FE, US_AD_CODE_JUST_FOR_FE];


/**
 * ECharts 地图事件接口
 * @template T - 点数据的业务信息类型
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
 * @template T - 点数据的业务信息类型
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
  private chartInstance: echarts.ECharts | null = null;
  
  /** 图表系列配置 */
  private series: SeriesOption[] = [];
  
  /** 边界数据加载状态 */
  private boundaryLoading = false;
  
  /** 地图渲染器配置 */
  private config: MapRendererConfig;
  
  /** 状态管理器取消订阅函数 */
  private unsubscribeState: (() => void) | null = null;

  /** 曲率计算器实例 */
  private curvatureCalculator: CurvatureCalculator = new CurvatureCalculator();

  /**
   * 构造函数
   * @param container - 地图容器，可以是 DOM 元素或元素 ID 字符串
   * @param options - 地图配置选项，支持 EchartsMapOptions 或 MapRendererConfig 格式
   * @throws {Error} 当通过 ID 查找容器元素失败时抛出错误
   */
  public constructor(
    container: HTMLElement | string, 
    options: EchartsMapOptions | MapRendererConfig,
    geoJson: GeoJSONSourceInput,
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
    this.initChart(geoJson).catch(error => {
      console.error(error);
    });
    this.registerEvents();
  }

  //=== 计算属性与辅助方法 ===//

  /**
   * 获取当前地图是否为中国地图
   * @returns 是否为中国地图
   */
  private get currentMapIsChina(): boolean {
    return MapStateManager.country === CHINA_AD_CODE_JUST_FOR_FE;
  }

  /**
   * 获取当前详细地图的 GeoJSON 数据
   * @returns 当前地图的 FeatureCollection 数据
   */
  private get detailGeojson(): GeoJSONSourceInput {
    return (echarts.getMap(this.detailMap)?.geoJson ?? {});
  }

  //=== 初始化方法 ===//

  /**
   * 初始化 ECharts 图表实例
   * @private
   */
  private async initChart(geoJson:GeoJSONSourceInput ): Promise<void> {
    if (!this.container) {
      return;
    }
    
    // 创建实例
    const instance = echarts.init(this.container);
    echarts.registerMap("iceland", geoJson);
    this.chartInstance = instance;
    
    const baseOption: EChartsOption = {
      tooltip: {
        show: true,
      },
      geo: {
        map: "iceland",
        zoom: 1.3,
        hoverLayerThreshold: 1, // 修复：允许hover事件触发
        silent: false,
        roam: true,
        center: undefined,
        scaleLimit: { min: 1 },
        zlevel: 0,
        itemStyle: {
          areaColor: "#094777",
          borderWidth: 1,
          borderColor: "#1480C5",
          shadowBlur: 1,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
        emphasis: {
          label: {
            show: false,
          },
          itemStyle: {
            areaColor: "#3079c8",
            borderWidth: 1,
          },
        },
      } as GeoComponentOption,
      series: [
        {
          name: "points",
          type: "scatter",
          coordinateSystem: "geo",
          data: [],
          symbolSize: 10,
          emphasis: {
            label: {
              show: true,
            },
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(255, 255, 255, 0.5)",
            },
          },
          itemStyle: {
            color: "red",
          },
          zlevel: 1,
        },
        {
          name: "lines",
          type: "lines",
          coordinateSystem: "geo",
          data: [],
          lineStyle: {
            color: "blue",
          },
          zlevel: 1,
        },
      ],
    };  
    this.chartInstance?.setOption(baseOption, true);
    
    // 绑定事件处理器
    instance.on("click", (params: any) => this.clickHandler(params)); 
    instance.on("dblclick", (params: any) => this.dbClickHandler(params));
    instance.on("mouseover", (params: any) => this.mouseoverHandler(params));
    instance.on("mouseout", (params: any) => this.mouseoutHandler(params));
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
   * 生成地图名称
   * @returns 地图名称字符串
   * @private
   */
  private generateMapName(): string {
    const level = MapStateManager.curLevel;
    const country = MapStateManager.country;
    const adcode = MapStateManager.adcode;
    
    switch (level) {
      case MapLevel.WORLD:
        return "world";
      case MapLevel.COUNTRY:
        return country === "100000" ? "china" : "usa";
      case MapLevel.PROVINCE:
        return `province-${adcode}`;
      case MapLevel.CITY:
        return `city-${adcode}`;
      case MapLevel.COUNTY:
        return `county-${adcode}`;
      default:
        return "default";
    }
  }

  /**
   * 设置 ECharts 图表配置选项
   * @param option - ECharts 配置选项
   * @private
   */
  private setChartOption(option: unknown): void {
    if (!this.chartInstance) return;
    this.chartInstance.setOption(option as EChartsOption);
  }

  /**
   * 设置地理数据并更新地图显示
   * @param boundary - 边界地理数据
   * @public
   */
  public setGEOData(boundary: GeoJSON): void {
    // 生成地图名称并准备基础配置
    const mapName = this.generateMapName();
    // 注册地图并设置选项
    const geojson = MapStateManager.geoData;
    echarts.registerMap(mapName, geojson as GeoJSONSourceInput);

    if (!boundary || boundary.type !== "FeatureCollection" || !boundary.features || !Array.isArray(boundary.features) ) { 
      this.boundaryLoading = false;
      return;
    }

    let center: [number, number] | null = null;
    let scale = 1;

    // 根据不同地图层级计算中心点和缩放比例
    if (MapStateManager.curLevel === MapLevel.WORLD) {
      if (this.centralCountry && boundary.type === "FeatureCollection") {
        const feature = boundary.features.find((item: any) => item.id === this.centralCountry);
        const targetCoordinates = (feature?.geometry && "coordinates" in feature.geometry) ? feature.geometry.coordinates : [];
        const { center: c, zoom: z } = getCenterAndZoomByGeometryCoordinates(targetCoordinates);
        scale = z;
        center = c;
      }
    } else if (MapStateManager.curLevel !== MapLevel.COUNTRY && boundary.type === "FeatureCollection") {
      const targetCoordinates = boundary.features.map((item: any) => 
        ("coordinates" in item.geometry) ? item.geometry.coordinates : [],
      );
      const { center: c } = getCenterAndZoomByGeometryCoordinates(targetCoordinates);
      center = c;
    }

    const isWorld = MapStateManager.curLevel === MapLevel.WORLD;
    const options = this.chartInstance?.getOption() as EChartsOption;
    if (options) {
      const geoOption = {
        ...BOUNDARY_OPTIONS,
        map: mapName,
        center,
        zoom: scale || (isWorld ? 1.3 : 1),
        itemStyle: {
          ...BOUNDARY_OPTIONS.itemStyle,
          borderWidth: 1,
          shadowBlur: 0,
        },
      };
      options.geo = geoOption as GeoComponentOption;
      this.chartInstance?.setOption(options, true);
    }
    
    this.boundaryLoading = false;
    
    // 触发地理数据更新事件
    // if (this.config.events && 'onUpdateGeo' in this.config.events && this.config.events.onUpdateGeo) {
    //   this.config.events.onUpdateGeo(boundary)
    // }
  }

  /**
   * 规范化地理数据格式
   * @param data - 地理数据
   * @returns 标准化的 FeatureCollection 数据
   * @private
   */
  private normalizeGeoData(data: GeoJSONSourceInput): FeatureCollection {
    // 如果已经是 GeoJsonData 格式，直接返回
    if (typeof data === "object" && data !== null && "type" in data && data.type === "FeatureCollection") {
      return data as FeatureCollection;
    }
    // 如果是字符串，需要先解析（这里假设外部已经处理过）
    if (typeof data === "string") {
      throw new Error("String GeoJSON data should be parsed before calling normalizeGeoData");
    }
    return data as FeatureCollection;
  }

  /**
   * 将点数据转换为 ECharts Series
   * @param points - 点数据数组
   * @returns ECharts 系列配置数组
   * @private
   */
  private convertPointsToSeries(points: BaseMapPoint[]): SeriesOption[] {
    const scatterData = points.map(point => ({
      name: point.name ?? "",
      value: [...point.coordinate, point.value ?? 0],
      businessInfo: point,
      itemStyle: point.style ? {
        color: point.style.color,
        opacity: point.style.opacity,
      } : undefined,
    }));

    return [{
      name: "points",
      type: PointTypeEnum.SCATTER,
      coordinateSystem: "geo",
      data: scatterData,
      symbolSize: (val: any) => {
        const point = val[2] ?? 10;
        return Math.sqrt(point) * 2;
      },
      label: {
        show: false,
      },
      emphasis: {
        label: {
          show: true,
          position: "right",
        },
      },
    }];
  }

  /**
   * 将线数据转换为 ECharts Series
   * @param lines - 线数据数组
   * @returns ECharts 系列配置数组
   * @private
   */
  private convertLinesToSeries(lines: BaseMapLine[]): SeriesOption[] {
    const lineData = lines.map(line => {
      // 计算曲率值
      const curvature = this.curvatureCalculator.calculateCurvatureByCoordinates(
        line.id,
        line.startCoordinate,
        line.endCoordinate,
      );

      // 根据曲率生成曲线路径点
      const curvedCoords = this.generateCurvedPath(
        line.startCoordinate,
        line.endCoordinate,
        curvature,
      );

      return {
        coords: curvedCoords,
        businessInfo: line,
        lineStyle: line.color ? {
          color: line.color?.toString(),
          width: line.width ?? 2,
          opacity: line.opacity ?? 1,
        } : undefined,
      };
    });

    return [{
      name: "lines",
      type: "lines",
      coordinateSystem: "geo",
      data: lineData,
      large: true,
      effect: {
        show: true,
        period: 6,
        trailLength: 0.7,
        symbolSize: 3,
      },
      lineStyle: {
        width: 2,
        opacity: 0.6,
      },
    }];
  }

  /**
   * 根据曲率生成曲线路径点
   * @param startCoord - 起点坐标 [lng, lat]
   * @param endCoord - 终点坐标 [lng, lat]
   * @param curvature - 曲率值 (0-1)
   * @returns 曲线路径点数组
   * @private
   */
  private generateCurvedPath(
    startCoord: [number, number],
    endCoord: [number, number],
    curvature: number,
  ): [number, number][] {
    const [startLng, startLat] = startCoord;
    const [endLng, endLat] = endCoord;

    // 如果曲率为0或起点终点相同，返回直线
    if (curvature === 0 || (startLng === endLng && startLat === endLat)) {
      return [startCoord, endCoord];
    }

    // 计算中点
    const midLng = (startLng + endLng) / 2;
    const midLat = (startLat + endLat) / 2;

    // 计算控制点，曲率越大，控制点偏离直线越远
    const distance = Math.sqrt(
      Math.pow(endLng - startLng, 2) + Math.pow(endLat - startLat, 2),
    );
    
    // 控制点偏移距离，基于曲率和线段长度
    const offsetDistance = distance * curvature * 0.3;
    
    // 计算垂直于连线的方向向量
    const dx = endLng - startLng;
    const dy = endLat - startLat;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) {
      return [startCoord, endCoord];
    }
    
    // 单位向量
    const unitX = dx / length;
    const unitY = dy / length;
    
    // 垂直向量（逆时针旋转90度）
    const perpX = -unitY;
    const perpY = unitX;
    
    // 控制点位置（在中点基础上向垂直方向偏移）
    const controlLng = midLng + perpX * offsetDistance;
    const controlLat = midLat + perpY * offsetDistance;

    // 生成贝塞尔曲线路径点
    const points: [number, number][] = [];
    const segments = Math.max(8, Math.floor(distance * 10)); // 根据距离调整分段数
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = this.quadraticBezier(
        startCoord,
        [controlLng, controlLat],
        endCoord,
        t,
      );
      points.push(point);
    }

    return points;
  }

  /**
   * 二次贝塞尔曲线计算
   * @param p0 - 起点
   * @param p1 - 控制点
   * @param p2 - 终点
   * @param t - 参数 (0-1)
   * @returns 曲线上的点
   * @private
   */
  private quadraticBezier(
    p0: [number, number],
    p1: [number, number],
    p2: [number, number],
    t: number,
  ): [number, number] {
    const x = Math.pow(1 - t, 2) * p0[0] + 2 * (1 - t) * t * p1[0] + Math.pow(t, 2) * p2[0];
    const y = Math.pow(1 - t, 2) * p0[1] + 2 * (1 - t) * t * p1[1] + Math.pow(t, 2) * p2[1];
    return [x, y];
  }

  /**
   * 将系列数据坐标转换为 GeoJSON 投影坐标
   * @param series - ECharts 系列配置数组
   * @returns 转换后的系列配置数组
   * @private
   */
  // private transSeriesCoordinate2GeoJsonXY(series: SeriesOption[]): SeriesOption[] {
  //   // @ts-ignore
  //   const transform = this.detailGeojson["hc-transform"]
  //   if (!transform) {
  //     return series
  //   }
    
  //   return series.map(item => {
  //     let data
  //     if (item.type === PointTypeEnum.SCATTER || item.type === PointTypeEnum.EFFECT_SCATTER) {
  //       data = (item.data as PointSeriesDataItem<AnyObj>[]).map(point => {
  //         if (!Array.isArray(point.value)) {
  //           return point
  //         }
  //         return {
  //           ...point,
  //           value: GeoJsonUtils.lngLatToProjected(transform, point.value as CoordinateNumber),
  //         }
  //       })
  //     } else if (item.type === "lines") {
  //       data = (item.data as LineSeriesDataItem<AnyObj>[]).map(line => {
  //         if (!line.coords || line.coords.length < 2) {
  //           return line
  //         }
  //         const [startCoords, endCoords] = line.coords
  //         return {
  //           ...line,
  //           coords: [
  //             GeoJsonUtils.lngLatToProjected(transform, startCoords), 
  //             GeoJsonUtils.lngLatToProjected(transform, endCoords)
  //           ],
  //         }
  //       })
  //     }
  //     return {
  //       ...item,
  //       data: data || item.data,
  //     } as SeriesOption
  //   })
  // }

  /**
   * 将 PointParam 参数转换为 BaseMapPoint 格式
   * @param params - 点参数
   * @returns 转换后的 BaseMapPoint 对象
   * @private
   */
  private transPointParam2BaseMapPoint(params: PointParam<T>): BaseMapPoint {
    return {
      id: (params.data.businessInfo as { id?: string } | undefined)?.id ?? "",
      coordinate: Array.isArray(params.data.value) ? 
        [params.data.value[0], params.data.value[1]] as [number, number] : 
        [0, 0],
      name: params.data.name,
    };
  }

  //=== 事件处理方法 ===//

  /**
   * 鼠标悬停事件处理器
   * @param params - 事件参数，包含组件类型和相关信息
   * @private
   */
  private mouseoverHandler = (params: PointParam<T> | GEOParam) => {
    if (!params?.componentType) {
      return;
    }
    
    switch (params.componentType) {
      case "geo":
        this.handleChangeArea(params);
        break;
      case "series":
        if (this.config.events?.onPointHover) {
          this.config.events.onPointHover(this.transPointParam2BaseMapPoint(params));
        }
        break;
      default:
        if (this.config.events?.onAreaHover) {
          this.config.events.onAreaHover(params as GEOParam);
        }
        break;
    }
  };

  /**
   * 鼠标移出事件处理器
   * @param params - 事件参数，包含组件类型和相关信息
   * @private
   */
  private mouseoutHandler = (params: PointParam<T> | GEOParam) => {
    if (!params?.componentType) {
      return;
    }
    
    switch (params.componentType) {
      case "geo":
        this.handleChangeArea();
        break;
      case "series":
        // 可以添加点移出的逻辑
        break;
      default:
        this.handleChangeArea();
        break;
    }
  };

  /**
   * 点击事件处理器
   * @param params - 事件参数，包含组件类型和相关信息
   * @private
   */
  private clickHandler = (params: PointParam<T> | GEOParam) => {
    if (!params?.event?.event || !params.componentType) {
      return;
    }
    
    params.event.event.stopPropagation();
    
    if (params.componentType === "geo") {
      if (this.config.events?.onAreaClick) {
        this.config.events.onAreaClick(params);
      }
      return;
    }

    if (
      params.componentType === "series" &&
      (params.componentSubType === PointTypeEnum.SCATTER || params.componentSubType === PointTypeEnum.EFFECT_SCATTER) &&
      this.config.events?.onPointClick
    ) {
      this.config.events.onPointClick(this.transPointParam2BaseMapPoint(params));
    }
  };

  /**
   * 双击事件处理器（用于地图层级切换）
   * @param params - 事件参数，包含组件类型和区域信息
   * @private
   */
  private dbClickHandler = (params: PointParam<T> | GEOParam) => {
    if (!params?.event?.event || !params.componentType) {
      return;
    }
    
    params.event.event.stopPropagation();
    
    if (params.componentType === "geo") {
      const nextLevel = this.checkMapEntryEligibility(params);
      if (isUndef(nextLevel)) {
        return;
      }

      // 检查是否支持下一级地图
      if (
        MapStateManager.curLevel === MapLevel.COUNTRY &&
        nextLevel === MapLevel.PROVINCE &&
        !JUST_SUPPORTED_NEXT_LEVEL_COUNTRIES_AD_CODE.includes(MapStateManager.adcode)
      ) {
        return;
      }

      // 获取下一级地图的行政区划代码
      let nextAdCode = "";
      if (MapStateManager.curLevel === MapLevel.WORLD) {
        if (params.name === G2.CHINA) {
          nextAdCode = CHINA_AD_CODE_JUST_FOR_FE;
        } else if (params.name === G2.USA) {
          nextAdCode = US_AD_CODE_JUST_FOR_FE;
        } else {
          nextAdCode = this.getPostCodeByGeoFeatures(params.name);
        }
      } else {
        nextAdCode = this.getPostCodeByGeoFeatures(params.name);
      }
      
      // 确保 region 对象存在
      if (!params.region) {
        params.region = { name: params.name || "" };
      }
      
      params.region.adcode = nextAdCode;
      
      // 触发双击区域事件
      if (this.config.events?.onAreaDoubleClick) {
        this.config.events.onAreaDoubleClick(params);
      }
      
      // 更新状态管理器
      MapStateManager.curLevel = nextLevel ?? MapLevel.WORLD;
      MapStateManager.adcode = nextAdCode;
      MapStateManager.country = params.region.name ?? "";
      
      // 加载新的地理数据
      MapStateManager.getGeoJsonData({
        mapLevel: nextLevel ?? MapLevel.WORLD,
        country: params.region.name ?? "",
        region: nextAdCode,
      }).then((result) => {
        MapStateManager.setGeoData(result);
      }).catch(error => {
        console.error("加载地理数据失败:", error);
      });
    }
  };

  /**
   * 检查地图入口资格，确定是否可以进入下一级地图
   * @param params - 事件参数，包含区域名称等信息
   * @returns 下一级地图层级，如果无法进入则返回 undefined
   * @private
   */
  private checkMapEntryEligibility(params: PointParam<T> | GEOParam): MapLevel | undefined {
    switch (MapStateManager.curLevel) {
      case MapLevel.WORLD: {
        return MapLevel.COUNTRY;
      }
      case MapLevel.COUNTRY: {
        if (params.name === "南海诸岛") {
          return undefined;
        }
        return MapLevel.PROVINCE;
      }
      case MapLevel.PROVINCE:
        return MapLevel.CITY;
      case MapLevel.CITY:
        if (!isMunicipality(MapStateManager.adcode)) {
          return MapLevel.COUNTY;
        }
        return undefined;
      case MapLevel.COUNTY:
      default:
        return undefined;
    }
  }

  /**
   * 根据地理要素名称获取行政区划代码
   * @param name - 地理要素名称
   * @returns 行政区划代码
   * @private
   */
  private getPostCodeByGeoFeatures(name: string): string {
    const geojson = this.detailGeojson;
    if (typeof geojson === "string" || geojson.type !== "FeatureCollection") {
      return "";
    }
    const features = geojson.features;
    if (!Array.isArray(features)) {
      return "";
    }
    
    const target = features.find((item: any) => item.properties?.name === name);
    if (!target) {
      return "";
    }
    
    if (this.currentMapIsChina) {
      const props = target.properties as { adcode?: string } | undefined;
      return props?.adcode ? String(props.adcode) : "";
    }
    
    const props = target.properties as Record<string, unknown> | undefined;
    if (!props) {
      return "";
    }
    
    const code = props[POST_CODE_KEY];
    return typeof code === "string" ? code : "";
  }

  /**
   * 处理区域变化事件的具体实现
   * @param params - 地理参数，包含区域信息
   * @private
   */
  private handleChangeAreaImpl(params?: GEOParam): void {
    // 当没有参数时，触发区域悬停事件并返回（清空区域高亮）
    if (!params) {
      if (this.config.events?.onAreaHover) {
        this.config.events.onAreaHover(params);
      }
      return;
    }

    // 获取当前图表选项中的系列数据
    type SeriesLike = { type?: string; data?: unknown; name?: string }
    const option = this.chartInstance?.getOption() as { series?: SeriesLike[] } | undefined;
    if (!option?.series) {
      return;
    }

    // 查找散点类型的系列数据
    const pointSeries = option.series.find(item => item.type === PointTypeEnum.SCATTER);
    if (!pointSeries) {
      // 没有散点系列也要触发区域悬停事件
      if (this.config.events?.onAreaHover) {
        this.config.events.onAreaHover(params);
      }
      return;
    }

    // 提取散点数据
    const points = pointSeries.data as PointSeriesDataItem<T>[] | undefined;
    
    // 找到悬停区域对应的地理要素
    const geojson = this.detailGeojson;
    if (typeof geojson === "string" || geojson.type !== "FeatureCollection") {
      // 当点数据或悬停要素不存在时，仅触发一次区域悬停事件
      if (this.config.events?.onAreaHover) {
        this.config.events.onAreaHover(params);
      }
      return;
    }
    const features = geojson.features;
    if (!Array.isArray(points) || !Array.isArray(features)) {
      // 当点数据或悬停要素不存在时，仅触发一次区域悬停事件
      if (this.config.events?.onAreaHover) {
        this.config.events.onAreaHover(params);
      }
      return;
    }
    
    const hoverFeature = features.find((item: any) => item.properties?.name === params.name) as Feature | undefined;
    // 若未找到对应要素，则调一次区域悬停事件
    if (!hoverFeature) {
      if (this.config.events?.onAreaHover) {
        this.config.events.onAreaHover(params);
      }
      return;
    }

    // 记录在当前区域内的点（基于 siblingPointId 去判断业务逻辑）
    const pointsInRegion: string[] = [];
    points.forEach((point: PointSeriesDataItem<T>) => {
      const coordinates = point.value;
      const isInRegion = this.checkPointInFeature(coordinates, hoverFeature);
      // 如果该点在悬停区域内，并且有 siblingPointId 业务字段，则收集之
      if (
        isInRegion &&
        point.businessInfo &&
        typeof point.businessInfo === "object" &&
        "siblingPointId" in point.businessInfo
      ) {
        const ids = point.businessInfo.siblingPointId;
        if (Array.isArray(ids)) {
          pointsInRegion.push(...ids);
        }
      }
    });

    // 触发区域悬停事件，将区域信息与区域内点列表一起回调
    if (this.config.events?.onAreaHover) {
      this.config.events.onAreaHover(params);
    }
  }

  /**
   * 检查点是否在指定地理要素内
   * @param coordinates - 点坐标 [经度, 纬度]
   * @param feature - 地理要素
   * @returns 点是否在要素内
   * @private
   */
  private checkPointInFeature(coordinates: [number, number], feature: Feature): boolean {
    if (feature.geometry.type === "Polygon") {
      return this.checkPointInPolygon(coordinates, feature.geometry.coordinates as number[][][]);
    }

    if (feature.geometry.type === "MultiPolygon") {
      return (feature.geometry.coordinates as number[][][][]).some(
        (polygon: number[][][]) => this.checkPointInPolygon(coordinates, polygon),
      );
    }

    return false;
  }

  /**
   * 检查点是否在多边形内（支持带洞的多边形）
   * @param coordinates - 点坐标 [经度, 纬度]
   * @param polygonRings - 多边形环数组，第一个是外环，其余是内环（洞）
   * @returns 点是否在多边形内
   * @private
   */
  private checkPointInPolygon(coordinates: [number, number], polygonRings: number[][][]): boolean {
    return polygonRings.some((ring, index) => {
      const isInRing = GeoJsonUtils.isPointInPolygon(coordinates, ring);
      // 如果是外环，需要点在其中才算 true；如果是内环（洞），则点必须 不 在其中才算 true
      // 仅当满足 外环内 && 不在任何内环 才能最终判断为在多边形中
      return index === 0 ? isInRing : !isInRing;
    });
  }

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
    if (this.currentMapIsChina) {
      const option: EChartsOption = { series };
      this.setChartOption(option);
    } else {
      if (MapStateManager.curLevel === MapLevel.COUNTRY && MapStateManager.adcode === US_AD_CODE_JUST_FOR_FE) {
        const option: EChartsOption = { series };
        this.setChartOption(option);
      } else {
        // const newSeries = this.transSeriesCoordinate2GeoJsonXY(series)
        const option: EChartsOption = { series };
        this.setChartOption(option);
      }
    }
  };

  /**
   * 在 ECharts 中为指定系列设置点样式
   * @param targetSeriesName - 目标系列名称
   * @param processFn - 处理函数，用于修改点数据项
   * @public
   */
  public setPointStyleInternal(targetSeriesName: string, processFn: (dataItem: PointSeriesDataItem<T>) => void): void {
    const currentOption = this.chartInstance?.getOption();
    if (!currentOption || !Array.isArray(currentOption.series)) {
      return;
    }

    const { series } = currentOption;
    const pointSeries = series.find((item: SeriesOption) => item.name === targetSeriesName) as PointSeries<T>;
    if (!pointSeries || !Array.isArray(pointSeries.data)) {
      return;
    }

    // 对每个点项进行处理
    pointSeries.data.forEach(item => {
      processFn(item);
    });

    // 重新设置图表选项
    const newOption: EChartsOption = { series };
    this.setChartOption(newOption);
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
    const geo = newOption.geo as AnyObj[] | undefined;
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

    const chart = this.chartInstance as { getOption?: () => AnyObj };
    const currentOption = chart.getOption?.();
    if (!currentOption) return;

    const geo = (currentOption.geo as AnyObj[]) || [];
    const hasInitializedGeo = Array.isArray(geo) && geo[0]?.map;
    if (!hasInitializedGeo) {
      return;
    }

    // 世界层级时去掉边界
    const isWorld = curLevel === MapLevel.WORLD;
    const option = {
      geo: {
        itemStyle: {
          ...BOUNDARY_OPTIONS.itemStyle,
          borderWidth: isWorld ? 0 : 1,
          shadowBlur: isWorld ? 1 : 0,
        },
      },
    } as EChartsOption;
    this.setChartOption(option);
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
    this.updateSeriesImpl(series).catch(console.error);
  }, 300);
  
  /**
   * 区域变化处理方法（防抖，600ms 延迟）
   * @param params - GEO参数
   * @private
   */
  private handleChangeArea = debounce((...args: unknown[]) => {
    const params = args[0] as GEOParam | undefined;
    this.handleChangeAreaImpl(params);
  }, 600);

  /**
   * # 更新地图上的点位
   * 该方法会移除旧的点位系列，然后添加新的点位系列
   * @param points 点位数组
   */
  public setPoints(points: BaseMapPoint[],adapterParams: AdapterParams, iconMapIds: Record<string, string[]> = {}) {
    if (!this.chartInstance) return;
    const mapOption = this.chartInstance.getOption() as EChartsOption;
    const series = mapOption.series as SeriesOption[];
    const pointData = points.map(point => {
      const processedPoint = EChartsGeoUtils.processPoint(point, adapterParams);
      const iconKey = findFirstKeyByValue(iconMapIds, point.id) ?? "";  
      processedPoint.symbol = MapStateManager.extraSvgIcons[iconKey] ?? "";
      return processedPoint;
    });
    const updatedSeries = series?.map(item => {
      if (item.type === PointTypeEnum.SCATTER) {
        return {
          ...item,
          data: pointData,
        } as SeriesOption;
      }
      return item;
    });
    mapOption.series = updatedSeries;
    this.chartInstance.setOption(mapOption,true);
  }


  /**
   * 在 ECharts 中更新线数据
   * @param lines - 线数据数组
   * @public
   */
  public async setLines(lines: BaseMapLine[]): Promise<void> {
    if (!this.chartInstance) return;
    
    const mapOption = this.chartInstance.getOption() as EChartsOption;
    const series = this.convertLinesToSeries(lines);
    mapOption.series = series;
    this.chartInstance.setOption(mapOption);
  }

  /**
   * 设置地理数据（IMapRenderer 接口实现）
   * @param boundary - 地理边界数据
   * @public
   */
  public async setGeoData(boundary: GeoJSONSourceInput): Promise<void> {
    if (!this.chartInstance) return;

    const geoData = this.normalizeGeoData(boundary);
    // 更新状态管理器
    MapStateManager.setGeoData(geoData);
  }


  /**
   * 设置点样式（IMapRenderer 接口实现）
   * @param seriesName - 系列名称
   * @param styleProcessor - 样式处理函数
   * @public
   */
  public setPointStyle(seriesName: string, styleProcessor: (point: BaseMapPoint) => void): void {
    if (!this.chartInstance) return;
    
    this.setPointStyleInternal(seriesName, (dataItem: PointSeriesDataItem<T>) => {
      // 将点数据转换为 BaseMapPoint，给外部的 styleProcessor 处理
      const tempParam: PointParam<T> = {
        name: dataItem.name,
        componentType: "series",
        componentSubType: "scatter",
        seriesName,
        seriesType: PointTypeEnum.SCATTER,
        componentIndex: 0,
        event: { event: {} },
        geoIndex: 0,
        data: dataItem,
      };
      const baseMapPoint = this.transPointParam2BaseMapPoint(tempParam);
      styleProcessor(baseMapPoint);
      
      // 同时将修改结果写回 dataItem
      if (baseMapPoint.style) {
        dataItem.itemStyle = {
          color: baseMapPoint.style.color,
          opacity: baseMapPoint.style.opacity,
        };
      }
    });
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
