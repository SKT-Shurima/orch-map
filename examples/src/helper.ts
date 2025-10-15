import { BaseMapPoint } from "@orch-map/types";
import { isDef } from "@orch-map/utils";
import { AdapterParams } from "./interface";

export const computePointStyle = (
  point: BaseMapPoint,
  config: AdapterParams,
): {
  labelShow: boolean;
  labelHoverShow: boolean;
  labelName: string | undefined;
  isStarred: boolean;
} => {
  const { filterPoint, staredPoints = [], showNamePoints = [] } = config;
  let isStarred = false;
  let labelShow = false;
  let labelHoverShow = false;
  let labelName: string | undefined;
  if (staredPoints.length > 0) {
    isStarred = staredPoints.some((p) => p.id === point.id);
    // 星标站点必然要显示，不受 filter 和 showNamePointIds 的影响
    if (isStarred) {
      labelShow = true;
      labelHoverShow = false;
    }
  }

  const onlyShowPartialNodeNames =
    (Array.isArray(showNamePoints) && showNamePoints.length > 0) ||
    isDef(filterPoint);
  // 是否过滤
  if (onlyShowPartialNodeNames) {
    labelName =
      filterPoint && point.siblingPointId?.includes(filterPoint.id)
        ? filterPoint.name
        : (staredPoints.find((point) => point.id === point.id)?.name ??
          showNamePoints.find((point) => point.id === point.id)?.name);
    if (labelName) {
      labelShow = true;
      labelHoverShow = false;
    }
  } else {
    labelName = point.name;
  }
  return {
    labelShow,
    labelHoverShow,
    labelName,
    isStarred,
  };
};
