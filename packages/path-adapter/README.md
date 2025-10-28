# @orch-map/path-adapter

地图数据路径适配器 - 为 orch-map 提供地图数据的路径管理和数据获取服务。

## ⚠️ 重要提示

此包是**路径适配器包**，不包含实际的地图数据。必须配合 **[@orch-map/geo-json](https://github.com/SKT-Shurima/map-geo-json)** 项目使用。

## 功能说明

### 职责划分

- **@orch-map/path-adapter** (本包):
  - ✅ 提供路径生成逻辑
  - ✅ 处理不同国家/地区的路径规则
  - ✅ 提供数据获取接口
  - ❌ 不包含实际的地图数据

- **[@orch-map/geo-json](https://github.com/SKT-Shurima/map-geo-json)** (外部项目):
  - ✅ 存储实际的 GeoJSON 数据文件
  - ✅ 维护静态地图数据
  - ✅ 提供数据处理脚本

## 安装

```bash
npm install @orch-map/path-adapter
```

同时需要配置地图数据源：

### 开发环境

```bash
# 克隆或链接 map-geo-json 项目
git clone https://github.com/SKT-Shurima/map-geo-json.git

# 在 orch-map 项目根目录创建符号链接
ln -sf /path/to/map-geo-json/data ./mapData
```

### 生产环境

将 map-geo-json 的数据部署到静态资源服务器，确保可以通过 `/mapData` 路径访问。

## 使用方法

```typescript
import MapDataService, {
  MapDataPathManager,
  MapVersion,
} from '@orch-map/path-adapter';
import { MapLevel } from '@orch-map/types';

// 获取中国地图数据
const chinaData = await MapDataService.getGeoJsonData({
  mapLevel: MapLevel.COUNTRY,
  country: 'China',
  region: '',
});

// 获取省级地图数据
const provinceData = await MapDataService.getGeoJsonData({
  mapLevel: MapLevel.PROVINCE,
  country: 'China',
  region: '330000', // 浙江省
});

// 获取世界地图数据
const worldPath = MapDataPathManager.generateDataPath({
  currentLevel: MapLevel.WORLD,
  country: '',
  region: '',
  mapVersion: MapVersion.STANDARD,
});
```

## 架构设计

```
orch-map (主项目)
├── packages/
│   └── path-adapter/     # 本包 - 路径适配器
│       └── src/
│           ├── pathManager.ts      # 路径管理器
│           ├── dataService.ts      # 数据服务
│           └── managers/           # 各国路径管理器
└── mapData (符号链接) → /path/to/map-geo-json/data

map-geo-json (独立项目)
├── data/                 # GeoJSON 数据文件
│   ├── world/
│   ├── countries/
│   ├── china/
│   └── usa/
└── scripts/              # 数据处理脚本
```

## 支持的地图

- ✅ 世界地图
- ✅ 中国（省、市、县）
- ✅ 美国（州、县）
- ✅ 其他国家（通过 countries 目录）

## 配置说明

### 基础路径

在浏览器环境中，数据从 `/mapData` 路径获取。

在 Node.js 环境中，数据从 `./mapData` 相对路径获取。

### 自定义路径

如果需要自定义数据路径，可以修改 `WorldPathManager.getBasePath()` 方法：

```typescript
// packages/path-adapter/src/managers/WorldPathManager.ts
public static getBasePath(): string {
  // 自定义基础路径
  return "/your-custom-path";
}
```

## 相关文档

- [设置说明](./SETUP.md) - 详细的安装和配置步骤
- [路径管理器架构](./src/managers/README.md) - 路径管理器的详细说明

## 许可证

MIT

## 相关项目

- [@orch-map/geo-json](https://github.com/SKT-Shurima/map-geo-json) - 地图数据源项目
