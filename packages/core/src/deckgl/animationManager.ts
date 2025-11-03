/**
 * 模块：弧线动画管理器
 * 说明：负责管理弧线动画的时间计算和 RAF 循环，与主类解耦
 * 仅负责维护动画时间状态，不涉及具体渲染逻辑
 */

/**
 * 动画更新回调函数类型
 * 当动画时间更新时调用，参数为当前动画时间
 */
export type AnimationUpdateCallback = (currentTime: number) => void;

/**
 * 弧线动画管理器
 * 负责管理动画时间计算、RAF 循环和状态管理
 */
export default class ArcAnimationManager {
  //===== 动画时间管理 =====

  /** 当前动画时间（单位：秒的逻辑刻度） */
  private currentTime = 0;

  /** RAF 动画 ID */
  private rafId: number | null = null;

  /** 动画开始时间 */
  private animationStartTime: number = 0;

  /** 动画是否正在运行 */
  private isAnimating: boolean = false;

  //===== 配置 =====

  /** 动画速度配置：每毫秒推进的时间单位 */
  private animationSpeed: number;

  /** 时间循环周期 */
  private readonly timeLoop = 6 * 60 * 60;

  /** 时间更新回调 */
  private updateCallback: AnimationUpdateCallback | null = null;

  /**
   * 构造函数
   * @param animationSpeed - 动画速度（每毫秒的时间单位）
   * @param updateCallback - 时间更新回调函数（可选）
   */
  public constructor(animationSpeed: number, updateCallback?: AnimationUpdateCallback) {
    this.animationSpeed = animationSpeed;
    this.updateCallback = updateCallback ?? null;
  }

  //===== 时间管理方法 =====

  /**
   * 获取当前动画时间
   */
  public getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * 设置当前动画时间
   */
  public setCurrentTime(time: number): void {
    this.currentTime = time;
  }

  /**
   * 重置动画时间
   */
  public resetTime(): void {
    this.currentTime = 0;
    this.animationStartTime = Date.now();
  }

  //===== 动画控制方法 =====

  /**
   * 启动动画定时器（使用 requestAnimationFrame）
   */
  public start(): void {
    if (this.isAnimating) {
      this.stop();
    }

    this.isAnimating = true;
    this.animationStartTime = Date.now();
    this.animate();
  }

  /**
   * 停止动画
   */
  public stop(): void {
    this.isAnimating = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * 获取动画是否正在运行
   */
  public getIsAnimating(): boolean {
    return this.isAnimating;
  }

  /**
   * 更新动画速度
   * @param speed - 新的动画速度（每毫秒的时间单位）
   */
  public setAnimationSpeed(speed: number): void {
    this.animationSpeed = speed;
  }

  /**
   * 设置更新回调
   * @param callback - 时间更新回调函数
   */
  public setUpdateCallback(callback: AnimationUpdateCallback): void {
    this.updateCallback = callback;
  }

  //===== 私有方法 =====

  /**
   * RAF 动画循环
   */
  private animate = (): void => {
    if (!this.isAnimating) {
      return;
    }

    const currentTime = Date.now();
    const deltaTime = currentTime - this.animationStartTime;

    // 计算新的动画时间
    const newTime = (deltaTime * this.animationSpeed) % this.timeLoop;
    this.setCurrentTime(newTime);

    // 通过回调通知外部时间已更新
    if (this.updateCallback) {
      this.updateCallback(this.currentTime);
    }

    // 继续下一帧
    this.rafId = requestAnimationFrame(this.animate);
  };

  /**
   * 销毁资源
   */
  public destroy(): void {
    this.stop();
    this.updateCallback = null;
  }
}

