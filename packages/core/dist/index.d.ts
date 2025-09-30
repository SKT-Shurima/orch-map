import { FeatureCollection, AnyObj, MapLevel as MapLevel$1 } from '@orch-map/types';
import { SeriesOption } from 'echarts';
import { FeatureCollection as FeatureCollection$1 } from 'geojson';

/**
 * @orch-map/types - 地图组件类型定义
 * 地理空间数据类型定义
 */
type Coordinate = [number, number];

declare enum MapLevel {
    WORLD = "world",
    COUNTRY = "country",
    PROVINCE = "province",
    CITY = "city",
    COUNTY = "county"
}
interface BaseMapPoint {
    id: string;
    coordinate: Coordinate;
    icon?: string;
    color?: [number, number, number, number];
    size?: number;
    label?: string;
    tooltip?: string;
    [key: string]: any;
}
interface BaseMapLine {
    id: string;
    startCoordinate: Coordinate;
    endCoordinate: Coordinate;
    color?: [number, number, number, number];
    width?: number;
    style?: 'solid' | 'dashed' | 'dotted';
    [key: string]: any;
}

/**
 * 地图渲染器事件接口
 */
interface MapRendererEvents {
    /** 点击点事件 */
    onPointClick?: (point: BaseMapPoint) => void;
    /** 悬停点事件 */
    onPointHover?: (point: BaseMapPoint | null) => void;
    /** 点击线事件 */
    onLineClick?: (line: BaseMapLine) => void;
    /** 悬停线事件 */
    onLineHover?: (line: BaseMapLine | null) => void;
    /** 点击区域事件 */
    onAreaClick?: (area: any) => void;
    /** 悬停区域事件 */
    onAreaHover?: (area: any | null) => void;
    /** 双击区域事件 */
    onAreaDoubleClick?: (area: any) => void;
    /** 地图点击事件 */
    onMapClick?: (event: {
        lat: number;
        lng: number;
    }) => void;
    /** 地图缩放事件 */
    onZoom?: (level: number) => void;
    /** 地图平移事件 */
    onPan?: (center: {
        lat: number;
        lng: number;
    }) => void;
}
/**
 * 地图渲染器配置接口
 */
interface MapRendererConfig {
    /** 容器元素 */
    container: HTMLElement | string;
    /** 当前地图层级 */
    curLevel?: MapLevel;
    /** 行政区划代码 */
    adcode?: string;
    /** 国家代码 */
    country?: string;
    /** 详细地图数据 */
    detailMap?: string;
    /** 中心国家 */
    centralCountry?: string;
    /** 渲染模式 */
    mode?: "2d" | "3d";
    /** 事件处理器 */
    events?: MapRendererEvents;
    /** 地图中心点 */
    center?: {
        lat: number;
        lng: number;
    };
    /** 缩放级别 */
    zoom?: number;
    /** 地图样式 */
    style?: string;
    /** 是否显示控制面板 */
    showControls?: boolean;
    /** 是否启用交互 */
    interactive?: boolean;
}
/**
 * 地图渲染器统一接口
 * 所有地图渲染器都必须实现此接口
 */
interface IMapRenderer {
    /**
     * 设置地理数据
     * @param boundary 边界数据
     * @param detail 详细数据（可选）
     */
    setGeoData(boundary: FeatureCollection, detail?: FeatureCollection): Promise<void>;
    /**
     * 设置点数据
     * @param points 点数据数组
     */
    setPoints(points: BaseMapPoint[]): Promise<void>;
    /**
     * 设置线数据
     * @param lines 线数据数组
     */
    setLines(lines: BaseMapLine[]): Promise<void>;
    /**
     * 更新地图层级
     * @param level 新的地图层级
     */
    updateMapLevel?(level: MapLevel): void;
    /**
     * 设置点样式
     * @param seriesName 系列名称
     * @param styleProcessor 样式处理函数
     */
    setPointStyle?(seriesName: string, styleProcessor: (point: BaseMapPoint) => void): void;
    /**
     * 注册额外的图标（仅部分渲染器支持）
     * @param icons 图标映射
     */
    registerExtraIcons?(icons: Record<string, string>): Promise<void>;
    /**
     * 调整地图大小
     */
    resize(): void;
    /**
     * 销毁渲染器
     */
    destroy(): void;
}

