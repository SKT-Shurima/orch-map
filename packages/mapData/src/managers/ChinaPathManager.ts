import { MapLevel } from "@orch-map/types";

/**
 * 中国地图路径管理器（静态类）
 * 负责处理中国地图的特殊数据结构和路径规则
 */
export class ChinaPathManager {
  /**
   * 获取国家级别的地图数据路径
   *
   * @param {string} _country - 国家代码或名称（应该是 "China" 或 "100000"）
   * @returns {string} 国家地图数据相对路径
   */
  public static getCountryPath(_country: string): string {
    return "china/100000.json";
  }

  /**
   * 获取省级地图数据路径
   *
   * 中国省份使用6位数字编码（前两位表示省）
   * 直辖市（11-北京, 12-天津, 31-上海, 50-重庆, 81-香港, 82-澳门）文件在 china/ 目录下
   * 其他省份文件在 china/xxxxx/xxxxxx.json 目录下
   *
   * @param {string} region - 省级区域代码（如 "110000"）
   * @returns {string} 省级地图数据相对路径
   */
  public static getProvincePath(region: string): string {
    // 判断是否为直辖市或特别行政区（11/12/31/50/81/82开头）
    const provinceCode = region.substring(0, 2);
    const isDirectCity = ["11", "12", "31", "50", "81", "82"].includes(provinceCode);

    if (isDirectCity) {
      // 直辖市：直接在 china/ 目录下
      return `china/${region}.json`;
    } else {
      // 普通省份：在省级目录下
      return `china/${region}/${region}.json`;
    }
  }

  /**
   * 获取城市级地图数据路径
   *
   * 中国城市使用6位数字编码（前四位表示省+市）
   * 例如：110100 - 北京市（北京直辖市的区县）
   *       330100 - 杭州市
   *
   * @param {string} region - 城市区域代码（如 "110100"）
   * @returns {string} 城市级地图数据相对路径
   */
  public static getCityPath(region: string): string {
    // 中国城市级数据：在省级目录下
    // 例如：china/130000/130100.json
    if (region.length === 6) {
      const provinceCode = `${region.substring(0, 2)}0000`;
      return `china/${provinceCode}/${region}.json`;
    }
    return `china/${region}.json`;
  }

  /**
   * 获取县级地图数据路径
   *
   * 中国县级使用6位数字编码
   * 例如：110101 - 东城区
   *
   * @param {string} region - 县级区域代码（如 "110101"）
   * @returns {string} 县级地图数据相对路径
   */
  public static getCountyPath(region: string): string {
    // 中国县级数据：也在省级目录下
    // 格式与城市级相同
    return ChinaPathManager.getCityPath(region);
  }

  /**
   * 根据地图级别获取路径
   *
   * @param {MapLevel} level - 地图级别
   * @param {string} region - 区域代码或名称
   * @returns {string} 地图数据相对路径
   */
  public static getPathByLevel(level: MapLevel, region: string): string {
    switch (level) {
      case MapLevel.COUNTRY:
        return ChinaPathManager.getCountryPath(region);
      case MapLevel.PROVINCE:
        return ChinaPathManager.getProvincePath(region);
      case MapLevel.CITY:
        return ChinaPathManager.getCityPath(region);
      case MapLevel.COUNTY:
        return ChinaPathManager.getCountyPath(region);
      default:
        return "";
    }
  }
}

