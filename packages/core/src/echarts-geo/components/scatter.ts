import { AnyObj, type BaseMapPoint, type ColorValue } from "@orch-map/types";
import { convertToColorCode } from "@orch-map/utils";
import { EChartsOption, type SeriesOption } from "echarts";
import * as echarts from "echarts/core";
import MapStateManager from "../../MapStateManager";
import { DEFAULT_POINT_CONFIG } from "../echart.option";
import { PointTypeEnum, type PointParam, type PointSeries, type PointSeriesDataItem } from "../types/node.type";

/**
 * 散点图组件静态工具类
 * 提供散点图相关的工具方法和配置
 */
export default class ScatterComponent {
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
          console.log("formatterParams", formatterParams);
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
        scale: 1.5,
        label: {
          show: false,
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: "#fff",
          shadowBlur: 10,
          shadowColor: "#fff",
        },
      },
      value: [point.coordinate[0], point.coordinate[1]],
    };
  }

  /**
   * 默认散点图系列配置
   */
  public static defaultScatterSeries: SeriesOption = {
    name: "points",
    type: "scatter",
    coordinateSystem: "geo",
    data: [],
    // 添加动画配置，控制hover放大速度
    animation: true,
    animationDuration: 20, // 动画持续时间，单位毫秒，值越小速度越快
    animationEasing: "cubicOut", // 动画缓动函数
    tooltip: {
      show: false,
    },
    zlevel: 1,
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
  public static processPoint = <P extends BaseMapPoint>(
    pointItem: P,
  ): PointSeriesDataItem<P> => {
    const siblingPointId = pointItem.siblingPointId ?? [];
    const siblingCount = ScatterComponent.countSuffix(siblingPointId.length);
    const dataOption = ScatterComponent.getPointDefaultOption(pointItem);
    if (pointItem.name) {
      dataOption.name = pointItem.name + siblingCount;

    }
    dataOption.label.show = pointItem.label.show;
    dataOption.emphasis.label.show = pointItem.label.hoverShow;
    return dataOption as PointSeriesDataItem<P>;
  };

  /**
   * 处理点数据并转换为 ECharts 散点图数据格式
   * @param points - 点数据数组
   * @returns 处理后的散点图数据
   */
  public static processPointsData(points: BaseMapPoint[]): PointSeriesDataItem<unknown>[] {
    const iconMap = MapStateManager.extraSvgIcons;
    return points.map(point => {
      const processedPoint = ScatterComponent.processPoint(point);
      processedPoint.name = point.name;
      processedPoint.symbol = point.icon ? iconMap[point.icon] : DEFAULT_POINT_CONFIG.symbol;
      processedPoint.symbolSize = point.size ?? DEFAULT_POINT_CONFIG.symbolSize;
      processedPoint.itemStyle = {
        color: convertToColorCode(point.color as ColorValue) ?? DEFAULT_POINT_CONFIG.itemStyle.color,
        opacity: point.opacity ?? DEFAULT_POINT_CONFIG.itemStyle.opacity,
      };
      return processedPoint;
    });
  }

  /**
   * 更新系列中的散点图数据
   * @param series - 系列配置数组
   * @param pointData - 散点图数据
   * @returns 更新后的系列配置数组
   */
  public static updateScatterSeriesData(
    series: SeriesOption[],
    pointData: PointSeriesDataItem<unknown>[],
  ): SeriesOption[] {
    return series.map(item => {
      if (item.type === PointTypeEnum.SCATTER) {
        return {
          ...item,
          data: pointData,
        } as SeriesOption;
      }
      return item;
    });
  }

  /**
   * 设置散点图数据到图表
   * @param chartInstance - ECharts 实例
   * @param points - 点数据数组
   */
  public static setPoints(chartInstance: echarts.ECharts, points: BaseMapPoint[]): void {
    if (!chartInstance) return;

    const mapOption = chartInstance.getOption() as EChartsOption;
    const series = mapOption.series as SeriesOption[];
    const pointData = this.processPointsData(points);
    const updatedSeries = this.updateScatterSeriesData(series, pointData);

    mapOption.series = updatedSeries;
    chartInstance.setOption(mapOption, true);
  }

  /**
   * 设置散点图样式
   * @param chartInstance - ECharts 实例
   * @param targetSeriesName - 目标系列名称
   * @param processFn - 处理函数，用于修改点数据项
   */
  public static setPointStyleInternal<T>(
    chartInstance: echarts.ECharts,
    targetSeriesName: string,
    processFn: (dataItem: PointSeriesDataItem<T>) => void,
  ): void {
    const currentOption = chartInstance?.getOption();
    if (!currentOption || !Array.isArray(currentOption.series)) {
      return;
    }

    const { series } = currentOption;
    const pointSeries = series.find((item: SeriesOption) => item.name === targetSeriesName) as PointSeries<T>;
    if (!pointSeries || !Array.isArray(pointSeries.data)) {
      return;
    }

    // 对每个点项进行处理
    pointSeries.data.forEach(item => {
      processFn(item);
    });

    // 重新设置图表选项
    const newOption: EChartsOption = { series };
    chartInstance.setOption(newOption);
  }

  /**
   * 设置点样式（外部接口）
   * @param chartInstance - ECharts 实例
   * @param seriesName - 系列名称
   * @param styleProcessor - 样式处理函数
   */
  public static setPointStyle(
    chartInstance: echarts.ECharts,
    seriesName: string,
    styleProcessor: (point: BaseMapPoint) => void,
  ): void {
    if (!chartInstance) return;

    this.setPointStyleInternal(chartInstance, seriesName, (dataItem: PointSeriesDataItem<unknown>) => {
      // 将点数据转换为 BaseMapPoint，给外部的 styleProcessor 处理
      const tempParam: PointParam<unknown> = {
        id: dataItem.id,
        name: dataItem.name ?? "",
        componentType: "series",
        componentSubType: "scatter",
        seriesName,
        seriesType: PointTypeEnum.SCATTER,
        componentIndex: 0,
        event: { event: {} },
        geoIndex: 0,
        data: dataItem,
      };
      const baseMapPoint = {
        id: tempParam.id,
        coordinate: dataItem.value,
        name: tempParam.name,
        label: {
          name: tempParam.name,
          show: true,
          hoverShow: true,
          formatter: () => "",
        },
      } as BaseMapPoint;
      styleProcessor(baseMapPoint);
    });
  }

  /**
   * 查找散点图系列
   * @param series - 系列配置数组
   * @returns 散点图系列或 undefined
   */
  public static findScatterSeries(series: SeriesOption[]): SeriesOption | undefined {
    return series.find(item => item.type === PointTypeEnum.SCATTER);
  }

  /**
   * 获取散点图数据
   * @param series - 系列配置数组
   * @returns 散点图数据数组
   */
  public static getScatterData<T>(series: SeriesOption[]): PointSeriesDataItem<T>[] | undefined {
    const pointSeries = this.findScatterSeries(series);
    return pointSeries?.data as PointSeriesDataItem<T>[] | undefined;
  }

  /**
   * 检查是否为散点图组件类型
   * @param componentSubType - 组件子类型
   * @returns 是否为散点图类型
   */
  public static isScatterType(componentSubType: string): boolean {
    return componentSubType === PointTypeEnum.SCATTER || componentSubType === PointTypeEnum.EFFECT_SCATTER;
  }

  /**
   * 创建散点图系列配置
   * @param name - 系列名称
   * @param data - 数据数组
   * @param options - 额外配置选项
   * @returns 散点图系列配置
   */
  public static createScatterSeries(
    name: string = "points",
    data: PointSeriesDataItem<unknown>[] = [],
    options: Partial<SeriesOption> = {},
  ): SeriesOption {
    return {
      ...this.defaultScatterSeries,
      name,
      data,
      type: "scatter",
      ...options,
    } as SeriesOption;
  }

  /**
   * 创建带有自定义动画配置的散点图系列
   * @param name - 系列名称
   * @param data - 数据数组
   * @param animationConfig - 动画配置
   * @param options - 额外配置选项
   * @returns 散点图系列配置
   */
  public static createScatterSeriesWithAnimation(
    name: string = "points",
    data: PointSeriesDataItem<unknown>[] = [],
    animationConfig: {
      enabled?: boolean;
      duration?: number;
      easing?: string;
    } = {},
    options: Partial<SeriesOption> = {},
  ): SeriesOption {
    const {
      enabled = true,
      duration = 200,
      easing = "cubicOut",
    } = animationConfig;

    return {
      ...this.defaultScatterSeries,
      name,
      data,
      type: "scatter",
      animation: enabled,
      animationDuration: duration,
      animationEasing: easing,
      ...options,
    } as SeriesOption;
  }

  /**
   * 处理散点图点击事件
   * @param params - 事件参数
   * @param onPointClick - 点击回调函数
   */
  public static handleScatterClick<T>(
    params: PointParam<T>,
    onPointClick?: (id: string) => void,
  ): void {
    if (
      params.componentType === "series" &&
      this.isScatterType(params.componentSubType) &&
      onPointClick
    ) {
      onPointClick(params.id);
    }
  }

  /**
   * 处理散点图悬停事件
   * @param params - 事件参数
   * @param onPointHover - 悬停回调函数
   */
  public static handleScatterHover<T>(
    params: PointParam<T>,
    onPointHover?: (id: string) => void,
  ): void {
    if (params.componentType === "series" && onPointHover) {
      onPointHover(params.id);
    }
  }
}