/**
 * @description: Series 中的点的基本信息
 * 用于渲染数据列的时候，每个点所必备的信息
 */
interface PointSeriesDataItem<T> {
    name: string;
    value: [number, number];
    businessInfo?: T;
    graphInfo?: AnyObj;
    symbol?: string;
    symbolSize?: number | [number, number];
    itemStyle?: AnyObj;
    label?: AnyObj;
    tooltip?: AnyObj;
}
declare enum PointTypeEnum {
    SCATTER = "scatter",
    EFFECT_SCATTER = "effectScatter"
}
/**
 * @description: 点击或者hover的散点图的信息
 */
interface PointParam<T> {
    name: string;
    componentType: "series";
    componentSubType: "scatter";
    seriesName: string;
    seriesType: PointTypeEnum;
    componentIndex: number;
    event: {
        event: AnyObj;
    };
    geoIndex: number;
    data: PointSeriesDataItem<T>;
}

interface GEOParam {
    name: string;
    componentType: "geo";
    event: {
        event: AnyObj;
    };
    geoIndex: number;
    region: {
        name: string;
        adcode?: string;
    };
}

interface EchartsMapEvents<T> {
    onHoverPoint?: (params: PointParam<T>) => void;
    onClickPoint?: (params: PointParam<T>) => void;
    onClickArea?: (params?: GEOParam) => void;
    onDoubleClickArea?: (nextLevel: MapLevel, params: GEOParam) => void;
    onHoverArea?: (params?: GEOParam, pointsInRegion?: string[]) => void;
    onUpdateGeo?: (params: FeatureCollection$1) => void;
    onZoom?: (zoom: number) => void;
}
interface EchartsMapOptions<T> {
    events?: EchartsMapEvents<T>;
}
declare class EchartsMap<T = unknown> implements IMapRenderer {
    private detailMap;
    private centralCountry?;
    private events;
    private container;
    private chartInstance;
    private series;
    private boundaryLoading;
    private config;
    private unsubscribeState;
    constructor(container: HTMLElement | string, options: EchartsMapOptions<T> | MapRendererConfig);
    private get currentMapIsChina();
    private get detailGeojson();
    private setChartOption;
    setGEOData(boundary: FeatureCollection$1, detail: FeatureCollection$1): void;
    private handleChangeAreaImpl;
    private checkPointInFeature;
    private checkPointInPolygon;
    private mouseoverHandler;
    private mouseoutHandler;
    private checkMapEntryEligibility;
    private clickHandler;
    private getPostCodeByGeoFeatures;
    private dbClickHandler;
    private waitForBoundaryLoadingToBeFalse;
    private transSeriesCoordinate2GeoJsonXY;
    private updateSeriesImpl;
    setPointStyleInternal(targetSeriesName: string, processFn: (dataItem: PointSeriesDataItem<T>) => void): void;
    private redrawMap;
    private registerEvents;
    resizeMap: () => void;
    updateMapLevel(curLevel: MapLevel): void;
    destroy(): void;
    private initChart;
    updateSeries: (series: SeriesOption[]) => void;
    private handleChangeArea;
    /**
     * 处理状态变化
     */
    private handleStateChange;
    /**
     * 在 ECharts 中更新点数据
     */
    private updatePointsInEcharts;
    /**
     * 在 ECharts 中更新线数据
     */
    private updateLinesInEcharts;
    /**
     * 将统一的事件格式转换为 ECharts 需要的格式
     */
    private convertEventsToEchartsFormat;
    /**
     * 根据 ECharts 事件参数查找对应的点数据
     */
    private findPointByData;
    /**
     * 规范化地理数据格式
     */
    private normalizeGeoData;
    /**
     * 将点数据转换为 ECharts Series
     */
    private convertPointsToSeries;
    /**
     * 将线数据转换为 ECharts Series
     */
    private convertLinesToSeries;
    setGeoData(boundary: FeatureCollection$1): Promise<void>;
    setPoints(points: BaseMapPoint[]): Promise<void>;
    setLines(lines: BaseMapLine[]): Promise<void>;
    updateMapView(config: {
        curLevel: MapLevel;
        adcode: string;
        country: string;
    }): Promise<void>;
    setPointStyle(seriesName: string, styleProcessor: (point: BaseMapPoint) => void): void;
    resize(): void;
    getType(): "echarts";
    private getCenterAndZoomByGeometryCoordinates;
}

