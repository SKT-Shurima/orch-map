/**
 * @description: 在世界地图中，每个国家的唯一标识
 * @deprecated
 * 该值需要从 geo.json 文件中的 properties 中的 hc-key 字段中获取
 */
export const POST_CODE_KEY = "hc-key";

// 缺少地图数据GeoJson的国家码
export const MISS_MAP_POST_CODE_KEYS = ["um", "fm", "sw", "sh", "ki", "bu", "mv", "sp", "to", "tv", "mh", "va", "cnm", "jk"];


/**
 * @description: 默认点配置
 */
export const DEFAULT_POINT_CONFIG = {
  symbol: "circle",
  symbolSize: 12,
  itemStyle: {
    color: "#47C384",
    opacity: 1,
  },
};
