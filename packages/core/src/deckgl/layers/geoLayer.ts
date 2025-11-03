/**
 * 模块：Geo 基础图层
 * 说明：提供 GeoJSON 图层的完整管理功能，包括创建、事件处理和视图适配
 */

import { GeoJsonLayer } from "@deck.gl/layers";
import { Feature, GeoJSON } from "geojson";
import { isDef } from "@orch-map/utils";
import { MapLevel } from "@orch-map/types";
import MapStateManager from "../../MapStateManager";
import GeoUtils from "../../utils/geoUtils";
import type { MapRendererEvents } from "../../interfaces/IMapRenderer";
import { LayerId } from "./types";

/**
 * GeoJSON 图层属性配置接口
 * 定义 GeoJsonLayer 支持的配置选项
 */
export interface GeoJsonLayerProps {
  /** 是否启用拾取功能，启用后可以与图层元素进行交互 */
  pickable?: boolean;
  /** 是否绘制要素的边框线条 */
  stroked?: boolean;
  /** 是否填充要素的内部区域 */
  filled?: boolean;
  /** 线宽缩放比例，用于调整线条粗细 */
  lineWidthScale?: number;
  /** 线条最小宽度（像素），确保线条在任何缩放级别下的可见性 */
  lineWidthMinPixels?: number;
  /** 是否启用经度无限滚动，解决地图跨越180度经线的显示问题 */
  wrapLongitude?: boolean;
  /** 是否自动高亮鼠标悬停的要素 */
  autoHighlight?: boolean;
  /** 高亮状态下要素的颜色，RGBA格式 [r, g, b, a]，取值范围 0-255 */
  highlightColor?: [number, number, number, number];
  /**
   * 要素边框的颜色获取函数
   * @param d - GeoJSON 要素数据
   * @returns RGBA 颜色数组 [r, g, b, a]
   */
  getLineColor?: (d: unknown) => [number, number, number, number];
  /**
   * 要素边框的宽度获取函数
   * @param d - GeoJSON 要素数据
   * @returns 线条宽度（像素）
   */
  getLineWidth?: (d: unknown) => number;
  /** 其他扩展属性 */
  [key: string]: unknown;
}

/** 默认填充色 RGBA */
export const DEFAULT_GEO_FILL_COLOR: [number, number, number, number] = [9, 71, 119, 255];
/** 默认边线色 RGBA */
export const DEFAULT_GEO_LINE_COLOR: [number, number, number, number] = [20, 128, 197, 255];
/** 默认高亮色 RGBA */
export const DEFAULT_GEO_HIGHLIGHT_COLOR: [number, number, number, number] = [48, 121, 200, 255];

/**
 * 地理图层的默认属性配置
 */
export const DEFAULT_GEO_LAYER_PROPS: Partial<GeoJsonLayerProps> = {
  /** 是否启用拾取功能，启用后可以与图层元素进行交互 */
  pickable: true,

  /** 是否绘制要素的边框线条 */
  stroked: true,

  /** 是否填充要素的内部区域 */
  filled: true,

  /** 线宽缩放比例，用于调整线条粗细 */
  lineWidthScale: 1,

  /** 线条最小宽度（像素），确保线条在任何缩放级别下的可见性 */
  lineWidthMinPixels: 1,

  /** 是否启用经度无限滚动，解决地图跨越180度经线的显示问题 */
  wrapLongitude: true,

  /** 是否自动高亮鼠标悬停的要素 */
  autoHighlight: true,

  /** 高亮状态下要素的颜色，RGBA 格式 [r, g, b, a]，取值范围 0-255 */
  highlightColor: DEFAULT_GEO_HIGHLIGHT_COLOR,

  /** 要素边框的默认颜色，返回 RGBA 数组 */
  getLineColor: (_d) => DEFAULT_GEO_LINE_COLOR,

  /** 要素边框的宽度，单位为像素 */
  getLineWidth: () => 1,
};

/**
 * 视图状态接口
 */
export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
}

/**
 * 容器尺寸接口
 */
export interface ContainerSize {
  width: number;
  height: number;
}

export default class GeoLayer {
  /**
   * 当前悬停的要素名称
   */
  private static hoveredFeatureName: string | null = null;

  /**
   * 创建一个空数据的 GeoJsonLayer
   */
  public static create() {
    return new GeoJsonLayer({
      ...DEFAULT_GEO_LAYER_PROPS,
      id: LayerId.GEOJSON_LAYER,
      data: [],
    });
  }

