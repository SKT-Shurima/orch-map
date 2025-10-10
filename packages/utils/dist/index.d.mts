import { Coordinate, GeoJsonFeature, HcTransform, FeatureCollection, Feature, GeoJsonGeometry } from '@orch-map/types';
export { omit, pick } from 'lodash';

/**
 * 坐标计算工具函数
 */

/**
 * 坐标工具类
 */
declare class CoordinateUtils {
    /**
     * 计算两点之间的距离（米）
     */
    static getDistance(coord1: Coordinate, coord2: Coordinate): number;
    /**
     * 计算两点之间的方位角（度）
     */
    static getBearing(coord1: Coordinate, coord2: Coordinate): number;
    /**
     * 计算中点坐标
     */
    static getMidpoint(coord1: Coordinate, coord2: Coordinate): Coordinate;
    /**
     * 计算边界框
     */
    static getBounds(coordinates: Coordinate[]): [Coordinate, Coordinate];
    /**
     * 计算边界框中心点
     */
    static getBoundsCenter(bounds: [Coordinate, Coordinate]): Coordinate;
    /**
     * 根据边界框计算合适的缩放级别
     */
    static getZoomFromBounds(bounds: [Coordinate, Coordinate], _containerSize: {
        width: number;
        height: number;
    }): number;
    /**
     * 生成二次贝塞尔曲线路径点
     */
    static generateBezierPath(start: Coordinate, end: Coordinate, curvature?: number, segments?: number): Coordinate[];
    /**
     * 计算曲率值（基于距离和角度）
     */
    static calculateCurvature(start: Coordinate, end: Coordinate): number;
}
/**
 * 曲率计算器类
 */
declare class CurvatureCalculator {
    private curvatureCache;
    /**
     * 根据坐标计算曲率
     */
    calculateCurvatureByCoordinates(id: string, start: Coordinate, end: Coordinate): number;
    /**
     * 清除缓存
     */
    clearCache(): void;
}

/**
 * 动画相关类型定义
 */
interface BaseAnimationConfig {
    enabled: boolean;
    duration: number;
    easing: string;
    delay?: number;
    type?: "fadeIn" | "slideIn" | "zoomIn" | "bounce";
}
interface AnimationConfig extends BaseAnimationConfig {
    from: number;
    to: number;
    onUpdate: (progress: number, value: number) => void;
    onComplete?: () => void;
    loop?: boolean;
}

/**
 * 动画工具函数
 */

/**
 * 缓动函数
 */
declare const easing: {
    linear: (t: number) => number;
    easeInQuad: (t: number) => number;
    easeOutQuad: (t: number) => number;
    easeInOutQuad: (t: number) => number;
    easeInCubic: (t: number) => number;
    easeOutCubic: (t: number) => number;
    easeInOutCubic: (t: number) => number;
};
/**
 * 动画管理器类
 */
declare class AnimationManager {
    private animations;
    private rafId;
    /**
     * 创建动画
     */
    create(id: string, config: AnimationConfig): void;
    /**
     * 停止动画
     */
    stop(id: string): void;
    /**
     * 停止所有动画
     */
    stopAll(): void;
    /**
     * 开始动画循环
     */
    private start;
}
/**
 * 动画类
 */
declare class Animation {
    private startTime;
    private config;
    constructor(config: AnimationConfig);
    /**
     * 更新动画
     */
    update(currentTime: number): boolean;
}
/**
 * 全局动画管理器实例
 */
declare const animationManager: AnimationManager;

/**
 * 判断值是否已定义
 */
declare function isDef<T>(value: T | undefined | null): value is T;
/**
 * 判断数组是否为空
 */
declare function isEmptyArray<T>(arr: T[] | undefined | null): arr is [] | undefined | null;
/**
 * 判断值是否未定义
 */
declare function isUndef(value: unknown): value is undefined | null;
/**
 * 深拷贝对象
 */
declare function deepClone<T>(obj: T): T;
/**
 * 防抖函数
 */
declare function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * 节流函数
 */
