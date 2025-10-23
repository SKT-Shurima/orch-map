// src/interfaces/index.ts
var MapRendererType = /* @__PURE__ */ ((MapRendererType2) => {
  MapRendererType2["ECHARTS"] = "echarts";
  MapRendererType2["DECKGL"] = "deckgl";
  return MapRendererType2;
})(MapRendererType || {});

// src/main.ts
import { MapLevel as MapLevel7 } from "@orch-map/types";

// src/deckgl/main.ts
import { Deck, MapView, FlyToInterpolator } from "@deck.gl/core";
import { TaskManager } from "@orch-map/utils";

// src/deckgl/layers/geoLayer.ts
import { GeoJsonLayer } from "@deck.gl/layers";
import { isDef } from "@orch-map/utils";
import { MapLevel as MapLevel3 } from "@orch-map/types";

// src/MapStateManager.ts
import MapDataService from "@orch-map/mapdata";
import { MapLevel } from "@orch-map/types";
var _MapStateManager = class _MapStateManager {
  // 私有构造函数，防止外部实例化
  constructor() {
  }
  // 静态 getter/setter - curLevel
  static get curLevel() {
    return _MapStateManager._curLevel;
  }
  static set curLevel(level) {
    const oldValue = _MapStateManager._curLevel;
    _MapStateManager._curLevel = level;
    _MapStateManager.notifyPropertyChange("curLevel", level, oldValue);
  }
  // 静态 getter/setter - country
  static get country() {
    return _MapStateManager._country;
  }
  static set country(country) {
    const oldValue = _MapStateManager._country;
    _MapStateManager._country = country;
    _MapStateManager.notifyPropertyChange("country", country, oldValue);
  }
  // 静态 getter/setter - postcode
  static get postcode() {
    return _MapStateManager._postcode;
  }
  static set postcode(postcode) {
    const oldValue = _MapStateManager._postcode;
    _MapStateManager._postcode = postcode;
    _MapStateManager.notifyPropertyChange("postcode", postcode, oldValue);
  }
  // 静态 getter/setter - region
  static get region() {
    return _MapStateManager._region;
  }
  static set region(region) {
    const oldValue = _MapStateManager._region;
    _MapStateManager._region = region;
    _MapStateManager.notifyPropertyChange("region", region, oldValue);
  }
  // 静态 getter/setter - mapVersion
  static get mapVersion() {
    return _MapStateManager._mapVersion;
  }
  static set mapVersion(version) {
    _MapStateManager._mapVersion = version;
  }
  // 静态 getter/setter - geoData
  static get geoData() {
    return _MapStateManager._geoData;
  }
  static set geoData(data) {
    const oldValue = _MapStateManager._geoData;
    _MapStateManager._geoData = data;
    _MapStateManager.notifyPropertyChange("geoData", data, oldValue);
  }
  /**
   * 设置地理数据（包括详情数据）
   */
  static setGeoData(geoData) {
    _MapStateManager.geoData = geoData;
  }
  static async getGeoJsonData(config) {
    const result = await MapDataService.getGeoJsonData(config);
    _MapStateManager.setGeoData(result);
    return result;
  }
  static get extraSvgIcons() {
    return _MapStateManager._extraSvgIcons;
  }
  static set extraSvgIcons(icons) {
    _MapStateManager._extraSvgIcons = icons;
  }
  static get echartsSymbols() {
    return _MapStateManager._echartsSymbols;
  }
  static set echartsSymbols(symbols) {
    _MapStateManager._echartsSymbols = symbols;
  }
  // 静态 getter/setter - allPoints
  static get allPoints() {
    return _MapStateManager._allPoints;
  }
  static set allPoints(points) {
    _MapStateManager._allPoints = points;
  }
  // 静态 getter/setter - allLines
  static get allLines() {
    return _MapStateManager._allLines;
  }
  static set allLines(lines) {
    _MapStateManager._allLines = lines;
  }
  /**
   * 重置到默认状态
   */
  static reset() {
    _MapStateManager._curLevel = MapLevel.WORLD;
    _MapStateManager._country = "100000";
    _MapStateManager._postcode = "100000";
    _MapStateManager._geoData = {};
    _MapStateManager._allPoints = [];
    _MapStateManager._allLines = [];
  }
  /**
   * 监听特定属性变化
   */
  static onPropertyChange(property, listener) {
    const key = `property-${property}`;
    if (!_MapStateManager.propertyListeners.has(key)) {
      _MapStateManager.propertyListeners.set(key, []);
    }
    _MapStateManager.propertyListeners.get(key).push(listener);
    return () => {
      const listeners = _MapStateManager.propertyListeners.get(key);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
        if (listeners.length === 0) {
          _MapStateManager.propertyListeners.delete(key);
        }
      }
    };
  }
  /**
   * 通知属性变化
   */
  static notifyPropertyChange(property, newValue, oldValue) {
    const key = `property-${property}`;
    const listeners = _MapStateManager.propertyListeners.get(key);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(newValue, oldValue);
        } catch (error) {
          console.error(`Error in property change listener for ${property}:`, error);
        }
      });
    }
  }
  /**
   * 销毁状态管理器
   */
  static destroy() {
    _MapStateManager.propertyListeners.clear();
    _MapStateManager.reset();
  }
};
// 静态属性，可直接访问
_MapStateManager._curLevel = MapLevel.WORLD;
/**
 * 当前地图所属国家
 */
_MapStateManager._country = "";
/**
 * 当前地图所属地区
 */
_MapStateManager._region = "";
/**
 * 当前地图所属地区代码
 */
_MapStateManager._postcode = "";
/**
 * 当前地图数据
 */
_MapStateManager._geoData = {};
_MapStateManager._mapVersion = "standard";
/** 自定义图标库（原始 SVG 字符串，供 DeckGL 使用） */
_MapStateManager._extraSvgIcons = {};
/** ECharts 图标库（转换后的 symbol 格式，供 ECharts 使用） */
_MapStateManager._echartsSymbols = {};
/** 所有原始点位数据（用于层级切换时过滤） */
_MapStateManager._allPoints = [];
/** 所有原始线条数据（用于层级切换时过滤） */
_MapStateManager._allLines = [];
// 属性监听器
_MapStateManager.propertyListeners = /* @__PURE__ */ new Map();
var MapStateManager = _MapStateManager;

// src/utils/geoUtils.ts
import { MapLevel as MapLevel2 } from "@orch-map/types";

// src/constants/mapConfig.ts
var RENDER_MODES = {
  MODE_2D: "2d",
  MODE_3D: "3d"
};
var DEFAULT_CONFIG = {
  ZOOM: 10,
  CENTER: { lat: 39.9, lng: 116.3 },
  MODE: RENDER_MODES.MODE_2D,
  INTERACTIVE: true,
  SHOW_CONTROLS: false
};

// src/constants/geoData.ts
var CHINA_AD_CODE_JUST_FOR_FE = "100000";
var US_AD_CODE_JUST_FOR_FE = "us";
var MUNICIPALITY_CODES = /* @__PURE__ */ new Set(["110000", "120000", "310000", "500000"]);
var G2 = { CHINA: "\u4E2D\u56FD", USA: "\u7F8E\u56FD" };

// src/constants/point.ts
var POINT_DEFAULT_STYLE = {
  size: 12,
  color: "#ffffff",
  borderColor: "#fff",
  shadowColor: "#fff",
  borderWidth: 0,
  shadowBlur: 0
};

// src/echarts-geo/echart.option.ts
var POST_CODE_KEY = "hc-key";
var DEFAULT_POINT_CONFIG = {
  symbol: "circle",
  symbolSize: 12,
  itemStyle: {
    color: "#47C384",
    opacity: 1
  }
};

// src/utils/geoUtils.ts
var CHINA_POSTCODE_JUST_FOR_FE = "100000";
var GeoUtils = class _GeoUtils {
  /**
   * 获取 geoJSON 的 title
   * @param geoJson - GeoJSON 对象
   * @param level - 地图层级
   * @returns title 字段值，如果没有则返回空字符串
   */
  static getGeoJsonTitle(geoJson, level) {
    if (!geoJson || typeof geoJson !== "object" || geoJson.type !== "FeatureCollection") {
      return "";
    }
    if ("title" in geoJson && typeof geoJson.title === "string") {
      return geoJson.title;
    }
    let defaultTitle = "";
    switch (level) {
      case MapLevel2.COUNTRY:
        defaultTitle = "country";
        break;
      case MapLevel2.PROVINCE:
        defaultTitle = "province";
        break;
      case MapLevel2.CITY:
        defaultTitle = "city";
        break;
      case MapLevel2.COUNTY:
        defaultTitle = "county";
        break;
      case MapLevel2.WORLD:
        defaultTitle = "world";
        break;
    }
    if (Array.isArray(geoJson.features) && geoJson.features.length > 0 && typeof geoJson.features[0] === "object" && geoJson.features[0] !== null && "properties" in geoJson.features[0] && geoJson.features[0].properties && typeof geoJson.features[0].properties.title === "string") {
      return geoJson.features[0].properties.title ?? defaultTitle;
    }
    return defaultTitle;
  }
  /**
   * @description: 矫正地级市postcode
   * @warning 注意矫正地级市的postcode仅限在中国地图内，国外地图的postcode拿不到
   * @param start - 起始postcode
   * @param end - 结束postcode
   * @param currLev - 当前地图层级
   * @returns 矫正后的postcode数组 [start, end]
   */
  static correctPostcodeByLevel(start, end, currLev) {
    let bit = 0;
    switch (currLev) {
      case MapLevel2.PROVINCE:
        bit = 2;
        break;
      case MapLevel2.CITY:
        bit = 4;
        break;
      case MapLevel2.COUNTY:
        bit = 6;
        break;
      case MapLevel2.COUNTRY:
      case MapLevel2.WORLD:
      default:
        bit = 0;
        break;
    }
    if (bit) {
      const FULL = 6;
      const suffix = new Array(FULL - bit).fill("0").join("");
      return [start ? start.slice(0, bit) + suffix : "", end ? end.slice(0, bit) + suffix : ""];
    } else {
      return [CHINA_POSTCODE_JUST_FOR_FE, ""];
    }
  }
  /**
   * 根据地理要素名称获取行政区划代码
   * @param name - 地理要素名称
   * @returns 行政区划代码
   */
  static getPostCodeByGeoFeatures(name) {
    const detailGeojson = MapStateManager.geoData;
    if (typeof detailGeojson === "string" || detailGeojson.type !== "FeatureCollection") {
      return "";
    }
    const features = detailGeojson.features;
    if (!Array.isArray(features)) {
      return "";
    }
    const target = features.find((item) => item.properties?.name === name);
    if (!target) {
      return "";
    }
    const currentMapIsChina = _GeoUtils.getCurrentMapIsChina();
    if (currentMapIsChina) {
      const props2 = target.properties;
      return props2?.adcode ? String(props2.adcode) : "";
    }
    const props = target.properties;
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
  static getCurrentMapIsChina() {
    return MapStateManager.country === "China";
  }
  /**
   * 获取下一级地图的行政区划代码
   * @param name - 区域名称
   * @returns 下一级行政区划代码
   */
  static getNextPostcode(name) {
    let nextPostcode = "";
    if (MapStateManager.curLevel === MapLevel2.WORLD) {
      if (name === G2.CHINA) {
        nextPostcode = CHINA_AD_CODE_JUST_FOR_FE;
      } else if (name === G2.USA) {
        nextPostcode = US_AD_CODE_JUST_FOR_FE;
      } else {
        nextPostcode = _GeoUtils.getPostCodeByGeoFeatures(name || "");
      }
    } else {
      nextPostcode = _GeoUtils.getPostCodeByGeoFeatures(name || "");
    }
    return nextPostcode;
  }
  /**
   * 计算 GeoJSON 的边界框
   * @param geojsonData - GeoJSON 数据
   * @returns 边界框对象，包含 minLng、maxLng、minLat、maxLat
   */
  static calculateGeoBounds(geojsonData) {
    if (geojsonData.type !== "FeatureCollection" || !geojsonData.features?.length) {
      return null;
    }
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    const extractCoordinates = (coords) => {
      if (Array.isArray(coords)) {
        if (coords.length === 2 && typeof coords[0] === "number" && typeof coords[1] === "number") {
          const [lng, lat] = coords;
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        } else {
          coords.forEach((item) => extractCoordinates(item));
        }
      }
    };
    geojsonData.features.forEach((feature) => {
      if (feature.geometry && "coordinates" in feature.geometry) {
        extractCoordinates(feature.geometry.coordinates);
      }
    });
    if (minLng === Infinity || maxLng === -Infinity || minLat === Infinity || maxLat === -Infinity) {
      return null;
    }
    return { minLng, maxLng, minLat, maxLat };
  }
  /**
   * 计算边界框中心点
   * @param bounds - 边界框对象
   * @returns 中心点坐标 [lng, lat]
   */
  static calculateBoundsCenter(bounds) {
    return [
      (bounds.minLng + bounds.maxLng) / 2,
      (bounds.minLat + bounds.maxLat) / 2
    ];
  }
  /**
   * 根据边界框计算合适的缩放级别
   * @param bounds - 边界框对象
   * @param containerWidth - 容器宽度（默认 1000）
   * @param containerHeight - 容器高度（默认 800）
   * @param padding - 内边距比例（默认 0.8）
   * @returns 缩放级别
   */
  static calculateZoomForBounds(bounds, containerWidth = 1e3, containerHeight = 800, padding = 0.8) {
    const lngDiff = Math.abs(bounds.maxLng - bounds.minLng);
    const latDiff = Math.abs(bounds.maxLat - bounds.minLat);
    const zoomLng = Math.log2(containerWidth * padding * 360 / (256 * lngDiff));
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const latScale = 1 / Math.cos(centerLat * Math.PI / 180);
    const zoomLat = Math.log2(containerHeight * padding * 180 / (256 * latDiff * latScale));
    const zoom = Math.min(zoomLng, zoomLat);
    return Math.max(0, Math.min(12, zoom));
  }
  /**
   * 获取 GeoJSON 的中心点和缩放级别
   * @param geojsonData - GeoJSON 数据
   * @param containerWidth - 容器宽度
   * @param containerHeight - 容器高度
   * @returns 包含中心点和缩放级别的对象，如果计算失败则返回 null
   */
  static getCenterAndZoom(geojsonData, {
    containerWidth,
    containerHeight
  }) {
    const bounds = _GeoUtils.calculateGeoBounds(geojsonData);
    if (!bounds) {
      return null;
    }
    const center = _GeoUtils.calculateBoundsCenter(bounds);
    const zoom = _GeoUtils.calculateZoomForBounds(bounds, containerWidth, containerHeight);
    return { center, zoom };
  }
  /**
   * 根据容器宽度计算最小缩放级别
   * @param containerWidth - 容器宽度
   * @returns 最小缩放级别
   */
  static calculateMinZoom(containerWidth) {
    const zoom = Math.log2(containerWidth / 256);
    return zoom - 1;
  }
  /**
   * 判断点是否在多边形内（射线法）
   * @param point - 点坐标 [lng, lat]
   * @param polygon - 多边形坐标数组
   * @returns 是否在多边形内
   */
  static isPointInPolygon(point, polygon) {
    const [x, y] = point;
    for (const ring of polygon) {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0];
        const yi = ring[i][1];
        const xj = ring[j][0];
        const yj = ring[j][1];
        const intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      if (inside) return true;
    }
    return false;
  }
  /**
   * 判断点是否在 MultiPolygon 内
   * @param point - 点坐标 [lng, lat]
   * @param multiPolygon - MultiPolygon 坐标数组
   * @returns 是否在 MultiPolygon 内
   */
  static isPointInMultiPolygon(point, multiPolygon) {
    for (const polygon of multiPolygon) {
      if (_GeoUtils.isPointInPolygon(point, polygon)) {
        return true;
      }
    }
    return false;
  }
  /**
   * 判断点是否在 GeoJSON 区域内
   * @param lng - 经度
   * @param lat - 纬度
   * @param geoData - GeoJSON 数据
   * @returns 是否在区域内
   */
  static isPointInGeoJSON(lng, lat, geoData) {
    if (geoData?.type !== "FeatureCollection" || !geoData?.features) {
      return false;
    }
    const point = [lng, lat];
    const bounds = _GeoUtils.calculateGeoBounds(geoData);
    if (!bounds) {
      return false;
    }
    if (lng < bounds.minLng || lng > bounds.maxLng || lat < bounds.minLat || lat > bounds.maxLat) {
      return false;
    }
    for (const feature of geoData.features) {
      if (!feature.geometry || !("coordinates" in feature.geometry)) continue;
      const { type, coordinates } = feature.geometry;
      if (type === "Polygon") {
        if (_GeoUtils.isPointInPolygon(point, coordinates)) {
          return true;
        }
      } else if (type === "MultiPolygon") {
        if (_GeoUtils.isPointInMultiPolygon(point, coordinates)) {
          return true;
        }
      }
    }
    return false;
  }
  /**
   * 过滤在 GeoJSON 区域内的点位
   * @param points - 点位数组
   * @param geoData - GeoJSON 数据
   * @returns 过滤后的点位数组
   */
  static filterPointsInGeoJSON(points, geoData) {
    if (!points || points.length === 0) {
      return [];
    }
    if (geoData?.type !== "FeatureCollection") {
      return points;
    }
    return points.filter((point) => {
      const [lng, lat] = point.coordinate;
      return _GeoUtils.isPointInGeoJSON(lng, lat, geoData);
    });
  }
};

