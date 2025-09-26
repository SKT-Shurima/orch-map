import type { GeoConfig, GeoData, GeoEventHandlers, ThemeConfig, AnimationConfig, TooltipConfig, LegendConfig } from '@orch-map/types';
import { MapRegistry } from './map-registry';
import { ThemeManager } from './theme-manager';
import { AnimationManager } from './animation-manager';
import { TooltipManager } from './tooltip-manager';

/**
 * 基于 ECharts 的 Geo 组件二次封装
 * 提供更简洁的 API 来操作地理坐标系
 */
export class Geo {
  private echartsInstance: any;
  private container: HTMLElement;
  private config: GeoConfig;
  private registeredMaps: Map<string, any> = new Map();
  private eventHandlers: GeoEventHandlers = {};
  private themeManager: ThemeManager;
  private animationManager: AnimationManager;
  private tooltipManager: TooltipManager;

  constructor(container: HTMLElement, config: GeoConfig) {
    this.container = container;
    this.config = config;
    this.themeManager = ThemeManager.getInstance();
    this.animationManager = AnimationManager.getInstance();
    this.tooltipManager = TooltipManager.getInstance();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // 动态导入 ECharts
      const echarts = await import('echarts');
      
      // 设置容器样式
      this.setupContainer();
      
      // 初始化 ECharts 实例
      this.echartsInstance = echarts.init(this.container);
      
      // 注册地图数据
      await this.registerMapData();
      
      // 设置基础配置
      this.setupGeoOption();
      
      // 绑定事件
      this.bindEvents();
      
    } catch (error) {
      console.error('Failed to initialize Geo component:', error);
      throw new Error('ECharts is required but not installed');
    }
  }

  private setupContainer(): void {
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.position = 'relative';
  }

  private async registerMapData(): Promise<void> {
    if (!this.config.mapData) return;

    const registry = MapRegistry.getInstance();
    await registry.registerMap(this.config.mapName, this.config.mapData);
    this.registeredMaps.set(this.config.mapName, this.config.mapData);
  }

  private setupGeoOption(): void {
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

    // 应用主题
    if (this.config.theme) {
      option = this.themeManager.applyTheme(this.config.theme, option);
    }

    // 应用动画
    if (this.config.animation) {
      option = this.animationManager.applyAnimation(this.config.animation, option);
    }

    // 应用提示框
    if (this.config.tooltip) {
      option = this.tooltipManager.applyTooltip(this.config.tooltip, option);
    }

    // 应用图例
    if (this.config.legend) {
      option = this.applyLegend(option);
    }

    this.echartsInstance.setOption(option);
  }

  private bindEvents(): void {
    if (!this.echartsInstance) return;

    // 地图点击事件
    this.echartsInstance.on('click', (params: any) => {
      if (params.componentType === 'geo') {
        this.eventHandlers.onRegionClick?.(params);
      }
    });

    // 地图双击事件
    this.echartsInstance.on('dblclick', (params: any) => {
      if (params.componentType === 'geo') {
        this.eventHandlers.onRegionDoubleClick?.(params);
      }
    });

    // 地图鼠标悬停事件
    this.echartsInstance.on('mouseover', (params: any) => {
      if (params.componentType === 'geo') {
        this.eventHandlers.onRegionMouseOver?.(params);
      }
    });

    // 地图鼠标离开事件
    this.echartsInstance.on('mouseout', (params: any) => {
      if (params.componentType === 'geo') {
        this.eventHandlers.onRegionMouseOut?.(params);
      }
    });

    // 地图选择事件
    this.echartsInstance.on('selectchanged', (params: any) => {
      if (params.componentType === 'geo') {
        this.eventHandlers.onRegionSelect?.(params);
      }
    });
  }


  /**
   * 更新地图配置
   */
  public updateConfig(newConfig: Partial<GeoConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.setupGeoOption();
  }

  /**
   * 设置事件处理器
   */
  public setEventHandlers(handlers: Partial<GeoEventHandlers>): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * 高亮指定区域
   */
  public highlightRegion(regionName: string): void {
    if (!this.echartsInstance) return;

    this.echartsInstance.dispatchAction({
      type: 'geoSelect',
      name: regionName
    });
  }

  /**
   * 取消高亮指定区域
   */
  public downplayRegion(regionName: string): void {
    if (!this.echartsInstance) return;

    this.echartsInstance.dispatchAction({
      type: 'geoUnSelect',
      name: regionName
    });
  }

  /**
   * 重置地图视图
   */
  public resetView(): void {
    if (!this.echartsInstance) return;

    this.echartsInstance.dispatchAction({
      type: 'geoRoam',
      componentType: 'geo',
      dx: 0,
      dy: 0,
      zoom: this.config.zoom
    });
  }

  /**
   * 获取地图实例
   */
  public getEChartsInstance(): any {
    return this.echartsInstance;
  }

  /**
   * 获取当前配置
   */
  public getConfig(): GeoConfig {
    return { ...this.config };
  }

  /**
   * 调整容器大小
   */
  public resize(): void {
    if (this.echartsInstance) {
      this.echartsInstance.resize();
    }
  }

  /**
   * 应用图例配置
   */
  private applyLegend(option: any): any {
    if (!this.config.legend?.enabled) {
      return option;
    }

    const legend = this.config.legend;
    option.legend = {
      show: true,
      orient: legend.orient,
      left: legend.position === 'left' ? 'left' : legend.position === 'right' ? 'right' : 'center',
      top: legend.position === 'top' ? 'top' : legend.position === 'bottom' ? 'bottom' : 'middle',
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
  public setTheme(themeName: string): boolean {
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
  public setAnimation(animationName: string): boolean {
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
  public setTooltip(tooltipName: string): boolean {
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
  public createCustomTheme(
    name: string,
    baseTheme: string = 'default',
    overrides: Partial<ThemeConfig> = {}
  ): ThemeConfig {
    return this.themeManager.createCustomTheme(name, baseTheme, overrides);
  }

  /**
   * 创建自定义动画
   */
  public createCustomAnimation(
    name: string,
    baseAnimation: string = 'fadeIn',
    overrides: Partial<AnimationConfig> = {}
  ): AnimationConfig & { name: string } {
    return this.animationManager.createCustomAnimation(name, baseAnimation, overrides);
  }

  /**
   * 创建自定义提示框
   */
  public createCustomTooltip(
    name: string,
    baseTooltip: string = 'default',
    overrides: Partial<TooltipConfig> = {}
  ): TooltipConfig {
    return this.tooltipManager.createCustomTooltip(name, baseTooltip, overrides);
  }

  /**
   * 获取可用主题列表
   */
  public getAvailableThemes(): string[] {
    return this.themeManager.getThemeNames();
  }

  /**
   * 获取可用动画列表
   */
  public getAvailableAnimations(): string[] {
    return this.animationManager.getAnimationNames();
  }

  /**
   * 获取可用提示框列表
   */
  public getAvailableTooltips(): string[] {
    return this.tooltipManager.getTooltipNames();
  }

  /**
   * 添加数据系列（增强版，支持动画）
   */
  public addSeries(seriesConfig: any): void {
    if (!this.echartsInstance) return;

    let data = seriesConfig.data;
    
    // 应用动画到数据
    if (this.config.animation) {
      data = this.animationManager.createDataLoadingAnimation(data, this.config.animation);
    }

    const option = {
      series: [{
        type: seriesConfig.type || 'scatter',
        coordinateSystem: 'geo',
        data: data,
        symbolSize: seriesConfig.symbolSize || 8,
        itemStyle: seriesConfig.itemStyle || {
          color: '#ff6b6b'
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
  public updateData(newData: any[]): void {
    if (!this.echartsInstance) return;

    const option = {
      series: [{
        data: this.config.animation 
          ? this.animationManager.createDataUpdateAnimation([], newData, this.config.animation).data
          : newData
      }]
    };

    this.echartsInstance.setOption(option);
  }

  /**
   * 切换区域（带动画效果）
   */
  public switchRegion(fromRegion: string, toRegion: string): void {
    if (!this.echartsInstance) return;

    const animationConfig = this.config.animation || {
      enabled: true,
      duration: 1000,
      easing: 'cubicOut'
    };

    const switchAnimation = this.animationManager.createRegionSwitchAnimation(
      fromRegion, 
      toRegion, 
      animationConfig
    );

    this.echartsInstance.dispatchAction({
      type: 'geoRoam',
      componentType: 'geo',
      ...switchAnimation
    });
  }

  /**
   * 销毁 Geo 实例
   */
  public destroy(): void {
    if (this.echartsInstance) {
      this.echartsInstance.dispose();
    }
    this.container.innerHTML = '';
    this.registeredMaps.clear();
  }
}
