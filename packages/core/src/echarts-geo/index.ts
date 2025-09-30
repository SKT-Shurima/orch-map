import { MapLevel, type AnyObj, type BaseMapPoint, type BaseMapLine } from "../../../types/src/map.interface"
import { type CoordinateNumber, type GeoJsonFeature, type HcTransform } from "../../../types/src/geo.interface"
import { debounce, GeoJsonUtils, isEmptyArray, isUndef } from "@orch-map/utils"
import { type EChartsCoreOption, type SeriesOption } from "echarts"
import * as echarts from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { GeoComponent, TooltipComponent, TitleComponent } from "echarts/components" 
import type { Feature, FeatureCollection } from "geojson"
import type { IMapRenderer, MapRendererConfig, MapRendererEvents } from "../interfaces/IMapRenderer"
import MapStateManager from "../MapStateManager" 

import { BOUNDARY_OPTIONS, POST_CODE_KEY } from "./echart.option"
import { type GEOParam } from "./types"
import { type LineSeriesDataItem } from "./types/line.type"
import { PointTypeEnum, type PointParam, type PointSeries, type PointSeriesDataItem } from "./types/node.type"
import { GeoJSONSourceInput } from "echarts/types/src/coord/geo/geoTypes.js"
import { getGeoJsonData } from "../utils/geoDataService"

// Register necessary components
echarts.use([CanvasRenderer, GeoComponent, TooltipComponent,TitleComponent])
// 常量与工具
const G2 = { CHINA: "中国", USA: "美国" } as const
const CHINA_AD_CODE_JUST_FOR_FE = "100000"
const US_AD_CODE_JUST_FOR_FE = "us"
const MUNICIPALITY_CODES = new Set(["110000", "120000", "310000", "500000"]) // 京津沪渝
const isMunicipality = (adcode: string): boolean => MUNICIPALITY_CODES.has(adcode)

const JUST_SUPPORTED_NEXT_LEVEL_COUNTRIES_AD_CODE = [CHINA_AD_CODE_JUST_FOR_FE, US_AD_CODE_JUST_FOR_FE]

interface EchartsMapEvents<T> {
  onHoverPoint?: (params: PointParam<T>) => void
  onClickPoint?: (params: PointParam<T>) => void
  onClickArea?: (params?: GEOParam) => void
  onDoubleClickArea?: (nextLevel: MapLevel, params: GEOParam) => void
  onHoverArea?: (params?: GEOParam, pointsInRegion?: string[]) => void
  onUpdateGeo?: (params: FeatureCollection) => void
  onZoom?: (zoom: number) => void
}

interface EchartsMapOptions<T> {
  events?: EchartsMapEvents<T>
}

export default class EchartsMap<T = unknown> implements IMapRenderer {
  private detailMap: string = ""
  private centralCountry?: string
  private events: EchartsMapEvents<T>
  private container: HTMLElement
  private chartInstance: echarts.ECharts | null = null
  private series: SeriesOption[] = []
  private boundaryLoading = false
  private config: MapRendererConfig
  private unsubscribeState: (() => void) | null = null

  public constructor(container: HTMLElement | string, options: EchartsMapOptions<T> | MapRendererConfig) {

    if (typeof container === 'string') {
      const element = document.getElementById(container)
      if (!element) {
        throw new Error(`Container element with id "${container}" not found`)
      }
      this.container = element
    } else {
      this.container = container
    }

    // Check if options is MapRendererConfig (new interface)
    if ('container' in options) {
      this.config = options as MapRendererConfig
      this.events = this.convertEventsToEchartsFormat(this.config.events)
    } else {
      // Legacy constructor
      this.events = (options as EchartsMapOptions<T>).events || {}
      this.config = {
        container: this.container,
        events: this.events as MapRendererEvents
      }
    }

    this.initChart()
    this.registerEvents()
  }



  private get currentMapIsChina() {
    return MapStateManager.country === CHINA_AD_CODE_JUST_FOR_FE
  }

  private get detailGeojson() {
    return (echarts.getMap(this.detailMap)?.geoJson ?? {}) as FeatureCollection
  }

  private setChartOption(option: unknown) {
    if (!this.chartInstance) return
    this.chartInstance.setOption(option as EChartsCoreOption)
  }

