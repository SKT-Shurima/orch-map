import type { ColorValue, BaseMapLine } from "@orch-map/types";
import type { EChartsOption, LinesSeriesOption } from "echarts";
import CurvatureCalculator from "../../utils/curvatureCalculator";
import { convertToColorCode, isUndef } from "@orch-map/utils";
import * as echarts from "echarts/core";

/**
 * 连线图组件静态工具类
 * 提供连线图相关的工具方法和配置
 */
export default class LinesComponent {
  /**
   * 默认连线图系列配置
   */
  public static defaultLinesSeries: LinesSeriesOption = {
    name: "lines",
    type: "lines",
    coordinateSystem: "geo",
    data: [],
    large: true,
    hoverLayerThreshold: 300,
    effect: {
      show: true,
      // 特效运行速度，值越小速度越快
      period: 2,
      // 特效尾迹长度[0, 1]值越大，尾迹越长
      trailLength: 0.005,
      symbol: "circle",
      symbolSize: 4,
      color: "#47C384",
      loop: true,
    },
    lineStyle: {
      color: "#47C384",
      width: 0.3,
      opacity: 0.5,
    },
    zlevel: 1,
  };

  /**
   * 曲率计算器实例
   */
  private static curvatureCalculator: CurvatureCalculator = new CurvatureCalculator();

  /**
   * 将线数据转换为 ECharts Series
   * @param lines - 线数据数组
   * @returns ECharts 系列配置数组
   */
  private static convertLinesToSeries(lines: BaseMapLine[]): LinesSeriesOption {
    const defaultLineSeries = LinesComponent.defaultLinesSeries;
    const lineData = lines.map(line => {
      // 计算曲率值
      const curvature = this.curvatureCalculator.calculateCurvatureByCoordinates(
        line.id,
        line.startCoordinate,
        line.endCoordinate,
      );

      const defaultLineStyle = defaultLineSeries.lineStyle;

      return {
        ...defaultLineSeries,
        coords: [line.startCoordinate, line.endCoordinate],
        effect: {
          ...defaultLineSeries.effect,
          color: convertToColorCode(line.color as ColorValue) ?? defaultLineSeries.effect?.color,
        },
        lineStyle: {
          ...defaultLineStyle,
          color: convertToColorCode(line.color as ColorValue) ?? defaultLineStyle?.color,
          width: line.width ?? defaultLineStyle?.width,
          opacity: line.opacity ?? defaultLineStyle?.opacity,
          curveness: curvature,
        },
      };
    });

    return {
      ...defaultLineSeries,
      data: lineData,
    } as LinesSeriesOption;
  }


  /**
   * 设置连线图数据到图表
   * @param chartInstance - ECharts 实例
   * @param lines - 线数据数组
   */
  public static setLines(chartInstance: echarts.ECharts, lines: BaseMapLine[]): void {
    if (!chartInstance) return;

    const mapOption = chartInstance.getOption() as EChartsOption;
    const series = this.convertLinesToSeries(lines);
    const doubleSeries = this.getBuddyLineSeries(series);
    const currentSeries = mapOption.series as LinesSeriesOption[] | undefined;
    if (currentSeries && Array.isArray(currentSeries)) {
      mapOption.series = currentSeries.map((item: LinesSeriesOption) => {
        if (item.name === "lines-buddy") {
          return doubleSeries;
        } else if (item.name === "lines") {
          return series;
        }
        return item;
      });
      chartInstance.setOption(mapOption, true);
    }
  }


  // 线条随机曲率映射表
  private static curvatureMap: { [key: string]: number } = {};

  /**
   * @description: 字符串哈希函数，生成0到1之间的数值
   * 用确定性的方法替代 Math.random()
   * @param str 输入字符串
   * @returns 0到1之间的数值
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // 转换为32位整数
    }
    // 转换为0到1之间的值
    return Math.abs(hash) / 2147483647;
  }

  /**
   * @description: 计算线条曲率
   * 主要是根据连线的 id 计算两点之后连线的曲率
   * @param key 线条的唯一标识
   * @param min 最小曲率值
   * @param max 最大曲率值
   * @returns 计算出的曲率值
   */
  private static curvature(key: string, min = 0, max = 1): number {
    if (isUndef(LinesComponent.curvatureMap[key])) {
      // 使用确定性哈希替代 Math.random()
      LinesComponent.curvatureMap[key] = LinesComponent.hashString(key) * (max - min) + min;
    }

    return LinesComponent.curvatureMap[key];
  }

