import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

import { onUnmounted, ShallowRef, shallowRef } from 'vue'
import type { LngLatAlt } from '@/views/aviation-situation/types/shared'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import { flyToLngLatAlt } from '@/utils/geoUtils'

export function useCesiumViewer(containerId = 'cesium-container') {
  // Cesium.Ion.defaultAccessToken = '你的token，并注释掉下面的baseLayer';
  Cesium.Ion.defaultAccessToken = '';

  const viewer = shallowRef<Cesium.Viewer | null>(null)
  const initViewer = (): void => {
    viewer.value = new Cesium.Viewer(containerId, {
      // timeline: false,
      // animation: false,
      // 1. 关闭绿色的选中框 (Selection Indicator)
      selectionIndicator: false,
      infoBox: false,
      // fullscreenButton: false,    // 全屏
      navigationHelpButton: false,// 帮助问号
      sceneModePicker: false,     // 2D/3D切换
      geocoder: false,           // 右上角搜索框
      homeButton: false,         // 主页图标

      baseLayerPicker: false,
      baseLayer: Cesium.ImageryLayer.fromProviderAsync(
        new Cesium.UrlTemplateImageryProvider({
          url: 'map/normal/{z}/{x}/{reverseY}.jpg',
        })
      ),
      // terrain: Cesium.Terrain.fromWorldTerrain({
      //   requestWaterMask: true,
      //   requestVertexNormals:true,
      // }),
    })
    viewer.value.timeline.container.style.display = 'none';
    viewer.value.scene.debugShowFramesPerSecond = true
    viewer.value._cesiumWidget._creditContainer.style.display = 'none'

    viewer.value.cesiumWidget.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    )

    flyToLngLatAlt(viewer,{
      longitude:-98.0,
      latitude:40.0,
      height:6000000,
    },0,0)

    // const x = 3849424.41859634
    // const y = 5535808.90838488
    // const z = -469609.955032837
    //
    // const cartesian = new Cesium.Cartesian3(x, y, z)
    // const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
    //
    // const destination = Cesium.Cartesian3.fromRadians(
    //   cartographic.longitude,
    //   cartographic.latitude,
    //   6000000, // 目标高度
    // )
    //
    // viewer.value.scene.camera.setView({
    //   destination,
    // })

    // const center = Cesium.Cartesian3.fromDegrees(-98.0, 40.0);
    // viewer.value.camera.lookAt(center, new Cesium.Cartesian3(0.0, -4790000.0, 3930000.0));

    const start = Cesium.JulianDate.fromIso8601("2012-03-15T10:00:00Z");
    const stop = Cesium.JulianDate.fromIso8601("2012-03-16T08:27:42.5600708879647Z");
    viewer.value.clock.startTime = start.clone();
    viewer.value.clock.stopTime = stop.clone();
    viewer.value.clock.currentTime = start.clone();

    viewer.value.timeline.zoomTo(start, stop);
    viewer.value.clock.multiplier = 1;
    viewer.value.clock.shouldAnimate = true;
  }

  const destroyViewer = (): void => {
    if (viewer.value) {
      viewer.value.destroy()
      viewer.value = null
    }
  }

  onUnmounted(() => {
    // destroyViewer()
  })

  return {
    viewer,
    initViewer,
    destroyViewer,
  }
}
