import { CHINA_AD_CODE_JUST_FOR_FE, G2, JUST_SUPPORTED_NEXT_LEVEL_COUNTRIES_AD_CODE, US_AD_CODE_JUST_FOR_FE } from "../constants";
import { POST_CODE_KEY } from "../echarts-geo/echart.option";
import MapStateManager from "../MapStateManager";
import { MapLevel } from "@orch-map/types";
import { isMunicipality } from "./geo.helper";

export class GeoUtils {


  /**
   * 检查地图入口资格，确定是否可以进入下一级地图
   * @param params - 事件参数，包含区域名称等信息
   * @returns 下一级地图层级，如果无法进入则返回 undefined
   */
  public static checkMapEntryEligibility(): MapLevel | undefined {
    switch (MapStateManager.curLevel) {
      case MapLevel.WORLD: {
        return MapLevel.COUNTRY;
      }
      case MapLevel.COUNTRY: {
        return MapLevel.PROVINCE;
      }
      case MapLevel.PROVINCE:
        return MapLevel.CITY;
      case MapLevel.CITY:
        if (!isMunicipality(MapStateManager.postcode)) {
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
  public static getPostCodeByGeoFeatures(name: string): string {
    const detailGeojson = MapStateManager.geoData;
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

    const currentMapIsChina = GeoUtils.getCurrentMapIsChina();
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
   * 获取当前地图是否为中国地图
   * @returns 是否为中国地图
   */
  public static getCurrentMapIsChina(): boolean {
    return MapStateManager.country === "China";
  }

  /**
   * 获取下一级地图的行政区划代码
   * @param params - 事件参数
   * @param detailGeojson - 详细地理数据
   * @returns 下一级行政区划代码
   */
  public static getNextPostcode(name: string): string {
    let nextPostcode = "";
    if (MapStateManager.curLevel === MapLevel.WORLD) {
      if (name === G2.CHINA) {
        nextPostcode = CHINA_AD_CODE_JUST_FOR_FE;
      } else if (name === G2.USA) {
        nextPostcode = US_AD_CODE_JUST_FOR_FE;
      } else {
        nextPostcode = GeoUtils.getPostCodeByGeoFeatures(name || "");
      }
    } else {
      nextPostcode = GeoUtils.getPostCodeByGeoFeatures(name || "");
    }
    return nextPostcode;
  }

  /**
   * 检查是否支持下一级地图
   * @param nextLevel - 下一级地图层级
   * @returns 是否支持
   */
  public static isNextLevelSupported(nextLevel: MapLevel): boolean {
    if (MapStateManager.curLevel === MapLevel.COUNTRY && nextLevel === MapLevel.PROVINCE) {
      return JUST_SUPPORTED_NEXT_LEVEL_COUNTRIES_AD_CODE.includes(MapStateManager.postcode);
    }
    return true;
  }
}
