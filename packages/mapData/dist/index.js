"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ChinaPathManager: () => ChinaPathManager,
  CountryCode: () => CountryCode,
  MapDataPathManager: () => MapDataPathManager,
  MapVersion: () => MapVersion,
  PathManagerFactory: () => PathManagerFactory,
  USPathManager: () => USPathManager,
  WorldPathManager: () => WorldPathManager,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);

// src/managers/WorldPathManager.ts
var MapVersion = /* @__PURE__ */ ((MapVersion2) => {
  MapVersion2["STANDARD"] = "standard";
  MapVersion2["INTERNATIONAL"] = "international";
  return MapVersion2;
})(MapVersion || {});
var WorldPathManager = class {
  /**
   * 获取世界地图数据路径
   *
   * @param {MapVersion} mapVersion - 地图版本
   * @returns {string} 世界地图数据相对路径
   */
  static getWorldMapPath(mapVersion = "standard" /* STANDARD */) {
    switch (mapVersion) {
      case "international" /* INTERNATIONAL */:
        return "world/wgs84_world_for_US.geo.json" /* WORLD_WGS84_FOR_US */;
      case "standard" /* STANDARD */:
      default:
        return "world/wgs84_world.geo.json" /* WORLD_WGS84 */;
    }
  }
  /**
   * 根据运行环境返回适当的基础路径
   *
   * @returns {string} 基础路径字符串
   */
  static getBasePath() {
    if (typeof window !== "undefined") {
      return "/mapData";
    } else {
      return "./data";
    }
  }
  /**
   * 获取完整的数据路径
   *
   * @param {string} relativePath - 相对路径
   * @returns {string} 完整的数据访问路径
   */
  static getFullPath(relativePath) {
    const basePath = this.getBasePath();
    return `${basePath}/${relativePath}`;
  }
};