// src/deckgl/layers/geoLayer.ts
var DEFAULT_GEO_FILL_COLOR = [9, 71, 119, 255];
var DEFAULT_GEO_LINE_COLOR = [20, 128, 197, 255];
var DEFAULT_GEO_HIGHLIGHT_COLOR = [48, 121, 200, 255];
var DEFAULT_GEO_LAYER_PROPS = {
  /** 是否启用拾取功能，启用后可以与图层元素进行交互 */
  pickable: true,
  /** 是否绘制要素的边框线条 */
  stroked: true,
  /** 是否填充要素的内部区域 */
  filled: true,
  /** 线宽缩放比例，用于调整线条粗细 */
  lineWidthScale: 1,
  /** 线条最小宽度（像素），确保线条在任何缩放级别下的可见性 */
  lineWidthMinPixels: 1,
  /** 是否启用经度无限滚动，解决地图跨越180度经线的显示问题 */
  wrapLongitude: true,
  /** 是否自动高亮鼠标悬停的要素 */
  autoHighlight: true,
  /** 高亮状态下要素的颜色，RGBA 格式 [r, g, b, a]，取值范围 0-255 */
  highlightColor: DEFAULT_GEO_HIGHLIGHT_COLOR,
  /** 要素边框的默认颜色，返回 RGBA 数组 */
  getLineColor: (_d) => DEFAULT_GEO_LINE_COLOR,
  /** 要素边框的宽度，单位为像素 */
  getLineWidth: () => 1
};
var GeoLayer = class {
  /**
   * 创建一个空数据的 GeoJsonLayer
   */
  static create() {
    return new GeoJsonLayer({
      ...DEFAULT_GEO_LAYER_PROPS,
      id: "geojson-layer",
      data: []
    });
  }
  /**
   * 创建带有完整功能的 GeoJSON 图层
   * @param geojsonData - GeoJSON 数据
   * @param events - 事件处理器配置（可选）
   * @returns 配置好的 GeoJsonLayer 实例
   */
  static createWithData(geojsonData, events) {
    let hoveredFeatureName = null;
    let lastClickTime = 0;
    const DOUBLE_CLICK_THRESHOLD = 300;
    return new GeoJsonLayer({
      ...DEFAULT_GEO_LAYER_PROPS,
      id: "geojson-layer",
      data: geojsonData,
      getFillColor: (feature) => {
        if (isDef(hoveredFeatureName) && hoveredFeatureName === feature.properties?.name) {
          return [255, 255, 255, 255];
        }
        return DEFAULT_GEO_FILL_COLOR;
      },
      updateTriggers: {
        getFillColor: hoveredFeatureName
      },
      onClick: (info) => {
        const currentTime = Date.now();
        const timeSinceLastClick = currentTime - lastClickTime;
        if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD) {
          const pick = info;
          if (pick?.object) {
            const regionName = pick.object.properties?.name ?? "";
            console.log("\u53CC\u51FB\u5730\u56FE\u533A\u57DF\u4FE1\u606F:", {
              \u533A\u57DF\u540D\u79F0: regionName,
              \u533A\u57DF\u4EE3\u7801: pick.object.properties?.code,
              \u5B8C\u6574\u6570\u636E: pick.object.properties
            });
            if (events?.onAreaDoubleClick) {
              events.onAreaDoubleClick(regionName);
            }
          }
          lastClickTime = 0;
        } else {
          lastClickTime = currentTime;
        }
        return true;
      },
      onHover: (info) => {
        const hover = info;
        if (hoveredFeatureName !== hover?.object?.properties?.name) {
        }
        if (hover?.object) {
          hoveredFeatureName = hover.object.properties?.name ?? null;
        } else {
          hoveredFeatureName = null;
        }
        return true;
      }
    });
  }
  /**
   * 根据地理数据计算适合的视图状态
   * @param geojsonData - GeoJSON 数据
   * @param containerSize - 容器尺寸
   * @param mode - 地图模式（2D/3D）
   * @returns 计算后的视图状态
   */
  static calculateViewState(geojsonData, containerSize, mode = "2d") {
    const curLevel = MapStateManager.curLevel;
    if (curLevel === MapLevel3.WORLD) {
      const result2 = GeoUtils.getCenterAndZoom(geojsonData, {
        containerWidth: containerSize.width,
        containerHeight: containerSize.height
      });
      return {
        longitude: result2?.center?.[0] ?? 0,
        latitude: result2?.center?.[1] ?? 30,
        zoom: result2?.zoom ?? 0,
        pitch: mode === "3d" ? 45 : 0
      };
    }
    const result = GeoUtils.getCenterAndZoom(geojsonData, {
      containerWidth: containerSize.width,
      containerHeight: containerSize.height
    });
    if (!result) {
      return {
        longitude: 0,
        latitude: 30,
        zoom: 1,
        pitch: mode === "3d" ? 45 : 0
      };
    }
    return {
      longitude: result.center?.[0] ?? 0,
      latitude: result.center?.[1] ?? 30,
      zoom: result.zoom ?? 1,
      pitch: mode === "3d" ? 45 : 0
    };
  }
  /**
   * 检查是否应该初始化默认图层
   * @returns 是否应该初始化
   */
  static shouldInitializeDefaultLayers() {
    return !!MapStateManager.geoData;
  }
  /**
   * 获取默认的 GeoJSON 数据
   * @returns 默认的 GeoJSON 数据
   */
  static getDefaultGeoData() {
    return MapStateManager.geoData;
  }
  /**
   * 获取图层 ID
   * @returns 图层 ID
   */
  static getLayerId() {
    return "geojson-layer";
  }
};

// src/deckgl/layers/iconLayer.ts
import { IconLayer as DeckIconLayer } from "@deck.gl/layers";

// src/deckgl/layers/iconAtlas.ts
var IconAtlas = class _IconAtlas {
  /**
   * 将 SVG 字符串转为 HTMLImageElement
   */
  static svgToImage(svgString) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load SVG"));
      };
      img.src = url;
    });
  }
  // 构建图标集合的工具方法
  static async buildIconAtlas(icons) {
    const iconMapping = {};
    let canvasWidth = 0;
    let canvasHeight = 0;
    for (const [iconName, iconSvg] of Object.entries(icons)) {
      const img = await _IconAtlas.svgToImage(iconSvg);
      iconMapping[iconName] = {
        x: canvasWidth,
        y: 0,
        width: img.width,
        height: img.height,
        mask: true
      };
      canvasWidth += img.width;
      canvasHeight = Math.max(canvasHeight, img.height);
    }
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context from canvas");
    }
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    for (const [iconName, iconSvg] of Object.entries(icons)) {
      const img = await _IconAtlas.svgToImage(iconSvg);
      const { x } = iconMapping[iconName];
      ctx.drawImage(img, x, 0);
    }
    return {
      iconAtlas: canvas.toDataURL(),
      iconMapping
    };
  }
};

// src/deckgl/layers/textLayer.ts
import { TextLayer as DeckTextLayer } from "@deck.gl/layers";
import { hexToRgba } from "@orch-map/utils";
var TextLayer = class {
  /**
   * 将业务点数据转换为 TextLayer 需要的数据结构
   * 根据 label.show 和 label.hoverShow 配置决定是否显示标签
   * @param points 业务点数据数组
   * @param config 图层配置
   * @returns TextLayer 需要的数据数组
   */
  static transformToTextData(points, config = {}) {
    const { hoveredPointId, selectedPointId } = config;
    return points.filter((point) => {
      if (!point.label) {
        return true;
      }
      if (point.label?.show) {
        return true;
      }
      if (point.label?.hoverShow && (hoveredPointId === point.id || selectedPointId === point.id)) {
        return true;
      }
      return false;
    }).map((point) => {
      return {
        ...point,
        // 抬升高度，显示在图标上方，避免遮挡
        position: [point.coordinate[0], point.coordinate[1], 120],
        size: point.size ?? 16
      };
    });
  }
  /**
   * 创建文本标签图层
   * @param textData 文本数据数组
   * @returns TextLayer 实例
   */
  static createLayer(textData) {
    const color = hexToRgba(POINT_DEFAULT_STYLE.color);
    return new DeckTextLayer({
      id: "label-layer",
      data: textData,
      characterSet: "auto",
      fontSettings: {
        buffer: 8
      },
      getPosition: (d) => d.position,
      getText: (d) => d.name,
      getSize: (d) => d.size ? d.size / 1.5 : 8,
      getColor: () => color,
      maxWidth: 64 * 12,
      getAngle: 0,
      getTextAnchor: "middle",
      getAlignmentBaseline: () => "bottom",
      pickable: false,
      // 标签不可交互
      // 确保文本始终朝上
      billboard: true,
      // 确保文本在最顶层
      modelMatrix: null
    });
  }
  /**
   * 创建文本图层（纯静态方法，不负责渲染）
   * @param points 业务点数据数组
   * @param config 图层配置
   * @returns TextLayer 实例
   */
  static create(points, config = {}) {
    const textData = this.transformToTextData(points, config);
    console.log("[TextLayer] create called:", {
      pointsCount: points.length,
      textDataCount: textData.length,
      sampleTextData: textData.slice(0, 3)
    });
    return this.createLayer(textData);
  }
  /**
   * 获取文本图层的标识符
   * @returns 图层ID
   */
  static getLayerId() {
    return "label-layer";
  }
};

