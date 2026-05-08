//src/views/aviation-situation/composables/satellite/useSatellite.ts
import { onUnmounted } from 'vue'
import type { ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import { getSatellites } from '@/network/satellite/index.ts'
import type { Satellite } from '@/network/satellite/type'
import type { SatelliteRenderItem } from '@/views/aviation-situation/types/satellite.ts'

/** 圆锥最小长度（米），避免高度接近 0 时几何退化 */
const CYLINDER_MIN_LENGTH_M = 1

function cylinderLengthFromPosition(positionProperty: Cesium.SampledPositionProperty, time: Cesium.JulianDate) {
  const pos = positionProperty.getValue(time)
  if (!pos) return CYLINDER_MIN_LENGTH_M
  const carto = Cesium.Cartographic.fromCartesian(pos)
  // 椭球高（米）。若需要「到真实地形」的长度，需 sampleTerrainMostDetailed（异步，一般不每帧做）。
  return Math.max(carto.height, CYLINDER_MIN_LENGTH_M)
}

export function useSatellites(viewer:ShallowRef<Cesium.Viewer>) {
  const satelliteRenderMap = new Map<string, SatelliteRenderItem>()
  let isClockTickRegistered = false

  const updateSatelliteCylinderLengths = (clock: Cesium.Clock) => {
    const time = clock.currentTime
    for (const item of satelliteRenderMap.values()) {
      const nextLength = cylinderLengthFromPosition(item.positionProperty, time)
      item.cylinderLengthProperty.setValue(nextLength)
    }
  }

  const registerClockTick = () => {
    if (isClockTickRegistered) return
    viewer.value.clock.onTick.addEventListener(updateSatelliteCylinderLengths)
    isClockTickRegistered = true
  }

  const unregisterClockTick = () => {
    if (!isClockTickRegistered) return
    viewer.value.clock.onTick.removeEventListener(updateSatelliteCylinderLengths)
    isClockTickRegistered = false
  }

  const initSatellites=()=>{

  }

  const drawSatellites=(satellites:Satellite[])=>{
    for(const satellite of satellites){
      const positionProperty = new Cesium.SampledPositionProperty();

      if (!satellite.availability) continue
      const availabilities = satellite.availability.split('/')
      if (availabilities.length < 2) continue
      const startIso8601 = availabilities[0]!
      const stopIso8601 = availabilities[1]!
      const start = Cesium.JulianDate.fromIso8601(startIso8601);
      const stop = Cesium.JulianDate.fromIso8601(stopIso8601);

      const cartesian:number[]=satellite.position.cartesian
      for(let i=0;i<cartesian.length;i+=4){
        const offsetSeconds=cartesian[i]!
        const x=cartesian[i+1]!
        const y=cartesian[i+2]!
        const z=cartesian[i+3]!
        const time = Cesium.JulianDate.addSeconds(start, offsetSeconds, new Cesium.JulianDate());
        const position =  new Cesium.Cartesian3(x, y, z);
        positionProperty.addSample(time, position);

        // viewer.value.entities.add({
        //   description: `Location: (${x}, ${y}, ${z})`,
        //   position: position,
        //   point: { pixelSize: 10, color: Cesium.Color.RED }
        // });
      }

      const cylinderLengthProperty = new Cesium.ConstantProperty(CYLINDER_MIN_LENGTH_M)
      const entity=viewer.value.entities.add({
        availability: new Cesium.TimeIntervalCollection([ new Cesium.TimeInterval({ start: start, stop: stop }) ]),
        position: positionProperty,
        model: {
          uri: 'model/satellite/Active Cavity Irradiance Monitor Satellite (AcrimSAT) (B).glb', // public 下的路径；或用 Vite 里 import 后的 URL
          minimumPixelSize: 32,
          // maximumScale: 20000,
        },
        cylinder: {
          // 在 clock.onTick 里批量更新，避免每个卫星各自 CallbackProperty 调度。
          length: cylinderLengthProperty,
          topRadius: 0.0,
          bottomRadius: 200000.0,
          material: Cesium.Color.BLUE.withAlpha(0.3),
          heightReference:Cesium.HeightReference.CLAMP_TO_TERRAIN
        },
        orientation: new Cesium.VelocityOrientationProperty(positionProperty),
        path: new Cesium.PathGraphics({
          width: 1,
          material:Cesium.Color.fromCssColorString('rgba(128, 128, 128, 0.3)')
        })
      })

      satelliteRenderMap.set(satellite.id,{
        data:satellite,
        entity:entity,
        positionProperty,
        cylinderLengthProperty,
      })
    }
  }

  const loadAndDrawSatellites = async () => {
    try {
      const data: Satellite[] = await getSatellites()
      if(Array.isArray(data)&&data.length>0){
        drawSatellites(data)
        registerClockTick()
      }else{

      }
    } catch (error) {
      console.error('加载卫星数据失败:', error)
    }
  }

  onUnmounted(() => {
    unregisterClockTick()
  })

  return {
    initSatellites,
    loadAndDrawSatellites,
  }
}
