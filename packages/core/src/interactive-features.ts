import type { GeoData } from '@orch-map/types';

/**
 * 交互功能增强器
 * 提供区域搜索、数据筛选、交互控制等功能
 */
export class InteractiveFeatures {
  private static instance: InteractiveFeatures;
  private searchIndex: Map<string, GeoData[]> = new Map();
  private filterCache: Map<string, GeoData[]> = new Map();

  private constructor() {}

  public static getInstance(): InteractiveFeatures {
    if (!InteractiveFeatures.instance) {
      InteractiveFeatures.instance = new InteractiveFeatures();
    }
    return InteractiveFeatures.instance;
  }

  /**
   * 构建搜索索引
   */
  public buildSearchIndex(data: GeoData[]): void {
    this.searchIndex.clear();
    
    data.forEach(item => {
      const name = item.name.toLowerCase();
      
      // 按完整名称索引
      this.addToIndex(name, item);
      
      // 按拼音首字母索引
      const pinyin = this.getPinyinInitials(item.name);
      this.addToIndex(pinyin, item);
      
      // 按字符索引
      for (let i = 0; i < name.length; i++) {
        this.addToIndex(name.substring(i), item);
      }
    });
  }

  /**
   * 添加到搜索索引
   */
  private addToIndex(key: string, item: GeoData): void {
    if (!this.searchIndex.has(key)) {
      this.searchIndex.set(key, []);
    }
    this.searchIndex.get(key)!.push(item);
  }

  /**
   * 搜索数据
   */
  public search(query: string, data: GeoData[]): GeoData[] {
    if (!query.trim()) return data;

    const searchTerm = query.toLowerCase().trim();
    const results = new Set<GeoData>();

    // 精确匹配
    if (this.searchIndex.has(searchTerm)) {
      this.searchIndex.get(searchTerm)!.forEach(item => results.add(item));
    }

    // 模糊匹配
    for (const [key, items] of this.searchIndex) {
      if (key.includes(searchTerm)) {
        items.forEach(item => results.add(item));
      }
    }

    return Array.from(results);
  }

  /**
   * 按数值范围筛选
   */
  public filterByValue(
    data: GeoData[],
    minValue: number,
    maxValue: number
  ): GeoData[] {
    return data.filter(item => {
      const value = item.value[2] || 0;
      return value >= minValue && value <= maxValue;
    });
  }

  /**
   * 按地理范围筛选
   */
  public filterByBounds(
    data: GeoData[],
    bounds: {
      minLng: number;
      maxLng: number;
      minLat: number;
      maxLat: number;
    }
  ): GeoData[] {
    return data.filter(item => {
      const [lng, lat] = item.value;
      return lng >= bounds.minLng && lng <= bounds.maxLng &&
             lat >= bounds.minLat && lat <= bounds.maxLat;
    });
  }

  /**
   * 按区域筛选
   */
  public filterByRegion(
    data: GeoData[],
    regionNames: string[]
  ): GeoData[] {
    return data.filter(item => regionNames.includes(item.name));
  }

  /**
   * 多条件筛选
   */
  public multiFilter(
    data: GeoData[],
    filters: {
      search?: string;
      valueRange?: [number, number];
      bounds?: {
        minLng: number;
        maxLng: number;
        minLat: number;
        maxLat: number;
      };
      regions?: string[];
    }
  ): GeoData[] {
    let result = [...data];

    if (filters.search) {
      result = this.search(filters.search, result);
    }

    if (filters.valueRange) {
      result = this.filterByValue(result, filters.valueRange[0], filters.valueRange[1]);
    }

    if (filters.bounds) {
      result = this.filterByBounds(result, filters.bounds);
    }

    if (filters.regions && filters.regions.length > 0) {
      result = this.filterByRegion(result, filters.regions);
    }

    return result;
  }

