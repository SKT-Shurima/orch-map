import type { AnyObj } from "@orch-map/types";
import { MUNICIPALITY_CODES } from "../constants";

/**
 * @description: 地图辅助工具
 * 包含各种辅助功能
 */

/**
 * @description: 将设备状态枚举值转换为排序值，方便排序使用
 * @param status - 设备状态
 * @return 排序值
 */
export const convertDeviceStatus2Order = (status: AnyObj | string): number => {
  const normalized = typeof status === "string" ? status.toUpperCase() : String(status).toUpperCase();
  switch (normalized) {
    case "ACTIVE":
    case "ONLINE":
      return 1;
    case "PENDING":
    case "SUSPENDED":
    case "OFFLINE":
    case "WARNING":
    case "ERROR":
      return 2;
    default:
      return 0;
  }
};

/**
 * @description: 将地区名称中带有 "市"、"省"、"自治区"、"特别行政区"、"地区"、"盟"、"州"、"县"、"区" 的地区名称去掉
 * 因为在地图的数据中带有这些后缀的地区名称，而后端返回的地区名称不一定带有这些后缀，所以需要去掉
 * 否则找不到对应的地区信息
 * @param region - 地区名称
 * @returns 去掉后缀的地区名称
 */
export const removeRegionSuffix = (region: string): string => {
  return region.replace(/市|省|自治区|特别行政区|地区|盟|州|县|区/g, "");
};


/**
   * 判断是否为直辖市
   * @param postcode - 行政区划代码
   * @returns 是否为直辖市
   */
export const isMunicipality = (postcode: string): boolean => {
  return MUNICIPALITY_CODES.has(postcode);
};