// src/deckgl/layers/iconLayer.ts
var IconLayer = class _IconLayer {
  /**
   * 将业务点数据转换为 IconLayer 需要的数据结构
   * @param points 业务点数据数组
   * @returns IconLayer 需要的数据数组
   */
  static transformToIconData(points) {
    return points.map((point) => ({
      ...point,
      // 抬升少量高度，避免与地面发生深度冲突/遮挡
      position: [point.coordinate[0], point.coordinate[1], 50],
      icon: point.icon ?? "star",
      size: point.size ?? 16,
      color: point.color ?? [255, 255, 255, 255]
    }));
  }
  /**
   * 创建图标图层
   * @param iconData 图标数据数组
   * @param config 图层配置
   * @returns IconLayer 实例或 null（如果图标图集构建失败）
   */
  static async createIconLayer(iconData, config = {}) {
    const {
      selectedPointId = null,
      selectedSizeMultiplier = 1.6,
      onClick,
      onHover
    } = config;
    const registeredIcons = MapStateManager.extraSvgIcons || {};
    if (Object.keys(registeredIcons).length === 0) {
      console.warn("No icons registered in MapStateManager, skipping IconLayer creation");
      return null;
    }
    const iconAtlasResult = await IconAtlas.buildIconAtlas(registeredIcons);
    const iconLayer = new DeckIconLayer({
      id: "point-layer",
      data: iconData,
      iconAtlas: iconAtlasResult.iconAtlas,
      iconMapping: iconAtlasResult.iconMapping,
      getPosition: (d) => d.position,
      getIcon: (d) => d.icon,
      getSize: (d) => selectedPointId && d.id === selectedPointId ? d.size * selectedSizeMultiplier : d.size,
      getColor: (d) => d.color,
      pickable: true,
      updateTriggers: {
        getSize: selectedPointId
      },
      onClick,
      onHover
    });
    return iconLayer;
  }
  /**
   * 创建图标图层（纯静态方法，不负责渲染）
   * @param points 业务点数据数组
   * @param config 图层配置
   * @returns 图标图层实例或 null（如果图标图集构建失败）
   */
  static async create(points, config = {}) {
    const iconData = _IconLayer.transformToIconData(
      points
    );
    return await this.createIconLayer(iconData, config);
  }
  /**
   * 获取图标图层的标识符
   * @returns 图层ID
   */
  static getLayerId() {
    return "point-layer";
  }
  /**
   * 处理点对象点击事件
   * @param info - 点击信息
   * @param currentState - 当前点状态
   * @param updateCallback - 图层更新回调
   * @returns 更新后的点状态
   */
  static async handleClickPoint(info, currentState, updateCallback) {
    const pick = info;
    const clickedId = pick?.object?.id ?? null;
    const newState = {
      ...currentState,
      selectedPointId: clickedId
    };
    await _IconLayer.updateIconLayers(
      currentState.points ?? [],
      newState,
      updateCallback
    );
    return newState;
  }
  /**
   * 处理点对象悬停事件
   * @param info - 悬停信息
   * @param currentState - 当前点状态
   * @param updateCallback - 图层更新回调
   * @returns 更新后的点状态
   */
  static async handleHoverPoint(info, currentState, updateCallback) {
    const pick = info;
    const hoveredId = pick?.object?.id ?? null;
    if (currentState.hoveredPointId !== hoveredId) {
      const newState = {
        ...currentState,
        hoveredPointId: hoveredId
      };
      const textLayer = TextLayer.create(
        currentState.points ?? [],
        {
          selectedPointId: newState.selectedPointId,
          hoveredPointId: newState.hoveredPointId
        }
      );
      updateCallback(TextLayer.getLayerId(), textLayer);
      updateCallback();
      return newState;
    }
    return currentState;
  }
  /**
   * 更新图标和文本图层
   * @param points - 点数据数组
   * @param state - 点状态
   * @param updateCallback - 图层更新回调
   */
  static async updateIconLayers(points, state, updateCallback) {
    console.log("[IconLayer] updateIconLayers called, points count:", points.length);
    const iconLayer = await _IconLayer.create(
      points,
      {
        selectedPointId: state.selectedPointId,
        hoveredPointId: state.hoveredPointId,
        onClick: (_info) => {
        },
        onHover: (_info) => {
        }
      }
    );
    if (iconLayer) {
      updateCallback(_IconLayer.getLayerId(), iconLayer);
    }
    console.log("[IconLayer] IconLayer updated, now updating TextLayer");
    const textLayer = TextLayer.create(
      points,
      {
        selectedPointId: state.selectedPointId,
        hoveredPointId: state.hoveredPointId
      }
    );
    updateCallback(TextLayer.getLayerId(), textLayer);
    console.log("[IconLayer] TextLayer updated, now calling updateLayer()");
    updateCallback();
  }
  /**
   * 设置点数据并更新图层
   * @param points - 点数据数组
   * @param state - 当前点状态
   * @param updateCallback - 图层更新回调
   * @returns 更新后的点状态
   */
  static async setPoints(points, state, updateCallback) {
    const newState = {
      ...state,
      points
    };
    await _IconLayer.updateIconLayers(points, newState, updateCallback);
    return newState;
  }
  /**
   * 检查点击是否在点图层上
   * @param info - 点击信息
   * @returns 是否在点图层上
   */
  static isPointLayerClick(info) {
    const pick = info;
    return !!(pick?.object && pick.layer?.id === _IconLayer.getLayerId());
  }
  /**
   * 清除选中状态
   * @param currentState - 当前点状态
   * @param updateCallback - 图层更新回调
   * @returns 更新后的点状态
   */
  static async clearSelection(currentState, updateCallback) {
    if (currentState.selectedPointId) {
      const newState = {
        ...currentState,
        selectedPointId: null
      };
      await _IconLayer.updateIconLayers(
        currentState.points ?? [],
        newState,
        updateCallback
      );
      return newState;
    }
    return currentState;
  }
};

// src/utils/curvatureCalculator.ts
var CurvatureCalculator = class {
  constructor() {
    // 线条随机曲率映射表
    this.curvatureMap = {};
  }
  /**
   * @description: 字符串哈希函数，生成0到1之间的数值
   * 用确定性的方法替代 Math.random()
   * @param str 输入字符串
   * @returns 0到1之间的数值
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) / 2147483647;
  }
  /**
   * @description: 计算线条曲率
   * 主要是根据连线的 id 计算两点之后连线的曲率
   * @param key 线条的唯一标识
   * @param min 最小曲率值
   * @param max 最大曲率值
   * @returns 计算出的曲率值
   */
  curvature(key, min = 0, max = 1) {
    var _a;
    (_a = this.curvatureMap)[key] ?? (_a[key] = this.hashString(key) * (max - min) + min);
    return this.curvatureMap[key];
  }
  /**
   * @description: 计算连线的曲率范围
   * 根据连线两端点的经纬度差值计算合适的曲率范围
   */
  calculateCurvatureRange(startLng, startLat, endLng, endLat) {
    if (startLat === endLat && startLng === endLng) {
      return { min: 0.1, max: 0.3 };
    }
    const deltaLng = Math.abs(endLng - startLng);
    const deltaLat = Math.abs(endLat - startLat);
    const ratio = Math.min(deltaLng / deltaLat, deltaLat / deltaLng);
    const min = ratio > 0.5 ? 0.5 : 0.2;
    const max = ratio > 0.5 ? 1 : 0.5;
    return { min, max };
  }
  /**
   * @description: 根据起终点坐标计算曲率值
   * 综合使用曲率范围计算和曲率计算方法
   */
  calculateCurvatureByCoordinates(key, startCoordinate, endCoordinate, customRange) {
    const [startLng, startLat] = startCoordinate;
    const [endLng, endLat] = endCoordinate;
    const range = customRange ?? this.calculateCurvatureRange(startLng, startLat, endLng, endLat);
    if (range.min < 0 || range.max > 1 || range.min > range.max) {
      throw new Error("\u65E0\u6548\u7684\u66F2\u7387\u8303\u56F4\u3002\u5FC5\u987B\u6EE1\u8DB3: 0 <= min <= max <= 1");
    }
    return this.curvature(key, range.min, range.max);
  }
  /** 清空曲率缓存 */
  clearCache() {
    this.curvatureMap = {};
  }
  /** 获取当前缓存映射表（仅调试用途） */
  getCacheMap() {
    return { ...this.curvatureMap };
  }
};

// src/deckgl/layers/lineLayer.ts
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
var DEFAULT_LINE_RGBA = [170, 170, 170, 90];
var DEFAULT_DOT_RGB = [255, 255, 255];
function buildQuadraticBezierPath(start, end, curvature, segments = 64) {
  const [sx, sy] = start;
  const [ex, ey] = end;
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  const dx = ex - sx;
  const dy = ey - sy;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const offset = curvature * 0.3 * length;
  const cx = mx + nx * offset;
  const cy = my + ny * offset;
  const path = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const oneMinusT = 1 - t;
    const x = oneMinusT * oneMinusT * sx + 2 * oneMinusT * t * cx + t * t * ex;
    const y = oneMinusT * oneMinusT * sy + 2 * oneMinusT * t * cy + t * t * ey;
    path.push([x, y]);
  }
  return path;
}
var _Line2DManager = class _Line2DManager {
  // ==================== 曲率计算器管理 ====================
  /**
   * 获取当前曲率计算器实例
   */
  static getCurvatureCalculator() {
    return _Line2DManager.curvatureCalculator;
  }
  /**
   * 重置曲率计算器（用于清理缓存）
   */
  static resetCurvatureCalculator() {
    _Line2DManager.curvatureCalculator = new CurvatureCalculator();
  }
  // ==================== 渲染器方法 ====================
  /**
   * 创建常驻曲线图层（PathLayer）
   * 实现 buddy 双向连线：为每条线生成原始线（起点→终点）和 buddy 镜像线（终点→起点）
   * @param lines 业务线数据数组；每条线包含起终点经纬度
   * @returns PathLayer 实例（包含所有曲线及其 buddy 线，禁用拾取）
   */
  static buildFullCurveLayer(lines) {
    const fullData = [];
    lines.forEach((line) => {
      const curvature = _Line2DManager.curvatureCalculator.calculateCurvatureByCoordinates(
        line.id,
        line.startCoordinate,
        line.endCoordinate,
        { min: 0.5, max: 1 }
      );
      const color = line.color ?? DEFAULT_LINE_RGBA;
      const path = buildQuadraticBezierPath(line.startCoordinate, line.endCoordinate, curvature, 64);
      fullData.push({ path, color, width: 0.3 });
      const buddyPath = buildQuadraticBezierPath(line.endCoordinate, line.startCoordinate, curvature, 64);
      fullData.push({ path: buddyPath, color, width: 0.3 });
    });
    return new PathLayer({
      id: "line-layer",
      data: fullData,
      pickable: false,
      widthScale: 1,
      widthMinPixels: 0.5,
      getPath: (d) => d.path,
      getColor: (d) => d.color,
      getWidth: (d) => d.width,
      // 启用虚线以降低视觉重量
      dashJustified: true,
      parameters: { cullMode: "none" }
    });
  }
  /**
   * 创建同步移动的多圆点尾迹图层（ScatterplotLayer）
   * 实现 buddy 双向连线：为每条线生成原始尾迹和 buddy 镜像尾迹，实现双向流动效果
   * @param lines 业务线数据数组；每条线包含起终点经纬度
   * @param progress 动画归一化进度 [0, 1)；所有线条共享进度，实现同步动画
   * @param options 尾迹外观参数（可选）
   * @returns ScatterplotLayer 实例（尾迹小圆点）
   */
  static buildMovingDotsLayer(lines, progress, options) {
    const dots = [];
    const dotsPerLine = options?.dotsPerLine ?? 12;
    const headRadius = options?.headRadius ?? 1;
    const tailRadius = options?.tailRadius ?? 0.5;
    const headAlpha = options?.headAlpha ?? 255;
    const tailAlpha = options?.tailAlpha ?? 60;
    const trailSpan = options?.trailSpan ?? 0.01;
    const step = trailSpan / Math.max(1, dotsPerLine - 1);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const curvature = this.curvatureCalculator.calculateCurvatureByCoordinates(
        line.id,
        line.startCoordinate,
        line.endCoordinate
      );
      const baseRgb = Array.isArray(line.color) ? [
        line.color[0] ?? DEFAULT_DOT_RGB[0],
        line.color[1] ?? DEFAULT_DOT_RGB[1],
        line.color[2] ?? DEFAULT_DOT_RGB[2]
      ] : DEFAULT_DOT_RGB;
      const generateDots = (start, end) => {
        const sx = start[0];
        const sy = start[1];
        const ex = end[0];
        const ey = end[1];
        const mx = (sx + ex) / 2;
        const my = (sy + ey) / 2;
        const dx = ex - sx;
        const dy = ey - sy;
        const length = Math.hypot(dx, dy) || 1;
        const nx = -dy / length;
        const ny = dx / length;
        const offset = curvature * 0.3 * length;
        const cx = mx + nx * offset;
        const cy = my + ny * offset;
        for (let j = 0; j < dotsPerLine; j++) {
          const w = 1 - j / Math.max(1, dotsPerLine - 1);
          const tRaw = progress - j * step;
          const t = (tRaw % 1 + 1) % 1;
          const oneMinusT = 1 - t;
          const px = oneMinusT * oneMinusT * sx + 2 * oneMinusT * t * cx + t * t * ex;
          const py = oneMinusT * oneMinusT * sy + 2 * oneMinusT * t * cy + t * t * ey;
          const radius = Math.round(tailRadius + (headRadius - tailRadius) * w);
          const alpha = Math.round(tailAlpha + (headAlpha - tailAlpha) * Math.pow(w, 1.5));
          dots.push({ position: [px, py], color: [baseRgb[0], baseRgb[1], baseRgb[2], alpha], radius });
        }
      };
      generateDots(line.startCoordinate, line.endCoordinate);
      generateDots(line.endCoordinate, line.startCoordinate);
    }
    return new ScatterplotLayer({
      id: "line-trail-layer",
      data: dots,
      pickable: false,
      radiusUnits: "pixels",
      radiusMinPixels: tailRadius,
      radiusMaxPixels: headRadius + 2,
      getPosition: (d) => d.position,
      getFillColor: (d) => d.color,
      getRadius: (d) => d.radius,
      parameters: { cullMode: "none" }
    });
  }
  // ==================== 管理器方法 ====================
  /**
   * 构造 2D 线图层（常驻曲线 + 移动尾迹）
   * @param lines 线数据数组
   * @param config 动画配置
   * @param currentTime 当前动画时间（可选，默认从外部获取）
   * @returns 图层数组，包含常驻曲线图层和移动尾迹图层
   */
  static createLayers(lines, config = {}, currentTime) {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
    const baseLayer = this.buildFullCurveLayer(lines);
    const time = currentTime ?? 0;
    const progress = time / mergedConfig.timeLoop;
    const dotsLayer = this.buildMovingDotsLayer(lines, progress, mergedConfig.trailOptions);
    return [baseLayer, dotsLayer];
  }
  /**
   * 获取需要清理的 2D 线图层 ID 列表
   * @returns 图层 ID 数组
   */
  static getLayerIdsToRemove() {
    return ["line-layer", "line-trail-layer"];
  }
};
/** 曲率计算器实例（用于 2D 模式） */
_Line2DManager.curvatureCalculator = new CurvatureCalculator();
/** 默认动画配置 */
_Line2DManager.DEFAULT_CONFIG = {
  animationSpeed: 60,
  trailLength: 60 * 60,
  timeLoop: 6 * 60 * 60,
  trailOptions: {
    dotsPerLine: 12,
    headRadius: 1,
    tailRadius: 0.5,
    headAlpha: 255,
    tailAlpha: 60,
    trailSpan: 0.01
  }
};
var Line2DManager = _Line2DManager;

