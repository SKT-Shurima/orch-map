// src/coordinate.ts
var CoordinateUtils = class {
  /**
   * 计算两点之间的距离（米）
   */
  static getDistance(coord1, coord2) {
    const R = 6371e3;
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const \u03C61 = lat1 * Math.PI / 180;
    const \u03C62 = lat2 * Math.PI / 180;
    const \u0394\u03C6 = (lat2 - lat1) * Math.PI / 180;
    const \u0394\u03BB = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(\u0394\u03C6 / 2) * Math.sin(\u0394\u03C6 / 2) + Math.cos(\u03C61) * Math.cos(\u03C62) * Math.sin(\u0394\u03BB / 2) * Math.sin(\u0394\u03BB / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  /**
   * 计算两点之间的方位角（度）
   */
  static getBearing(coord1, coord2) {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const \u03C61 = lat1 * Math.PI / 180;
    const \u03C62 = lat2 * Math.PI / 180;
    const \u0394\u03BB = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(\u0394\u03BB) * Math.cos(\u03C62);
    const x = Math.cos(\u03C61) * Math.sin(\u03C62) - Math.sin(\u03C61) * Math.cos(\u03C62) * Math.cos(\u0394\u03BB);
    const \u03B8 = Math.atan2(y, x);
    return (\u03B8 * 180 / Math.PI + 360) % 360;
  }
  /**
   * 计算中点坐标
   */
  static getMidpoint(coord1, coord2) {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const \u03C61 = lat1 * Math.PI / 180;
    const \u03C62 = lat2 * Math.PI / 180;
    const \u0394\u03BB = (lon2 - lon1) * Math.PI / 180;
    const Bx = Math.cos(\u03C62) * Math.cos(\u0394\u03BB);
    const By = Math.cos(\u03C62) * Math.sin(\u0394\u03BB);
    const \u03C63 = Math.atan2(
      Math.sin(\u03C61) + Math.sin(\u03C62),
      Math.sqrt((Math.cos(\u03C61) + Bx) * (Math.cos(\u03C61) + Bx) + By * By)
    );
    const \u03BB3 = lon1 * Math.PI / 180 + Math.atan2(By, Math.cos(\u03C61) + Bx);
    return [\u03BB3 * 180 / Math.PI, \u03C63 * 180 / Math.PI];
  }
  /**
   * 计算边界框
   */
  static getBounds(coordinates) {
    if (coordinates.length === 0) {
      return [[0, 0], [0, 0]];
    }
    let minLng = coordinates[0][0];
    let maxLng = coordinates[0][0];
    let minLat = coordinates[0][1];
    let maxLat = coordinates[0][1];
    coordinates.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });
    return [[minLng, minLat], [maxLng, maxLat]];
  }
  /**
   * 计算边界框中心点
   */
  static getBoundsCenter(bounds) {
    const [[minLng, minLat], [maxLng, maxLat]] = bounds;
    return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
  }
  /**
   * 根据边界框计算合适的缩放级别
   */
  static getZoomFromBounds(bounds, _containerSize) {
    const [[minLng, minLat], [maxLng, maxLat]] = bounds;
    const lngDiff = Math.abs(maxLng - minLng);
    const latDiff = Math.abs(maxLat - minLat);
    const lngZoom = Math.log2(360 / lngDiff);
    const latZoom = Math.log2(180 / latDiff);
    return Math.min(lngZoom, latZoom, 18);
  }
  /**
   * 生成二次贝塞尔曲线路径点
   */
  static generateBezierPath(start, end, curvature = 0.3, segments = 64) {
    const [sx, sy] = start;
    const [ex, ey] = end;
    const mx = (sx + ex) / 2;
    const my = (sy + ey) / 2;
    const dx = ex - sx;
    const dy = ey - sy;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const offset = curvature * length * 0.3;
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
  /**
   * 计算曲率值（基于距离和角度）
   */
  static calculateCurvature(start, end) {
    const distance = this.getDistance(start, end);
    const baseCurvature = Math.min(distance / 1e6, 1);
    return baseCurvature * 0.5;
  }
};
var CurvatureCalculator = class {
  constructor() {
    this.curvatureCache = /* @__PURE__ */ new Map();
  }
  /**
   * 根据坐标计算曲率
   */
  calculateCurvatureByCoordinates(id, start, end) {
    if (this.curvatureCache.has(id)) {
      return this.curvatureCache.get(id);
    }
    const curvature = CoordinateUtils.calculateCurvature(start, end);
    this.curvatureCache.set(id, curvature);
    return curvature;
  }
  /**
   * 清除缓存
   */
  clearCache() {
    this.curvatureCache.clear();
  }
};

// src/animation.ts
var easing = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
};
var AnimationManager = class {
  constructor() {
    this.animations = /* @__PURE__ */ new Map();
    this.rafId = null;
  }
  /**
   * 创建动画
   */
  create(id, config) {
    const animation = new Animation(config);
    this.animations.set(id, animation);
    if (!this.rafId) {
      this.start();
    }
  }
  /**
   * 停止动画
   */
  stop(id) {
    this.animations.delete(id);
    if (this.animations.size === 0 && this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  /**
   * 停止所有动画
   */
  stopAll() {
    this.animations.clear();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  /**
   * 开始动画循环
   */
  start() {
    const animate = (currentTime) => {
      const completedAnimations = [];
      this.animations.forEach((animation, id) => {
        const isComplete = animation.update(currentTime);
        if (isComplete) {
          completedAnimations.push(id);
        }
      });
      completedAnimations.forEach((id) => {
        this.animations.delete(id);
      });
      if (this.animations.size > 0) {
        this.rafId = requestAnimationFrame(animate);
      } else {
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(animate);
  }
};
var Animation = class {
  constructor(config) {
    this.startTime = null;
    var _a, _b, _c, _d, _e;
    this.config = {
      ...config,
      enabled: (_a = config.enabled) != null ? _a : true,
      duration: (_b = config.duration) != null ? _b : 1e3,
      easing: (_c = config.easing) != null ? _c : "easeInOutQuad",
      delay: (_d = config.delay) != null ? _d : 0,
      type: (_e = config.type) != null ? _e : "fadeIn"
    };
  }
  /**
   * 更新动画
   */
  update(currentTime) {
    var _a, _b, _c, _d, _e, _f;
    (_a = this.startTime) != null ? _a : this.startTime = currentTime;
    const elapsed = currentTime - this.startTime;
    const duration = (_b = this.config.duration) != null ? _b : 1e3;
    let progress = Math.min(elapsed / duration, 1);
    const easingFn = easing[this.config.easing] || easing.linear;
    progress = easingFn(progress);
    const value = this.config.from + (this.config.to - this.config.from) * progress;
    (_d = (_c = this.config).onUpdate) == null ? void 0 : _d.call(_c, progress, value);
    if (elapsed >= duration) {
      if (this.config.loop) {
        this.startTime = currentTime;
        return false;
      } else {
        (_f = (_e = this.config).onComplete) == null ? void 0 : _f.call(_e);
        return true;
      }
    }
    return false;
  }
};
var animationManager = new AnimationManager();

// src/common.ts
import { omit, pick } from "lodash";
function isDef(value) {
  return value !== void 0 && value !== null;
}
function isEmptyArray(arr) {
  return !Array.isArray(arr) || arr.length === 0;
}
function isUndef(value) {
  return value === void 0 || value === null;
}
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (typeof obj === "object") {
    const clonedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
function throttle(fn, delay) {
  let lastTime = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn(...args);
    }
  };
}
function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
var colorUtils = {
  /**
   * 将十六进制颜色转换为 RGBA 数组
   */
  hexToRgba(hex, alpha = 255) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, alpha];
  },
  /**
   * 将 RGBA 数组转换为十六进制颜色
   */
  rgbaToHex(rgba) {
    const [r, g, b] = rgba;
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  },
  /**
   * 插值两个颜色
   */
  interpolateColor(color1, color2, t) {
    const [r1, g1, b1, a1] = color1;
    const [r2, g2, b2, a2] = color2;
    return [
      Math.round(r1 + (r2 - r1) * t),
      Math.round(g1 + (g2 - g1) * t),
      Math.round(b1 + (b2 - b1) * t),
      Math.round(a1 + (a2 - a1) * t)
    ];
  }
};
function findFirstKeyByValue(obj, searchValue) {
  for (const key of Object.keys(obj)) {
    if (obj[key].includes(searchValue)) {
      return key;
    }
  }
  return void 0;
}

// src/task.ts
var TaskManager = class {
};
TaskManager.Timer = class Timer {
  constructor(options) {
    this.timerId = null;
    this.start = () => {
      if (this.options.once) {
        this.timerId = setTimeout(this.options.fn, this.options.time);
      } else {
        this.timerId = setInterval(this.options.fn, this.options.time);
      }
    };
    this.stop = () => {
      if (this.timerId !== null) {
        if (this.options.once) {
          clearTimeout(this.timerId);
        } else {
          clearInterval(this.timerId);
        }
        this.timerId = null;
      }
    };
    this.options = options;
    this.start();
  }
  destroy() {
    if (this.timerId !== null) {
      if (this.options.once) {
        clearTimeout(this.timerId);
      } else {
        clearInterval(this.timerId);
      }
      this.timerId = null;
    }
  }
};

// src/geoJson.ts
var GeoJsonUtils = class _GeoJsonUtils {
  /**
   * 检查点是否在多边形内（使用射线算法）
   * @param point 坐标点 [x, y]
   * @param polygon 多边形坐标数组
   * @returns 如果点在多边形内返回 true，否则返回 false
   */
  static isPointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }
  /**
  * 检查点是否在 GeoJSON 特征内
  * @param point 坐标点 [x, y]
  * @param feature GeoJSON 特征
  * @returns 如果点在特征内返回 true，否则返回 false
  */
  static isPointInFeature(point, feature) {
    const { geometry } = feature;
    if (geometry.type === "Polygon") {
      return _GeoJsonUtils.isPointInPolygon(point, geometry.coordinates[0]);
    }
    if (geometry.type === "MultiPolygon") {
      return geometry.coordinates.some(
        (polygon) => _GeoJsonUtils.isPointInPolygon(point, polygon[0])
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
  static checkPointInPolygon(coordinates, polygonRings) {
    return polygonRings.some((ring, index) => {
      const isInRing = _GeoJsonUtils.isPointInPolygon(coordinates, ring);
      return index === 0 ? isInRing : !isInRing;
    });
  }
  /**
   * 检查点是否在指定地理要素内
   * @param coordinates - 点坐标 [经度, 纬度]
   * @param feature - 地理要素
   * @returns 点是否在要素内
   */
  static checkPointInFeature(coordinates, feature) {
    if (feature.geometry.type === "Polygon") {
      return _GeoJsonUtils.checkPointInPolygon(coordinates, feature.geometry.coordinates);
    }
    if (feature.geometry.type === "MultiPolygon") {
      return feature.geometry.coordinates.some(
        (polygon) => _GeoJsonUtils.checkPointInPolygon(coordinates, polygon)
      );
    }
    return false;
  }
  /**
   * 将经纬度转换为投影坐标
   * @param transform 坐标转换对象
   * @param lngLat 经纬度坐标 [经度, 纬度]
   * @returns 投影后的坐标 [x, y]
   */
  static lngLatToProjected(transform, lngLat) {
    if (!(transform == null ? void 0 : transform.default)) {
      return lngLat;
    }
    const { scale, translate } = transform.default;
    const [lng, lat] = lngLat;
    return [
      lng * scale[0] + translate[0],
      lat * scale[1] + translate[1]
    ];
  }
  /**
   * 将投影坐标转换回经纬度
   * @param transform 坐标转换对象
   * @param projected 投影坐标 [x, y]
   * @returns 经纬度坐标 [经度, 纬度]
   */
  static projectedToLngLat(transform, projected) {
    if (!(transform == null ? void 0 : transform.default)) {
      return projected;
    }
    const { scale, translate } = transform.default;
    const [x, y] = projected;
    return [
      (x - translate[0]) / scale[0],
      (y - translate[1]) / scale[1]
    ];
  }
  /**
   * 计算多边形的中心点
   * @param coordinates 多边形坐标数组
   * @returns 中心点坐标 [x, y]
   */
  static getPolygonCenter(coordinates) {
    if (!coordinates || coordinates.length === 0) {
      return [0, 0];
    }
    const ring = coordinates[0];
    if (!ring || ring.length === 0) {
      return [0, 0];
    }
    let x = 0;
    let y = 0;
    let area = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0];
      const yi = ring[i][1];
      const xj = ring[j][0];
      const yj = ring[j][1];
      const a = xi * yj - xj * yi;
      area += a;
      x += (xi + xj) * a;
      y += (yi + yj) * a;
    }
    area *= 0.5;
    return area === 0 ? [0, 0] : [x / (6 * area), y / (6 * area)];
  }
  /**
   * 计算 GeoJSON 特征的中心点
   * @param feature GeoJSON 特征
   * @returns 中心点坐标 [x, y]
   */
  static getFeatureCenter(feature) {
    const { geometry } = feature;
    switch (geometry.type) {
      case "Point":
        return geometry.coordinates;
      case "MultiPoint":
      case "LineString":
        return _GeoJsonUtils.getLineCentroid(geometry.coordinates);
      case "MultiLineString":
        return _GeoJsonUtils.getLineCentroid(geometry.coordinates.flat());
      case "Polygon":
        return _GeoJsonUtils.getPolygonCenter(geometry.coordinates);
      case "MultiPolygon": {
        const centers = geometry.coordinates.map(
          (polygon) => _GeoJsonUtils.getPolygonCenter(polygon)
        );
        return _GeoJsonUtils.getLineCentroid(centers);
      }
      default:
        return [0, 0];
    }
  }
  /**
   * 计算线或点集的质心
   * @param coordinates 坐标数组
   * @returns 质心坐标 [x, y]
   */
  static getLineCentroid(coordinates) {
    if (!coordinates || coordinates.length === 0) {
      return [0, 0];
    }
    const sumX = coordinates.reduce((sum, coord) => sum + coord[0], 0);
    const sumY = coordinates.reduce((sum, coord) => sum + coord[1], 0);
    return [sumX / coordinates.length, sumY / coordinates.length];
  }
  /**
   * 计算 GeoJSON 特征的边界框
   * @param feature GeoJSON 特征
   * @returns 边界框坐标 [[minX, minY], [maxX, maxY]]
   */
  static getBounds(feature) {
    const { geometry } = feature;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const processCoordinate = (coord) => {
      const [x, y] = coord;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    };
    const processCoordinates = (coords) => {
      if (Array.isArray(coords) && typeof coords[0] === "number") {
        processCoordinate(coords);
      } else if (Array.isArray(coords)) {
        coords.forEach((coord) => processCoordinates(coord));
      }
    };
    processCoordinates(geometry.coordinates);
    return [[minX, minY], [maxX, maxY]];
  }
  /**
   * 计算 GeoJSON FeatureCollection 的边界框
   * @param featureCollection GeoJSON FeatureCollection
   * @returns 边界框坐标 [[minX, minY], [maxX, maxY]]
   */
  static getFeatureCollectionBounds(featureCollection) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    featureCollection.features.forEach((feature) => {
      const [[fMinX, fMinY], [fMaxX, fMaxY]] = _GeoJsonUtils.getBounds(feature);
      minX = Math.min(minX, fMinX);
      minY = Math.min(minY, fMinY);
      maxX = Math.max(maxX, fMaxX);
      maxY = Math.max(maxY, fMaxY);
    });
    return [[minX, minY], [maxX, maxY]];
  }
  /**
   * 创建空的 GeoJSON FeatureCollection
   * @param features GeoJSON 特征数组
   * @returns GeoJSON FeatureCollection
   */
  static createFeatureCollection(features = []) {
    return {
      type: "FeatureCollection",
      features
    };
  }
  /**
   * 创建 GeoJSON Point 特征
   * @param coordinate 点坐标 [x, y]
   * @param properties 特征属性
   * @returns GeoJSON Point 特征
   */
  static createPointFeature(coordinate, properties = {}) {
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: coordinate
      },
      properties
    };
  }
  /**
   * 创建 GeoJSON LineString 特征
   * @param coordinates 线坐标数组
   * @param properties 特征属性
   * @returns GeoJSON LineString 特征
   */
  static createLineFeature(coordinates, properties = {}) {
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates
      },
      properties
    };
  }
  /**
   * 创建 GeoJSON Polygon 特征
   * @param coordinates 多边形坐标数组
   * @param properties 特征属性
   * @returns GeoJSON Polygon 特征
   */
  static createPolygonFeature(coordinates, properties = {}) {
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates
      },
      properties
    };
  }
  /**
   * 计算两点之间的距离
   * @param point1 点1坐标 [x, y]
   * @param point2 点2坐标 [x, y]
   * @returns 欧几里得距离
   */
  static distance(point1, point2) {
    const dx = point2[0] - point1[0];
    const dy = point2[1] - point1[1];
    return Math.sqrt(dx * dx + dy * dy);
  }
  /**
   * 计算线段的长度
   * @param line 线段坐标数组
   * @returns 线段长度
   */
  static lineLength(line) {
    let length = 0;
    for (let i = 0; i < line.length - 1; i++) {
      length += _GeoJsonUtils.distance(line[i], line[i + 1]);
    }
    return length;
  }
  /**
   * 计算多边形的面积
   * @param polygon 多边形坐标数组
   * @returns 多边形面积
   */
  static polygonArea(polygon) {
    let area = 0;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      area += polygon[i][0] * polygon[j][1];
      area -= polygon[j][0] * polygon[i][1];
    }
    return Math.abs(area) / 2;
  }
  /**
   * 简化 GeoJSON 几何体 (按采样间隔简化)
   * @param geometry GeoJSON 几何体
   * @param tolerance 简化容差
   * @returns 简化后的几何体
   */
  static simplifyGeometry(geometry, tolerance) {
    const simplifyCoords = (coords) => {
      if (coords.length <= 2) return coords;
      const result = [coords[0]];
      let prevPoint = coords[0];
      for (let i = 1; i < coords.length - 1; i++) {
        if (_GeoJsonUtils.distance(prevPoint, coords[i]) >= tolerance) {
          result.push(coords[i]);
          prevPoint = coords[i];
        }
      }
      if (coords.length > 1) {
        result.push(coords[coords.length - 1]);
      }
      return result;
    };
    const processGeometry = (geom) => {
      switch (geom.type) {
        case "Point":
          return geom;
        case "LineString":
          return {
            ...geom,
            coordinates: simplifyCoords(geom.coordinates)
          };
        case "Polygon":
          return {
            ...geom,
            coordinates: geom.coordinates.map(
              (ring) => simplifyCoords(ring)
            )
          };
        case "MultiPoint":
          return geom;
        case "MultiLineString":
          return {
            ...geom,
            coordinates: geom.coordinates.map(
              (line) => simplifyCoords(line)
            )
          };
        case "MultiPolygon":
          return {
            ...geom,
            coordinates: geom.coordinates.map(
              (polygon) => polygon.map((ring) => simplifyCoords(ring))
            )
          };
        default:
          return geom;
      }
    };
    return processGeometry(geometry);
  }
  /**
   * 简化 GeoJSON 特征
   * @param feature GeoJSON 特征
   * @param tolerance 简化容差
   * @returns 简化后的特征
   */
  static simplifyFeature(feature, tolerance) {
    return {
      ...feature,
      geometry: _GeoJsonUtils.simplifyGeometry(feature.geometry, tolerance)
    };
  }
  /**
   * 合并多个 GeoJSON FeatureCollection
   * @param collections GeoJSON FeatureCollection 数组
   * @returns 合并后的 FeatureCollection
   */
  static mergeFeatureCollections(...collections) {
    const features = collections.reduce((acc, collection) => acc.concat(collection.features), []);
    return _GeoJsonUtils.createFeatureCollection(features);
  }
  /**
   * 将 GeoJSON 特征转换为 WKT (Well-Known Text) 格式
   * @param feature GeoJSON 特征
   * @returns WKT 字符串
   */
  static featureToWKT(feature) {
    const { geometry } = feature;
    const coordsToWKT = (coords) => `${coords[0]} ${coords[1]}`;
    const ringsToWKT = (rings) => {
      const ringsWKT = rings.map((ring) => {
        const pointsWKT = ring.map(coordsToWKT).join(", ");
        return `(${pointsWKT})`;
      }).join(", ");
      return ringsWKT;
    };
    switch (geometry.type) {
      case "Point":
        return `POINT(${coordsToWKT(geometry.coordinates)})`;
      case "LineString":
        return `LINESTRING(${geometry.coordinates.map(coordsToWKT).join(", ")})`;
      case "Polygon":
        return `POLYGON(${ringsToWKT(geometry.coordinates)})`;
      case "MultiPoint":
        return `MULTIPOINT(${geometry.coordinates.map((coord) => `(${coordsToWKT(coord)})`).join(", ")})`;
      case "MultiLineString":
        return `MULTILINESTRING(${geometry.coordinates.map((line) => `(${line.map(coordsToWKT).join(", ")})`).join(", ")})`;
      case "MultiPolygon":
        return `MULTIPOLYGON(${geometry.coordinates.map((polygon) => `(${ringsToWKT(polygon)})`).join(", ")})`;
      default:
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }
  }
};

