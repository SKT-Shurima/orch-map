var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

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
  static getZoomFromBounds(bounds, containerSize) {
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
    this.config = {
      ...config,
      enabled: config.enabled ?? true,
      duration: config.duration ?? 1e3,
      easing: config.easing ?? "easeInOutQuad",
      delay: config.delay ?? 0,
      type: config.type ?? "fadeIn"
    };
  }
  /**
   * 更新动画
   */
  update(currentTime) {
    if (!this.startTime) {
      this.startTime = currentTime;
    }
    const elapsed = currentTime - this.startTime;
    const duration = this.config.duration || 1e3;
    let progress = Math.min(elapsed / duration, 1);
    const easingFn = easing[this.config.easing] || easing.linear;
    progress = easingFn(progress);
    const value = this.config.from + (this.config.to - this.config.from) * progress;
    this.config.onUpdate?.(progress, value);
    if (elapsed >= duration) {
      if (this.config.loop) {
        this.startTime = currentTime;
        return false;
      } else {
        this.config.onComplete?.();
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
      if (obj.hasOwnProperty(key)) {
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
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

// src/task.ts
var _timerId, _options, _Timer_instances, start_fn, _a;
var TaskManager = class {
};
TaskManager.Timer = (_a = class {
  constructor(options) {
    __privateAdd(this, _Timer_instances);
    __privateAdd(this, _timerId, null);
    __privateAdd(this, _options);
    __privateSet(this, _options, options);
    __privateMethod(this, _Timer_instances, start_fn).call(this);
  }
  destroy() {
    if (__privateGet(this, _timerId)) {
      if (__privateGet(this, _options).once) {
        clearTimeout(__privateGet(this, _timerId));
      } else {
        clearInterval(__privateGet(this, _timerId));
      }
      __privateSet(this, _timerId, null);
    }
  }
}, _timerId = new WeakMap(), _options = new WeakMap(), _Timer_instances = new WeakSet(), start_fn = function() {
  if (__privateGet(this, _options).once) {
    __privateSet(this, _timerId, setTimeout(__privateGet(this, _options).fn, __privateGet(this, _options).time));
  } else {
    __privateSet(this, _timerId, setInterval(__privateGet(this, _options).fn, __privateGet(this, _options).time));
  }
}, _a);

// src/geoJson.ts
var GeoJsonUtils = class {
  /**
   * 检查点是否在多边形内（使用射线算法）
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
   */
  static isPointInFeature(point, feature) {
    const { geometry } = feature;
    if (geometry.type === "Polygon") {
      return this.isPointInPolygon(point, geometry.coordinates[0]);
    }
    if (geometry.type === "MultiPolygon") {
      return geometry.coordinates.some(
        (polygon) => this.isPointInPolygon(point, polygon[0])
      );
    }
    return false;
  }
  /**
   * 将经纬度转换为投影坐标
   */
  static lngLatToProjected(transform, lngLat) {
    if (!transform?.default) {
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
   * 计算多边形的中心点
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
   * 计算 GeoJSON 特征的边界框
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
      if (typeof coords[0] === "number") {
        processCoordinate(coords);
      } else {
        coords.forEach(processCoordinates);
      }
    };
    processCoordinates(geometry.coordinates);
    return [[minX, minY], [maxX, maxY]];
  }
  /**
   * 创建空的 GeoJSON FeatureCollection
   */
  static createFeatureCollection(features = []) {
    return {
      type: "FeatureCollection",
      features
    };
  }
  /**
   * 创建 GeoJSON Point 特征
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
};
export {
  Animation,
  AnimationManager,
  CoordinateUtils,
  CurvatureCalculator,
  GeoJsonUtils,
  TaskManager,
  animationManager,
  colorUtils,
  debounce,
  deepClone,
  easing,
  generateId,
  isDef,
  isEmptyArray,
  isUndef,
  omit,
  pick,
  throttle
};
//# sourceMappingURL=index.mjs.map