/**
 * 动画相关类型定义
 */

// 基础动画配置接口
export interface BaseAnimationConfig {
  enabled: boolean;
  duration: number;
  easing: string;
  delay?: number;
  type?: 'fadeIn' | 'slideIn' | 'zoomIn' | 'bounce';
}

// 扩展的动画配置接口（用于 utils 包）
export interface AnimationConfig extends BaseAnimationConfig {
  from: number;
  to: number;
  onUpdate: (progress: number, value: number) => void;
  onComplete?: () => void;
  loop?: boolean;
}
