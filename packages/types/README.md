# @orch-map/types

Pure TypeScript type definitions for the orch-map library.

## Installation

```bash
npm install @orch-map/types
# or
yarn add @orch-map/types
# or
pnpm add @orch-map/types
```

## Usage

```typescript
import {
  Coordinate,
  GeoJsonData,
  BaseMapPoint,
  MapConfig,
  MapLevel,
  MapRendererType,
} from '@orch-map/types';

// Define a map point
const point: BaseMapPoint = {
  id: 'point-1',
  coordinate: [116.3974, 39.9093], // Beijing coordinates
  color: [255, 0, 0, 1], // Red color with full opacity
  size: 10,
  label: 'Beijing',
};

// Define map configuration
const mapConfig: MapConfig = {
  name: 'China Map',
  center: [116.3974, 39.9093],
  zoom: 5,
  renderer: MapRendererType.ECHARTS,
  level: MapLevel.COUNTRY,
};

// Work with GeoJSON data
const geoData: GeoJsonData = {
  type: 'FeatureCollection',
  features: [
    // ... your features
  ],
};
```

## Available Types

### Geographic Types

- `Coordinate` - 2D coordinate [longitude, latitude]
- `Coordinate3D` - 3D coordinate [longitude, latitude, height]
- `BoundingBox` - Geographic bounding box
- `GeoJsonData` - GeoJSON FeatureCollection
- `GeoJsonFeature` - GeoJSON Feature
- `GeoJsonGeometry` - GeoJSON Geometry
- `MapProjection` - Map projection configuration

### Map Types

- `BaseMapPoint` - 2D map point
- `BaseMapPoint3D` - 3D map point
- `BaseMapLine` - 2D map line
- `BaseMapLine3D` - 3D map line
- `BaseMapArea` - Map area/polygon
- `MapEvent` - Map interaction events
- `MapInteraction` - Map interaction configuration
- `MapStyle` - Map styling configuration
- `MapDataSource` - Map data source configuration

### Configuration Types

- `MapConfig` - Basic map configuration
- `MapInitConfig` - Map initialization configuration
- `MapUpdateConfig` - Map update configuration
- `MapLevelConfig` - Map level configuration
- `DataPoint` - Data point for visualization

### Enums

- `MapLevel` - Map zoom levels (WORLD, COUNTRY, PROVINCE, CITY, COUNTY)
- `MapRendererType` - Supported renderers (ECHARTS, DECKGL, LEAFLET, MAPBOX)

## Development

This package contains only TypeScript type definitions and generates declaration files (.d.ts) only. No runtime code is included.

### Build

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

### Clean

```bash
npm run clean
```
