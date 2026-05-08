//src/views/aviation-situation/composables/satellite/useSatellite.ts
import { onUnmounted, markRaw, watch,ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import {getSatelliteGeoeye1} from "@/network/satellite/index.ts"
import { Satellite } from '@/network/satellite/type'

export function useSatellite(viewer:ShallowRef<Cesium.Viewer>) {

  const initSatellite=()=>{
    const position = Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706,500000)

    viewer.value.entities.add({
      position,
      model: {
        uri: 'model/satellite/Active Cavity Irradiance Monitor Satellite (AcrimSAT) (B).glb', // public 下的路径；或用 Vite 里 import 后的 URL
        minimumPixelSize: 32,
        // maximumScale: 20000,
      },
    })

    // viewer.value.scene.camera.setView({
    //   destination:Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706,1000000)
    // })
  }

  const loadAndDrawSatellite = async () => {
    try {
      const satellite: Satellite = await getSatelliteGeoeye1()
      console.log("satellite", satellite);
    } catch (error) {
      console.error('加载机场数据失败:', error)
      clearAirports()
      airportStore.clearMatchedAirports()
    }
  }


  return {
    initSatellite,
    loadAndDrawSatellite,
  }
}
