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
export {
  MapLevel,
  MapRendererType
};
//# sourceMappingURL=index.mjs.map