declare function throttle<T extends (...args: unknown[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * 生成唯一ID
 */
declare function generateId(prefix?: string): string;
/**
 * 颜色工具函数
 */
declare const colorUtils: {
    /**
     * 将十六进制颜色转换为 RGBA 数组
     */
    hexToRgba(hex: string, alpha?: number): [number, number, number, number];
    /**
     * 将 RGBA 数组转换为十六进制颜色
     */
    rgbaToHex(rgba: [number, number, number, number]): string;
    /**
     * 插值两个颜色
     */
    interpolateColor(color1: [number, number, number, number], color2: [number, number, number, number], t: number): [number, number, number, number];
};
/**
 * 根据 value 中的某个字符串查找第一个匹配的 key
 * @param obj 包含字符串数组作为值的对象
 * @param searchValue 要查找的字符串值
 * @returns 找到的第一个包含该值的键，如果没找到则返回 undefined
 */
declare function findFirstKeyByValue<T extends Record<string, string[]>>(obj: T, searchValue: string): string | undefined;

/**
 * 任务管理工具
 */
interface TimerTask {
    destroy(): void;
}
interface TaskOptions {
    description: string;
    time: number;
    once: boolean;
    fn: () => void;
}
/**
 * 任务管理器类
 */
declare class TaskManager {
    static Timer: {
        new (options: TaskOptions): {
            timerId: NodeJS.Timeout | number | null;
            options: TaskOptions;
            start: () => void;
            stop: () => void;
            destroy(): void;
        };
    };
}

/**
 * GeoJSON 工具函数
 */

/**
 * GeoJSON 工具类
 */
declare class GeoJsonUtils {
    /**
     * 检查点是否在多边形内（使用射线算法）
     * @param point 坐标点 [x, y]
     * @param polygon 多边形坐标数组
     * @returns 如果点在多边形内返回 true，否则返回 false
     */
    static isPointInPolygon(point: Coordinate, polygon: number[][]): boolean;
    /**
   * 检查点是否在 GeoJSON 特征内
   * @param point 坐标点 [x, y]
   * @param feature GeoJSON 特征
   * @returns 如果点在特征内返回 true，否则返回 false
   */
    static isPointInFeature(point: Coordinate, feature: GeoJsonFeature): boolean;
    /**
     * 将经纬度转换为投影坐标
     * @param transform 坐标转换对象
     * @param lngLat 经纬度坐标 [经度, 纬度]
     * @returns 投影后的坐标 [x, y]
     */
    static lngLatToProjected(transform: HcTransform, lngLat: Coordinate): Coordinate;
    /**
     * 将投影坐标转换回经纬度
     * @param transform 坐标转换对象
     * @param projected 投影坐标 [x, y]
     * @returns 经纬度坐标 [经度, 纬度]
     */
    static projectedToLngLat(transform: HcTransform, projected: Coordinate): Coordinate;
    /**
     * 计算多边形的中心点
     * @param coordinates 多边形坐标数组
     * @returns 中心点坐标 [x, y]
     */
    static getPolygonCenter(coordinates: number[][][]): Coordinate;
    /**
     * 计算 GeoJSON 特征的中心点
     * @param feature GeoJSON 特征
     * @returns 中心点坐标 [x, y]
     */
    static getFeatureCenter(feature: GeoJsonFeature): Coordinate;
    /**
     * 计算线或点集的质心
     * @param coordinates 坐标数组
     * @returns 质心坐标 [x, y]
     */
    static getLineCentroid(coordinates: Coordinate[]): Coordinate;
    /**
     * 计算 GeoJSON 特征的边界框
     * @param feature GeoJSON 特征
     * @returns 边界框坐标 [[minX, minY], [maxX, maxY]]
     */
    static getBounds(feature: GeoJsonFeature): [Coordinate, Coordinate];
    /**
     * 计算 GeoJSON FeatureCollection 的边界框
     * @param featureCollection GeoJSON FeatureCollection
     * @returns 边界框坐标 [[minX, minY], [maxX, maxY]]
     */
    static getFeatureCollectionBounds(featureCollection: FeatureCollection): [Coordinate, Coordinate];
    /**
     * 创建空的 GeoJSON FeatureCollection
     * @param features GeoJSON 特征数组
     * @returns GeoJSON FeatureCollection
     */
    static createFeatureCollection(features?: Feature[]): FeatureCollection;
    /**
     * 创建 GeoJSON Point 特征
     * @param coordinate 点坐标 [x, y]
     * @param properties 特征属性
     * @returns GeoJSON Point 特征
     */
    static createPointFeature(coordinate: Coordinate, properties?: Record<string, unknown>): GeoJsonFeature;
    /**
     * 创建 GeoJSON LineString 特征
     * @param coordinates 线坐标数组
     * @param properties 特征属性
     * @returns GeoJSON LineString 特征
     */
    static createLineFeature(coordinates: Coordinate[], properties?: Record<string, unknown>): GeoJsonFeature;
    /**
     * 创建 GeoJSON Polygon 特征
     * @param coordinates 多边形坐标数组
     * @param properties 特征属性
     * @returns GeoJSON Polygon 特征
     */
    static createPolygonFeature(coordinates: Coordinate[][], properties?: Record<string, unknown>): GeoJsonFeature;
    /**
     * 计算两点之间的距离
     * @param point1 点1坐标 [x, y]
     * @param point2 点2坐标 [x, y]
     * @returns 欧几里得距离
     */
    static distance(point1: Coordinate, point2: Coordinate): number;
    /**
     * 计算线段的长度
     * @param line 线段坐标数组
     * @returns 线段长度
     */
    static lineLength(line: Coordinate[]): number;
    /**
     * 计算多边形的面积
     * @param polygon 多边形坐标数组
     * @returns 多边形面积
     */
    static polygonArea(polygon: Coordinate[]): number;
    /**
     * 简化 GeoJSON 几何体 (按采样间隔简化)
     * @param geometry GeoJSON 几何体
     * @param tolerance 简化容差
     * @returns 简化后的几何体
     */
    static simplifyGeometry(geometry: GeoJsonGeometry, tolerance: number): GeoJsonGeometry;
    /**
     * 简化 GeoJSON 特征
     * @param feature GeoJSON 特征
     * @param tolerance 简化容差
     * @returns 简化后的特征
     */
    static simplifyFeature(feature: GeoJsonFeature, tolerance: number): GeoJsonFeature;
    /**
     * 合并多个 GeoJSON FeatureCollection
     * @param collections GeoJSON FeatureCollection 数组
     * @returns 合并后的 FeatureCollection
     */
    static mergeFeatureCollections(...collections: FeatureCollection[]): FeatureCollection;
    /**
     * 将 GeoJSON 特征转换为 WKT (Well-Known Text) 格式
     * @param feature GeoJSON 特征
     * @returns WKT 字符串
     */
    static featureToWKT(feature: GeoJsonFeature): string;
}

/**
 * 将 SVG 转换为 ECharts symbol 格式
 * @param {string|Element} svg - SVG 字符串或 DOM 元素
 * @param {Object} options - 配置选项
 * @param {boolean} options.preferPath - 是否优先使用路径方式 (默认: true)
 * @param {boolean} options.normalize - 是否规范化路径数据 (默认: false)
 * @return {string} ECharts 可用的 symbol 格式
 */
declare function svgToEChartsSymbol(svg: string | Element, options?: {
    preferPath?: boolean;
    normalize?: boolean;
}): string;
/**
 * 将 SVG 字符串转换为 Base64 格式
 * @param {string} svgString - SVG 字符串
 * @return {string} Base64 格式的 SVG
 */
declare function svgToBase64Symbol(svgString: string): string;

export { Animation, AnimationManager, CoordinateUtils, CurvatureCalculator, GeoJsonUtils, TaskManager, type TaskOptions, type TimerTask, animationManager, colorUtils, debounce, deepClone, easing, findFirstKeyByValue, generateId, isDef, isEmptyArray, isUndef, svgToBase64Symbol, svgToEChartsSymbol, throttle };