  public setGEOData(boundary: FeatureCollection, detail: FeatureCollection) {
    if (!detail || !detail.features) {
      this.boundaryLoading = false
      return
    }
    let center = null
    let scale = 1

    if (MapStateManager.curLevel === MapLevel.WORLD) {
      if (this.centralCountry) {
        const feature = detail.features.find((item: Feature) => item.id === this.centralCountry)
        const targetCoordinates = (feature?.geometry && 'coordinates' in feature.geometry) ? feature.geometry.coordinates : []
        const { center: c, zoom: z } = this.getCenterAndZoomByGeometryCoordinates(targetCoordinates)
        scale = z
        center = c
      }
    } else if (MapStateManager.curLevel !== MapLevel.COUNTRY) {
      const targetCoordinates = detail.features.map((item: Feature) => 
        ('coordinates' in item.geometry) ? item.geometry.coordinates : []
      )
      const { center: c } = this.getCenterAndZoomByGeometryCoordinates(targetCoordinates)
      center = c
    }

    const isWorld = MapStateManager.curLevel === MapLevel.WORLD
    const option: EChartsCoreOption = {
      geo: {
        ...BOUNDARY_OPTIONS,
        map: this.detailMap,
        center,
        zoom: scale || (isWorld ? 1.3 : 1),
        itemStyle: {
          ...BOUNDARY_OPTIONS.itemStyle,
          borderWidth: isWorld ? 0 : 1,
          shadowBlur: isWorld ? 1 : 0,
        },
      },
    }
    this.setChartOption(option)
    this.boundaryLoading = false
  }

  private handleChangeAreaImpl(params?: GEOParam) {
    if (!params) {
      this.events.onHoverArea?.()
      return
    }

    type SeriesLike = { type?: string; data?: unknown; name?: string }
    const series = (this.chartInstance?.getOption() as { series?: SeriesLike[] } | undefined)?.series
    const points = (series?.find(item => item.type === PointTypeEnum.SCATTER)?.data as PointSeriesDataItem<T>[] | undefined)
    const hoverFeature = this.detailGeojson.features?.find((item: Feature) => item.properties?.name === params.name)

    if (!points || !hoverFeature) {
      return
    }

    const pointsInRegion: string[] = []

    points.forEach((point: PointSeriesDataItem<T>) => {
      const coordinates = point.value as [number, number]

      const isInRegion = this.checkPointInFeature(coordinates, hoverFeature)

      if (isInRegion && point.businessInfo && typeof point.businessInfo === "object" && "siblingPointId" in point.businessInfo) {
        pointsInRegion.push(...(point.businessInfo.siblingPointId as string[]))
      }
    })

    this.events.onHoverArea?.(params, pointsInRegion)
  }

  private checkPointInFeature(coordinates: [number, number], feature: Feature): boolean {
    if (feature.geometry.type === "Polygon") {
      return this.checkPointInPolygon(coordinates, feature.geometry.coordinates as number[][][])
    }

    if (feature.geometry.type === "MultiPolygon") {
      return (feature.geometry.coordinates as number[][][][]).some((polygon: number[][][]) => this.checkPointInPolygon(coordinates, polygon))
    }

    return false
  }

  private checkPointInPolygon(coordinates: [number, number], polygonRings: number[][][]): boolean {
    return polygonRings.some((ring, index) => {
      const isInRing = GeoJsonUtils.isPointInPolygon(coordinates, ring)
      return index === 0 ? isInRing : !isInRing
    })
  }

  private mouseoverHandler = (params: PointParam<T> | GEOParam) => {
    switch (params.componentType) {
      case "geo":
        this.handleChangeArea(params as GEOParam)
        break
      case "series":
        this.events.onHoverPoint?.(params as PointParam<T>)
        break
      default:
        this.events.onHoverArea?.()
        break
    }
  }

  private mouseoutHandler = (params: PointParam<T> | GEOParam) => {
    switch (params.componentType) {
      case "geo":
        this.handleChangeArea()
        break
      case "series":
        break
      default:
        this.handleChangeArea()
        break
    }
  }

