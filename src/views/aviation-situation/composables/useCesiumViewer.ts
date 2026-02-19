import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

import { onUnmounted, shallowRef } from 'vue'

export function useCesiumViewer(containerId = 'cesium-container') {
  const viewer = shallowRef<Cesium.Viewer | null>(null)
  const initViewer = (): void => {
    viewer.value = new Cesium.Viewer(containerId, {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      baseLayer: Cesium.ImageryLayer.fromProviderAsync(
        new Cesium.UrlTemplateImageryProvider({
          url: 'map/normal/{z}/{x}/{reverseY}.jpg',
        })
      ),
    })

    viewer.value.scene.debugShowFramesPerSecond = true
    viewer.value._cesiumWidget._creditContainer.style.display = 'none'

    // 设置初始视角
    viewer.value.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(-125.0, 49.0, 6000000),
      duration: 0,
    })
  }

  const destroyViewer = (): void => {
    if (viewer.value) {
      viewer.value.destroy()
      viewer.value = null
    }
  }

  onUnmounted(() => {
    destroyViewer()
  })

  return {
    viewer,
    initViewer,
  }
}
