/**
 * 地理数据相关常量
 */

/**
 * 中国行政区划代码
 */
export const CHINA_AD_CODE_JUST_FOR_FE = "100000";

/**
 * 美国行政区划代码
 */
export const US_AD_CODE_JUST_FOR_FE = "us";

/**
 * 直辖市代码集合（北京、天津、上海、重庆）
 */
export const MUNICIPALITY_CODES = new Set(["110000", "120000", "310000", "500000"]);

/**
 * 支持下一级地图的国家代码列表
 */
export const JUST_SUPPORTED_NEXT_LEVEL_COUNTRIES_AD_CODE = [CHINA_AD_CODE_JUST_FOR_FE, US_AD_CODE_JUST_FOR_FE];

/**
 * 国家名称常量
 */
export const G2 = { CHINA: "中国", USA: "美国" } as const;

