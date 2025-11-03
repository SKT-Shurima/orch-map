/**
 * 模块：DeckGL 2D 模式地图类
 * 说明：2D 模式的特定实现
 */
import { MapViewState } from "@deck.gl/core";
import { Line2DManager, LayerId } from "./layers";
import { DeckglMapFlat } from "./DeckglMapFlat";

/**
 * DeckGL 2D 模式地图类
 */
export class DeckglMap2D extends DeckglMapFlat {
  /**
   * 获取动画速度（2D 模式）
   */
  protected getAnimationSpeed(): number {
    return 12; // 每毫秒的时间单位
  }

  /**
   * 获取俯仰角（2D 模式）
   */
  protected getPitch(): number {
    return 0;
  }

  /**
   * 更新动画图层（2D 模式）
   * @param currentTime - 当前动画时间
   */
  protected updateArcAnimation(currentTime: number): void {
    // 使用 createLayers 创建图层
    const layers = Line2DManager.createLayers(this.lines, {}, currentTime);

    // 更新图层
    this.updateLayerById(LayerId.LINE_LAYER, layers[0]);
    this.updateLayerById(LayerId.LINE_TRAIL_LAYER, layers[1]);

    this.updateLayer();
  }

  /**
   * 创建并初始化 Deck 实例（2D 模式特定）
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
    // 调用父类方法，使用 2D 模式的 pitch
    await super.createDeckInstance(
      container,
      {
        ...initialViewState,
        pitch: 0, // 2D 模式 pitch 为 0
      },
      props,
    );
  }
}

