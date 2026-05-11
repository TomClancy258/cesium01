//src/views/aviation-situation/composables/satellite/useSatellite.ts
import { onUnmounted } from 'vue'
import type { ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import { getSatellites } from '@/network/satellite/index.ts'
import type { Satellite } from '@/network/satellite/type'
import type {
  SatelliteRenderItem,
  SatelliteHoveredProperties,
  SatelliteProperties
} from '@/views/aviation-situation/types/satellite.ts'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import { useAviationTooltip } from '@/views/aviation-situation/composables/useAviationTooltip'

import { AVIATION_LABEL_STYLE_BASE } from '@/views/aviation-situation/constants/cesium-style-constants.ts'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
/** 圆锥最小长度（米），避免高度接近 0 时几何退化 */
// const CYLINDER_MIN_LENGTH_M = 1
// const CYLINDER_BOTTOM_RADIUS_M = 200000.0

const CYLINDER_DEFAULTS = {
  minLengthM: 1,
  bottomRadiusM: 200000
}

function cylinderLengthFromPosition(positionProperty: Cesium.SampledPositionProperty, time: Cesium.JulianDate) {
  const pos = positionProperty.getValue(time)
  if (!pos) return CYLINDER_DEFAULTS.minLengthM
  const carto = Cesium.Cartographic.fromCartesian(pos)
  // 椭球高（米）。若需要「到真实地形」的长度，需 sampleTerrainMostDetailed（异步，一般不每帧做）。
  return Math.max(carto.height, CYLINDER_DEFAULTS.minLengthM)
}

export function useSatellites(viewer:ShallowRef<Cesium.Viewer>) {
  const aviationSelectionStore = useAviationSelectionStore()

  const satelliteRenderMap = new Map<string, SatelliteRenderItem>()
  let isClockTickRegistered = false

  const updateSatelliteCylinderLengths = (clock: Cesium.Clock) => {
    const time = clock.currentTime
    for (const item of satelliteRenderMap.values()) {
      // const nextLength = cylinderLengthFromPosition(item.positionProperty, time)
      const position = item.positionProperty.getValue(time)
      const carto = Cesium.Cartographic.fromCartesian(position)

      const longitude=Cesium.Math.toDegrees(carto.longitude)
      const latitude=Cesium.Math.toDegrees(carto.latitude)
      const height=carto.height

      item.cylinderProps.length.setValue(height)

      const bottomRadius=item.cylinderProps.bottomRadius.getValue()
      const coneSnapshot={
        topRadius:0,
        bottomRadius:bottomRadius,
        length:height,
        position,
        //geodetic
        lngLatAlt:{
          longitude,
          latitude,
          height,
        }
      }

      const satellite:Satellite=item.data
      if(aviationSelectionStore.hovered!=null&&
        satellite.id===aviationSelectionStore.hovered.id){
        const screenPosition: Cesium.Cartesian2 =
          Cesium.SceneTransforms.worldToWindowCoordinates(viewer.value.scene, position)
        const properties:SatelliteHoveredProperties = {
          id:satellite.id,
          name: satellite.name,
          description: satellite.description,
          sourceType:'satellite',
          lngLatAlt: {
            longitude: longitude,
            latitude: latitude,
            height: height
          },
          screenPosition
        }
        // aviationSelectionStore.setHovered(properties)
        showSatelliteTooltip(screenPosition, properties)
      }

      const selected=aviationSelectionStore.selected
      if(selected!==null&&selected.sourceType==='satellite'&&selected.id===satellite.id) {
       aviationSelectionStore.setSelectedLngLatAlt({longitude,latitude,height})
      }
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
    subscribeAirportEvents()
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

      const cylinderProps = {
        length: new Cesium.ConstantProperty(CYLINDER_DEFAULTS.minLengthM),
        bottomRadius: new Cesium.ConstantProperty(CYLINDER_DEFAULTS.bottomRadiusM), // 仅当你要动态改
      }
      const entity=viewer.value.entities.add({
        availability: new Cesium.TimeIntervalCollection([ new Cesium.TimeInterval({ start: start, stop: stop }) ]),
        position: positionProperty,
        id:satellite.id,
        model: {
          uri: 'model/satellite/Active Cavity Irradiance Monitor Satellite (AcrimSAT) (B).glb', // public 下的路径；或用 Vite 里 import 后的 URL
          minimumPixelSize: 32,
          // maximumScale: 20000,
        },
        label:{
          text:satellite.name,
          font: AVIATION_LABEL_STYLE_BASE.FONT,
          style: AVIATION_LABEL_STYLE_BASE.STYLE,
          outlineWidth: AVIATION_LABEL_STYLE_BASE.OUTLINE_WIDTH,
          verticalOrigin: AVIATION_LABEL_STYLE_BASE.VERTICAL_ORIGIN,
          horizontalOrigin: AVIATION_LABEL_STYLE_BASE.HORIZONTAL_ORIGIN,
          pixelOffset: new Cesium.Cartesian2(0, 30),
          outlineColor: AVIATION_LABEL_STYLE_BASE.OUTLINE_COLOR,
        },
        cylinder: {
          // 在 clock.onTick 里批量更新，避免每个卫星各自 CallbackProperty 调度。
          length: cylinderProps.length,
          topRadius: 0.0,
          bottomRadius: cylinderProps.bottomRadius,
          material: Cesium.Color.BLUE.withAlpha(0.3),
          heightReference:Cesium.HeightReference.CLAMP_TO_TERRAIN
        },
        orientation: new Cesium.VelocityOrientationProperty(positionProperty),
        path: new Cesium.PathGraphics({
          width: 1,
          material:Cesium.Color.fromCssColorString('rgba(128, 128, 128, 0.3)')
        }),
        properties:{
          id:satellite.id,
          name:satellite.name,
          description:satellite.description,
          sourceType:'satellite',
          model:{
            silhouetteSize:0,
            silhouetteColor:Cesium.Color.RED
          }
        }
      })

      satelliteRenderMap.set(satellite.id,{
        data:satellite,
        entity:entity,
        positionProperty,
        cylinderProps
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

  const {
    tooltip,
    showTooltip: showSatelliteTooltip,
    hideTooltip: hideSatelliteTooltip
  } = useAviationTooltip<SatelliteHoveredProperties>({
    sourceType: 'satellite',
    name: '',
  })


  let unsubSatelliteHover: () => void
  let unsubSatelliteLeave: () => void
  let unsubSatelliteLeftClick: () => void

  const subscribeAirportEvents = () => {
    // 订阅机场hover事件
    unsubSatelliteHover = onCesiumEvent(
      'satelliteHover',
      (properties: SatelliteHoveredProperties, screenPosition: Cesium.Cartesian2, entity: Cesium.Entity) => {
        showSatelliteTooltip(screenPosition, properties)

        if (
          aviationSelectionStore.hovered === null ||
          aviationSelectionStore.hovered.sourceType !== 'satellite' ||
          aviationSelectionStore.hovered.id !== properties.id
        ) {
          aviationSelectionStore.setHovered(properties)
        }
      }
    )

    unsubSatelliteLeave = onCesiumEvent('satelliteLeave', () => {
      hideSatelliteTooltip()
      // aviationSelectionStore.clearHovered()
      // clearHoveredBillboardHighlight()
      const hovered = aviationSelectionStore.hovered
      //hovered != null && hovered.sourceType === 'satellite'
      //当 hovered 是 null 或 undefined 时：
      // hovered?.sourceType 的结果是 undefined
      // undefined === 'satellite' 是 false
      // 所以整句会是 false，不会报错。
      if (hovered?.sourceType === 'satellite') {
        aviationSelectionStore.clearHovered()
      }
    })

    unsubSatelliteLeftClick = onCesiumEvent(
      'satelliteLeftClick',
      (data: SatelliteProperties, entity: Cesium.Entity) => {
        // highlightBillboardOnSelect(data, billboard, airplaneSelectedSvgRawDataUrl)
        const selected=aviationSelectionStore.selected
        if(selected===null||selected.sourceType!=='satellite'||selected.id!==data.id) {
          aviationSelectionStore.setSelected(data)
        }
      },
    )
  }

  onUnmounted(() => {
    unregisterClockTick()

    unsubSatelliteHover?.()
    unsubSatelliteLeave?.()
    unsubSatelliteLeftClick?.()
  })

  return {
    initSatellites,
    loadAndDrawSatellites,
    tooltip,
  }
}