declare enum LayerType {
    POINT = "point",
    LINE = "line",
    POLYGON = "polygon",
    ARC = "arc",
    PATH = "path",
    GEO = "geo"
}
interface LayerData {
    type: LayerType;
    data: any;
}

declare enum MapRendererType {
    ECHARTS = "echarts",
    DECKGL = "deckgl"
}

/**
 * DeckGL 地图渲染器适配器
 * 将 GlMap 类适配为统一的 IMapRenderer 接口
 */
declare class DeckglMapAdapter implements IMapRenderer {
    private glMap;
    private config;
    private instanceId;
    private isInitialized;
    private initPromise;
    private unsubscribeState;
    constructor(config: MapRendererConfig);
    /**
     * 初始化 DeckGL
     */
    private initDeckGL;
    /**
     * 创建 Canvas 元素
     */
    private createCanvas;
    /**
     * 设置事件处理器
     */
    private setupEventHandlers;
    /**
     * 处理状态变化
     */
    private handleStateChange;
    /**
     * 在 DeckGL 中更新地理数据
     */
    private updateGeoDataInDeckGL;
    /**
     * 在 DeckGL 中更新点数据
     */
    private updatePointsInDeckGL;
    /**
     * 在 DeckGL 中更新线数据
     */
    private updateLinesInDeckGL;
    /**
     * 等待初始化完成
     */
    private waitForInit;
    /**
     * 设置地理数据
     */
    setGeoData(boundary: FeatureCollection): Promise<void>;
    /**
     * 规范化为 FeatureCollection 格式
     */
    private normalizeToFeatureCollection;
    /**
     * 设置点数据
     */
    setPoints(points: BaseMapPoint[]): Promise<void>;
    /**
     * 转换点数据为 DeckGL 格式
     */
    private convertPointsForDeckGL;
    /**
     * 解析颜色值
     */
    private parseColor;
    /**
     * 设置线数据
     */
    setLines(lines: BaseMapLine[]): Promise<void>;
    /**
     * 转换线数据为 DeckGL 格式
     */
    private convertLinesForDeckGL;
    /**
     * 更新地图层级
     */
    updateMapLevel(level: MapLevel$1): void;
    /**
     * 设置点样式
     */
    setPointStyle(seriesName: string, styleProcessor: (point: BaseMapPoint) => void): void;
    /**
     * 注册额外的图标
     */
    registerExtraIcons(icons: Record<string, string>): Promise<void>;
    /**
     * 调整地图大小
     */
    resize(): void;
    /**
     * 销毁渲染器
     */
    destroy(): void;
    /**
     * 获取渲染器类型
     */
    getType(): "deckgl";
}

/**
 * 地图渲染器工厂
 * 负责根据配置创建对应的渲染器实例
 */
declare class MapRendererFactory {
    /**
     * 创建地图渲染器
     * @param type 渲染器类型
     * @param config 渲染器配置
     * @returns 地图渲染器实例
     */
    static createRenderer(type: MapRendererType, config: MapRendererConfig): DeckglMapAdapter | EchartsMap<unknown>;
    /**
     * 检查是否支持指定的渲染器类型
     * @param type 渲染器类型
     * @returns 是否支持
     */
    static isSupported(type: string): type is MapRendererType;
    /**
     * 获取所有支持的渲染器类型
     * @returns 支持的渲染器类型列表
     */
    static getSupportedTypes(): MapRendererType[];
    /**
     * 根据环境自动选择最佳渲染器
     * @param config 渲染器配置
     * @returns 推荐的渲染器类型
     */
    static getRecommendedType(config?: Partial<MapRendererConfig>): MapRendererType;
}

