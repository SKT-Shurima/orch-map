/**
 * 模块：3D 线路渲染器
 * 说明：负责 3D 模式下的弧线动画渲染，封装 ArcLayer 的构建逻辑。
 * 特性：支持 buddy 双向连线，为每条线生成镜像线（起终点互换），实现双向流动效果。
 */
import { type BaseMapLine } from "@orch-map/types";
import { ArcLayer } from "@deck.gl/layers";

// ArcLayerProps 类型定义（临时，直到从 DeckGL 库中获取）
export interface ArcLayerProps {
  id?: string;
  data?: any[];
  pickable?: boolean;
  getSourcePosition?: (d: any) => [number, number, number];
  getTargetPosition?: (d: any) => [number, number, number];
  getSourceTimestamp?: (d: any, info: { index: number }) => number;
  getTargetTimestamp?: (d: any, info: { index: number }) => number;
  timeRange?: [number, number];
  getHeight?: number;
  getSourceColor?: (d: any) => [number, number, number];
  getTargetColor?: (d: any) => [number, number, number];
  parameters?: Record<string, any>;
  [key: string]: any;
}

const DEFAULT_RGB: [number, number, number] = [200, 200, 200];

/**
 * 扩展线数据，用于标记是否为 buddy 线
 */
interface ExtendedLine extends BaseMapLine {
  isBuddy?: boolean;
  originalIndex?: number;
}

/**
 * 静态工具类：LineRenderer3D
 * 说明：用于创建 3D 弧线图层。
 */
export class LineRenderer3D {
  /**
   * 创建 ArcLayer 图层（包含原始线和 buddy 镜像线）
   * 实现 buddy 双向连线：为每条线生成原始线（起点→终点）和 buddy 镜像线（终点→起点）
   * 两条线同步动画，形成双向流动的视觉效果
   * @param lines 业务线数据
   * @param timeRange 可见时间窗口 [start, end]
   * @param lineOffset 每条线的起始偏移（秒）
   * @param lineDuration 每条线的持续时长（秒）
   * @returns ArcLayer 实例（包含所有弧线及其 buddy 线）
   */
  public static buildAnimatedLayer(lines: BaseMapLine[], timeRange: [number, number], lineOffset: number, lineDuration: number) {
    // 为每条线生成原始线和 buddy 镜像线
    const allLines: ExtendedLine[] = [];
    lines.forEach((line, index) => {
      // 原始线
      allLines.push({ ...line, isBuddy: false, originalIndex: index });
      // Buddy 线（起终点互换）
      allLines.push({
        ...line,
        id: `${line.id}-buddy`,
        startCoordinate: line.endCoordinate,
        endCoordinate: line.startCoordinate,
        isBuddy: true,
        originalIndex: index,
      });
    });

    return new ArcLayer({
      id: "line-layer",
      data: allLines,
      pickable: true,
      getSourcePosition: (d: ExtendedLine) => [d.startCoordinate[0], d.startCoordinate[1], 100],
      getTargetPosition: (d: ExtendedLine) => [d.endCoordinate[0], d.endCoordinate[1], 100],
      getSourceTimestamp: (_d: ExtendedLine, { index }: { index: number }) => {
        // 原始索引用于计算时间偏移，确保原始线和 buddy 线同步
        const originalIdx = Math.floor(index / 2);
        return originalIdx * lineOffset;
      },
      getTargetTimestamp: (_d: ExtendedLine, { index }: { index: number }) => {
        const originalIdx = Math.floor(index / 2);
        return originalIdx * lineOffset + lineDuration;
      },
      timeRange,
      getHeight: 0.6,
      getSourceColor: (d: ExtendedLine) => {
        if (Array.isArray(d.color)) {
          return [d.color[0] ?? DEFAULT_RGB[0], d.color[1] ?? DEFAULT_RGB[1], d.color[2] ?? DEFAULT_RGB[2]];
        }
        return DEFAULT_RGB;
      },
      getTargetColor: (d: ExtendedLine) => {
        if (Array.isArray(d.color)) {
          return [d.color[0] ?? DEFAULT_RGB[0], d.color[1] ?? DEFAULT_RGB[1], d.color[2] ?? DEFAULT_RGB[2]];
        }
        return DEFAULT_RGB;
      },
      parameters: { cullMode: "none" },
    });
  }
}

