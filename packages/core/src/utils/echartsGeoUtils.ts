
import { AnyObj, BaseMapLine, BaseMapPoint } from "@orch-map/types";
import { type LinesSeriesOption } from "echarts";
import { PointSeriesDataItem } from "../echarts-geo/types";
import { isDef, isUndef } from "@orch-map/utils";
import { AdapterParams } from "../interfaces";

/**
 * @description: ECharts地图工具类，用于处理点和线的配置
 *
 * 点处理逻辑:
 * 根据 mapConfig 的配置以及依赖数据，将 point 转换为 echarts 的配置
 * 这里会根据聚合模式分为三种情况
 * 1、非聚合模式
 * 2、按城市聚合模式
 * 3、按省份聚合模式 （目前只有 CPE 大屏地图，并且是在中国大陆模式下才会有的）
 * 注意：这里只处理通用问题的通用解，如果涉及到根据特殊逻辑定制的，需要进行二次加工
 *
 * 线处理逻辑(可选):
 * 将线条转换为 echarts 的配置
 */
export default class EChartsGeoUtils {
  // 线条随机曲率映射表
  private static curvatureMap: { [key: string]: number } = {};

  /**
   * @description: 获取点默认配置项
   * @param point 点数据
   * @warning 这里的 showLabelNotEmphasis 为 true 时，会展示 label，
   * showLabelNotEmphasis 为 false 时，hover 时展示 label，正常不展示 label
   */
  public static getPointDefaultOption<P extends BaseMapPoint>(point: P): AnyObj {
    return {
      symbol: "circle",
      symbolSize: 12,
      symbolRotate: 0,
      z: 1,
      encode: {
        x: "value.0",
        y: "value.1",
      },
      label: {
        show: true,
        z: 10,
        color: "#fff",
        position: "bottom",
        formatter: (formatterParams: { data: PointSeriesDataItem<P> }) => {
          return formatterParams.data.name ?? "";
        },
      },
      itemStyle: {
        color: "#47C384",
        borderColor: "#fff",
        shadowColor: "#fff",
        borderWidth: 0,
        shadowBlur: 0,
      },
      emphasis: {
        label: {
          show: false,
        },
      },
      value: [point.coordinate[0], point.coordinate[1]],
      businessInfo: {
        ...point,
      },
      graphInfo: {} as AnyObj,
    };
  }

  /**
   * @description: 切换标签显示状态
   * @param point 点配置
   * @param showLabelNotEmphasis 是否在非强调状态下显示标签
   */
  private static toggleLabelShow = (point: AnyObj, showLabelNotEmphasis: boolean) => {
    point.label!.show = showLabelNotEmphasis;
    point.emphasis!.label!.show = !showLabelNotEmphasis;
  };

  /**
   * @description: 计算数量后缀
   * @param count 数量
   * @returns 格式化后的后缀
   */
  private static countSuffix = (count: number) => {
    return count > 1 ? `(${count})` : "";
  };

  /**
   * @description: 处理点数据，转换为 echarts 配置
   * @param pointItem 点数据
   * @param config 适配器参数
   * @returns 处理后的点配置
   */
  public static processPoint = <P extends BaseMapPoint>(pointItem: P, config: AdapterParams): PointSeriesDataItem<P> => {
    const siblingCount = EChartsGeoUtils.countSuffix(pointItem.siblingPointId.length);
    const { filterPoint, staredPoints = [], showNamePoints = [] } = config;
    const dataOption = EChartsGeoUtils.getPointDefaultOption(pointItem);
    let isStarred = false;
    if (staredPoints.length > 0) {
      isStarred = staredPoints.some(point => point.id === pointItem.id);
      // 星标站点必然要显示，不受 filter 和 showNamePointIds 的影响
      if (isStarred) {
        EChartsGeoUtils.toggleLabelShow(dataOption, true);
      }
    }
    dataOption.graphInfo!.isStarred = isStarred;
    let showLabel: string | undefined;
    const onlyShowPartialNodeNames = Array.isArray(showNamePoints) && showNamePoints.length > 0 || isDef(filterPoint);
    // 是否过滤
    if (onlyShowPartialNodeNames) {
      showLabel =
        filterPoint && pointItem.siblingPointId.includes(filterPoint.id)
          ? filterPoint.name
          : staredPoints.find(point => point.id === pointItem.id)?.name ??
            showNamePoints.find(point => point.id === pointItem.id)?.name;
      if (showLabel) {
        EChartsGeoUtils.toggleLabelShow(dataOption, true);
      }
    } else {
      showLabel = pointItem.name;
    }

    if (showLabel) {
      dataOption.name = showLabel + siblingCount;
    }

    return dataOption as PointSeriesDataItem<P>;
  };

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
    if (isUndef(EChartsGeoUtils.curvatureMap[key])) {
      // 使用确定性哈希替代 Math.random()
      EChartsGeoUtils.curvatureMap[key] = EChartsGeoUtils.hashString(key) * (max - min) + min;
    }

    return EChartsGeoUtils.curvatureMap[key];
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
  public static getLineDefaultOption<L extends BaseMapLine>(lineItem: L & BaseMapLine, config?: { curvatureMin: number; curvatureMax: number }) {
    const [startLng, startLat] = lineItem.startCoordinate;
    const [endLng, endLat] = lineItem.endCoordinate;

    const { min: defaultMin, max: defaultMax } = EChartsGeoUtils.calculateCurvatureRange(startLng, startLat, endLng, endLat);
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
        curveness: EChartsGeoUtils.curvature(lineItem.id, curvatureMin, curvatureMax),
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
  public static getBuddyLineSeries = (originLineSeries: LinesSeriesOption): LinesSeriesOption => {
    // 将 connectivitySeries 中的 data 数据的开始点和结束点进行对调
    // 将开始点和结束点对调，是因为在地图上，线的起点和终点是有顺序的，但是在数据中，起点和终点是没有顺序的
    // 所以在地图上，需要将起点和终点对调，以保证线的方向是正确的
    const sourceData = Array.isArray(originLineSeries.data) ? originLineSeries.data : [];
    const connectivitySeriesData = sourceData.map((item: any) => {
      const [start, end] = item.coords ?? [];
      return {
        ...item,
        coords: [end, start],
        lineStyle: {
          ...item.lineStyle,
          // 但是在显示上为了表示为同一条线，这里需要将曲线的弯曲度取反，这样就可以在地图上展示一条线
          // 使用确定性方法替代 Math.random()
          curveness: -(item.lineStyle?.curveness ?? EChartsGeoUtils.hashString(JSON.stringify(item.coords))),
        },
      };
    });

    // 云鹏哥说，connection 要展示双向的效果，因为 eCharts 的轨迹动画只能从起点到终点，不能双向
    // 所以这里需要将数据进行复制一份，然后将起点和终点对调
    // 这样就可以在地图上展示双向的效果
    const buddyConnectivitySeries: LinesSeriesOption = {
      ...originLineSeries,
      data: connectivitySeriesData,
    };
    return buddyConnectivitySeries;
  };

  /**
   * @description: 处理线条数据，转换为 echarts 配置
   * @param lineItem 线条数据
   * @param config 曲率配置参数（可选）
   * @returns 处理后的线条配置
   */
  public static processLine = <L extends BaseMapLine>(lineItem: L, config?: { curvatureMin: number; curvatureMax: number }) => {
    return EChartsGeoUtils.getLineDefaultOption(lineItem, config);
  };
}
