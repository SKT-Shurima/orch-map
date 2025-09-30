/**
 * 模块：默认 SVG 图标集合
 * 说明：以内联 SVG 字符串形式维护少量通用图标，便于构建运行时的 IconAtlas。
 * 优化建议：
 * - 若图标集稳定，建议转为静态 PNG/SVG 资源并配合构建产物缓存；
 * - 对于颜色可变需求，可考虑使用 SDF 或多色图层方案减少图集尺寸与数量。
 */

// 预定义的SVG图标集合
/**
 * @description: 默认的 SVG 图标集合
 * 默认提供 circle, star, diamond 三个图标
 */
export const DEFAULT_SVG_ICONS = {
  circle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="8" height="8">
    <circle cx="4" cy="4" r="3" fill="currentColor" />
  </svg>`,

  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="8" height="8">
    <path fill="currentColor" d="M4 5.757L6.06 7 5.455 4.656 7.5 3.08l-2.396-.204L4 1 3.104 2.876.5 3.08l2.045 1.576L1.94 7z"/>
  </svg>`,

  diamond: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="8" height="8">
    <path fill="currentColor" d="M4 1L1 4l3 3 3-3L4 1z"/>
  </svg>`,
}