// src/deckgl/layers/lineLayerFor3d.ts
import { ArcTripsLayer } from "@deck.gl/layers";
function generateFlightRoutes(lines, currentTime, config = {}) {
  const defaultConfig = {
    animationSpeed: 1,
    trailLength: 100,
    timeLoop: 6 * 60 * 60,
    lineOffset: 50,
    lineDuration: 200,
    fadeTrail: true,
    showFullArc: false,
    dotSize: 0.01,
    dotTrailLength: 0.1,
    width: 1.2,
    height: 0.6,
    pickable: true,
    autoHighlight: true,
    onClick: (info) => {
      if (info.object) {
        console.log("Arc clicked:", info.object);
      }
    },
    enableBidirectional: true,
    baseArcColor: [255, 255, 0, 150],
    // 黄色基础弧线，低透明度
    trailColor: [255, 0, 0, 255]
    // 红色尾迹
  };
  const mergedConfig = { ...defaultConfig, ...config };
  const routes = [];
  lines.forEach((line, index) => {
    const lineOffset = mergedConfig.lineOffset || 50;
    const lineDuration = mergedConfig.lineDuration || 200;
    const baseTime = index % 20 * lineOffset;
    const travelTime = lineDuration + Math.random() * 100;
    const lineColor = Array.isArray(line.color) ? line.color.slice(0, 3) : [200, 200, 200];
    const sourcePos = [
      line.startCoordinate[0],
      line.startCoordinate[1],
      0
    ];
    const targetPos = [
      line.endCoordinate[0],
      line.endCoordinate[1],
      0
    ];
    routes.push({
      id: line.id,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
      sourceTimestamp: baseTime,
      targetTimestamp: baseTime + travelTime,
      sourceColor: lineColor,
      targetColor: lineColor,
      width: line.width ?? mergedConfig.width,
      height: mergedConfig.height
    });
    if (mergedConfig.enableBidirectional) {
      const reverseSourcePos = [
        line.endCoordinate[0],
        line.endCoordinate[1],
        0
      ];
      const reverseTargetPos = [
        line.startCoordinate[0],
        line.startCoordinate[1],
        0
      ];
      routes.push({
        id: `${line.id}-buddy`,
        sourcePosition: reverseSourcePos,
        targetPosition: reverseTargetPos,
        sourceTimestamp: baseTime + travelTime / 2,
        // Offset to create alternating flow
        targetTimestamp: baseTime + travelTime + travelTime / 2,
        sourceColor: lineColor,
        targetColor: lineColor,
        width: line.width ?? mergedConfig.width,
        height: mergedConfig.height
      });
    }
  });
  return routes;
}
var _Line3DManager = class _Line3DManager {
  // ==================== 渲染器方法 ====================
  // ==================== 管理器方法 ====================
  /**
   * 构造 3D 线图层（基础弧线 + 尾迹弧线）
   * @param lines 线数据数组
   * @param config 动画配置
   * @param currentTime 当前动画时间（可选，默认从外部获取）
   * @returns 图层数组，包含基础弧线图层和尾迹弧线图层
   */
  static createLayers(lines, config = {}, currentTime = 0) {
    const mergedConfig = { ..._Line3DManager.DEFAULT_CONFIG, ...config };
    const routes = generateFlightRoutes(lines, currentTime, config);
    const baseLayer = new ArcTripsLayer({
      id: "arc-base-layer",
      data: routes,
      getSourcePosition: (d) => d.sourcePosition,
      getTargetPosition: (d) => d.targetPosition,
      getSourceColor: mergedConfig.baseArcColor,
      getTargetColor: mergedConfig.baseArcColor,
      getWidth: (d) => d.width,
      getHeight: (d) => d.height,
      getSourceTimestamp: (d) => d.sourceTimestamp,
      getTargetTimestamp: (d) => d.targetTimestamp,
      // Animation properties - 基础层显示完整弧线，无动画效果
      currentTime: currentTime * mergedConfig.animationSpeed,
      fadeTrail: false,
      // 不使用动画效果，显示完整弧线
      trailLength: mergedConfig.trailLength,
      showFullArc: true,
      // 显示完整弧线
      dotSize: mergedConfig.dotSize,
      dotTrailLength: mergedConfig.dotTrailLength,
      animationSpeed: mergedConfig.animationSpeed,
      // Arc properties
      greatCircle: true,
      numSegments: 50,
      widthMinPixels: 1
    });
    const trailLayer = new ArcTripsLayer({
      id: "arc-trail-layer",
      data: routes,
      getSourcePosition: (d) => d.sourcePosition,
      getTargetPosition: (d) => d.targetPosition,
      getSourceColor: mergedConfig.trailColor,
      getTargetColor: mergedConfig.trailColor,
      getWidth: (d) => d.width,
      getHeight: (d) => d.height,
      getSourceTimestamp: (d) => d.sourceTimestamp,
      getTargetTimestamp: (d) => d.targetTimestamp,
      // Animation properties - 尾迹层只显示动画部分
      currentTime: currentTime * mergedConfig.animationSpeed,
      fadeTrail: mergedConfig.fadeTrail,
      // 启用渐变尾迹效果
      trailLength: mergedConfig.trailLength,
      showFullArc: false,
      // 只显示尾迹部分
      dotSize: mergedConfig.dotSize,
      dotTrailLength: mergedConfig.dotTrailLength,
      animationSpeed: mergedConfig.animationSpeed,
      // Arc properties
      greatCircle: true,
      numSegments: 50,
      widthMinPixels: 1,
      // Interactive
      pickable: mergedConfig.pickable,
      autoHighlight: mergedConfig.autoHighlight,
      onClick: mergedConfig.onClick
    });
    return [baseLayer, trailLayer];
  }
  /**
   * 获取需要清理的 3D 线图层 ID 列表
   * @returns 图层 ID 数组
   */
  static getLayerIdsToRemove() {
    return ["arc-base-layer", "arc-trail-layer"];
  }
};
/** 默认动画配置 */
_Line3DManager.DEFAULT_CONFIG = {
  animationSpeed: 1,
  trailLength: 100,
  timeLoop: 6 * 60 * 60,
  lineOffset: 50,
  lineDuration: 200,
  fadeTrail: true,
  showFullArc: false,
  dotSize: 0.01,
  dotTrailLength: 0.1,
  width: 1.2,
  height: 0.6,
  pickable: true,
  autoHighlight: true,
  onClick: (info) => {
    if (info.object) {
      console.log("Arc clicked:", info.object);
    }
  },
  enableBidirectional: true,
  baseArcColor: [255, 255, 0, 150],
  // 黄色基础弧线，低透明度
  trailColor: [255, 0, 0, 255]
  // 红色尾迹
};
var Line3DManager = _Line3DManager;

