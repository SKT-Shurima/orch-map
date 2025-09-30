// src/echarts-geo/index.ts
import { debounce, GeoJsonUtils, isEmptyArray, isUndef } from "@orch-map/utils";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { GeoComponent, TooltipComponent, TitleComponent } from "echarts/components";

// src/interfaces/index.ts
var MapRendererType = /* @__PURE__ */ ((MapRendererType2) => {
  MapRendererType2["ECHARTS"] = "echarts";
  MapRendererType2["DECKGL"] = "deckgl";
  return MapRendererType2;
})(MapRendererType || {});

// src/utils/geoDataService.ts
var GeoDataService = class {
  // 配置 public 目录的基础路径
  static getPublicBasePath() {
    if (typeof window !== "undefined") {
      return "/mapData";
    } else {
      return "../../mapData";
    }
  }
  /**
   * 根据键值获取地图数据
   */
  static async getMapData(path) {
    if (this.cache[path]) {
      return this.cache[path];
    }
    let data;
    try {
      const basePath = this.getPublicBasePath();
      const response = await fetch(`${basePath}/${path}.json`);
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
    this.cache[path] = data;
    return data ? data : {
      type: "FeatureCollection",
      features: []
    };
  }
  /**
   * 获取边界地图数据路径
   */
  static getBoundaryDataPath(params) {
    const { currentLevel, region, country } = params;
    switch (currentLevel) {
      case "world" /* WORLD */:
        return "world/world_edge.geo" /* WORLD_BOUNDARY */;
      case "country" /* COUNTRY */:
        if (region === "100000") {
          return "china/000000_edge" /* CHINA_BOUNDARY */;
        } else if (region === "us") {
          return "us/united-states" /* US_BOUNDARY */;
        }
        return "";
      case "province" /* PROVINCE */:
      case "city" /* CITY */:
      case "county" /* COUNTY */:
        if (country === "100000") {
          return `china/${region}`;
        } else if (country === "us") {
          return `us/${region}-all.geo`;
        }
        return "";
      default:
        return "";
    }
  }
  /**
   * 获取详细地图数据路径
   */
  static getDetailDataPath(params) {
    const { currentLevel, region, country, mapType } = params;
    switch (currentLevel) {
      case "world" /* WORLD */:
        return "world/wgs84_world_for_US.geo" /* WORLD_WGS84_FOR_US */;
      // return MapDataPath.WORLD_WGS84;  
      // if (mapType === "deckgl") {
      // } else {
      //   return MapDataPath.WORLD;
      // }
      case "country" /* COUNTRY */:
        if (region === "100000") {
          return "china/100000_full" /* CHINA */;
        } else {
          return `world/countries/${region}-all.geo`;
        }
      case "province" /* PROVINCE */:
        return country === "100000" ? `china/${region}_full` : "";
      case "city" /* CITY */:
        return country === "100000" ? `china/${region}` : "";
      case "county" /* COUNTY */:
        return country === "100000" ? `china/${region}` : "";
      default:
        return "";
    }
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
   * 获取边界地图数据
   */
  //  private static async fetchBoundaryGeoJson(params: GeoDataParams): Promise<GeoJsonData> {
  //   const path = this.getBoundaryDataPath(params);
  //   if (!path) {
  //     throw new Error("Boundary data path not found");
  //   }
  //   return this.getMapData(path);
  // }
  /**
   * 获取详细地图数据
   */
  static async fetchDetailGeoJson(params) {
    const path = this.getDetailDataPath(params);
    if (!path) {
      throw new Error("Detail data path not found");
    }
    let data = await this.getMapData(path);
    if (params.currentLevel === "country" /* COUNTRY */ && params.region === "100000") {
      data = this.processChinaMapData(data);
    }
    return data;
  }
  /**
   * 清除缓存
   */
  static clearCache() {
    this.cache = {};
  }
  /**
   * 预加载常用地图数据
   */
  static async preloadCommonMaps() {
    const commonMaps = [
      { currentLevel: "world" /* WORLD */, region: "world", country: "", mapType: "echart" },
      { currentLevel: "country" /* COUNTRY */, region: "100000", country: "100000", mapType: "echart" }
    ];
    await Promise.all(
      commonMaps.map((params) => this.fetchGeoJson(params))
    );
  }
  /**
  * 同时获取边界和详细地图数据
  */
  static async fetchGeoJson(params) {
    return await this.fetchDetailGeoJson(params);
  }
};
GeoDataService.cache = {};
async function getGeoJsonData(params) {
  return await GeoDataService.fetchGeoJson({
    currentLevel: params.mapLevel,
    country: params.country,
    region: params.region,
    mapType: params.mapType ?? "echart"
  });
}

// src/MapStateManager.ts
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
  // 静态 getter/setter - adcode
  static get adcode() {
    return _MapStateManager._adcode;
  }
  static set adcode(adcode) {
    const oldValue = _MapStateManager._adcode;
    _MapStateManager._adcode = adcode;
    _MapStateManager.notifyPropertyChange("adcode", adcode, oldValue);
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
    const result = await getGeoJsonData(config);
    _MapStateManager.setGeoData(result);
    return result;
  }
  /**
   * 重置到默认状态
   */
  static reset() {
    _MapStateManager._curLevel = "world" /* WORLD */;
    _MapStateManager._country = "100000";
    _MapStateManager._adcode = "100000";
    _MapStateManager._geoData = void 0;
    _MapStateManager._detailGeoData = void 0;
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
_MapStateManager._curLevel = "world" /* WORLD */;
_MapStateManager._country = "100000";
// 默认中国
_MapStateManager._adcode = "100000";
// 属性监听器
_MapStateManager.propertyListeners = /* @__PURE__ */ new Map();
var MapStateManager = _MapStateManager;

// src/echarts-geo/echart.option.ts
var POST_CODE_KEY = "hc-key";
var BOUNDARY_OPTIONS = {
  zoom: 1.3,
  hoverLayerThreshold: 1,
  // 修复：允许hover事件触发
  silent: false,
  roam: true,
  center: null,
  scaleLimit: { min: 1 },
  zlevel: 0,
  itemStyle: {
    areaColor: "#094777",
    borderWidth: 0,
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
      borderWidth: 0
    }
  }
  // regions: [
  //   {
  //     name: "南海诸岛",
  //     itemStyle: {
  //       opacity: 0,
  //     },
  //   },
  // ],
};

// src/echarts-geo/index.ts
echarts.use([CanvasRenderer, GeoComponent, TooltipComponent, TitleComponent]);
var G2 = { CHINA: "\u4E2D\u56FD", USA: "\u7F8E\u56FD" };
var CHINA_AD_CODE_JUST_FOR_FE = "100000";
var US_AD_CODE_JUST_FOR_FE = "us";
var MUNICIPALITY_CODES = /* @__PURE__ */ new Set(["110000", "120000", "310000", "500000"]);
var isMunicipality = (adcode) => MUNICIPALITY_CODES.has(adcode);
var JUST_SUPPORTED_NEXT_LEVEL_COUNTRIES_AD_CODE = [CHINA_AD_CODE_JUST_FOR_FE, US_AD_CODE_JUST_FOR_FE];
var EchartsMap = class {
  constructor(container, options) {
    this.detailMap = "";
    this.chartInstance = null;
    this.series = [];
    this.boundaryLoading = false;
    this.unsubscribeState = null;
    this.mouseoverHandler = (params) => {
      switch (params.componentType) {
        case "geo":
          this.handleChangeArea(params);
          break;
        case "series":
          this.events.onHoverPoint?.(params);
          break;
        default:
          this.events.onHoverArea?.();
          break;
      }
    };
    this.mouseoutHandler = (params) => {
      switch (params.componentType) {
        case "geo":
          this.handleChangeArea();
          break;
        case "series":
          break;
        default:
          this.handleChangeArea();
          break;
      }
    };
    this.clickHandler = (params) => {
      params.event.event.stopPropagation();
      if (params.componentType === "geo") {
        this.events.onClickArea?.(params);
        return;
      }
      if (params.componentType === "series" && (params.componentSubType === "scatter" /* SCATTER */ || params.componentSubType === "effectScatter" /* EFFECT_SCATTER */)) {
        this.events.onClickPoint?.(params);
      }
    };
    this.dbClickHandler = (params) => {
      params.event.event.stopPropagation();
      if (params.componentType === "geo") {
        const nextLevel = this.checkMapEntryEligibility(params);
        if (isUndef(nextLevel)) {
          return;
        }
        if (MapStateManager.curLevel === "country" /* COUNTRY */ && nextLevel === "province" /* PROVINCE */ && !JUST_SUPPORTED_NEXT_LEVEL_COUNTRIES_AD_CODE.includes(MapStateManager.adcode)) {
          return;
        }
        let nextAdCode;
        if (MapStateManager.curLevel === "world" /* WORLD */) {
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
        params.region.adcode = nextAdCode;
        this.events.onDoubleClickArea?.(nextLevel, params);
        MapStateManager.curLevel = nextLevel;
        MapStateManager.adcode = nextAdCode;
        MapStateManager.country = params.region.name ?? "";
        MapStateManager.getGeoJsonData({
          mapLevel: nextLevel,
          country: params.region.name ?? "",
          region: nextAdCode
        }).then((result) => {
          MapStateManager.setGeoData(result);
        });
      }
    };
    this.updateSeriesImpl = async (series) => {
      await this.waitForBoundaryLoadingToBeFalse();
      if (this.currentMapIsChina) {
        const option = { series };
        this.setChartOption(option);
      } else {
        if (MapStateManager.curLevel === "country" /* COUNTRY */ && MapStateManager.adcode === US_AD_CODE_JUST_FOR_FE) {
          const option = { series };
          this.setChartOption(option);
        } else {
          const newSeries = this.transSeriesCoordinate2GeoJsonXY(series);
          const option = { series: newSeries };
          this.setChartOption(option);
        }
      }
    };
    this.redrawMap = () => {
      const chartInstance = this.chartInstance;
      if (!chartInstance) {
        return;
      }
      const newOption = chartInstance.getOption();
      const geo = newOption.geo;
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
        zoom: geoComponent.zoom
      });
      this.events.onZoom?.(geoComponent.zoom);
    };
    this.resizeMap = () => {
      this.chartInstance?.resize();
    };
    // 将原有装饰器方法替换为基于函数的防抖版本
    this.updateSeries = debounce(this.updateSeriesImpl.bind(this), 300);
    this.handleChangeArea = debounce(this.handleChangeAreaImpl.bind(this), 600);
    if (typeof container === "string") {
      const element = document.getElementById(container);
      if (!element) {
        throw new Error(`Container element with id "${container}" not found`);
      }
      this.container = element;
    } else {
      this.container = container;
    }
    if ("container" in options) {
      this.config = options;
      this.events = this.convertEventsToEchartsFormat(this.config.events);
    } else {
      this.events = options.events || {};
      this.config = {
        container: this.container,
        events: this.events
      };
    }
    this.initChart();
    this.registerEvents();
  }
  get currentMapIsChina() {
    return MapStateManager.country === CHINA_AD_CODE_JUST_FOR_FE;
  }
  get detailGeojson() {
    return echarts.getMap(this.detailMap)?.geoJson ?? {};
  }
  setChartOption(option) {
    if (!this.chartInstance) return;
    this.chartInstance.setOption(option);
  }
  setGEOData(boundary, detail) {
    if (!detail || !detail.features) {
      this.boundaryLoading = false;
      return;
    }
    let center = null;
    let scale = 1;
    if (MapStateManager.curLevel === "world" /* WORLD */) {
      if (this.centralCountry) {
        const feature = detail.features.find((item) => item.id === this.centralCountry);
        const targetCoordinates = feature?.geometry && "coordinates" in feature.geometry ? feature.geometry.coordinates : [];
        const { center: c, zoom: z } = this.getCenterAndZoomByGeometryCoordinates(targetCoordinates);
        scale = z;
        center = c;
      }
    } else if (MapStateManager.curLevel !== "country" /* COUNTRY */) {
      const targetCoordinates = detail.features.map(
        (item) => "coordinates" in item.geometry ? item.geometry.coordinates : []
      );
      const { center: c } = this.getCenterAndZoomByGeometryCoordinates(targetCoordinates);
      center = c;
    }
    const isWorld = MapStateManager.curLevel === "world" /* WORLD */;
    const option = {
      geo: {
        ...BOUNDARY_OPTIONS,
        map: this.detailMap,
        center,
        zoom: scale || (isWorld ? 1.3 : 1),
        itemStyle: {
          ...BOUNDARY_OPTIONS.itemStyle,
          borderWidth: isWorld ? 0 : 1,
          shadowBlur: isWorld ? 1 : 0
        }
      }
    };
    this.setChartOption(option);
    this.boundaryLoading = false;
  }
  handleChangeAreaImpl(params) {
    if (!params) {
      this.events.onHoverArea?.();
      return;
    }
    const series = this.chartInstance?.getOption()?.series;
    const points = series?.find((item) => item.type === "scatter" /* SCATTER */)?.data;
    const hoverFeature = this.detailGeojson.features?.find((item) => item.properties?.name === params.name);
    if (!points || !hoverFeature) {
      return;
    }
    const pointsInRegion = [];
    points.forEach((point) => {
      const coordinates = point.value;
      const isInRegion = this.checkPointInFeature(coordinates, hoverFeature);
      if (isInRegion && point.businessInfo && typeof point.businessInfo === "object" && "siblingPointId" in point.businessInfo) {
        pointsInRegion.push(...point.businessInfo.siblingPointId);
      }
    });
    this.events.onHoverArea?.(params, pointsInRegion);
  }
  checkPointInFeature(coordinates, feature) {
    if (feature.geometry.type === "Polygon") {
      return this.checkPointInPolygon(coordinates, feature.geometry.coordinates);
    }
    if (feature.geometry.type === "MultiPolygon") {
      return feature.geometry.coordinates.some((polygon) => this.checkPointInPolygon(coordinates, polygon));
    }
    return false;
  }
  checkPointInPolygon(coordinates, polygonRings) {
    return polygonRings.some((ring, index) => {
      const isInRing = GeoJsonUtils.isPointInPolygon(coordinates, ring);
      return index === 0 ? isInRing : !isInRing;
    });
  }
  checkMapEntryEligibility(params) {
    switch (MapStateManager.curLevel) {
      case "world" /* WORLD */: {
        return "country" /* COUNTRY */;
      }
      case "country" /* COUNTRY */: {
        if (params.name === "\u5357\u6D77\u8BF8\u5C9B") {
          return;
        }
        return "province" /* PROVINCE */;
      }
      case "province" /* PROVINCE */:
        return "city" /* CITY */;
      case "city" /* CITY */:
        if (!isMunicipality(MapStateManager.adcode)) {
          return "county" /* COUNTY */;
        }
        return void 0;
      case "county" /* COUNTY */:
      default:
        break;
    }
  }
  getPostCodeByGeoFeatures(name) {
    const target = this.detailGeojson.features.find((item) => item.properties?.name === name);
    if (!target) {
      return "";
    }
    if (this.currentMapIsChina) {
      const props2 = target.properties;
      return props2?.adcode ? String(props2.adcode) : "";
    }
    const props = target.properties;
    const code = props[POST_CODE_KEY];
    return typeof code === "string" ? code : "";
  }
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
  transSeriesCoordinate2GeoJsonXY(series) {
    const transform = this.detailGeojson["hc-transform"];
    return series.map((item) => {
      let data;
      if (item.type === "scatter" /* SCATTER */ || item.type === "effectScatter" /* EFFECT_SCATTER */) {
        data = item.data.map((point) => {
          return {
            ...point,
            value: GeoJsonUtils.lngLatToProjected(transform, point.value)
          };
        });
      } else if (item.type === "lines") {
        data = item.data.map((line) => {
          const [startCoords, endCoords] = line.coords;
          return {
            ...line,
            coords: [GeoJsonUtils.lngLatToProjected(transform, startCoords), GeoJsonUtils.lngLatToProjected(transform, endCoords)]
          };
        });
      }
      return {
        ...item,
        data: data || item.data
      };
    });
  }
  setPointStyleInternal(targetSeriesName, processFn) {
    const currentOption = this.chartInstance?.getOption();
    if (!currentOption || !Array.isArray(currentOption.series)) {
      return;
    }
    const series = currentOption.series;
    const pointSeries = series.find((item) => item.name === targetSeriesName);
    if (!pointSeries) {
      return;
    }
    const data = pointSeries.data;
    data.forEach((item) => {
      processFn(item);
    });
    const newOption = { series };
    this.setChartOption(newOption);
  }
  registerEvents() {
    window.addEventListener("resize", this.resizeMap);
  }
  updateMapLevel(curLevel) {
    MapStateManager.curLevel = curLevel;
    const chart = this.chartInstance;
    const currentOption = chart?.getOption?.();
    const geo = currentOption?.geo || [];
    const hasInitializedGeo = Array.isArray(geo) && geo[0] && geo[0].map;
    if (!hasInitializedGeo) {
      return;
    }
    const isWorld = curLevel === "world" /* WORLD */;
    const option = {
      geo: {
        itemStyle: {
          ...BOUNDARY_OPTIONS.itemStyle,
          borderWidth: isWorld ? 0 : 1,
          shadowBlur: isWorld ? 1 : 0
        }
      }
    };
    this.setChartOption(option);
  }
  destroy() {
    try {
      if (this.detailMap) {
        this.chartInstance?.clear();
      }
    } catch (error) {
    }
    window.removeEventListener("resize", this.resizeMap);
    this.chartInstance?.dispose();
    if (this.unsubscribeState) {
      this.unsubscribeState();
      this.unsubscribeState = null;
    }
  }
  async initChart() {
    if (!this.container) {
      return;
    }
    await MapStateManager.getGeoJsonData({
      mapLevel: "world" /* WORLD */,
      country: this.config.country ?? "100000",
      region: this.config.adcode ?? "100000"
    });
    const instance = echarts.init(this.container);
    this.chartInstance = instance;
    const baseOption = {
      tooltip: {
        show: false
      },
      geo: {
        ...BOUNDARY_OPTIONS
      },
      series: this.series
    };
    const geojson = MapStateManager.geoData;
    echarts.registerMap(`${this.detailMap}-geo`, geojson);
    this.setChartOption(baseOption);
    instance.on("click", this.clickHandler);
    instance.on("dblclick", this.dbClickHandler);
    instance.on("mouseover", this.mouseoverHandler);
    instance.on("mouseout", this.mouseoutHandler);
    instance.on("georoam", this.redrawMap);
  }
  /**
   * 处理状态变化
   */
  handleStateChange(newState, oldState) {
    if (!this.chartInstance) return;
    if (newState.curLevel !== oldState.curLevel) {
      this.updateMapLevel(newState.curLevel);
    }
    if (newState.geoData !== oldState.geoData) {
      this.setGEOData(newState.geoData, newState.detailGeoData);
    }
    if (newState.points !== oldState.points) {
      this.updatePointsInEcharts(newState.points);
    }
    if (newState.lines !== oldState.lines) {
      this.updateLinesInEcharts(newState.lines);
    }
  }
  /**
   * 在 ECharts 中更新点数据
   */
  async updatePointsInEcharts(points) {
    if (!this.chartInstance) return;
    const pointSeries = this.convertPointsToSeries(points);
    await this.updateSeries(pointSeries);
  }
  /**
   * 在 ECharts 中更新线数据
   */
  async updateLinesInEcharts(lines) {
    if (!this.chartInstance) return;
    const lineSeries = this.convertLinesToSeries(lines);
    await this.updateSeries([...lineSeries]);
  }
  /**
   * 将统一的事件格式转换为 ECharts 需要的格式
   */
  convertEventsToEchartsFormat(events) {
    if (!events) return {};
    return {
      onClickPoint: events.onPointClick ? (params) => {
        const point = this.findPointByData(params);
        if (point) events.onPointClick(point);
      } : void 0,
      onHoverPoint: events.onPointHover ? (params) => {
        const point = this.findPointByData(params);
        events.onPointHover(point || null);
      } : void 0,
      onClickArea: events.onAreaClick ? (params) => {
        if (params) {
          events.onAreaClick({
            name: params.name,
            adcode: params.region?.adcode
          });
        }
      } : void 0,
      onHoverArea: events.onAreaHover ? (params, pointsInRegion) => {
        if (params) {
          events.onAreaHover({
            name: params.name,
            adcode: params.region?.adcode
          });
        } else {
          events.onAreaHover(null);
        }
      } : void 0,
      onDoubleClickArea: events.onAreaDoubleClick ? (nextLevel, params) => {
        events.onAreaDoubleClick({
          name: params.name,
          adcode: params.region?.adcode,
          nextLevel
        });
      } : void 0,
      onZoom: events.onZoom
    };
  }
  /**
   * 根据 ECharts 事件参数查找对应的点数据
   */
  findPointByData(params) {
    if (!params.data || !params.data.businessInfo) return void 0;
    const businessInfo = params.data.businessInfo;
    if (!businessInfo || typeof businessInfo !== "object" || !("id" in businessInfo)) return void 0;
  }
  /**
   * 规范化地理数据格式
   */
  normalizeGeoData(data) {
    if ("type" in data && data.type === "FeatureCollection") {
      return data;
    }
    return data;
  }
  /**
   * 将点数据转换为 ECharts Series
   */
  convertPointsToSeries(points) {
    const scatterData = points.map((point) => ({
      name: point.name || "",
      value: [...point.coordinate, point.value || 0],
      businessInfo: point,
      itemStyle: point.style ? {
        color: point.style.color,
        opacity: point.style.opacity
      } : void 0
    }));
    return [{
      name: "points",
      type: "scatter" /* SCATTER */,
      coordinateSystem: "geo",
      data: scatterData,
      symbolSize: (val) => {
        const point = val[2] || 10;
        return Math.sqrt(point) * 2;
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          position: "right"
        }
      }
    }];
  }
  /**
   * 将线数据转换为 ECharts Series
   */
  convertLinesToSeries(lines) {
    const lineData = lines.map((line) => ({
      coords: [line.from, line.to],
      businessInfo: line,
      lineStyle: line.color ? {
        color: line.color?.toString(),
        width: line.width || 2,
        opacity: line.opacity || 1
      } : void 0
    }));
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
        symbolSize: 3
      },
      lineStyle: {
        width: 2,
        opacity: 0.6
      }
    }];
  }
  // IMapRenderer interface implementation
  async setGeoData(boundary) {
    if (!this.chartInstance) return;
    const geoData = this.normalizeGeoData(boundary);
    MapStateManager.setGeoData(geoData);
  }
  async setPoints(points) {
    if (!this.chartInstance) return;
  }
  async setLines(lines) {
    if (!this.chartInstance) return;
  }
  async updateMapView(config) {
    MapStateManager.curLevel = config.curLevel;
    MapStateManager.adcode = config.adcode;
    MapStateManager.country = config.country;
    const geoData = await getGeoJsonData({
      mapLevel: config.curLevel,
      country: config.country,
      region: config.adcode
    });
    MapStateManager.setGeoData(geoData);
  }
  // IMapRenderer interface method - adapts to existing setPointStyle
  setPointStyle(seriesName, styleProcessor) {
    if (!this.chartInstance) return;
    this.setPointStyleInternal(seriesName, (dataItem) => {
      const point = this.findPointByData({ data: dataItem });
      if (point) {
        styleProcessor(point);
      }
    });
  }
  resize() {
    this.resizeMap();
  }
  getType() {
    return "echarts";
  }
  // 计算中心和缩放（简单估算）
  getCenterAndZoomByGeometryCoordinates(coords) {
    const flat = [];
    const collect = (c) => {
      if (Array.isArray(c)) {
        if (typeof c[0] === "number" && typeof c[1] === "number") {
          flat.push([c[0], c[1]]);
        } else {
          for (const sub of c) collect(sub);
        }
      }
    };
    collect(coords);
    if (flat.length === 0) return { center: null, zoom: 1 };
    let minLng = flat[0][0], maxLng = flat[0][0], minLat = flat[0][1], maxLat = flat[0][1];
    for (const [lng, lat] of flat) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
    const center = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
    const lngDiff = Math.max(1e-4, Math.abs(maxLng - minLng));
    const latDiff = Math.max(1e-4, Math.abs(maxLat - minLat));
    const zoom = Math.min(Math.log2(360 / lngDiff), Math.log2(180 / latDiff));
    return { center, zoom: Math.max(0.5, Math.min(zoom, 6)) };
  }
};

