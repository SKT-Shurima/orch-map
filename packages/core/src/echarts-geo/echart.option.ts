/**
 * @description: 在世界地图中，每个国家的唯一标识
 * 该值需要从 geo.json 文件中的 properties 中的 hc-key 字段中获取
 */
export const POST_CODE_KEY = "hc-key"

// 缺少地图数据GeoJson的国家码
export const MISS_MAP_POST_CODE_KEYS = ["um", "fm", "sw", "sh", "ki", "bu", "mv", "sp", "to", "tv", "mh", "va", "cnm", "jk"]

export const BASE_LINE_SERIES = {
  name: "line",
  type: "lines",
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
  geoIndex: 0,
  // 数据结构 https://www.echartsjs.com/zh/option.html#series-lines.data.coords
  data: [],
  progressiveThreshold: 500,
  progressive: 200,
}

export const BOUNDARY_OPTIONS = {
  zoom: 1.3,
  hoverLayerThreshold: 1, // 修复：允许hover事件触发
  silent: false,
  roam: true,
  center: null,
  scaleLimit: { min: 1 },
  zlevel: 0,
  itemStyle: {
    areaColor: "#094777",
    borderWidth: 0,
    borderColor: "#1480C5",
    shadowBlur: 1,
    shadowColor: "rgba(0, 0, 0, 0.5)",
  },
  emphasis: {
    label: {
      show: false,
    },
    itemStyle: {
      areaColor: "#3079c8",
      borderWidth: 0,
    },
  },
  // regions: [
  //   {
  //     name: "南海诸岛",
  //     itemStyle: {
  //       opacity: 0,
  //     },
  //   },
  // ],
}

export const BASE_POINT_SERIES = {
  name: "scatter",
  type: "scatter",
  coordinateSystem: "geo",
  z: 1,
  zlevel: 1,
  geoIndex: 0,
  data: [],
  rippleEffect: { brushType: "stroke" },
  emphasis: {
    label: {
      show: true,
    },
  },
}
