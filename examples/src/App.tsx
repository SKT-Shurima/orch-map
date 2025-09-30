import { defineComponent, ref, onMounted } from 'vue'
import  OrchMap, { MapRendererType } from '@orch-map/core'
import { MapLevel } from '@orch-map/types'


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
    const mapInstance = ref<OrchMap | null>(null);

    onMounted(() => {
      if (geoContainer.value) {
        mapInstance.value = new OrchMap({
          renderType: MapRendererType.DECKGL,
          mode: "2d",
          container: geoContainer.value,
          curLevel: MapLevel.WORLD,
          country: "000000",
          adcode: "000000",
          events: {
            onMapClick: (event) => {
              console.log(event)
            }
          }
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
