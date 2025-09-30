import { defineComponent, ref, onMounted } from 'vue'
import { createUnifiedMap, MapRendererType, UnifiedMapComponent } from '@orch-map/core'


export default defineComponent({
  name: 'HelloWorld',
  props: {
    msg: {
      type: String,
      default: 'Hello World'
    }
  },
  setup(props) {
    const geoContainer = ref<HTMLElement | null>(null);
    const mapInstance = ref<UnifiedMapComponent | null>(null);
    
    onMounted(() => {
      if (geoContainer.value) {
        mapInstance.value = createUnifiedMap({
          container: geoContainer.value,
          renderType: MapRendererType.DECKGL,
          autoFallback: true,
        });
      }
    });
    
    return () => (
      <div class="hello-world" style={{ width: '100vw', height: '100vh',overflow: 'hidden' }}>
        <div ref={geoContainer} style={{ width: '100%', height: '100%',backgroundColor: 'rgb(17, 36, 100)' }}>
        </div>
      </div>
    )
  }
})
