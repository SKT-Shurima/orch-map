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
          renderType: MapRendererType.ECHARTS,
          mapVersion: "standard",
          mode: "3d",
          container: geoContainer.value,
          curLevel: MapLevel.WORLD,
          center: { lat: 37.7749, lng: -122.4194 }, // 美国旧金山坐标
          country: "",
          postcode: "",
          // 设置地图中心点坐标（仅在初始化时生效）
          // 格式：{ lat: 纬度, lng: 经度 }
          // 北京坐标示例：{ lat: 39.9093, lng: 116.3974 }
          // center: { lat: 39.9093, lng: 116.3974 },
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
          <button onClick={async () => {
            await mapInstance.setRenderType(MapRendererType.DECKGL);
          }}>切换到 DeckGL</button>
          <button onClick={async () => {
            await mapInstance.setRenderType(MapRendererType.ECHARTS);
          }}>切换到 ECharts</button>
          <button onClick={async () => {
            await mapInstance.setMode("3d");
          }}>切换到 3D 模式</button>
          <button onClick={async () => {
            await mapInstance.setMode("2d");
          }}>切换到 2D 模式</button>
          <button
            onClick={() => {
              // 注意：center 配置仅在初始化时生效
              // 如果需要重新设置中心点，需要重新创建地图实例
              console.log("center 配置仅在初始化时生效，当前地图中心点:", {
                lat: 39.9093,
                lng: 116.3974,
              });
            }}
            style={{ backgroundColor: "#1890ff", color: "white" }}
          >
            查看 center 配置说明
          </button>
        </div>
        <div ref={geoContainer} style={{ width: "100%", height: "100%", backgroundColor: "rgb(17, 36, 100)" }}>
        </div>
      </div>
    );
  },
});
