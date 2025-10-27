// 导出类型定义
export * from "./types";

// 导出路径管理器
export { MapDataPathManager } from "./pathManager";
export { MapVersion } from "./managers";

// 导出各个路径管理器（供高级用法）
export * from "./managers";

import MapDataService from "./dataService";
export default MapDataService;
