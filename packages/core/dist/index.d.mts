import * as _orch_map_types from '@orch-map/types';
import { GeoJSONSourceInput, BaseMapPoint, BaseMapLine, MapLevel, MapRendererType as MapRendererType$1, AnyObj, FeatureCollection, GeoJSON as GeoJSON$1 } from '@orch-map/types';
import { GeoJSON } from 'geojson';
import { LinesSeriesOption } from 'echarts';

type AdapterPointInfo = {
    id: string;
    name: string;
};
/**
 * @description: 将大屏的配置信息进行统一口径处理
 */
interface AdapterParams {
    filterPoint?: AdapterPointInfo;
    activePoints: AdapterPointInfo[];
    staredPoints: AdapterPointInfo[];
    showNamePoints: AdapterPointInfo[];
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
    /** 地理数据更新事件 */
    onUpdateGeo?: (params: GeoJSONSourceInput) => void;
}
/**
 * 地图渲染器配置接口
 */
interface MapRendererConfig {
    /** 容器元素 */
    container: HTMLElement | string;
    /** 地图版本，所应用的场景：标准版/国际版，不同的版本的geojson数据不同 */
    mapVersion: "standard" | "international";
    /** 渲染器类型 */
    renderType: MapRendererType$1;
    /** 当前地图层级 */
    curLevel: MapLevel;
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
    setGeoData(boundary: GeoJSONSourceInput): Promise<void>;
    /**
     * 设置点数据
     * @param points 点数据数组
     */
    setPoints(points: BaseMapPoint[], adapterParams: AdapterParams, iconMapIds: Record<string, string[]>): Promise<void> | void;
    /**
     * 设置线数据
     * @param lines 线数据数组
     */
    setLines(lines: BaseMapLine[]): Promise<void> | void;
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

declare enum MapRendererType {
    ECHARTS = "echarts",
    DECKGL = "deckgl"
}

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
    setGEOData(geojsonData: GeoJSON): Promise<void>;
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
    setPoints(points: BaseMapPoint[]): Promise<void>;
    /**
     * 设置折线数据
     */
    setLines(lines: BaseMapLine[]): void;
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

/**
 * ECharts 地图事件接口
 * @template T - 点数据的业务信息类型
 */
interface EchartsMapEvents {
    /** 鼠标悬停在点上时触发 */
    onHoverPoint?: (params: BaseMapPoint) => void;
    /** 点击点时触发 */
    onClickPoint?: (params: BaseMapPoint) => void;
    /** 点击区域时触发 */
    onClickArea?: (params?: GEOParam) => void;
    /** 双击区域时触发（用于地图层级切换） */
    onDoubleClickArea?: (nextLevel: MapLevel, params: GEOParam) => void;
    /** 鼠标悬停在区域上时触发 */
    onHoverArea?: (params?: GEOParam, pointsInRegion?: string[]) => void;
    /** 地理数据更新时触发 */
    onUpdateGeo?: (params: FeatureCollection) => void;
    /** 地图缩放时触发 */
    onZoom?: (zoom: number) => void;
}
/**
 * ECharts 地图配置选项
 * @template T - 点数据的业务信息类型
 */
interface EchartsMapOptions {
    /** 地图事件处理器 */
    events?: EchartsMapEvents;
}
/**
 * ECharts 地图渲染器类
 * 基于 ECharts 实现的地图可视化组件，支持多层级地图切换、点线数据展示和交互事件
 * @template T - 点数据的业务信息类型，默认为 unknown
 */
declare class EchartsMap<T = unknown> implements IMapRenderer {
    /** 当前详细地图名称 */
    private detailMap;
    /** 中心国家代码 */
    private centralCountry?;
    /** 地图容器 DOM 元素 */
    private container;
    /** ECharts 实例 */
    private chartInstance;
    /** 图表系列配置 */
    private series;
    /** 边界数据加载状态 */
    private boundaryLoading;
    /** 地图渲染器配置 */
    private config;
    /** 状态管理器取消订阅函数 */
    private unsubscribeState;
    /** 曲率计算器实例 */
    private curvatureCalculator;
    /**
     * 构造函数
     * @param container - 地图容器，可以是 DOM 元素或元素 ID 字符串
     * @param options - 地图配置选项，支持 EchartsMapOptions 或 MapRendererConfig 格式
     * @throws {Error} 当通过 ID 查找容器元素失败时抛出错误
     */
    constructor(container: HTMLElement | string, options: EchartsMapOptions | MapRendererConfig, geoJson: GeoJSONSourceInput);
    /**
     * 获取当前地图是否为中国地图
     * @returns 是否为中国地图
     */
    private get currentMapIsChina();
    /**
     * 获取当前详细地图的 GeoJSON 数据
     * @returns 当前地图的 FeatureCollection 数据
     */
    private get detailGeojson();
    /**
     * 初始化 ECharts 图表实例
     * @private
     */
    private initChart;
    /**
     * 注册事件监听器
     * @private
     */
    private registerEvents;
    /**
     * 生成地图名称
     * @returns 地图名称字符串
     * @private
     */
    private generateMapName;
    /**
     * 设置 ECharts 图表配置选项
     * @param option - ECharts 配置选项
     * @private
     */
    private setChartOption;
    /**
     * 设置地理数据并更新地图显示
     * @param boundary - 边界地理数据
     * @public
     */
    setGEOData(boundary: GeoJSON$1): void;
    /**
     * 规范化地理数据格式
     * @param data - 地理数据
     * @returns 标准化的 FeatureCollection 数据
     * @private
     */
    private normalizeGeoData;
    /**
     * 将点数据转换为 ECharts Series
     * @param points - 点数据数组
     * @returns ECharts 系列配置数组
     * @private
     */
    private convertPointsToSeries;
    /**
     * 将线数据转换为 ECharts Series
     * @param lines - 线数据数组
     * @returns ECharts 系列配置数组
     * @private
     */
    private convertLinesToSeries;
    /**
     * 根据曲率生成曲线路径点
     * @param startCoord - 起点坐标 [lng, lat]
     * @param endCoord - 终点坐标 [lng, lat]
     * @param curvature - 曲率值 (0-1)
     * @returns 曲线路径点数组
     * @private
     */
    private generateCurvedPath;
    /**
     * 二次贝塞尔曲线计算
     * @param p0 - 起点
     * @param p1 - 控制点
     * @param p2 - 终点
     * @param t - 参数 (0-1)
     * @returns 曲线上的点
     * @private
     */
    private quadraticBezier;
    /**
     * 将系列数据坐标转换为 GeoJSON 投影坐标
     * @param series - ECharts 系列配置数组
     * @returns 转换后的系列配置数组
     * @private
     */
    /**
     * 将 PointParam 参数转换为 BaseMapPoint 格式
     * @param params - 点参数
     * @returns 转换后的 BaseMapPoint 对象
     * @private
     */
    private transPointParam2BaseMapPoint;
    /**
     * 鼠标悬停事件处理器
     * @param params - 事件参数，包含组件类型和相关信息
     * @private
     */
    private mouseoverHandler;
    /**
     * 鼠标移出事件处理器
     * @param params - 事件参数，包含组件类型和相关信息
     * @private
     */
    private mouseoutHandler;
    /**
     * 点击事件处理器
     * @param params - 事件参数，包含组件类型和相关信息
     * @private
     */
    private clickHandler;
    /**
     * 双击事件处理器（用于地图层级切换）
     * @param params - 事件参数，包含组件类型和区域信息
     * @private
     */
    private dbClickHandler;
    /**
     * 检查地图入口资格，确定是否可以进入下一级地图
     * @param params - 事件参数，包含区域名称等信息
     * @returns 下一级地图层级，如果无法进入则返回 undefined
     * @private
     */
    private checkMapEntryEligibility;
    /**
     * 根据地理要素名称获取行政区划代码
     * @param name - 地理要素名称
     * @returns 行政区划代码
     * @private
     */
    private getPostCodeByGeoFeatures;
    /**
     * 处理区域变化事件的具体实现
     * @param params - 地理参数，包含区域信息
     * @private
     */
    private handleChangeAreaImpl;
    /**
     * 检查点是否在指定地理要素内
     * @param coordinates - 点坐标 [经度, 纬度]
     * @param feature - 地理要素
     * @returns 点是否在要素内
     * @private
     */
    private checkPointInFeature;
    /**
     * 检查点是否在多边形内（支持带洞的多边形）
     * @param coordinates - 点坐标 [经度, 纬度]
     * @param polygonRings - 多边形环数组，第一个是外环，其余是内环（洞）
     * @returns 点是否在多边形内
     * @private
     */
    private checkPointInPolygon;
    /**
     * 等待边界数据加载完成
     * @param timeout - 超时时间（毫秒），默认 5000ms
     * @returns Promise - 加载完成时 resolve，超时时 reject
     * @private
     */
    private waitForBoundaryLoadingToBeFalse;
    /**
     * 更新系列数据的具体实现
     * @param series - ECharts 系列配置数组
     * @private
     */
    private updateSeriesImpl;
    /**
     * 在 ECharts 中为指定系列设置点样式
     * @param targetSeriesName - 目标系列名称
     * @param processFn - 处理函数，用于修改点数据项
     * @public
     */
    setPointStyleInternal(targetSeriesName: string, processFn: (dataItem: PointSeriesDataItem<T>) => void): void;
    /**
     * 重绘地图
     * @private
     */
    private redrawMap;
    /**
     * 调整地图大小
     * @public
     */
    resizeMap: () => void;
    /**
     * 更新地图层级
     * @param curLevel - 当前地图层级
     * @public
     */
    updateMapLevel(curLevel: MapLevel): void;
    /**
     * 销毁地图实例，清理资源
     * @public
     */
    destroy(): void;
    /**
     * 地图系列数据更新方法（防抖，300ms 延迟）
     * @param series - ECharts 系列配置
     * @public
     */
    updateSeries: (...args: unknown[]) => void;
    /**
     * 区域变化处理方法（防抖，600ms 延迟）
     * @param params - GEO参数
     * @private
     */
    private handleChangeArea;
    /**
     * # 更新地图上的点位
     * 该方法会移除旧的点位系列，然后添加新的点位系列
     * @param points 点位数组
     */
    setPoints(points: BaseMapPoint[], adapterParams: AdapterParams, iconMapIds?: Record<string, string[]>): void;
    /**
     * 在 ECharts 中更新线数据
     * @param lines - 线数据数组
     * @public
     */
    setLines(lines: BaseMapLine[]): Promise<void>;
    /**
     * 设置地理数据（IMapRenderer 接口实现）
     * @param boundary - 地理边界数据
     * @public
     */
    setGeoData(boundary: GeoJSONSourceInput): Promise<void>;
    /**
     * 设置点样式（IMapRenderer 接口实现）
     * @param seriesName - 系列名称
     * @param styleProcessor - 样式处理函数
     * @public
     */
    setPointStyle(seriesName: string, styleProcessor: (point: BaseMapPoint) => void): void;
    /**
     * 调整地图大小（IMapRenderer 接口实现）
     * @public
     */
    resize(): void;
    /**
     * 获取渲染器类型（IMapRenderer 接口实现）
     * @returns 渲染器类型标识
     * @public
     */
    getType(): "echarts";
}

/**
 * 地图渲染器工厂类
 * 负责根据配置创建对应的渲染器实例，支持 ECharts 和 DeckGL 两种渲染方式
 * @class OrchMap
 */
declare class OrchMap {
    /** 地图渲染器配置 */
    private config;
    /** 地图渲染器实例 */
    protected instance: EchartsMap | DeckglMap;
    /** 是否已初始化 */
    private _initialized;
    /** 初始化 Promise */
    private _initPromise;
    /** 初始化回调队列 */
    private _initCallbacks;
    /**
     * 构造函数
     * @param {MapRendererConfig} config - 地图渲染器配置
     */
    constructor(config: MapRendererConfig, extraSvgIcons?: Record<string, string>);
    /**
     * 初始化地图
     * @private
     * @returns {Promise<void>} 初始化 Promise
     */
    initMap(): Promise<void>;
    /**
     * 设置地图点位数据
     * @param {BaseMapPoint[]} points - 点位数据数组
     */
    setPoints(points: BaseMapPoint[], adapterParams: AdapterParams, iconMapIds?: Record<string, string[]>): void;
    /**
     * 设置地图线条数据
     * @param {BaseMapLine[]} lines - 线条数据数组
     */
    setLines(lines: BaseMapLine[]): void;
    /**
     * 在初始化完成后执行回调
     * @private
     * @param {() => void} callback - 回调函数
     */
    private _executeWhenReady;
    /**
     * 检查是否已初始化
     * @returns {boolean} 是否已初始化
     */
    isInitialized(): boolean;
    /**
     * 等待初始化完成
     * @returns {Promise<void>} 初始化完成的 Promise
     */
    waitForInitialization(): Promise<void>;
    /**
     * 根据环境自动选择最佳渲染器
     * @param {Partial<MapRendererConfig>} [config] - 渲染器配置
     * @returns {MapRendererType} 推荐的渲染器类型
     */
    static getRecommendedType(config?: Partial<MapRendererConfig>): MapRendererType;
}

/**
 * @description: ECharts地图工具类，用于处理点和线的配置
 *
 * 点处理逻辑:
 * 根据 mapConfig 的配置以及依赖数据，将 point 转换为 echarts 的配置
 * 这里会根据聚合模式分为三种情况
 * 1、非聚合模式
 * 2、按城市聚合模式
 * 3、按省份聚合模式 （目前只有 CPE 大屏地图，并且是在中国大陆模式下才会有的）
 * 注意：这里只处理通用问题的通用解，如果涉及到根据特殊逻辑定制的，需要进行二次加工
 *
 * 线处理逻辑(可选):
 * 将线条转换为 echarts 的配置
 */
declare class EChartsGeoUtils {
    private static curvatureMap;
    /**
     * @description: 获取点默认配置项
     * @param point 点数据
     * @warning 这里的 showLabelNotEmphasis 为 true 时，会展示 label，
     * showLabelNotEmphasis 为 false 时，hover 时展示 label，正常不展示 label
     */
    static getPointDefaultOption<P extends BaseMapPoint>(point: P): AnyObj;
    /**
     * @description: 切换标签显示状态
     * @param point 点配置
     * @param showLabelNotEmphasis 是否在非强调状态下显示标签
     */
    private static toggleLabelShow;
    /**
     * @description: 计算数量后缀
     * @param count 数量
     * @returns 格式化后的后缀
     */
    private static countSuffix;
    /**
     * @description: 处理点数据，转换为 echarts 配置
     * @param pointItem 点数据
     * @param config 适配器参数
     * @returns 处理后的点配置
     */
    static processPoint: <P extends BaseMapPoint>(pointItem: P, config: AdapterParams) => PointSeriesDataItem<P>;
    /**
     * @description: 字符串哈希函数，生成0到1之间的数值
     * 用确定性的方法替代 Math.random()
     * @param str 输入字符串
     * @returns 0到1之间的数值
     */
    private static hashString;
    /**
     * @description: 计算线条曲率
     * 主要是根据连线的 id 计算两点之后连线的曲率
     * @param key 线条的唯一标识
     * @param min 最小曲率值
     * @param max 最大曲率值
     * @returns 计算出的曲率值
     */
    private static curvature;
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
    private static calculateCurvatureRange;
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
    static getLineDefaultOption<L extends BaseMapLine>(lineItem: L & BaseMapLine, config?: {
        curvatureMin: number;
        curvatureMax: number;
    }): {
        coords: _orch_map_types.Coordinate[];
        lineStyle: {
            color: string;
            width: number;
            opacity: number;
            curveness: number;
        };
    };
    /**
     * @description: 获取线条逆向连线的 series 配置
     * 将连线起终点对调，创建反向连线配置
     *
     * @param originLineSeries 原始线条系列配置
     * @returns 逆向连线的系列配置
     */
    static getBuddyLineSeries: (originLineSeries: LinesSeriesOption) => LinesSeriesOption;
    /**
     * @description: 处理线条数据，转换为 echarts 配置
     * @param lineItem 线条数据
     * @param config 曲率配置参数（可选）
     * @returns 处理后的线条配置
     */
    static processLine: <L extends BaseMapLine>(lineItem: L, config?: {
        curvatureMin: number;
        curvatureMax: number;
    }) => {
        coords: _orch_map_types.Coordinate[];
        lineStyle: {
            color: string;
            width: number;
            opacity: number;
            curveness: number;
        };
    };
}

export { type AdapterParams, type AdapterPointInfo, EChartsGeoUtils, MapRendererType, OrchMap as default };
