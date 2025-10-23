/**
 * 模块：图层通用类型定义
 * 说明：定义所有图层相关的通用类型，避免重复定义
 */

/**
 * 图层更新回调函数类型
 */
export type LayerUpdateCallback = (layerId: string, layer: unknown) => void;

/**
 * 图层移除回调函数类型
 */
export type LayerRemoveCallback = (layerId: string) => void;
