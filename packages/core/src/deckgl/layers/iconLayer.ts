/**
 * 模块：图标图层管理器
 * 说明：统一管理图标图层的创建与更新逻辑
 * 设计要点：
 * - 提供静态方法，避免实例化；
 * - 封装 IconLayer 的构建逻辑；
 * - 处理图标图集的动态构建；
 * - 支持点的选中和悬停状态。
 */
import { type BaseMapPoint } from "@orch-map/types";
import { IconLayer as DeckIconLayer } from "@deck.gl/layers";
import IconAtlas from "./iconAtlas";
import MapStateManager from "../../MapStateManager";

/**
 * 图标点数据结构
 */
export type IconPoint = BaseMapPoint & {
  position: [number, number, number]
  icon: string
  size: number
  color: [number, number, number, number]
}

/**
 * 图标图层配置
 */
export interface IconLayerConfig {
  /** 选中点的 ID */
  selectedPointId?: string | null;
  /** 悬停点的 ID */
  hoveredPointId?: string | null;
  /** 选中时的放大倍数 */
  selectedSizeMultiplier?: number;
  /** 点击回调 */
  onClick?: (info: unknown) => void;
  /** 悬停回调 */
  onHover?: (info: unknown) => void;
}

/**
 * 图标图层管理器（静态工具类）
 */
export class IconLayer {
  /**
   * 将业务点数据转换为 IconLayer 需要的数据结构
   * @param points 业务点数据数组
   * @returns IconLayer 需要的数据数组
   */
  public static transformToIconData(
    points: Array<BaseMapPoint & { icon?: string; color?: [number, number, number, number] }>,
  ): IconPoint[] {
    return points.map(point => ({
      ...point,
      // 抬升少量高度，避免与地面发生深度冲突/遮挡
      position: [point.coordinate[0], point.coordinate[1], 50],
      icon: point.icon ?? "star",
      size: point.size ?? 16,
      color: point.color ?? [255, 255, 255, 255],
    }));
  }

  /**
   * 创建图标图层
   * @param iconData 图标数据数组
   * @param config 图层配置
   * @returns IconLayer 实例或 null（如果图标图集构建失败）
   */
  public static async createIconLayer(
    iconData: IconPoint[],
    config: IconLayerConfig = {},
  ): Promise<DeckIconLayer<IconPoint> | null> {
    const {
      selectedPointId = null,
      selectedSizeMultiplier = 1.6,
      onClick,
      onHover,
    } = config;

    // 从 MapStateManager 获取注册的图标
    const registeredIcons = MapStateManager.extraSvgIcons || {};
    if (Object.keys(registeredIcons).length === 0) {
      // eslint-disable-next-line no-console
      console.warn("No icons registered in MapStateManager, skipping IconLayer creation");
      return null;
    }

    // 动态构建图标图集
    // 注意：buildIconAtlas 会对 SVG 进行多次 rasterize，内存与耗时与图标数量成正比
    const iconAtlasResult = await IconAtlas.buildIconAtlas(registeredIcons);

    const iconLayer = new DeckIconLayer<IconPoint>({
      id: "point-layer",
      data: iconData,
      iconAtlas: iconAtlasResult.iconAtlas,
      iconMapping: iconAtlasResult.iconMapping,
      getPosition: (d) => d.position,
      getIcon: (d) => d.icon,
      getSize: (d) => (selectedPointId && d.id === selectedPointId ? d.size * selectedSizeMultiplier : d.size),
      getColor: (d) => d.color,
      pickable: true,
      updateTriggers: {
        getSize: selectedPointId,
      },
      onClick,
      onHover,
    });
    return iconLayer;
  }

  /**
   * 创建图标图层（纯静态方法，不负责渲染）
   * @param points 业务点数据数组
   * @param config 图层配置
   * @returns 图标图层实例或 null（如果图标图集构建失败）
   */
  public static async create(
    points: BaseMapPoint[],
    config: IconLayerConfig = {},
  ): Promise<DeckIconLayer<IconPoint> | null> {
    // 转换数据
    const iconData = IconLayer.transformToIconData(
      points as Array<BaseMapPoint & { icon?: string; color?: [number, number, number, number] }>,
    );

    // 创建图标图层
    return await this.createIconLayer(iconData, config);
  }

  /**
   * 获取图标图层的标识符
   * @returns 图层ID
   */
  public static getLayerId(): string {
    return "point-layer";
  }
}

