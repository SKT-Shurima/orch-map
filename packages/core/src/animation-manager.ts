import type { AnimationConfig } from '@orch-map/types';

/**
 * 动画管理器
 * 提供各种动画效果和配置
 */
export class AnimationManager {
  private static instance: AnimationManager;
  private animations: Map<string, AnimationConfig> = new Map();

  private constructor() {
    this.initializeDefaultAnimations();
  }

  public static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  /**
   * 初始化默认动画配置
   */
  private initializeDefaultAnimations(): void {
    // 淡入动画
    this.registerAnimation({
      name: 'fadeIn',
      enabled: true,
      duration: 1000,
      easing: 'cubicOut',
      delay: 0,
      type: 'fadeIn'
    });

    // 滑入动画
    this.registerAnimation({
      name: 'slideIn',
      enabled: true,
      duration: 800,
      easing: 'cubicOut',
      delay: 100,
      type: 'slideIn'
    });

    // 缩放动画
    this.registerAnimation({
      name: 'zoomIn',
      enabled: true,
      duration: 600,
      easing: 'backOut',
      delay: 0,
      type: 'zoomIn'
    });

    // 弹跳动画
    this.registerAnimation({
      name: 'bounce',
      enabled: true,
      duration: 1200,
      easing: 'bounceOut',
      delay: 200,
      type: 'bounce'
    });

    // 快速动画
    this.registerAnimation({
      name: 'quick',
      enabled: true,
      duration: 300,
      easing: 'cubicOut',
      delay: 0,
      type: 'fadeIn'
    });

    // 慢速动画
    this.registerAnimation({
      name: 'slow',
      enabled: true,
      duration: 2000,
      easing: 'cubicInOut',
      delay: 0,
      type: 'fadeIn'
    });
  }

  /**
   * 注册动画配置
   */
  public registerAnimation(animation: AnimationConfig & { name: string }): void {
    this.animations.set(animation.name, animation);
  }

  /**
   * 获取动画配置
   */
  public getAnimation(name: string): (AnimationConfig & { name: string }) | undefined {
    return this.animations.get(name) as (AnimationConfig & { name: string }) | undefined;
  }

  /**
   * 获取所有动画名称
   */
  public getAnimationNames(): string[] {
    return Array.from(this.animations.keys());
  }

  /**
   * 应用动画到 ECharts 配置
   */
  public applyAnimation(animation: AnimationConfig, baseConfig: any = {}): any {
    if (!animation.enabled) {
      return baseConfig;
    }

    const config = { ...baseConfig };

    // 应用动画到系列
    if (config.series) {
      config.series = config.series.map((series: any) => ({
        ...series,
        animation: true,
        animationDuration: animation.duration,
        animationEasing: animation.easing,
        animationDelay: animation.delay,
        animationType: this.getAnimationType(animation.type)
      }));
    }

    // 应用动画到 Geo
    if (config.geo) {
      config.geo.animation = true;
      config.geo.animationDuration = animation.duration;
      config.geo.animationEasing = animation.easing;
      config.geo.animationDelay = animation.delay;
    }

    // 应用动画到提示框
    if (config.tooltip) {
      config.tooltip.animation = true;
      config.tooltip.animationDuration = animation.duration;
      config.tooltip.animationEasing = animation.easing;
    }

    return config;
  }

  /**
   * 获取动画类型对应的 ECharts 动画类型
   */
  private getAnimationType(type?: string): string {
    switch (type) {
      case 'fadeIn':
        return 'fadeIn';
      case 'slideIn':
        return 'slideIn';
      case 'zoomIn':
        return 'scale';
      case 'bounce':
        return 'bounce';
      default:
        return 'fadeIn';
    }
  }

  /**
   * 创建数据加载动画
   */
  public createDataLoadingAnimation(data: any[], animation: AnimationConfig): any[] {
    if (!animation.enabled) {
      return data;
    }

    return data.map((item, index) => ({
      ...item,
      animationDelay: (animation.delay || 0) + (index * 50), // 错开动画时间
      animationDuration: animation.duration,
      animationEasing: animation.easing
    }));
  }

  /**
   * 创建区域切换动画
   */
  public createRegionSwitchAnimation(
    fromRegion: string,
    toRegion: string,
    animation: AnimationConfig
  ): any {
    if (!animation.enabled) {
      return {};
    }

    return {
      animation: true,
      animationDuration: animation.duration,
      animationEasing: animation.easing,
      animationDelay: animation.delay,
      transition: {
        from: fromRegion,
        to: toRegion,
        duration: animation.duration,
        easing: animation.easing
      }
    };
  }

  /**
   * 创建数据更新动画
   */
  public createDataUpdateAnimation(
    oldData: any[],
    newData: any[],
    animation: AnimationConfig
  ): any {
    if (!animation.enabled) {
      return { data: newData };
    }

    return {
      data: newData,
      animation: true,
      animationDuration: animation.duration,
      animationEasing: animation.easing,
      animationDelay: animation.delay,
      animationType: 'update'
    };
  }

  /**
   * 创建自定义动画
   */
  public createCustomAnimation(
    name: string,
    baseAnimation: string = 'fadeIn',
    overrides: Partial<AnimationConfig> = {}
  ): AnimationConfig & { name: string } {
    const base = this.getAnimation(baseAnimation) || this.getAnimation('fadeIn')!;
    const customAnimation = {
      ...base,
      ...overrides,
      name
    };

    this.registerAnimation(customAnimation);
    return customAnimation;
  }

  /**
   * 获取动画缓动函数
   */
  public getEasingFunctions(): string[] {
    return [
      'linear',
      'quadraticIn',
      'quadraticOut',
      'quadraticInOut',
      'cubicIn',
      'cubicOut',
      'cubicInOut',
      'quarticIn',
      'quarticOut',
      'quarticInOut',
      'quinticIn',
      'quinticOut',
      'quinticInOut',
      'sinusoidalIn',
      'sinusoidalOut',
      'sinusoidalInOut',
      'exponentialIn',
      'exponentialOut',
      'exponentialInOut',
      'circularIn',
      'circularOut',
      'circularInOut',
      'elasticIn',
      'elasticOut',
      'elasticInOut',
      'backIn',
      'backOut',
      'backInOut',
      'bounceIn',
      'bounceOut',
      'bounceInOut'
    ];
  }
}