// src/icon.ts
function svgToEChartsSymbol(svg, options = {}) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const { preferPath = true, normalize = false } = options;
  const svgString = typeof svg === "string" ? svg : svg instanceof Element ? svg.outerHTML : "";
  if (!svgString) {
    return "circle";
  }
  if (preferPath) {
    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
      const parserError = svgDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error("SVG \u89E3\u6790\u9519\u8BEF");
      }
      const pathElements = svgDoc.querySelectorAll("path");
      if (pathElements.length === 1) {
        let pathData = pathElements[0].getAttribute("d");
        if (normalize && pathData) {
          pathData = pathData.trim().replace(/\s+/g, " ");
        }
        return pathData ? `path://${pathData}` : "circle";
      } else if (pathElements.length > 1) {
        return svgToBase64Symbol(svgString);
      }
      const basicShapes = svgDoc.querySelectorAll("circle,rect,ellipse,line,polyline,polygon");
      if (basicShapes.length === 0) {
        return svgToBase64Symbol(svgString);
      } else if (basicShapes.length === 1) {
        const shape = basicShapes[0];
        const tagName = shape.tagName.toLowerCase();
        let pathData = "";
        if (tagName === "circle") {
          const cx = parseFloat((_a = shape.getAttribute("cx")) != null ? _a : "0");
          const cy = parseFloat((_b = shape.getAttribute("cy")) != null ? _b : "0");
          const r = parseFloat((_c = shape.getAttribute("r")) != null ? _c : "0");
          pathData = `M${cx - r},${cy}A${r},${r},0,1,1,${cx + r},${cy}A${r},${r},0,1,1,${cx - r},${cy}Z`;
        } else if (tagName === "rect") {
          const x = parseFloat((_d = shape.getAttribute("x")) != null ? _d : "0");
          const y = parseFloat((_e = shape.getAttribute("y")) != null ? _e : "0");
          const width = parseFloat((_f = shape.getAttribute("width")) != null ? _f : "0");
          const height = parseFloat((_g = shape.getAttribute("height")) != null ? _g : "0");
          const rx = parseFloat((_h = shape.getAttribute("rx")) != null ? _h : "0");
          const ry = parseFloat((_i = shape.getAttribute("ry")) != null ? _i : "0");
          if (rx > 0 || ry > 0) {
            const _rx = rx != null ? rx : ry;
            const _ry = ry != null ? ry : rx;
            pathData = `M${x + _rx},${y} L${x + width - _rx},${y} Q${x + width},${y} ${x + width},${y + _ry} L${x + width},${y + height - _ry} Q${x + width},${y + height} ${x + width - _rx},${y + height} L${x + _rx},${y + height} Q${x},${y + height} ${x},${y + height - _ry} L${x},${y + _ry} Q${x},${y} ${x + _rx},${y} Z`;
          } else {
            pathData = `M${x},${y} L${x + width},${y} L${x + width},${y + height} L${x},${y + height} Z`;
          }
        } else {
          return svgToBase64Symbol(svgString);
        }
        return `path://${pathData}`;
      } else {
        return svgToBase64Symbol(svgString);
      }
    } catch (error) {
      console.error("SVG \u8DEF\u5F84\u63D0\u53D6\u9519\u8BEF:", error);
      return svgToBase64Symbol(svgString);
    }
  }
  return svgToBase64Symbol(svgString);
}
function svgToBase64Symbol(svgString) {
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const base64 = btoa(unescape(encodeURIComponent(svgString)));
  return `image://data:image/svg+xml;base64,${base64}`;
}

