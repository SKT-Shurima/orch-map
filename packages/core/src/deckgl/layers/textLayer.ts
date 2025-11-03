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
import { hexToRgba } from "@orch-map/utils";
import { POINT_DEFAULT_STYLE } from "../../constants";
import { LayerId } from "./types";

/**
 * 文本标签数据结构
 */
export type TextPoint = BaseMapPoint & {
  position: [number, number, number]
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
        return {
          ...point,
          // 抬升高度，显示在图标上方，避免遮挡
          position: [point.coordinate[0], point.coordinate[1], 120] as [number, number, number],
          size: point.size ?? 16,
        };
      });
  }

  /**
   * 创建文本标签图层
   * @param textData 文本数据数组
   * @returns TextLayer 实例
   */
  public static createLayer(textData: TextPoint[]): DeckTextLayer<TextPoint> {
    const color = hexToRgba(POINT_DEFAULT_STYLE.color);
    return new DeckTextLayer<TextPoint>({
      id: LayerId.LABEL_LAYER,
      data: textData,
      characterSet: "auto",
      fontSettings: {
        buffer: 8,
      },
      getPosition: (d) => d.position,
      getText: (d) => d.name,
      getSize: (d) => d.size ? d.size / 1.5 : 8,
      getColor: () => color,
      maxWidth: 64 * 12,
      getAngle: 0,
      getTextAnchor: "middle",
      getAlignmentBaseline: () => "bottom",
      pickable: false, // 标签不可交互
      // 确保文本始终朝上
      billboard: true,
      // 确保文本在最顶层
      modelMatrix: null,
    });
  }

  /**
   * 创建文本图层（纯静态方法，不负责渲染）
   * @param points 业务点数据数组
   * @param config 图层配置
   * @returns TextLayer 实例
   */
  public static create(
    points: BaseMapPoint[],
    config: TextLayerConfig = {},
  ): DeckTextLayer<TextPoint> {
    const textData = TextLayer.transformToTextData(points, config);
    return TextLayer.createLayer(textData);
  }

  /**
   * 获取文本图层的标识符
   * @returns 图层ID
   */
  public static getLayerId(): string {
    return LayerId.LABEL_LAYER;
  }
}

