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
  AnimationManager: () => AnimationManager,
  DataVisualization: () => DataVisualization,
  Geo: () => Geo,
  GeoUtils: () => GeoUtils,
  InteractiveFeatures: () => InteractiveFeatures,
  MapRegistry: () => MapRegistry,
  ThemeManager: () => ThemeManager,
  TooltipManager: () => TooltipManager
});
module.exports = __toCommonJS(index_exports);

// src/map-registry.ts
var MapRegistry = class _MapRegistry {
  constructor() {
    this.registeredMaps = /* @__PURE__ */ new Map();
    this.echartsInstance = null;
  }
  static getInstance() {
    if (!_MapRegistry.instance) {
      _MapRegistry.instance = new _MapRegistry();
    }
    return _MapRegistry.instance;
  }
  /**
   * 设置 ECharts 实例
   */
  setEChartsInstance(echarts) {
    this.echartsInstance = echarts;
  }
  /**
   * 注册地图数据
   */
  async registerMap(mapName, mapData) {
    if (!this.echartsInstance) {
      const echarts = await import("echarts");
      this.echartsInstance = echarts;
    }
    this.echartsInstance.registerMap(mapName, mapData);
    this.registeredMaps.set(mapName, mapData);
  }
  /**
   * 检查地图是否已注册
   */
  isMapRegistered(mapName) {
    return this.registeredMaps.has(mapName);
  }
  /**
   * 获取已注册的地图数据
   */
  getMapData(mapName) {
    return this.registeredMaps.get(mapName);
  }
  /**
   * 获取所有已注册的地图名称
   */
  getRegisteredMapNames() {
    return Array.from(this.registeredMaps.keys());
  }
  /**
   * 移除地图注册
   */
  unregisterMap(mapName) {
    this.registeredMaps.delete(mapName);
  }
  /**
   * 清空所有注册的地图
   */
  clear() {
    this.registeredMaps.clear();
  }
  /**
   * 批量注册地图数据
   */
  async registerMaps(mapDataMap) {
    const promises = Object.entries(mapDataMap).map(
      ([name, data]) => this.registerMap(name, data)
    );
    await Promise.all(promises);
  }
};

// src/theme-manager.ts
var ThemeManager = class _ThemeManager {
  constructor() {
    this.themes = /* @__PURE__ */ new Map();
    this.currentTheme = "default";
    this.initializeDefaultThemes();
  }
  static getInstance() {
    if (!_ThemeManager.instance) {
      _ThemeManager.instance = new _ThemeManager();
    }
    return _ThemeManager.instance;
  }
  /**
   * 初始化默认主题
   */
  initializeDefaultThemes() {
    this.registerTheme({
      name: "default",
      colors: {
        primary: "#5470c6",
        secondary: "#91cc75",
        background: "#ffffff",
        text: "#333333",
        border: "#cccccc",
        area: "#f0f0f0",
        emphasis: "#ff6b6b",
        select: "#4ecdc4"
      },
      fonts: {
        family: "Arial, sans-serif",
        size: 12,
        weight: "normal"
      },
      effects: {
        shadow: false,
        gradient: false,
        animation: true
      }
    });
    this.registerTheme({
      name: "dark",
      colors: {
        primary: "#5dade2",
        secondary: "#58d68d",
        background: "#2c3e50",
        text: "#ecf0f1",
        border: "#34495e",
        area: "#34495e",
        emphasis: "#e74c3c",
        select: "#f39c12"
      },
      fonts: {
        family: "Arial, sans-serif",
        size: 12,
        weight: "normal"
      },
      effects: {
        shadow: true,
        gradient: true,
        animation: true
      }
    });
    this.registerTheme({
      name: "tech",
      colors: {
        primary: "#00d4ff",
        secondary: "#00ff88",
        background: "#0a0a0a",
        text: "#00ff88",
        border: "#00d4ff",
        area: "#1a1a1a",
        emphasis: "#ff0080",
        select: "#ffaa00"
      },
      fonts: {
        family: "Consolas, monospace",
        size: 11,
        weight: "bold"
      },
      effects: {
        shadow: true,
        gradient: true,
        animation: true
      }
    });
    this.registerTheme({
      name: "nature",
      colors: {
        primary: "#2ecc71",
        secondary: "#f39c12",
        background: "#f8f9fa",
        text: "#2c3e50",
        border: "#95a5a6",
        area: "#ecf0f1",
        emphasis: "#e74c3c",
        select: "#9b59b6"
      },
      fonts: {
        family: "Georgia, serif",
        size: 13,
        weight: "normal"
      },
      effects: {
        shadow: false,
        gradient: true,
        animation: true
      }
    });
    this.registerTheme({
      name: "business",
      colors: {
        primary: "#34495e",
        secondary: "#3498db",
        background: "#ffffff",
        text: "#2c3e50",
        border: "#bdc3c7",
        area: "#f8f9fa",
        emphasis: "#e74c3c",
        select: "#f39c12"
      },
      fonts: {
        family: "Helvetica, Arial, sans-serif",
        size: 12,
        weight: "500"
      },
      effects: {
        shadow: true,
        gradient: false,
        animation: false
      }
    });
  }
  /**
   * 注册主题
   */
  registerTheme(theme) {
    this.themes.set(theme.name, theme);
  }
  /**
   * 获取主题
   */
  getTheme(name) {
    return this.themes.get(name);
  }
  /**
   * 获取所有主题名称
   */
  getThemeNames() {
    return Array.from(this.themes.keys());
  }
  /**
   * 设置当前主题
   */
  setCurrentTheme(name) {
    if (this.themes.has(name)) {
      this.currentTheme = name;
      return true;
    }
    return false;
  }
  /**
   * 获取当前主题
   */
  getCurrentTheme() {
    return this.themes.get(this.currentTheme);
  }
  /**
   * 获取当前主题名称
   */
  getCurrentThemeName() {
    return this.currentTheme;
  }
  /**
   * 删除主题
   */
  removeTheme(name) {
    if (name === "default") {
      return false;
    }
    return this.themes.delete(name);
  }
  /**
   * 应用主题到 ECharts 配置
   */
  applyTheme(theme, baseConfig = {}) {
    const config = { ...baseConfig };
    if (config.geo) {
      config.geo.itemStyle = {
        ...config.geo.itemStyle,
        areaColor: theme.colors.area,
        borderColor: theme.colors.border,
        color: theme.colors.primary
      };
      config.geo.emphasis = {
        ...config.geo.emphasis,
        itemStyle: {
          ...config.geo.emphasis?.itemStyle,
          areaColor: theme.colors.emphasis
        }
      };
      config.geo.select = {
        ...config.geo.select,
        itemStyle: {
          ...config.geo.select?.itemStyle,
          areaColor: theme.colors.select
        }
      };
    }
    const textStyle = {
      fontFamily: theme.fonts.family,
      fontSize: theme.fonts.size,
      fontWeight: theme.fonts.weight,
      color: theme.colors.text
    };
    if (config.tooltip) {
      config.tooltip.textStyle = {
        ...config.tooltip.textStyle,
        ...textStyle
      };
    }
    if (config.legend) {
      config.legend.textStyle = {
        ...config.legend.textStyle,
        ...textStyle
      };
    }
    if (theme.effects.shadow) {
      const shadowStyle = {
        shadowBlur: 10,
        shadowColor: "rgba(0, 0, 0, 0.3)",
        shadowOffsetX: 2,
        shadowOffsetY: 2
      };
      if (config.geo?.itemStyle) {
        config.geo.itemStyle = { ...config.geo.itemStyle, ...shadowStyle };
      }
    }
    if (theme.effects.gradient) {
      const gradientStyle = {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 1,
          y2: 1,
          colorStops: [
            { offset: 0, color: theme.colors.primary },
            { offset: 1, color: theme.colors.secondary }
          ]
        }
      };
      if (config.geo?.itemStyle) {
        config.geo.itemStyle = { ...config.geo.itemStyle, ...gradientStyle };
      }
    }
    return config;
  }
  /**
   * 创建自定义主题
   */
  createCustomTheme(name, baseTheme = "default", overrides = {}) {
    const base = this.getTheme(baseTheme) || this.getTheme("default");
    const customTheme = {
      ...base,
      ...overrides,
      name,
      colors: { ...base.colors, ...overrides.colors },
      fonts: { ...base.fonts, ...overrides.fonts },
      effects: { ...base.effects, ...overrides.effects }
    };
    this.registerTheme(customTheme);
    return customTheme;
  }
};

