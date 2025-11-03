/**
 * 模块：DeckGL 2.5D 模式地图类
 * 说明：2.5D 模式的特定实现（倾斜45度）
 */
import { MapViewState } from "@deck.gl/core";
import { Line3DManager, LayerId } from "./layers";
import { DeckglMapFlat } from "./DeckglMapFlat";

/**
 * DeckGL 2.5D 模式地图类
 */
export class DeckglMap2_5D extends DeckglMapFlat {
  /**
   * 获取动画速度（2.5D 模式）
   */
  protected getAnimationSpeed(): number {
    return 0.1; // 每毫秒的时间单位
  }

  /**
   * 获取俯仰角（2.5D 模式）
   */
  protected getPitch(): number {
    return 45;
  }

  /**
   * 更新动画图层（2.5D 模式）
   * @param currentTime - 当前动画时间
   */
  protected updateArcAnimation(currentTime: number): void {
    // 使用 createLayers 创建图层
    const [baseLayer, trailLayer] = Line3DManager.createLayers(this.lines, {}, currentTime);

    // 更新图层
    this.updateLayerById(LayerId.ARC_BASE_LAYER, baseLayer);
    this.updateLayerById(LayerId.ARC_TRAIL_LAYER, trailLayer);

    this.updateLayer();
  }

  /**
   * 创建并初始化 Deck 实例（2.5D 模式特定）
   */
  protected async createDeckInstance(
    container: HTMLCanvasElement,
    initialViewState: Partial<MapViewState>,
    props?: Partial<Record<string, unknown>> & {
      mode?: "2d" | "2.5d" | "3d"
      onClick?: (info: unknown, event: unknown) => void
      onDblClick?: (info: unknown, event: unknown) => void
    },
  ): Promise<void> {
    // 调用父类方法，使用 2.5D 模式的 pitch
    await super.createDeckInstance(
      container,
      {
        ...initialViewState,
        pitch: 45, // 2.5D 模式 pitch 为 45
      },
      props,
    );
  }
}