  private checkMapEntryEligibility(params: PointParam<T> | GEOParam): MapLevel | undefined {
    switch (MapStateManager.curLevel) {
      case MapLevel.WORLD: {
        return MapLevel.COUNTRY
      }
      case MapLevel.COUNTRY: {
        if (params.name === "南海诸岛") {
          return
        }
        return MapLevel.PROVINCE
      }
      case MapLevel.PROVINCE:
        return MapLevel.CITY
      case MapLevel.CITY:
        if (!isMunicipality(MapStateManager.adcode)) {
          return MapLevel.COUNTY
        }
        return undefined
      case MapLevel.COUNTY:
      default:
        break
    }
  }

  private clickHandler = (params: PointParam<T> | GEOParam) => {
    params.event.event.stopPropagation()
    if (params.componentType === "geo") {
      this.events.onClickArea?.(params as GEOParam)
      return
    }

    if (
      params.componentType === "series" &&
      (params.componentSubType === PointTypeEnum.SCATTER || params.componentSubType === PointTypeEnum.EFFECT_SCATTER)
    ) {
      this.events.onClickPoint?.(params as PointParam<T>)
    }
  }

  private getPostCodeByGeoFeatures(name: string): string {
    const target = this.detailGeojson.features.find(item => item.properties?.name === name)
    if (!target) {
      return ""
    }
    if (this.currentMapIsChina) {
      const props = target.properties as { adcode?: string } | undefined
      return props?.adcode ? String(props.adcode) : ""
    }
    const props = target.properties as Record<string, unknown>
    const code = props[POST_CODE_KEY]
    return typeof code === "string" ? code : ""
  }

  private dbClickHandler = (params: PointParam<T> | GEOParam) => {
    params.event.event.stopPropagation()
    if (params.componentType === "geo") {
      const nextLevel = this.checkMapEntryEligibility(params)
      if (isUndef(nextLevel)) {
        return
      }

      if (
        MapStateManager.curLevel === MapLevel.COUNTRY &&
        nextLevel === MapLevel.PROVINCE &&
        !JUST_SUPPORTED_NEXT_LEVEL_COUNTRIES_AD_CODE.includes(MapStateManager.adcode)
      ) {
        return
      }

      let nextAdCode
      if (MapStateManager.curLevel === MapLevel.WORLD) {
        if (params.name === G2.CHINA) {
          nextAdCode = CHINA_AD_CODE_JUST_FOR_FE
        } else if (params.name === G2.USA) {
          nextAdCode = US_AD_CODE_JUST_FOR_FE
        } else {
          nextAdCode = this.getPostCodeByGeoFeatures(params.name)
        }
      } else {
        nextAdCode = this.getPostCodeByGeoFeatures(params.name)
      }
      params.region.adcode = nextAdCode
      this.events.onDoubleClickArea?.(nextLevel as MapLevel, params as GEOParam)
      MapStateManager.curLevel = nextLevel as MapLevel
      MapStateManager.adcode = nextAdCode
      MapStateManager.country = params.region.name ?? ""
      MapStateManager.getGeoJsonData({
        mapLevel: nextLevel as MapLevel,
        country: params.region.name ?? "",
        region: nextAdCode,
      }).then((result) => {
        MapStateManager.setGeoData(result)
      })
    }
  }

  private waitForBoundaryLoadingToBeFalse(timeout = 5000) {
    const startTime = Date.now()
    return new Promise((resolve, reject) => {
      const checkState = () => {
        if (!this.boundaryLoading) {
          resolve(true)
        } else if (Date.now() - startTime > timeout) {
          reject(new Error("获取地图轮廓加载状态超时"))
        } else {
          setTimeout(checkState, 1000)
        }
      }
      checkState()
    })
  }

  private transSeriesCoordinate2GeoJsonXY(series: SeriesOption[]): SeriesOption[] {
    // @ts-ignore
    const transform = this.detailGeojson["hc-transform"]
    return series.map(item => {
      let data
      if (item.type === PointTypeEnum.SCATTER || item.type === PointTypeEnum.EFFECT_SCATTER) {
        data = (item.data as PointSeriesDataItem<AnyObj>[]).map(point => {
          return {
            ...point,
            value: GeoJsonUtils.lngLatToProjected(transform, point.value as CoordinateNumber),
          }
        })
      } else if (item.type === "lines") {
        data = (item.data as LineSeriesDataItem<AnyObj>[]).map(line => {
          const [startCoords, endCoords] = line.coords
          return {
            ...line,
            coords: [GeoJsonUtils.lngLatToProjected(transform, startCoords), GeoJsonUtils.lngLatToProjected(transform, endCoords)],
          }
        })
      }
      return {
        ...item,
        data: data || item.data,
      } as SeriesOption
    })
  }