  /**
   * 创建带有完整功能的 GeoJSON 图层
   * @param geojsonData - GeoJSON 数据
   * @param events - 事件处理器配置（可选）
   * @returns 配置好的 GeoJsonLayer 实例
   */
  public static createWithData(geojsonData: GeoJSON, events?: MapRendererEvents) {
    let lastClickTime = 0;
    const DOUBLE_CLICK_THRESHOLD = 300; // 毫秒

    return new GeoJsonLayer({
      ...DEFAULT_GEO_LAYER_PROPS,
      id: LayerId.GEOJSON_LAYER,
      data: geojsonData,
      getFillColor: (feature: Feature) => {
        if (isDef(GeoLayer.hoveredFeatureName) && GeoLayer.hoveredFeatureName === feature.properties?.name) {
          return DEFAULT_GEO_HIGHLIGHT_COLOR;
        }
        return DEFAULT_GEO_FILL_COLOR;
      },
      updateTriggers: {
        getFillColor: GeoLayer.hoveredFeatureName,
        onHover: GeoLayer.hoveredFeatureName,
      },
      onClick: (info: unknown) => {
        const currentTime = Date.now();
        const timeSinceLastClick = currentTime - lastClickTime;

        if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD) {
          // 这是双击
          const pick = info as { object?: { properties?: { name?: string; code?: string } } } | null;
          if (pick?.object) {
            const regionName = pick.object.properties?.name ?? "";
            // 触发双击区域事件回调
            if (events?.onAreaDoubleClick) {
              events.onAreaDoubleClick(regionName);
            }
          }
          lastClickTime = 0; // 重置
        } else {
          // 这是单击
          lastClickTime = currentTime;
        }
        return true;
      },
      onHover: (info: unknown) => {
        const hover = info as { object?: { properties?: { name?: string } } } | null;
        const newHoveredName = hover?.object?.properties?.name ?? null;
        if (GeoLayer.hoveredFeatureName !== newHoveredName) {
          // 需要重绘时，这里应该触发重绘，但静态方法无法直接访问 deck 实例
          // 这个逻辑需要在调用方处理
          GeoLayer.setHoveredFeatureName(newHoveredName);
        }
        return newHoveredName ? true : false;

      },
    });
  }

  /**
   * 根据地理数据计算适合的视图状态
   * @param geojsonData - GeoJSON 数据
   * @param containerSize - 容器尺寸
   * @param mode - 地图模式（2D/2.5D/3D）
   * @param center - 可选的中心点配置 { lat, lng }，如果提供则优先使用
   * @returns 计算后的视图状态
   */
  public static calculateViewState(
    geojsonData: GeoJSON,
    containerSize: ContainerSize,
    mode: "2d" | "2.5d" | "3d" = "2d",
    center?: { lat: number; lng: number },
  ): ViewState {
    // 如果提供了 center 配置，直接使用
    if (center) {
      const result = GeoUtils.getCenterAndZoom(geojsonData, {
        containerWidth: containerSize.width,
        containerHeight: containerSize.height,
      });
      return {
        longitude: center.lng,
        latitude: center.lat,
        zoom: result?.zoom ?? 1,
        pitch: mode === "2.5d" || mode === "3d" ? 45 : 0,
      };
    }

    const curLevel = MapStateManager.curLevel;

    if (curLevel === MapLevel.WORLD) {
      // 世界地图使用默认视图
      const result = GeoUtils.getCenterAndZoom(geojsonData, {
        containerWidth: containerSize.width,
        containerHeight: containerSize.height,
      });
      return {
        longitude: result?.center?.[0] ?? 0,
        latitude: result?.center?.[1] ?? 0,
        zoom: result?.zoom ?? 0,
        pitch: mode === "2.5d" || mode === "3d" ? 45 : 0,
      };
    }

    // 计算中心点和缩放级别
    const result = GeoUtils.getCenterAndZoom(geojsonData, {
      containerWidth: containerSize.width,
      containerHeight: containerSize.height,
    });
    if (!result) {
      return {
        longitude: 0,
        latitude: 0,
        zoom: 1,
        pitch: mode === "2.5d" || mode === "3d" ? 45 : 0,
      };
    }

    return {
      longitude: result.center?.[0] ?? 0,
      latitude: result.center?.[1] ?? 0,
      zoom: result.zoom ?? 1,
      pitch: mode === "2.5d" || mode === "3d" ? 45 : 0,
    };
  }

  /**
   * 检查是否应该初始化默认图层
   * @returns 是否应该初始化
   */
  public static shouldInitializeDefaultLayers(): boolean {
    return !!MapStateManager.geoData;
  }

  /**
   * 获取默认的 GeoJSON 数据
   * @returns 默认的 GeoJSON 数据
   */
  public static getDefaultGeoData(): GeoJSON | null {
    return MapStateManager.geoData;
  }

  /**
   * 获取图层 ID
   * @returns 图层 ID
   */
  public static getLayerId(): string {
    return LayerId.GEOJSON_LAYER;
  }

  /**
   * 设置当前悬停的要素名称
   * @param name - 要素名称，为 null 时清除悬停状态
   */
  public static setHoveredFeatureName(name: string | null): void {
    GeoLayer.hoveredFeatureName = name;
  }

  /**
   * 获取当前悬停的要素名称
   * @returns 当前悬停的要素名称，如果没有则为 null
   */
  public static getHoveredFeatureName(): string | null {
    return GeoLayer.hoveredFeatureName;
  }
}