  /**
   * 数据排序
   */
  public sortData(
    data: GeoData[],
    sortBy: 'name' | 'value' | 'distance',
    order: 'asc' | 'desc' = 'asc',
    center?: [number, number]
  ): GeoData[] {
    return [...data].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'value':
          comparison = (a.value[2] || 0) - (b.value[2] || 0);
          break;
        case 'distance':
          if (!center) return 0;
          const distanceA = this.calculateDistance(a.value, center);
          const distanceB = this.calculateDistance(b.value, center);
          comparison = distanceA - distanceB;
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * 计算两点间距离
   */
  private calculateDistance(point1: [number, number, number], point2: [number, number]): number {
    const dx = point1[0] - point2[0];
    const dy = point1[1] - point2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 获取拼音首字母
   */
  private getPinyinInitials(text: string): string {
    // 简化的拼音首字母映射
    const pinyinMap: Record<string, string> = {
      '北': 'B', '京': 'J', '上': 'S', '海': 'H', '广': 'G', '州': 'Z',
      '深': 'S', '圳': 'Z', '杭': 'H', '南': 'N',
      '武': 'W', '汉': 'H', '成': 'C', '都': 'D', '西': 'X', '安': 'A',
      '重': 'C', '庆': 'Q', '天': 'T', '津': 'J', '苏': 'S',
      '青': 'Q', '岛': 'D', '大': 'D', '连': 'L', '宁': 'N', '波': 'B',
      '厦': 'X', '门': 'M', '福': 'F', '长': 'C', '沙': 'S',
      '郑': 'Z', '济': 'J', '太': 'T', '原': 'Y',
      '石': 'S', '家': 'J', '庄': 'Z', '哈': 'H', '尔': 'E', '滨': 'B',
      '春': 'C', '沈': 'S', '阳': 'Y', '呼': 'H', '和': 'H',
      '浩': 'H', '特': 'T', '银': 'Y', '川': 'C', '兰': 'L',
      '乌': 'W', '鲁': 'L', '木': 'M', '齐': 'Q',
      '拉': 'L', '萨': 'S', '昆': 'K', '明': 'M', '贵': 'G',
      '口': 'K', '三': 'S', '亚': 'Y'
    };

    return text.split('').map(char => pinyinMap[char] || char).join('');
  }

  /**
   * 创建数据统计
   */
  public createDataStats(data: GeoData[]): {
    total: number;
    average: number;
    max: number;
    min: number;
    median: number;
    stdDev: number;
  } {
    if (data.length === 0) {
      return { total: 0, average: 0, max: 0, min: 0, median: 0, stdDev: 0 };
    }

    const values = data.map(item => item.value[2] || 0).sort((a, b) => a - b);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const median = values.length % 2 === 0
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)];

    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { total, average, max, min, median, stdDev };
  }

  /**
   * 创建数据分组
   */
  public groupData(
    data: GeoData[],
    groupBy: 'value' | 'region' | 'custom',
    groupFunction?: (item: GeoData) => string
  ): Map<string, GeoData[]> {
    const groups = new Map<string, GeoData[]>();

    data.forEach(item => {
      let groupKey: string;

      switch (groupBy) {
        case 'value':
          const value = item.value[2] || 0;
          if (value > 500) groupKey = '高值';
          else if (value > 200) groupKey = '中值';
          else groupKey = '低值';
          break;
        case 'region':
          // 简化的区域分组
          const lng = item.value[0];
          const lat = item.value[1];
          if (lng > 110 && lat > 30) groupKey = '华东';
          else if (lng > 110 && lat <= 30) groupKey = '华南';
          else if (lng <= 110 && lat > 30) groupKey = '华北';
          else groupKey = '其他';
          break;
        case 'custom':
          groupKey = groupFunction ? groupFunction(item) : '默认';
          break;
        default:
          groupKey = '默认';
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(item);
    });

    return groups;
  }

  /**
   * 创建数据导出
   */
  public exportData(
    data: GeoData[],
    format: 'json' | 'csv' | 'geojson' = 'json'
  ): string {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        const csvHeader = 'name,lng,lat,value\n';
        const csvRows = data.map(item => 
          `${item.name},${item.value[0]},${item.value[1]},${item.value[2] || 0}`
        ).join('\n');
        return csvHeader + csvRows;
      case 'geojson':
        const geojson = {
          type: 'FeatureCollection',
          features: data.map(item => ({
            type: 'Feature',
            properties: {
              name: item.name,
              value: item.value[2] || 0
            },
            geometry: {
              type: 'Point',
              coordinates: [item.value[0], item.value[1]]
            }
          }))
        };
        return JSON.stringify(geojson, null, 2);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * 创建数据导入
   */
  public importData(
    data: string,
    format: 'json' | 'csv' | 'geojson' = 'json'
  ): GeoData[] {
    try {
      switch (format) {
        case 'json':
          return JSON.parse(data);
        case 'csv':
          const lines = data.split('\n');
          const headers = lines[0].split(',');
          return lines.slice(1).map(line => {
            const values = line.split(',');
            return {
              name: values[0],
              value: [
                parseFloat(values[1]),
                parseFloat(values[2]),
                parseFloat(values[3]) || 0
              ]
            };
          });
        case 'geojson':
          const geojson = JSON.parse(data);
          return geojson.features.map((feature: any) => ({
            name: feature.properties.name,
            value: [
              feature.geometry.coordinates[0],
              feature.geometry.coordinates[1],
              feature.properties.value || 0
            ]
          }));
        default:
          return JSON.parse(data);
      }
    } catch (error) {
      console.error('数据导入失败:', error);
      return [];
    }
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.searchIndex.clear();
    this.filterCache.clear();
  }
}