  private updateSeriesImpl = async (series: SeriesOption[]) => {
    await this.waitForBoundaryLoadingToBeFalse()
    if (this.currentMapIsChina) {
      const option: EChartsCoreOption = { series }
      this.setChartOption(option)
    } else {
      if (MapStateManager.curLevel === MapLevel.COUNTRY && MapStateManager.adcode === US_AD_CODE_JUST_FOR_FE) {
        const option: EChartsCoreOption = { series }
        this.setChartOption(option)
      } else {
        const newSeries = this.transSeriesCoordinate2GeoJsonXY(series)
        const option: EChartsCoreOption = { series: newSeries }
        this.setChartOption(option)
      }
    }
  }

  public setPointStyleInternal(targetSeriesName: string, processFn: (dataItem: PointSeriesDataItem<T>) => void) {
    const currentOption = this.chartInstance?.getOption()
    if (!currentOption || !Array.isArray(currentOption.series)) {
      return
    }
    const series = currentOption.series
    const pointSeries = series.find((item: SeriesOption) => item.name === targetSeriesName) as PointSeries<T>
    if (!pointSeries) {
      return
    }

    const data = pointSeries.data
    data.forEach(item => {
      processFn(item)
    })
    const newOption: EChartsCoreOption = { series }
    this.setChartOption(newOption)
  }

  private redrawMap = () => {
    const chartInstance = this.chartInstance
    if (!chartInstance) {
      return
    }
    const newOption = chartInstance.getOption()
    const geo = newOption.geo as AnyObj[]
    if (!geo || isEmptyArray(geo) || isUndef(geo[0])) {
      return
    }
    const geoComponent = geo[0]
    const mapType = geoComponent.map

    chartInstance.dispatchAction({
      type: "changeGeoRoam",
      componentType: "geo",
      map: mapType,
      center: geoComponent.center,
      zoom: geoComponent.zoom,
    })
    this.events.onZoom?.(geoComponent.zoom)
  }

  private registerEvents() {
    window.addEventListener("resize", this.resizeMap)
  }

  public resizeMap = () => {
    this.chartInstance?.resize()
  }

  public updateMapLevel(curLevel: MapLevel) {
    // 通过状态管理器更新状态
    MapStateManager.curLevel = curLevel
    
    const chart = this.chartInstance as unknown as { getOption?: () => AnyObj }
    const currentOption = chart?.getOption?.()
    const geo = (currentOption?.geo as AnyObj[]) || []
    const hasInitializedGeo = Array.isArray(geo) && geo[0] && geo[0].map
    if (!hasInitializedGeo) {
      return
    }

    const isWorld = curLevel === MapLevel.WORLD
    const option: EChartsCoreOption = {
      geo: {
        itemStyle: {
          ...BOUNDARY_OPTIONS.itemStyle,
          borderWidth: isWorld ? 0 : 1,
          shadowBlur: isWorld ? 1 : 0,
        },
      },
    }
    this.setChartOption(option)
  }

  public destroy() {
    try {
      if (this.detailMap) {
        this.chartInstance?.clear()
      }
    } catch (error) {
      // 忽略清理错误
    }

    window.removeEventListener("resize", this.resizeMap)
    this.chartInstance?.dispose()
    
    // 清理状态监听器
    if (this.unsubscribeState) {
      this.unsubscribeState()
      this.unsubscribeState = null
    }
  }

  private async initChart() {
    if (!this.container) {
      return
    }
     await MapStateManager.getGeoJsonData({
      mapLevel: MapLevel.WORLD,
      country: this.config.country ?? "100000",
      region: this.config.adcode ?? "100000"
    })
    const instance = echarts.init(this.container)
    this.chartInstance = instance

    const baseOption: EChartsCoreOption = {
      tooltip: {
        show: false,
      },
      geo: {
        ...BOUNDARY_OPTIONS,
      },
      series: this.series,
    }

    const geojson = MapStateManager.geoData as GeoJSONSourceInput
    echarts.registerMap(`${this.detailMap}-geo`, geojson)
    this.setChartOption(baseOption)
    instance.on("click", this.clickHandler as unknown as ((params: unknown) => void))
    instance.on("dblclick", this.dbClickHandler as unknown as ((params: unknown) => void))
    instance.on("mouseover", this.mouseoverHandler as unknown as ((params: unknown) => void))
    instance.on("mouseout", this.mouseoutHandler as unknown as ((params: unknown) => void))
    instance.on("georoam", this.redrawMap)
  }

