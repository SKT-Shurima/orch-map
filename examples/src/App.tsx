import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { Geo, MapRegistry } from '@orch-map/core';
import { getChinaCities } from '@orch-map/utils';
import type { GeoConfig, GeoData } from '@orch-map/core';
import chinaMap from './china.json';
export default defineComponent({
  name: 'App',
  setup() {
    const geoContainer = ref<HTMLElement>();
    const geo = ref<Geo>();

    onMounted(async () => {
      if (!geoContainer.value) return;

      try {
        // 注册地图数据
        const registry = MapRegistry.getInstance();
        await registry.registerMap('china', chinaMap);

        // Geo 配置
        const geoConfig: GeoConfig = {
          mapName: 'china',
          center: [105, 36],
          zoom: 1.2,
          roam: true,
          areaColor: '#f0f0f0',
          borderColor: '#999',
          borderWidth: 1
        };

        // 创建 Geo 实例
        geo.value = new Geo(geoContainer.value, geoConfig);
        
        // 转换城市数据格式
        const cities = getChinaCities();
        const geoData: GeoData[] = cities.map(city => ({
          name: city.name,
          value: [city.value[0], city.value[1], city.value[2] || 100]
        }));

        // 添加数据系列
        geo.value.addSeries({
          type: 'scatter',
          data: geoData,
          symbolSize: 8,
          itemStyle: {
            color: '#ff6b6b'
          }
        });

        // 设置事件处理器
        geo.value.setEventHandlers({
          onRegionClick: (params) => {
            console.log('点击了区域:', params.name);
          },
          onRegionMouseOver: (params) => {
            console.log('鼠标悬停在区域:', params.name);
          }
        });

      } catch (error) {
        console.error('Geo 组件初始化失败:', error);
      }
    });

    onUnmounted(() => {
      if (geo.value) {
        geo.value.destroy();
      }
    });

    return () => (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        {/* 头部 */}
        <div style={{
          background: '#2c3e50',
          color: 'white',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Orch Map - Geo 组件示例</h1>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8 }}>
            基于 ECharts Geo 组件的二次封装
          </p>
        </div>

        {/* 切换按钮 */}
        <div style={{
          background: '#34495e',
          padding: '0.5rem',
          textAlign: 'center'
        }}>
          <button
            onClick={() => {
              // 这里可以添加切换逻辑
              console.log('切换到增强版');
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            查看增强版功能
          </button>
        </div>

        {/* Geo 容器 */}
        <div 
          ref={geoContainer}
          style={{
            flex: 1,
            width: '100%',
            background: '#f8f9fa'
          }}
        />
      </div>
    );
  }
});

