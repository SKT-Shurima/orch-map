/**
 * @description: 曲率计算工具类
 * 用于计算地图连线的曲率值，提供确定性的曲率计算方法
 */
export class CurvatureCalculator {
  // 线条随机曲率映射表
  private curvatureMap: { [key: string]: number } = {}

  /**
   * @description: 字符串哈希函数，生成0到1之间的数值
   * 用确定性的方法替代 Math.random()
   * @param str 输入字符串
   * @returns 0到1之间的数值
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash |= 0 // 转换为32位整数
    }
    // 转换为0到1之间的值
    return Math.abs(hash) / 2147483647
  }

  /**
   * @description: 计算线条曲率
   * 主要是根据连线的 id 计算两点之后连线的曲率
   * @param key 线条的唯一标识
   * @param min 最小曲率值
   * @param max 最大曲率值
   * @returns 计算出的曲率值
   */
  public curvature(key: string, min = 0, max = 1): number {
    if (this.curvatureMap[key] === undefined) {
      // 使用确定性哈希替代 Math.random()
      this.curvatureMap[key] = this.hashString(key) * (max - min) + min
    }
    return this.curvatureMap[key]
  }

  /**
   * @description: 计算连线的曲率范围
   * 根据连线两端点的经纬度差值计算合适的曲率范围
   */
  public calculateCurvatureRange(
    startLng: number,
    startLat: number,
    endLng: number,
    endLat: number,
  ): { min: number; max: number } {
    // 避免除以0的情况
    if (startLat === endLat && startLng === endLng) {
      return { min: 0.1, max: 0.3 }
    }
    // 计算经纬度变化率
    const deltaLng = Math.abs(endLng - startLng)
    const deltaLat = Math.abs(endLat - startLat)
    // 使用变化率比例来确定曲率
    const ratio = Math.min(deltaLng / deltaLat, deltaLat / deltaLng)
    const min = ratio > 0.5 ? 0.5 : 0.2
    const max = ratio > 0.5 ? 1.0 : 0.5
    return { min, max }
  }

  /**
   * @description: 根据起终点坐标计算曲率值
   * 综合使用曲率范围计算和曲率计算方法
   */
  public calculateCurvatureByCoordinates(
    key: string,
    startCoordinate: [number, number],
    endCoordinate: [number, number],
    customRange?: { min: number; max: number },
  ): number {
    const [startLng, startLat] = startCoordinate
    const [endLng, endLat] = endCoordinate
    const range = customRange || this.calculateCurvatureRange(startLng, startLat, endLng, endLat)
    if (range.min < 0 || range.max > 1 || range.min > range.max) {
      throw new Error("无效的曲率范围。必须满足: 0 <= min <= max <= 1")
    }
    return this.curvature(key, range.min, range.max)
  }

  /** 清空曲率缓存 */
  public clearCache(): void {
    this.curvatureMap = {}
  }

  /** 获取当前缓存映射表（仅调试用途） */
  public getCacheMap(): { [key: string]: number } {
    return { ...this.curvatureMap }
  }
}

export default CurvatureCalculator