  // 将原有装饰器方法替换为基于函数的防抖版本
  public updateSeries = debounce(this.updateSeriesImpl.bind(this), 300)
  private handleChangeArea = debounce(this.handleChangeAreaImpl.bind(this), 600)


  /**
   * 处理状态变化
   */
  private handleStateChange(newState: any, oldState: any) {
    if (!this.chartInstance) return

    // 处理地图层级变化
    if (newState.curLevel !== oldState.curLevel) {
      this.updateMapLevel(newState.curLevel)
    }

    // 处理地理数据变化
    if (newState.geoData !== oldState.geoData) {
      this.setGEOData(newState.geoData, newState.detailGeoData)
    }

    // 处理点数据变化
    if (newState.points !== oldState.points) {
      this.updatePointsInEcharts(newState.points)
    }

    // 处理线数据变化
    if (newState.lines !== oldState.lines) {
      this.updateLinesInEcharts(newState.lines)
    }
  }

  /**
   * 在 ECharts 中更新点数据
   */
  private async updatePointsInEcharts(points: BaseMapPoint[]) {
    if (!this.chartInstance) return
    
    const pointSeries = this.convertPointsToSeries(points)
    await this.updateSeries(pointSeries)
  }

  /**
   * 在 ECharts 中更新线数据
   */
  private async updateLinesInEcharts(lines: BaseMapLine[]) {
    if (!this.chartInstance) return
    
    const lineSeries = this.convertLinesToSeries(lines)
    
    await this.updateSeries([ ...lineSeries])
  }

  /**
   * 将统一的事件格式转换为 ECharts 需要的格式
   */
  private convertEventsToEchartsFormat(events?: MapRendererEvents): EchartsMapEvents<T> {
    if (!events) return {}

    return {
      onClickPoint: events.onPointClick ? (params: PointParam<T>) => {
        const point = this.findPointByData(params)
        if (point) events.onPointClick!(point)
      } : undefined,
      
      onHoverPoint: events.onPointHover ? (params: PointParam<T>) => {
        const point = this.findPointByData(params)
        events.onPointHover!(point || null)
      } : undefined,
      
      onClickArea: events.onAreaClick ? (params?: GEOParam) => {
        if (params) {
          events.onAreaClick!({
            name: params.name,
            adcode: params.region?.adcode,
          })
        }
      } : undefined,
      
      onHoverArea: events.onAreaHover ? (params?: GEOParam, pointsInRegion?: string[]) => {
        if (params) {
          events.onAreaHover!({
            name: params.name,
            adcode: params.region?.adcode,
          })
        } else {
          events.onAreaHover!(null)
        }
      } : undefined,
      
      onDoubleClickArea: events.onAreaDoubleClick ? (nextLevel: MapLevel, params: GEOParam) => {
        events.onAreaDoubleClick!({
          name: params.name,
          adcode: params.region?.adcode,
          nextLevel,
        })
      } : undefined,
      
      onZoom: events.onZoom,
    }
  }

  /**
   * 根据 ECharts 事件参数查找对应的点数据
   */
  private findPointByData(params: PointParam<T>): BaseMapPoint | undefined {
    if (!params.data || !params.data.businessInfo) return undefined
    const businessInfo = params.data.businessInfo as any
    if (!businessInfo || typeof businessInfo !== 'object' || !('id' in businessInfo)) return undefined

  }

  /**
   * 规范化地理数据格式
   */
  private normalizeGeoData(data: FeatureCollection | FeatureCollection): FeatureCollection {
    // 如果已经是 GeoJsonData 格式，直接返回
    if ('type' in data && data.type === 'FeatureCollection') {
      return data as FeatureCollection
    }
    return data as FeatureCollection
  }

