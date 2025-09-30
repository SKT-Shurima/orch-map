"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  MapLevel: () => MapLevel,
  MapRendererType: () => MapRendererType
});
module.exports = __toCommonJS(index_exports);

// src/map.interface.ts
var MapLevel = /* @__PURE__ */ ((MapLevel2) => {
  MapLevel2["WORLD"] = "world";
  MapLevel2["COUNTRY"] = "country";
  MapLevel2["PROVINCE"] = "province";
  MapLevel2["CITY"] = "city";
  MapLevel2["COUNTY"] = "county";
  return MapLevel2;
})(MapLevel || {});
var MapRendererType = /* @__PURE__ */ ((MapRendererType2) => {
  MapRendererType2["ECHARTS"] = "echarts";
  MapRendererType2["DECKGL"] = "deckgl";
  MapRendererType2["LEAFLET"] = "leaflet";
  MapRendererType2["MAPBOX"] = "mapbox";
  return MapRendererType2;
})(MapRendererType || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MapLevel,
  MapRendererType
});
//# sourceMappingURL=index.js.map