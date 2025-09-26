import type { TooltipConfig } from '@orch-map/types';

/**
 * 提示框管理器
 * 提供丰富的提示框功能和自定义模板
 */
export class TooltipManager {
  private static instance: TooltipManager;
  private tooltips: Map<string, TooltipConfig> = new Map();

  private constructor() {
    this.initializeDefaultTooltips();
  }

  public static getInstance(): TooltipManager {
    if (!TooltipManager.instance) {
      TooltipManager.instance = new TooltipManager();
    }
    return TooltipManager.instance;
  }

  /**
   * 初始化默认提示框配置
   */
  private initializeDefaultTooltips(): void {
    // 默认提示框
    this.registerTooltip({
      name: 'default',
      enabled: true,
      trigger: 'item',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#333',
      textStyle: {
        color: '#fff',
        fontSize: 12
      },
      position: 'top'
    });

    // 简洁提示框
    this.registerTooltip({
      name: 'simple',
      enabled: true,
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#ddd',
      textStyle: {
        color: '#333',
        fontSize: 11
      },
      position: 'top'
    });

    // 卡片式提示框
    this.registerTooltip({
      name: 'card',
      enabled: true,
      trigger: 'item',
      backgroundColor: '#fff',
      borderColor: '#e0e0e0',
      textStyle: {
        color: '#333',
        fontSize: 13,
        fontWeight: 'bold'
      },
      position: 'top'
    });

    // 深色提示框
    this.registerTooltip({
      name: 'dark',
      enabled: true,
      trigger: 'item',
      backgroundColor: 'rgba(44, 62, 80, 0.95)',
      borderColor: '#34495e',
      textStyle: {
        color: '#ecf0f1',
        fontSize: 12
      },
      position: 'top'
    });
  }

  /**
   * 注册提示框配置
   */
  public registerTooltip(tooltip: TooltipConfig & { name: string }): void {
    const { name, ...config } = tooltip;
    this.tooltips.set(name, config);
  }

  /**
   * 获取提示框配置
   */
  public getTooltip(name: string): TooltipConfig | undefined {
    return this.tooltips.get(name);
  }

  /**
   * 获取所有提示框名称
   */
  public getTooltipNames(): string[] {
    return Array.from(this.tooltips.keys());
  }

  /**
   * 应用提示框到 ECharts 配置
   */
  public applyTooltip(tooltip: TooltipConfig, baseConfig: any = {}): any {
    if (!tooltip.enabled) {
      return {
        ...baseConfig,
        tooltip: { show: false }
      };
    }

    const config = { ...baseConfig };
    config.tooltip = {
      ...config.tooltip,
      show: true,
      trigger: tooltip.trigger,
      backgroundColor: tooltip.backgroundColor,
      borderColor: tooltip.borderColor,
      textStyle: tooltip.textStyle,
      position: tooltip.position,
      formatter: tooltip.formatter || this.getDefaultFormatter(tooltip.trigger)
    };

    return config;
  }

  /**
   * 获取默认格式化器
   */
  private getDefaultFormatter(trigger: string): string | ((params: any) => string) {
    if (trigger === 'item') {
      return (params: any) => {
        if (params.componentType === 'geo') {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
              <div style="color: #666;">点击查看详情</div>
            </div>
          `;
        }
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
            <div>经度: ${params.value[0]}</div>
            <div>纬度: ${params.value[1]}</div>
            ${params.value[2] ? `<div>数值: ${params.value[2]}</div>` : ''}
          </div>
        `;
      };
    }
    return '';
  }

  /**
   * 创建自定义格式化器
   */
  public createCustomFormatter(
    template: string,
    dataFields: string[] = ['name', 'value']
  ): (params: any) => string {
    return (params: any) => {
      let result = template;
      
      // 替换基本字段
      result = result.replace(/\{name\}/g, params.name || '');
      result = result.replace(/\{value\}/g, params.value ? params.value.join(', ') : '');
      
      // 替换数据字段
      dataFields.forEach(field => {
        const regex = new RegExp(`\\{${field}\\}`, 'g');
        const value = params[field] || (params.data && params.data[field]) || '';
        result = result.replace(regex, value);
      });

      // 替换坐标信息
      if (params.value && Array.isArray(params.value)) {
        result = result.replace(/\{lng\}/g, params.value[0] || '');
        result = result.replace(/\{lat\}/g, params.value[1] || '');
        result = result.replace(/\{data\}/g, params.value[2] || '');
      }

      return result;
    };
  }

  /**
   * 创建数据统计提示框
   */
  public createDataStatsTooltip(data: any[]): TooltipConfig {
    const stats = this.calculateDataStats(data);
    
    return {
      enabled: true,
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#ddd',
      textStyle: {
        color: '#333',
        fontSize: 12
      },
      position: 'top',
      formatter: (params: any) => {
        return `
          <div style="padding: 12px; min-width: 200px;">
            <div style="font-weight: bold; margin-bottom: 8px; color: #2c3e50;">
              ${params.name}
            </div>
            <div style="margin-bottom: 6px;">
              <span style="color: #7f8c8d;">坐标:</span> 
              ${params.value[0]}, ${params.value[1]}
            </div>
            <div style="margin-bottom: 6px;">
              <span style="color: #7f8c8d;">数值:</span> 
              <span style="font-weight: bold; color: #e74c3c;">${params.value[2]}</span>
            </div>
            <div style="border-top: 1px solid #ecf0f1; padding-top: 6px; margin-top: 8px;">
              <div style="font-size: 11px; color: #95a5a6;">
                总计: ${stats.total} | 平均: ${stats.average.toFixed(2)} | 最大: ${stats.max}
              </div>
            </div>
          </div>
        `;
      }
    };
  }

  /**
   * 计算数据统计信息
   */
  private calculateDataStats(data: any[]): {
    total: number;
    average: number;
    max: number;
    min: number;
  } {
    if (data.length === 0) {
      return { total: 0, average: 0, max: 0, min: 0 };
    }

    const values = data.map(item => item.value[2] || 0);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return { total, average, max, min };
  }

  /**
   * 创建区域信息提示框
   */
  public createRegionInfoTooltip(regionData: any): TooltipConfig {
    return {
      enabled: true,
      trigger: 'item',
      backgroundColor: 'rgba(52, 73, 94, 0.95)',
      borderColor: '#34495e',
      textStyle: {
        color: '#ecf0f1',
        fontSize: 13
      },
      position: 'top',
      formatter: (params: any) => {
        return `
          <div style="padding: 12px; min-width: 180px;">
            <div style="font-weight: bold; margin-bottom: 8px; color: #3498db;">
              ${params.name}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #bdc3c7;">区域代码:</span> ${regionData.code || 'N/A'}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #bdc3c7;">区域类型:</span> ${regionData.type || 'N/A'}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #bdc3c7;">人口:</span> ${regionData.population || 'N/A'}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #bdc3c7;">面积:</span> ${regionData.area || 'N/A'}
            </div>
          </div>
        `;
      }
    };
  }

  /**
   * 创建自定义提示框
   */
  public createCustomTooltip(
    name: string,
    baseTooltip: string = 'default',
    overrides: Partial<TooltipConfig> = {}
  ): TooltipConfig {
    const base = this.getTooltip(baseTooltip) || this.getTooltip('default')!;
    const customTooltip = {
      ...base,
      ...overrides
    };

    this.registerTooltip({ ...customTooltip, name });
    return customTooltip;
  }
}
