/**
 * 模块：3D 线图层管理器
 * 说明：负责 3D 模式下的弧线动画渲染和图层管理，采用双层结构：
 * - 基础弧线层：显示完整的弧线路径（使用 line 颜色，透明度 0.3）
 * - 尾迹层：显示动态的尾迹效果（使用 line 颜色，透明度 1）
 * 特性：支持 buddy 双向连线，为每条线生成镜像线（起终点互换），实现双向流动效果。
 * - 动态高度调整：根据经纬度距离自动调整弧线高度，距离越远高度越高
 * - 完全独立的 3D 模式管理逻辑，包含时间管理和配置
 *
 * 设计参考：
 * - 参考 arc-trips-layer 示例实现
 * - 按照 line2d.ts 的结构进行编排
 * - 使用 ArcTripsLayer 进行 3D 弧线渲染
 */
import type { BaseMapLine } from "@orch-map/types";
import { ArcTripsLayer } from "@deck.gl/layers";

// 默认弧线颜色配置（回退）
const _DEFAULT_ARC_RGBA: [number, number, number, number] = [200, 200, 200, 150];
// 默认尾迹颜色（回退）
const _DEFAULT_TRAIL_RGBA: [number, number, number, number] = [255, 0, 0, 255];

/**
 * 计算两个经纬度点之间的距离（使用 Haversine 公式）
 * @param lat1 起点纬度
 * @param lng1 起点经度
 * @param lat2 终点纬度
 * @param lng2 终点经度
 * @returns 距离（公里）
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 根据距离动态计算弧线高度
 * @param distance 距离（公里）
 * @param baseHeight 基础高度
 * @returns 调整后的高度
 */
function calculateDynamicHeight(distance: number, _baseHeight: number): number {
  // 距离范围：0-2000公里
  // 高度范围：短距离 1.5-3.0，长距离 < 0.01
  const shortDistanceHeight = 3.0; // 短距离高度
  const longDistanceHeight = 0.005; // 长距离高度（接近0）
  const maxDistance = 10000; // 最大距离（公里）

  // 使用反比例函数：距离越远，高度越低
  const normalizedDistance = Math.min(distance / maxDistance, 1);
  // 使用反比例函数，让短距离高度高，长距离高度低
  const height = shortDistanceHeight - (shortDistanceHeight - longDistanceHeight) * normalizedDistance;


  return height;
}

/**
 * 3D 弧线数据项类型定义
 */
export interface ArcDataItem {
  /** 唯一标识符 */
  id: string;
  /** 起点坐标 [lng, lat, alt] */
  sourcePosition: [number, number, number];
  /** 终点坐标 [lng, lat, alt] */
  targetPosition: [number, number, number];
  /** 起点颜色 RGB */
  sourceColor: [number, number, number];
  /** 终点颜色 RGB */
  targetColor: [number, number, number];
  /** 弧线宽度 */
  width: number;
  /** 弧线高度 */
  height: number;
}

/**
 * ArcTripsLayer 数据项类型定义（包含时间戳）
 */
export interface ArcTripsDataItem extends ArcDataItem {
  /** 起点时间戳 */
  sourceTimestamp: number;
  /** 终点时间戳 */
  targetTimestamp: number;
}


