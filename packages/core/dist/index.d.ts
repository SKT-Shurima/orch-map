import { SeriesOption } from 'echarts';
import { FeatureCollection as FeatureCollection$1 } from 'geojson';
import { FeatureCollection, BaseMapPoint as BaseMapPoint$1, BaseMapLine as BaseMapLine$1, MapLevel as MapLevel$1, MapRendererType as MapRendererType$1, AnyObj } from '@orch-map/types';

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
    onPointClick?: (point: BaseMapPoint$1) => void;
    /** 悬停点事件 */
    onPointHover?: (point: BaseMapPoint$1 | null) => void;
    /** 点击线事件 */
    onLineClick?: (line: BaseMapLine$1) => void;
    /** 悬停线事件 */
    onLineHover?: (line: BaseMapLine$1 | null) => void;
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
    /** 地图版本，所应用的场景：标准版/国际版，不同的版本的geojson数据不同 */
    mapVersion: 'standard' | 'international';
    /** 渲染器类型 */
    renderType: MapRendererType$1;
    /** 当前地图层级 */
    curLevel: MapLevel$1;
    /** 行政区划代码 */
    adcode?: string;
    /** 国家代码 */
    country?: string;
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
    setPoints(points: BaseMapPoint$1[]): Promise<void>;
    /**
     * 设置线数据
     * @param lines 线数据数组
     */
    setLines(lines: BaseMapLine$1[]): Promise<void>;
    /**
     * 更新地图层级
     * @param level 新的地图层级
     */
    updateMapLevel?(level: MapLevel$1): void;
    /**
     * 设置点样式
     * @param seriesName 系列名称
     * @param styleProcessor 样式处理函数
     */
    setPointStyle?(seriesName: string, styleProcessor: (point: BaseMapPoint$1) => void): void;
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
    private generateMapName;
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

declare enum MapRendererType {
    ECHARTS = "echarts",
    DECKGL = "deckgl"
}

/**
 * 模块：GL 地图入口
 * 说明：负责 DeckGL 实例的使用与业务图层（Geo、点、弧线）装配与更新。
 * 设计要点：
 * - 尽量将渲染状态（选中、时间轴）与数据状态（points/lines/geo）分离；
 * - 通过 `MapLayerManager` 进行图层注册与替换，降低对 Deck 实例的直接依赖；
 * - 动画与交互尽量采用轻量更新（避免重建不必要对象）。
 */

/**
 * GlMap
 * - 负责初始化 DeckGL 场景与各业务图层
 * - 暴露数据写入（setPoints/setLines/setGEOData）与销毁接口
 */
