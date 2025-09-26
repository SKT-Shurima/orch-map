import type { GeoData } from '@orch-map/types';

/**
 * 数据可视化增强器
 * 提供热力图、流向图、等值线图等高级可视化功能
 */
export class DataVisualization {
  private static instance: DataVisualization;

  private constructor() {}

  public static getInstance(): DataVisualization {
    if (!DataVisualization.instance) {
      DataVisualization.instance = new DataVisualization();
    }
    return DataVisualization.instance;
  }

  /**
   * 创建热力图配置
   */
  public createHeatmapConfig(
    data: GeoData[],
    options: {
      radius?: number;
      intensity?: number;
      colorScheme?: string[];
      blur?: number;
    } = {}
  ): any {
    const {
      radius = 20,
      intensity = 0.6,
      colorScheme = ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
      blur = 0.6
    } = options;

    return {
      type: 'heatmap',
      coordinateSystem: 'geo',
      data: data.map(item => [item.value[0], item.value[1], item.value[2]]),
      pointSize: radius,
      blur,
      minOpacity: 0,
      maxOpacity: intensity,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: colorScheme.map((color, index) => ({
            offset: index / (colorScheme.length - 1),
            color
          }))
        }
      }
    };
  }

  /**
   * 创建流向图配置
   */
  public createFlowConfig(
    fromData: GeoData[],
    toData: GeoData[],
    options: {
      lineStyle?: any;
      effectStyle?: any;
      symbolSize?: number;
      color?: string;
    } = {}
  ): any {
    const {
      lineStyle = {
        color: '#a6c84c',
        width: 2,
        curveness: 0.3
      },
      effectStyle = {
        show: true,
        period: 6,
        trailLength: 0.7,
        color: '#fff',
        symbolSize: 3
      },
      symbolSize = 8,
      color = '#ff6b6b'
    } = options;

    // 生成流向数据
    const flowData = fromData.map((from, index) => {
      const to = toData[index] || toData[0];
      return {
        coords: [
          [from.value[0], from.value[1]],
          [to.value[0], to.value[1]]
        ],
        value: from.value[2] || 1
      };
    });

    return {
      type: 'lines',
      coordinateSystem: 'geo',
      data: flowData,
      lineStyle,
      effect: effectStyle,
      symbol: ['none', 'arrow'],
      symbolSize,
      itemStyle: {
        color
      }
    };
  }

  /**
   * 创建等值线图配置
   */
  public createContourConfig(
    data: GeoData[],
    options: {
      levels?: number[];
      colorScheme?: string[];
      lineWidth?: number;
    } = {}
  ): any {
    const {
      levels = [0, 200, 400, 600, 800, 1000],
      colorScheme = ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc'],
      lineWidth = 2
    } = options;

    return {
      type: 'contour',
      coordinateSystem: 'geo',
      data: data.map(item => [item.value[0], item.value[1], item.value[2]]),
      levels,
      lineStyle: {
        width: lineWidth
      },
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: colorScheme.map((color, index) => ({
            offset: index / (colorScheme.length - 1),
            color
          }))
        }
      }
    };
  }

  /**
   * 创建散点图配置（增强版）
   */
  public createScatterConfig(
    data: GeoData[],
    options: {
      symbolSize?: number | ((value: any) => number);
      color?: string | ((value: any) => string);
      symbol?: string;
      label?: any;
      emphasis?: any;
    } = {}
  ): any {
    const {
      symbolSize = 8,
      color = '#ff6b6b',
      symbol = 'circle',
      label = {
        show: false
      },
      emphasis = {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    } = options;

    return {
      type: 'scatter',
      coordinateSystem: 'geo',
      data: data.map(item => ({
        name: item.name,
        value: item.value,
        itemStyle: item.itemStyle
      })),
      symbolSize,
      symbol,
      itemStyle: {
        color
      },
      label,
      emphasis
    };
  }

  /**
   * 创建效果散点图配置
   */
  public createEffectScatterConfig(
    data: GeoData[],
    options: {
      symbolSize?: number;
      color?: string;
      effectType?: 'ripple';
      rippleEffect?: any;
    } = {}
  ): any {
    const {
      symbolSize = 8,
      color = '#ff6b6b',
      effectType = 'ripple',
      rippleEffect = {
        period: 4,
        scale: 2.5,
        brushType: 'fill'
      }
    } = options;

    return {
      type: 'effectScatter',
      coordinateSystem: 'geo',
      data: data.map(item => ({
        name: item.name,
        value: item.value,
        itemStyle: item.itemStyle
      })),
      symbolSize,
      itemStyle: {
        color
      },
      effectType,
      rippleEffect
    };
  }

  /**
   * 创建地图配置
   */
  public createMapConfig(
    data: GeoData[],
    mapName: string,
    options: {
      itemStyle?: any;
      emphasis?: any;
      select?: any;
      label?: any;
    } = {}
  ): any {
    const {
      itemStyle = {
        areaColor: '#f0f0f0',
        borderColor: '#999',
        borderWidth: 1
      },
      emphasis = {
        itemStyle: {
          areaColor: '#ff6b6b'
        }
      },
      select = {
        itemStyle: {
          areaColor: '#4ecdc4'
        }
      },
      label = {
        show: true,
        position: 'inside',
        fontSize: 12,
        color: '#333'
      }
    } = options;

    return {
      type: 'map',
      map: mapName,
      data: data.map(item => ({
        name: item.name,
        value: item.value[2] || 0,
        itemStyle: item.itemStyle
      })),
      itemStyle,
      emphasis,
      select,
      label
    };
  }

  /**
   * 创建组合图表配置
   */
  public createCombinedConfig(
    configs: Array<{
      type: 'scatter' | 'effectScatter' | 'heatmap' | 'lines' | 'map' | 'contour';
      data: GeoData[];
      options?: any;
    }>
  ): any[] {
    return configs.map(config => {
      switch (config.type) {
        case 'scatter':
          return this.createScatterConfig(config.data, config.options);
        case 'effectScatter':
          return this.createEffectScatterConfig(config.data, config.options);
        case 'heatmap':
          return this.createHeatmapConfig(config.data, config.options);
        case 'lines':
          return this.createFlowConfig(config.data, config.data, config.options);
        case 'map':
          return this.createMapConfig(config.data, 'china', config.options);
        case 'contour':
          return this.createContourConfig(config.data, config.options);
        default:
          return this.createScatterConfig(config.data, config.options);
      }
    });
  }

  /**
   * 数据聚类
   */
  public clusterData(
    data: GeoData[],
    options: {
      clusterRadius?: number;
      maxZoom?: number;
      minPoints?: number;
    } = {}
  ): Array<{
    center: [number, number];
    points: GeoData[];
    count: number;
  }> {
    const {
      clusterRadius = 50,
      maxZoom = 10,
      minPoints = 2
    } = options;

    const clusters: Array<{
      center: [number, number];
      points: GeoData[];
      count: number;
    }> = [];

    data.forEach(point => {
      let addedToCluster = false;

      for (const cluster of clusters) {
        const distance = this.calculateDistance(
          point.value,
          cluster.center
        );

        if (distance <= clusterRadius) {
          cluster.points.push(point);
          cluster.count++;
          // 重新计算聚类中心
          cluster.center = this.calculateCenter(cluster.points);
          addedToCluster = true;
          break;
        }
      }

      if (!addedToCluster) {
        clusters.push({
          center: [point.value[0], point.value[1]],
          points: [point],
          count: 1
        });
      }
    });

    return clusters.filter(cluster => cluster.count >= minPoints);
  }

  /**
   * 计算两点间距离
   */
  private calculateDistance(point1: [number, number, number], point2: [number, number]): number {
    const dx = point1[0] - point2[0];
    const dy = point1[1] - point2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算中心点
   */
  private calculateCenter(points: GeoData[]): [number, number] {
    if (points.length === 0) return [0, 0];

    const sumLng = points.reduce((sum, point) => sum + point.value[0], 0);
    const sumLat = points.reduce((sum, point) => sum + point.value[1], 0);

    return [sumLng / points.length, sumLat / points.length];
  }

  /**
   * 生成颜色渐变
   */
  public generateColorGradient(
    startColor: string,
    endColor: string,
    steps: number
  ): string[] {
    const colors: string[] = [];
    
    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      const color = this.interpolateColor(startColor, endColor, ratio);
      colors.push(color);
    }

    return colors;
  }

  /**
   * 颜色插值
   */
  private interpolateColor(color1: string, color2: string, ratio: number): string {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');

    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);

    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
