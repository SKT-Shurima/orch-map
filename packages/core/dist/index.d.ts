import { GeoConfig, GeoEventHandlers, ThemeConfig, AnimationConfig, TooltipConfig, GeoData } from '@orch-map/types';
export { AnimationConfig, DataPoint, GeoConfig, GeoData, GeoEventHandlers, GeoSeriesConfig, LegendConfig, MapConfig, ThemeConfig, TooltipConfig } from '@orch-map/types';

/**
 * 基于 ECharts 的 Geo 组件二次封装
 * 提供更简洁的 API 来操作地理坐标系
 */
declare class Geo {
    private echartsInstance;
    private container;
    private config;
    private registeredMaps;
    private eventHandlers;
    private themeManager;
    private animationManager;
    private tooltipManager;
    constructor(container: HTMLElement, config: GeoConfig);
    private initialize;
    private setupContainer;
    private registerMapData;
    private setupGeoOption;
    private bindEvents;
    /**
     * 更新地图配置
     */
    updateConfig(newConfig: Partial<GeoConfig>): void;
    /**
     * 设置事件处理器
     */
    setEventHandlers(handlers: Partial<GeoEventHandlers>): void;
    /**
     * 高亮指定区域
     */
    highlightRegion(regionName: string): void;
    /**
     * 取消高亮指定区域
     */
    downplayRegion(regionName: string): void;
    /**
     * 重置地图视图
     */
    resetView(): void;
    /**
     * 获取地图实例
     */
    getEChartsInstance(): any;
    /**
     * 获取当前配置
     */
    getConfig(): GeoConfig;
    /**
     * 调整容器大小
     */
    resize(): void;
    /**
     * 应用图例配置
     */
    private applyLegend;
    /**
     * 设置主题
     */
    setTheme(themeName: string): boolean;
    /**
     * 设置动画
     */
    setAnimation(animationName: string): boolean;
    /**
     * 设置提示框
     */
    setTooltip(tooltipName: string): boolean;
    /**
     * 创建自定义主题
     */
    createCustomTheme(name: string, baseTheme?: string, overrides?: Partial<ThemeConfig>): ThemeConfig;
    /**
     * 创建自定义动画
     */
    createCustomAnimation(name: string, baseAnimation?: string, overrides?: Partial<AnimationConfig>): AnimationConfig & {
        name: string;
    };
    /**
     * 创建自定义提示框
     */
    createCustomTooltip(name: string, baseTooltip?: string, overrides?: Partial<TooltipConfig>): TooltipConfig;
    /**
     * 获取可用主题列表
     */
    getAvailableThemes(): string[];
    /**
     * 获取可用动画列表
     */
    getAvailableAnimations(): string[];
    /**
     * 获取可用提示框列表
     */
    getAvailableTooltips(): string[];
    /**
     * 添加数据系列（增强版，支持动画）
     */
    addSeries(seriesConfig: any): void;
    /**
     * 更新数据（带动画效果）
     */
    updateData(newData: any[]): void;
    /**
     * 切换区域（带动画效果）
     */
    switchRegion(fromRegion: string, toRegion: string): void;
    /**
     * 销毁 Geo 实例
     */
    destroy(): void;
}

/**
 * 地图数据注册管理器
 * 用于管理和注册各种地图数据
 */
declare class MapRegistry {
    private static instance;
    private registeredMaps;
    private echartsInstance;
    private constructor();
    static getInstance(): MapRegistry;
    /**
     * 设置 ECharts 实例
     */
    setEChartsInstance(echarts: any): void;
    /**
     * 注册地图数据
     */
    registerMap(mapName: string, mapData: any): Promise<void>;
    /**
     * 检查地图是否已注册
     */
    isMapRegistered(mapName: string): boolean;
    /**
     * 获取已注册的地图数据
     */
    getMapData(mapName: string): any;
    /**
     * 获取所有已注册的地图名称
     */
    getRegisteredMapNames(): string[];
    /**
     * 移除地图注册
     */
    unregisterMap(mapName: string): void;
    /**
     * 清空所有注册的地图
     */
    clear(): void;
    /**
     * 批量注册地图数据
     */
    registerMaps(mapDataMap: Record<string, any>): Promise<void>;
}

/**
 * Geo 组件工具类
 * 提供常用的地图操作和数据处理功能
 */
