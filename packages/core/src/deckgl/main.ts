/**
 * 模块：DeckGL 主模块
 * 说明：DeckGL 地图主类，作为工厂类根据模式实例化对应的实现类
 */
import { GeoJSON } from "geojson";
import { type BaseMapPoint, type BaseMapLine } from "@orch-map/types";
import type { MapRendererEvents } from "../interfaces/IMapRenderer";
import { BaseDeckglMap } from "./BaseDeckglMap";
import { DeckglMap2D } from "./DeckglMap2D";
import { DeckglMap2_5D } from "./DeckglMap2_5D";
import { DeckglMap3D } from "./DeckglMap3D";

/**
 * DeckGL 地图主类（工厂类）
 * 说明：根据模式（2D/2.5D/3D）实例化对应的实现类
 * - 2D: 平面图
 * - 2.5D: 倾斜45度
 * - 3D: Globe 模式
 */
export default class DeckglMap {
  /** 内部实现实例 */
  private instance: BaseDeckglMap;

  /** 容器元素 */
  private container: HTMLCanvasElement;

  /** 地图模式（2D/2.5D/3D） */
  private mode: "2d" | "2.5d" | "3d";

  /** 初始化完成回调函数 */
  private callback: () => void;

  /** 事件处理器配置 */
  private events?: MapRendererEvents;

  /** 中心点配置 */
  private center?: { lat: number; lng: number };

  /**
   * 构造函数
   * @param container - 容器元素
   * @param mode - 地图模式（2D/2.5D/3D）
   * @param callback - 初始化完成回调函数
   * @param events - 事件处理器配置（可选）
   * @param center - 可选的中心点配置 { lat, lng }
   */
  public constructor(
    container: HTMLCanvasElement,
    mode: "2d" | "2.5d" | "3d",
    callback: () => void,
    events?: MapRendererEvents,
    center?: { lat: number; lng: number },
  ) {
    this.container = container;
    this.mode = mode;
    this.callback = callback;
    this.events = events;
    this.center = center;

    // 创建初始实例
    // 根据模式实例化对应的实现类
    if (this.mode === "3d") {
      // 3D 模式 = Globe 模式
      this.instance = new DeckglMap3D(this.container, this.mode, this.callback, this.events, this.center);
    } else if (this.mode === "2.5d") {
      // 2.5D 模式 = 倾斜45度
      this.instance = new DeckglMap2_5D(this.container, this.mode, this.callback, this.events, this.center);
    } else {
      // 2D 模式 = 平面图
      this.instance = new DeckglMap2D(this.container, this.mode, this.callback, this.events, this.center);
    }
  }

  /**
   * 销毁内部资源
   */
  public destroy() {
    this.instance.destroy();
  }

  /**
   * 设置国家/省份 GeoJSON 数据并注册基础底图图层
   * @param geojsonData - GeoJSON 数据
   */
  public async setGEOData(geojsonData: GeoJSON) {
    // 根据模式判断应该使用的实例类型
    const shouldBe3D = this.mode === "3d";
    const isCurrently3D = this.instance instanceof DeckglMap3D;
    const shouldBe2_5D = this.mode === "2.5d";
    const isCurrently2_5D = this.instance instanceof DeckglMap2_5D;
    const shouldBe2D = this.mode === "2d";
    const isCurrently2D = this.instance instanceof DeckglMap2D;

    // 如果模式发生变化，需要重新初始化实例
    if ((shouldBe3D && !isCurrently3D) || (shouldBe2_5D && !isCurrently2_5D) || (shouldBe2D && !isCurrently2D)) {
      // 销毁旧的实例
      this.instance.destroy();

      // 重新创建实例（根据模式）
      if (this.mode === "3d") {
        this.instance = new DeckglMap3D(this.container, this.mode, this.callback, this.events, this.center);
      } else if (this.mode === "2.5d") {
        this.instance = new DeckglMap2_5D(this.container, this.mode, this.callback, this.events, this.center);
      } else {
        this.instance = new DeckglMap2D(this.container, this.mode, this.callback, this.events, this.center);
      }
    }

    await this.instance.setGEOData(geojsonData);
  }

  /**
   * 设置点数据
   * @param points - 点数据数组
   */
  public async setPoints(points: BaseMapPoint[]) {
    await this.instance.setPoints(points);
  }

  /**
   * 设置折线数据
   * @param lines - 折线数据数组
   */
  public setLines(lines: BaseMapLine[]) {
    this.instance.setLines(lines);
  }
}
