import { MapLevel, type GeoJSON, Feature, FeatureCollection, GeoJSONSourceInput } from "@orch-map/types";
import { GeoJsonUtils } from "@orch-map/utils";
import { EChartsOption, GeoComponentOption } from "echarts";
import * as echarts from "echarts/core";
import MapStateManager from "../../MapStateManager";
import { getCenterAndZoomByGeometryCoordinates } from "../../utils/geo.helper";
import { POST_CODE_KEY } from "../echart.option";
import { type GEOParam } from "../types";
import { type PointParam, type PointSeriesDataItem } from "../types/node.type";

/**
 * 国家名称常量
 */
const G2 = { CHINA: "中国", USA: "美国" } as const;

/**
 * 中国行政区划代码
 */
const CHINA_AD_CODE_JUST_FOR_FE = "100000";

/**
 * 美国行政区划代码
 */
const US_AD_CODE_JUST_FOR_FE = "us";

/**
 * 直辖市代码集合（北京、天津、上海、重庆）
 */
const MUNICIPALITY_CODES = new Set(["110000", "120000", "310000", "500000"]);

/**
 * 支持下一级地图的国家代码列表
 */
const JUST_SUPPORTED_NEXT_LEVEL_COUNTRIES_AD_CODE = [CHINA_AD_CODE_JUST_FOR_FE, US_AD_CODE_JUST_FOR_FE];

/**
 * 判断是否为直辖市
 * @param adcode - 行政区划代码
 * @returns 是否为直辖市
 */
const isMunicipality = (adcode: string): boolean => MUNICIPALITY_CODES.has(adcode);

/**
 * 地理组件静态工具类
 * 提供地图相关的工具方法和常量
 */
export default class GeoComponent {

  public static defaultGeoOption: GeoComponentOption = {
    map: "",
    zoom: 1.3,
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
    tooltip: {
      show: false,
    },
  };

