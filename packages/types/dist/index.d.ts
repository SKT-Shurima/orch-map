export { GeoJSONSourceInput } from 'echarts/types/src/coord/geo/geoTypes.js';
export { Feature, FeatureCollection, GeoJSON } from 'geojson';

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
    type: "Feature";
    properties: Record<string, unknown>;
    geometry: GeoJsonGeometry;
    id?: string | number;
    bbox?: [number, number, number, number];
    [key: string]: unknown;
}
interface GeoJsonGeometry {
    type: "Point" | "LineString" | "Polygon" | "MultiPoint" | "MultiLineString" | "MultiPolygon" | "GeometryCollection";
    coordinates: unknown[];
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

type ColorValue = [number, number, number] | [number, number, number, number] | string;
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
    name: string;
    coordinate: Coordinate;
    icon?: string;
    color?: ColorValue;
    opacity?: number;
    size?: number;
    label: {
        show: boolean;
        hoverShow: boolean;
        formatter: () => string;
    };
    tooltip?: string;
    siblingPointId?: string[];
    [key: string]: unknown;
}
interface BaseMapPoint3D extends Omit<BaseMapPoint, "coordinate"> {
    coordinate: Coordinate3D;
    height?: number;
    [key: string]: unknown;
}
interface BaseMapLine {
    id: string;
    startCoordinate: Coordinate;
    endCoordinate: Coordinate;
    color?: ColorValue;
    width?: number;
    style?: "solid" | "dashed" | "dotted";
    [key: string]: any;
}
interface BaseMapLine3D {
    id: string;
    startCoordinate: Coordinate3D;
    endCoordinate: Coordinate3D;
    color?: ColorValue;
    width?: number;
    style?: "solid" | "dashed" | "dotted";
    height?: number;
    [key: string]: any;
}
interface BaseMapArea {
    id: string;
    coordinates: Coordinate[];
    color?: ColorValue;
    fillColor?: ColorValue;
    strokeColor?: ColorValue;
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
    type: "geojson" | "vector" | "raster" | "image";
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
    [key: string]: unknown;
}
interface DataPoint {
    name: string;
    value: [number, number, number];
    properties?: Record<string, unknown>;
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
    [key: string]: unknown;
}
interface MapUpdateConfig {
    center?: Coordinate;
    zoom?: number;
    projection?: MapProjection;
    style?: MapStyle;
    interaction?: MapInteraction;
    [key: string]: unknown;
}
interface MapLevelConfig {
    level: MapLevel;
    center: Coordinate;
    zoom: number;
    minZoom?: number;
    maxZoom?: number;
    bounds?: [Coordinate, Coordinate];
    [key: string]: unknown;
}

export { type AnyObj, type BaseMapArea, type BaseMapLine, type BaseMapLine3D, type BaseMapPoint, type BaseMapPoint3D, type BoundingBox, type ColorValue, type Coordinate, type Coordinate3D, type CoordinateNumber, type DataPoint, type GeoJsonFeature, type GeoJsonGeometry, type HcTransform, type MapConfig, type MapDataSource, type MapEvent, type MapInitConfig, type MapInteraction, MapLevel, type MapLevelConfig, type MapProjection, MapRendererType, type MapStyle, type MapUpdateConfig };
