import { Coordinate, GeoJsonFeature, HcTransform } from '@orch-map/types';
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
    static getZoomFromBounds(bounds: [Coordinate, Coordinate], containerSize: {
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
    type?: 'fadeIn' | 'slideIn' | 'zoomIn' | 'bounce';
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
declare function isUndef(value: any): value is undefined | null;
/**
 * 深拷贝对象
 */
declare function deepClone<T>(obj: T): T;
/**
 * 防抖函数
 */
declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * 节流函数
 */
declare function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
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
            #timerId: NodeJS.Timeout | number | null;
            #options: TaskOptions;
            #start(): void;
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
     */
    static isPointInPolygon(point: Coordinate, polygon: number[][]): boolean;
    /**
     * 检查点是否在 GeoJSON 特征内
     */
    static isPointInFeature(point: Coordinate, feature: GeoJsonFeature): boolean;
    /**
     * 将经纬度转换为投影坐标
     */
    static lngLatToProjected(transform: HcTransform, lngLat: Coordinate): Coordinate;
    /**
     * 计算多边形的中心点
     */
    static getPolygonCenter(coordinates: number[][][]): Coordinate;
    /**
     * 计算 GeoJSON 特征的边界框
     */
    static getBounds(feature: GeoJsonFeature): [Coordinate, Coordinate];
    /**
     * 创建空的 GeoJSON FeatureCollection
     */
    static createFeatureCollection(features?: GeoJsonFeature[]): {
        type: "FeatureCollection";
        features: GeoJsonFeature[];
    };
    /**
     * 创建 GeoJSON Point 特征
     */
    static createPointFeature(coordinate: Coordinate, properties?: Record<string, any>): GeoJsonFeature;
    /**
     * 创建 GeoJSON LineString 特征
     */
    static createLineFeature(coordinates: Coordinate[], properties?: Record<string, any>): GeoJsonFeature;
}

export { Animation, AnimationManager, CoordinateUtils, CurvatureCalculator, GeoJsonUtils, TaskManager, type TaskOptions, type TimerTask, animationManager, colorUtils, debounce, deepClone, easing, generateId, isDef, isEmptyArray, isUndef, throttle };
