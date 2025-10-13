import { MapLevel, type AnyObj, type CoordinateNumber, type GeoJSON } from "@orch-map/types";
import { isEmptyArray } from "@orch-map/utils";
import { MUNICIPALITY_CODES } from "../constants";

/**
 * @description: 这些值是根据 geoJSON 数据中的经纬度范围计算出来的
 * 大概得结果是
 * minLng -999
 * maxLng 9851
 * minLat 4668
 * maxLat 9851
 * 所以经度的 delta 是 10850，纬度的 delta 是 5183
 * 这里取 11000 和 5200
 */
const WORLD_DELTA_LNG = 11000;
const WORLD_DELTA_LAT = 5200;

// China postcode used internally for FE logic
const CHINA_POSTCODE_JUST_FOR_FE = "100000";

/**
 * @description: 通过地图中所有点的地理坐标，计算出地图的中心点、经度最小的点，经度最大的点，纬度最小的点，纬度最大的点
 * 经度：lng，纬度：lat
 * TODO: 这里没有考虑到屏幕的极端情况，比如宽度只有100px,高度有120000px
 */
const getMapCenterAndZoom = (
  coordinateList: CoordinateNumber[],
): {
  center: CoordinateNumber | null
  zoom: number
} => {
  if (isEmptyArray(coordinateList)) {
    return {
      center: null,
      zoom: 1,
    };
  }
  const lngList = coordinateList.map(item => item[0]);
  const latList = coordinateList.map(item => item[1]);
  const minLng = Math.min(...lngList);
  const maxLng = Math.max(...lngList);
  const minLat = Math.min(...latList);
  const maxLat = Math.max(...latList);
  const lngScale = WORLD_DELTA_LNG / Math.abs(maxLng - minLng);
  const latScale = WORLD_DELTA_LAT / Math.abs(maxLat - minLat);
  const zoom = Math.min(lngScale, latScale) * 0.8;
  return {
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
    zoom: zoom < 1 ? 1 : zoom,
  };
};

/**
 * @description: 将地图坐标扁平化为 [number, number] 数组
 * 因为在国家地图经纬度数据中，有些地图数据是多层嵌套的，需要将其扁平化为一维数组
 * 以此来找到地图的中心点、及其边界点
 */
const flattenCoordinate = (arr: AnyObj[]): CoordinateNumber[] => {
  const result: [number, number][] = [];
  function flatten(item: AnyObj) {
    if (Array.isArray(item)) {
      if (Array.isArray(item[0]) || typeof item[0] === "object") {
        item.forEach(flatten);
      } else {
        result.push(item as CoordinateNumber);
      }
    }
  }
  arr.forEach(flatten);
  return result;
};

/**
 * @description: 通过地图数据中的 geometry.coordinates 计算出地图的中心点和缩放比例
 */
export const getMapCenterAndZoomByGeometryCoordinates = (geometryCoordinates: AnyObj[]) => {
  // 因为 coordinates 有可能是多级嵌套，不确定哪一层是经纬度信息，所以这里需要将 targetCoordinate 进行扁平化
  const coordinateData = flattenCoordinate(geometryCoordinates);
  return getMapCenterAndZoom(coordinateData);
};

/**
 * @description: 矫正地级市postcode
 * @warning 注意矫正地级市的postcode仅限在中国地图内，国外地图的postcode拿不到
 * @param start
 * @param end
 * @param currLev
 */
export const correctPostcodeByLevel = (start: string, end: string, currLev: MapLevel): string[] => {
  let bit = 0;
  switch (currLev) {
    case MapLevel.PROVINCE:
      bit = 2;
      break;
    case MapLevel.CITY:
      bit = 4;
      break;
    case MapLevel.COUNTY:
      bit = 6;
      break;
    case MapLevel.COUNTRY:
    case MapLevel.WORLD:
    default:
      bit = 0;
      break;
  }

  if (bit) {
    const FULL = 6;
    const suffix: string = new Array(FULL - bit).fill("0").join("");
    return [start ? start.slice(0, bit) + suffix : "", end ? end.slice(0, bit) + suffix : ""];
  } else {
    return [CHINA_POSTCODE_JUST_FOR_FE, ""];
  }
};

/**
 * @description: 判断地图下钻层级
 * 根据地图下钻层级 来判断是否能继续下钻
 */
export const mapLevelMatrix = (level: MapLevel): number => {
  switch (level) {
    case MapLevel.COUNTRY:
      return 1;
    case MapLevel.PROVINCE:
      return 2;
    case MapLevel.CITY:
      return 3;
    case MapLevel.COUNTY:
      return 4;
    case MapLevel.WORLD:
    default:
      return 0;
  }
};

