import { ChinaPathManager } from "./ChinaPathManager";
import { USPathManager } from "./USPathManager";
import countryMapFile from "../countryMapFile";

/**
 * 国家代码映射
 */
export enum CountryCode {
  CHINA = "100000",
  CHINA_NAME = "China",
  USA = "840",
  USA_NAME = "USA",
  // 可以继续添加其他国家
  JAPAN = "392",
  RUSSIA = "643",
}

/**
 * 路径管理器工厂（静态类）
 * 提供静态方法根据国家路由到对应的路径管理器
 */
export class PathManagerFactory {
  /**
   * 判断国家是否为中国
   *
   * @param {string} country - 国家代码或名称
   * @returns {boolean} 是否为中国
   */
  public static isChina(country: string): boolean {
    return (
      country === CountryCode.CHINA ||
      country === CountryCode.CHINA_NAME ||
      country === "CN"
    );
  }

  /**
   * 判断国家是否为美国
   *
   * @param {string} country - 国家代码或名称
   * @returns {boolean} 是否为美国
   */
  public static isUSA(country: string): boolean {
    return (
      country === CountryCode.USA ||
      country === CountryCode.USA_NAME ||
      country === "US" ||
      country === "United States"
    );
  }

  /**
   * 获取国家地图路径
   *
   * @param {string} country - 国家代码或名称
   * @returns {string} 国家地图数据相对路径
   */
  public static getCountryPath(country: string): string {
    if (this.isChina(country)) {
      return ChinaPathManager.getCountryPath(country);
    }

    if (this.isUSA(country)) {
      return USPathManager.getCountryPath(country);
    }

    // 通用国家处理
    const countryFile = countryMapFile[country as keyof typeof countryMapFile];
    if (countryFile) {
      return `countries/${countryFile}.geo.json`;
    }
    return "";
  }

  /**
   * 获取省级地图路径
   *
   * @param {string} country - 国家代码或名称
   * @param {string} region - 省级区域代码或名称
   * @returns {string} 省级地图数据相对路径
   */
  public static getProvincePath(country: string, region: string): string {
    if (this.isChina(country)) {
      return ChinaPathManager.getProvincePath(region);
    }

    if (this.isUSA(country)) {
      return USPathManager.getProvincePath(region);
    }

    // 通用国家暂时不支持省级数据
    return "";
  }

  /**
   * 获取城市级地图路径
   *
   * @param {string} country - 国家代码或名称
   * @param {string} region - 城市区域代码或名称
   * @returns {string} 城市级地图数据相对路径
   */
  public static getCityPath(country: string, region: string): string {
    if (this.isChina(country)) {
      return ChinaPathManager.getCityPath(region);
    }

    if (this.isUSA(country)) {
      return USPathManager.getCityPath(region);
    }

    // 通用国家暂时不支持城市级数据
    return "";
  }

  /**
   * 获取县级地图路径
   *
   * @param {string} country - 国家代码或名称
   * @param {string} region - 县级区域代码或名称
   * @returns {string} 县级地图数据相对路径
   */
  public static getCountyPath(country: string, region: string): string {
    if (this.isChina(country)) {
      return ChinaPathManager.getCountyPath(region);
    }

    if (this.isUSA(country)) {
      return USPathManager.getCountyPath(region);
    }

    // 通用国家暂时不支持县级数据
    return "";
  }

  /**
   * 检查是否为支持的国家
   *
   * @param {string} country - 国家代码或名称
   * @returns {boolean} 是否为支持的国家
   */
  public static isSupportedCountry(country: string): boolean {
    return country !== "";
  }
}