/**
 * 统一地图组件配置
 */
interface UnifiedMapConfig extends MapRendererConfig {
    /**
     * 渲染器类型
     * 如果不指定，将自动选择最佳渲染器
     */
    renderType?: MapRendererType;
    /**
     * 是否启用自动切换
     * 当渲染器初始化失败时自动切换到备用渲染器
     */
    autoFallback?: boolean;
    /**
     * 自定义图标（仅 DeckGL 支持）
     */
    customIcons?: Record<string, string>;
}
/**
 * 统一地图组件
 * 提供统一的 API 来使用不同的地图渲染器
 */
declare class UnifiedMapComponent {
    private renderer;
    private config;
    private renderType;
    private isInitialized;
    constructor(config: UnifiedMapConfig);
    /**
     * 初始化渲染器
     */
    private initRenderer;
    /**
     * 回退到备用渲染器
     */
    private fallbackToAlternativeRenderer;
    /**
     * 获取当前使用的渲染器类型
     */
    getCurrentRendererType(): MapRendererType;
    /**
     * 切换渲染器类型
     * @param type 新的渲染器类型
     */
    switchRenderer(type: MapRendererType): Promise<void>;
    /**
     * 保存当前状态
     */
    private saveCurrentState;
    /**
     * 恢复状态
     */
    private restoreState;
    /**
     * 设置地理数据
     */
    setGeoData(boundary: FeatureCollection): Promise<void>;
    /**
     * 设置点数据
     */
    setPoints(points: BaseMapPoint[]): Promise<void>;
    /**
     * 设置线数据
     */
    setLines(lines: BaseMapLine[]): Promise<void>;
    /**
     * 更新地图层级
     */
    updateMapLevel(level: MapLevel): void;
    /**
     * 设置点样式
     */
    setPointStyle(seriesName: string, styleProcessor: (point: BaseMapPoint) => void): void;
    /**
     * 注册额外的图标（仅 DeckGL 支持）
     */
    registerExtraIcons(icons: Record<string, string>): Promise<void>;
    /**
     * 调整地图大小
     */
    resize(): void;
    /**
     * 销毁组件
     */
    destroy(): void;
    /**
     * 检查是否已初始化
     */
    isReady(): boolean;
    /**
     * 等待初始化完成
     */
    waitForReady(): Promise<void>;
}

/**
 * ECharts 渲染器
 * 基于 ECharts 的 2D 地图渲染实现
 */

type MapEventHandler$1 = (data: unknown) => void;
declare class EChartsMapRenderer implements IMapRenderer {
    private container;
    private config;
    private echartsMap;
    private eventHandlers;
    constructor(container: HTMLElement, config: MapRendererConfig);
    /**
     * 初始化 ECharts
     */
    private initECharts;
    /**
     * 渲染图层数据
     */
    render(data: LayerData[]): void;
    /**
     * 添加点图层
     */
    private addPointSeries;
    /**
     * 添加线图层
     */
    private addLineSeries;
    /**
     * 添加地理图层
     */
    private addGeoSeries;
    /**
     * 设置地图级别
     */
    setMapLevel(level: MapLevel, region?: string): Promise<void>;
    /**
     * 设置点数据
     */
    setPoints(points: BaseMapPoint[]): Promise<void>;
    /**
     * 设置线数据
     */
    setLines(lines: BaseMapLine[]): Promise<void>;
    /**
     * 设置地图数据
     */
    setGeoData(geoData: FeatureCollection$1): Promise<void>;
    /**
     * 监听事件
     */
    on(event: string, callback: MapEventHandler$1): void;
    /**
     * 取消监听事件
     */
    off(event: string, callback: MapEventHandler$1): void;
    /**
     * 触发事件
     */
    private emit;
    /**
     * 调整地图大小
     */
    resize(): void;
    /**
     * 销毁渲染器
     */
    destroy(): void;
}

