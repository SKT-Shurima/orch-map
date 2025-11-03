// 初始视图状态
const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 0,
};

const EARTH_RADIUS_METERS = 6.3e6;

// 创建光照效果 - 使用高强度环境光确保颜色正确显示
const ambientLight = new deck.AmbientLight({
  color: [255, 255, 255], // 白色环境光，不改变物体颜色
  intensity: 1.0,
});

const sunLight = new deck._SunLight({
  color: [255, 255, 255],
  intensity: 0.0, // 禁用太阳光
  timestamp: Date.now(),
});

const lightingEffect = new deck.LightingEffect({ ambientLight, sunLight });

// 创建球体几何体的辅助函数
// 注意：移除顶点颜色，只使用 getColor 来设置颜色
function createSphereGeometry(radius, nlat, nlong) {
  const positions = [];
  const normals = [];
  const texCoords = [];
  const indices = [];

  // 生成球体顶点
  for (let lat = 0; lat <= nlat; lat++) {
    const theta = (lat * Math.PI) / nlat;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= nlong; lon++) {
      const phi = (lon * 2 * Math.PI) / nlong;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;

      positions.push(radius * x, radius * y, radius * z);
      normals.push(x, y, z);
      texCoords.push(lon / nlong, lat / nlat);
    }
  }

  // 生成索引
  for (let lat = 0; lat < nlat; lat++) {
    for (let lon = 0; lon < nlong; lon++) {
      const first = lat * (nlong + 1) + lon;
      const second = first + nlong + 1;

      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return {
    attributes: {
      positions: {
        value: new Float32Array(positions),
        size: 3,
      },
      normals: {
        value: new Float32Array(normals),
        size: 3,
      },
      texCoords: {
        value: new Float32Array(texCoords),
        size: 2,
      },
    },
    indices: new Uint16Array(indices),
  };
}

// 初始化DeckGL
function initDeck() {
  // 创建球体几何体
  const sphereGeometry = createSphereGeometry(EARTH_RADIUS_METERS, 18, 36);

  // 地球自转速度（度/秒），真实地球是360度/24小时=15度/小时=0.0042度/秒
  // 这里加快显示效果，设置为约6度/秒
  const ROTATION_SPEED_DEG_PER_SEC = 20; // 度/秒

  let currentViewState = { ...INITIAL_VIEW_STATE };
  let lastTime = performance.now();
  let isMouseOver = false;
  let hoverTimeout = null;

  // 更新 controller 配置的函数
  function updateController(enabled) {
    deckgl.setProps({
      controller: {
        dragPan: enabled, // hover 时允许拖动，自转时禁止
        dragRotate: false, // 禁用拖拽旋转（GlobeView不支持）
        scrollZoom: enabled
          ? {
              speed: 0.01, // 滚轮缩放速度
              smooth: false, // 禁用平滑滚动，立即响应
            }
          : false, // hover 时允许缩放，自转时禁止
        doubleClickZoom: false, // 禁用双击缩放
        touchZoom: enabled, // hover 时允许触摸缩放，自转时禁止
        keyboard: false, // 禁用键盘控制
      },
    });
  }

  const deckgl = new deck.DeckGL({
    container: 'deck-container',
    views: new deck._GlobeView(),
    initialViewState: INITIAL_VIEW_STATE,
    viewState: currentViewState,
    controller: {
      dragPan: true, // 初始时禁止拖动（因为初始时不在 hover 状态）
      dragRotate: false, // 禁用拖拽旋转（GlobeView不支持）
      scrollZoom: true, // 初始时禁止缩放
      doubleClickZoom: false, // 禁用双击缩放
      touchZoom: true, // 初始时禁止触摸缩放
      keyboard: false, // 禁用键盘控制
    },
    effects: [lightingEffect], // 添加光照效果
    layers: [
      // 地球球体 - 深蓝色海洋
      new deck.SimpleMeshLayer({
        id: 'earth-sphere',
        data: [0],
        mesh: sphereGeometry,
        coordinateSystem: deck.COORDINATE_SYSTEM.CARTESIAN,
        getPosition: [0, 0, 0],
        getColor: [0, 100, 200], // RGB格式：深蓝色海洋
        material: false,
        opacity: 1.0,
        pickable: true,
      }),
      // 陆地数据 - 绿色/棕色陆地
      new deck.GeoJsonLayer({
        id: 'earth-land',
        data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson',
        stroked: false,
        filled: true,
        opacity: 0.8,
        getFillColor: [34, 139, 34, 255], // RGBA格式：森林绿色
      }),
    ],
    onViewStateChange: ({ viewState }) => {
      // 立即更新视图状态，不阻塞
      currentViewState = viewState;
      return viewState;
    },
    onHover: (info) => {
      // 检测鼠标是否悬停在球体图层上
      const hoveringSphere = info.layer && info.layer.id === 'earth-sphere';

      // 清除之前的延迟恢复定时器
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }

      if (hoveringSphere) {
        // 鼠标悬停在球体上，暂停自转并启用交互
        if (!isMouseOver) {
          isMouseOver = true;
          updateController(true); // 启用拖动和缩放
          lastTime = performance.now();
        }
      } else if (isMouseOver) {
        // 鼠标离开球体，延迟恢复自转并禁用交互
        hoverTimeout = setTimeout(() => {
          // 如果用户在延迟期间没有重新移回球体，恢复自转并禁用交互
          // 如果用户移回了球体，定时器会被清除，这个回调不会执行
          isMouseOver = false;
          updateController(false); // 禁用拖动和缩放
          lastTime = performance.now();
          hoverTimeout = null;
        }, 150);
      }
    },
    onLoad: () => {
      // DeckGL 加载完成后的额外处理（如果需要）
    },
  });

  // 地球自转动画循环
  function animateRotation() {
    requestAnimationFrame(animateRotation);

    // 如果鼠标悬停在球体上，跳过更新（暂停自转）
    if (isMouseOver) {
      // 更新时间戳，但跳过视图更新
      lastTime = performance.now();
      return;
    }

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // 限制最大 deltaTime 避免跳跃
    lastTime = currentTime;

    if (deltaTime > 0) {
      // 更新经度以实现自转（基于实际经过的时间）
      currentViewState.longitude += ROTATION_SPEED_DEG_PER_SEC * deltaTime;

      // 确保经度在 -180 到 180 之间
      if (currentViewState.longitude > 180) {
        currentViewState.longitude -= 360;
      } else if (currentViewState.longitude < -180) {
        currentViewState.longitude += 360;
      }

      // 使用 viewState 更新
      deckgl.setProps({
        viewState: { ...currentViewState },
      });
    }
  }

  // 启动动画
  animateRotation();
}

// 当页面加载完毕后初始化
document.addEventListener('DOMContentLoaded', initDeck);
