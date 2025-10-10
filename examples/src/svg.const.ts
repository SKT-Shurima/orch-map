/**
 * @description: 地图上的点的形状
 * 对应的有：
 * 菱形 表示固定站点
 * 圆形 表示移动站点
 * 星标 表示星标站点
 * COINCIDE 表示 聚合模式下位于固定站点地区的移动站点 (5)
 * @warn 这里解释一下，为什么站点标记的形状是 path 而不是 svg 的 icon?
 * 因为地图的渲染是基于 canvas 的，而 canvas 不支持 svg 的 icon，所以这里使用 path 来表示站点标记的形状
 * 但是为了保证图例的展示信息和 canvas 的展示信息一致，需要使用 createSvgIconByPath 来创建 icon
 * @see file://./../dashboard.helper.ts#createSvgIconByPath
 */
export enum PointSymbolEnum {
  CPE = "diamond",
  STAR = "path://M7.44398217 1.42893219 L10.2061634 5.41254686 L14.8864641 6.83086524 L11.9091678 10.5401912 L12.0446287 15.5710678 L7.44398217 13.7102554 L2.84406837 15.5710678 L2.97804644 10.5401912 L0 6.8308478 L4.6829174 5.4129132 Z",
}