declare class GeoUtils {
    /**
     * 计算地理边界框
     */
    static calculateBounds(data: GeoData[]): {
        minLng: number;
        maxLng: number;
        minLat: number;
        maxLat: number;
    };
    /**
     * 计算地理中心点
     */
    static calculateCenter(data: GeoData[]): [number, number];
    /**
     * 计算合适的缩放级别
     */
    static calculateZoom(data: GeoData[], containerSize: {
        width: number;
        height: number;
    }): number;
    /**
     * 根据数据自动配置 Geo
     */
    static autoConfigGeo(data: GeoData[], containerSize: {
        width: number;
        height: number;
    }): Partial<GeoConfig>;
    /**
     * 数据过滤 - 按数值范围
     */
    static filterByValue(data: GeoData[], minValue: number, maxValue: number): GeoData[];
    /**
     * 数据过滤 - 按地理范围
     */
    static filterByBounds(data: GeoData[], bounds: {
        minLng: number;
        maxLng: number;
        minLat: number;
        maxLat: number;
    }): GeoData[];
    /**
     * 数据排序 - 按数值
     */
    static sortByValue(data: GeoData[], ascending?: boolean): GeoData[];
    /**
     * 数据排序 - 按距离中心点的距离
     */
    static sortByDistance(data: GeoData[], center: [number, number], ascending?: boolean): GeoData[];
    /**
     * 计算两点间距离（简单欧几里得距离）
     */
    static calculateDistance(point1: [number, number, number], point2: [number, number]): number;
    /**
     * 数据聚合 - 按区域
     */
    static aggregateByRegion(data: GeoData[], regionKey: string): Record<string, GeoData[]>;
    /**
     * 生成颜色映射
     */
    static generateColorMap(data: GeoData[], colorScheme?: string[]): Map<number, string>;
}

/**
 * 主题管理器
 * 提供预设主题和自定义主题功能
 */
declare class ThemeManager {
    private static instance;
    private themes;
    private currentTheme;
    private constructor();
    static getInstance(): ThemeManager;
    /**
     * 初始化默认主题
     */
    private initializeDefaultThemes;
    /**
     * 注册主题
     */
    registerTheme(theme: ThemeConfig): void;
    /**
     * 获取主题
     */
    getTheme(name: string): ThemeConfig | undefined;
    /**
     * 获取所有主题名称
     */
    getThemeNames(): string[];
    /**
     * 设置当前主题
     */
    setCurrentTheme(name: string): boolean;
    /**
     * 获取当前主题
     */
    getCurrentTheme(): ThemeConfig | undefined;
    /**
     * 获取当前主题名称
     */
    getCurrentThemeName(): string;
    /**
     * 删除主题
     */
    removeTheme(name: string): boolean;
    /**
     * 应用主题到 ECharts 配置
     */
    applyTheme(theme: ThemeConfig, baseConfig?: any): any;
    /**
     * 创建自定义主题
     */
    createCustomTheme(name: string, baseTheme?: string, overrides?: Partial<ThemeConfig>): ThemeConfig;
}

/**
 * 动画管理器
 * 提供各种动画效果和配置
 */
declare class AnimationManager {
    private static instance;
    private animations;
    private constructor();
    static getInstance(): AnimationManager;
    /**
     * 初始化默认动画配置
     */
    private initializeDefaultAnimations;
    /**
     * 注册动画配置
     */
    registerAnimation(animation: AnimationConfig & {
        name: string;
    }): void;
    /**
     * 获取动画配置
     */
    getAnimation(name: string): (AnimationConfig & {
        name: string;
    }) | undefined;
    /**
     * 获取所有动画名称
     */
    getAnimationNames(): string[];
    /**
     * 应用动画到 ECharts 配置
     */
    applyAnimation(animation: AnimationConfig, baseConfig?: any): any;
    /**
     * 获取动画类型对应的 ECharts 动画类型
     */
    private getAnimationType;
    /**
     * 创建数据加载动画
     */
    createDataLoadingAnimation(data: any[], animation: AnimationConfig): any[];
    /**
     * 创建区域切换动画
     */
    createRegionSwitchAnimation(fromRegion: string, toRegion: string, animation: AnimationConfig): any;
    /**
     * 创建数据更新动画
     */
    createDataUpdateAnimation(oldData: any[], newData: any[], animation: AnimationConfig): any;
    /**
     * 创建自定义动画
     */
    createCustomAnimation(name: string, baseAnimation?: string, overrides?: Partial<AnimationConfig>): AnimationConfig & {
        name: string;
    };
    /**
     * 获取动画缓动函数
     */
    getEasingFunctions(): string[];
}

/**
 * 提示框管理器
 * 提供丰富的提示框功能和自定义模板
 */
declare class TooltipManager {
    private static instance;
    private tooltips;
    private constructor();
    static getInstance(): TooltipManager;
    /**
     * 初始化默认提示框配置
     */
    private initializeDefaultTooltips;
    /**
     * 注册提示框配置
     */
    registerTooltip(tooltip: TooltipConfig & {
        name: string;
    }): void;
    /**
     * 获取提示框配置
     */
    getTooltip(name: string): TooltipConfig | undefined;
    /**
     * 获取所有提示框名称
     */
    getTooltipNames(): string[];
    /**
     * 应用提示框到 ECharts 配置
     */
    applyTooltip(tooltip: TooltipConfig, baseConfig?: any): any;
    /**
     * 获取默认格式化器
     */
    private getDefaultFormatter;
    /**
     * 创建自定义格式化器
     */
    createCustomFormatter(template: string, dataFields?: string[]): (params: any) => string;
    /**
     * 创建数据统计提示框
     */
    createDataStatsTooltip(data: any[]): TooltipConfig;
    /**
     * 计算数据统计信息
     */
    private calculateDataStats;
    /**
     * 创建区域信息提示框
     */
    createRegionInfoTooltip(regionData: any): TooltipConfig;
    /**
     * 创建自定义提示框
     */
    createCustomTooltip(name: string, baseTooltip?: string, overrides?: Partial<TooltipConfig>): TooltipConfig;
}

