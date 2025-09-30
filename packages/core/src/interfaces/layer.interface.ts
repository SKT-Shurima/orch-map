export enum LayerType {
  POINT = "point",
  LINE = "line",
  POLYGON = "polygon",
  ARC = "arc",
  PATH = "path",
  GEO = "geo",
}

export interface LayerData {
  type: LayerType;
  data: any;
}