// src/managers/ChinaPathManager.ts
var ChinaPathManager = class _ChinaPathManager {
  /**
   * 获取国家级别的地图数据路径
   *
   * @param {string} _country - 国家代码或名称（应该是 "China" 或 "100000"）
   * @returns {string} 国家地图数据相对路径
   */
  static getCountryPath(_country) {
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
  static getProvincePath(region) {
    const provinceCode = region.substring(0, 2);
    const isDirectCity = ["11", "12", "31", "50", "81", "82"].includes(provinceCode);
    if (isDirectCity) {
      return `china/${region}.json`;
    } else {
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
  static getCityPath(region) {
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
  static getCountyPath(region) {
    return _ChinaPathManager.getCityPath(region);
  }
  /**
   * 根据地图级别获取路径
   *
   * @param {MapLevel} level - 地图级别
   * @param {string} region - 区域代码或名称
   * @returns {string} 地图数据相对路径
   */
  static getPathByLevel(level, region) {
    switch (level) {
      case "country" /* COUNTRY */:
        return _ChinaPathManager.getCountryPath(region);
      case "province" /* PROVINCE */:
        return _ChinaPathManager.getProvincePath(region);
      case "city" /* CITY */:
        return _ChinaPathManager.getCityPath(region);
      case "county" /* COUNTY */:
        return _ChinaPathManager.getCountyPath(region);
      default:
        return "";
    }
  }
};

// src/managers/usaStateMap.ts
var usaStateMap_default = {
  "Alabama": "al",
  "Alaska": "ak",
  "Arizona": "az",
  "Arkansas": "ar",
  "California": "ca",
  "Colorado": "co",
  "Connecticut": "ct",
  "Delaware": "de",
  "District of Columbia": "dc",
  "Florida": "fl",
  "Georgia": "ga",
  "Hawaii": "hi",
  "Idaho": "id",
  "Illinois": "il",
  "Indiana": "in",
  "Iowa": "ia",
  "Kansas": "ks",
  "Kentucky": "ky",
  "Louisiana": "la",
  "Maine": "me",
  "Maryland": "md",
  "Massachusetts": "ma",
  "Michigan": "mi",
  "Minnesota": "mn",
  "Mississippi": "ms",
  "Missouri": "mo",
  "Montana": "mt",
  "Nebraska": "ne",
  "Nevada": "nv",
  "New Hampshire": "nh",
  "New Jersey": "nj",
  "New Mexico": "nm",
  "New York": "ny",
  "North Carolina": "nc",
  "North Dakota": "nd",
  "Ohio": "oh",
  "Oklahoma": "ok",
  "Oregon": "or",
  "Pennsylvania": "pa",
  "Puerto Rico": "pr",
  "Rhode Island": "ri",
  "South Carolina": "sc",
  "South Dakota": "sd",
  "Tennessee": "tn",
  "Texas": "tx",
  "Utah": "ut",
  "Vermont": "vt",
  "Virginia": "va",
  "Washington": "wa",
  "West Virginia": "wv",
  "Wisconsin": "wi",
  "Wyoming": "wy"
};

// src/managers/USPathManager.ts
var USPathManager = class _USPathManager {
  /**z
   * 获取国家级别的地图数据路径
   *
   * @param {string} _country - 国家代码或名称（应该是 "USA" 或 "840"）
   * @returns {string} 国家地图数据相对路径
   */
  static getCountryPath(_country) {
    return "countries/us-all.geo.json";
  }
  /**
   * 获取省级地图数据路径（美国州级）
   *
   * 支持州名或州代码作为输入，自动通过 usa-state-map 映射
   * 例如："California" -> "ca" -> "usa/states/ca.json"
   *       "CA" -> "ca" -> "usa/states/ca.json"
   *
   * @param {string} region - 州名或州代码（如 "California", "CA", "New York", "NY"）
   * @returns {string} 州级地图数据相对路径
   */
  static getProvincePath(region) {
    let stateCode = "";
    for (const [stateName, code] of Object.entries(usaStateMap_default)) {
      if (stateName.toLowerCase() === region.toLowerCase()) {
        stateCode = code;
        break;
      }
      if (code.toLowerCase() === region.toLowerCase()) {
        stateCode = code;
        break;
      }
    }
    stateCode = stateCode || region.toLowerCase();
    return `usa/${stateCode}.geo.json`;
  }
  /**
   * 获取城市级地图数据路径
   *
   * @param {string} region - 城市区域代码或名称
   * @returns {string} 城市级地图数据相对路径
   */
  static getCityPath(region) {
    const stateCode = region.slice(0, 3).split("-")[0];
    const cityName = region.slice(3);
    return `usa/${stateCode}/${cityName}.geo.json`;
  }
  /**
   * 获取县级地图数据路径
   *
   * @param {string} region - 县级区域代码或名称
   * @returns {string} 县级地图数据相对路径
   */
  static getCountyPath(_region) {
    return "";
  }
  /**
   * 根据地图级别获取路径
   *
   * @param {MapLevel} level - 地图级别
   * @param {string} region - 区域代码或名称
   * @returns {string} 地图数据相对路径
   */
  static getPathByLevel(level, region) {
    switch (level) {
      case "country" /* COUNTRY */:
        return _USPathManager.getCountryPath(region);
      case "province" /* PROVINCE */:
        return _USPathManager.getProvincePath(region);
      case "city" /* CITY */:
        return _USPathManager.getCityPath(region);
      case "county" /* COUNTY */:
        return _USPathManager.getCountyPath(region);
      default:
        return "";
    }
  }
};

// src/countryMapFile.ts
var countryMapFile_default = {
  // 有数据文件的国家（按字母顺序排列）
  "Canada": "ca-all",
  "France": "fr-all",
  "Germany": "de-all",
  "India": "in-all",
  "Japan": "jp-all",
  "Korea": "kr-all",
  "Russia": "ru-all",
  "Singapore": "sg-all",
  "United Kingdom": "uk-all",
  "United States": "us-all",
  // 没有数据文件的国家（按字母顺序排列）
  "Afghanistan": null,
  "Albania": null,
  "Algeria": null,
  "American Samoa": null,
  "Andorra": null,
  "Angola": null,
  "Antigua and Barb.": null,
  "Argentina": null,
  "Armenia": null,
  "Austria": null,
  "Azerbaijan": null,
  "Bahamas": null,
  "Bahrain": null,
  "Bangladesh": null,
  "Barbados": null,
  "Belarus": null,
  "Belgium": null,
  "Belize": null,
  "Benin": null,
  "Bhutan": null,
  "Bolivia": null,
  "Bosnia and Herz.": null,
  "Botswana": null,
  "Brazil": null,
  "Brunei": null,
  "Bulgaria": null,
  "Burkina Faso": null,
  "Burundi": null,
  "Cambodia": null,
  "Cameroon": null,
  "Cape Verde": null,
  "Central African Rep.": null,
  "Chad": null,
  "Chile": null,
  "China": null,
  "Colombia": null,
  "Comoros": null,
  "Congo": null,
  "Costa Rica": null,
  "Croatia": null,
  "Cuba": null,
  "Cyprus": null,
  "Czech Rep.": null,
  "C\xF4te d'Ivoire": null,
  "Dem. Rep. Congo": null,
  "Dem. Rep. Korea": null,
  "Denmark": null,
  "Djibouti": null,
  "Dominica": null,
  "Dominican Rep.": null,
  "Ecuador": null,
  "Egypt": null,
  "El Salvador": null,
  "Eq. Guinea": null,
  "Eritrea": null,
  "Estonia": null,
  "Ethiopia": null,
  "Faeroe Is.": null,
  "Fiji": null,
  "Finland": null,
  "Gabon": null,
  "Gambia": null,
  "Georgia": null,
  "Ghana": null,
  "Greece": null,
  "Greenland": null,
  "Grenada": null,
  "Guam": null,
  "Guatemala": null,
  "Guinea": null,
  "Guinea-Bissau": null,
  "Guyana": null,
  "Haiti": null,
  "Honduras": null,
  "Hungary": null,
  "Iceland": null,
  "Indonesia": null,
  "Iran": null,
  "Iraq": null,
  "Ireland": null,
  "Israel": null,
  "Italy": null,
  "Jamaica": null,
  "Jordan": null,
  "Kazakhstan": null,
  "Kenya": null,
  "Kiribati": null,
  "Kosovo": null,
  "Kuwait": null,
  "Kyrgyzstan": null,
  "Lao PDR": null,
  "Latvia": null,
  "Lebanon": null,
  "Lesotho": null,
  "Liberia": null,
  "Libya": null,
  "Liechtenstein": null,
  "Lithuania": null,
  "Luxembourg": null,
  "Macedonia": null,
  "Madagascar": null,
  "Malawi": null,
  "Malaysia": null,
  "Mali": null,
  "Malta": null,
  "Mauritania": null,
  "Mauritius": null,
  "Mexico": null,
  "Moldova": null,
  "Monaco": null,
  "Mongolia": null,
  "Montenegro": null,
  "Morocco": null,
  "Mozambique": null,
  "Myanmar": null,
  "N. Mariana Is.": null,
  "Namibia": null,
  "Nauru": null,
  "Nepal": null,
  "Netherlands": null,
  "New Caledonia": null,
  "New Zealand": null,
  "Nicaragua": null,
  "Niger": null,
  "Nigeria": null,
  "Norway": null,
  "Oman": null,
  "Pakistan": null,
  "Palau": null,
  "Panama": null,
  "Papua New Guinea": null,
  "Paraguay": null,
  "Peru": null,
  "Philippines": null,
  "Poland": null,
  "Portugal": null,
  "Puerto Rico": null,
  "Qatar": null,
  "Romania": null,
  "Rwanda": null,
  "S. Sudan": null,
  "Saint Lucia": null,
  "Samoa": null,
  "San Marino": null,
  "Saudi Arabia": null,
  "Senegal": null,
  "Serbia": null,
  "Seychelles": null,
  "Sierra Leone": null,
  "Sint Maarten": null,
  "Slovakia": null,
  "Slovenia": null,
  "Solomon Is.": null,
  "Somalia": null,
  "South Africa": null,
  "Spain": null,
  "Sri Lanka": null,
  "St. Kitts and Nevis": null,
  "St. Vin. and Gren.": null,
  "Sudan": null,
  "Suriname": null,
  "Swaziland": null,
  "Sweden": null,
  "Switzerland": null,
  "Syria": null,
  "S\xE3o Tom\xE9 and Principe": null,
  "Tajikistan": null,
  "Tanzania": null,
  "Thailand": null,
  "Timor-Leste": null,
  "Togo": null,
  "Trinidad and Tobago": null,
  "Tunisia": null,
  "Turkey": null,
  "Turkmenistan": null,
  "U.S. Virgin Is.": null,
  "Uganda": null,
  "Ukraine": null,
  "United Arab Emirates": null,
  "Uruguay": null,
  "Uzbekistan": null,
  "Vanuatu": null,
  "Venezuela": null,
  "Vietnam": null,
  "W. Sahara": null,
  "Yemen": null,
  "Zambia": null,
  "Zimbabwe": null
};

// src/managers/PathManagerFactory.ts
var CountryCode = /* @__PURE__ */ ((CountryCode2) => {
  CountryCode2["CHINA"] = "100000";
  CountryCode2["CHINA_NAME"] = "China";
  CountryCode2["USA"] = "840";
  CountryCode2["USA_NAME"] = "USA";
  CountryCode2["JAPAN"] = "392";
  CountryCode2["RUSSIA"] = "643";
  return CountryCode2;
})(CountryCode || {});
var PathManagerFactory = class {
  /**
   * 判断国家是否为中国
   *
   * @param {string} country - 国家代码或名称
   * @returns {boolean} 是否为中国
   */
  static isChina(country) {
    return country === "100000" /* CHINA */ || country === "China" /* CHINA_NAME */ || country === "CN";
  }
  /**
   * 判断国家是否为美国
   *
   * @param {string} country - 国家代码或名称
   * @returns {boolean} 是否为美国
   */
  static isUSA(country) {
    return country === "840" /* USA */ || country === "USA" /* USA_NAME */ || country === "US" || country === "United States";
  }
  /**
   * 获取国家地图路径
   *
   * @param {string} country - 国家代码或名称
   * @returns {string} 国家地图数据相对路径
   */
  static getCountryPath(country) {
    if (this.isChina(country)) {
      return ChinaPathManager.getCountryPath(country);
    }
    if (this.isUSA(country)) {
      return USPathManager.getCountryPath(country);
    }
    const countryFile = countryMapFile_default[country];
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
  static getProvincePath(country, region) {
    if (this.isChina(country)) {
      return ChinaPathManager.getProvincePath(region);
    }
    if (this.isUSA(country)) {
      return USPathManager.getProvincePath(region);
    }
    return "";
  }
  /**
   * 获取城市级地图路径
   *
   * @param {string} country - 国家代码或名称
   * @param {string} region - 城市区域代码或名称
   * @returns {string} 城市级地图数据相对路径
   */
  static getCityPath(country, region) {
    if (this.isChina(country)) {
      return ChinaPathManager.getCityPath(region);
    }
    if (this.isUSA(country)) {
      return USPathManager.getCityPath(region);
    }
    return "";
  }
  /**
   * 获取县级地图路径
   *
   * @param {string} country - 国家代码或名称
   * @param {string} region - 县级区域代码或名称
   * @returns {string} 县级地图数据相对路径
   */
  static getCountyPath(country, region) {
    if (this.isChina(country)) {
      return ChinaPathManager.getCountyPath(region);
    }
    if (this.isUSA(country)) {
      return USPathManager.getCountyPath(region);
    }
    return "";
  }
  /**
   * 检查是否为支持的国家
   *
   * @param {string} country - 国家代码或名称
   * @returns {boolean} 是否为支持的国家
   */
  static isSupportedCountry(country) {
    return country !== "";
  }
};

// src/pathManager.ts
var MapDataPathManager = class {
  /**
   * 获取地图数据的基础路径
   * 根据运行环境返回适当的基础路径
   *
   * @returns {string} 基础路径字符串
   */
  static getBasePath() {
    return WorldPathManager.getBasePath();
  }
  /**
   * 根据参数生成数据路径
   *
   * @param {Object} params - 路径生成参数
   * @param {MapLevel} params.currentLevel - 当前地图级别
   * @param {string} params.region - 区域代码或名称
   * @param {string} params.country - 国家代码或名称
   * @param {MapVersion} params.mapVersion - 地图版本（仅用于世界和国家级别）
   * @returns {string} 相对路径字符串
   */
  static generateDataPath(params) {
    const { currentLevel, region, country, mapVersion = "standard" /* STANDARD */ } = params;
    switch (currentLevel) {
      case "world" /* WORLD */:
        return WorldPathManager.getWorldMapPath(mapVersion);
      case "country" /* COUNTRY */:
        if (country === "China" || country === "100000") {
          if (mapVersion === "international" /* INTERNATIONAL */) {
            return "countries/cn-all.geo.json";
          }
        }
        return PathManagerFactory.getCountryPath(country);
      case "province" /* PROVINCE */:
        return PathManagerFactory.getProvincePath(country, region);
      case "city" /* CITY */:
        return PathManagerFactory.getCityPath(country, region);
      case "county" /* COUNTY */:
        return PathManagerFactory.getCountyPath(country, region);
      default:
        return "";
    }
  }
  /**
   * 获取完整的数据路径
   *
   * @param {string} relativePath - 相对路径
   * @returns {string} 完整的数据访问路径
   */
  static getFullPath(relativePath) {
    return WorldPathManager.getFullPath(relativePath);
  }
};

// src/dataService.ts
var MapDataService = class _MapDataService {
  /**
   * 检查 geo JSON 文件是否存在
   * @param path - 相对路径
   * @returns {Promise<boolean>} 文件是否存在
   */
  static async checkGeoJsonExists(path) {
    if (!path) {
      return false;
    }
    try {
      const fullPath = MapDataPathManager.getFullPath(path);
      const response = await fetch(fullPath, { method: "HEAD" });
      return response.ok;
    } catch (error) {
      console.error(`Failed to check geo JSON file exists: ${path}:`, error);
      return false;
    }
  }
  /**
   * 根据路径获取地图数据
   */
  static async getMapData(path) {
    let data;
    try {
      const fullPath = MapDataPathManager.getFullPath(path);
      const response = await fetch(fullPath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      data = await response.json();
    } catch (error) {
      console.error(`Failed to fetch map data from ${path}:`, error);
      return {
        type: "FeatureCollection",
        features: []
      };
    }
    return data || {
      type: "FeatureCollection",
      features: []
    };
  }
  /**
   * 检查是否可以为指定的参数获取 geo JSON 数据
   * @param params - 地图数据获取参数
   * @returns {Promise<boolean>} 数据是否存在
   */
  static async checkGeoJsonExistsForParams(params) {
    const path = MapDataPathManager.generateDataPath({
      currentLevel: params.mapLevel,
      country: params.country,
      region: params.region
    });
    if (!path) {
      return false;
    }
    return await _MapDataService.checkGeoJsonExists(path);
  }
  /**
  * 获取地图 GeoJSON 数据（对外接口，合并了 fetchGeoJson 和 getGeoJsonData）
  */
  static async getGeoJsonData(params) {
    const path = MapDataPathManager.generateDataPath({
      currentLevel: params.mapLevel,
      country: params.country,
      region: params.region
    });
    if (!path) {
      throw new Error("Detail data path not found");
    }
    return await _MapDataService.getMapData(path);
  }
};

// src/index.ts
var index_default = MapDataService;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChinaPathManager,
  CountryCode,
  MapDataPathManager,
  MapVersion,
  PathManagerFactory,
  USPathManager,
  WorldPathManager
});
//# sourceMappingURL=index.js.map