// src/animation-manager.ts
var AnimationManager = class _AnimationManager {
  constructor() {
    this.animations = /* @__PURE__ */ new Map();
    this.initializeDefaultAnimations();
  }
  static getInstance() {
    if (!_AnimationManager.instance) {
      _AnimationManager.instance = new _AnimationManager();
    }
    return _AnimationManager.instance;
  }
  /**
   * 初始化默认动画配置
   */
  initializeDefaultAnimations() {
    this.registerAnimation({
      name: "fadeIn",
      enabled: true,
      duration: 1e3,
      easing: "cubicOut",
      delay: 0,
      type: "fadeIn"
    });
    this.registerAnimation({
      name: "slideIn",
      enabled: true,
      duration: 800,
      easing: "cubicOut",
      delay: 100,
      type: "slideIn"
    });
    this.registerAnimation({
      name: "zoomIn",
      enabled: true,
      duration: 600,
      easing: "backOut",
      delay: 0,
      type: "zoomIn"
    });
    this.registerAnimation({
      name: "bounce",
      enabled: true,
      duration: 1200,
      easing: "bounceOut",
      delay: 200,
      type: "bounce"
    });
    this.registerAnimation({
      name: "quick",
      enabled: true,
      duration: 300,
      easing: "cubicOut",
      delay: 0,
      type: "fadeIn"
    });
    this.registerAnimation({
      name: "slow",
      enabled: true,
      duration: 2e3,
      easing: "cubicInOut",
      delay: 0,
      type: "fadeIn"
    });
  }
  /**
   * 注册动画配置
   */
  registerAnimation(animation) {
    this.animations.set(animation.name, animation);
  }
  /**
   * 获取动画配置
   */
  getAnimation(name) {
    return this.animations.get(name);
  }
  /**
   * 获取所有动画名称
   */
  getAnimationNames() {
    return Array.from(this.animations.keys());
  }
  /**
   * 应用动画到 ECharts 配置
   */
  applyAnimation(animation, baseConfig = {}) {
    if (!animation.enabled) {
      return baseConfig;
    }
    const config = { ...baseConfig };
    if (config.series) {
      config.series = config.series.map((series) => ({
        ...series,
        animation: true,
        animationDuration: animation.duration,
        animationEasing: animation.easing,
        animationDelay: animation.delay,
        animationType: this.getAnimationType(animation.type)
      }));
    }
    if (config.geo) {
      config.geo.animation = true;
      config.geo.animationDuration = animation.duration;
      config.geo.animationEasing = animation.easing;
      config.geo.animationDelay = animation.delay;
    }
    if (config.tooltip) {
      config.tooltip.animation = true;
      config.tooltip.animationDuration = animation.duration;
      config.tooltip.animationEasing = animation.easing;
    }
    return config;
  }
  /**
   * 获取动画类型对应的 ECharts 动画类型
   */
  getAnimationType(type) {
    switch (type) {
      case "fadeIn":
        return "fadeIn";
      case "slideIn":
        return "slideIn";
      case "zoomIn":
        return "scale";
      case "bounce":
        return "bounce";
      default:
        return "fadeIn";
    }
  }
  /**
   * 创建数据加载动画
   */
  createDataLoadingAnimation(data, animation) {
    if (!animation.enabled) {
      return data;
    }
    return data.map((item, index) => ({
      ...item,
      animationDelay: (animation.delay || 0) + index * 50,
      // 错开动画时间
      animationDuration: animation.duration,
      animationEasing: animation.easing
    }));
  }
  /**
   * 创建区域切换动画
   */
  createRegionSwitchAnimation(fromRegion, toRegion, animation) {
    if (!animation.enabled) {
      return {};
    }
    return {
      animation: true,
      animationDuration: animation.duration,
      animationEasing: animation.easing,
      animationDelay: animation.delay,
      transition: {
        from: fromRegion,
        to: toRegion,
        duration: animation.duration,
        easing: animation.easing
      }
    };
  }
  /**
   * 创建数据更新动画
   */
  createDataUpdateAnimation(oldData, newData, animation) {
    if (!animation.enabled) {
      return { data: newData };
    }
    return {
      data: newData,
      animation: true,
      animationDuration: animation.duration,
      animationEasing: animation.easing,
      animationDelay: animation.delay,
      animationType: "update"
    };
  }
  /**
   * 创建自定义动画
   */
  createCustomAnimation(name, baseAnimation = "fadeIn", overrides = {}) {
    const base = this.getAnimation(baseAnimation) || this.getAnimation("fadeIn");
    const customAnimation = {
      ...base,
      ...overrides,
      name
    };
    this.registerAnimation(customAnimation);
    return customAnimation;
  }
  /**
   * 获取动画缓动函数
   */
  getEasingFunctions() {
    return [
      "linear",
      "quadraticIn",
      "quadraticOut",
      "quadraticInOut",
      "cubicIn",
      "cubicOut",
      "cubicInOut",
      "quarticIn",
      "quarticOut",
      "quarticInOut",
      "quinticIn",
      "quinticOut",
      "quinticInOut",
      "sinusoidalIn",
      "sinusoidalOut",
      "sinusoidalInOut",
      "exponentialIn",
      "exponentialOut",
      "exponentialInOut",
      "circularIn",
      "circularOut",
      "circularInOut",
      "elasticIn",
      "elasticOut",
      "elasticInOut",
      "backIn",
      "backOut",
      "backInOut",
      "bounceIn",
      "bounceOut",
      "bounceInOut"
    ];
  }
};