// Generate flight routes with timestamps for ArcTripsLayer
function generateFlightRoutes(lines: BaseMapLine[], currentTime: number, config: Line3DAnimationConfig = {}) {
  const defaultConfig: Required<Line3DAnimationConfig> = {
    animationSpeed: 1.0,
    trailLength: 100,
    timeLoop: 6 * 60 * 60,
    lineOffset: 50,
    lineDuration: 200,
    fadeTrail: true,
    showFullArc: false,
    dotSize: 0.01,
    dotTrailLength: 0.1,
    width: 1.8,
    height: 2.8,
    pickable: true,
    autoHighlight: true,
    onClick: (info: { object?: unknown; layer?: unknown; coordinate?: [number, number] }) => {
      if (info.object) {
        // eslint-disable-next-line no-console
        console.log("Arc clicked:", info.object);
      }
    },
    enableBidirectional: true,
    baseArcColor: [255, 255, 0, 150], // 黄色基础弧线，低透明度
    trailColor: [255, 0, 0, 255], // 红色尾迹
  };
  const mergedConfig = { ...defaultConfig, ...config };

  const routes: ArcTripsDataItem[] = [];

  lines.forEach((line, index) => {
    // Calculate staggered timing for each line to create wave effect
    const lineOffset = mergedConfig.lineOffset || 50;
    const lineDuration = mergedConfig.lineDuration || 200;
    const baseTime = (index % 20) * lineOffset; // Group lines into batches of 20
    const travelTime = lineDuration + Math.random() * 100;

    // Extract color from line data or use default
    const lineColor: [number, number, number] = Array.isArray(line.color)
      ? (line.color.slice(0, 3) as [number, number, number])
      : [200, 200, 200];

    // Calculate distance between start and end coordinates
    const distance = calculateDistance(
      line.startCoordinate[1], // lat1
      line.startCoordinate[0], // lng1
      line.endCoordinate[1], // lat2
      line.endCoordinate[0], // lng2
    );

    // Calculate dynamic height based on distance
    const dynamicHeight = calculateDynamicHeight(distance, mergedConfig.height);

    // Original direction (start -> end)
    const sourcePos = [
      line.startCoordinate[0],
      line.startCoordinate[1],
      0,
    ] as [number, number, number];
    const targetPos = [
      line.endCoordinate[0],
      line.endCoordinate[1],
      0,
    ] as [number, number, number];

    routes.push({
      id: line.id,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
      sourceTimestamp: baseTime,
      targetTimestamp: baseTime + travelTime,
      sourceColor: lineColor,
      targetColor: lineColor,
      width: line.width ?? mergedConfig.width,
      height: dynamicHeight,
    });

    // Bidirectional support: add reverse direction (end -> start) if enabled
    if (mergedConfig.enableBidirectional) {
      const reverseSourcePos = [
        line.endCoordinate[0],
        line.endCoordinate[1],
        0,
      ] as [number, number, number];
      const reverseTargetPos = [
        line.startCoordinate[0],
        line.startCoordinate[1],
        0,
      ] as [number, number, number];

      routes.push({
        id: `${line.id}-buddy`,
        sourcePosition: reverseSourcePos,
        targetPosition: reverseTargetPos,
        sourceTimestamp: baseTime + travelTime / 2, // Offset to create alternating flow
        targetTimestamp: baseTime + travelTime + travelTime / 2,
        sourceColor: lineColor,
        targetColor: lineColor,
        width: line.width ?? mergedConfig.width,
        height: dynamicHeight,
      });
    }
  });

  return routes;
}

/**
 * 3D 线图层动画配置
 */
export interface Line3DAnimationConfig {
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
  /** 是否渐变尾迹 */
  fadeTrail?: boolean;
  /** 是否显示完整弧线 */
  showFullArc?: boolean;
  /** 点大小 */
  dotSize?: number;
  /** 点尾迹长度 */
  dotTrailLength?: number;
  /** 弧线宽度 */
  width?: number;
  /** 弧线高度 */
  height?: number;
  /** 是否可交互 */
  pickable?: boolean;
  /** 是否自动高亮 */
  autoHighlight?: boolean;
  /** 点击回调 */
  onClick?: (info: { object?: unknown; layer?: unknown; coordinate?: [number, number] }) => void;
  /** 是否启用双向流线 */
  enableBidirectional?: boolean;
  /** 基础弧线颜色 */
  baseArcColor?: [number, number, number, number];
  /** 尾迹颜色 */
  trailColor?: [number, number, number, number];
}


/**
 * 3D 线图层管理器（静态工具类）
 * 包含渲染器和管理器的所有功能
 */
export class Line3DManager {
  /** 默认动画配置 */
  private static readonly DEFAULT_CONFIG: Required<Line3DAnimationConfig> = {
    animationSpeed: 1.0,
    trailLength: 100,
    timeLoop: 6 * 60 * 60,
    lineOffset: 50,
    lineDuration: 200,
    fadeTrail: true,
    showFullArc: false,
    dotSize: 0.01,
    dotTrailLength: 0.1,
    width: 1.2,
    height: 0.6,
    pickable: true,
    autoHighlight: true,
    onClick: (info: { object?: unknown; layer?: unknown; coordinate?: [number, number] }) => {
      if (info.object) {
        // eslint-disable-next-line no-console
        console.log("Arc clicked:", info.object);
      }
    },
    enableBidirectional: true,
    baseArcColor: [255, 255, 0, 150], // 黄色基础弧线，低透明度
    trailColor: [255, 0, 0, 255], // 红色尾迹
  };