/**
 * 数据可视化增强器
 * 提供热力图、流向图、等值线图等高级可视化功能
 */
declare class DataVisualization {
    private static instance;
    private constructor();
    static getInstance(): DataVisualization;
    /**
     * 创建热力图配置
     */
    createHeatmapConfig(data: GeoData[], options?: {
        radius?: number;
        intensity?: number;
        colorScheme?: string[];
        blur?: number;
    }): any;
    /**
     * 创建流向图配置
     */
    createFlowConfig(fromData: GeoData[], toData: GeoData[], options?: {
        lineStyle?: any;
        effectStyle?: any;
        symbolSize?: number;
        color?: string;
    }): any;
    /**
     * 创建等值线图配置
     */
    createContourConfig(data: GeoData[], options?: {
        levels?: number[];
        colorScheme?: string[];
        lineWidth?: number;
    }): any;
    /**
     * 创建散点图配置（增强版）
     */
    createScatterConfig(data: GeoData[], options?: {
        symbolSize?: number | ((value: any) => number);
        color?: string | ((value: any) => string);
        symbol?: string;
        label?: any;
        emphasis?: any;
    }): any;
    /**
     * 创建效果散点图配置
     */
    createEffectScatterConfig(data: GeoData[], options?: {
        symbolSize?: number;
        color?: string;
        effectType?: 'ripple';
        rippleEffect?: any;
    }): any;
    /**
     * 创建地图配置
     */
    createMapConfig(data: GeoData[], mapName: string, options?: {
        itemStyle?: any;
        emphasis?: any;
        select?: any;
        label?: any;
    }): any;
    /**
     * 创建组合图表配置
     */
    createCombinedConfig(configs: Array<{
        type: 'scatter' | 'effectScatter' | 'heatmap' | 'lines' | 'map' | 'contour';
        data: GeoData[];
        options?: any;
    }>): any[];
    /**
     * 数据聚类
     */
    clusterData(data: GeoData[], options?: {
        clusterRadius?: number;
        maxZoom?: number;
        minPoints?: number;
    }): Array<{
        center: [number, number];
        points: GeoData[];
        count: number;
    }>;
    /**
     * 计算两点间距离
     */
    private calculateDistance;
    /**
     * 计算中心点
     */
    private calculateCenter;
    /**
     * 生成颜色渐变
     */
    generateColorGradient(startColor: string, endColor: string, steps: number): string[];
    /**
     * 颜色插值
     */
    private interpolateColor;
}

/**
 * 交互功能增强器
 * 提供区域搜索、数据筛选、交互控制等功能
 */
declare class InteractiveFeatures {
    private static instance;
    private searchIndex;
    private filterCache;
    private constructor();
    static getInstance(): InteractiveFeatures;
    /**
     * 构建搜索索引
     */
    buildSearchIndex(data: GeoData[]): void;
    /**
     * 添加到搜索索引
     */
    private addToIndex;
    /**
     * 搜索数据
     */
    search(query: string, data: GeoData[]): GeoData[];
    /**
     * 按数值范围筛选
     */
    filterByValue(data: GeoData[], minValue: number, maxValue: number): GeoData[];
    /**
     * 按地理范围筛选
     */
    filterByBounds(data: GeoData[], bounds: {
        minLng: number;
        maxLng: number;
        minLat: number;
        maxLat: number;
    }): GeoData[];
    /**
     * 按区域筛选
     */
    filterByRegion(data: GeoData[], regionNames: string[]): GeoData[];
    /**
     * 多条件筛选
     */
    multiFilter(data: GeoData[], filters: {
        search?: string;
        valueRange?: [number, number];
        bounds?: {
            minLng: number;
            maxLng: number;
            minLat: number;
            maxLat: number;
        };
        regions?: string[];
    }): GeoData[];
    /**
     * 数据排序
     */
    sortData(data: GeoData[], sortBy: 'name' | 'value' | 'distance', order?: 'asc' | 'desc', center?: [number, number]): GeoData[];
    /**
     * 计算两点间距离
     */
    private calculateDistance;
    /**
     * 获取拼音首字母
     */
    private getPinyinInitials;
    /**
     * 创建数据统计
     */
    createDataStats(data: GeoData[]): {
        total: number;
        average: number;
        max: number;
        min: number;
        median: number;
        stdDev: number;
    };
    /**
     * 创建数据分组
     */
    groupData(data: GeoData[], groupBy: 'value' | 'region' | 'custom', groupFunction?: (item: GeoData) => string): Map<string, GeoData[]>;
    /**
     * 创建数据导出
     */
    exportData(data: GeoData[], format?: 'json' | 'csv' | 'geojson'): string;
    /**
     * 创建数据导入
     */
    importData(data: string, format?: 'json' | 'csv' | 'geojson'): GeoData[];
    /**
     * 清除缓存
     */
    clearCache(): void;
}

export { AnimationManager, DataVisualization, Geo, GeoUtils, InteractiveFeatures, MapRegistry, ThemeManager, TooltipManager };