export const levelNumToLevel = (level: number): MapLevel => {
  switch (level) {
    case 1:
      return MapLevel.COUNTRY;
    case 2:
      return MapLevel.PROVINCE;
    case 3:
      return MapLevel.CITY;
    case 4:
      return MapLevel.COUNTY;
    default:
      return MapLevel.WORLD;
  }
};

/**
 * @description: 将设备状态枚举值转换为排序值，方便排序使用
 * @param status
 * @return number
 */
export const convertDeviceStatus2Order = (status: AnyObj | string) => {
  const normalized = typeof status === "string" ? status.toUpperCase() : String(status).toUpperCase();
  switch (normalized) {
    case "ACTIVE":
    case "ONLINE":
      return 1;
    case "PENDING":
    case "SUSPENDED":
    case "OFFLINE":
    case "WARNING":
    case "ERROR":
      return 2;
    default:
      return 0;
  }
};

/**
 * @description: 将地区名称中带有 "市"、"省"、"自治区"、"特别行政区"、"地区"、"盟"、"州"、"县"、"区" 的地区名称去掉
 * 因为在地图的数据中带有这些后缀的地区名称，而后端返回的地区名称不一定带有这些后缀，所以需要去掉
 * 否则找不到对应的地区信息
 */
export const removeRegionSuffix = (region: string): string => {
  return region.replace(/市|省|自治区|特别行政区|地区|盟|州|县|区/g, "");
};


export const getCenterAndZoomByGeometryCoordinates = (
  coords: unknown,
): { center: [number, number] | null; zoom: number } => {
  const flat: [number, number][] = [];

  // 递归收集坐标点
  const collect = (c: unknown): void => {
    if (Array.isArray(c)) {
      // 当长度为2且都是数字时，认为是 [lng, lat]
      if (c.length === 2 && typeof c[0] === "number" && typeof c[1] === "number") {
        flat.push([c[0], c[1]]);
      } else {
        for (const sub of c) {
          collect(sub);
        }
      }
    }
  };

  collect(coords);
  if (flat.length === 0) {
    return { center: null, zoom: 1 };
  }

  let minLng = flat[0][0];
  let maxLng = flat[0][0];
  let minLat = flat[0][1];
  let maxLat = flat[0][1];

  // 寻找最小/最大经纬度
  for (const [lng, lat] of flat) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  const center: [number, number] = [
    (minLng + maxLng) / 2,
    (minLat + maxLat) / 2,
  ];

  // 根据经纬度范围简单计算缩放级别
  const lngDiff = Math.max(0.0001, Math.abs(maxLng - minLng));
  const latDiff = Math.max(0.0001, Math.abs(maxLat - minLat));

  // log2(360/lngDiff) 与 log2(180/latDiff) 作为缩放参考
  const zoom = Math.min(Math.log2(360 / lngDiff), Math.log2(180 / latDiff));

  // 限定缩放范围 [0.5, 6]
  return { center, zoom: Math.max(0.5, Math.min(zoom, 6)) };
};


/**
 * 获取 geoJSON 的 title
 * @param geoJson - GeoJSON 对象
 * @returns title 字段值，如果没有则返回空字符串
 */
export function getGeoJsonTitle(geoJson: GeoJSON, level: MapLevel): string {
  if (
    !geoJson ||
    typeof geoJson !== "object" ||
    geoJson.type !== "FeatureCollection"
  ) {
    return "";
  }

  // 标准的 title 字段
  if ("title" in geoJson && typeof geoJson.title === "string") {
    return geoJson.title;
  }

  // 兜底策略
  let defaultTitle = "";

  switch (level) {
    case MapLevel.COUNTRY:
      defaultTitle = "country";
      break;
    case MapLevel.PROVINCE:
      defaultTitle = "province";
      break;
    case MapLevel.CITY:
      defaultTitle = "city";
      break;
    case MapLevel.COUNTY:
      defaultTitle = "county";
      break;
    case MapLevel.WORLD:
      defaultTitle = "world";
      break;
  }
  // 有些数据 title 可能放在 properties 里
  if (
    Array.isArray(geoJson.features) &&
    geoJson.features.length > 0 &&
    typeof geoJson.features[0] === "object" &&
    geoJson.features[0] !== null &&
    "properties" in geoJson.features[0] &&
    geoJson.features[0].properties &&
    typeof (geoJson.features[0].properties as { title?: unknown }).title === "string"
  ) {
    return (geoJson.features[0].properties as { title?: string }).title ?? defaultTitle;
  }

  return defaultTitle;
}


/**
 * 判断是否为直辖市
 * @param postcode - 行政区划代码
 * @returns 是否为直辖市
 */
export const isMunicipality = (postcode: string): boolean => MUNICIPALITY_CODES.has(postcode);
