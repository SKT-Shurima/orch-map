/**
 * 模块：文本标签图层管理器
 * 说明：统一管理文本标签图层的创建与更新逻辑
 * 设计要点：
 * - 提供静态方法，避免实例化；
 * - 封装 TextLayer 的构建逻辑；
 * - 支持基于选中和悬停状态的条件显示。
 */
import { type BaseMapPoint } from "@orch-map/types";
import { TextLayer as DeckTextLayer } from "@deck.gl/layers";

/**
 * 图层更新回调函数类型
 */
export type LayerUpdateCallback = (layerId: string, layer: any) => void;
export type LayerRemoveCallback = (layerId: string) => void;

/**
 * 文本标签数据结构
 */
export type TextPoint = BaseMapPoint & {
  position: [number, number, number]
  text: string
  size: number
  color: [number, number, number, number]
  anchorY: "top" | "center" | "bottom"
}

/**
 * 文本图层配置
 */
export interface TextLayerConfig {
  /** 选中点的 ID */
  selectedPointId?: string | null;
  /** 悬停点的 ID */
  hoveredPointId?: string | null;
}

/**
 * 文本图层管理器（静态工具类）
 */
export class TextLayer {
  /**
   * 将业务点数据转换为 TextLayer 需要的数据结构
   * 根据 label.show 和 label.hoverShow 配置决定是否显示标签
   * @param points 业务点数据数组
   * @param config 图层配置
   * @returns TextLayer 需要的数据数组
   */
  public static transformToTextData(
    points: BaseMapPoint[],
    config: TextLayerConfig = {},
  ): TextPoint[] {
    const { hoveredPointId, selectedPointId } = config;

    return points
      .filter(point => {
        // 如果没有配置 label，默认显示所有点
        if (!point.label) {
          return true;
        }
        // 如果 label.show 为 true，始终显示
        if (point.label?.show) {
          return true;
        }
        // 如果 label.hoverShow 为 true 且当前点被悬停或选中，显示
        if (point.label?.hoverShow && (hoveredPointId === point.id || selectedPointId === point.id)) {
          return true;
        }
        return false;
      })
      .map(point => {
        // 使用 label.formatter 或默认显示 name
        const text = point.label?.formatter
          ? point.label.formatter({ data: point })
          : point.name || "";

        return {
          ...point,
          // 抬升高度，显示在图标上方，避免遮挡
          position: [point.coordinate[0], point.coordinate[1], 60] as [number, number, number],
          text,
          size: 12, // 默认字体大小
          color: [255, 255, 255, 255] as [number, number, number, number], // 默认白色
          anchorY: "top" as const, // 文本位于点下方
        };
      });
  }

  /**
   * 创建文本标签图层
   * @param textData 文本数据数组
   * @returns TextLayer 实例
   */
  public static createLayer(textData: TextPoint[]): DeckTextLayer<TextPoint> {
    return new DeckTextLayer<TextPoint>({
      id: "label-layer",
      data: textData,
      getPosition: (d) => d.position,
      getText: (d) => d.text,
      getSize: (d) => d.size,
      getColor: (d) => d.color,
      getAngle: 0,
      getTextAnchor: "middle",
      getAlignmentBaseline: (d) => d.anchorY,
      // 文本样式配置
      fontFamily: "Arial, sans-serif",
      fontWeight: "normal",
      outlineWidth: 2,
      outlineColor: [0, 0, 0, 255],
      pickable: false, // 标签不可交互
      // 确保文本始终朝上
      billboard: true,
    });
  }

  /**
   * 更新文本图层
   * @param points 业务点数据数组
   * @param config 图层配置
   * @param updateCallback 图层更新回调函数
   */
  public static updateLayer(
    points: BaseMapPoint[],
    config: TextLayerConfig = {},
    updateCallback: LayerUpdateCallback,
  ): void {
    const textData = this.transformToTextData(points, config);
    const textLayer = this.createLayer(textData);
    updateCallback("label-layer", textLayer);
  }

  /**
   * 清理文本图层
   * @param removeCallback 图层移除回调函数
   */
  public static clearLayer(removeCallback: LayerRemoveCallback): void {
    removeCallback("label-layer");
  }
}

