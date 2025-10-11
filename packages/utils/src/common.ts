export { omit, pick } from "lodash";


/**
 * 判断值是否已定义
 */
export function isDef<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * 判断数组是否为空
 */
export function isEmptyArray<T>(arr: T[] | undefined | null): arr is [] | undefined | null {
  return !Array.isArray(arr) || arr.length === 0;
}

/**
 * 判断值是否未定义
 */
export function isUndef(value: unknown): value is undefined | null {
  return value === undefined || value === null;
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === "object") {
    const clonedObj = {} as unknown as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn(...args);
    }
  };
}


/**
 * 生成唯一ID
 */
export function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 颜色工具函数
 */
export const colorUtils = {
  /**
   * 将十六进制颜色转换为 RGBA 数组
   */
  hexToRgba(hex: string, alpha = 255): [number, number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, alpha];
  },

  /**
   * 将 RGBA 数组转换为十六进制颜色
   */
  rgbaToHex(rgba: [number, number, number, number]): string {
    const [r, g, b] = rgba;
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  },

  /**
   * 插值两个颜色
   */
  interpolateColor(
    color1: [number, number, number, number],
    color2: [number, number, number, number],
    t: number,
  ): [number, number, number, number] {
    const [r1, g1, b1, a1] = color1;
    const [r2, g2, b2, a2] = color2;
    return [
      Math.round(r1 + (r2 - r1) * t),
      Math.round(g1 + (g2 - g1) * t),
      Math.round(b1 + (b2 - b1) * t),
      Math.round(a1 + (a2 - a1) * t),
    ];
  },
};


/**
 * 根据 value 中的某个字符串查找第一个匹配的 key
 * @param obj 包含字符串数组作为值的对象
 * @param searchValue 要查找的字符串值
 * @returns 找到的第一个包含该值的键，如果没找到则返回 undefined
 */
export function findFirstKeyByValue<T extends Record<string, string[]>>(
  obj: T,
  searchValue: string,
): string | undefined {
  // 遍历对象的所有键
  for (const key of Object.keys(obj)) {
    // 如果当前键对应的字符串数组中包含要查找的值，则立即返回该键
    if (obj[key].includes(searchValue)) {
      return key;
    }
  }

  // 如果没有找到匹配的键，则返回 undefined
  return undefined;
}
