# @orch-map/path-adapter 设置说明

## 包说明

`@orch-map/path-adapter` 是一个**路径适配器包**，提供地图数据的路径管理和数据获取服务。

⚠️ **重要提示**: 此包必须与 `@orch-map/geo-json` 项目配合使用才能正常工作。

## 架构说明

### 职责划分

- **@orch-map/path-adapter** (本包):
  - 提供路径生成逻辑
  - 处理不同国家/地区的路径规则
  - 提供数据获取接口

- **@orch-map/geo-json** (外部项目):
  - 存储实际的 GeoJSON 数据文件
  - 维护静态地图数据
  - 提供数据处理脚本

### 数据源分离

地图数据已分离到独立的 `map-geo-json` 项目中。

## 设置步骤

### 1. 确保 map-geo-json 项目存在

数据目录位于：`~/lightwan/project/map-geo-json/data`

### 2. 创建符号链接（推荐用于开发）

在项目根目录创建符号链接，使 `mapData` 目录指向外部项目：

```bash
# 在 orch-map 项目根目录执行
ln -sf ~/lightwan/project/map-geo-json/data ./mapData
```

### 3. 生产环境配置

在生产环境中，数据应该作为静态资源部署。可以通过以下方式：

1. **使用 CDN**: 将 map-geo-json 的数据部署到 CDN
2. **符号链接**: 在生产服务器上创建符号链接
3. **环境变量**: 配置数据源路径

### 4. Vite 开发服务器

`examples/vite.config.ts` 已经配置为从外部项目读取数据：

```typescript
const mapDataDir = path.resolve(__dirname, '../../map-geo-json/data');
```

## 文件说明

- `countries.json` 已保留在 `src/` 目录中
- `data/` 和 `scripts/` 目录已移动到 `map-geo-json` 项目

## 注意事项

⚠️ **必须项**:

- 确保 `map-geo-json` 项目与 `orch-map` 项目在同一父目录下（`~/lightwan/project/`）
- 必须创建符号链接或配置正确的数据路径，否则将无法加载地图数据

⚠️ **如果数据路径不同**:

- 需要修改 `WorldPathManager.getBasePath()` 的返回值

## 使用方式

```typescript
import MapDataService from '@orch-map/path-adapter';

// 获取地图数据（自动从 @orch-map/geo-json 加载）
const data = await MapDataService.getGeoJsonData({
  mapLevel: MapLevel.COUNTRY,
  country: 'China',
  region: '',
});
```
