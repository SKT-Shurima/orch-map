import { defineComponent, ref, onMounted, onUnmounted } from "vue";
import { Deck } from "@deck.gl/core";
import { ArcTripsLayer, GeoJsonLayer } from "@deck.gl/layers";
import mockData from "./mock.json";

// source: Natural Earth http://www.naturalearthdata.com/ via geojson.xyz
const COUNTRIES =
  "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_scale_rank.geojson";

// Extract cities from mock data
const CITIES: Record<string, [number, number]> = {};
mockData.points.forEach((point) => {
  CITIES[point.name] = point.coordinate as [number, number];
});

// Generate flight routes with timestamps using mock data
function generateFlightRoutes(): Array<{
  sourcePosition: [number, number];
  targetPosition: [number, number];
  sourceTimestamp: number;
  targetTimestamp: number;
  sourceColor: [number, number, number, number];
  targetColor: [number, number, number, number];
  width: number;
  height: number;
}> {
  const routes: Array<{
    sourcePosition: [number, number];
    targetPosition: [number, number];
    sourceTimestamp: number;
    targetTimestamp: number;
    sourceColor: [number, number, number, number];
    targetColor: [number, number, number, number];
    width: number;
    height: number;
  }> = [];

  // Use lines from mock data as base routes
  mockData.lines.forEach((line, index) => {
    // Calculate base timestamp based on line index to create staggered animation
    const baseTime = (index % 20) * 50; // Group lines into batches of 20
    const travelTime = 200 + Math.random() * 300;

    routes.push({
      sourcePosition: line.startCoordinate as [number, number],
      targetPosition: line.endCoordinate as [number, number],
      sourceTimestamp: baseTime,
      targetTimestamp: baseTime + travelTime,
      sourceColor: line.color as [number, number, number, number],
      targetColor: line.color as [number, number, number, number],
      width: line.style === "dashed" ? 0.5 : 1,
      height: 0.2 + Math.random() * 0.4,
    });
  });

  // Add some additional random routes between major cities for more dynamic effect
  const majorCities = mockData.points.filter(point =>
    point.region === "国外" || point.name === "上海" || point.name === "北京" || point.name === "深圳",
  );

  majorCities.forEach((city, cityIndex) => {
    if (Math.random() > 0.7) { // 30% chance of additional random connection
      const otherCities = majorCities.filter(c => c.id !== city.id);
      const randomCity = otherCities[Math.floor(Math.random() * otherCities.length)];

      const baseTime = (cityIndex % 10) * 100;
      const travelTime = 300 + Math.random() * 400;

      routes.push({
        sourcePosition: city.coordinate as [number, number],
        targetPosition: randomCity.coordinate as [number, number],
        sourceTimestamp: baseTime,
        targetTimestamp: baseTime + travelTime,
        sourceColor: [255, 100, 0, 200], // Orange for random routes
        targetColor: [255, 100, 0, 200],
        width: 0.8,
        height: 0.3 + Math.random() * 0.2,
      });
    }
  });

  return routes;
}

const INITIAL_VIEW_STATE = {
  latitude: 35,
  longitude: 110,
  zoom: 2.5,
  repeat: true,
  bearing: 0,
  pitch: 45,
  minZoom: 1,
  maxZoom: 10,
};

// Generate routes data
const routes = generateFlightRoutes();

