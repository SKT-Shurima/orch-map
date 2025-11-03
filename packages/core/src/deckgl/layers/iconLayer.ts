/**
 * 模块：图标图层管理器
 * 说明：统一管理图标图层的创建与更新逻辑，包括点数据管理和事件处理
 * 设计要点：
 * - 提供静态方法，避免实例化；
 * - 封装 IconLayer 的构建逻辑；
 * - 处理图标图集的动态构建；
 * - 支持点的选中和悬停状态；
 * - 提供点数据管理和事件处理的完整解决方案。
 */
import { type BaseMapPoint } from "@orch-map/types";
import { IconLayer as DeckIconLayer } from "@deck.gl/layers";
import IconAtlas from "./iconAtlas";
import MapStateManager from "../../MapStateManager";
import { TextLayer } from "./textLayer";
import { LayerId } from "./types";

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
 * 点状态管理接口
 */
export interface PointState {
  /** 选中点的 ID */
  selectedPointId: string | null;
  /** 悬停点的 ID */
  hoveredPointId: string | null;
  /** 点数据数组（可选） */
  points?: BaseMapPoint[];
}

/**
 * 图层更新回调接口
 */
export interface LayerUpdateCallback {
  /** 更新图层的方法 */
  (layerId: string, layer: unknown): void;
  /** 更新所有图层的方法 */
  (): void;
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
      id: LayerId.POINT_LAYER,
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
    return await IconLayer.createIconLayer(iconData, config);
  }

  /**
   * 获取图标图层的标识符
   * @returns 图层ID
   */
  public static getLayerId(): string {
    return LayerId.POINT_LAYER;
  }

  /**
   * 处理点对象点击事件
   * @param info - 点击信息
   * @param currentState - 当前点状态
   * @param updateCallback - 图层更新回调
   * @returns 更新后的点状态
   */
  public static async handleClickPoint(
    info: unknown,
    currentState: PointState,
    updateCallback: LayerUpdateCallback,
  ): Promise<PointState> {
    const pick = info as { object?: { id?: string | null } } | null;
    const clickedId: string | null = pick?.object?.id ?? null;

    const newState = {
      ...currentState,
      selectedPointId: clickedId,
    };

    await IconLayer.updateIconLayers(
      currentState.points ?? [],
      newState,
      updateCallback,
    );

    return newState;
  }

  /**
   * 处理点对象悬停事件
   * @param info - 悬停信息
   * @param currentState - 当前点状态
   * @param updateCallback - 图层更新回调
   * @returns 更新后的点状态
   */
  public static async handleHoverPoint(
    info: unknown,
    currentState: PointState,
    updateCallback: LayerUpdateCallback,
  ): Promise<PointState> {
    const pick = info as { object?: { id?: string | null } } | null;
    const hoveredId: string | null = pick?.object?.id ?? null;

    if (currentState.hoveredPointId !== hoveredId) {
      const newState = {
        ...currentState,
        hoveredPointId: hoveredId,
      };

      // 更新文本图层
      const textLayer = TextLayer.create(
        currentState.points ?? [],
        {
          selectedPointId: newState.selectedPointId,
          hoveredPointId: newState.hoveredPointId,
        },
      );
      updateCallback(TextLayer.getLayerId(), textLayer);
      updateCallback();

      return newState;
    }

    return currentState;
  }

  /**
   * 更新图标和文本图层
   * @param points - 点数据数组
   * @param state - 点状态
   * @param updateCallback - 图层更新回调
   */
  public static async updateIconLayers(
    points: BaseMapPoint[],
    state: PointState & { points?: BaseMapPoint[] },
    updateCallback: LayerUpdateCallback,
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.log("[IconLayer] updateIconLayers called, points count:", points.length);

    // 创建图标图层
    const iconLayer = await IconLayer.create(
      points,
      {
        selectedPointId: state.selectedPointId,
        hoveredPointId: state.hoveredPointId,
        onClick: (_info: unknown) => {
          // 这里需要外部提供点击处理逻辑
          // 因为静态方法无法直接访问实例状态
        },
        onHover: (_info: unknown) => {
          // 这里需要外部提供悬停处理逻辑
          // 因为静态方法无法直接访问实例状态
        },
      },
    );

    // 将图层添加到渲染管理器
    if (iconLayer) {
      updateCallback(IconLayer.getLayerId(), iconLayer);
    }

    // eslint-disable-next-line no-console
    console.log("[IconLayer] IconLayer updated, now updating TextLayer");

    // 创建文本图层
    const textLayer = TextLayer.create(
      points,
      {
        selectedPointId: state.selectedPointId,
        hoveredPointId: state.hoveredPointId,
      },
    );
    updateCallback(TextLayer.getLayerId(), textLayer);

    // eslint-disable-next-line no-console
    console.log("[IconLayer] TextLayer updated, now calling updateLayer()");

    updateCallback();
  }

  /**
   * 设置点数据并更新图层
   * @param points - 点数据数组
   * @param state - 当前点状态
   * @param updateCallback - 图层更新回调
   * @returns 更新后的点状态
   */
  public static async setPoints(
    points: BaseMapPoint[],
    state: PointState,
    updateCallback: LayerUpdateCallback,
  ): Promise<PointState> {
    const newState = {
      ...state,
      points,
    };

    await IconLayer.updateIconLayers(points, newState, updateCallback);
    return newState;
  }

  /**
   * 检查点击是否在点图层上
   * @param info - 点击信息
   * @returns 是否在点图层上
   */
  public static isPointLayerClick(info: unknown): boolean {
    const pick = info as { object?: { id?: string }; layer?: { id?: string } } | null;
    return !!(pick?.object && pick.layer?.id === IconLayer.getLayerId());
  }

  /**
   * 清除选中状态
   * @param currentState - 当前点状态
   * @param updateCallback - 图层更新回调
   * @returns 更新后的点状态
   */
  public static async clearSelection(
    currentState: PointState,
    updateCallback: LayerUpdateCallback,
  ): Promise<PointState> {
    if (currentState.selectedPointId) {
      const newState = {
        ...currentState,
        selectedPointId: null,
      };

      await IconLayer.updateIconLayers(
        currentState.points ?? [],
        newState,
        updateCallback,
      );

      return newState;
    }

    return currentState;
  }
}

