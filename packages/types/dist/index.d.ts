export { Feature, FeatureCollection } from 'geojson';

/**
 * @orch-map/types - 地图组件类型定义
 * 地理空间数据类型定义
 */
type Coordinate = [number, number];
type CoordinateNumber = [number, number];
type Coordinate3D = [number, number, number];
interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}
interface GeoJsonFeature {
    type: 'Feature';
    properties: Record<string, any>;
    geometry: GeoJsonGeometry;
    id?: string | number;
    bbox?: [number, number, number, number];
    [key: string]: any;
}
interface GeoJsonGeometry {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon' | 'GeometryCollection';
    coordinates: any;
    bbox?: [number, number, number, number];
}
interface HcTransform {
    default: {
        crs: string;
        scale: [number, number];
        translate: [number, number];
    };
}
interface MapProjection {
    name: string;
    center?: [number, number];
    scale?: number;
    translate?: [number, number];
    rotate?: [number, number, number];
}

declare enum MapLevel {
    WORLD = "world",
    COUNTRY = "country",
    PROVINCE = "province",
    CITY = "city",
    COUNTY = "county"
}
declare enum MapRendererType {
    ECHARTS = "echarts",
    DECKGL = "deckgl",
    LEAFLET = "leaflet",
    MAPBOX = "mapbox"
}
interface BaseMapPoint {
    id: string;
    coordinate: Coordinate;
    icon?: string;
    color?: [number, number, number, number];
    size?: number;
    label?: string;
    tooltip?: string;
    [key: string]: any;
}
interface BaseMapPoint3D {
    id: string;
    coordinate: Coordinate3D;
    icon?: string;
    color?: [number, number, number, number];
    size?: number;
    label?: string;
    tooltip?: string;
    height?: number;
    [key: string]: any;
}
interface BaseMapLine {
    id: string;
    startCoordinate: Coordinate;
    endCoordinate: Coordinate;
    color?: [number, number, number, number];
    width?: number;
    style?: 'solid' | 'dashed' | 'dotted';
    [key: string]: any;
}
interface BaseMapLine3D {
    id: string;
    startCoordinate: Coordinate3D;
    endCoordinate: Coordinate3D;
    color?: [number, number, number, number];
    width?: number;
    style?: 'solid' | 'dashed' | 'dotted';
    height?: number;
    [key: string]: any;
}
interface BaseMapArea {
    id: string;
    coordinates: Coordinate[];
    color?: [number, number, number, number];
    fillColor?: [number, number, number, number];
    strokeColor?: [number, number, number, number];
    strokeWidth?: number;
    opacity?: number;
    [key: string]: any;
}
interface MapEvent {
    type: string;
    coordinate?: Coordinate;
    feature?: any;
    originalEvent?: Event;
    [key: string]: any;
}
interface MapInteraction {
    zoom?: boolean;
    pan?: boolean;
    rotate?: boolean;
    pitch?: boolean;
    doubleClickZoom?: boolean;
    keyboard?: boolean;
    dragPan?: boolean;
    dragRotate?: boolean;
    scrollZoom?: boolean;
    touchZoom?: boolean;
    touchRotate?: boolean;
}
interface MapStyle {
    background?: string;
    opacity?: number;
    visibility?: boolean;
    [key: string]: any;
}
type AnyObj = Record<string, any>;
interface MapDataSource {
    id: string;
    type: 'geojson' | 'vector' | 'raster' | 'image';
    url?: string;
    data?: any;
    options?: Record<string, any>;
}

interface MapConfig {
    name: string;
    center: Coordinate;
    zoom: number;
    minZoom?: number;
    maxZoom?: number;
    projection?: MapProjection;
    renderer?: MapRendererType;
    interaction?: MapInteraction;
    style?: MapStyle;
    [key: string]: any;
}
interface DataPoint {
    name: string;
    value: [number, number, number];
    properties?: Record<string, any>;
}
interface MapInitConfig {
    container: string | HTMLElement;
    center?: Coordinate;
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    projection?: MapProjection;
    renderer?: MapRendererType;
    interaction?: MapInteraction;
    style?: MapStyle;
    width?: number | string;
    height?: number | string;
    [key: string]: any;
}
interface MapUpdateConfig {
    center?: Coordinate;
    zoom?: number;
    projection?: MapProjection;
    style?: MapStyle;
    interaction?: MapInteraction;
    [key: string]: any;
}
interface MapLevelConfig {
    level: MapLevel;
    center: Coordinate;
    zoom: number;
    minZoom?: number;
    maxZoom?: number;
    bounds?: [Coordinate, Coordinate];
    [key: string]: any;
}

export { type AnyObj, type BaseMapArea, type BaseMapLine, type BaseMapLine3D, type BaseMapPoint, type BaseMapPoint3D, type BoundingBox, type Coordinate, type Coordinate3D, type CoordinateNumber, type DataPoint, type GeoJsonFeature, type GeoJsonGeometry, type HcTransform, type MapConfig, type MapDataSource, type MapEvent, type MapInitConfig, type MapInteraction, MapLevel, type MapLevelConfig, type MapProjection, MapRendererType, type MapStyle, type MapUpdateConfig };
