/**
 * 动画工具函数
 */
import { AnimationConfig } from "./animation.interface";

/**
 * 缓动函数
 */
export const easing = {
  linear: (t: number): number => t,
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => (--t) * t * t + 1,
  easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};

/**
 * 动画管理器类
 */
export class AnimationManager {
  private animations: Map<string, Animation> = new Map();
  private rafId: number | null = null;

  /**
   * 创建动画
   */
  create(
    id: string,
    config: AnimationConfig
  ): void {
    const animation = new Animation(config);
    this.animations.set(id, animation);

    if (!this.rafId) {
      this.start();
    }
  }

  /**
   * 停止动画
   */
  stop(id: string): void {
    this.animations.delete(id);

    if (this.animations.size === 0 && this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * 停止所有动画
   */
  stopAll(): void {
    this.animations.clear();

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * 开始动画循环
   */
  private start(): void {
    const animate = (currentTime: number) => {
      const completedAnimations: string[] = [];

      this.animations.forEach((animation, id) => {
        const isComplete = animation.update(currentTime);
        if (isComplete) {
          completedAnimations.push(id);
        }
      });

      // 清理已完成的动画
      completedAnimations.forEach(id => {
        this.animations.delete(id);
      });

      if (this.animations.size > 0) {
        this.rafId = requestAnimationFrame(animate);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(animate);
  }
}

/**
 * 动画类
 */
export class Animation {
  private startTime: number | null = null;
  private config: AnimationConfig;

  constructor(config: AnimationConfig) {
    this.config = {
      ...config,
      enabled: config.enabled ?? true,
      duration: config.duration ?? 1000,
      easing: config.easing ?? "easeInOutQuad",
      delay: config.delay ?? 0,
      type: config.type ?? "fadeIn",
    };
  }

  /**
   * 更新动画
   */
  update(currentTime: number): boolean {
    if (!this.startTime) {
      this.startTime = currentTime;
    }

    const elapsed = currentTime - this.startTime;
    const duration = this.config.duration || 1000;

    let progress = Math.min(elapsed / duration, 1);

    // 应用缓动函数
    const easingFn = easing[this.config.easing as keyof typeof easing] || easing.linear;
    progress = easingFn(progress);

    // 计算当前值
    const value = this.config.from + (this.config.to - this.config.from) * progress;
    this.config.onUpdate?.(progress, value);

    // 检查是否完成
    if (elapsed >= duration) {
      if (this.config.loop) {
        this.startTime = currentTime;
        return false;
      } else {
        this.config.onComplete?.();
        return true;
      }
    }

    return false;
  }
}

/**
 * 全局动画管理器实例
 */
export const animationManager = new AnimationManager();