// src/color.ts
function rgbToHex(rgbArray) {
  for (let i = 0; i < 3; i++) {
    const value = rgbArray[i];
    if (typeof value !== "number" || value < 0 || value > 255 || !Number.isInteger(value)) {
      throw new Error("RGB\u503C\u5FC5\u987B\u662F0-255\u4E4B\u95F4\u7684\u6574\u6570");
    }
  }
  const hexColor = rgbArray.map(
    (value) => value.toString(16).padStart(2, "0")
  ).join("");
  return `#${hexColor}`;
}
function rgbaToString(rgbaArray) {
  for (let i = 0; i < 3; i++) {
    const value = rgbaArray[i];
    if (typeof value !== "number" || value < 0 || value > 255 || !Number.isInteger(value)) {
      throw new Error("RGB\u503C\u5FC5\u987B\u662F0-255\u4E4B\u95F4\u7684\u6574\u6570");
    }
  }
  const alpha = rgbaArray[3];
  if (typeof alpha !== "number" || alpha < 0 || alpha > 255) {
    throw new Error("Alpha\u503C\u5FC5\u987B\u662F0-255\u4E4B\u95F4\u7684\u6570\u5B57");
  }
  const normalizedAlpha = (alpha / 255).toFixed(2);
  return `rgba(${rgbaArray[0]},${rgbaArray[1]},${rgbaArray[2]},${normalizedAlpha})`;
}
function convertToColorCode(colorArray) {
  if (typeof colorArray === "string") {
    return colorArray;
  }
  if (!Array.isArray(colorArray)) {
    throw new Error("\u8F93\u5165\u5FC5\u987B\u662F\u4E00\u4E2A\u6570\u7EC4");
  }
  if (colorArray.length === 3) {
    return rgbToHex(colorArray);
  } else if (colorArray.length === 4) {
    return rgbaToString(colorArray);
  } else {
    throw new Error("\u6570\u7EC4\u957F\u5EA6\u5FC5\u987B\u662F3\uFF08RGB\uFF09\u62164\uFF08RGBA\uFF09");
  }
}
function hexToRgba(hex) {
  var _a, _b;
  const [r, g, b, a] = (_b = (_a = hex.match(/\w\w/g)) == null ? void 0 : _a.map((c) => parseInt(c, 16))) != null ? _b : [0, 0, 0, 255];
  return [r, g, b, a != null ? a : 255];
}
export {
  Animation,
  AnimationManager,
  CoordinateUtils,
  CurvatureCalculator,
  GeoJsonUtils,
  TaskManager,
  animationManager,
  colorUtils,
  convertToColorCode,
  debounce,
  deepClone,
  easing,
  findFirstKeyByValue,
  generateId,
  hexToRgba,
  isDef,
  isEmptyArray,
  isUndef,
  omit,
  pick,
  rgbToHex,
  rgbaToString,
  svgToBase64Symbol,
  svgToEChartsSymbol,
  throttle
};
//# sourceMappingURL=index.mjs.map