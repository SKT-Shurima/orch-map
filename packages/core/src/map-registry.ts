/**
 * 地图数据注册管理器
 * 用于管理和注册各种地图数据
 */
export class MapRegistry {
  private static instance: MapRegistry;
  private registeredMaps: Map<string, any> = new Map();
  private echartsInstance: any = null;

  private constructor() {}

  public static getInstance(): MapRegistry {
    if (!MapRegistry.instance) {
      MapRegistry.instance = new MapRegistry();
    }
    return MapRegistry.instance;
  }

  /**
   * 设置 ECharts 实例
   */
  public setEChartsInstance(echarts: any): void {
    this.echartsInstance = echarts;
  }

  /**
   * 注册地图数据
   */
  public async registerMap(mapName: string, mapData: any): Promise<void> {
    if (!this.echartsInstance) {
      const echarts = await import('echarts');
      this.echartsInstance = echarts;
    }

    this.echartsInstance.registerMap(mapName, mapData);
    this.registeredMaps.set(mapName, mapData);
  }

  /**
   * 检查地图是否已注册
   */
  public isMapRegistered(mapName: string): boolean {
    return this.registeredMaps.has(mapName);
  }

  /**
   * 获取已注册的地图数据
   */
  public getMapData(mapName: string): any {
    return this.registeredMaps.get(mapName);
  }

  /**
   * 获取所有已注册的地图名称
   */
  public getRegisteredMapNames(): string[] {
    return Array.from(this.registeredMaps.keys());
  }

  /**
   * 移除地图注册
   */
  public unregisterMap(mapName: string): void {
    this.registeredMaps.delete(mapName);
  }

  /**
   * 清空所有注册的地图
   */
  public clear(): void {
    this.registeredMaps.clear();
  }

  /**
   * 批量注册地图数据
   */
  public async registerMaps(mapDataMap: Record<string, any>): Promise<void> {
    const promises = Object.entries(mapDataMap).map(([name, data]) =>
      this.registerMap(name, data)
    );
    await Promise.all(promises);
  }
}