declare class DeckglMap {
    /** 实例唯一标识（用于从 DeckInstance Map 中获取实例） */
    private instanceId;
    /** 图标图集构建结果（iconAtlas、iconMapping）。注意：DataURL 字符串占用内存较大，后续可考虑缓存与复用。 */
    private iconAtlasResult;
    /** 当前动画时间（单位：秒的逻辑刻度） */
    private currentTime;
    /** 动画计时器任务句柄 */
    private animationTimer;
    /** 折线数据源 */
    private lines;
    /** 点数据源 */
    private points;
    /** 选中点 ID（用于放大/高亮显示） */
    private selectedPointId;
    /** 每 tick 前进的“秒数”（逻辑时间） */
    private readonly ANIMATION_SPEED;
    /** 可见尾迹长度（逻辑时间） */
    private readonly TRAIL_LENGTH;
    /** 时间循环区间（逻辑时间），默认 6 小时 */
    private readonly TIME_LOOP;
    private mode;
    /** 曲率计算器，用于为 2D 曲线路径生成控制点偏移量 */
    private readonly curvatureCalculator;
    /** 2D 线路渲染器 */
    private readonly lineRenderer2D;
    /** 3D 线路渲染器 */
    private readonly lineRenderer3D;
    /** 额外注册的 SVG 图标集合（由业务侧注入），键为 icon key，值为 SVG 字符串 */
    private extraSvgIcons;
    /**
     * 构造函数
     * @param instanceId Deck 实例标识
     * @param container Canvas 容器
     * @param callback 初始化完成回调（图标图集构建完毕后触发）
     */
    constructor(container: HTMLCanvasElement, mode: "2d" | "3d", callback: () => void);
    private get currentDeckInstance();
    /**
     * 初始化 Deck 实例与图标图集
     * 注意：
     * - 这里通过容器宽度估算 minZoom，存在不同屏幕 DPR 下的视觉差异，可在后续优化中考虑；
     * - 图标图集构建是异步的，构建完成前不应创建依赖图集的图层（本实现已在回调后触发动画）。
     */
    private initDeck;
    /**
   * 创建 Canvas 元素
   */
    private createCanvas;
    /**
     * 地图空白处点击处理（取消点选中）
     * 注意：`info` 为 deck 提供的拾取信息，这里仅判断 id 与图层，业务可按需扩展。
     */
    private handleClickMapView;
    /**
     * 设置国家/省份 GeoJSON 数据并注册基础底图图层
     * @param geojsonData GeoJSON FeatureCollection
     */
    setGEOData(geojsonData: FeatureCollection): Promise<void>;
    /**
     * 点对象点击处理（设置选中）
     */
    private handleClickPoint;
    /**
     * 将业务点数据转换为 IconLayer 需要的数据结构
     * 注意：此处统一在 z 轴抬升避免深度冲突；可通过 `size` 与 `color` 做运行时调优。
     */
    private generateIconLayerData;
    /**
     * 根据输入数据构建 IconLayer 图层实例
     * 注意：依赖 iconAtlasResult，如为空会导致图层纹理缺失，生产中建议增加兜底或等待图集就绪。
     */
    private generateIconLayer;
    /**
     * 设置点数据（内部仅记录与触发覆盖层更新）
     */
    setPoints(points: BaseMapPoint$1[]): Promise<void>;
    /**
     * 设置折线数据
     */
    setLines(lines: BaseMapLine$1[]): void;
    /**
     * 将当前 LayerManager 中的图层刷新到 Deck 实例
     * 注意：`getLayers` 返回包含固定顺序 id 的数组，若某些图层未注册，则返回可能包含 undefined，
     * 生产中建议在 `MapLayerManager` 内部过滤空值以降低渲染层判断成本（此处仅注释，不改变逻辑）。
     */
    private updateLayer;
    /**
     * 根据当前时间推进动画并更新图层
     * 性能注意：每次都会重建 AnimatedArcLayer 实例，数量大时有创建开销，可考虑用 updateTriggers 或 attribute 更新替代。
     */
    private updateArcAnimation;
    /**
     * 根据选中状态重建点图层（用于同步 size/颜色等样式）
     */
    private updateSelectionOverlay;
    /**
     * 业务无关 API：注册额外 SVG 图标，键为 icon key，值为内联 SVG 字符串。
     * 若图集已构建，则重建图集并刷新当前点图层。
     */
    registerExtraSvgIcons(icons: Record<string, string>): Promise<void>;
    /**
     * 重建 IconAtlas：合并默认与额外图标，更新图层
     */
    private rebuildIconAtlas;
    /**
     * 启动动画定时器
     * 注意：外部需在组件卸载时调用 `destroy` 释放计时器；也可进一步与 `DeckInstance` 生命周期对齐管理。
     */
    private startArcAnimation;
    /**
     * 销毁内部资源
     * 注意：目前仅销毁计时器，Deck 实例的销毁需由外部调用 `DeckInstance.removeInstance` 完成资源回收。
     */
    destroy(): void;
}

/**
 * 地图渲染器工厂
 * 负责根据配置创建对应的渲染器实例
 */
declare class OrchMap {
    private config;
    protected instance: EchartsMap | DeckglMap;
    constructor(config: MapRendererConfig);
    initMap(): Promise<void>;
    /**
     * 创建地图渲染器
     * @param type 渲染器类型
     * @param config 渲染器配置
     * @returns 地图渲染器实例
     */
    static createRenderer(type: MapRendererType, config: MapRendererConfig): void;
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

export { MapRendererType, OrchMap as default };