  /**
   * @description: 计算连线的曲率范围
   * 根据连线两端点的经纬度差值计算合适的曲率范围
   *
   * 计算逻辑:
   * 1. 如果起点和终点重合(经纬度相同)，返回固定的小曲率范围避免直线
   * 2. 计算经度和纬度的变化量的比值(类似于 tan 值)
   * 3. 使用最小的变化率来判断线条的倾斜程度:
   *    - 当最小变化率 > 0.5 (即线条倾斜角度 > 26.57°)时，使用较大曲率范围(0.5-1.0)
   *    - 当最小变化率 < 0.5 (即线条倾斜角度 < 26.57°)时，使用较小曲率范围(0.2-0.5)
   *    这样可以保证接近水平或垂直的线条使用较小曲率，而倾斜线条使用较大曲率
   *
   * @param startLng 起点经度
   * @param startLat 起点纬度
   * @param endLng 终点经度
   * @param endLat 终点纬度
   * @returns 曲率的最小值和最大值
   */
  private static calculateCurvatureRange = (startLng: number, startLat: number, endLng: number, endLat: number) => {
    // 避免除以0的情况
    if (startLat === endLat && startLng === endLng) {
      return { min: 0.1, max: 0.3 };
    }

    // 计算经纬度变化率
    const deltaLng = Math.abs(endLng - startLng);
    const deltaLat = Math.abs(endLat - startLat);

    // 使用变化率比例来确定曲率
    const ratio = Math.min(deltaLng / deltaLat, deltaLat / deltaLng);
    const min = ratio > 0.5 ? 0.5 : 0.2;
    const max = ratio > 0.5 ? 1.0 : 0.5;

    return { min, max };
  };

  /**
   * @description: 获取线条默认配置
   * 这里会将线整个配置拿过来，直接进行赋值即可
   * 线条不会像点一样显示的形状、label 等复杂的信息
   * 对于线条而言，在业务场景中，一般是颜色不同而已
   *
   * @param lineItem 线条数据
   * @param config 曲率配置参数（可选）
   * @returns 线条配置
   */
  private static getLineDefaultOption<L extends BaseMapLine>(
    lineItem: L & BaseMapLine,
    config?: { curvatureMin: number; curvatureMax: number }): {
    coords: [[number, number], [number, number]];
    lineStyle: {
      color: string;
      width: number;
      opacity: number;
      curveness: number;
    };
  } {
    const [startLng, startLat] = lineItem.startCoordinate;
    const [endLng, endLat] = lineItem.endCoordinate;

    const { min: defaultMin, max: defaultMax } =
    LinesComponent.calculateCurvatureRange(startLng, startLat, endLng, endLat);
    const curvatureMin = config?.curvatureMin ?? defaultMin;
    const curvatureMax = config?.curvatureMax ?? defaultMax;
    // 验证曲率范围的合法性
    if (curvatureMin < 0 || curvatureMax > 1 || curvatureMin > curvatureMax) {
      throw new Error("无效的曲率范围。必须满足: 0 <= min <= max <= 1");
    }

    return {
      coords: [lineItem.startCoordinate, lineItem.endCoordinate],
      lineStyle: {
        color: "#47C384",
        width: 0.1,
        opacity: 0.3,
        // 线条曲率
        curveness: LinesComponent.curvature(lineItem.id, curvatureMin, curvatureMax),
      },
    };
  }

  /**
   * @description: 获取线条逆向连线的 series 配置
   * 将连线起终点对调，创建反向连线配置
   *
   * @param originLineSeries 原始线条系列配置
   * @returns 逆向连线的系列配置
   */
  private static getBuddyLineSeries = (originLineSeries: LinesSeriesOption): LinesSeriesOption => {
    // 将 connectivitySeries 中的 data 数据的开始点和结束点进行对调
    // 将开始点和结束点对调，是因为在地图上，线的起点和终点是有顺序的，但是在数据中，起点和终点是没有顺序的
    // 所以在地图上，需要将起点和终点对调，以保证线的方向是正确的
    const sourceData = Array.isArray(originLineSeries.data) ? originLineSeries.data : [];
    const connectivitySeriesData = sourceData.map((item) => {
      const [start, end] = item.coords ?? [];
      return {
        ...item,
        coords: [end, start],
        lineStyle: {
          ...item.lineStyle,
          // 但是在显示上为了表示为同一条线，这里需要将曲线的弯曲度取反，这样就可以在地图上展示一条线
          curveness: (item.lineStyle?.curveness ?? LinesComponent.hashString(JSON.stringify(item.coords))),
        },
      };
    });

    // 云鹏哥说，connection 要展示双向的效果，因为 eCharts 的轨迹动画只能从起点到终点，不能双向
    // 所以这里需要将数据进行复制一份，然后将起点和终点对调
    // 这样就可以在地图上展示双向的效果
    const buddyConnectivitySeries: LinesSeriesOption = {
      ...originLineSeries,
      name: "lines-buddy",
      data: connectivitySeriesData,
    };
    return buddyConnectivitySeries;
  };
}