/**
 * DeckGL 渲染器
 * 基于 DeckGL 的 3D 地图渲染实现
 */

type MapEventHandler = (data: unknown) => void;
declare class DeckGLMapRenderer implements IMapRenderer {
    private container;
    private config;
    private glMap;
    private eventHandlers;
    constructor(container: HTMLElement, config: MapRendererConfig);
    /**
     * 初始化 DeckGL
     */
    private initDeckGL;
    resize(): void;
    /**
     * 渲染图层数据
     */
    render(data: LayerData[]): void;
    /**
     * 添加点图层
     */
    private addPointLayer;
    /**
     * 添加线图层
     */
    private addLineLayer;
    /**
     * 添加地理图层
     */
    private addGeoLayer;
    /**
     * 设置地图级别
     */
    setMapLevel(level: MapLevel, region?: string): Promise<void>;
    /**
     * 添加点数据
     */
    setPoints(points: BaseMapPoint[]): Promise<void>;
    /**
     * 添加线数据
     */
    setLines(lines: BaseMapLine[]): Promise<void>;
    /**
     * 设置地图数据
     */
    setGeoData(geoData: FeatureCollection): Promise<void>;
    /**
     * 监听事件
     */
    on(event: string, callback: MapEventHandler): void;
    /**
     * 取消监听事件
     */
    off(event: string, callback: MapEventHandler): void;
    /**
     * 触发事件
     */
    private emit;
    private isFeatureCollection;
    /**
     * 销毁渲染器
     */
    destroy(): void;
}

/**
 * 创建地图渲染器的便捷函数
 * @param type 渲染器类型
 * @param config 渲染器配置
 * @returns 地图渲染器实例
 */
declare function createMapRenderer(type: MapRendererType, config: MapRendererConfig): IMapRenderer;
/**
 * 创建统一地图组件的便捷函数
 * @param config 统一地图配置
 * @returns 统一地图组件实例
 */
declare function createUnifiedMap(config: UnifiedMapConfig): UnifiedMapComponent;
/**
 * 快速创建 ECharts 地图
 * @param config 地图配置
 * @returns 地图渲染器实例
 */
declare function createEchartsMap(config: MapRendererConfig): IMapRenderer;
/**
 * 快速创建 DeckGL 地图
 * @param config 地图配置
 * @returns 地图渲染器实例
 */
declare function createDeckglMap(config: MapRendererConfig): IMapRenderer;

/**
 * 地图渲染器常量定义
 */
/**
 * 地图渲染器类型
 */
declare const MAP_RENDERER_TYPES: {
    readonly ECHARTS: "echarts";
    readonly DECKGL: "deckgl";
};
/**
 * 渲染模式
 */
declare const RENDER_MODES: {
    readonly MODE_2D: "2d";
    readonly MODE_3D: "3d";
};
/**
 * 默认配置
 */
declare const DEFAULT_CONFIG: {
    readonly ZOOM: 10;
    readonly CENTER: {
        readonly lat: 39.9;
        readonly lng: 116.3;
    };
    readonly MODE: "2d";
    readonly INTERACTIVE: true;
    readonly SHOW_CONTROLS: false;
};
/**
 * 事件类型
 */
declare const EVENT_TYPES: {
    readonly POINT_CLICK: "pointClick";
    readonly POINT_HOVER: "pointHover";
    readonly LINE_CLICK: "lineClick";
    readonly LINE_HOVER: "lineHover";
    readonly MAP_CLICK: "mapClick";
    readonly ZOOM: "zoom";
    readonly PAN: "pan";
};

export { DEFAULT_CONFIG, DeckGLMapRenderer, DeckglMapAdapter, EChartsMapRenderer, EVENT_TYPES, EchartsMap, type IMapRenderer, MAP_RENDERER_TYPES, type MapRendererConfig, type MapRendererEvents, MapRendererFactory, MapRendererType, RENDER_MODES, UnifiedMapComponent, type UnifiedMapConfig, createDeckglMap, createEchartsMap, createMapRenderer, createUnifiedMap };