// src/tooltip-manager.ts
var TooltipManager = class _TooltipManager {
  constructor() {
    this.tooltips = /* @__PURE__ */ new Map();
    this.initializeDefaultTooltips();
  }
  static getInstance() {
    if (!_TooltipManager.instance) {
      _TooltipManager.instance = new _TooltipManager();
    }
    return _TooltipManager.instance;
  }
  /**
   * 初始化默认提示框配置
   */
  initializeDefaultTooltips() {
    this.registerTooltip({
      name: "default",
      enabled: true,
      trigger: "item",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      borderColor: "#333",
      textStyle: {
        color: "#fff",
        fontSize: 12
      },
      position: "top"
    });
    this.registerTooltip({
      name: "simple",
      enabled: true,
      trigger: "item",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderColor: "#ddd",
      textStyle: {
        color: "#333",
        fontSize: 11
      },
      position: "top"
    });
    this.registerTooltip({
      name: "card",
      enabled: true,
      trigger: "item",
      backgroundColor: "#fff",
      borderColor: "#e0e0e0",
      textStyle: {
        color: "#333",
        fontSize: 13,
        fontWeight: "bold"
      },
      position: "top"
    });
    this.registerTooltip({
      name: "dark",
      enabled: true,
      trigger: "item",
      backgroundColor: "rgba(44, 62, 80, 0.95)",
      borderColor: "#34495e",
      textStyle: {
        color: "#ecf0f1",
        fontSize: 12
      },
      position: "top"
    });
  }
  /**
   * 注册提示框配置
   */
  registerTooltip(tooltip) {
    const { name, ...config } = tooltip;
    this.tooltips.set(name, config);
  }
  /**
   * 获取提示框配置
   */
  getTooltip(name) {
    return this.tooltips.get(name);
  }
  /**
   * 获取所有提示框名称
   */
  getTooltipNames() {
    return Array.from(this.tooltips.keys());
  }
  /**
   * 应用提示框到 ECharts 配置
   */
  applyTooltip(tooltip, baseConfig = {}) {
    if (!tooltip.enabled) {
      return {
        ...baseConfig,
        tooltip: { show: false }
      };
    }
    const config = { ...baseConfig };
    config.tooltip = {
      ...config.tooltip,
      show: true,
      trigger: tooltip.trigger,
      backgroundColor: tooltip.backgroundColor,
      borderColor: tooltip.borderColor,
      textStyle: tooltip.textStyle,
      position: tooltip.position,
      formatter: tooltip.formatter || this.getDefaultFormatter(tooltip.trigger)
    };
    return config;
  }
  /**
   * 获取默认格式化器
   */
  getDefaultFormatter(trigger) {
    if (trigger === "item") {
      return (params) => {
        if (params.componentType === "geo") {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
              <div style="color: #666;">\u70B9\u51FB\u67E5\u770B\u8BE6\u60C5</div>
            </div>
          `;
        }
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
            <div>\u7ECF\u5EA6: ${params.value[0]}</div>
            <div>\u7EAC\u5EA6: ${params.value[1]}</div>
            ${params.value[2] ? `<div>\u6570\u503C: ${params.value[2]}</div>` : ""}
          </div>
        `;
      };
    }
    return "";
  }
  /**
   * 创建自定义格式化器
   */
  createCustomFormatter(template, dataFields = ["name", "value"]) {
    return (params) => {
      let result = template;
      result = result.replace(/\{name\}/g, params.name || "");
      result = result.replace(/\{value\}/g, params.value ? params.value.join(", ") : "");
      dataFields.forEach((field) => {
        const regex = new RegExp(`\\{${field}\\}`, "g");
        const value = params[field] || params.data && params.data[field] || "";
        result = result.replace(regex, value);
      });
      if (params.value && Array.isArray(params.value)) {
        result = result.replace(/\{lng\}/g, params.value[0] || "");
        result = result.replace(/\{lat\}/g, params.value[1] || "");
        result = result.replace(/\{data\}/g, params.value[2] || "");
      }
      return result;
    };
  }
  /**
   * 创建数据统计提示框
   */
  createDataStatsTooltip(data) {
    const stats = this.calculateDataStats(data);
    return {
      enabled: true,
      trigger: "item",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#ddd",
      textStyle: {
        color: "#333",
        fontSize: 12
      },
      position: "top",
      formatter: (params) => {
        return `
          <div style="padding: 12px; min-width: 200px;">
            <div style="font-weight: bold; margin-bottom: 8px; color: #2c3e50;">
              ${params.name}
            </div>
            <div style="margin-bottom: 6px;">
              <span style="color: #7f8c8d;">\u5750\u6807:</span> 
              ${params.value[0]}, ${params.value[1]}
            </div>
            <div style="margin-bottom: 6px;">
              <span style="color: #7f8c8d;">\u6570\u503C:</span> 
              <span style="font-weight: bold; color: #e74c3c;">${params.value[2]}</span>
            </div>
            <div style="border-top: 1px solid #ecf0f1; padding-top: 6px; margin-top: 8px;">
              <div style="font-size: 11px; color: #95a5a6;">
                \u603B\u8BA1: ${stats.total} | \u5E73\u5747: ${stats.average.toFixed(2)} | \u6700\u5927: ${stats.max}
              </div>
            </div>
          </div>
        `;
      }
    };
  }
  /**
   * 计算数据统计信息
   */
  calculateDataStats(data) {
    if (data.length === 0) {
      return { total: 0, average: 0, max: 0, min: 0 };
    }
    const values = data.map((item) => item.value[2] || 0);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    return { total, average, max, min };
  }
  /**
   * 创建区域信息提示框
   */
  createRegionInfoTooltip(regionData) {
    return {
      enabled: true,
      trigger: "item",
      backgroundColor: "rgba(52, 73, 94, 0.95)",
      borderColor: "#34495e",
      textStyle: {
        color: "#ecf0f1",
        fontSize: 13
      },
      position: "top",
      formatter: (params) => {
        return `
          <div style="padding: 12px; min-width: 180px;">
            <div style="font-weight: bold; margin-bottom: 8px; color: #3498db;">
              ${params.name}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #bdc3c7;">\u533A\u57DF\u4EE3\u7801:</span> ${regionData.code || "N/A"}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #bdc3c7;">\u533A\u57DF\u7C7B\u578B:</span> ${regionData.type || "N/A"}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #bdc3c7;">\u4EBA\u53E3:</span> ${regionData.population || "N/A"}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #bdc3c7;">\u9762\u79EF:</span> ${regionData.area || "N/A"}
            </div>
          </div>
        `;
      }
    };
  }
  /**
   * 创建自定义提示框
   */
  createCustomTooltip(name, baseTooltip = "default", overrides = {}) {
    const base = this.getTooltip(baseTooltip) || this.getTooltip("default");
    const customTooltip = {
      ...base,
      ...overrides
    };
    this.registerTooltip({ ...customTooltip, name });
    return customTooltip;
  }
};

// src/geo.ts
var Geo = class {
  constructor(container, config) {
    this.registeredMaps = /* @__PURE__ */ new Map();
    this.eventHandlers = {};
    this.container = container;
    this.config = config;
    this.themeManager = ThemeManager.getInstance();
    this.animationManager = AnimationManager.getInstance();
    this.tooltipManager = TooltipManager.getInstance();
    this.initialize();
  }
  async initialize() {
    try {
      const echarts = await import("echarts");
      this.setupContainer();
      this.echartsInstance = echarts.init(this.container);
      await this.registerMapData();
      this.setupGeoOption();
      this.bindEvents();
    } catch (error) {
      console.error("Failed to initialize Geo component:", error);
      throw new Error("ECharts is required but not installed");
    }
  }
  setupContainer() {
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    this.container.style.position = "relative";
  }
  async registerMapData() {
    if (!this.config.mapData) return;
    const registry = MapRegistry.getInstance();
    await registry.registerMap(this.config.mapName, this.config.mapData);
    this.registeredMaps.set(this.config.mapName, this.config.mapData);
  }
  setupGeoOption() {
    let option = {
      geo: {
        map: this.config.mapName,
        center: this.config.center,
        zoom: this.config.zoom,
        roam: this.config.roam,
        aspectScale: this.config.aspectScale,
        layoutCenter: this.config.layoutCenter,
        layoutSize: this.config.layoutSize,
        itemStyle: {
          areaColor: this.config.areaColor,
          borderColor: this.config.borderColor,
          borderWidth: this.config.borderWidth,
          ...this.config.itemStyle
        },
        emphasis: {
          itemStyle: {
            areaColor: this.config.emphasisAreaColor,
            ...this.config.emphasisItemStyle
          }
        },
        select: {
          itemStyle: {
            areaColor: this.config.selectAreaColor,
            ...this.config.selectItemStyle
          }
        },
        regions: this.config.regions,
        ...this.config.geoOptions
      },
      series: []
    };
    if (this.config.theme) {
      option = this.themeManager.applyTheme(this.config.theme, option);
    }
    if (this.config.animation) {
      option = this.animationManager.applyAnimation(this.config.animation, option);
    }
    if (this.config.tooltip) {
      option = this.tooltipManager.applyTooltip(this.config.tooltip, option);
    }
    if (this.config.legend) {
      option = this.applyLegend(option);
    }
    this.echartsInstance.setOption(option);
  }
  bindEvents() {
    if (!this.echartsInstance) return;
    this.echartsInstance.on("click", (params) => {
      if (params.componentType === "geo") {
        this.eventHandlers.onRegionClick?.(params);
      }
    });
    this.echartsInstance.on("dblclick", (params) => {
      if (params.componentType === "geo") {
        this.eventHandlers.onRegionDoubleClick?.(params);
      }
    });
    this.echartsInstance.on("mouseover", (params) => {
      if (params.componentType === "geo") {
        this.eventHandlers.onRegionMouseOver?.(params);
      }
    });
    this.echartsInstance.on("mouseout", (params) => {
      if (params.componentType === "geo") {
        this.eventHandlers.onRegionMouseOut?.(params);
      }
    });
    this.echartsInstance.on("selectchanged", (params) => {
      if (params.componentType === "geo") {
        this.eventHandlers.onRegionSelect?.(params);
      }
    });
  }
  /**
   * 更新地图配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.setupGeoOption();
  }
  /**
   * 设置事件处理器
   */
  setEventHandlers(handlers) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }
  /**
   * 高亮指定区域
   */
  highlightRegion(regionName) {
    if (!this.echartsInstance) return;
    this.echartsInstance.dispatchAction({
      type: "geoSelect",
      name: regionName
    });
  }
  /**
   * 取消高亮指定区域
   */
  downplayRegion(regionName) {
    if (!this.echartsInstance) return;
    this.echartsInstance.dispatchAction({
      type: "geoUnSelect",
      name: regionName
    });
  }
  /**
   * 重置地图视图
   */
  resetView() {
    if (!this.echartsInstance) return;
    this.echartsInstance.dispatchAction({
      type: "geoRoam",
      componentType: "geo",
      dx: 0,
      dy: 0,
      zoom: this.config.zoom
    });
  }
  /**
   * 获取地图实例
   */
  getEChartsInstance() {
    return this.echartsInstance;
  }
  /**
   * 获取当前配置
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * 调整容器大小
   */
  resize() {
    if (this.echartsInstance) {
      this.echartsInstance.resize();
    }
  }
  /**
   * 应用图例配置
   */
  applyLegend(option) {
    if (!this.config.legend?.enabled) {
      return option;
    }
    const legend = this.config.legend;
    option.legend = {
      show: true,
      orient: legend.orient,
      left: legend.position === "left" ? "left" : legend.position === "right" ? "right" : "center",
      top: legend.position === "top" ? "top" : legend.position === "bottom" ? "bottom" : "middle",
      backgroundColor: legend.backgroundColor,
      borderColor: legend.borderColor,
      textStyle: legend.textStyle,
      data: legend.data
    };
    return option;
  }
  /**
   * 设置主题
   */
  setTheme(themeName) {
    const theme = this.themeManager.getTheme(themeName);
    if (theme) {
      this.config.theme = theme;
      this.setupGeoOption();
      return true;
    }
    return false;
  }
  /**
   * 设置动画
   */
  setAnimation(animationName) {
    const animation = this.animationManager.getAnimation(animationName);
    if (animation) {
      this.config.animation = animation;
      this.setupGeoOption();
      return true;
    }
    return false;
  }
  /**
   * 设置提示框
   */
  setTooltip(tooltipName) {
    const tooltip = this.tooltipManager.getTooltip(tooltipName);
    if (tooltip) {
      this.config.tooltip = tooltip;
      this.setupGeoOption();
      return true;
    }
    return false;
  }
  /**
   * 创建自定义主题
   */
  createCustomTheme(name, baseTheme = "default", overrides = {}) {
    return this.themeManager.createCustomTheme(name, baseTheme, overrides);
  }
  /**
   * 创建自定义动画
   */
  createCustomAnimation(name, baseAnimation = "fadeIn", overrides = {}) {
    return this.animationManager.createCustomAnimation(name, baseAnimation, overrides);
  }
  /**
   * 创建自定义提示框
   */
  createCustomTooltip(name, baseTooltip = "default", overrides = {}) {
    return this.tooltipManager.createCustomTooltip(name, baseTooltip, overrides);
  }
  /**
   * 获取可用主题列表
   */
  getAvailableThemes() {
    return this.themeManager.getThemeNames();
  }
  /**
   * 获取可用动画列表
   */
  getAvailableAnimations() {
    return this.animationManager.getAnimationNames();
  }
  /**
   * 获取可用提示框列表
   */
  getAvailableTooltips() {
    return this.tooltipManager.getTooltipNames();
  }
  /**
   * 添加数据系列（增强版，支持动画）
   */
  addSeries(seriesConfig) {
    if (!this.echartsInstance) return;
    let data = seriesConfig.data;
    if (this.config.animation) {
      data = this.animationManager.createDataLoadingAnimation(data, this.config.animation);
    }
    const option = {
      series: [{
        type: seriesConfig.type || "scatter",
        coordinateSystem: "geo",
        data,
        symbolSize: seriesConfig.symbolSize || 8,
        itemStyle: seriesConfig.itemStyle || {
          color: "#ff6b6b"
        },
        label: seriesConfig.label,
        emphasis: seriesConfig.emphasis,
        ...seriesConfig.options
      }]
    };
    this.echartsInstance.setOption(option);
  }
  /**
   * 更新数据（带动画效果）
   */
  updateData(newData) {
    if (!this.echartsInstance) return;
    const option = {
      series: [{
        data: this.config.animation ? this.animationManager.createDataUpdateAnimation([], newData, this.config.animation).data : newData
      }]
    };
    this.echartsInstance.setOption(option);
  }
  /**
   * 切换区域（带动画效果）
   */
  switchRegion(fromRegion, toRegion) {
    if (!this.echartsInstance) return;
    const animationConfig = this.config.animation || {
      enabled: true,
      duration: 1e3,
      easing: "cubicOut"
    };
    const switchAnimation = this.animationManager.createRegionSwitchAnimation(
      fromRegion,
      toRegion,
      animationConfig
    );
    this.echartsInstance.dispatchAction({
      type: "geoRoam",
      componentType: "geo",
      ...switchAnimation
    });
  }
  /**
   * 销毁 Geo 实例
   */
  destroy() {
    if (this.echartsInstance) {
      this.echartsInstance.dispose();
    }
    this.container.innerHTML = "";
    this.registeredMaps.clear();
  }
};

