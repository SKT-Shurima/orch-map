"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  EChartsGeoUtils: () => EChartsGeoUtils,
  MapRendererType: () => MapRendererType,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);

// src/interfaces/index.ts
var MapRendererType = /* @__PURE__ */ ((MapRendererType2) => {
  MapRendererType2["ECHARTS"] = "echarts";
  MapRendererType2["DECKGL"] = "deckgl";
  return MapRendererType2;
})(MapRendererType || {});

// src/main.ts
var import_types4 = require("@orch-map/types");

// src/deckgl/deckInstance.ts
var import_core = require("@deck.gl/core");
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
    const mode = props?.mode ?? "2d";
    const mapView = new import_core.MapView({
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
    const deckInstance = new import_core.Deck({
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

// src/deckgl/line2d.ts
var import_layers = require("@deck.gl/layers");
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
    return new import_layers.PathLayer({
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
    return new import_layers.ScatterplotLayer({
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
var import_layers2 = require("@deck.gl/layers");
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
    return new import_layers2.ArcLayer({
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
var import_utils = require("@orch-map/utils");

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
var import_layers3 = require("@deck.gl/layers");

// src/MapStateManager.ts
var import_types = require("@orch-map/types");

// src/utils/geoDataService.ts
var import_mapdata = require("@orch-map/mapdata");
async function getGeoJsonData(params) {
  return await import_mapdata.MapDataService.getGeoJsonData(params);
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
    const result = await getGeoJsonData(config);
    _MapStateManager.setGeoData(result);
    return result;
  }
  static get extraSvgIcons() {
    return _MapStateManager._extraSvgIcons;
  }
  static set extraSvgIcons(icons) {
    _MapStateManager._extraSvgIcons = icons;
  }
  /**
   * 重置到默认状态
   */
  static reset() {
    _MapStateManager._curLevel = import_types.MapLevel.WORLD;
    _MapStateManager._country = "100000";
    _MapStateManager._adcode = "100000";
    _MapStateManager._geoData = void 0;
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
_MapStateManager._curLevel = import_types.MapLevel.WORLD;
_MapStateManager._country = "100000";
// 默认中国
_MapStateManager._adcode = "100000";
_MapStateManager._mapVersion = "standard";
/** 自定义图标库 */
_MapStateManager._extraSvgIcons = {};
// 属性监听器
_MapStateManager.propertyListeners = /* @__PURE__ */ new Map();
var MapStateManager = _MapStateManager;

// src/deckgl/index.ts
var DeckglMap = class {
  /**
   * 构造函数
   * @param instanceId Deck 实例标识
   * @param container Canvas 容器
   * @param callback 初始化完成回调（图标图集构建完毕后触发）
   */
  constructor(container, mode, callback) {
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
    /** 每 tick 前进的“秒数”（逻辑时间） */
    this.ANIMATION_SPEED = 60;
    // 每tick前进的“秒数”
    /** 可见尾迹长度（逻辑时间） */
    this.TRAIL_LENGTH = 60 * 60;
    // 可见尾迹长度
    /** 时间循环区间（逻辑时间），默认 6 小时 */
    this.TIME_LOOP = 6 * 60 * 60;
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
    this.instanceId = `deckgl-${Date.now()}-${Math.random()}`;
    this.mode = mode;
    const canvas = this.createCanvas(container);
    this.initDeck(canvas, callback);
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
  async initDeck(canvas, callback) {
    const calculateMinZoom = (containerWidth) => {
      const zoom = Math.log2(containerWidth / 256);
      return zoom - 1;
    };
    const minZoom = calculateMinZoom(canvas.parentNode.clientWidth);
    await DeckInstance.setInstance(
      this.instanceId,
      canvas,
      {
        zoom: Math.max(0, Math.min(20, minZoom)),
        latitude: 30,
        longitude: 0
        // maxZoom 不在 MapViewState，交由 Deck 的控制器约束
      },
      {
        mode: this.mode,
        // @ts-ignore
        onClick: async (info, event) => {
          await this.handleClickMapView(info, event);
        }
      }
    );
    MapStateManager.geoData && this.setGEOData(MapStateManager.geoData);
    const iconAtlasResult = await IconAtlas.buildIconAtlas({ ...DEFAULT_SVG_ICONS });
    this.iconAtlasResult = iconAtlasResult;
    if (Object.keys(this.extraSvgIcons).length > 0) {
      await this.rebuildIconAtlas();
    }
    callback();
    this.startArcAnimation();
  }
  /**
  * 创建 Canvas 元素
  */
  createCanvas(container) {
    container.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);
    return canvas;
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
    const geojsonLayer = new import_layers3.GeoJsonLayer({
      ...DEFAULT_GEO_LAYER_PROPS,
      id: "geojson-layer",
      data: geojsonData,
      // 防止在倾斜视角下遮挡后绘制的图层（例如 IconLayer）
      getFillColor: (feature) => {
        if ((0, import_utils.isDef)(hoveredFeatureName) && hoveredFeatureName === feature.properties?.name) {
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
    const iconLayer = new import_layers3.IconLayer({
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
    this.currentTime = (this.currentTime + this.ANIMATION_SPEED) % this.TIME_LOOP;
    const startTime = Math.max(0, this.currentTime - this.TRAIL_LENGTH);
    const timeRange = [startTime, this.currentTime];
    if (this.mode === "3d") {
      const animatedLayer = this.lineRenderer3D.buildAnimatedLayer(this.lines, timeRange, 300, 1e3);
      MapLayerManager.updateLayer("line-layer", animatedLayer);
    } else {
      const baseLayer = this.lineRenderer2D.buildFullCurveLayer(this.lines);
      const progress = this.currentTime / this.TIME_LOOP;
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
    this.animationTimer = new import_utils.TaskManager.Timer({
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

// src/echarts-geo/index.ts
var import_types3 = require("@orch-map/types");
var import_utils4 = require("@orch-map/utils");
var echarts = __toESM(require("echarts/core"));
var import_renderers = require("echarts/renderers");
var import_components = require("echarts/components");
var import_charts = require("echarts/charts");

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

// src/utils/geo.helper.ts
var import_types2 = require("@orch-map/types");
var import_utils2 = require("@orch-map/utils");
var getCenterAndZoomByGeometryCoordinates = (coords) => {
  const flat = [];
  const collect = (c) => {
    if (Array.isArray(c)) {
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
  for (const [lng, lat] of flat) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  const center = [
    (minLng + maxLng) / 2,
    (minLat + maxLat) / 2
  ];
  const lngDiff = Math.max(1e-4, Math.abs(maxLng - minLng));
  const latDiff = Math.max(1e-4, Math.abs(maxLat - minLat));
  const zoom = Math.min(Math.log2(360 / lngDiff), Math.log2(180 / latDiff));
  return { center, zoom: Math.max(0.5, Math.min(zoom, 6)) };
};

// src/utils/echartsGeoUtils.ts
var import_utils3 = require("@orch-map/utils");
var _EChartsGeoUtils = class _EChartsGeoUtils {
  /**
   * @description: 获取点默认配置项
   * @param point 点数据
   * @warning 这里的 showLabelNotEmphasis 为 true 时，会展示 label，
   * showLabelNotEmphasis 为 false 时，hover 时展示 label，正常不展示 label
   */
  static getPointDefaultOption(point) {
    return {
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
        label: {
          show: false
        }
      },
      value: [point.coordinate[0], point.coordinate[1]],
      businessInfo: {
        ...point
      },
      graphInfo: {}
    };
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
    if ((0, import_utils3.isUndef)(_EChartsGeoUtils.curvatureMap[key])) {
      _EChartsGeoUtils.curvatureMap[key] = _EChartsGeoUtils.hashString(key) * (max - min) + min;
    }
    return _EChartsGeoUtils.curvatureMap[key];
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
    const { min: defaultMin, max: defaultMax } = _EChartsGeoUtils.calculateCurvatureRange(startLng, startLat, endLng, endLat);
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
        curveness: _EChartsGeoUtils.curvature(lineItem.id, curvatureMin, curvatureMax)
      }
    };
  }
};
// 线条随机曲率映射表
_EChartsGeoUtils.curvatureMap = {};
/**
 * @description: 切换标签显示状态
 * @param point 点配置
 * @param showLabelNotEmphasis 是否在非强调状态下显示标签
 */
_EChartsGeoUtils.toggleLabelShow = (point, showLabelNotEmphasis) => {
  point.label.show = showLabelNotEmphasis;
  point.emphasis.label.show = !showLabelNotEmphasis;
};
/**
 * @description: 计算数量后缀
 * @param count 数量
 * @returns 格式化后的后缀
 */
_EChartsGeoUtils.countSuffix = (count) => {
  return count > 1 ? `(${count})` : "";
};
/**
 * @description: 处理点数据，转换为 echarts 配置
 * @param pointItem 点数据
 * @param config 适配器参数
 * @returns 处理后的点配置
 */
_EChartsGeoUtils.processPoint = (pointItem, config) => {
  const siblingCount = _EChartsGeoUtils.countSuffix(pointItem.siblingPointId.length);
  const { filterPoint, staredPoints = [], showNamePoints = [] } = config;
  const dataOption = _EChartsGeoUtils.getPointDefaultOption(pointItem);
  let isStarred = false;
  if (staredPoints.length > 0) {
    isStarred = staredPoints.some((point) => point.id === pointItem.id);
    if (isStarred) {
      _EChartsGeoUtils.toggleLabelShow(dataOption, true);
    }
  }
  dataOption.graphInfo.isStarred = isStarred;
  let showLabel;
  const onlyShowPartialNodeNames = Array.isArray(showNamePoints) && showNamePoints.length > 0 || (0, import_utils3.isDef)(filterPoint);
  if (onlyShowPartialNodeNames) {
    showLabel = filterPoint && pointItem.siblingPointId.includes(filterPoint.id) ? filterPoint.name : staredPoints.find((point) => point.id === pointItem.id)?.name ?? showNamePoints.find((point) => point.id === pointItem.id)?.name;
    if (showLabel) {
      _EChartsGeoUtils.toggleLabelShow(dataOption, true);
    }
  } else {
    showLabel = pointItem.name;
  }
  if (showLabel) {
    dataOption.name = showLabel + siblingCount;
  }
  return dataOption;
};
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
_EChartsGeoUtils.calculateCurvatureRange = (startLng, startLat, endLng, endLat) => {
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
_EChartsGeoUtils.getBuddyLineSeries = (originLineSeries) => {
  const sourceData = Array.isArray(originLineSeries.data) ? originLineSeries.data : [];
  const connectivitySeriesData = sourceData.map((item) => {
    const [start, end] = item.coords ?? [];
    return {
      ...item,
      coords: [end, start],
      lineStyle: {
        ...item.lineStyle,
        // 但是在显示上为了表示为同一条线，这里需要将曲线的弯曲度取反，这样就可以在地图上展示一条线
        // 使用确定性方法替代 Math.random()
        curveness: -(item.lineStyle?.curveness ?? _EChartsGeoUtils.hashString(JSON.stringify(item.coords)))
      }
    };
  });
  const buddyConnectivitySeries = {
    ...originLineSeries,
    data: connectivitySeriesData
  };
  return buddyConnectivitySeries;
};
/**
 * @description: 处理线条数据，转换为 echarts 配置
 * @param lineItem 线条数据
 * @param config 曲率配置参数（可选）
 * @returns 处理后的线条配置
 */
_EChartsGeoUtils.processLine = (lineItem, config) => {
  return _EChartsGeoUtils.getLineDefaultOption(lineItem, config);
};
var EChartsGeoUtils = _EChartsGeoUtils;

// src/echarts-geo/index.ts
echarts.use([import_renderers.CanvasRenderer, import_components.GeoComponent, import_components.TooltipComponent, import_components.TitleComponent, import_charts.ScatterChart, import_charts.LinesChart]);
var G2 = { CHINA: "\u4E2D\u56FD", USA: "\u7F8E\u56FD" };
var CHINA_AD_CODE_JUST_FOR_FE = "100000";
var US_AD_CODE_JUST_FOR_FE = "us";
var MUNICIPALITY_CODES = /* @__PURE__ */ new Set(["110000", "120000", "310000", "500000"]);
var isMunicipality = (adcode) => MUNICIPALITY_CODES.has(adcode);
var JUST_SUPPORTED_NEXT_LEVEL_COUNTRIES_AD_CODE = [CHINA_AD_CODE_JUST_FOR_FE, US_AD_CODE_JUST_FOR_FE];
var EchartsMap = class {
  /**
   * 构造函数
   * @param container - 地图容器，可以是 DOM 元素或元素 ID 字符串
   * @param options - 地图配置选项，支持 EchartsMapOptions 或 MapRendererConfig 格式
   * @throws {Error} 当通过 ID 查找容器元素失败时抛出错误
   */
  constructor(container, options, geoJson) {
    /** 当前详细地图名称 */
    this.detailMap = "";
    /** ECharts 实例 */
    this.chartInstance = null;
    /** 图表系列配置 */
    this.series = [];
    /** 边界数据加载状态 */
    this.boundaryLoading = false;
    /** 状态管理器取消订阅函数 */
    this.unsubscribeState = null;
    /** 曲率计算器实例 */
    this.curvatureCalculator = new CurvatureCalculator();
    //=== 事件处理方法 ===//
    /**
     * 鼠标悬停事件处理器
     * @param params - 事件参数，包含组件类型和相关信息
     * @private
     */
    this.mouseoverHandler = (params) => {
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
            this.config.events.onAreaHover(params);
          }
          break;
      }
    };
    /**
     * 鼠标移出事件处理器
     * @param params - 事件参数，包含组件类型和相关信息
     * @private
     */
    this.mouseoutHandler = (params) => {
      if (!params?.componentType) {
        return;
      }
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
    /**
     * 点击事件处理器
     * @param params - 事件参数，包含组件类型和相关信息
     * @private
     */
    this.clickHandler = (params) => {
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
      if (params.componentType === "series" && (params.componentSubType === "scatter" /* SCATTER */ || params.componentSubType === "effectScatter" /* EFFECT_SCATTER */) && this.config.events?.onPointClick) {
        this.config.events.onPointClick(this.transPointParam2BaseMapPoint(params));
      }
    };
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
        const nextLevel = this.checkMapEntryEligibility(params);
        if ((0, import_utils4.isUndef)(nextLevel)) {
          return;
        }
        if (MapStateManager.curLevel === import_types3.MapLevel.COUNTRY && nextLevel === import_types3.MapLevel.PROVINCE && !JUST_SUPPORTED_NEXT_LEVEL_COUNTRIES_AD_CODE.includes(MapStateManager.adcode)) {
          return;
        }
        let nextAdCode = "";
        if (MapStateManager.curLevel === import_types3.MapLevel.WORLD) {
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
        if (!params.region) {
          params.region = { name: params.name || "" };
        }
        params.region.adcode = nextAdCode;
        if (this.config.events?.onAreaDoubleClick) {
          this.config.events.onAreaDoubleClick(params);
        }
        MapStateManager.curLevel = nextLevel ?? import_types3.MapLevel.WORLD;
        MapStateManager.adcode = nextAdCode;
        MapStateManager.country = params.region.name ?? "";
        MapStateManager.getGeoJsonData({
          mapLevel: nextLevel ?? import_types3.MapLevel.WORLD,
          country: params.region.name ?? "",
          region: nextAdCode
        }).then((result) => {
          MapStateManager.setGeoData(result);
        }).catch((error) => {
          console.error("\u52A0\u8F7D\u5730\u7406\u6570\u636E\u5931\u8D25:", error);
        });
      }
    };
    /**
     * 更新系列数据的具体实现
     * @param series - ECharts 系列配置数组
     * @private
     */
    this.updateSeriesImpl = async (series) => {
      await this.waitForBoundaryLoadingToBeFalse();
      if (this.currentMapIsChina) {
        const option = { series };
        this.setChartOption(option);
      } else {
        if (MapStateManager.curLevel === import_types3.MapLevel.COUNTRY && MapStateManager.adcode === US_AD_CODE_JUST_FOR_FE) {
          const option = { series };
          this.setChartOption(option);
        } else {
          const option = { series };
          this.setChartOption(option);
        }
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
      if (!geo || (0, import_utils4.isEmptyArray)(geo) || (0, import_utils4.isUndef)(geo[0])) {
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
    this.updateSeries = (0, import_utils4.debounce)((...args) => {
      const series = args[0];
      this.updateSeriesImpl(series).catch(console.error);
    }, 300);
    /**
     * 区域变化处理方法（防抖，600ms 延迟）
     * @param params - GEO参数
     * @private
     */
    this.handleChangeArea = (0, import_utils4.debounce)((...args) => {
      const params = args[0];
      this.handleChangeAreaImpl(params);
    }, 600);
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
    this.initChart(geoJson).catch((error) => {
      console.error(error);
    });
    this.registerEvents();
  }
  //=== 计算属性与辅助方法 ===//
  /**
   * 获取当前地图是否为中国地图
   * @returns 是否为中国地图
   */
  get currentMapIsChina() {
    return MapStateManager.country === CHINA_AD_CODE_JUST_FOR_FE;
  }
  /**
   * 获取当前详细地图的 GeoJSON 数据
   * @returns 当前地图的 FeatureCollection 数据
   */
  get detailGeojson() {
    return echarts.getMap(this.detailMap)?.geoJson ?? {};
  }
  //=== 初始化方法 ===//
  /**
   * 初始化 ECharts 图表实例
   * @private
   */
  async initChart(geoJson) {
    if (!this.container) {
      return;
    }
    const instance = echarts.init(this.container);
    echarts.registerMap("iceland", geoJson);
    this.chartInstance = instance;
    const baseOption = {
      tooltip: {
        show: true
      },
      geo: {
        map: "iceland",
        zoom: 1.3,
        hoverLayerThreshold: 1,
        // 修复：允许hover事件触发
        silent: false,
        roam: true,
        center: void 0,
        scaleLimit: { min: 1 },
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
        }
      },
      series: [
        {
          name: "points",
          type: "scatter",
          coordinateSystem: "geo",
          data: [],
          symbolSize: 10,
          emphasis: {
            label: {
              show: true
            },
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(255, 255, 255, 0.5)"
            }
          },
          itemStyle: {
            color: "red"
          },
          zlevel: 1
        },
        {
          name: "lines",
          type: "lines",
          coordinateSystem: "geo",
          data: [],
          lineStyle: {
            color: "blue"
          },
          zlevel: 1
        }
      ]
    };
    this.chartInstance?.setOption(baseOption, true);
    instance.on("click", (params) => this.clickHandler(params));
    instance.on("dblclick", (params) => this.dbClickHandler(params));
    instance.on("mouseover", (params) => this.mouseoverHandler(params));
    instance.on("mouseout", (params) => this.mouseoutHandler(params));
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
   * 生成地图名称
   * @returns 地图名称字符串
   * @private
   */
  generateMapName() {
    const level = MapStateManager.curLevel;
    const country = MapStateManager.country;
    const adcode = MapStateManager.adcode;
    switch (level) {
      case import_types3.MapLevel.WORLD:
        return "world";
      case import_types3.MapLevel.COUNTRY:
        return country === "100000" ? "china" : "usa";
      case import_types3.MapLevel.PROVINCE:
        return `province-${adcode}`;
      case import_types3.MapLevel.CITY:
        return `city-${adcode}`;
      case import_types3.MapLevel.COUNTY:
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
  setChartOption(option) {
    if (!this.chartInstance) return;
    this.chartInstance.setOption(option);
  }
  /**
   * 设置地理数据并更新地图显示
   * @param boundary - 边界地理数据
   * @public
   */
  setGEOData(boundary) {
    const mapName = this.generateMapName();
    const geojson = MapStateManager.geoData;
    echarts.registerMap(mapName, geojson);
    if (!boundary || boundary.type !== "FeatureCollection" || !boundary.features || !Array.isArray(boundary.features)) {
      this.boundaryLoading = false;
      return;
    }
    let center = null;
    let scale = 1;
    if (MapStateManager.curLevel === import_types3.MapLevel.WORLD) {
      if (this.centralCountry && boundary.type === "FeatureCollection") {
        const feature = boundary.features.find((item) => item.id === this.centralCountry);
        const targetCoordinates = feature?.geometry && "coordinates" in feature.geometry ? feature.geometry.coordinates : [];
        const { center: c, zoom: z } = getCenterAndZoomByGeometryCoordinates(targetCoordinates);
        scale = z;
        center = c;
      }
    } else if (MapStateManager.curLevel !== import_types3.MapLevel.COUNTRY && boundary.type === "FeatureCollection") {
      const targetCoordinates = boundary.features.map(
        (item) => "coordinates" in item.geometry ? item.geometry.coordinates : []
      );
      const { center: c } = getCenterAndZoomByGeometryCoordinates(targetCoordinates);
      center = c;
    }
    const isWorld = MapStateManager.curLevel === import_types3.MapLevel.WORLD;
    const options = this.chartInstance?.getOption();
    if (options) {
      const geoOption = {
        ...BOUNDARY_OPTIONS,
        map: mapName,
        center,
        zoom: scale || (isWorld ? 1.3 : 1),
        itemStyle: {
          ...BOUNDARY_OPTIONS.itemStyle,
          borderWidth: 1,
          shadowBlur: 0
        }
      };
      options.geo = geoOption;
      this.chartInstance?.setOption(options, true);
    }
    this.boundaryLoading = false;
  }
  /**
   * 规范化地理数据格式
   * @param data - 地理数据
   * @returns 标准化的 FeatureCollection 数据
   * @private
   */
  normalizeGeoData(data) {
    if (typeof data === "object" && data !== null && "type" in data && data.type === "FeatureCollection") {
      return data;
    }
    if (typeof data === "string") {
      throw new Error("String GeoJSON data should be parsed before calling normalizeGeoData");
    }
    return data;
  }
  /**
   * 将点数据转换为 ECharts Series
   * @param points - 点数据数组
   * @returns ECharts 系列配置数组
   * @private
   */
  convertPointsToSeries(points) {
    const scatterData = points.map((point) => ({
      name: point.name ?? "",
      value: [...point.coordinate, point.value ?? 0],
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
        const point = val[2] ?? 10;
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
   * @param lines - 线数据数组
   * @returns ECharts 系列配置数组
   * @private
   */
  convertLinesToSeries(lines) {
    const lineData = lines.map((line) => {
      const curvature = this.curvatureCalculator.calculateCurvatureByCoordinates(
        line.id,
        line.startCoordinate,
        line.endCoordinate
      );
      const curvedCoords = this.generateCurvedPath(
        line.startCoordinate,
        line.endCoordinate,
        curvature
      );
      return {
        coords: curvedCoords,
        businessInfo: line,
        lineStyle: line.color ? {
          color: line.color?.toString(),
          width: line.width ?? 2,
          opacity: line.opacity ?? 1
        } : void 0
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
        symbolSize: 3
      },
      lineStyle: {
        width: 2,
        opacity: 0.6
      }
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
  generateCurvedPath(startCoord, endCoord, curvature) {
    const [startLng, startLat] = startCoord;
    const [endLng, endLat] = endCoord;
    if (curvature === 0 || startLng === endLng && startLat === endLat) {
      return [startCoord, endCoord];
    }
    const midLng = (startLng + endLng) / 2;
    const midLat = (startLat + endLat) / 2;
    const distance = Math.sqrt(
      Math.pow(endLng - startLng, 2) + Math.pow(endLat - startLat, 2)
    );
    const offsetDistance = distance * curvature * 0.3;
    const dx = endLng - startLng;
    const dy = endLat - startLat;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) {
      return [startCoord, endCoord];
    }
    const unitX = dx / length;
    const unitY = dy / length;
    const perpX = -unitY;
    const perpY = unitX;
    const controlLng = midLng + perpX * offsetDistance;
    const controlLat = midLat + perpY * offsetDistance;
    const points = [];
    const segments = Math.max(8, Math.floor(distance * 10));
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = this.quadraticBezier(
        startCoord,
        [controlLng, controlLat],
        endCoord,
        t
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
  quadraticBezier(p0, p1, p2, t) {
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
  transPointParam2BaseMapPoint(params) {
    return {
      id: params.data.businessInfo?.id ?? "",
      coordinate: Array.isArray(params.data.value) ? [params.data.value[0], params.data.value[1]] : [0, 0],
      name: params.data.name
    };
  }
  /**
   * 检查地图入口资格，确定是否可以进入下一级地图
   * @param params - 事件参数，包含区域名称等信息
   * @returns 下一级地图层级，如果无法进入则返回 undefined
   * @private
   */
  checkMapEntryEligibility(params) {
    switch (MapStateManager.curLevel) {
      case import_types3.MapLevel.WORLD: {
        return import_types3.MapLevel.COUNTRY;
      }
      case import_types3.MapLevel.COUNTRY: {
        if (params.name === "\u5357\u6D77\u8BF8\u5C9B") {
          return void 0;
        }
        return import_types3.MapLevel.PROVINCE;
      }
      case import_types3.MapLevel.PROVINCE:
        return import_types3.MapLevel.CITY;
      case import_types3.MapLevel.CITY:
        if (!isMunicipality(MapStateManager.adcode)) {
          return import_types3.MapLevel.COUNTY;
        }
        return void 0;
      case import_types3.MapLevel.COUNTY:
      default:
        return void 0;
    }
  }
  /**
   * 根据地理要素名称获取行政区划代码
   * @param name - 地理要素名称
   * @returns 行政区划代码
   * @private
   */
  getPostCodeByGeoFeatures(name) {
    const geojson = this.detailGeojson;
    if (typeof geojson === "string" || geojson.type !== "FeatureCollection") {
      return "";
    }
    const features = geojson.features;
    if (!Array.isArray(features)) {
      return "";
    }
    const target = features.find((item) => item.properties?.name === name);
    if (!target) {
      return "";
    }
    if (this.currentMapIsChina) {
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
   * 处理区域变化事件的具体实现
   * @param params - 地理参数，包含区域信息
   * @private
   */
  handleChangeAreaImpl(params) {
    if (!params) {
      if (this.config.events?.onAreaHover) {
        this.config.events.onAreaHover(params);
      }
      return;
    }
    const option = this.chartInstance?.getOption();
    if (!option?.series) {
      return;
    }
    const pointSeries = option.series.find((item) => item.type === "scatter" /* SCATTER */);
    if (!pointSeries) {
      if (this.config.events?.onAreaHover) {
        this.config.events.onAreaHover(params);
      }
      return;
    }
    const points = pointSeries.data;
    const geojson = this.detailGeojson;
    if (typeof geojson === "string" || geojson.type !== "FeatureCollection") {
      if (this.config.events?.onAreaHover) {
        this.config.events.onAreaHover(params);
      }
      return;
    }
    const features = geojson.features;
    if (!Array.isArray(points) || !Array.isArray(features)) {
      if (this.config.events?.onAreaHover) {
        this.config.events.onAreaHover(params);
      }
      return;
    }
    const hoverFeature = features.find((item) => item.properties?.name === params.name);
    if (!hoverFeature) {
      if (this.config.events?.onAreaHover) {
        this.config.events.onAreaHover(params);
      }
      return;
    }
    const pointsInRegion = [];
    points.forEach((point) => {
      const coordinates = point.value;
      const isInRegion = this.checkPointInFeature(coordinates, hoverFeature);
      if (isInRegion && point.businessInfo && typeof point.businessInfo === "object" && "siblingPointId" in point.businessInfo) {
        const ids = point.businessInfo.siblingPointId;
        if (Array.isArray(ids)) {
          pointsInRegion.push(...ids);
        }
      }
    });
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
  checkPointInFeature(coordinates, feature) {
    if (feature.geometry.type === "Polygon") {
      return this.checkPointInPolygon(coordinates, feature.geometry.coordinates);
    }
    if (feature.geometry.type === "MultiPolygon") {
      return feature.geometry.coordinates.some(
        (polygon) => this.checkPointInPolygon(coordinates, polygon)
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
  checkPointInPolygon(coordinates, polygonRings) {
    return polygonRings.some((ring, index) => {
      const isInRing = import_utils4.GeoJsonUtils.isPointInPolygon(coordinates, ring);
      return index === 0 ? isInRing : !isInRing;
    });
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
    const currentOption = this.chartInstance?.getOption();
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
    this.setChartOption(newOption);
  }
  /**
   * 更新地图层级
   * @param curLevel - 当前地图层级
   * @public
   */
  updateMapLevel(curLevel) {
    MapStateManager.curLevel = curLevel;
    const chart = this.chartInstance;
    const currentOption = chart.getOption?.();
    if (!currentOption) return;
    const geo = currentOption.geo || [];
    const hasInitializedGeo = Array.isArray(geo) && geo[0]?.map;
    if (!hasInitializedGeo) {
      return;
    }
    const isWorld = curLevel === import_types3.MapLevel.WORLD;
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
  setPoints(points, adapterParams, iconMapIds = {}) {
    if (!this.chartInstance) return;
    const mapOption = this.chartInstance.getOption();
    const series = mapOption.series;
    const pointData = points.map((point) => {
      const processedPoint = EChartsGeoUtils.processPoint(point, adapterParams);
      const iconKey = (0, import_utils4.findFirstKeyByValue)(iconMapIds, point.id) ?? "";
      processedPoint.symbol = MapStateManager.extraSvgIcons[iconKey] ?? "";
      return processedPoint;
    });
    const updatedSeries = series?.map((item) => {
      if (item.type === "scatter" /* SCATTER */) {
        return {
          ...item,
          data: pointData
        };
      }
      return item;
    });
    mapOption.series = updatedSeries;
    this.chartInstance.setOption(mapOption, true);
  }
  /**
   * 在 ECharts 中更新线数据
   * @param lines - 线数据数组
   * @public
   */
  async setLines(lines) {
    if (!this.chartInstance) return;
    const mapOption = this.chartInstance.getOption();
    const series = this.convertLinesToSeries(lines);
    mapOption.series = series;
    this.chartInstance.setOption(mapOption);
  }
  /**
   * 设置地理数据（IMapRenderer 接口实现）
   * @param boundary - 地理边界数据
   * @public
   */
  async setGeoData(boundary) {
    if (!this.chartInstance) return;
    const geoData = this.normalizeGeoData(boundary);
    MapStateManager.setGeoData(geoData);
  }
  /**
   * 设置点样式（IMapRenderer 接口实现）
   * @param seriesName - 系列名称
   * @param styleProcessor - 样式处理函数
   * @public
   */
  setPointStyle(seriesName, styleProcessor) {
    if (!this.chartInstance) return;
    this.setPointStyleInternal(seriesName, (dataItem) => {
      const tempParam = {
        name: dataItem.name,
        componentType: "series",
        componentSubType: "scatter",
        seriesName,
        seriesType: "scatter" /* SCATTER */,
        componentIndex: 0,
        event: { event: {} },
        geoIndex: 0,
        data: dataItem
      };
      const baseMapPoint = this.transPointParam2BaseMapPoint(tempParam);
      styleProcessor(baseMapPoint);
      if (baseMapPoint.style) {
        dataItem.itemStyle = {
          color: baseMapPoint.style.color,
          opacity: baseMapPoint.style.opacity
        };
      }
    });
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

// src/main.ts
var OrchMap = class {
  /**
   * 构造函数
   * @param {MapRendererConfig} config - 地图渲染器配置
   */
  constructor(config, extraSvgIcons = {}) {
    /** 是否已初始化 */
    this._initialized = false;
    /** 初始化回调队列 */
    this._initCallbacks = [];
    this.config = config;
    MapStateManager.mapVersion = this.config.mapVersion || "standard";
    MapStateManager.extraSvgIcons = extraSvgIcons;
    this._initPromise = this.initMap().then(() => {
      this._initialized = true;
      this._initCallbacks.forEach((callback) => callback());
      this._initCallbacks = [];
    });
  }
  /**
   * 初始化地图
   * @private
   * @returns {Promise<void>} 初始化 Promise
   */
  async initMap() {
    const geoData = await getGeoJsonData({
      mapLevel: this.config.curLevel ?? import_types4.MapLevel.WORLD,
      country: this.config.country ?? "100000",
      region: this.config.adcode ?? "100000"
    });
    MapStateManager.setGeoData(geoData);
    switch (this.config.renderType) {
      case "echarts" /* ECHARTS */:
        this.instance = new EchartsMap(this.config.container, this.config, geoData);
        break;
      case "deckgl" /* DECKGL */:
        this.instance = new DeckglMap(this.config.container, this.config.mode || "2d", () => {
          console.log("DeckGL initialized");
        });
        break;
    }
  }
  /**
   * 设置地图点位数据
   * @param {BaseMapPoint[]} points - 点位数据数组
   */
  setPoints(points, adapterParams, iconMapIds = {}) {
    this._executeWhenReady(() => {
      this.instance.setPoints(points, adapterParams, iconMapIds);
    });
  }
  /**
   * 设置地图线条数据
   * @param {BaseMapLine[]} lines - 线条数据数组
   */
  setLines(lines) {
    this._executeWhenReady(() => {
      this.instance.setLines(lines);
    });
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
   * 创建地图渲染器
   * @param {MapRendererType} type - 渲染器类型
   * @param {MapRendererConfig} config - 渲染器配置
   * @returns {OrchMap} 地图渲染器实例
   */
  static createRenderer(type, config) {
  }
  /**
   * 检查是否支持指定的渲染器类型
   * @param {string} type - 渲染器类型
   * @returns {type is MapRendererType} 是否支持
   */
  static isSupported(type) {
    return type === "echarts" /* ECHARTS */ || type === "deckgl" /* DECKGL */;
  }
  /**
   * 获取所有支持的渲染器类型
   * @returns {MapRendererType[]} 支持的渲染器类型列表
   */
  static getSupportedTypes() {
    return Object.values(MapRendererType);
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
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      return "deckgl" /* DECKGL */;
    }
    return "echarts" /* ECHARTS */;
  }
};

// src/index.ts
var index_default = OrchMap;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EChartsGeoUtils,
  MapRendererType
});
//# sourceMappingURL=index.js.map