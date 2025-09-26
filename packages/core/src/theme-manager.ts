import type { ThemeConfig } from '@orch-map/types';

/**
 * 主题管理器
 * 提供预设主题和自定义主题功能
 */
export class ThemeManager {
  private static instance: ThemeManager;
  private themes: Map<string, ThemeConfig> = new Map();
  private currentTheme: string = 'default';

  private constructor() {
    this.initializeDefaultThemes();
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * 初始化默认主题
   */
  private initializeDefaultThemes(): void {
    // 默认主题
    this.registerTheme({
      name: 'default',
      colors: {
        primary: '#5470c6',
        secondary: '#91cc75',
        background: '#ffffff',
        text: '#333333',
        border: '#cccccc',
        area: '#f0f0f0',
        emphasis: '#ff6b6b',
        select: '#4ecdc4'
      },
      fonts: {
        family: 'Arial, sans-serif',
        size: 12,
        weight: 'normal'
      },
      effects: {
        shadow: false,
        gradient: false,
        animation: true
      }
    });

    // 深色主题
    this.registerTheme({
      name: 'dark',
      colors: {
        primary: '#5dade2',
        secondary: '#58d68d',
        background: '#2c3e50',
        text: '#ecf0f1',
        border: '#34495e',
        area: '#34495e',
        emphasis: '#e74c3c',
        select: '#f39c12'
      },
      fonts: {
        family: 'Arial, sans-serif',
        size: 12,
        weight: 'normal'
      },
      effects: {
        shadow: true,
        gradient: true,
        animation: true
      }
    });

    // 科技主题
    this.registerTheme({
      name: 'tech',
      colors: {
        primary: '#00d4ff',
        secondary: '#00ff88',
        background: '#0a0a0a',
        text: '#00ff88',
        border: '#00d4ff',
        area: '#1a1a1a',
        emphasis: '#ff0080',
        select: '#ffaa00'
      },
      fonts: {
        family: 'Consolas, monospace',
        size: 11,
        weight: 'bold'
      },
      effects: {
        shadow: true,
        gradient: true,
        animation: true
      }
    });

    // 自然主题
    this.registerTheme({
      name: 'nature',
      colors: {
        primary: '#2ecc71',
        secondary: '#f39c12',
        background: '#f8f9fa',
        text: '#2c3e50',
        border: '#95a5a6',
        area: '#ecf0f1',
        emphasis: '#e74c3c',
        select: '#9b59b6'
      },
      fonts: {
        family: 'Georgia, serif',
        size: 13,
        weight: 'normal'
      },
      effects: {
        shadow: false,
        gradient: true,
        animation: true
      }
    });

    // 商务主题
    this.registerTheme({
      name: 'business',
      colors: {
        primary: '#34495e',
        secondary: '#3498db',
        background: '#ffffff',
        text: '#2c3e50',
        border: '#bdc3c7',
        area: '#f8f9fa',
        emphasis: '#e74c3c',
        select: '#f39c12'
      },
      fonts: {
        family: 'Helvetica, Arial, sans-serif',
        size: 12,
        weight: '500'
      },
      effects: {
        shadow: true,
        gradient: false,
        animation: false
      }
    });
  }

  /**
   * 注册主题
   */
  public registerTheme(theme: ThemeConfig): void {
    this.themes.set(theme.name, theme);
  }

  /**
   * 获取主题
   */
  public getTheme(name: string): ThemeConfig | undefined {
    return this.themes.get(name);
  }

  /**
   * 获取所有主题名称
   */
  public getThemeNames(): string[] {
    return Array.from(this.themes.keys());
  }

  /**
   * 设置当前主题
   */
  public setCurrentTheme(name: string): boolean {
    if (this.themes.has(name)) {
      this.currentTheme = name;
      return true;
    }
    return false;
  }

  /**
   * 获取当前主题
   */
  public getCurrentTheme(): ThemeConfig | undefined {
    return this.themes.get(this.currentTheme);
  }

  /**
   * 获取当前主题名称
   */
  public getCurrentThemeName(): string {
    return this.currentTheme;
  }

  /**
   * 删除主题
   */
  public removeTheme(name: string): boolean {
    if (name === 'default') {
      return false; // 不能删除默认主题
    }
    return this.themes.delete(name);
  }

  /**
   * 应用主题到 ECharts 配置
   */
  public applyTheme(theme: ThemeConfig, baseConfig: any = {}): any {
    const config = { ...baseConfig };

    // 应用颜色
    if (config.geo) {
      config.geo.itemStyle = {
        ...config.geo.itemStyle,
        areaColor: theme.colors.area,
        borderColor: theme.colors.border,
        color: theme.colors.primary
      };

      config.geo.emphasis = {
        ...config.geo.emphasis,
        itemStyle: {
          ...config.geo.emphasis?.itemStyle,
          areaColor: theme.colors.emphasis
        }
      };

      config.geo.select = {
        ...config.geo.select,
        itemStyle: {
          ...config.geo.select?.itemStyle,
          areaColor: theme.colors.select
        }
      };
    }

    // 应用字体
    const textStyle = {
      fontFamily: theme.fonts.family,
      fontSize: theme.fonts.size,
      fontWeight: theme.fonts.weight,
      color: theme.colors.text
    };

    if (config.tooltip) {
      config.tooltip.textStyle = {
        ...config.tooltip.textStyle,
        ...textStyle
      };
    }

    if (config.legend) {
      config.legend.textStyle = {
        ...config.legend.textStyle,
        ...textStyle
      };
    }

    // 应用效果
    if (theme.effects.shadow) {
      const shadowStyle = {
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowOffsetX: 2,
        shadowOffsetY: 2
      };

      if (config.geo?.itemStyle) {
        config.geo.itemStyle = { ...config.geo.itemStyle, ...shadowStyle };
      }
    }

    if (theme.effects.gradient) {
      const gradientStyle = {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 1,
          colorStops: [
            { offset: 0, color: theme.colors.primary },
            { offset: 1, color: theme.colors.secondary }
          ]
        }
      };

      if (config.geo?.itemStyle) {
        config.geo.itemStyle = { ...config.geo.itemStyle, ...gradientStyle };
      }
    }

    return config;
  }

  /**
   * 创建自定义主题
   */
  public createCustomTheme(
    name: string,
    baseTheme: string = 'default',
    overrides: Partial<ThemeConfig> = {}
  ): ThemeConfig {
    const base = this.getTheme(baseTheme) || this.getTheme('default')!;
    const customTheme: ThemeConfig = {
      ...base,
      ...overrides,
      name,
      colors: { ...base.colors, ...overrides.colors },
      fonts: { ...base.fonts, ...overrides.fonts },
      effects: { ...base.effects, ...overrides.effects }
    };

    this.registerTheme(customTheme);
    return customTheme;
  }
}