export default defineComponent({
  name: "ArcTripsDemo",
  setup() {
    const deckContainer = ref<HTMLElement | null>(null);
    let deck: Deck | null = null;
    let animationId: number | null = null;

    // Animation parameters
    const currentTime = ref(0);
    const maxTime = 1000; // Max time for animation loop
    const isPaused = ref(false);

    // Animation configuration
    const config = ref({
      fadeTrail: true,
      trailLength: 100,
      showFullArc: true,
      dotSize: 0.01,
      dotTrailLength: 0.1,
      animationSpeed: 1.0,
    });

    // Animation loop
    const animate = () => {
      if (!isPaused.value) {
        currentTime.value = (currentTime.value + 1) % maxTime;

        updateLayers({
          currentTime: currentTime.value,
          ...config.value,
        });

        animationId = requestAnimationFrame(animate);
      }
    };

    const updateLayers = (props: {
      currentTime: number;
      fadeTrail: boolean;
      trailLength: number;
      showFullArc: boolean;
      dotSize: number;
      dotTrailLength: number;
      animationSpeed: number;
    }) => {
      const {
        currentTime: time,
        fadeTrail,
        trailLength,
        dotSize,
        dotTrailLength,
        animationSpeed,
      } = props;

      if (!deck) return;

      deck.setProps({
        layers: [
          new GeoJsonLayer({
            id: "base-map",
            data: COUNTRIES,
            stroked: true,
            filled: true,
            lineWidthMinPixels: 1,
            opacity: 0.3,
            getLineColor: [200, 200, 200],
            getFillColor: [22, 22, 22],
          }),
          // 基础弧线层（灰色，低透明度）
          new ArcTripsLayer({
            id: "arc-base",
            data: routes,
            getSourcePosition: (d: typeof routes[0]) => d.sourcePosition,
            getTargetPosition: (d: typeof routes[0]) => d.targetPosition,
            getSourceColor: [255, 255, 0, 150], // 灰色，透明度 0.1
            getTargetColor: [255, 255, 0, 150],
            getWidth: (d: typeof routes[0]) => d.width,
            getHeight: (d: typeof routes[0]) => d.height,
            getSourceTimestamp: (d: typeof routes[0]) => d.sourceTimestamp,
            getTargetTimestamp: (d: typeof routes[0]) => d.targetTimestamp,

            // Animation properties
            currentTime: time * animationSpeed,
            fadeTrail: false, // 不使用动画效果，显示完整弧线
            trailLength,
            showFullArc: true,
            dotSize,
            dotTrailLength,
            animationSpeed,

            // Arc properties
            greatCircle: true,
            numSegments: 50,
            widthMinPixels: 1,
          }),
          // 尾迹层（红色，带动画）
          new ArcTripsLayer({
            id: "arc-trips",
            data: routes,
            getSourcePosition: (d: typeof routes[0]) => d.sourcePosition,
            getTargetPosition: (d: typeof routes[0]) => d.targetPosition,
            getSourceColor: [255, 0, 0, 255], // 红色尾迹
            getTargetColor: [255, 0, 0, 255],
            getWidth: (d: typeof routes[0]) => d.width,
            getHeight: (d: typeof routes[0]) => d.height,
            getSourceTimestamp: (d: typeof routes[0]) => d.sourceTimestamp,
            getTargetTimestamp: (d: typeof routes[0]) => d.targetTimestamp,

            // Animation properties
            currentTime: time * animationSpeed,
            fadeTrail,
            trailLength,
            showFullArc: false, // 只显示尾迹部分
            dotSize,
            dotTrailLength,
            animationSpeed,

            // Arc properties
            greatCircle: true,
            numSegments: 50,
            widthMinPixels: 1,

            // Interactive
            pickable: true,
            autoHighlight: true,
            onClick: (info: { object?: unknown }) => {
              if (info.object) {
                // eslint-disable-next-line no-console
                console.log("Arc clicked:", info.object);
              }
            },
          }),
        ],
      });
    };

    const pausePlay = () => {
      isPaused.value = !isPaused.value;

      if (isPaused.value) {
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      } else {
        animate();
      }
    };

    const reset = () => {
      currentTime.value = 0;
    };

    onMounted(() => {
      if (deckContainer.value) {
        // Initialize deck
        deck = new Deck({
          initialViewState: INITIAL_VIEW_STATE,
          controller: true,
          layers: [],
        });

        // Start animation
        animate();
      }
    });

    onUnmounted(() => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (deck) {
        deck.finalize();
      }
    });

    return () => (
      <div
        class="arc-trips-demo"
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <div
          ref={deckContainer}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "rgb(17, 36, 100)",
          }}
        />

        {/* Control Panel */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "20px",
            borderRadius: "8px",
            minWidth: "300px",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", fontSize: "18px" }}>
            ArcTripsLayer Demo
          </h3>
          <p style={{ margin: "0 0 15px 0", fontSize: "14px", opacity: 0.8 }}>
            Visualizing animated flight routes using mock data (100+ cities worldwide)
          </p>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={config.value.fadeTrail}
                onChange={(e: Event) => {
                  const target = e.target as unknown as { checked: boolean };
                  config.value.fadeTrail = target.checked;
                }}
              />
              Fade Trail
            </label>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              Trail Length: <span>{config.value.trailLength}</span>
              <input
                type="range"
                min="10"
                max="300"
                value={config.value.trailLength}
                onChange={(e: Event) => {
                  const target = e.target as unknown as { value: string };
                  config.value.trailLength = parseFloat(target.value);
                }}
                style={{ flex: 1 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={config.value.showFullArc}
                onChange={(e: Event) => {
                  const target = e.target as unknown as { checked: boolean };
                  config.value.showFullArc = target.checked;
                }}
              />
              Show Full Arc
            </label>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              Dot Size: <span>{config.value.dotSize.toFixed(2)}</span>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={config.value.dotSize}
                onChange={(e: Event) => {
                  const target = e.target as unknown as { value: string };
                  config.value.dotSize = parseFloat(target.value);
                }}
                style={{ flex: 1 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              Dot Trail Length: <span>{config.value.dotTrailLength.toFixed(2)}</span>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={config.value.dotTrailLength}
                onChange={(e: Event) => {
                  const target = e.target as unknown as { value: string };
                  config.value.dotTrailLength = parseFloat(target.value);
                }}
                style={{ flex: 1 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              Animation Speed: <span>{config.value.animationSpeed.toFixed(1)}</span>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={config.value.animationSpeed}
                onChange={(e: Event) => {
                  const target = e.target as unknown as { value: string };
                  config.value.animationSpeed = parseFloat(target.value);
                }}
                style={{ flex: 1 }}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={pausePlay}
              style={{
                padding: "8px 16px",
                backgroundColor: isPaused.value ? "#4CAF50" : "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {isPaused.value ? "Play" : "Pause"}
            </button>
            <button
              onClick={reset}
              style={{
                padding: "8px 16px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    );
  },
});
