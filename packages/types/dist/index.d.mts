interface MapConfig {
    name: string;
    center: [number, number];
    zoom: number;
}
interface DataPoint {
    name: string;
    value: [number, number, number];
}
interface GeoConfig {
    mapName: string;
    mapData?: any;
    center?: [number, number];
    zoom?: number;
    roam?: boolean | 'scale' | 'move';
    aspectScale?: number;
    layoutCenter?: [string | number, string | number];
    layoutSize?: string | number;
    areaColor?: string;
    borderColor?: string;
    borderWidth?: number;
    itemStyle?: any;
    emphasisAreaColor?: string;
    emphasisItemStyle?: any;
    selectAreaColor?: string;
    selectItemStyle?: any;
    regions?: any[];
    theme?: ThemeConfig;
    animation?: AnimationConfig;
    tooltip?: TooltipConfig;
    legend?: LegendConfig;
    geoOptions?: any;
}
interface GeoData {
    name: string;
    value: [number, number, number];
    itemStyle?: any;
    label?: any;
    emphasis?: any;
}
interface GeoEventHandlers {
    onRegionClick?: (params: any) => void;
    onRegionDoubleClick?: (params: any) => void;
    onRegionMouseOver?: (params: any) => void;
    onRegionMouseOut?: (params: any) => void;
    onRegionSelect?: (params: any) => void;
}
interface GeoSeriesConfig {
    type?: 'scatter' | 'effectScatter' | 'lines' | 'map';
    data: GeoData[];
    symbolSize?: number | ((value: any) => number);
    itemStyle?: any;
    label?: any;
    emphasis?: any;
    options?: any;
}
interface ThemeConfig {
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
interface AnimationConfig {
    enabled: boolean;
    duration: number;
    easing: string;
    delay?: number;
    type?: 'fadeIn' | 'slideIn' | 'zoomIn' | 'bounce';
}
interface TooltipConfig {
    enabled: boolean;
    trigger: 'item' | 'axis' | 'none';
    formatter?: string | ((params: any) => string);
    backgroundColor?: string;
    borderColor?: string;
    textStyle?: any;
    position?: 'inside' | 'top' | 'left' | 'right' | 'bottom' | [number, number];
}
interface LegendConfig {
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

export type { AnimationConfig, DataPoint, GeoConfig, GeoData, GeoEventHandlers, GeoSeriesConfig, LegendConfig, MapConfig, ThemeConfig, TooltipConfig };
