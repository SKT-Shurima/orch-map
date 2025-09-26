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
  getChinaCities: () => getChinaCities
});
module.exports = __toCommonJS(index_exports);

// src/geo.ts
function getChinaCities() {
  return [
    { name: "\u5317\u4EAC", value: [116.3974, 39.9093, 100] },
    { name: "\u4E0A\u6D77", value: [121.4737, 31.2304, 95] },
    { name: "\u5E7F\u5DDE", value: [113.2644, 23.1291, 90] },
    { name: "\u6DF1\u5733", value: [114.0579, 22.5431, 85] },
    { name: "\u676D\u5DDE", value: [120.1551, 30.2741, 80] }
  ];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getChinaCities
});
//# sourceMappingURL=index.js.map