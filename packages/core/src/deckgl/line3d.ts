/**
 * 模块：3D 线路渲染器
 * 说明：负责 3D 模式下的弧线动画渲染，封装 ArcLayer 的构建逻辑。
 */
import { type BaseMapLine } from "@orch-map/types"
import { ArcLayer } from "@deck.gl/layers"

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

const DEFAULT_RGB: [number, number, number] = [200, 200, 200]

/**
 * 类：LineRenderer3D
 * 说明：用于创建 3D 弧线图层。
 */
export class LineRenderer3D {
  /**
   * 创建 ArcLayer 图层
   * @param lines 业务线数据
   * @param timeRange 可见时间窗口 [start, end]
   * @param lineOffset 每条线的起始偏移（秒）
   * @param lineDuration 每条线的持续时长（秒）
   */
  public buildAnimatedLayer(lines: BaseMapLine[], timeRange: [number, number], lineOffset: number, lineDuration: number) {
    return new ArcLayer({
      id: "line-layer",
      data: lines,
      pickable: true,
      getSourcePosition: (d: BaseMapLine) => [d.startCoordinate[0], d.startCoordinate[1], 100],
      getTargetPosition: (d: BaseMapLine) => [d.endCoordinate[0], d.endCoordinate[1], 100],
      getSourceTimestamp: (_d: BaseMapLine, { index }: { index: number }) => index * lineOffset,
      getTargetTimestamp: (_d: BaseMapLine, { index }: { index: number }) => index * lineOffset + lineDuration,
      timeRange,
      getHeight: 0.6,
      getSourceColor: (d: BaseMapLine) => {
        if (Array.isArray(d.color)) {
          return [d.color[0] ?? DEFAULT_RGB[0], d.color[1] ?? DEFAULT_RGB[1], d.color[2] ?? DEFAULT_RGB[2]]
        }
        return DEFAULT_RGB
      },
      getTargetColor: (d: BaseMapLine) => {
        if (Array.isArray(d.color)) {
          return [d.color[0] ?? DEFAULT_RGB[0], d.color[1] ?? DEFAULT_RGB[1], d.color[2] ?? DEFAULT_RGB[2]]
        }
        return DEFAULT_RGB
      },
      parameters: { cullMode: "none" },
    })
  }
}