// src/geo-utils.ts
var GeoUtils = class {
  /**
   * 计算地理边界框
   */
  static calculateBounds(data) {
    if (data.length === 0) {
      return { minLng: 0, maxLng: 0, minLat: 0, maxLat: 0 };
    }
    let minLng = data[0].value[0];
    let maxLng = data[0].value[0];
    let minLat = data[0].value[1];
    let maxLat = data[0].value[1];
    data.forEach((item) => {
      const [lng, lat] = item.value;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });
    return { minLng, maxLng, minLat, maxLat };
  }
  /**
   * 计算地理中心点
   */
  static calculateCenter(data) {
    if (data.length === 0) {
      return [0, 0];
    }
    const bounds = this.calculateBounds(data);
    const centerLng = (bounds.minLng + bounds.maxLng) / 2;
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    return [centerLng, centerLat];
  }
  /**
   * 计算合适的缩放级别
   */
  static calculateZoom(data, containerSize) {
    if (data.length === 0) {
      return 1;
    }
    const bounds = this.calculateBounds(data);
    const lngDiff = bounds.maxLng - bounds.minLng;
    const latDiff = bounds.maxLat - bounds.minLat;
    const maxDiff = Math.max(lngDiff, latDiff);
    if (maxDiff > 50) return 1;
    if (maxDiff > 20) return 2;
    if (maxDiff > 10) return 3;
    if (maxDiff > 5) return 4;
    if (maxDiff > 2) return 5;
    if (maxDiff > 1) return 6;
    if (maxDiff > 0.5) return 7;
    if (maxDiff > 0.2) return 8;
    if (maxDiff > 0.1) return 9;
    return 10;
  }
  /**
   * 根据数据自动配置 Geo
   */
  static autoConfigGeo(data, containerSize) {
    const center = this.calculateCenter(data);
    const zoom = this.calculateZoom(data, containerSize);
    return {
      center,
      zoom
    };
  }
  /**
   * 数据过滤 - 按数值范围
   */
  static filterByValue(data, minValue, maxValue) {
    return data.filter((item) => {
      const value = item.value[2];
      return value >= minValue && value <= maxValue;
    });
  }
  /**
   * 数据过滤 - 按地理范围
   */
  static filterByBounds(data, bounds) {
    return data.filter((item) => {
      const [lng, lat] = item.value;
      return lng >= bounds.minLng && lng <= bounds.maxLng && lat >= bounds.minLat && lat <= bounds.maxLat;
    });
  }
  /**
   * 数据排序 - 按数值
   */
  static sortByValue(data, ascending = true) {
    return [...data].sort((a, b) => {
      const valueA = a.value[2];
      const valueB = b.value[2];
      return ascending ? valueA - valueB : valueB - valueA;
    });
  }
  /**
   * 数据排序 - 按距离中心点的距离
   */
  static sortByDistance(data, center, ascending = true) {
    return [...data].sort((a, b) => {
      const distanceA = this.calculateDistance(a.value, center);
      const distanceB = this.calculateDistance(b.value, center);
      return ascending ? distanceA - distanceB : distanceB - distanceA;
    });
  }
  /**
   * 计算两点间距离（简单欧几里得距离）
   */
  static calculateDistance(point1, point2) {
    const dx = point1[0] - point2[0];
    const dy = point1[1] - point2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }
  /**
   * 数据聚合 - 按区域
   */
  static aggregateByRegion(data, regionKey) {
    const result = {};
    data.forEach((item) => {
      const region = item[regionKey] || "unknown";
      if (!result[region]) {
        result[region] = [];
      }
      result[region].push(item);
    });
    return result;
  }
  /**
   * 生成颜色映射
   */
  static generateColorMap(data, colorScheme = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"]) {
    const values = data.map((item) => item.value[2]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;
    const colorMap = /* @__PURE__ */ new Map();
    data.forEach((item) => {
      const value = item.value[2];
      const normalizedValue = (value - minValue) / valueRange;
      const colorIndex = Math.floor(normalizedValue * (colorScheme.length - 1));
      const color = colorScheme[colorIndex] || colorScheme[0];
      colorMap.set(value, color);
    });
    return colorMap;
  }
};

// src/data-visualization.ts
var DataVisualization = class _DataVisualization {
  constructor() {
  }
  static getInstance() {
    if (!_DataVisualization.instance) {
      _DataVisualization.instance = new _DataVisualization();
    }
    return _DataVisualization.instance;
  }
  /**
   * 创建热力图配置
   */
  createHeatmapConfig(data, options = {}) {
    const {
      radius = 20,
      intensity = 0.6,
      colorScheme = ["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffcc", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"],
      blur = 0.6
    } = options;
    return {
      type: "heatmap",
      coordinateSystem: "geo",
      data: data.map((item) => [item.value[0], item.value[1], item.value[2]]),
      pointSize: radius,
      blur,
      minOpacity: 0,
      maxOpacity: intensity,
      itemStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: colorScheme.map((color, index) => ({
            offset: index / (colorScheme.length - 1),
            color
          }))
        }
      }
    };
  }
  /**
   * 创建流向图配置
   */
  createFlowConfig(fromData, toData, options = {}) {
    const {
      lineStyle = {
        color: "#a6c84c",
        width: 2,
        curveness: 0.3
      },
      effectStyle = {
        show: true,
        period: 6,
        trailLength: 0.7,
        color: "#fff",
        symbolSize: 3
      },
      symbolSize = 8,
      color = "#ff6b6b"
    } = options;
    const flowData = fromData.map((from, index) => {
      const to = toData[index] || toData[0];
      return {
        coords: [
          [from.value[0], from.value[1]],
          [to.value[0], to.value[1]]
        ],
        value: from.value[2] || 1
      };
    });
    return {
      type: "lines",
      coordinateSystem: "geo",
      data: flowData,
      lineStyle,
      effect: effectStyle,
      symbol: ["none", "arrow"],
      symbolSize,
      itemStyle: {
        color
      }
    };
  }
  /**
   * 创建等值线图配置
   */
  createContourConfig(data, options = {}) {
    const {
      levels = [0, 200, 400, 600, 800, 1e3],
      colorScheme = ["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffcc"],
      lineWidth = 2
    } = options;
    return {
      type: "contour",
      coordinateSystem: "geo",
      data: data.map((item) => [item.value[0], item.value[1], item.value[2]]),
      levels,
      lineStyle: {
        width: lineWidth
      },
      itemStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: colorScheme.map((color, index) => ({
            offset: index / (colorScheme.length - 1),
            color
          }))
        }
      }
    };
  }
  /**
   * 创建散点图配置（增强版）
   */
  createScatterConfig(data, options = {}) {
    const {
      symbolSize = 8,
      color = "#ff6b6b",
      symbol = "circle",
      label = {
        show: false
      },
      emphasis = {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: "rgba(0, 0, 0, 0.5)"
        }
      }
    } = options;
    return {
      type: "scatter",
      coordinateSystem: "geo",
      data: data.map((item) => ({
        name: item.name,
        value: item.value,
        itemStyle: item.itemStyle
      })),
      symbolSize,
      symbol,
      itemStyle: {
        color
      },
      label,
      emphasis
    };
  }
  /**
   * 创建效果散点图配置
   */
  createEffectScatterConfig(data, options = {}) {
    const {
      symbolSize = 8,
      color = "#ff6b6b",
      effectType = "ripple",
      rippleEffect = {
        period: 4,
        scale: 2.5,
        brushType: "fill"
      }
    } = options;
    return {
      type: "effectScatter",
      coordinateSystem: "geo",
      data: data.map((item) => ({
        name: item.name,
        value: item.value,
        itemStyle: item.itemStyle
      })),
      symbolSize,
      itemStyle: {
        color
      },
      effectType,
      rippleEffect
    };
  }
  /**
   * 创建地图配置
   */
  createMapConfig(data, mapName, options = {}) {
    const {
      itemStyle = {
        areaColor: "#f0f0f0",
        borderColor: "#999",
        borderWidth: 1
      },
      emphasis = {
        itemStyle: {
          areaColor: "#ff6b6b"
        }
      },
      select = {
        itemStyle: {
          areaColor: "#4ecdc4"
        }
      },
      label = {
        show: true,
        position: "inside",
        fontSize: 12,
        color: "#333"
      }
    } = options;
    return {
      type: "map",
      map: mapName,
      data: data.map((item) => ({
        name: item.name,
        value: item.value[2] || 0,
        itemStyle: item.itemStyle
      })),
      itemStyle,
      emphasis,
      select,
      label
    };
  }
  /**
   * 创建组合图表配置
   */
  createCombinedConfig(configs) {
    return configs.map((config) => {
      switch (config.type) {
        case "scatter":
          return this.createScatterConfig(config.data, config.options);
        case "effectScatter":
          return this.createEffectScatterConfig(config.data, config.options);
        case "heatmap":
          return this.createHeatmapConfig(config.data, config.options);
        case "lines":
          return this.createFlowConfig(config.data, config.data, config.options);
        case "map":
          return this.createMapConfig(config.data, "china", config.options);
        case "contour":
          return this.createContourConfig(config.data, config.options);
        default:
          return this.createScatterConfig(config.data, config.options);
      }
    });
  }
  /**
   * 数据聚类
   */
  clusterData(data, options = {}) {
    const {
      clusterRadius = 50,
      maxZoom = 10,
      minPoints = 2
    } = options;
    const clusters = [];
    data.forEach((point) => {
      let addedToCluster = false;
      for (const cluster of clusters) {
        const distance = this.calculateDistance(
          point.value,
          cluster.center
        );
        if (distance <= clusterRadius) {
          cluster.points.push(point);
          cluster.count++;
          cluster.center = this.calculateCenter(cluster.points);
          addedToCluster = true;
          break;
        }
      }
      if (!addedToCluster) {
        clusters.push({
          center: [point.value[0], point.value[1]],
          points: [point],
          count: 1
        });
      }
    });
    return clusters.filter((cluster) => cluster.count >= minPoints);
  }
  /**
   * 计算两点间距离
   */
  calculateDistance(point1, point2) {
    const dx = point1[0] - point2[0];
    const dy = point1[1] - point2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }
  /**
   * 计算中心点
   */
  calculateCenter(points) {
    if (points.length === 0) return [0, 0];
    const sumLng = points.reduce((sum, point) => sum + point.value[0], 0);
    const sumLat = points.reduce((sum, point) => sum + point.value[1], 0);
    return [sumLng / points.length, sumLat / points.length];
  }
  /**
   * 生成颜色渐变
   */
  generateColorGradient(startColor, endColor, steps) {
    const colors = [];
    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      const color = this.interpolateColor(startColor, endColor, ratio);
      colors.push(color);
    }
    return colors;
  }
  /**
   * 颜色插值
   */
  interpolateColor(color1, color2, ratio) {
    const hex1 = color1.replace("#", "");
    const hex2 = color2.replace("#", "");
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
};