  // ==================== 渲染器方法 ====================

  // ==================== 管理器方法 ====================

  /**
   * 构造 3D 线图层（基础弧线 + 尾迹弧线）
   * @param lines 线数据数组
   * @param config 动画配置
   * @param currentTime 当前动画时间（可选，默认从外部获取）
   * @returns 图层数组，包含基础弧线图层和尾迹弧线图层
   */
  public static createLayers(
    lines: BaseMapLine[],
    config: Line3DAnimationConfig = {},
    currentTime: number = 0,
  ): [ArcTripsLayer, ArcTripsLayer] {
    const mergedConfig = { ...Line3DManager.DEFAULT_CONFIG, ...config };
    const routes = generateFlightRoutes(lines, currentTime, config);

    // 基础弧线层（使用 line 颜色，透明度 0.3，显示完整弧线）
    const baseLayer = new ArcTripsLayer({
      id: "arc-base-layer",
      data: routes,
      getSourcePosition: (d: ArcTripsDataItem) => d.sourcePosition,
      getTargetPosition: (d: ArcTripsDataItem) => d.targetPosition,
      getSourceColor: (d: ArcTripsDataItem) => [...d.sourceColor, 0.3 * 255] as [number, number, number, number],
      getTargetColor: (d: ArcTripsDataItem) => [...d.targetColor, 0.3 * 255] as [number, number, number, number],
      getWidth: (d: ArcTripsDataItem) => d.width,
      getHeight: (d: ArcTripsDataItem) => d.height,
      getSourceTimestamp: (d: ArcTripsDataItem) => d.sourceTimestamp,
      getTargetTimestamp: (d: ArcTripsDataItem) => d.targetTimestamp,

      // Animation properties - 基础层显示完整弧线，无动画效果
      currentTime: currentTime * mergedConfig.animationSpeed,
      fadeTrail: false, // 不使用动画效果，显示完整弧线
      trailLength: mergedConfig.trailLength,
      showFullArc: true, // 显示完整弧线
      dotSize: mergedConfig.dotSize,
      dotTrailLength: mergedConfig.dotTrailLength,
      animationSpeed: mergedConfig.animationSpeed,

      // Arc properties
      greatCircle: true,
      numSegments: 50,
      widthMinPixels: 1,
    });

    // 尾迹层（使用 line 颜色，透明度 1，带动画效果）
    const trailLayer = new ArcTripsLayer({
      id: "arc-trail-layer",
      data: routes,
      getSourcePosition: (d: ArcTripsDataItem) => d.sourcePosition,
      getTargetPosition: (d: ArcTripsDataItem) => d.targetPosition,
      getSourceColor: (d: ArcTripsDataItem) => [...d.sourceColor, 255] as [number, number, number, number],
      getTargetColor: (d: ArcTripsDataItem) => [...d.targetColor, 255] as [number, number, number, number],
      getWidth: (d: ArcTripsDataItem) => d.width,
      getHeight: (d: ArcTripsDataItem) => d.height,
      getSourceTimestamp: (d: ArcTripsDataItem) => d.sourceTimestamp,
      getTargetTimestamp: (d: ArcTripsDataItem) => d.targetTimestamp,

      // Animation properties - 尾迹层只显示动画部分
      currentTime: currentTime * mergedConfig.animationSpeed,
      fadeTrail: mergedConfig.fadeTrail, // 启用渐变尾迹效果
      trailLength: mergedConfig.trailLength,
      showFullArc: false, // 只显示尾迹部分
      dotSize: mergedConfig.dotSize,
      dotTrailLength: mergedConfig.dotTrailLength,
      animationSpeed: mergedConfig.animationSpeed,

      // Arc properties
      greatCircle: true,
      numSegments: 50,
      widthMinPixels: 1,

      // Interactive
      pickable: mergedConfig.pickable,
      autoHighlight: mergedConfig.autoHighlight,
      onClick: mergedConfig.onClick,
    });

    return [baseLayer, trailLayer];
  }
  /**
   * 获取需要清理的 3D 线图层 ID 列表
   * @returns 图层 ID 数组
   */
  public static getLayerIdsToRemove(): string[] {
    return ["arc-base-layer", "arc-trail-layer"];
  }
}