// src/deckgl/main.ts
var _DeckglMap = class _DeckglMap {
  //===== 生命周期管理 =====
  /**
   * 构造函数
   * @param container - 容器元素
   * @param mode - 地图模式（2D/3D）
   * @param callback - 初始化完成回调函数
   * @param events - 事件处理器配置（可选）
   */
  constructor(container, mode, callback, events) {
    //===== 实例标识和核心组件 =====
    /** 实例唯一标识 */
    this.instanceId = "deckgl-instance";
    /** DeckGL 实例 */
    this.deckInstance = null;
    this.container = null;
    /** 图层存储：layerId -> layer 实例 */
    this.layerMap = /* @__PURE__ */ new Map();
    //===== 数据源 =====
    /** 折线数据源 */
    this.lines = [];
    /** 点数据源 */
    this.points = [];
    //===== 状态管理 =====
    /** 点状态管理 */
    this.pointState = {
      selectedPointId: null,
      hoveredPointId: null
    };
    /** 2D/3D 模式 */
    this.mode = "2d";
    //===== 点击事件控制 =====
    /** 单击延迟计时器 */
    this.clickTimer = null;
    /** 点击延迟时间（毫秒） */
    this.CLICK_DELAY = 250;
    //===== 动画控制 =====
    /** 动画计时器任务句柄 */
    this.animationTimer = null;
    /** 当前动画时间（单位：秒的逻辑刻度） */
    this.currentTime = 0;
    this.mode = mode;
    this.events = events;
    this.container = container;
    void this.initializeMap(container, callback);
  }
  /**
   * 初始化地图
   * @param container - 容器元素
   * @param callback - 初始化完成回调函数
   */
  async initializeMap(container, callback) {
    const canvas = this.createCanvas(container);
    await this.initDeck(canvas, callback);
  }
  /**
   * 初始化 Deck 实例与图标图集
   * @param canvas - Canvas 元素
   * @param callback - 初始化完成回调函数
   */
  async initDeck(canvas, callback) {
    await this.createDeckInstance(
      canvas,
      {
        zoom: 1,
        latitude: 30,
        longitude: 0
      },
      {
        mode: this.mode,
        // @ts-ignore
        onClick: async (info, event) => {
          await this.handleClickMapView(info, event);
        },
        // @ts-ignore
        onDblClick: async (info, event) => {
          await this.handleDoubleClickMapView(info, event);
        }
      }
    );
    this.initializeDefaultLayers();
    callback();
    this.startArcAnimation();
  }
  /**
   * 初始化默认图层
   */
  initializeDefaultLayers() {
    if (GeoLayer.shouldInitializeDefaultLayers()) {
      const geoData = GeoLayer.getDefaultGeoData();
      if (geoData) {
        void this.setGEOData(geoData);
      }
    }
  }
  get lineLayerManager() {
    return this.mode === "2d" ? Line2DManager : Line3DManager;
  }
  /**
   * 图层更新回调方法
   */
  get layerUpdateCallback() {
    return (layerId, layer) => {
      if (layerId && layer) {
        this.updateLayerById(layerId, layer);
      } else {
        this.updateLayer();
      }
    };
  }
  /**
   * 销毁内部资源
   */
  destroy() {
    if (this.clickTimer) {
      clearTimeout(this.clickTimer);
      this.clickTimer = null;
    }
    if (this.animationTimer) {
      this.animationTimer.destroy();
      this.animationTimer = null;
    }
    if (this.deckInstance) {
      this.deckInstance.finalize();
      this.deckInstance = null;
    }
    this.layerMap.clear();
    this.removeLayer(IconLayer.getLayerId());
    this.removeLayer(TextLayer.getLayerId());
  }
  //===== 核心实例管理 =====
  /**
   * 创建 Canvas 元素
   * @param container - 容器元素
   * @returns Canvas 元素
   */
  createCanvas(container) {
    container.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.setAttribute("width", "100%");
    canvas.setAttribute("height", "100%");
    container.appendChild(canvas);
    return canvas;
  }
  /**
   * 创建并初始化 Deck 实例
   * @param container - Canvas 容器
   * @param initialViewState - 初始视图状态
   * @param props - 附加属性
   */
  async createDeckInstance(container, initialViewState, props) {
    if (this.deckInstance) {
      throw new Error(`Deck instance already exists for ${this.instanceId}`);
    }
    const mode = props?.mode ?? "2d";
    const mapView = new MapView({
      repeat: true,
      controller: {
        scrollZoom: true,
        dragPan: true,
        dragRotate: true,
        doubleClickZoom: false,
        // 禁用双击放大
        touchZoom: true,
        touchRotate: true,
        keyboard: true
      }
    });
    this.deckInstance = new Deck({
      canvas: container,
      width: container.parentElement?.clientWidth,
      height: container.parentElement?.clientHeight,
      initialViewState: {
        ..._DeckglMap.DEFAULT_VIEW_STATE,
        ...mode === "3d" ? { pitch: 45 } : {},
        ...initialViewState
      },
      views: mapView,
      ...props,
      onViewStateChange: (params) => {
        const { viewState } = params;
        const constrainedLatitude = Math.max(-30, Math.min(30, viewState.latitude));
        const nextViewState = { ...viewState, latitude: constrainedLatitude };
        return nextViewState;
      },
      layers: []
    });
  }
  /**
   * 获取当前 Deck 实例
   * @returns 当前的 Deck 实例
   * @throws 如果实例未初始化则抛出错误
   */
  get currentDeckInstance() {
    if (!this.deckInstance) {
      throw new Error(`Deck instance not initialized for ${this.instanceId}`);
    }
    return this.deckInstance;
  }
  //===== 图层管理 =====
  /**
   * 新增图层（若已存在则委托为 update）
   * @param id - 图层 ID
   * @param layer - 图层实例
   */
  addLayer(id, layer) {
    if (this.layerMap.has(id)) {
      this.updateLayerById(id, layer);
      return;
    }
    this.layerMap.set(id, layer);
  }
  /**
   * 更新图层
   * @param id - 图层 ID
   * @param layerOrProps - 图层实例或图层属性
   */
  updateLayerById(id, layerOrProps) {
    const isLayerInstance = (candidate) => !!candidate && typeof candidate === "object" && "constructor" in candidate && typeof candidate.constructor === "function";
    if (!this.layerMap.has(id)) {
      if (isLayerInstance(layerOrProps)) {
        this.layerMap.set(id, layerOrProps);
        console.log("[DeckglMap] Layer added to layerMap:", id);
      }
      return;
    }
    const oldLayer = this.layerMap.get(id);
    if (isLayerInstance(layerOrProps)) {
      const incomingLayer = layerOrProps;
      const incomingProps = incomingLayer.props ?? {};
      const incomingId = incomingProps["id"];
      if (typeof incomingId === "string" && incomingId !== id) {
        const Ctor = incomingLayer.constructor;
        const rebuilt = new Ctor({
          ...incomingProps,
          id
        });
        this.layerMap.set(id, rebuilt);
        console.log("[DeckglMap] Layer updated (rebuilt) in layerMap:", id);
      } else {
        this.layerMap.set(id, incomingLayer);
      }
      return;
    }
    const OldCtor = oldLayer.constructor;
    const newLayer = new OldCtor({
      ...oldLayer.props ?? {},
      ...layerOrProps,
      id
    });
    this.layerMap.set(id, newLayer);
  }
  /**
   * 移除图层
   * @param id - 图层 ID
   */
  removeLayer(id) {
    if (this.layerMap.has(id)) {
      this.layerMap.delete(id);
    }
  }
  /**
   * 以固定顺序返回所有图层实例
   * @returns 图层数组
   */
  getLayers() {
    const layerIds = [
      GeoLayer.getLayerId(),
      IconLayer.getLayerId(),
      "line-layer",
      "line-trail-layer",
      "arc-base-layer",
      "arc-trail-layer",
      TextLayer.getLayerId()
    ];
    const layers = layerIds.map((id) => this.layerMap.get(id));
    return layers;
  }
  /**
   * 将当前图层刷新到 Deck 实例
   */
  updateLayer() {
    const layers = this.getLayers();
    const validLayers = layers.filter((layer) => layer !== void 0);
    this.currentDeckInstance?.setProps({
      layers: validLayers
    });
  }
  //===== 事件处理 =====
  /**
   * 地图空白处点击处理（取消点选中）
   * @param info - 点击信息
   * @param event - 事件对象
   */
  async handleClickMapView(info, event) {
    const nativeEvent = event?.srcEvent;
    if (nativeEvent && "detail" in nativeEvent && nativeEvent.detail === 2) {
      return;
    }
    if (!IconLayer.isPointLayerClick(info)) {
      if (this.clickTimer) {
        clearTimeout(this.clickTimer);
      }
      this.clickTimer = setTimeout(async () => {
        if (this.pointState.selectedPointId) {
          this.pointState = await IconLayer.clearSelection(
            { ...this.pointState, points: this.points },
            this.layerUpdateCallback
          );
        }
      }, this.CLICK_DELAY);
    }
  }
  /**
   * 地图双击处理（获取区域信息）
   * @param info - 双击信息
   * @param event - 事件对象
   */
  async handleDoubleClickMapView(info, event) {
    if (this.clickTimer) {
      clearTimeout(this.clickTimer);
      this.clickTimer = null;
    }
    const pick = info;
    if (event?.srcEvent) {
      event.srcEvent.stopPropagation();
      event.srcEvent.preventDefault();
    }
    if (pick?.object && pick.layer?.id === GeoLayer.getLayerId()) {
      const regionName = pick.object.properties?.name ?? "";
      if (this.events?.onAreaDoubleClick) {
        this.events.onAreaDoubleClick(regionName);
      }
    }
  }
  /**
   * 点对象点击处理
   * @param info - 点击信息
   */
  async handleClickPoint(info) {
    this.pointState = await IconLayer.handleClickPoint(
      info,
      { ...this.pointState, points: this.points },
      this.layerUpdateCallback
    );
  }
  /**
   * 点对象悬停处理
   * @param info - 悬停信息
   */
  async handleHoverPoint(info) {
    this.pointState = await IconLayer.handleHoverPoint(
      info,
      { ...this.pointState, points: this.points },
      this.layerUpdateCallback
    );
  }
  //===== 数据设置与更新 =====
  /**
   * 设置国家/省份 GeoJSON 数据并注册基础底图图层
   * @param geojsonData - GeoJSON 数据
   */
  async setGEOData(geojsonData) {
    const geojsonLayer = GeoLayer.createWithData(geojsonData, this.events);
    this.addLayer(GeoLayer.getLayerId(), geojsonLayer);
    this.updateLayer();
    this.fitBoundsToGeoData(geojsonData);
  }
  /**
   * 根据地理数据调整视图，使其居中并适应缩放
   * @param geojsonData - GeoJSON 数据
   */
  fitBoundsToGeoData(geojsonData) {
    const canvasElement = this.container;
    const containerWidth = canvasElement?.parentElement?.clientWidth ?? 1e3;
    const containerHeight = canvasElement?.parentElement?.clientHeight ?? 800;
    const viewState = GeoLayer.calculateViewState(
      geojsonData,
      { width: containerWidth, height: containerHeight },
      this.mode
    );
    this.updateViewState([viewState.longitude, viewState.latitude], viewState.zoom);
  }
  /**
   * 更新视图状态
   * @param center - 中心点 [lng, lat]
   * @param zoom - 缩放级别
   */
  updateViewState(center, zoom) {
    const newViewState = {
      longitude: center[0],
      latitude: center[1],
      zoom,
      pitch: this.mode === "3d" ? 45 : 0,
      transitionDuration: 500,
      // 500ms 动画过渡
      transitionInterpolator: new FlyToInterpolator()
    };
    this.currentDeckInstance?.setProps({
      initialViewState: newViewState
    });
  }
  /**
   * 设置点数据
   * @param points - 点数据数组
   */
  async setPoints(points) {
    this.points = points;
    this.pointState = await IconLayer.setPoints(
      points,
      this.pointState,
      this.layerUpdateCallback
    );
  }
  /**
   * 设置折线数据
   * @param lines - 折线数据数组
   */
  setLines(lines) {
    this.lines = lines;
  }
  //===== 动画控制 =====
  // ==================== 时间管理方法 ====================
  /**
   * 获取当前动画时间
   */
  getCurrentTime() {
    return this.currentTime;
  }
  /**
   * 设置当前动画时间
   */
  setCurrentTime(time) {
    this.currentTime = time;
  }
  /**
   * 重置动画时间
   */
  resetTime() {
    this.currentTime = 0;
  }
  /**
   * 启动动画定时器
   */
  startArcAnimation() {
    if (this.animationTimer) {
      this.animationTimer.destroy();
      this.animationTimer = null;
    }
    this.animationTimer = new TaskManager.Timer({
      description: "glmap-arc-animation",
      time: 10,
      once: true,
      fn: this.updateArcAnimation.bind(this)
    });
  }
  /**
   * 更新动画
   */
  updateArcAnimation() {
    if (this.mode === "2d") {
      const currentTime = this.getCurrentTime();
      const animationSpeed = 60;
      const timeLoop = 6 * 60 * 60;
      const newTime = (currentTime + animationSpeed) % timeLoop;
      this.setCurrentTime(newTime);
      const layers = Line2DManager.createLayers(this.lines, {}, newTime);
      this.updateLayerById("line-layer", layers[0]);
      this.updateLayerById("line-trail-layer", layers[1]);
    } else {
      const currentTime = this.getCurrentTime();
      const animationSpeed = 1;
      const timeLoop = 6 * 60 * 60;
      const newTime = (currentTime + animationSpeed) % timeLoop;
      this.setCurrentTime(newTime);
      const [baseLayer, trailLayer] = Line3DManager.createLayers(this.lines, {}, newTime);
      this.updateLayerById("arc-base-layer", baseLayer);
      this.updateLayerById("arc-trail-layer", trailLayer);
    }
    this.updateLayer();
  }
};
//===== 静态常量 =====
/** 默认视图状态 */
_DeckglMap.DEFAULT_VIEW_STATE = {
  longitude: 0,
  latitude: 30,
  zoom: 1,
  pitch: 0
};
var DeckglMap = _DeckglMap;

// src/deckgl/index.ts
var deckgl_default = DeckglMap;

// src/echarts-geo/index.ts
import { debounce, isEmptyArray, isUndef as isUndef2 } from "@orch-map/utils";
import { ScatterChart, LinesChart } from "echarts/charts";
import * as echarts2 from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { GeoComponent as GeoComponent2, TooltipComponent, TitleComponent } from "echarts/components";

// src/echarts-geo/components/geo.ts
import { MapLevel as MapLevel4 } from "@orch-map/types";
import * as echarts from "echarts/core";
import { GeoJsonUtils } from "@orch-map/utils";

// src/utils/echartGeoUtils.ts
function getZoomLevelFromWorldWidth(worldWidth) {
  const zoomLevel = Math.log2(worldWidth / 256);
  return zoomLevel;
}
var EchartGeoUtils = class _EchartGeoUtils {
  /**
   * 获取 GeoJSON 中的所有坐标数据
   * @param geoJson GeoJSON 数据
   * @returns 所有坐标数组
   */
  static getAllCoordinates(geoJson) {
    const coordinates = [];
    if (geoJson.type === "FeatureCollection") {
      geoJson.features.forEach((feature) => {
        if (feature.geometry?.coordinates) {
          coordinates.push(feature.geometry.coordinates);
        }
      });
    } else if (geoJson.type === "Feature") {
      if (geoJson.geometry?.coordinates) {
        coordinates.push(geoJson.geometry.coordinates);
      }
    } else if (geoJson.coordinates) {
      coordinates.push(geoJson.coordinates);
    }
    return coordinates;
  }
  /**
   * 将地图坐标扁平化为 [number, number] 数组
   * 处理多层嵌套的坐标数据，转为一维数组
   * @param arr 嵌套的坐标数据
   * @returns 扁平化后的坐标数组
   */
  static flattenCoordinate(arr) {
    const result = [];
    function flatten(item) {
      if (Array.isArray(item)) {
        if (Array.isArray(item[0]) || typeof item[0] === "object") {
          item.forEach(flatten);
        } else if (typeof item[0] === "number" && typeof item[1] === "number") {
          result.push(item);
        }
      }
    }
    arr.forEach(flatten);
    return result;
  }
  /**
   * 通过坐标列表计算地图的中心点和缩放比例
   * @param coordinateList 扁平化后的坐标列表
   * @returns 中心点和缩放比例
   */
  static getCenterAndZoom(geoJson, {
    containerWidth,
    containerHeight
  }) {
    const coordinateList = this.getAllCoordinates(geoJson);
    if (coordinateList.length === 0) {
      return {
        center: null,
        zoom: 1
      };
    }
    const lngList = _EchartGeoUtils.flattenCoordinate(coordinateList).map((item) => item[0]);
    const latList = _EchartGeoUtils.flattenCoordinate(coordinateList).map((item) => item[1]);
    const minLng = Math.min(...lngList);
    const maxLng = Math.max(...lngList);
    const minLat = Math.min(...latList);
    const maxLat = Math.max(...latList);
    const lngDelta = Math.abs(maxLng - minLng) || 1;
    const latDelta = Math.abs(maxLat - minLat) || 1;
    const ratio = getZoomLevelFromWorldWidth(containerWidth);
    const latScale = containerHeight / (latDelta * ratio);
    const lngScale = containerWidth / (lngDelta * ratio);
    const zoom = Math.min(lngScale, latScale);
    return {
      center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
      zoom
    };
  }
};

