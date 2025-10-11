import { defineComponent, ref, onMounted } from "vue";
import OrchMap, { MapRendererType } from "@orch-map/core";
import { BaseMapLine, BaseMapPoint, MapLevel } from "@orch-map/types";
import mock from "./mock.json";
import { pick, svgToEChartsSymbol } from "@orch-map/utils";
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
          renderType: MapRendererType.ECHARTS,
          mapVersion: "standard",
          mode: "2d",
          container: geoContainer.value,
          curLevel: MapLevel.WORLD,
          country: "000000",
          adcode: "000000",
          events: {
            onMapClick: (event) => {
              console.log(event);
            },
          },
        }, {
          cpe: svgToEChartsSymbol(diamond),
          star: svgToEChartsSymbol(star),
        });

        const adapterParams: AdapterParams = {
          filterPoint: pick(getRandomPoint(), ["id", "name"]) as AdapterPointInfo,
          activePoints: [],
          staredPoints: Array.from({ length: 10 }, () => pick(getRandomPoint(), ["id", "name"]) as AdapterPointInfo),
          showNamePoints: [],
        };

        const points = mock.points.map((point: any) => {
          const { labelShow, labelHoverShow, labelName, isStarred } = computePointStyle(point, adapterParams);
          return {
            ...point,
            icon: isStarred ? "star" : "cpe",
            size: isStarred ? 16 : 16,
            siblingPointId: [],
            label: {
              name: labelName,
              show: labelShow,
              hoverShow: labelHoverShow,
            },
          };
        });

        mapInstance.setPoints(points as unknown as BaseMapPoint[]);
        mapInstance.setLines(mock.lines as BaseMapLine[]);
      }
    });

    return () => (
      <div class="hello-world" style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
        <div ref={geoContainer} style={{ width: "100%", height: "100%", backgroundColor: "rgb(17, 36, 100)" }}>
        </div>
      </div>
    );
  },
});
