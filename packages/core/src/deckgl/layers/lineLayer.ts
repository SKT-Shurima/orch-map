/**
 * 模块：线图层管理器
 * 说明：统一管理 2D/3D 线图层的创建、更新和动画逻辑
 * 设计要点：
 * - 提供静态方法，避免实例化；
 * - 封装 2D/3D 线图层的构建与动画更新；
 * - 集中管理时间进度、尾迹长度等动画参数。
 */
import { type BaseMapLine } from "@orch-map/types";
import { LineRenderer2D } from "./lines/line2d";
import { LineRenderer3D } from "./lines/line3d";

/**
 * 图层更新回调函数类型
 */
export type LayerUpdateCallback = (layerId: string, layer: any) => void;
export type LayerRemoveCallback = (layerId: string) => void;

/**
 * 线图层动画配置
 */
export interface LineAnimationConfig {
  /** 每 tick 前进的"秒数"（逻辑时间） */
  animationSpeed?: number;
  /** 可见尾迹长度（逻辑时间） */
  trailLength?: number;
  /** 时间循环区间（逻辑时间），默认 6 小时 */
  timeLoop?: number;
  /** 3D 模式下每条线的起始偏移（秒） */
  lineOffset?: number;
  /** 3D 模式下每条线的持续时长（秒） */
  lineDuration?: number;
}

/**
 * 线图层管理器（静态工具类）
 */
export class LineLayer {
  /** 当前动画时间（单位：秒的逻辑刻度） */
  private static currentTime = 0;

  /** 默认动画配置 */
  private static readonly DEFAULT_CONFIG: Required<LineAnimationConfig> = {
    animationSpeed: 60,
    trailLength: 60 * 60,
    timeLoop: 6 * 60 * 60,
    lineOffset: 300,
    lineDuration: 1000,
  };

  /**
   * 获取当前动画时间
   */
  public static getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * 设置当前动画时间
   */
  public static setCurrentTime(time: number): void {
    this.currentTime = time;
  }

  /**
   * 重置动画时间
   */
  public static resetTime(): void {
    this.currentTime = 0;
  }

  /**
   * 更新 2D 线图层（常驻曲线 + 移动尾迹）
   * @param lines 线数据数组
   * @param config 动画配置
   * @param updateCallback 图层更新回调函数
   */
  public static update2DLayers(
    lines: BaseMapLine[],
    config: LineAnimationConfig = {},
    updateCallback: LayerUpdateCallback,
  ): void {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };

    // 构建常驻曲线图层
    const baseLayer = LineRenderer2D.buildFullCurveLayer(lines);
    updateCallback("line-layer", baseLayer);

    // 计算当前进度并构建移动尾迹图层
    const progress = this.currentTime / mergedConfig.timeLoop;
    const dotsLayer = LineRenderer2D.buildMovingDotsLayer(lines, progress);
    updateCallback("line-trail-layer", dotsLayer);
  }

  /**
   * 更新 3D 线图层（动画弧线）
   * @param lines 线数据数组
   * @param config 动画配置
   * @param updateCallback 图层更新回调函数
   */
  public static update3DLayers(
    lines: BaseMapLine[],
    config: LineAnimationConfig = {},
    updateCallback: LayerUpdateCallback,
  ): void {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };

    // 计算当前时间窗口
    const startTime = Math.max(0, this.currentTime - mergedConfig.trailLength);
    const timeRange: [number, number] = [startTime, this.currentTime];

    // 构建 3D 弧线图层
    const animatedLayer = LineRenderer3D.buildAnimatedLayer(
      lines,
      timeRange,
      mergedConfig.lineOffset,
      mergedConfig.lineDuration,
    );
    updateCallback("line-layer", animatedLayer);
  }

  /**
   * 根据模式更新线图层
   * @param mode 渲染模式（2D 或 3D）
   * @param lines 线数据数组
   * @param config 动画配置
   * @param updateCallback 图层更新回调函数
   */
  public static updateLayers(
    mode: "2d" | "3d",
    lines: BaseMapLine[],
    config: LineAnimationConfig = {},
    updateCallback: LayerUpdateCallback,
  ): void {
    if (mode === "3d") {
      LineLayer.update3DLayers(lines, config, updateCallback);
    } else {
      LineLayer.update2DLayers(lines, config, updateCallback);
    }
  }

  /**
   * 推进动画时间并更新图层
   * @param mode 渲染模式（2D 或 3D）
   * @param lines 线数据数组
   * @param config 动画配置
   * @param updateCallback 图层更新回调函数
   */
  public static advanceAnimation(
    mode: "2d" | "3d",
    lines: BaseMapLine[],
    config: LineAnimationConfig = {},
    updateCallback: LayerUpdateCallback,
  ): void {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };

    // 推进时间
    LineLayer.currentTime = (LineLayer.currentTime + mergedConfig.animationSpeed) % mergedConfig.timeLoop;

    // 更新图层
    LineLayer.updateLayers(mode, lines, config, updateCallback);
  }

  /**
   * 清理所有线图层
   * @param removeCallback 图层移除回调函数
   */
  public static clearLayers(removeCallback: LayerRemoveCallback): void {
    removeCallback("line-layer");
    removeCallback("line-trail-layer");
  }
}

