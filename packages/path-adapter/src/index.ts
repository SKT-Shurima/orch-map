/**
 * @fileoverview @orch-map/path-adapter - Map Data Path Adapter
 *
 * 地图数据路径适配器
 *
 * ⚠️ 重要说明：
 * - 此包负责提供地图数据的路径管理和数据获取服务
 * - 必须与 @orch-map/geo-json 项目配合使用才能正常工作
 * - 实际的地图 GeoJSON 数据文件存储在 @orch-map/geo-json 项目中
 *
 * 依赖关系：
 * - 此包提供路径适配逻辑和数据获取接口
 * - @orch-map/geo-json 提供实际的静态 GeoJSON 数据文件
 *
 * @see https://github.com/SKT-Shurima/map-geo-json
 */

// 导出类型定义
export * from "./types";

// 导出路径管理器
export { MapDataPathManager } from "./pathManager";
export { MapVersion } from "./managers";

// 导出各个路径管理器（供高级用法）
export * from "./managers";

import MapDataService from "./dataService";
export default MapDataService;
