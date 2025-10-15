import { defineComponent, ref, onMounted } from "vue";
import OrchMap, { MapRendererType } from "@orch-map/core";
import { BaseMapLine, BaseMapPoint, MapLevel } from "@orch-map/types";
import mock from "./mock.json";
import { pick } from "@orch-map/utils";
import diamond from "./assets/diamond.svg?raw";
import star from "./assets/star.svg?raw";
import { computePointStyle } from "./helper";
import { AdapterParams, AdapterPointInfo } from "./interface";


const getRandomPoint = () => {
  return mock.points[Math.floor(Math.random() * mock.points.length)];
};

export default defineComponent({
  name: "HelloWorld",
  props: {
    msg: {
      type: String,
      default: "Hello World",
    },
  },
  setup() {
    const geoContainer = ref<HTMLElement | null>(null);
    let mapInstance!: OrchMap;

    onMounted(() => {
      if (geoContainer.value) {
        mapInstance = new OrchMap({
          renderType: MapRendererType.DECKGL,
          mapVersion: "standard",
          mode: "2d",
          container: geoContainer.value,
          curLevel: MapLevel.WORLD,
          country: "",
          postcode: "",
          events: {
            onMapClick: (event) => {
              console.log(event);
            },
          },
        }, {
          // 直接传递原始 SVG 字符串，OrchMap 会自动处理 ECharts 和 DeckGL 的格式转换
          cpe: diamond,
          star,
        });

        const adapterParams: AdapterParams = {
          filterPoint: pick(getRandomPoint(), ["id", "name"]) as AdapterPointInfo,
          activePoints: [],
          staredPoints: Array.from({ length: 10 }, () => pick(getRandomPoint(), ["id", "name"]) as AdapterPointInfo),
          showNamePoints: [],
        };

        const points = mock.points.map((point: any) => {
          const { labelHoverShow, labelName, isStarred } = computePointStyle(point, adapterParams);
          return {
            ...point,
            icon: isStarred ? "star" : "cpe",
            size: isStarred ? 16 : 16,
            siblingPointId: [],
            label: {
              name: labelName,
              show: true, // 默认显示所有点的标签
              hoverShow: labelHoverShow,
              formatter: () => labelName ?? point.name ?? "",
            },
          };
        });

        mapInstance.setPoints(points as unknown as BaseMapPoint[]);
        mapInstance.setLines(mock.lines as BaseMapLine[]);
      }
    });

    return () => (
      <div class="hello-world" style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 1000, display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => mapInstance.returnToWorldMap()}>返回世界地图</button>
          <button onClick={() => mapInstance.navigateToLevel(MapLevel.COUNTRY, "China")}>中国地图</button>
          <button onClick={() => mapInstance.navigateToLevel(MapLevel.COUNTRY, "United States")}>美国地图</button>
          <button onClick={() => mapInstance.navigateToLevel(MapLevel.PROVINCE, "China", "北京", "110000")}>北京地图</button>
        </div>
        <div ref={geoContainer} style={{ width: "100%", height: "100%", backgroundColor: "rgb(17, 36, 100)" }}>
        </div>
      </div>
    );
  },
});