// src/adapters/DeckglMapAdapter.ts
import { MapLevel as MapLevel2 } from "@orch-map/types";

// src/deckgl/deckInstance.ts
import { Deck, MapView } from "@deck.gl/core";
var _DeckInstance = class _DeckInstance {
  /**
   * 创建并注册一个 Deck 实例
   * 注意：如传入已存在的 instanceId 会抛出异常，外层应保证唯一性。
   * 现在会自动等待 DeckGL 静态文件加载完成
   */
  static async setInstance(instanceId, container, initialViewState, props) {
    if (_DeckInstance._instanceMap.has(instanceId)) {
      throw new Error(`Instance with id ${instanceId} already exists`);
    }
    const mode = props?.mode || "2d";
    const mapView = new MapView({
      repeat: true,
      controller: {
        scrollZoom: true,
        dragPan: true,
        dragRotate: true,
        doubleClickZoom: true,
        touchZoom: true,
        touchRotate: true,
        keyboard: true
      }
    });
    const deckInstance = new Deck({
      canvas: container,
      initialViewState: {
        ...this._defaultViewState,
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
    _DeckInstance._instanceMap.set(instanceId, deckInstance);
  }
  /**
   * 获取 Deck 实例（不存在会抛错）
   */
  static getInstance(instanceId) {
    const instance = _DeckInstance._instanceMap.get(instanceId);
    if (!instance) {
      throw new Error(`Instance with id ${instanceId} does not exist`);
    }
    return instance;
  }
  /**
   * 移除 Deck 实例（注意：当前仅删除引用，未调用 Deck 的 finalize；可按需扩展释放 GPU 资源）
   */
  static removeInstance(instanceId) {
    if (!_DeckInstance._instanceMap.has(instanceId)) {
      throw new Error(`Instance with id ${instanceId} does not exist`);
    } else {
      _DeckInstance._instanceMap.delete(instanceId);
    }
  }
};
/** 内部实例表，以 instanceId 为键 */
_DeckInstance._instanceMap = /* @__PURE__ */ new Map();
/** 默认视图状态 */
_DeckInstance._defaultViewState = {
  longitude: 0,
  latitude: 30,
  zoom: 1,
  pitch: 0
};
var DeckInstance = _DeckInstance;

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
    if (this.curvatureMap[key] === void 0) {
      this.curvatureMap[key] = this.hashString(key) * (max - min) + min;
    }
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
    const range = customRange || this.calculateCurvatureRange(startLng, startLat, endLng, endLat);
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

// src/deckgl/line2d.ts
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
var DEFAULT_LINE_RGBA = [170, 170, 170, 90];
var DEFAULT_DOT_RGB = [255, 255, 255];
function buildQuadraticBezierPath(start, end, curvature, segments = 64) {
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
var LineRenderer2D = class {
  /**
   * @param curvatureCalculator 曲率计算器实例
   */
  constructor(curvatureCalculator) {
    this.curvatureCalculator = curvatureCalculator;
  }
  /**
   * 创建常驻曲线图层（PathLayer）
   * @param lines 业务线数据数组；每条线包含起终点经纬度
   * @returns PathLayer 实例（包含所有曲线，禁用拾取）
   */
  buildFullCurveLayer(lines) {
    const fullData = lines.map((line) => {
      const curvature = this.curvatureCalculator.calculateCurvatureByCoordinates(
        line.id,
        line.startCoordinate,
        line.endCoordinate
      );
      const path = buildQuadraticBezierPath(line.startCoordinate, line.endCoordinate, curvature, 64);
      const color = line.color ?? DEFAULT_LINE_RGBA;
      return { path, color, width: 0.3 };
    });
    return new PathLayer({
      id: "line-layer",
      data: fullData,
      pickable: false,
      widthScale: 1,
      widthMinPixels: 0.3,
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
   * @param lines 业务线数据数组；每条线包含起终点经纬度
   * @param progress 动画归一化进度 [0, 1)；所有线条共享进度，实现同步动画
   * @param options 尾迹外观参数（可选）
   *
   * 间距说明：
   * - 尾迹点之间的"参数间距"由 step = trailSpan / (dotsPerLine - 1) 决定；
   * - 想更密：增大 dotsPerLine 或减小 trailSpan；想更疏：相反调整。
   *
   * 大小说明：
   * - 点半径沿尾迹从头到尾插值：radius = tailRadius + (headRadius - tailRadius) * w；
   * - headRadius 控制最大半径，tailRadius 控制最小半径。
   * @param options.dotsPerLine 每条线的尾迹圆点数量；越大越密集，默认 12
   * @param options.headRadius 尾迹最前端（头部）圆点半径（像素），默认 3
   * @param options.tailRadius 尾迹末端（尾部）圆点半径（像素），默认 1
   * @param options.headAlpha 尾迹头部圆点透明度（0-255），默认 255
   * @param options.tailAlpha 尾迹尾部圆点透明度（0-255），默认 60
   * @param options.trailSpan 尾迹覆盖曲线参数长度（0~1），控制"队列"长度，默认 0.06
   * @returns ScatterplotLayer 实例（尾迹小圆点）
   */
  buildMovingDotsLayer(lines, progress, options) {
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
      const sx = line.startCoordinate[0];
      const sy = line.startCoordinate[1];
      const ex = line.endCoordinate[0];
      const ey = line.endCoordinate[1];
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
      const baseRgb = Array.isArray(line.color) ? [line.color[0] ?? DEFAULT_DOT_RGB[0], line.color[1] ?? DEFAULT_DOT_RGB[1], line.color[2] ?? DEFAULT_DOT_RGB[2]] : DEFAULT_DOT_RGB;
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
};

// src/deckgl/line3d.ts
import { ArcLayer } from "@deck.gl/layers";
var DEFAULT_RGB = [200, 200, 200];
var LineRenderer3D = class {
  /**
   * 创建 ArcLayer 图层
   * @param lines 业务线数据
   * @param timeRange 可见时间窗口 [start, end]
   * @param lineOffset 每条线的起始偏移（秒）
   * @param lineDuration 每条线的持续时长（秒）
   */
  buildAnimatedLayer(lines, timeRange, lineOffset, lineDuration) {
    return new ArcLayer({
      id: "line-layer",
      data: lines,
      pickable: true,
      getSourcePosition: (d) => [d.startCoordinate[0], d.startCoordinate[1], 100],
      getTargetPosition: (d) => [d.endCoordinate[0], d.endCoordinate[1], 100],
      getSourceTimestamp: (_d, { index }) => index * lineOffset,
      getTargetTimestamp: (_d, { index }) => index * lineOffset + lineDuration,
      timeRange,
      getHeight: 0.6,
      getSourceColor: (d) => {
        if (Array.isArray(d.color)) {
          return [d.color[0] ?? DEFAULT_RGB[0], d.color[1] ?? DEFAULT_RGB[1], d.color[2] ?? DEFAULT_RGB[2]];
        }
        return DEFAULT_RGB;
      },
      getTargetColor: (d) => {
        if (Array.isArray(d.color)) {
          return [d.color[0] ?? DEFAULT_RGB[0], d.color[1] ?? DEFAULT_RGB[1], d.color[2] ?? DEFAULT_RGB[2]];
        }
        return DEFAULT_RGB;
      },
      parameters: { cullMode: "none" }
    });
  }
};

// src/deckgl/glMap.const.ts
var DEFAULT_GEO_FILL_COLOR = [9, 71, 119, 255];
var DEFAULT_GEO_LINE_COLOR = [20, 128, 197, 255];
var DEFAULT_GEO_HIGHLIGHT_COLOR = [48, 121, 200, 255];
var DEFAULT_GEO_LAYER_PROPS = {
  /**
   * 是否启用拾取功能，启用后可以与图层元素进行交互
   */
  pickable: true,
  /**
   * 是否绘制要素的边框线条
   */
  stroked: true,
  /**
   * 是否填充要素的内部区域
   */
  filled: true,
  /**
   * 是否将2D要素挤出为3D效果
   */
  // extruded: false, // Not part of local GeoJsonLayerProps
  /**
   * 线宽缩放比例，用于调整线条粗细
   */
  lineWidthScale: 1,
  /**
   * 线条最小宽度（像素），确保线条在任何缩放级别下的可见性
   */
  lineWidthMinPixels: 1,
  /**
   * 是否启用经度无限滚动，解决地图跨越180度经线的显示问题
   */
  wrapLongitude: true,
  /**
   * 是否自动高亮鼠标悬停的要素
   */
  autoHighlight: true,
  /**
   * 高亮状态下要素的颜色，RGBA格式 - 格式为[r, g, b, a]，取值范围0-255
   */
  highlightColor: DEFAULT_GEO_HIGHLIGHT_COLOR,
  /**
   * 要素边框的默认颜色，RGBA格式 - 格式为[r, g, b, a]，取值范围0-255
   */
  getLineColor: (_d) => DEFAULT_GEO_LINE_COLOR,
  /**
   * 要素边框的宽度，单位为像素
   */
  getLineWidth: () => 1,
  /**
   * 点要素的半径，单位为像素
   */
  getPointRadius: 100,
  /**
   * 文本标签的字体大小，单位为像素
   */
  getTextSize: 12,
  /**
   * 文本标签的颜色，RGBA格式
   */
  getTextColor: [255, 255, 255, 255]
};

// src/deckgl/index.ts
import { isDef, TaskManager } from "@orch-map/utils";

// src/deckgl/icon.layer.ts
var DEFAULT_SVG_ICONS = {
  circle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="8" height="8">
    <circle cx="4" cy="4" r="3" fill="currentColor" />
  </svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="8" height="8">
    <path fill="currentColor" d="M4 5.757L6.06 7 5.455 4.656 7.5 3.08l-2.396-.204L4 1 3.104 2.876.5 3.08l2.045 1.576L1.94 7z"/>
  </svg>`,
  diamond: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="8" height="8">
    <path fill="currentColor" d="M4 1L1 4l3 3 3-3L4 1z"/>
  </svg>`
};

// src/deckgl/iconAtlas.ts
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

// src/deckgl/layerManager.ts
var _MapLayerManager = class _MapLayerManager {
  /**
   * 新增图层（若已存在则委托为 update）
   */
  static addLayer(id, layer) {
    if (_MapLayerManager.layerMap.has(id)) {
      _MapLayerManager.updateLayer(id, layer);
      return;
    }
    _MapLayerManager.layerMap.set(id, layer);
  }
  /**
   * 更新图层：
   * - 若传入 Layer 实例，直接替换（必要时校正 id）；
   * - 若传入 props 片段，基于旧实例构造器重建（浅合并 props）。
   * 性能提示：重建 Layer 实例有一定开销，数据量大时可考虑 updateTriggers 或 attribute 更新。
   */
  static updateLayer(id, layerOrProps) {
    const isLayerInstance = (candidate) => !!candidate && typeof candidate === "object" && "constructor" in candidate && typeof candidate.constructor === "function";
    if (!_MapLayerManager.layerMap.has(id)) {
      if (isLayerInstance(layerOrProps)) {
        _MapLayerManager.layerMap.set(id, layerOrProps);
      }
      return;
    }
    const oldLayer = _MapLayerManager.layerMap.get(id);
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
        _MapLayerManager.layerMap.set(id, rebuilt);
      } else {
        _MapLayerManager.layerMap.set(id, incomingLayer);
      }
      return;
    }
    const OldCtor = oldLayer.constructor;
    const newLayer = new OldCtor({
      ...oldLayer.props ?? {},
      ...layerOrProps,
      id
    });
    _MapLayerManager.layerMap.set(id, newLayer);
  }
  /**
   * 移除图层
   */
  static removeLayer(id) {
    if (_MapLayerManager.layerMap.has(id)) {
      _MapLayerManager.layerMap.delete(id);
    }
  }
  /**
   * 以固定顺序返回所有图层实例
   * 风险提示：若对应 id 不存在，返回数组中会包含 undefined。
   * 可选优化（不改变逻辑）：在此处过滤空值，减少每帧渲染时 Deck 对无效项的处理成本。
   */
  static getLayers() {
    return ["geojson-layer", "point-layer", "line-layer", "line-trail-layer"].map((id) => _MapLayerManager.layerMap.get(id));
  }
};
/** 内部存储：layerId -> layer 实例 */
_MapLayerManager.layerMap = /* @__PURE__ */ new Map();
var MapLayerManager = _MapLayerManager;

// src/deckgl/index.ts
import { GeoJsonLayer, IconLayer } from "@deck.gl/layers";
var _GlMap = class _GlMap {
  /**
   * 构造函数
   * @param instanceId Deck 实例标识
   * @param container Canvas 容器
   * @param callback 初始化完成回调（图标图集构建完毕后触发）
   */
  constructor(instanceId, container, mode, callback) {
    /** 图标图集构建结果（iconAtlas、iconMapping）。注意：DataURL 字符串占用内存较大，后续可考虑缓存与复用。 */
    this.iconAtlasResult = null;
    // 动画相关状态（对齐 test01.html 的思路，但不依赖数据上的时间戳字段）
    /** 当前动画时间（单位：秒的逻辑刻度） */
    this.currentTime = 0;
    /** 动画计时器任务句柄 */
    this.animationTimer = null;
    /** 折线数据源 */
    this.lines = [];
    /** 点数据源 */
    this.points = [];
    // 当前选中的点 id
    /** 选中点 ID（用于放大/高亮显示） */
    this.selectedPointId = null;
    // 循环区间，默认6小时
    this.mode = "2d";
    /** 曲率计算器，用于为 2D 曲线路径生成控制点偏移量 */
    this.curvatureCalculator = new CurvatureCalculator();
    /** 2D 线路渲染器 */
    this.lineRenderer2D = new LineRenderer2D(this.curvatureCalculator);
    /** 3D 线路渲染器 */
    this.lineRenderer3D = new LineRenderer3D();
    /** 额外注册的 SVG 图标集合（由业务侧注入），键为 icon key，值为 SVG 字符串 */
    this.extraSvgIcons = {};
    this.instanceId = instanceId;
    this.mode = mode;
    this.initDeck(container, callback);
  }
  get currentDeckInstance() {
    return DeckInstance.getInstance(this.instanceId);
  }
  /**
   * 初始化 Deck 实例与图标图集
   * 注意：
   * - 这里通过容器宽度估算 minZoom，存在不同屏幕 DPR 下的视觉差异，可在后续优化中考虑；
   * - 图标图集构建是异步的，构建完成前不应创建依赖图集的图层（本实现已在回调后触发动画）。
   */
  async initDeck(container, callback) {
    const calculateMinZoom = (containerWidth) => {
      const zoom = Math.log2(containerWidth / 256);
      return zoom - 1;
    };
    const minZoom = calculateMinZoom(container.parentNode.clientWidth);
    await DeckInstance.setInstance(
      this.instanceId,
      container,
      {
        zoom: Math.max(0, Math.min(20, minZoom)),
        latitude: 30,
        longitude: 0
        // maxZoom 不在 MapViewState，交由 Deck 的控制器约束
      },
      {
        // @ts-ignore
        onClick: async (info, event) => {
          await this.handleClickMapView(info, event);
        }
      }
    );
    const iconAtlasResult = await IconAtlas.buildIconAtlas({ ...DEFAULT_SVG_ICONS });
    this.iconAtlasResult = iconAtlasResult;
    if (Object.keys(this.extraSvgIcons).length > 0) {
      await this.rebuildIconAtlas();
    }
    callback();
    this.startArcAnimation();
  }
  /**
   * 地图空白处点击处理（取消点选中）
   * 注意：`info` 为 deck 提供的拾取信息，这里仅判断 id 与图层，业务可按需扩展。
   */
  async handleClickMapView(info, _event) {
    const pick = info;
    if (!pick?.object || pick.layer?.id !== "point-layer") {
      if (this.selectedPointId) {
        this.selectedPointId = null;
        await this.updateSelectionOverlay();
      }
    }
  }
  /**
   * 设置国家/省份 GeoJSON 数据并注册基础底图图层
   * @param geojsonData GeoJSON FeatureCollection
   */
  async setGEOData(geojsonData) {
    let hoveredFeatureName = null;
    const geojsonLayer = new GeoJsonLayer({
      ...DEFAULT_GEO_LAYER_PROPS,
      id: "geojson-layer",
      data: geojsonData,
      // 防止在倾斜视角下遮挡后绘制的图层（例如 IconLayer）
      getFillColor: (feature) => {
        if (isDef(hoveredFeatureName) && hoveredFeatureName === feature.properties?.name) {
          return [255, 255, 255, 255];
        }
        return DEFAULT_GEO_FILL_COLOR;
      },
      updateTriggers: {
        getFillColor: hoveredFeatureName
      },
      onHover: (info) => {
        const hover = info;
        if (hoveredFeatureName !== hover?.object?.properties?.name) {
          this.currentDeckInstance?.redraw();
        }
        if (hover?.object) {
          hoveredFeatureName = hover.object.properties?.name ?? null;
        } else {
          hoveredFeatureName = null;
        }
        return true;
      }
    });
    MapLayerManager.addLayer("geojson-layer", geojsonLayer);
    this.updateLayer();
  }
  /**
   * 点对象点击处理（设置选中）
   */
  async handleClickPoint(info) {
    const pick = info;
    const clickedId = pick?.object?.id ?? null;
    this.selectedPointId = clickedId;
    await this.updateSelectionOverlay();
  }
  /**
   * 将业务点数据转换为 IconLayer 需要的数据结构
   * 注意：此处统一在 z 轴抬升避免深度冲突；可通过 `size` 与 `color` 做运行时调优。
   */
  generateIconLayerData(points) {
    const iconLayerData = points.map((point) => ({
      ...point,
      // 抬升少量高度，避免与地面发生深度冲突/遮挡
      position: [point.coordinate[0], point.coordinate[1], 50],
      icon: point.icon ?? "star",
      size: 24,
      color: point.color ?? [255, 255, 255, 255]
    }));
    return iconLayerData;
  }
  /**
   * 根据输入数据构建 IconLayer 图层实例
   * 注意：依赖 iconAtlasResult，如为空会导致图层纹理缺失，生产中建议增加兜底或等待图集就绪。
   */
  async generateIconLayer(iconLayerData) {
    ``;
    const iconLayer = new IconLayer({
      id: "point-layer",
      data: iconLayerData,
      iconAtlas: this.iconAtlasResult?.iconAtlas,
      iconMapping: this.iconAtlasResult?.iconMapping,
      getPosition: (d) => d.position,
      getIcon: (d) => d.icon,
      getSize: (d) => this.selectedPointId && d.id === this.selectedPointId ? d.size * 1.6 : d.size,
      getColor: (d) => d.color,
      pickable: true,
      updateTriggers: {
        getSize: this.selectedPointId
      },
      onClick: (info) => {
        this.handleClickPoint(info);
      }
    });
    return iconLayer;
  }
  /**
   * 设置点数据（内部仅记录与触发覆盖层更新）
   */
  async setPoints(points) {
    this.points = points;
    await this.updateSelectionOverlay();
  }
  /**
   * 设置折线数据
   */
  setLines(lines) {
    this.lines = lines;
  }
  // 3D/2D 线路渲染已拆分至 `line3d.ts` 与 `line2d.ts`，此方法不再需要。
  /**
   * 将当前 LayerManager 中的图层刷新到 Deck 实例
   * 注意：`getLayers` 返回包含固定顺序 id 的数组，若某些图层未注册，则返回可能包含 undefined，
   * 生产中建议在 `MapLayerManager` 内部过滤空值以降低渲染层判断成本（此处仅注释，不改变逻辑）。
   */
  updateLayer() {
    const layers = MapLayerManager.getLayers();
    const validLayers = layers.filter((layer) => layer !== void 0);
    this.currentDeckInstance?.setProps({
      layers: validLayers
    });
  }
  /**
   * 根据当前时间推进动画并更新图层
   * 性能注意：每次都会重建 AnimatedArcLayer 实例，数量大时有创建开销，可考虑用 updateTriggers 或 attribute 更新替代。
   */
  updateArcAnimation() {
    this.currentTime = (this.currentTime + _GlMap.ANIMATION_SPEED) % _GlMap.TIME_LOOP;
    const startTime = Math.max(0, this.currentTime - _GlMap.TRAIL_LENGTH);
    const timeRange = [startTime, this.currentTime];
    if (this.mode === "3d") {
      const animatedLayer = this.lineRenderer3D.buildAnimatedLayer(this.lines, timeRange, 300, 1e3);
      MapLayerManager.updateLayer("line-layer", animatedLayer);
    } else {
      const baseLayer = this.lineRenderer2D.buildFullCurveLayer(this.lines);
      const progress = this.currentTime / _GlMap.TIME_LOOP;
      const dotsLayer = this.lineRenderer2D.buildMovingDotsLayer(this.lines, progress);
      MapLayerManager.updateLayer("line-layer", baseLayer);
      MapLayerManager.updateLayer("line-trail-layer", dotsLayer);
    }
    this.updateLayer();
  }
  // 构建/更新选中点的发光边框覆盖层
  /**
   * 根据选中状态重建点图层（用于同步 size/颜色等样式）
   */
  async updateSelectionOverlay() {
    const iconLayerData = this.generateIconLayerData(this.points);
    const iconLayer = await this.generateIconLayer(iconLayerData);
    MapLayerManager.updateLayer("point-layer", iconLayer);
    this.updateLayer();
  }
  /**
   * 业务无关 API：注册额外 SVG 图标，键为 icon key，值为内联 SVG 字符串。
   * 若图集已构建，则重建图集并刷新当前点图层。
   */
  async registerExtraSvgIcons(icons) {
    this.extraSvgIcons = { ...this.extraSvgIcons, ...icons };
    if (this.iconAtlasResult) {
      await this.rebuildIconAtlas();
    }
  }
  /**
   * 重建 IconAtlas：合并默认与额外图标，更新图层
   */
  async rebuildIconAtlas() {
    const merged = { ...DEFAULT_SVG_ICONS, ...this.extraSvgIcons };
    this.iconAtlasResult = await IconAtlas.buildIconAtlas(merged);
    await this.updateSelectionOverlay();
  }
  /**
   * 启动动画定时器
   * 注意：外部需在组件卸载时调用 `destroy` 释放计时器；也可进一步与 `DeckInstance` 生命周期对齐管理。
   */
  startArcAnimation() {
    if (this.animationTimer) {
      this.animationTimer.destroy();
      this.animationTimer = null;
    }
    this.animationTimer = new TaskManager.Timer({
      description: "glmap-arc-animation",
      time: 10,
      once: false,
      fn: this.updateArcAnimation.bind(this)
    });
  }
  /**
   * 销毁内部资源
   * 注意：目前仅销毁计时器，Deck 实例的销毁需由外部调用 `DeckInstance.removeInstance` 完成资源回收。
   */
  destroy() {
    if (this.animationTimer) {
      this.animationTimer.destroy();
      this.animationTimer = null;
    }
  }
};
/** 每 tick 前进的“秒数”（逻辑时间） */
_GlMap.ANIMATION_SPEED = 60;
// 每tick前进的“秒数”
/** 可见尾迹长度（逻辑时间） */
_GlMap.TRAIL_LENGTH = 60 * 60;
// 可见尾迹长度
/** 时间循环区间（逻辑时间），默认 6 小时 */
_GlMap.TIME_LOOP = 6 * 60 * 60;
var GlMap = _GlMap;

// src/adapters/DeckglMapAdapter.ts
var DeckglMapAdapter = class {
  constructor(config) {
    this.glMap = null;
    this.isInitialized = false;
    this.initPromise = null;
    this.unsubscribeState = null;
    this.config = config;
    this.instanceId = `deckgl-${Date.now()}-${Math.random()}`;
    this.initPromise = this.initDeckGL();
  }
  /**
   * 初始化 DeckGL
   */
  async initDeckGL() {
    const canvas = this.createCanvas();
    return new Promise((resolve) => {
      this.glMap = new GlMap(
        this.instanceId,
        canvas,
        this.config.mode || "2d",
        async () => {
          this.isInitialized = true;
          const geoJsonData = await MapStateManager.getGeoJsonData({
            mapLevel: MapLevel2.WORLD,
            country: this.config.country ?? "100000",
            region: this.config.adcode ?? "100000"
          });
          this.glMap?.setGEOData(geoJsonData);
          this.setupEventHandlers();
          resolve();
        }
      );
    });
  }
  /**
   * 创建 Canvas 元素
   */
  createCanvas() {
    const container = this.config.container;
    container.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);
    return canvas;
  }
  /**
   * 设置事件处理器
   */
  setupEventHandlers() {
    if (this.config.events) {
    }
  }
  /**
   * 处理状态变化
   */
  handleStateChange(newState, oldState) {
    if (!this.glMap || !this.isInitialized) return;
    if (newState.geoData !== oldState.geoData) {
      this.updateGeoDataInDeckGL(newState.geoData);
    }
    if (newState.points !== oldState.points) {
      this.updatePointsInDeckGL(newState.points);
    }
    if (newState.lines !== oldState.lines) {
      this.updateLinesInDeckGL(newState.lines);
    }
  }
  /**
   * 在 DeckGL 中更新地理数据
   */
  async updateGeoDataInDeckGL(geoData) {
    if (!this.glMap) return;
    const normalizedData = this.normalizeToFeatureCollection(geoData);
    this.glMap.setGEOData(normalizedData);
  }
  /**
   * 在 DeckGL 中更新点数据
   */
  async updatePointsInDeckGL(points) {
    if (!this.glMap) return;
    const deckglPoints = this.convertPointsForDeckGL(points);
    await this.glMap.setPoints(deckglPoints);
  }
  /**
   * 在 DeckGL 中更新线数据
   */
  async updateLinesInDeckGL(lines) {
    if (!this.glMap) return;
    const deckglLines = this.convertLinesForDeckGL(lines);
    this.glMap.setLines(deckglLines);
  }
  /**
   * 等待初始化完成
   */
  async waitForInit() {
    if (this.initPromise) {
      await this.initPromise;
    }
  }
  /**
   * 设置地理数据
   */
  async setGeoData(boundary) {
    await this.waitForInit();
    if (!this.glMap) return;
    MapStateManager.setGeoData(boundary);
  }
  /**
   * 规范化为 FeatureCollection 格式
   */
  normalizeToFeatureCollection(data) {
    if ("type" in data && data.type === "FeatureCollection") {
      return data;
    }
    const geoJsonData = data;
    return {
      type: "FeatureCollection",
      features: geoJsonData.features || []
    };
  }
  /**
   * 设置点数据
   */
  async setPoints(points) {
    await this.waitForInit();
    if (!this.glMap) return;
  }
  /**
   * 转换点数据为 DeckGL 格式
   */
  convertPointsForDeckGL(points) {
    return points.map((point) => ({
      ...point,
      // 确保坐标格式正确
      coordinate: Array.isArray(point.coordinate) ? point.coordinate : [point.coordinate[0], point.coordinate[1]],
      // 添加 DeckGL 特定的属性
      icon: point.icon || "star",
      color: this.parseColor(point.style?.color)
    }));
  }
  /**
   * 解析颜色值
   */
  parseColor(color) {
    if (!color) return [255, 255, 255, 255];
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255;
      return [r, g, b, a];
    }
    if (color.startsWith("rgb")) {
      const matches = color.match(/\d+/g);
      if (matches) {
        const [r, g, b, a = 255] = matches.map(Number);
        return [r, g, b, a];
      }
    }
    return [255, 255, 255, 255];
  }
  /**
   * 设置线数据
   */
  async setLines(lines) {
    await this.waitForInit();
    if (!this.glMap) return;
  }
  /**
   * 转换线数据为 DeckGL 格式
   */
  convertLinesForDeckGL(lines) {
    return lines.map((line) => ({
      ...line,
      // 确保坐标格式正确
      from: Array.isArray(line.from) ? line.from : [line.from[0], line.from[1]],
      to: Array.isArray(line.to) ? line.to : [line.to[0], line.to[1]],
      // 添加 DeckGL 特定的属性
      color: this.parseColor(line.color?.toString()),
      width: line.width || 2
    }));
  }
  /**
   * 更新地图层级
   */
  updateMapLevel(level) {
    console.log("Update map level to:", level);
  }
  /**
   * 设置点样式
   */
  setPointStyle(seriesName, styleProcessor) {
  }
  /**
   * 注册额外的图标
   */
  async registerExtraIcons(icons) {
    await this.waitForInit();
    if (!this.glMap) return;
    await this.glMap.registerExtraSvgIcons(icons);
  }
  /**
   * 调整地图大小
   */
  resize() {
  }
  /**
   * 销毁渲染器
   */
  destroy() {
    if (!this.glMap) return;
    this.glMap.destroy();
    this.glMap = null;
    if (this.unsubscribeState) {
      this.unsubscribeState();
      this.unsubscribeState = null;
    }
    const container = this.config.container;
    container.innerHTML = "";
  }
  /**
   * 获取渲染器类型
   */
  getType() {
    return "deckgl";
  }
};

// src/factory/MapRendererFactory.ts
var MapRendererFactory = class {
  /**
   * 创建地图渲染器
   * @param type 渲染器类型
   * @param config 渲染器配置
   * @returns 地图渲染器实例
   */
  static createRenderer(type, config) {
    switch (type) {
      case "echarts" /* ECHARTS */:
        return new EchartsMap(config.container, config);
      case "deckgl" /* DECKGL */:
        return new DeckglMapAdapter(config);
      default:
        throw new Error(`Unsupported renderer type: ${type}`);
    }
  }
  /**
   * 检查是否支持指定的渲染器类型
   * @param type 渲染器类型
   * @returns 是否支持
   */
  static isSupported(type) {
    return type === "echarts" /* ECHARTS */ || type === "deckgl" /* DECKGL */;
  }
  /**
   * 获取所有支持的渲染器类型
   * @returns 支持的渲染器类型列表
   */
  static getSupportedTypes() {
    return Object.values(MapRendererType);
  }
  /**
   * 根据环境自动选择最佳渲染器
   * @param config 渲染器配置
   * @returns 推荐的渲染器类型
   */
  static getRecommendedType(config) {
    if (config?.mode === "3d") {
      return "deckgl" /* DECKGL */;
    }
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      return "deckgl" /* DECKGL */;
    }
    return "echarts" /* ECHARTS */;
  }
};

// src/adapters/UnifiedMapComponent.ts
var UnifiedMapComponent = class {
  constructor(config) {
    this.renderer = null;
    this.isInitialized = false;
    this.config = config;
    this.renderType = config.renderType || MapRendererFactory.getRecommendedType(config);
    this.initRenderer();
  }
  /**
   * 初始化渲染器
   */
  async initRenderer() {
    try {
      this.renderer = MapRendererFactory.createRenderer(this.renderType, this.config);
      if (this.config.customIcons && this.renderer instanceof DeckglMapAdapter) {
        await this.renderer.registerExtraIcons?.(this.config.customIcons);
      }
      this.isInitialized = true;
    } catch (error) {
      console.error(`Failed to initialize ${this.renderType} renderer:`, error);
      if (this.config.autoFallback) {
        this.fallbackToAlternativeRenderer();
      } else {
        throw error;
      }
    }
  }
  /**
   * 回退到备用渲染器
   */
  fallbackToAlternativeRenderer() {
    const alternativeType = this.renderType === "deckgl" /* DECKGL */ ? "echarts" /* ECHARTS */ : "deckgl" /* DECKGL */;
    console.warn(`Falling back to ${alternativeType} renderer`);
    try {
      this.renderType = alternativeType;
      this.renderer = MapRendererFactory.createRenderer(alternativeType, this.config);
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize fallback renderer:", error);
      throw new Error("Failed to initialize any available renderer");
    }
  }
  /**
   * 获取当前使用的渲染器类型
   */
  getCurrentRendererType() {
    return this.renderType;
  }
  /**
   * 切换渲染器类型
   * @param type 新的渲染器类型
   */
  async switchRenderer(type) {
    if (type === this.renderType) {
      return;
    }
    const currentState = this.saveCurrentState();
    if (this.renderer) {
      this.renderer.destroy();
    }
    this.renderType = type;
    this.renderer = MapRendererFactory.createRenderer(type, this.config);
    await this.restoreState(currentState);
    this.isInitialized = true;
  }
  /**
   * 保存当前状态
   */
  saveCurrentState() {
    return {
      // points, lines, geoData, etc.
    };
  }
  /**
   * 恢复状态
   */
  async restoreState(state) {
  }
  /**
   * 设置地理数据
   */
  async setGeoData(boundary) {
    if (!this.renderer) {
      throw new Error("Renderer not initialized");
    }
    MapStateManager.setGeoData(boundary);
  }
  /**
   * 设置点数据
   */
  async setPoints(points) {
    if (!this.renderer) {
      throw new Error("Renderer not initialized");
    }
  }
  /**
   * 设置线数据
   */
  async setLines(lines) {
    if (!this.renderer) {
      throw new Error("Renderer not initialized");
    }
  }
  /**
   * 更新地图层级
   */
  updateMapLevel(level) {
    if (!this.renderer) {
      throw new Error("Renderer not initialized");
    }
  }
  /**
   * 设置点样式
   */
  setPointStyle(seriesName, styleProcessor) {
    if (!this.renderer) {
      throw new Error("Renderer not initialized");
    }
    this.renderer.setPointStyle?.(seriesName, styleProcessor);
  }
  /**
   * 注册额外的图标（仅 DeckGL 支持）
   */
  async registerExtraIcons(icons) {
    if (!this.renderer) {
      throw new Error("Renderer not initialized");
    }
    if (this.renderer instanceof DeckglMapAdapter) {
      return this.renderer.registerExtraIcons?.(icons);
    } else {
      console.warn("Current renderer does not support custom icons");
    }
  }
  /**
   * 调整地图大小
   */
  resize() {
    if (!this.renderer) {
      throw new Error("Renderer not initialized");
    }
    this.renderer.resize();
  }
  /**
   * 销毁组件
   */
  destroy() {
    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }
    this.isInitialized = false;
  }
  /**
   * 检查是否已初始化
   */
  isReady() {
    return this.isInitialized;
  }
  /**
   * 等待初始化完成
   */
  async waitForReady() {
    return new Promise((resolve) => {
      if (this.isInitialized) {
        resolve();
      } else {
        const checkInterval = setInterval(() => {
          if (this.isInitialized) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      }
    });
  }
};

// src/adapters/EChartsRenderer.ts
function isPointEventParams(params) {
  if (!params || typeof params !== "object") return false;
  const p = params;
  const coordOk = !p.coordinate || Array.isArray(p.coordinate) && typeof p.coordinate[0] === "number" && typeof p.coordinate[1] === "number";
  const dataOk = !p.data || typeof p.data === "object";
  return coordOk && dataOk;
}
function isAreaEventParams(params) {
  if (!params || typeof params !== "object") return false;
  const p = params;
  return !p.region || typeof p.region === "object";
}
var EChartsMapRenderer = class {
  constructor(container, config) {
    this.eventHandlers = /* @__PURE__ */ new Map();
    this.container = container;
    this.config = config;
    this.initECharts();
  }
  /**
   * 初始化 ECharts
   */
  initECharts() {
    try {
      this.echartsMap = new EchartsMap(this.container, {
        events: {
          onClickPoint: (params) => {
            const coord = isPointEventParams(params) && params.coordinate ? params.coordinate : [0, 0];
            const data = isPointEventParams(params) ? params.data : void 0;
            this.emit("click", {
              coordinate: coord,
              feature: data,
              properties: data?.properties
            });
          },
          onHoverPoint: (params) => {
            const coord = isPointEventParams(params) && params.coordinate ? params.coordinate : [0, 0];
            const data = isPointEventParams(params) ? params.data : void 0;
            this.emit("hover", {
              coordinate: coord,
              feature: data,
              properties: data?.properties
            });
          },
          onClickArea: (params) => {
            const region = isAreaEventParams(params) ? params.region : void 0;
            this.emit("click", {
              coordinate: [0, 0],
              feature: params,
              properties: region
            });
          },
          onDoubleClickArea: (nextLevel, params) => {
            const region = isAreaEventParams(params) ? params.region : void 0;
            MapStateManager.curLevel = nextLevel;
            this.emit("doubleClick", {
              coordinate: [0, 0],
              feature: params,
              properties: region
            });
          },
          onHoverArea: (params) => {
            const region = isAreaEventParams(params) ? params.region : void 0;
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
  render(data) {
    const series = [];
    data.forEach((layer) => {
      switch (layer.type) {
        case "point" /* POINT */:
          this.addPointSeries(series, layer);
          break;
        case "line" /* LINE */:
          this.addLineSeries(series, layer);
          break;
        case "geo" /* GEO */:
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
  addPointSeries(series, layer) {
    const points = layer.data;
    const pointSeries = {
      type: "scatter",
      data: points.map((point) => ({
        name: point.id,
        value: [point.coordinate[0], point.coordinate[1]],
        businessInfo: { raw: point },
        symbol: point.icon || "circle",
        itemStyle: {
          color: point.color ? `rgba(${point.color.join(",")})` : "#1890ff"
        }
      }))
    };
    series.push(pointSeries);
  }
  /**
   * 添加线图层
   */
  addLineSeries(series, layer) {
    const lines = layer.data;
    const lineSeries = {
      type: "lines",
      coordinateSystem: "geo",
      data: lines.map((line) => ({
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
    };
    series.push(lineSeries);
  }
  /**
   * 添加地理图层
   */
  addGeoSeries(layer) {
    const geoData = layer.data;
    this.echartsMap.setGEOData(geoData, geoData);
  }
  /**
   * 设置地图级别
   */
  async setMapLevel(level, region) {
    try {
      const geoData = await getGeoJsonData({
        mapLevel: level,
        country: region ?? "",
        region: region ?? "",
        mapType: "echart"
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
  setPoints(points) {
    this.render([{
      type: "point" /* POINT */,
      data: points
    }]);
    return Promise.resolve();
  }
  /**
   * 设置线数据
   */
  setLines(lines) {
    this.render([{
      type: "line" /* LINE */,
      data: lines
    }]);
    return Promise.resolve();
  }
  /**
   * 设置地图数据
   */
  setGeoData(geoData) {
    this.echartsMap.setGEOData(geoData, geoData);
    return Promise.resolve();
  }
  /**
   * 监听事件
   */
  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(callback);
  }
  /**
   * 取消监听事件
   */
  off(event, callback) {
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
  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }
  /**
   * 调整地图大小
   */
  resize() {
    if (this.echartsMap) {
      this.echartsMap.resizeMap();
    }
  }
  /**
   * 销毁渲染器
   */
  destroy() {
    if (this.echartsMap) {
      this.echartsMap.destroy();
    }
    this.eventHandlers.clear();
  }
};

// src/adapters/DeckGLRenderer.ts
var DeckGLMapRenderer = class {
  constructor(container, config) {
    this.eventHandlers = /* @__PURE__ */ new Map();
    this.container = container;
    this.config = config;
    this.initDeckGL();
  }
  /**
   * 初始化 DeckGL
   */
  initDeckGL() {
    try {
      const canvas = document.createElement("canvas");
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      this.container.appendChild(canvas);
      const instanceId = `deckgl-renderer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      this.glMap = new GlMap(
        instanceId,
        canvas,
        "3d",
        // DeckGL 渲染器默认使用 3D 模式
        () => {
          console.log("DeckGL renderer initialized");
        }
      );
    } catch (error) {
      console.error("Failed to initialize DeckGL:", error);
      throw error;
    }
  }
  resize() {
  }
  /**
   * 渲染图层数据
   */
  render(data) {
    data.forEach((layer) => {
      switch (layer.type) {
        case "point" /* POINT */:
          this.addPointLayer(layer);
          break;
        case "line" /* LINE */:
          this.addLineLayer(layer);
          break;
        case "geo" /* GEO */:
          this.addGeoLayer(layer);
          break;
      }
    });
  }
  /**
   * 添加点图层
   */
  addPointLayer(layer) {
    const points = layer.data;
    this.glMap.setPoints(points);
  }
  /**
   * 添加线图层
   */
  addLineLayer(layer) {
    const lines = layer.data;
    this.glMap.setLines(lines);
  }
  /**
   * 添加地理图层
   */
  addGeoLayer(layer) {
    const geoData = layer.data;
    if (this.isFeatureCollection(geoData)) {
      this.glMap.setGEOData(geoData);
    }
  }
  /**
   * 设置地图级别
   */
  async setMapLevel(level, region) {
    try {
      const geoData = await getGeoJsonData({
        mapLevel: level,
        country: region ?? "",
        region: region ?? "",
        mapType: "deckgl"
      });
      this.setGeoData(geoData);
    } catch (error) {
      console.error("Failed to set map level:", error);
    }
  }
  /**
   * 添加点数据
   */
  setPoints(points) {
    this.glMap.setPoints(points);
    return Promise.resolve();
  }
  /**
   * 添加线数据
   */
  setLines(lines) {
    this.glMap.setLines(lines);
    return Promise.resolve();
  }
  /**
   * 设置地图数据
   */
  setGeoData(geoData) {
    if (this.isFeatureCollection(geoData)) {
      this.glMap.setGEOData(geoData);
    }
    return Promise.resolve();
  }
  /**
   * 监听事件
   */
  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(callback);
  }
  /**
   * 取消监听事件
   */
  off(event, callback) {
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
  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }
  isFeatureCollection(data) {
    if (!data || typeof data !== "object") return false;
    const d = data;
    return d.type === "FeatureCollection" && Array.isArray(d.features);
  }
  /**
   * 销毁渲染器
   */
  destroy() {
    if (this.glMap) {
      this.glMap.destroy();
    }
    this.eventHandlers.clear();
  }
};

// src/utils/helpers.ts
function createMapRenderer(type, config) {
  return MapRendererFactory.createRenderer(type, config);
}
function createUnifiedMap(config) {
  return new UnifiedMapComponent(config);
}
function createEchartsMap(config) {
  return createMapRenderer("echarts" /* ECHARTS */, config);
}
function createDeckglMap(config) {
  return createMapRenderer("deckgl" /* DECKGL */, config);
}

// src/constants/index.ts
var MAP_RENDERER_TYPES = {
  ECHARTS: "echarts",
  DECKGL: "deckgl"
};
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
var EVENT_TYPES = {
  POINT_CLICK: "pointClick",
  POINT_HOVER: "pointHover",
  LINE_CLICK: "lineClick",
  LINE_HOVER: "lineHover",
  MAP_CLICK: "mapClick",
  ZOOM: "zoom",
  PAN: "pan"
};
export {
  DEFAULT_CONFIG,
  DeckGLMapRenderer,
  DeckglMapAdapter,
  EChartsMapRenderer,
  EVENT_TYPES,
  EchartsMap,
  MAP_RENDERER_TYPES,
  MapRendererFactory,
  MapRendererType,
  RENDER_MODES,
  UnifiedMapComponent,
  createDeckglMap,
  createEchartsMap,
  createMapRenderer,
  createUnifiedMap
};
//# sourceMappingURL=index.mjs.map