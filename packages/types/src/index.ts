// 地图配置类型 (保留向后兼容)
export interface MapConfig {
  name: string;
  center: [number, number];
  zoom: number;
}

// 数据点类型
export interface DataPoint {
  name: string;
  value: [number, number, number]; // [经度, 纬度, 数值]
}

// Geo 组件配置接口
export interface GeoConfig {
  // 基础配置
  mapName: string;
  mapData?: any; // GeoJSON 数据
  center?: [number, number];
  zoom?: number;
  roam?: boolean | 'scale' | 'move';
  
  // 布局配置
  aspectScale?: number;
  layoutCenter?: [string | number, string | number];
  layoutSize?: string | number;
  
  // 样式配置
  areaColor?: string;
  borderColor?: string;
  borderWidth?: number;
  itemStyle?: any;
  emphasisAreaColor?: string;
  emphasisItemStyle?: any;
  selectAreaColor?: string;
  selectItemStyle?: any;
  
  // 区域配置
  regions?: any[];
  
  // 定制化配置
  theme?: ThemeConfig;
  animation?: AnimationConfig;
  tooltip?: TooltipConfig;
  legend?: LegendConfig;
  
  // 扩展配置
  geoOptions?: any;
}

// Geo 数据接口
export interface GeoData {
  name: string;
  value: [number, number, number]; // [经度, 纬度, 数值]
  itemStyle?: any;
  label?: any;
  emphasis?: any;
}

// Geo 事件处理器接口
export interface GeoEventHandlers {
  onRegionClick?: (params: any) => void;
  onRegionDoubleClick?: (params: any) => void;
  onRegionMouseOver?: (params: any) => void;
  onRegionMouseOut?: (params: any) => void;
  onRegionSelect?: (params: any) => void;
}

// 系列配置接口
export interface GeoSeriesConfig {
  type?: 'scatter' | 'effectScatter' | 'lines' | 'map';
  data: GeoData[];
  symbolSize?: number | ((value: any) => number);
  itemStyle?: any;
  label?: any;
  emphasis?: any;
  options?: any;
}

// 主题配置接口
export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    border: string;
    area: string;
    emphasis: string;
    select: string;
  };
  fonts: {
    family: string;
    size: number;
    weight: string | number;
  };
  effects: {
    shadow: boolean;
    gradient: boolean;
    animation: boolean;
  };
}

// 动画配置接口
export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: string;
  delay?: number;
  type?: 'fadeIn' | 'slideIn' | 'zoomIn' | 'bounce';
}

// 提示框配置接口
export interface TooltipConfig {
  enabled: boolean;
  trigger: 'item' | 'axis' | 'none';
  formatter?: string | ((params: any) => string);
  backgroundColor?: string;
  borderColor?: string;
  textStyle?: any;
  position?: 'inside' | 'top' | 'left' | 'right' | 'bottom' | [number, number];
}

// 图例配置接口
export interface LegendConfig {
  enabled: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  orient: 'horizontal' | 'vertical';
  backgroundColor?: string;
  borderColor?: string;
  textStyle?: any;
  data: Array<{
    name: string;
    icon?: string;
    textStyle?: any;
  }>;
}