// src/echarts-geo/components/geo.ts
var _GeoComponent = class _GeoComponent {
  /**
   * 生成地图名称
   * @returns 地图名称字符串
   */
  static generateMapName() {
    const level = MapStateManager.curLevel;
    const country = MapStateManager.country;
    const postcode = MapStateManager.postcode;
    switch (level) {
      case MapLevel4.WORLD:
        return "world";
      case MapLevel4.COUNTRY:
        return country === "China" ? "china" : "usa";
      case MapLevel4.PROVINCE:
        return `province-${postcode}`;
      case MapLevel4.CITY:
        return `city-${postcode}`;
      case MapLevel4.COUNTY:
        return `county-${postcode}`;
      default:
        return "default";
    }
  }
  static calculateScaleAndCenter(container) {
    const center = null;
    let scale = 1;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const geoJson = MapStateManager.geoData;
    const result = EchartGeoUtils.getCenterAndZoom(geoJson, { containerWidth, containerHeight }) ?? { center, zoom: scale };
    scale = result.zoom;
    return { scale, center: result.center };
  }
  /**
   * 更新地理组件选项
   * @param chartInstance - ECharts 实例
   * @param centralCountry - 中心国家代码
   */
  static updateGeoOption(chartInstance, container) {
    if (!chartInstance) return;
    const { scale, center } = _GeoComponent.calculateScaleAndCenter(container);
    const options = chartInstance.getOption();
    const geo = options.geo;
    if (geo && geo.length > 0) {
      geo[0].map = _GeoComponent.generateMapName();
      geo[0].center = center ?? geo[0].center;
      geo[0].zoom = scale;
      geo[0].itemStyle = {
        ...geo[0].itemStyle
      };
      options.geo = geo;
      chartInstance.setOption(options, true);
      chartInstance.resize();
    }
  }
  /**
   * 规范化地理数据格式
   * @param data - 地理数据
   * @returns 标准化的 FeatureCollection 数据
   */
  static normalizeGeoData(data) {
    if (typeof data === "object" && data !== null && "type" in data && data.type === "FeatureCollection") {
      return data;
    }
    if (typeof data === "string") {
      throw new Error("String GeoJSON data should be parsed before calling normalizeGeoData");
    }
    return data;
  }
  /**
   * 注册地图到 ECharts
   * @param geoJson - 地理数据
   */
  static registerMap(geoJson) {
    const mapName = _GeoComponent.generateMapName();
    echarts.registerMap(mapName, geoJson);
  }
  /**
   * 获取区域内点列表
   * @param params - 地理参数
   * @param detailGeojson - 详细地理数据
   * @param points - 点数据数组
   * @returns 区域内的点ID列表
   */
  static getPointsInRegion(params, detailGeojson, points) {
    const pointsInRegion = [];
    if (typeof detailGeojson === "string" || detailGeojson.type !== "FeatureCollection") {
      return pointsInRegion;
    }
    const features = detailGeojson.features;
    if (!Array.isArray(features)) {
      return pointsInRegion;
    }
    const hoverFeature = features.find((item) => item.properties?.name === params.name);
    if (!hoverFeature) {
      return pointsInRegion;
    }
    points.forEach((point) => {
      const coordinates = point.value;
      const isInRegion = GeoJsonUtils.checkPointInFeature(coordinates, hoverFeature);
      if (isInRegion && point.businessInfo && typeof point.businessInfo === "object" && "siblingPointId" in point.businessInfo) {
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
  static needsProjectionTransform() {
    if (MapStateManager.curLevel === MapLevel4.COUNTRY && MapStateManager.postcode === US_AD_CODE_JUST_FOR_FE) {
      return false;
    }
    return true;
  }
};
_GeoComponent.defaultGeoOption = {
  map: "",
  zoom: 1.3,
  silent: false,
  roam: true,
  center: void 0,
  scaleLimit: {
    min: 0.1,
    max: 10
  },
  layoutCenter: ["50%", "50%"],
  layoutSize: "80%",
  zlevel: 0,
  itemStyle: {
    areaColor: "#094777",
    borderWidth: 1,
    borderColor: "#1480C5",
    shadowBlur: 1,
    shadowColor: "rgba(0, 0, 0, 0.5)"
  },
  emphasis: {
    label: {
      show: false
    },
    itemStyle: {
      areaColor: "#3079c8",
      borderWidth: 1
    }
  },
  tooltip: {
    show: false
  }
};
var GeoComponent = _GeoComponent;

// src/echarts-geo/components/scatter.ts
import { convertToColorCode } from "@orch-map/utils";
var _ScatterComponent = class _ScatterComponent {
  /**
   * @description: 获取点默认配置项
   * @param point 点数据
   * @warning 这里的 showLabelNotEmphasis 为 true 时，会展示 label，
   * showLabelNotEmphasis 为 false 时，hover 时展示 label，正常不展示 label
   */
  static getPointDefaultOption(point) {
    return {
      id: point.id || "",
      name: point.name || "",
      symbol: "circle",
      symbolSize: 12,
      symbolRotate: 0,
      z: 1,
      encode: {
        x: "value.0",
        y: "value.1"
      },
      label: {
        show: true,
        z: 10,
        color: "#fff",
        position: "bottom",
        formatter: (formatterParams) => {
          return formatterParams.data.name ?? "";
        }
      },
      itemStyle: {
        color: "#47C384",
        borderColor: "#fff",
        shadowColor: "#fff",
        borderWidth: 0,
        shadowBlur: 0
      },
      emphasis: {
        scale: 1.5,
        label: {
          show: false
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: "#fff",
          shadowBlur: 10,
          shadowColor: "#fff"
        }
      },
      value: [point.coordinate[0], point.coordinate[1]]
    };
  }
  /**
   * 处理点数据并转换为 ECharts 散点图数据格式
   * @param points - 点数据数组
   * @returns 处理后的散点图数据
   */
  static processPointsData(points) {
    const symbolMap = MapStateManager.echartsSymbols;
    return points.map((point) => {
      const processedPoint = _ScatterComponent.processPoint(point);
      processedPoint.name = point.name;
      processedPoint.symbol = point.icon ? symbolMap[point.icon] : DEFAULT_POINT_CONFIG.symbol;
      processedPoint.symbolSize = point.size ?? DEFAULT_POINT_CONFIG.symbolSize;
      processedPoint.itemStyle = {
        color: convertToColorCode(point.color) ?? DEFAULT_POINT_CONFIG.itemStyle.color,
        opacity: point.opacity ?? DEFAULT_POINT_CONFIG.itemStyle.opacity
      };
      return processedPoint;
    });
  }
  /**
   * 更新系列中的散点图数据
   * @param series - 系列配置数组
   * @param pointData - 散点图数据
   * @returns 更新后的系列配置数组
   */
  static updateScatterSeriesData(series, pointData) {
    return series.map((item) => {
      if (item.type === "scatter" /* SCATTER */) {
        return {
          ...item,
          data: pointData
        };
      }
      return item;
    });
  }
  /**
   * 设置散点图数据到图表
   * @param chartInstance - ECharts 实例
   * @param points - 点数据数组
   */
  static setPoints(chartInstance, points) {
    if (!chartInstance) return;
    const mapOption = chartInstance.getOption();
    const series = mapOption.series;
    const pointData = this.processPointsData(points);
    const updatedSeries = this.updateScatterSeriesData(series, pointData);
    mapOption.series = updatedSeries;
    chartInstance.setOption(mapOption, true);
  }
  /**
   * 设置散点图样式
   * @param chartInstance - ECharts 实例
   * @param targetSeriesName - 目标系列名称
   * @param processFn - 处理函数，用于修改点数据项
   */
  static setPointStyleInternal(chartInstance, targetSeriesName, processFn) {
    const currentOption = chartInstance?.getOption();
    if (!currentOption || !Array.isArray(currentOption.series)) {
      return;
    }
    const { series } = currentOption;
    const pointSeries = series.find((item) => item.name === targetSeriesName);
    if (!pointSeries || !Array.isArray(pointSeries.data)) {
      return;
    }
    pointSeries.data.forEach((item) => {
      processFn(item);
    });
    const newOption = { series };
    chartInstance.setOption(newOption);
  }
  /**
   * 设置点样式（外部接口）
   * @param chartInstance - ECharts 实例
   * @param seriesName - 系列名称
   * @param styleProcessor - 样式处理函数
   */
  static setPointStyle(chartInstance, seriesName, styleProcessor) {
    if (!chartInstance) return;
    this.setPointStyleInternal(chartInstance, seriesName, (dataItem) => {
      const tempParam = {
        id: dataItem.id,
        name: dataItem.name ?? "",
        componentType: "series",
        componentSubType: "scatter",
        seriesName,
        seriesType: "scatter" /* SCATTER */,
        componentIndex: 0,
        event: { event: {} },
        geoIndex: 0,
        data: dataItem
      };
      const baseMapPoint = {
        id: tempParam.id,
        coordinate: dataItem.value,
        name: tempParam.name,
        label: {
          name: tempParam.name,
          show: true,
          hoverShow: true,
          formatter: () => ""
        }
      };
      styleProcessor(baseMapPoint);
    });
  }
  /**
   * 查找散点图系列
   * @param series - 系列配置数组
   * @returns 散点图系列或 undefined
   */
  static findScatterSeries(series) {
    return series.find((item) => item.type === "scatter" /* SCATTER */);
  }
  /**
   * 获取散点图数据
   * @param series - 系列配置数组
   * @returns 散点图数据数组
   */
  static getScatterData(series) {
    const pointSeries = this.findScatterSeries(series);
    return pointSeries?.data;
  }
  /**
   * 检查是否为散点图组件类型
   * @param componentSubType - 组件子类型
   * @returns 是否为散点图类型
   */
  static isScatterType(componentSubType) {
    return componentSubType === "scatter" /* SCATTER */ || componentSubType === "effectScatter" /* EFFECT_SCATTER */;
  }
  /**
   * 创建散点图系列配置
   * @param name - 系列名称
   * @param data - 数据数组
   * @param options - 额外配置选项
   * @returns 散点图系列配置
   */
  static createScatterSeries(name = "points", data = [], options = {}) {
    return {
      ...this.defaultScatterSeries,
      name,
      data,
      type: "scatter",
      ...options
    };
  }
  /**
   * 创建带有自定义动画配置的散点图系列
   * @param name - 系列名称
   * @param data - 数据数组
   * @param animationConfig - 动画配置
   * @param options - 额外配置选项
   * @returns 散点图系列配置
   */
  static createScatterSeriesWithAnimation(name = "points", data = [], animationConfig = {}, options = {}) {
    const {
      enabled = true,
      duration = 200,
      easing = "cubicOut"
    } = animationConfig;
    return {
      ...this.defaultScatterSeries,
      name,
      data,
      type: "scatter",
      animation: enabled,
      animationDuration: duration,
      animationEasing: easing,
      ...options
    };
  }
  /**
   * 处理散点图点击事件
   * @param params - 事件参数
   * @param onPointClick - 点击回调函数
   */
  static handleScatterClick(params, onPointClick) {
    if (params.componentType === "series" && this.isScatterType(params.componentSubType) && onPointClick && typeof params.id === "string") {
      onPointClick(params.id);
    }
  }
  /**
   * 处理散点图悬停事件
   * @param params - 事件参数
   * @param onPointHover - 悬停回调函数
   */
  static handleScatterHover(params, onPointHover) {
    if (params.componentType === "series" && onPointHover && typeof params.id === "string") {
      onPointHover(params.id);
    }
  }
};
/**
 * 默认散点图系列配置
 */
_ScatterComponent.defaultScatterSeries = {
  name: "points",
  type: "scatter",
  coordinateSystem: "geo",
  data: [],
  // 添加动画配置，控制hover放大速度
  animation: true,
  animationDuration: 20,
  // 动画持续时间，单位毫秒，值越小速度越快
  animationEasing: "cubicOut",
  // 动画缓动函数
  tooltip: {
    show: false
  },
  zlevel: 1
};
/**
* @description: 计算数量后缀
* @param count 数量
* @returns 格式化后的后缀
*/
_ScatterComponent.countSuffix = (count) => {
  return count > 1 ? `(${count})` : "";
};
/**
* @description: 处理点数据，转换为 echarts 配置
* @param pointItem 点数据
* @param config 适配器参数
* @returns 处理后的点配置
*/
_ScatterComponent.processPoint = (pointItem) => {
  const siblingPointId = pointItem.siblingPointId ?? [];
  const siblingCount = _ScatterComponent.countSuffix(siblingPointId.length);
  const dataOption = _ScatterComponent.getPointDefaultOption(pointItem);
  if (pointItem.name) {
    dataOption.name = pointItem.name + siblingCount;
  }
  if (dataOption.label) {
    dataOption.label.show = pointItem.label.show;
  }
  if (dataOption.emphasis?.label) {
    dataOption.emphasis.label.show = pointItem.label.hoverShow;
  }
  return dataOption;
};
var ScatterComponent = _ScatterComponent;

// src/echarts-geo/components/lines.ts
import { convertToColorCode as convertToColorCode2, isUndef } from "@orch-map/utils";
var _LinesComponent = class _LinesComponent {
  /**
   * 将线数据转换为 ECharts Series
   * @param lines - 线数据数组
   * @returns ECharts 系列配置数组
   */
  static convertLinesToSeries(lines) {
    const defaultLineSeries = _LinesComponent.defaultLinesSeries;
    const lineData = lines.map((line) => {
      const curvature = this.curvatureCalculator.calculateCurvatureByCoordinates(
        line.id,
        line.startCoordinate,
        line.endCoordinate
      );
      const defaultLineStyle = defaultLineSeries.lineStyle;
      return {
        ...defaultLineSeries,
        coords: [line.startCoordinate, line.endCoordinate],
        effect: {
          ...defaultLineSeries.effect,
          color: convertToColorCode2(line.color) ?? defaultLineSeries.effect?.color
        },
        lineStyle: {
          ...defaultLineStyle,
          color: convertToColorCode2(line.color) ?? defaultLineStyle?.color,
          width: line.width ?? defaultLineStyle?.width,
          opacity: line.opacity ?? defaultLineStyle?.opacity,
          curveness: curvature
        }
      };
    });
    return {
      ...defaultLineSeries,
      data: lineData
    };
  }
  /**
   * 设置连线图数据到图表
   * @param chartInstance - ECharts 实例
   * @param lines - 线数据数组
   */
  static setLines(chartInstance, lines) {
    if (!chartInstance) return;
    const mapOption = chartInstance.getOption();
    const series = this.convertLinesToSeries(lines);
    const doubleSeries = this.getBuddyLineSeries(series);
    const currentSeries = mapOption.series;
    if (currentSeries && Array.isArray(currentSeries)) {
      mapOption.series = currentSeries.map((item) => {
        if (item.name === "lines-buddy") {
          return doubleSeries;
        } else if (item.name === "lines") {
          return series;
        }
        return item;
      });
      chartInstance.setOption(mapOption, true);
    }
  }
  /**
   * @description: 字符串哈希函数，生成0到1之间的数值
   * 用确定性的方法替代 Math.random()
   * @param str 输入字符串
   * @returns 0到1之间的数值
   */
  static hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) / 2147483647;
  }
  /**
   * @description: 计算线条曲率
   * 主要是根据连线的 id 计算两点之后连线的曲率
   * @param key 线条的唯一标识
   * @param min 最小曲率值
   * @param max 最大曲率值
   * @returns 计算出的曲率值
   */
  static curvature(key, min = 0, max = 1) {
    if (isUndef(_LinesComponent.curvatureMap[key])) {
      _LinesComponent.curvatureMap[key] = _LinesComponent.hashString(key) * (max - min) + min;
    }
    return _LinesComponent.curvatureMap[key];
  }
  /**
   * @description: 获取线条默认配置
   * 这里会将线整个配置拿过来，直接进行赋值即可
   * 线条不会像点一样显示的形状、label 等复杂的信息
   * 对于线条而言，在业务场景中，一般是颜色不同而已
   *
   * @param lineItem 线条数据
   * @param config 曲率配置参数（可选）
   * @returns 线条配置
   */
  static getLineDefaultOption(lineItem, config) {
    const [startLng, startLat] = lineItem.startCoordinate;
    const [endLng, endLat] = lineItem.endCoordinate;
    const { min: defaultMin, max: defaultMax } = _LinesComponent.calculateCurvatureRange(startLng, startLat, endLng, endLat);
    const curvatureMin = config?.curvatureMin ?? defaultMin;
    const curvatureMax = config?.curvatureMax ?? defaultMax;
    if (curvatureMin < 0 || curvatureMax > 1 || curvatureMin > curvatureMax) {
      throw new Error("\u65E0\u6548\u7684\u66F2\u7387\u8303\u56F4\u3002\u5FC5\u987B\u6EE1\u8DB3: 0 <= min <= max <= 1");
    }
    return {
      coords: [lineItem.startCoordinate, lineItem.endCoordinate],
      lineStyle: {
        color: "#47C384",
        width: 0.1,
        opacity: 0.3,
        // 线条曲率
        curveness: _LinesComponent.curvature(lineItem.id, curvatureMin, curvatureMax)
      }
    };
  }
};
/**
 * 默认连线图系列配置
 */
_LinesComponent.defaultLinesSeries = {
  name: "lines",
  type: "lines",
  coordinateSystem: "geo",
  data: [],
  large: true,
  hoverLayerThreshold: 300,
  effect: {
    show: true,
    // 特效运行速度，值越小速度越快
    period: 2,
    // 特效尾迹长度[0, 1]值越大，尾迹越长
    trailLength: 5e-3,
    symbol: "circle",
    symbolSize: 4,
    color: "#47C384",
    loop: true
  },
  lineStyle: {
    color: "#47C384",
    width: 0.3,
    opacity: 0.5
  },
  zlevel: 1
};
/**
 * 曲率计算器实例
 */
_LinesComponent.curvatureCalculator = new CurvatureCalculator();
// 线条随机曲率映射表
_LinesComponent.curvatureMap = {};
/**
 * @description: 计算连线的曲率范围
 * 根据连线两端点的经纬度差值计算合适的曲率范围
 *
 * 计算逻辑:
 * 1. 如果起点和终点重合(经纬度相同)，返回固定的小曲率范围避免直线
 * 2. 计算经度和纬度的变化量的比值(类似于 tan 值)
 * 3. 使用最小的变化率来判断线条的倾斜程度:
 *    - 当最小变化率 > 0.5 (即线条倾斜角度 > 26.57°)时，使用较大曲率范围(0.5-1.0)
 *    - 当最小变化率 < 0.5 (即线条倾斜角度 < 26.57°)时，使用较小曲率范围(0.2-0.5)
 *    这样可以保证接近水平或垂直的线条使用较小曲率，而倾斜线条使用较大曲率
 *
 * @param startLng 起点经度
 * @param startLat 起点纬度
 * @param endLng 终点经度
 * @param endLat 终点纬度
 * @returns 曲率的最小值和最大值
 */
_LinesComponent.calculateCurvatureRange = (startLng, startLat, endLng, endLat) => {
  if (startLat === endLat && startLng === endLng) {
    return { min: 0.1, max: 0.3 };
  }
  const deltaLng = Math.abs(endLng - startLng);
  const deltaLat = Math.abs(endLat - startLat);
  const ratio = Math.min(deltaLng / deltaLat, deltaLat / deltaLng);
  const min = ratio > 0.5 ? 0.5 : 0.2;
  const max = ratio > 0.5 ? 1 : 0.5;
  return { min, max };
};
/**
 * @description: 获取线条逆向连线的 series 配置
 * 将连线起终点对调，创建反向连线配置
 *
 * @param originLineSeries 原始线条系列配置
 * @returns 逆向连线的系列配置
 */
_LinesComponent.getBuddyLineSeries = (originLineSeries) => {
  const sourceData = Array.isArray(originLineSeries.data) ? originLineSeries.data : [];
  const connectivitySeriesData = sourceData.map((item) => {
    const [start, end] = item.coords ?? [];
    return {
      ...item,
      coords: [end, start],
      lineStyle: {
        ...item.lineStyle,
        // 但是在显示上为了表示为同一条线，这里需要将曲线的弯曲度取反，这样就可以在地图上展示一条线
        curveness: item.lineStyle?.curveness ?? _LinesComponent.hashString(JSON.stringify(item.coords))
      }
    };
  });
  const buddyConnectivitySeries = {
    ...originLineSeries,
    name: "lines-buddy",
    data: connectivitySeriesData
  };
  return buddyConnectivitySeries;
};
var LinesComponent = _LinesComponent;

// src/echarts-geo/index.ts
echarts2.use([CanvasRenderer, GeoComponent2, TooltipComponent, TitleComponent, ScatterChart, LinesChart]);
var EchartsMap = class {
  // 曲率计算器已移至 LinesComponent 静态类
  /**
   * 构造函数
   * @param container - 地图容器，可以是 DOM 元素或元素 ID 字符串
   * @param options - 地图配置选项，支持 EchartsMapOptions 或 MapRendererConfig 格式
   * @throws {Error} 当通过 ID 查找容器元素失败时抛出错误
   */
  constructor(container, options, geoJson) {
    /** 当前详细地图名称 */
    this.detailMap = "";
    /** 边界数据加载状态 */
    this.boundaryLoading = false;
    /** 状态管理器取消订阅函数 */
    this.unsubscribeState = null;
    /**
     * 双击事件处理器（用于地图层级切换）
     * @param params - 事件参数，包含组件类型和区域信息
     * @private
     */
    this.dbClickHandler = (params) => {
      if (!params?.event?.event || !params.componentType) {
        return;
      }
      params.event.event.stopPropagation();
      if (params.componentType === "geo") {
        this.config.events?.onAreaDoubleClick?.(params.name || "");
      }
    };
    /**
     * 更新系列数据的具体实现
     * @param series - ECharts 系列配置数组
     * @private
     */
    this.updateSeriesImpl = async (series) => {
      await this.waitForBoundaryLoadingToBeFalse();
      if (GeoComponent.needsProjectionTransform()) {
        const option = { series };
        this.setChartOption(option);
      } else {
        const option = { series };
        this.setChartOption(option);
      }
    };
    /**
     * 重绘地图
     * @private
     */
    this.redrawMap = () => {
      const chartInstance = this.chartInstance;
      if (!chartInstance) {
        return;
      }
      const newOption = chartInstance.getOption();
      const geo = newOption.geo;
      if (!geo || isEmptyArray(geo) || isUndef2(geo[0])) {
        return;
      }
      const geoComponent = geo[0];
      const mapType = geoComponent.map;
      chartInstance.dispatchAction({
        type: "changeGeoRoam",
        componentType: "geo",
        map: mapType,
        center: geoComponent.center,
        zoom: geoComponent.zoom
      });
      if (this.config.events?.onZoom && typeof geoComponent.zoom === "number") {
        this.config.events.onZoom(geoComponent.zoom);
      }
    };
    /**
     * 调整地图大小
     * @public
     */
    this.resizeMap = () => {
      this.chartInstance?.resize();
    };
    /**
     * 地图系列数据更新方法（防抖，300ms 延迟）
     * @param series - ECharts 系列配置
     * @public
     */
    this.updateSeries = debounce((...args) => {
      const series = args[0];
      void this.updateSeriesImpl(series).catch(console.error);
    }, 300);
    if (typeof container === "string") {
      const element = document.getElementById(container);
      if (!element) {
        throw new Error(`\u627E\u4E0D\u5230ID\u4E3A"${container}"\u7684\u5BB9\u5668\u5143\u7D20`);
      }
      this.container = element;
    } else {
      this.container = container;
    }
    this.config = options;
    void this.initChart(geoJson).catch((error) => {
      console.error(error);
    });
    this.registerEvents();
  }
  /**
   * 初始化 ECharts 图表实例
   * @private
   */
  async initChart(geoJson) {
    if (!this.container) {
      return;
    }
    const instance = echarts2.init(this.container);
    const title = GeoUtils.getGeoJsonTitle(geoJson, MapStateManager.curLevel);
    echarts2.registerMap(title, geoJson);
    this.chartInstance = instance;
    const geoOption = GeoComponent.defaultGeoOption;
    geoOption.map = title;
    const baseOption = {
      tooltip: {
        show: true
      },
      geo: GeoComponent.defaultGeoOption,
      series: [
        ScatterComponent.defaultScatterSeries,
        LinesComponent.defaultLinesSeries,
        {
          ...LinesComponent.defaultLinesSeries,
          name: "lines-buddy"
        }
      ]
    };
    const zoom = GeoComponent.calculateScaleAndCenter(this.container).scale;
    geoOption.zoom = zoom;
    baseOption.geo = geoOption;
    this.chartInstance?.setOption(baseOption, true);
    instance.on("dblclick", this.dbClickHandler);
    instance.on("georoam", this.redrawMap);
  }
  /**
   * 注册事件监听器
   * @private
   */
  registerEvents() {
    window.addEventListener("resize", this.resizeMap);
    this.unsubscribeState = MapStateManager.onPropertyChange("geoData", () => {
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
  setChartOption(option) {
    if (!this.chartInstance) return;
    this.chartInstance.setOption(option);
  }
  updateGeoOption() {
    GeoComponent.updateGeoOption(this.chartInstance, this.container);
  }
  /**
   * 设置地理数据并更新地图显示
   * @param boundary - 边界地理数据
   * @public
   */
  setGEOData(boundary) {
    const geojson = MapStateManager.geoData;
    GeoComponent.registerMap(geojson);
    this.updateGeoOption();
    if (boundary?.type !== "FeatureCollection" || !Array.isArray(boundary?.features)) {
      this.boundaryLoading = false;
      return;
    }
    this.boundaryLoading = false;
  }
  /**
   * 等待边界数据加载完成
   * @param timeout - 超时时间（毫秒），默认 5000ms
   * @returns Promise - 加载完成时 resolve，超时时 reject
   * @private
   */
  waitForBoundaryLoadingToBeFalse(timeout = 5e3) {
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      const checkState = () => {
        if (!this.boundaryLoading) {
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error("\u83B7\u53D6\u5730\u56FE\u8F6E\u5ED3\u52A0\u8F7D\u72B6\u6001\u8D85\u65F6"));
        } else {
          setTimeout(checkState, 1e3);
        }
      };
      checkState();
    });
  }
  /**
   * 在 ECharts 中为指定系列设置点样式
   * @param targetSeriesName - 目标系列名称
   * @param processFn - 处理函数，用于修改点数据项
   * @public
   */
  setPointStyleInternal(targetSeriesName, processFn) {
    ScatterComponent.setPointStyleInternal(this.chartInstance, targetSeriesName, processFn);
  }
  /**
   * 更新地图层级
   * @param curLevel - 当前地图层级
   * @public
   */
  updateMapLevel(curLevel) {
    MapStateManager.curLevel = curLevel;
    const currentOption = this.chartInstance?.getOption();
    if (!currentOption) return;
    const geo = currentOption.geo || [];
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
  destroy() {
    if (this.detailMap) {
      this.chartInstance?.clear();
    }
    window.removeEventListener("resize", this.resizeMap);
    this.chartInstance?.dispose();
    if (this.unsubscribeState) {
      this.unsubscribeState();
      this.unsubscribeState = null;
    }
  }
  /**
   * # 更新地图上的点位
   * 该方法会移除旧的点位系列，然后添加新的点位系列
   * @param points 点位数组
   */
  setPoints(points) {
    ScatterComponent.setPoints(this.chartInstance, points);
  }
  /**
   * 在 ECharts 中更新线数据
   * @param lines - 线数据数组
   * @public
   */
  async setLines(lines) {
    LinesComponent.setLines(this.chartInstance, lines);
  }
  /**
   * 设置地理数据（IMapRenderer 接口实现）
   * @param boundary - 地理边界数据
   * @public
   */
  async setGeoData(boundary) {
    return new Promise((resolve, reject) => {
      if (!this.chartInstance) {
        reject(new Error("\u56FE\u8868\u5B9E\u4F8B\u4E0D\u5B58\u5728"));
        return;
      }
      const geoData = GeoComponent.normalizeGeoData(boundary);
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
  setPointStyle(seriesName, styleProcessor) {
    ScatterComponent.setPointStyle(this.chartInstance, seriesName, styleProcessor);
  }
  /**
   * 调整地图大小（IMapRenderer 接口实现）
   * @public
   */
  resize() {
    this.resizeMap();
  }
  /**
   * 获取渲染器类型（IMapRenderer 接口实现）
   * @returns 渲染器类型标识
   * @public
   */
  getType() {
    return "echarts";
  }
};

// ../mapData/dist/index.mjs
import { MapLevel as MapLevel5 } from "@orch-map/types";
var MapDataPathManager = class {
  /**
   * 获取地图数据的基础路径
   * 根据运行环境返回适当的基础路径
   *
   * @returns {string} 基础路径字符串
   */
  static getBasePath() {
    if (typeof window !== "undefined") {
      return "/mapData";
    } else {
      return "./data";
    }
  }
  /**
   * 根据参数生成数据路径
   *
   * @param {Object} params - 路径生成参数
   * @param {MapLevel} params.currentLevel - 当前地图级别
   * @param {string} params.region - 区域代码或名称
   * @param {string} params.country - 国家代码或名称
   * @returns {string} 相对路径字符串
   */
  static generateDataPath(params) {
    const {
      currentLevel,
      region,
      country,
      mapVersion = "standard"
      /* STANDARD */
    } = params;
    switch (currentLevel) {
      case MapLevel5.WORLD:
        return this.getWorldMapPath(mapVersion);
      case MapLevel5.COUNTRY:
        return this.getCountryMapPath(country, mapVersion);
      case MapLevel5.PROVINCE:
        return this.getProvinceMapPath(country, region);
      case MapLevel5.CITY:
        return this.getCityMapPath(country, region);
      case MapLevel5.COUNTY:
        return this.getCountyMapPath(country, region);
      default:
        return "";
    }
  }
  /**
   * 获取世界地图数据路径
   *
   * @param {MapVersion} mapVersion - 地图版本
   * @returns {string} 世界地图数据相对路径
   */
  static getWorldMapPath(mapVersion) {
    switch (mapVersion) {
      case "international":
        return "world/wgs84_world_for_US.geo.json";
      case "standard":
      default:
        return "world/wgs84_world.geo.json";
    }
  }
  /**
   * 获取国家地图数据路径
   *
   * @param {string} country - 国家代码或名称
   * @param {MapVersion} mapVersion - 地图版本
   * @returns {string} 国家地图数据相对路径
   */
  static getCountryMapPath(country, mapVersion) {
    if (country === "China" || country === "100000") {
      switch (mapVersion) {
        case "international":
          return "world/countries/cn-all.geo.json";
        case "standard":
        default:
          return "china/100000.json";
      }
    } else {
      return `world/countries/${country}-all.geo.json`;
    }
  }
  /**
   * 获取省级地图数据路径
   *
   * @param {string} country - 国家代码或名称
   * @param {string} region - 省级区域代码或名称
   * @returns {string} 省级地图数据相对路径
   */
  static getProvinceMapPath(country, region) {
    if (country === "China" || country === "100000") {
      return `china/${region}_full.json`;
    } else if (country === "USA" || country === "840") {
      return `usa/states/${region}.json`;
    } else {
      return `world/regions/${country}/${region}.json`;
    }
  }
  /**
   * 获取城市级地图数据路径
   *
   * @param {string} country - 国家代码或名称
   * @param {string} region - 城市区域代码或名称
   * @returns {string} 城市级地图数据相对路径
   */
  static getCityMapPath(country, region) {
    if (country === "China" || country === "100000") {
      return `china/${region}.json`;
    } else if (country === "USA" || country === "840") {
      return `usa/cities/${region}.json`;
    } else {
      return `world/cities/${country}/${region}.json`;
    }
  }
  /**
   * 获取县级地图数据路径
   *
   * @param {string} country - 国家代码或名称
   * @param {string} region - 县级区域代码或名称
   * @returns {string} 县级地图数据相对路径
   */
  static getCountyMapPath(country, region) {
    if (country === "China" || country === "100000") {
      return `china/${region}.json`;
    } else if (country === "USA" || country === "840") {
      return `usa/counties/${region}.json`;
    } else {
      return `world/counties/${country}/${region}.json`;
    }
  }
  /**
   * 获取完整的数据路径
   *
   * @param {string} relativePath - 相对路径
   * @returns {string} 完整的数据访问路径
   */
  static getFullPath(relativePath) {
    const basePath = this.getBasePath();
    return `${basePath}/${relativePath}`;
  }
};
var MapDataService2 = class _MapDataService {
  /**
   * 根据路径获取地图数据
   */
  static async getMapData(path) {
    let data;
    try {
      const fullPath = MapDataPathManager.getFullPath(path);
      const response = await fetch(fullPath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      data = await response.json();
    } catch (error) {
      console.error(`Failed to fetch map data from ${path}:`, error);
      return {
        type: "FeatureCollection",
        features: []
      };
    }
    return data || {
      type: "FeatureCollection",
      features: []
    };
  }
  /**
   * 处理中国地图特殊数据（移除9段线等）
   */
  static processChinaMapData(data) {
    data.features = data.features.filter((feature) => {
      if (!feature.properties?.name) {
        return false;
      }
      if (feature.properties.name === "\u6D77\u5357\u7701") {
        if (feature.geometry && feature.geometry.type === "MultiPolygon" && feature.geometry.coordinates && Array.isArray(feature.geometry.coordinates)) {
          feature.geometry.coordinates = feature.geometry.coordinates.slice(0, 1);
        }
      }
      return true;
    });
    return data;
  }
  /**
  * 获取地图 GeoJSON 数据（对外接口，合并了 fetchGeoJson 和 getGeoJsonData）
  */
  static async getGeoJsonData(params) {
    const path = MapDataPathManager.generateDataPath({
      currentLevel: params.mapLevel,
      country: params.country,
      region: params.region
    });
    if (!path) {
      throw new Error("Detail data path not found");
    }
    return await _MapDataService.getMapData(path);
  }
};
var index_default = MapDataService2;

// src/utils/mapLevelUtils.ts
import { MapLevel as MapLevel6 } from "@orch-map/types";

// src/utils/mapHelper.ts
var isMunicipality = (postcode) => {
  return MUNICIPALITY_CODES.has(postcode);
};

// src/utils/mapLevelUtils.ts
var MapLevelUtils = class {
  /**
   * @description: 判断地图下钻层级
   * 根据地图下钻层级 来判断是否能继续下钻
   * @param level - 地图层级
   * @returns 层级数值 (0-4)
   */
  static mapLevelMatrix(level) {
    switch (level) {
      case MapLevel6.COUNTRY:
        return 1;
      case MapLevel6.PROVINCE:
        return 2;
      case MapLevel6.CITY:
        return 3;
      case MapLevel6.COUNTY:
        return 4;
      case MapLevel6.WORLD:
      default:
        return 0;
    }
  }
  /**
   * 将层级数值转换为地图层级枚举
   * @param level - 层级数值
   * @returns 地图层级枚举
   */
  static levelNumToLevel(level) {
    switch (level) {
      case 1:
        return MapLevel6.COUNTRY;
      case 2:
        return MapLevel6.PROVINCE;
      case 3:
        return MapLevel6.CITY;
      case 4:
        return MapLevel6.COUNTY;
      default:
        return MapLevel6.WORLD;
    }
  }
  /**
   * 检查地图入口资格，确定是否可以进入下一级地图
   * @returns 下一级地图层级，如果无法进入则返回 undefined
   */
  static checkMapEntryEligibility() {
    switch (MapStateManager.curLevel) {
      case MapLevel6.WORLD: {
        return MapLevel6.COUNTRY;
      }
      case MapLevel6.COUNTRY: {
        return MapLevel6.PROVINCE;
      }
      case MapLevel6.PROVINCE:
        return MapLevel6.CITY;
      case MapLevel6.CITY:
        if (!isMunicipality(MapStateManager.postcode)) {
          return MapLevel6.COUNTY;
        }
        return void 0;
      case MapLevel6.COUNTY:
      default:
        return void 0;
    }
  }
  /**
   * 检查是否支持下一级地图
   * @param nextLevel - 下一级地图层级
   * @returns 是否支持
   */
  static isNextLevelSupported(nextLevel) {
    if (MapStateManager.curLevel === MapLevel6.COUNTRY && nextLevel === MapLevel6.PROVINCE) {
      return MapStateManager.country === "China" || MapStateManager.country === "United States";
    }
    return true;
  }
};

// src/main.ts
import { isUndef as isUndef3, svgToEChartsSymbol } from "@orch-map/utils";
var OrchMap = class {
  /**
   * 构造函数
   * @param {MapRendererConfig} config - 地图渲染器配置
   * @param {Record<string, string>} extraSvgIcons - 额外的 SVG 图标（原始 SVG 字符串）
   */
  constructor(config, extraSvgIcons = {}) {
    /** 是否已初始化 */
    this._initialized = false;
    /** 初始化回调队列 */
    this._initCallbacks = [];
    this.config = config;
    MapStateManager.mapVersion = this.config.mapVersion || "standard";
    MapStateManager.extraSvgIcons = extraSvgIcons;
    const echartsSymbols = {};
    Object.keys(extraSvgIcons).forEach((key) => {
      echartsSymbols[key] = svgToEChartsSymbol(extraSvgIcons[key]);
    });
    MapStateManager.echartsSymbols = echartsSymbols;
    this._initPromise = this.initMap().then(() => {
      this._initialized = true;
      this._initCallbacks.forEach((callback) => callback());
      this._initCallbacks = [];
    });
  }
  get mapType() {
    return this.config.renderType === "echarts" /* ECHARTS */ ? "echart" : "deckgl";
  }
  /**
   * 初始化地图
   * @private
   * @returns {Promise<void>} 初始化 Promise
   */
  async initMap() {
    MapStateManager.curLevel = this.config.curLevel;
    MapStateManager.postcode = this.config.postcode ?? "";
    MapStateManager.country = this.config.country ?? "";
    await this.getGeoData({
      currentLevel: this.config.curLevel,
      country: this.config.country ?? "",
      region: this.config.postcode ?? ""
    });
    switch (this.config.renderType) {
      case "echarts" /* ECHARTS */:
        this.instance = new EchartsMap(
          this.config.container,
          {
            ...this.config,
            events: {
              ...this.config.events,
              onAreaDoubleClick: async (region) => {
                this.config.events?.onAreaDoubleClick?.(region);
                void await this.entryNextLevel(region);
              }
            }
          },
          MapStateManager.geoData
        );
        break;
      case "deckgl" /* DECKGL */:
        this.instance = new deckgl_default(
          this.config.container,
          this.config.mode ?? "2d",
          () => {
            console.log("DeckGL initialized");
          },
          {
            ...this.config.events,
            onAreaDoubleClick: async (region) => {
              this.config.events?.onAreaDoubleClick?.(region);
              void await this.entryNextLevel(region);
            }
          }
        );
        break;
    }
  }
  /**
   * 设置地图点位数据
   * @param {BaseMapPoint[]} points - 点位数据数组
   */
  setPoints(points) {
    MapStateManager.allPoints = points;
    this._executeWhenReady(() => {
      const filteredPoints = this.filterPointsByCurrentLevel(points);
      void this.instance.setPoints(filteredPoints);
    });
  }
  /**
   * 设置地图线条数据
   * @param {BaseMapLine[]} lines - 线条数据数组
   */
  setLines(lines) {
    MapStateManager.allLines = lines;
    this._executeWhenReady(() => {
      const filteredLines = this.filterLinesByCurrentLevel(lines);
      void this.instance.setLines(filteredLines);
    });
  }
  /**
   * @description: 计算中国地图的行政区划代码
   */
  calculateChinaPostcode(region) {
    const nextPostcode = GeoUtils.getPostCodeByGeoFeatures(region);
    MapStateManager.postcode = nextPostcode;
  }
  async entryNextLevel(region) {
    const nextLevel = MapLevelUtils.checkMapEntryEligibility();
    if (isUndef3(nextLevel)) {
      return;
    }
    if (nextLevel && !MapLevelUtils.isNextLevelSupported(nextLevel)) {
      return;
    }
    this.calculateChinaPostcode(region);
    MapStateManager.country = MapStateManager.country || region;
    MapStateManager.region = region;
    MapStateManager.curLevel = nextLevel;
    await this.getGeoData({
      currentLevel: nextLevel,
      country: MapStateManager.country,
      region: MapStateManager.country === "China" ? MapStateManager.postcode : region
    });
    void this.instance.setGEOData(MapStateManager.geoData);
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
  async navigateToLevel(targetLevel, country = "", region = "", postcode = "") {
    MapStateManager.curLevel = targetLevel;
    MapStateManager.country = country;
    MapStateManager.region = region;
    MapStateManager.postcode = postcode;
    await this.getGeoData({
      currentLevel: targetLevel,
      country,
      region: country === "China" ? postcode : region
    });
    void this.instance.setGEOData(MapStateManager.geoData);
    this.updatePointsAndLinesForCurrentLevel();
  }
  /**
   * 返回到世界地图
   * @description 快捷方法，重置地图状态并返回到世界地图视图
   * @returns {Promise<void>} 返回操作的 Promise
   */
  async returnToWorldMap() {
    return this.navigateToLevel(MapLevel7.WORLD);
  }
  async getGeoData(params) {
    const geoData = await index_default.getGeoJsonData({
      mapLevel: params.currentLevel,
      country: params.country,
      region: params.region,
      mapType: this.mapType
    });
    MapStateManager.setGeoData(geoData);
  }
  /**
   * 根据当前地图层级过滤点位
   * @param points - 点位数据数组
   * @returns 过滤后的点位数组
   */
  filterPointsByCurrentLevel(points) {
    if (MapStateManager.curLevel === "world") {
      return points;
    }
    return GeoUtils.filterPointsInGeoJSON(points, MapStateManager.geoData);
  }
  /**
   * 根据当前地图层级过滤线条
   * @param lines - 线条数据数组
   * @returns 过滤后的线条数组
   */
  filterLinesByCurrentLevel(lines) {
    if (MapStateManager.curLevel === "world") {
      return lines;
    }
    const geoData = MapStateManager.geoData;
    return lines.filter((line) => {
      const [startLng, startLat] = line.startCoordinate;
      const [endLng, endLat] = line.endCoordinate;
      const fromInRegion = GeoUtils.isPointInGeoJSON(
        startLng,
        startLat,
        geoData
      );
      const toInRegion = GeoUtils.isPointInGeoJSON(
        endLng,
        endLat,
        geoData
      );
      return fromInRegion && toInRegion;
    });
  }
  /**
   * 更新当前层级的点位和线条
   */
  updatePointsAndLinesForCurrentLevel() {
    if (MapStateManager.allPoints.length > 0) {
      const filteredPoints = this.filterPointsByCurrentLevel(MapStateManager.allPoints);
      void this.instance.setPoints(filteredPoints);
    }
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
  _executeWhenReady(callback) {
    if (this._initialized) {
      callback();
    } else {
      this._initCallbacks.push(callback);
    }
  }
  /**
   * 检查是否已初始化
   * @returns {boolean} 是否已初始化
   */
  isInitialized() {
    return this._initialized;
  }
  /**
   * 等待初始化完成
   * @returns {Promise<void>} 初始化完成的 Promise
   */
  waitForInitialization() {
    return this._initPromise;
  }
  /**
   * 根据环境自动选择最佳渲染器
   * @param {Partial<MapRendererConfig>} [config] - 渲染器配置
   * @returns {MapRendererType} 推荐的渲染器类型
   */
  static getRecommendedType(config) {
    if (config?.mode === "3d") {
      return "deckgl" /* DECKGL */;
    }
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
    if (gl) {
      return "deckgl" /* DECKGL */;
    }
    return "echarts" /* ECHARTS */;
  }
};

// src/index.ts
var index_default2 = OrchMap;
export {
  LinesComponent as EChartsGeoUtils,
  MapRendererType,
  index_default2 as default
};
//# sourceMappingURL=index.mjs.map