export type AdapterPointInfo = {
  id: string
  name: string
}

/**
 * @description: 将大屏的配置信息进行统一口径处理
 */
export interface AdapterParams {
  filterPoint?: AdapterPointInfo
  activePoints: AdapterPointInfo[]
  staredPoints: AdapterPointInfo[]
  showNamePoints: AdapterPointInfo[]
}