  /**
   * 生成地图名称
   * @returns 地图名称字符串
   */
  public static generateMapName(): string {
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
   * 更新地理组件选项
   * @param chartInstance - ECharts 实例
   * @param centralCountry - 中心国家代码
   */
  public static updateGeoOption(chartInstance: echarts.ECharts | null, centralCountry?: string): void {
    if (!chartInstance) return;

    let center: [number, number] | null = null;
    let scale = 1;
    const geoJson = MapStateManager.geoData as GeoJSON;

    // 根据不同地图层级计算中心点和缩放比例
    if (MapStateManager.curLevel === MapLevel.WORLD) {
      if (centralCountry && geoJson.type === "FeatureCollection") {
        const feature = geoJson.features.find((item: Feature) => item.id === centralCountry);
        const targetCoordinates = (feature?.geometry && "coordinates" in feature.geometry) ? feature.geometry.coordinates : [];
        const { center: c, zoom: z } = getCenterAndZoomByGeometryCoordinates(targetCoordinates);
        scale = z;
        center = c;
      }
    } else if (MapStateManager.curLevel !== MapLevel.COUNTRY && geoJson.type === "FeatureCollection") {
      const targetCoordinates = geoJson.features.map(item =>
        ("coordinates" in item.geometry) ? item.geometry.coordinates : [],
      );
      const { center: c } = getCenterAndZoomByGeometryCoordinates(targetCoordinates);
      center = c;
    }

    const isWorld = MapStateManager.curLevel === MapLevel.WORLD;
    const options = chartInstance.getOption() as EChartsOption;
    const geo = options.geo as GeoComponentOption;
    if (geo) {
      geo.map = this.generateMapName();
      geo.center = center ?? geo.center;
      geo.zoom = scale || (isWorld ? 1.3 : 1);
      geo.itemStyle = {
        ...geo.itemStyle,
      };
      options.geo = geo;
      chartInstance.setOption(options, true);
    }
  }

  /**
   * 规范化地理数据格式
   * @param data - 地理数据
   * @returns 标准化的 FeatureCollection 数据
   */
  public static normalizeGeoData(data: GeoJSONSourceInput): FeatureCollection {
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
   * 检查地图入口资格，确定是否可以进入下一级地图
   * @param params - 事件参数，包含区域名称等信息
   * @returns 下一级地图层级，如果无法进入则返回 undefined
   */
  public static checkMapEntryEligibility<T>(params: PointParam<T> | GEOParam): MapLevel | undefined {
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
   * @param detailGeojson - 详细地理数据
   * @returns 行政区划代码
   */
  public static getPostCodeByGeoFeatures(name: string, detailGeojson: GeoJSONSourceInput): string {
    if (typeof detailGeojson === "string" || detailGeojson.type !== "FeatureCollection") {
      return "";
    }
    const features = detailGeojson.features;
    if (!Array.isArray(features)) {
      return "";
    }

    const target = features.find(item => item.properties?.name === name);
    if (!target) {
      return "";
    }

    const currentMapIsChina = MapStateManager.country === CHINA_AD_CODE_JUST_FOR_FE;
    if (currentMapIsChina) {
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
   * 检查点是否在指定地理要素内
   * @param coordinates - 点坐标 [经度, 纬度]
   * @param feature - 地理要素
   * @returns 点是否在要素内
   */
  public static checkPointInFeature(coordinates: [number, number], feature: Feature): boolean {
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
   */
  public static checkPointInPolygon(coordinates: [number, number], polygonRings: number[][][]): boolean {
    return polygonRings.some((ring, index) => {
      const isInRing = GeoJsonUtils.isPointInPolygon(coordinates, ring);
      // 如果是外环，需要点在其中才算 true；如果是内环（洞），则点必须 不 在其中才算 true
      // 仅当满足 外环内 && 不在任何内环 才能最终判断为在多边形中
      return index === 0 ? isInRing : !isInRing;
    });
  }

  /**
   * 获取当前地图是否为中国地图
   * @returns 是否为中国地图
   */
  public static getCurrentMapIsChina(): boolean {
    return MapStateManager.country === CHINA_AD_CODE_JUST_FOR_FE;
  }

  /**
   * 获取下一级地图的行政区划代码
   * @param params - 事件参数
   * @param detailGeojson - 详细地理数据
   * @returns 下一级行政区划代码
   */
  public static getNextAdCode<T>(params: PointParam<T> | GEOParam, detailGeojson: GeoJSONSourceInput): string {
    let nextAdCode = "";
    if (MapStateManager.curLevel === MapLevel.WORLD) {
      if (params.name === G2.CHINA) {
        nextAdCode = CHINA_AD_CODE_JUST_FOR_FE;
      } else if (params.name === G2.USA) {
        nextAdCode = US_AD_CODE_JUST_FOR_FE;
      } else {
        nextAdCode = this.getPostCodeByGeoFeatures(params.name || "", detailGeojson);
      }
    } else {
      nextAdCode = this.getPostCodeByGeoFeatures(params.name || "", detailGeojson);
    }
    return nextAdCode;
  }

  /**
   * 检查是否支持下一级地图
   * @param nextLevel - 下一级地图层级
   * @returns 是否支持
   */
  public static isNextLevelSupported(nextLevel: MapLevel): boolean {
    if (MapStateManager.curLevel === MapLevel.COUNTRY && nextLevel === MapLevel.PROVINCE) {
      return JUST_SUPPORTED_NEXT_LEVEL_COUNTRIES_AD_CODE.includes(MapStateManager.adcode);
    }
    return true;
  }

  /**
   * 注册地图到 ECharts
   * @param geoJson - 地理数据
   */
  public static registerMap(geoJson: GeoJSONSourceInput): void {
    const mapName = this.generateMapName();
    echarts.registerMap(mapName, geoJson);
  }

  /**
   * 获取区域内点列表
   * @param params - 地理参数
   * @param detailGeojson - 详细地理数据
   * @param points - 点数据数组
   * @returns 区域内的点ID列表
   */
  public static getPointsInRegion<T>(
    params: GEOParam,
    detailGeojson: GeoJSONSourceInput,
    points: PointSeriesDataItem<T>[],
  ): string[] {
    const pointsInRegion: string[] = [];

    if (typeof detailGeojson === "string" || detailGeojson.type !== "FeatureCollection") {
      return pointsInRegion;
    }

    const features = detailGeojson.features;
    if (!Array.isArray(features)) {
      return pointsInRegion;
    }

    const hoverFeature = features.find(item => item.properties?.name === params.name) as Feature | undefined;
    if (!hoverFeature) {
      return pointsInRegion;
    }

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

    return pointsInRegion;
  }

  /**
   * 检查是否需要投影变换
   * @returns 是否需要投影变换
   */
  public static needsProjectionTransform(): boolean {
    const currentMapIsChina = this.getCurrentMapIsChina();
    if (currentMapIsChina) {
      return false;
    }

    if (MapStateManager.curLevel === MapLevel.COUNTRY && MapStateManager.adcode === US_AD_CODE_JUST_FOR_FE) {
      return false;
    }

    return true;
  }
}
