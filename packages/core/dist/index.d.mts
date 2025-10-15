import { GeoJSONSourceInput, BaseMapPoint, BaseMapLine, MapLevel, MapRendererType as MapRendererType$1, AnyObj, FeatureCollection, GeoJSON as GeoJSON$1 } from '@orch-map/types';
import { GeoJSON } from 'geojson';
import { LinesSeriesOption } from 'echarts';
import * as echarts from 'echarts/core';

/**
 * 地图渲染器事件接口
 */
interface MapRendererEvents {
    /** 点击点事件 */
    onPointClick?: (point: string) => void;
    /** 悬停点事件 */
    onPointHover?: (point: string | null) => void;
    /** 悬停区域事件 */
    onAreaHover?: (region: string) => void;
    /** 双击区域事件 */
    onAreaDoubleClick?: (region: string) => void;
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
    postcode?: string;
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
    setPoints(points: BaseMapPoint[]): Promise<void> | void;
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
 * DeckGL 地图主类
 * 说明：负责 DeckGL 实例的管理、图层管理与业务图层（Geo、点、弧线）装配与更新
 */
declare class DeckglMap {
    /** 默认视图状态 */
    private static readonly DEFAULT_VIEW_STATE;
    /** 实例唯一标识 */
    private instanceId;
    /** DeckGL 实例 */
    private deckInstance;
    /** 图层存储：layerId -> layer 实例 */
    private layerMap;
    /** 折线数据源 */
    private lines;
    /** 点数据源 */
    private points;
    /** 选中点 ID */
    private selectedPointId;
    /** 当前悬停的点 ID */
    private hoveredPointId;
    /** 2D/3D 模式 */
    private mode;
    /** 动画计时器任务句柄 */
    private animationTimer;
    /**
     * 构造函数
     * @param container - 容器元素
     * @param mode - 地图模式（2D/3D）
     * @param callback - 初始化完成回调函数
     */
    constructor(container: HTMLCanvasElement, mode: "2d" | "3d", callback: () => void);
    /**
     * 初始化地图
     * @param container - 容器元素
     * @param callback - 初始化完成回调函数
     */
    private initializeMap;
    /**
     * 初始化 Deck 实例与图标图集
     * @param canvas - Canvas 元素
     * @param callback - 初始化完成回调函数
     */
    private initDeck;
    /**
     * 初始化默认图层
     */
    private initializeDefaultLayers;
    /**
     * 销毁内部资源
     */
    destroy(): void;
    /**
     * 创建 Canvas 元素
     * @param container - 容器元素
     * @returns Canvas 元素
     */
    private createCanvas;
    /**
     * 创建并初始化 Deck 实例
     * @param container - Canvas 容器
     * @param initialViewState - 初始视图状态
     * @param props - 附加属性
     */
    private createDeckInstance;
    /**
     * 获取当前 Deck 实例
     * @returns 当前的 Deck 实例
     * @throws 如果实例未初始化则抛出错误
     */
    private get currentDeckInstance();
    /**
     * 新增图层（若已存在则委托为 update）
     * @param id - 图层 ID
     * @param layer - 图层实例
     */
    private addLayer;
    /**
     * 更新图层
     * @param id - 图层 ID
     * @param layerOrProps - 图层实例或图层属性
     */
    private updateLayerById;
    /**
     * 移除图层
     * @param id - 图层 ID
     */
    private removeLayer;
    /**
     * 以固定顺序返回所有图层实例
     * @returns 图层数组
     */
    private getLayers;
    /**
     * 将当前图层刷新到 Deck 实例
     */
    private updateLayer;
    /**
     * 地图空白处点击处理（取消点选中）
     * @param info - 点击信息
     * @param _event - 事件对象
     */
    private handleClickMapView;
    /**
     * 点对象点击处理
     * @param info - 点击信息
     */
    private handleClickPoint;
    /**
     * 点对象悬停处理
     * @param info - 悬停信息
     */
    private handleHoverPoint;
    /**
     * 设置国家/省份 GeoJSON 数据并注册基础底图图层
     * @param geojsonData - GeoJSON 数据
     */
    setGEOData(geojsonData: GeoJSON): Promise<void>;
    /**
     * 设置点数据
     * @param points - 点数据数组
     */
    setPoints(points: BaseMapPoint[]): Promise<void>;
    /**
     * 设置折线数据
     * @param lines - 折线数据数组
     */
    setLines(lines: BaseMapLine[]): void;
    /**
     * 更新图标和文本图层
     */
    private updateIconLayers;
    /**
     * 启动动画定时器
     */
    private startArcAnimation;
    /**
     * 更新动画
     */
    private updateArcAnimation;
}

/**
 * Series 中的点的基本信息
 * 用于渲染数据列的时候，每个点所必备的信息
 * @template T - 点数据的业务信息类型
 */
interface PointSeriesDataItem<T = unknown> {
    /** 点的唯一标识 */
    id: string;
    /** 点的名称 */
    name: string;
    /** 点的坐标值 [经度, 纬度] */
    value: [number, number];
    /** 业务信息 */
    businessInfo?: T;
    /** 图表信息 */
    graphInfo?: AnyObj;
    /** 点的符号类型 */
    symbol?: string;
    /** 点的符号大小 */
    symbolSize?: number | [number, number];
    /** 点的样式配置 */
    itemStyle?: AnyObj;
    /** 点的标签配置 */
    label?: AnyObj;
    /** 点的提示框配置 */
    tooltip?: AnyObj;
    /** 符号旋转角度 */
    symbolRotate?: number;
    /** 点的层级 */
    z?: number;
    /** 数据编码配置 */
    encode?: AnyObj;
    /** 强调样式 */
    emphasis?: AnyObj;
}

/**
 * 地理事件参数接口
 */
interface GEOParam {
    /** 区域名称 */
    name: string;
    /** 组件类型 */
    componentType: "geo";
    /** 事件对象 */
    event: {
        event: AnyObj;
    };
    /** 地理组件索引 */
    geoIndex: number;
    /**
     * 区域信息
     *
     * 这里的 region 扒了一下 eCharts 4.5 的源码，发现在地图上点击的时候，会有一个 region 的信息
     * 但是 region 里面只有一个 name 信息，这样的话，我们没法从 region 里面获取到 postcode 的信息
     * 然而在使用的过程中，我们要 postcode 的，因为只有 postcode 才能拿到对应的详细地图信息
     * 所以我们这里追加一个 postcode 的信息，然后在使用的时候，在geoChart中对 GEOParam 进行处理 让其返回的时候带上 postcode
     * 这样对于使用的地方就可以直接获取到 postcode 信息了
     * 注意这个 postcode 不一定是省市区的 postcode，可能是国家的简称
     */
    region: {
        /** 区域名称 */
        name: string;
        /** 行政区划代码或国家简称 */
        postcode?: string;
    };
}

/**
 * ECharts 地图事件接口
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
    /** 边界数据加载状态 */
    private boundaryLoading;
    /** 地图渲染器配置 */
    private config;
    /** 状态管理器取消订阅函数 */
    private unsubscribeState;
    /**
     * 构造函数
     * @param container - 地图容器，可以是 DOM 元素或元素 ID 字符串
     * @param options - 地图配置选项，支持 EchartsMapOptions 或 MapRendererConfig 格式
     * @throws {Error} 当通过 ID 查找容器元素失败时抛出错误
     */
    constructor(container: HTMLElement | string, options: EchartsMapOptions | MapRendererConfig, geoJson: GeoJSON$1);
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
     * 设置 ECharts 图表配置选项
     * @param option - ECharts 配置选项
     * @private
     */
    private setChartOption;
    private updateGeoOption;
    /**
     * 设置地理数据并更新地图显示
     * @param boundary - 边界地理数据
     * @public
     */
    setGEOData(boundary: GeoJSON$1): void;
    /**
     * 双击事件处理器（用于地图层级切换）
     * @param params - 事件参数，包含组件类型和区域信息
     * @private
     */
    private dbClickHandler;
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
     * # 更新地图上的点位
     * 该方法会移除旧的点位系列，然后添加新的点位系列
     * @param points 点位数组
     */
    setPoints(points: BaseMapPoint[]): void;
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
    private get mapType();
    /**
     * 构造函数
     * @param {MapRendererConfig} config - 地图渲染器配置
     * @param {Record<string, string>} extraSvgIcons - 额外的 SVG 图标（原始 SVG 字符串）
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
    setPoints(points: BaseMapPoint[]): void;
    /**
     * 设置地图线条数据
     * @param {BaseMapLine[]} lines - 线条数据数组
     */
    setLines(lines: BaseMapLine[]): void;
    /**
     * @description: 计算中国地图的行政区划代码
     */
    private calculateChinaPostcode;
    private entryNextLevel;
    private getGeoData;
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
 * 连线图组件静态工具类
 * 提供连线图相关的工具方法和配置
 */
declare class LinesComponent {
    /**
     * 默认连线图系列配置
     */
    static defaultLinesSeries: LinesSeriesOption;
    /**
     * 曲率计算器实例
     */
    private static curvatureCalculator;
    /**
     * 将线数据转换为 ECharts Series
     * @param lines - 线数据数组
     * @returns ECharts 系列配置数组
     */
    private static convertLinesToSeries;
    /**
     * 设置连线图数据到图表
     * @param chartInstance - ECharts 实例
     * @param lines - 线数据数组
     */
    static setLines(chartInstance: echarts.ECharts, lines: BaseMapLine[]): void;
    private static curvatureMap;
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
    private static getLineDefaultOption;
    /**
     * @description: 获取线条逆向连线的 series 配置
     * 将连线起终点对调，创建反向连线配置
     *
     * @param originLineSeries 原始线条系列配置
     * @returns 逆向连线的系列配置
     */
    private static getBuddyLineSeries;
}

export { LinesComponent as EChartsGeoUtils, MapRendererType, OrchMap as default };