  /**
   * 将点数据转换为 ECharts Series
   */
  private convertPointsToSeries(points: BaseMapPoint[]): SeriesOption[] {
    const scatterData = points.map(point => ({
      name: point.name || '',
      value: [...point.coordinate, point.value || 0],
      businessInfo: point,
      itemStyle: point.style ? {
        color: point.style.color,
        opacity: point.style.opacity,
      } : undefined,
    }))

    return [{
      name: 'points',
      type: PointTypeEnum.SCATTER,
      coordinateSystem: 'geo',
      data: scatterData,
      symbolSize: (val: any) => {
        const point = val[2] || 10
        return Math.sqrt(point) * 2
      },
      label: {
        show: false,
      },
      emphasis: {
        label: {
          show: true,
          position: 'right',
        },
      },
    }]
  }

  /**
   * 将线数据转换为 ECharts Series
   */
  private convertLinesToSeries(lines: BaseMapLine[]): SeriesOption[] {
    const lineData = lines.map(line => ({
      coords: [line.from, line.to],
      businessInfo: line,
      lineStyle: line.color ? {
        color: line.color?.toString(),
        width: line.width || 2,
        opacity: line.opacity || 1,
      } : undefined,
    }))

    return [{
      name: 'lines',
      type: 'lines',
      coordinateSystem: 'geo',
      data: lineData,
      large: true,
      effect: {
        show: true,
        period: 6,
        trailLength: 0.7,
        symbolSize: 3,
      },
      lineStyle: {
        width: 2,
        opacity: 0.6,
      },
    }]
  }

  // IMapRenderer interface implementation
  async setGeoData(boundary: FeatureCollection): Promise<void> {
    if (!this.chartInstance) return

    // 如果是 FeatureCollection 类型，需要转换为 GeoJsonData
    const geoData = this.normalizeGeoData(boundary)

    // 更新状态管理器
    MapStateManager.setGeoData(geoData)
  }

  async setPoints(points: BaseMapPoint[]): Promise<void> {
    if (!this.chartInstance) return
    
  }

  async setLines(lines: BaseMapLine[]): Promise<void> {
    if (!this.chartInstance) return
    
  }

  async updateMapView(config: {
    curLevel: MapLevel
    adcode: string
    country: string
  }) {
    MapStateManager.curLevel = config.curLevel
    MapStateManager.adcode = config.adcode
    MapStateManager.country = config.country
    // 更新状态管理器中的状态
    

    // 获取地理数据
    const geoData = await getGeoJsonData({
      mapLevel: config.curLevel,
      country: config.country,
      region: config.adcode,
    })

    // 更新地理数据到状态管理器
    MapStateManager.setGeoData(geoData)
  }

  // IMapRenderer interface method - adapts to existing setPointStyle
  setPointStyle(seriesName: string, styleProcessor: (point: BaseMapPoint) => void): void {
    if (!this.chartInstance) return
    
    this.setPointStyleInternal(seriesName, (dataItem: PointSeriesDataItem<T>) => {
      const point = this.findPointByData({ data: dataItem } as PointParam<T>)
      if (point) {
        styleProcessor(point)
      }
    })
  }

  resize(): void {
    this.resizeMap()
  }

  getType(): "echarts" {
    return "echarts"
  }

  // 计算中心和缩放（简单估算）
  private getCenterAndZoomByGeometryCoordinates(coords: unknown): { center: [number, number] | null; zoom: number } {
    const flat: [number, number][] = []
    const collect = (c: unknown): void => {
      if (Array.isArray(c)) {
        if (typeof c[0] === "number" && typeof c[1] === "number") {
          flat.push([c[0] as number, c[1] as number])
        } else {
          for (const sub of c) collect(sub)
        }
      }
    }
    collect(coords)
    if (flat.length === 0) return { center: null, zoom: 1 }
    let minLng = flat[0][0], maxLng = flat[0][0], minLat = flat[0][1], maxLat = flat[0][1]
    for (const [lng, lat] of flat) {
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    }
    const center: [number, number] = [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
    const lngDiff = Math.max(0.0001, Math.abs(maxLng - minLng))
    const latDiff = Math.max(0.0001, Math.abs(maxLat - minLat))
    const zoom = Math.min(Math.log2(360 / lngDiff), Math.log2(180 / latDiff))
    return { center, zoom: Math.max(0.5, Math.min(zoom, 6)) }
  }
}