// src/interactive-features.ts
var InteractiveFeatures = class _InteractiveFeatures {
  constructor() {
    this.searchIndex = /* @__PURE__ */ new Map();
    this.filterCache = /* @__PURE__ */ new Map();
  }
  static getInstance() {
    if (!_InteractiveFeatures.instance) {
      _InteractiveFeatures.instance = new _InteractiveFeatures();
    }
    return _InteractiveFeatures.instance;
  }
  /**
   * 构建搜索索引
   */
  buildSearchIndex(data) {
    this.searchIndex.clear();
    data.forEach((item) => {
      const name = item.name.toLowerCase();
      this.addToIndex(name, item);
      const pinyin = this.getPinyinInitials(item.name);
      this.addToIndex(pinyin, item);
      for (let i = 0; i < name.length; i++) {
        this.addToIndex(name.substring(i), item);
      }
    });
  }
  /**
   * 添加到搜索索引
   */
  addToIndex(key, item) {
    if (!this.searchIndex.has(key)) {
      this.searchIndex.set(key, []);
    }
    this.searchIndex.get(key).push(item);
  }
  /**
   * 搜索数据
   */
  search(query, data) {
    if (!query.trim()) return data;
    const searchTerm = query.toLowerCase().trim();
    const results = /* @__PURE__ */ new Set();
    if (this.searchIndex.has(searchTerm)) {
      this.searchIndex.get(searchTerm).forEach((item) => results.add(item));
    }
    for (const [key, items] of this.searchIndex) {
      if (key.includes(searchTerm)) {
        items.forEach((item) => results.add(item));
      }
    }
    return Array.from(results);
  }
  /**
   * 按数值范围筛选
   */
  filterByValue(data, minValue, maxValue) {
    return data.filter((item) => {
      const value = item.value[2] || 0;
      return value >= minValue && value <= maxValue;
    });
  }
  /**
   * 按地理范围筛选
   */
  filterByBounds(data, bounds) {
    return data.filter((item) => {
      const [lng, lat] = item.value;
      return lng >= bounds.minLng && lng <= bounds.maxLng && lat >= bounds.minLat && lat <= bounds.maxLat;
    });
  }
  /**
   * 按区域筛选
   */
  filterByRegion(data, regionNames) {
    return data.filter((item) => regionNames.includes(item.name));
  }
  /**
   * 多条件筛选
   */
  multiFilter(data, filters) {
    let result = [...data];
    if (filters.search) {
      result = this.search(filters.search, result);
    }
    if (filters.valueRange) {
      result = this.filterByValue(result, filters.valueRange[0], filters.valueRange[1]);
    }
    if (filters.bounds) {
      result = this.filterByBounds(result, filters.bounds);
    }
    if (filters.regions && filters.regions.length > 0) {
      result = this.filterByRegion(result, filters.regions);
    }
    return result;
  }
  /**
   * 数据排序
   */
  sortData(data, sortBy, order = "asc", center) {
    return [...data].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "value":
          comparison = (a.value[2] || 0) - (b.value[2] || 0);
          break;
        case "distance":
          if (!center) return 0;
          const distanceA = this.calculateDistance(a.value, center);
          const distanceB = this.calculateDistance(b.value, center);
          comparison = distanceA - distanceB;
          break;
      }
      return order === "asc" ? comparison : -comparison;
    });
  }
  /**
   * 计算两点间距离
   */
  calculateDistance(point1, point2) {
    const dx = point1[0] - point2[0];
    const dy = point1[1] - point2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }
  /**
   * 获取拼音首字母
   */
  getPinyinInitials(text) {
    const pinyinMap = {
      "\u5317": "B",
      "\u4EAC": "J",
      "\u4E0A": "S",
      "\u6D77": "H",
      "\u5E7F": "G",
      "\u5DDE": "Z",
      "\u6DF1": "S",
      "\u5733": "Z",
      "\u676D": "H",
      "\u5357": "N",
      "\u6B66": "W",
      "\u6C49": "H",
      "\u6210": "C",
      "\u90FD": "D",
      "\u897F": "X",
      "\u5B89": "A",
      "\u91CD": "C",
      "\u5E86": "Q",
      "\u5929": "T",
      "\u6D25": "J",
      "\u82CF": "S",
      "\u9752": "Q",
      "\u5C9B": "D",
      "\u5927": "D",
      "\u8FDE": "L",
      "\u5B81": "N",
      "\u6CE2": "B",
      "\u53A6": "X",
      "\u95E8": "M",
      "\u798F": "F",
      "\u957F": "C",
      "\u6C99": "S",
      "\u90D1": "Z",
      "\u6D4E": "J",
      "\u592A": "T",
      "\u539F": "Y",
      "\u77F3": "S",
      "\u5BB6": "J",
      "\u5E84": "Z",
      "\u54C8": "H",
      "\u5C14": "E",
      "\u6EE8": "B",
      "\u6625": "C",
      "\u6C88": "S",
      "\u9633": "Y",
      "\u547C": "H",
      "\u548C": "H",
      "\u6D69": "H",
      "\u7279": "T",
      "\u94F6": "Y",
      "\u5DDD": "C",
      "\u5170": "L",
      "\u4E4C": "W",
      "\u9C81": "L",
      "\u6728": "M",
      "\u9F50": "Q",
      "\u62C9": "L",
      "\u8428": "S",
      "\u6606": "K",
      "\u660E": "M",
      "\u8D35": "G",
      "\u53E3": "K",
      "\u4E09": "S",
      "\u4E9A": "Y"
    };
    return text.split("").map((char) => pinyinMap[char] || char).join("");
  }
  /**
   * 创建数据统计
   */
  createDataStats(data) {
    if (data.length === 0) {
      return { total: 0, average: 0, max: 0, min: 0, median: 0, stdDev: 0 };
    }
    const values = data.map((item) => item.value[2] || 0).sort((a, b) => a - b);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const median = values.length % 2 === 0 ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2 : values[Math.floor(values.length / 2)];
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return { total, average, max, min, median, stdDev };
  }
  /**
   * 创建数据分组
   */
  groupData(data, groupBy, groupFunction) {
    const groups = /* @__PURE__ */ new Map();
    data.forEach((item) => {
      let groupKey;
      switch (groupBy) {
        case "value":
          const value = item.value[2] || 0;
          if (value > 500) groupKey = "\u9AD8\u503C";
          else if (value > 200) groupKey = "\u4E2D\u503C";
          else groupKey = "\u4F4E\u503C";
          break;
        case "region":
          const lng = item.value[0];
          const lat = item.value[1];
          if (lng > 110 && lat > 30) groupKey = "\u534E\u4E1C";
          else if (lng > 110 && lat <= 30) groupKey = "\u534E\u5357";
          else if (lng <= 110 && lat > 30) groupKey = "\u534E\u5317";
          else groupKey = "\u5176\u4ED6";
          break;
        case "custom":
          groupKey = groupFunction ? groupFunction(item) : "\u9ED8\u8BA4";
          break;
        default:
          groupKey = "\u9ED8\u8BA4";
      }
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey).push(item);
    });
    return groups;
  }
  /**
   * 创建数据导出
   */
  exportData(data, format = "json") {
    switch (format) {
      case "json":
        return JSON.stringify(data, null, 2);
      case "csv":
        const csvHeader = "name,lng,lat,value\n";
        const csvRows = data.map(
          (item) => `${item.name},${item.value[0]},${item.value[1]},${item.value[2] || 0}`
        ).join("\n");
        return csvHeader + csvRows;
      case "geojson":
        const geojson = {
          type: "FeatureCollection",
          features: data.map((item) => ({
            type: "Feature",
            properties: {
              name: item.name,
              value: item.value[2] || 0
            },
            geometry: {
              type: "Point",
              coordinates: [item.value[0], item.value[1]]
            }
          }))
        };
        return JSON.stringify(geojson, null, 2);
      default:
        return JSON.stringify(data, null, 2);
    }
  }
  /**
   * 创建数据导入
   */
  importData(data, format = "json") {
    try {
      switch (format) {
        case "json":
          return JSON.parse(data);
        case "csv":
          const lines = data.split("\n");
          const headers = lines[0].split(",");
          return lines.slice(1).map((line) => {
            const values = line.split(",");
            return {
              name: values[0],
              value: [
                parseFloat(values[1]),
                parseFloat(values[2]),
                parseFloat(values[3]) || 0
              ]
            };
          });
        case "geojson":
          const geojson = JSON.parse(data);
          return geojson.features.map((feature) => ({
            name: feature.properties.name,
            value: [
              feature.geometry.coordinates[0],
              feature.geometry.coordinates[1],
              feature.properties.value || 0
            ]
          }));
        default:
          return JSON.parse(data);
      }
    } catch (error) {
      console.error("\u6570\u636E\u5BFC\u5165\u5931\u8D25:", error);
      return [];
    }
  }
  /**
   * 清除缓存
   */
  clearCache() {
    this.searchIndex.clear();
    this.filterCache.clear();
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AnimationManager,
  DataVisualization,
  Geo,
  GeoUtils,
  InteractiveFeatures,
  MapRegistry,
  ThemeManager,
  TooltipManager
});
//# sourceMappingURL=index.js.map