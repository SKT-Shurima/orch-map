/**
 * @description: 在世界地图中，每个国家的唯一标识
 * @deprecated
 * 该值需要从 geo.json 文件中的 properties 中的 hc-key 字段中获取
 */
export const POST_CODE_KEY = "hc-key";

// 缺少地图数据GeoJson的国家码
export const MISS_MAP_POST_CODE_KEYS = ["um", "fm", "sw", "sh", "ki", "bu", "mv", "sp", "to", "tv", "mh", "va", "cnm", "jk"];

export const BASE_LINE_SERIES = {
  // name: "lines",
  type: "lines",
  coordinateSystem: "geo",
  z: 0,
  zlevel: 1,
  // 转场动画，所有带有尾迹特效的图表建议关闭该层的动画。
  // 不然位于同个层的其它系列的图形，和动画的标签也会产生不必要的残影。
  animation: false,
  effect: {
    show: true,
    // 特效运行速度，值越小速度越快
    period: 4,
    // 特效尾迹长度[0, 1]值越大，尾迹越长
    trailLength: 0.02,
    symbol: "arrow",
    symbolSize: 2,
  },
  geoIndex: 20,
  // 数据结构 https://www.echartsjs.com/zh/option.html#series-lines.data.coords
  data: [],
  progressiveThreshold: 500,
  progressive: 200,
};


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
