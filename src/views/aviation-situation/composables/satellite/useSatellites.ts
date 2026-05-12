//src/views/aviation-situation/composables/satellite/useSatellite.ts
import { onUnmounted, watch } from 'vue'
import type { ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import { getSatellites } from '@/network/satellite/index.ts'
import type { Satellite } from '@/network/satellite/type'
import type {
  SatelliteRenderItem,
  SatelliteHoveredProperties,
  SatelliteProperties
} from '@/views/aviation-situation/types/satellite.ts'
import { emitCesiumEvent, onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import { useAviationTooltip } from '@/views/aviation-situation/composables/useAviationTooltip'

import { AVIATION_LABEL_STYLE_BASE } from '@/views/aviation-situation/constants/cesium-style-constants.ts'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { useDebounceFn } from '@vueuse/core'
import type { SatelliteBaseProperties } from '@/views/aviation-situation/types/satellite'
import { useSatelliteStore } from '@/stores/satellite'
import type { AircraftBillboardProperties } from '@/views/aviation-situation/types/aircraft'
import {
  handleAircraftLeftClick
} from '@/views/aviation-situation/composables/cesium-events/event-handlers/interaction/aircraft'
import { flyToLngLatAlt } from '@/utils/geoUtils'
import {
  handleSatelliteLeftClick
} from '@/views/aviation-situation/composables/cesium-events/event-handlers/interaction/satellite'
import { EntityProperties } from '@/views/aviation-situation/types/entity'
import { LngLatAlt } from '@/views/aviation-situation/types/shared'
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
  const satelliteStore = useSatelliteStore()

  const satelliteRenderMap = new Map<string, SatelliteRenderItem>()
  let isClockTickRegistered = false

  const updateSatelliteCylinderLengths = (clock: Cesium.Clock) => {
    const time = clock.currentTime
    for (const [key, data] of satelliteStore.matchedSatellites.entries()) {
      // const nextLength = cylinderLengthFromPosition(item.positionProperty, time)
      const item:SatelliteRenderItem=satelliteRenderMap.get(key)
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
          country:satellite.country,
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

      const lngLatAlt=satellite.lngLatAlt
      lngLatAlt.longitude=longitude
      lngLatAlt.latitude=latitude
      lngLatAlt.height=height

      satelliteStore.updateMatchedSatellite(satellite)
    }
    satelliteStore.commitMatchedSatellites()
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
    setupSatelliteFilterFormWatch()
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
          country:satellite.country,
          description:satellite.description,
          sourceType:'satellite',
          model:{
            silhouetteSize:0,
            silhouetteColor:Cesium.Color.RED
          },
          lngLatAlt:{...satellite.lngLatAlt}
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
        filterSatellites()
      }else{

      }
    } catch (error) {
      console.error('加载卫星数据失败:', error)
    }
  }

  const filterSatellites = useDebounceFn((): void => {
    satelliteStore.clearMatchedSatellites()

    const form = satelliteStore.satelliteFilterForm
    const query: SatelliteFilterQuery = {
      id: form.id?.trim().toLowerCase(),
      name: form.name?.trim().toLowerCase(),
      countries: form.countries,
    }

    const countriesSet = new Set(query.countries)

    let isSelectedSatelliteMatched = false

    satelliteRenderMap.forEach(({ data: satellite, entity }) => {
      const match =
        (!query.id || satellite.id.toLowerCase().includes(query.id)) &&
        (!query.name || (satellite.name ?? '').toLowerCase().includes(query.name)) &&
        countriesSet.has(satellite.country)&&
        form.visible
      // (!countriesSet.size || countriesSet.has(satellite.originCountry))

      if (match) {
        // matchedSatellites.push(satellite)
        satelliteStore.setMatchedSatellite(satellite)

        const selected = aviationSelectionStore.selected
        if (selected?.sourceType === 'satellite' && satellite.id === selected.id) {
          isSelectedSatelliteMatched = true
        }
      }
      entity.show = match
    })

    satelliteStore.commitMatchedSatellites()
    // finishedSpatialSelection()
    // emitCesiumEvent('aviationFiltered')
  }, 300)

  const {
    tooltip,
    showTooltip: showSatelliteTooltip,
    hideTooltip: hideSatelliteTooltip
  } = useAviationTooltip<SatelliteHoveredProperties>({
    sourceType: 'satellite',
    name: '',
  })

  let unwatchSatelliteFilterForm: () => void
  const setupSatelliteFilterFormWatch = (): void => {
    unwatchSatelliteFilterForm = watch(
      () => satelliteStore.satelliteFilterForm,
      () => {
        filterSatellites()
        // handleCameraMoveEnd(viewer.value.camera)
      },
      { deep: true },
    )
  }



  let unsubSatelliteHover: () => void
  let unsubSatelliteLeave: () => void
  let unsubSatelliteLeftClick: () => void
  let unSubSatelliteFilterTableDetailClick: () => void

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

    unSubSatelliteFilterTableDetailClick = onCesiumEvent('satelliteFilterTableDetailClicked', (id:string) => {
      flyToSatelliteById(id)
    })

  }

  const flyToSatelliteById = (id: string): void => {
    const item:SatelliteRenderItem = satelliteRenderMap.get(id)
    if (!item) return

    const { entity } = item
    const properties = entity.properties?.getValue() as SatelliteProperties | undefined
    if (!properties) return

    const time = viewer.value.clock.currentTime
    const position = entity.position?.getValue(time)
    if (!position) return

    const carto = Cesium.Cartographic.fromCartesian(position)
    const lngLatAlt: LngLatAlt = {
      longitude: Cesium.Math.toDegrees(carto.longitude),
      latitude: Cesium.Math.toDegrees(carto.latitude),
      height: carto.height,
    }

    handleSatelliteLeftClick(properties, lngLatAlt, entity)
    flyToLngLatAlt(viewer, lngLatAlt)
  }

  onUnmounted(() => {
    unregisterClockTick()

    unsubSatelliteHover?.()
    unsubSatelliteLeave?.()
    unsubSatelliteLeftClick?.()
    unSubSatelliteFilterTableDetailClick?.()

    unwatchSatelliteFilterForm?.()
  })

  return {
    initSatellites,
    loadAndDrawSatellites,
    tooltip,
    filterSatellites,
  }
}
