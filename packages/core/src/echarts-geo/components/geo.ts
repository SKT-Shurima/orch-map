import { MapLevel, type Feature, type FeatureCollection, type GeoJSONSourceInput, type GeoJSON } from "@orch-map/types";
import type { GeoComponentOption } from "echarts";
import * as echarts from "echarts/core";
import { GeoJsonUtils } from "@orch-map/utils";
import MapStateManager from "../../MapStateManager";
import { getCenterAndZoomByGeometryCoordinates } from "../../utils/geo.helper";
import type { GEOParam, PointSeriesDataItem } from "../types";
import { GeoUtils } from "../../utils/geo.utils";
import { US_AD_CODE_JUST_FOR_FE } from "../../constants";


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
    scaleLimit: {
      min: 0.1,
      max: 10,
    },
    layoutCenter: ["50%", "50%"],
    layoutSize: "80%",
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
    const postcode = MapStateManager.postcode;

    switch (level) {
      case MapLevel.WORLD:
        return "world";
      case MapLevel.COUNTRY:
        return country === "China" ? "china" : "usa";
      case MapLevel.PROVINCE:
        return `province-${postcode}`;
      case MapLevel.CITY:
        return `city-${postcode}`;
      case MapLevel.COUNTY:
        return `county-${postcode}`;
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
    const geoJson = MapStateManager.geoData;

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
    const options = chartInstance.getOption();
    const geo = options.geo as GeoComponentOption[] | undefined;
    if (geo && geo.length > 0) {
      geo[0].map = GeoComponent.generateMapName();
      geo[0].center = center ?? geo[0].center;
      geo[0].zoom = scale || (isWorld ? 1.3 : 1);
      geo[0].itemStyle = {
        ...geo[0].itemStyle,
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
   * 注册地图到 ECharts
   * @param geoJson - 地理数据
   */
  public static registerMap(geoJson: GeoJSON): void {
    const mapName = GeoComponent.generateMapName();
    echarts.registerMap(mapName, geoJson as GeoJSONSourceInput);
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
      const isInRegion = GeoJsonUtils.checkPointInFeature(coordinates, hoverFeature);
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
    const currentMapIsChina = GeoUtils.getCurrentMapIsChina();
    if (currentMapIsChina) {
      return false;
    }

    if (MapStateManager.curLevel === MapLevel.COUNTRY && MapStateManager.postcode === US_AD_CODE_JUST_FOR_FE) {
      return false;
    }

    return true;
  }
}
