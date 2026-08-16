//src/views/aviation-situation/composables/satellite/useSatellite.ts
import { onUnmounted, watch } from 'vue'
import type { ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import { getSatellites } from '@/network/satellite/index.ts'
import type { Satellite } from '@/network/satellite/type'
import type {
  SatelliteProperties,
  ConeSnapshot,
} from '@/views/aviation-situation/types/satellite.ts'
import { createMatchedSatellite } from '@/views/aviation-situation/types/satellite.ts'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'

import { AVIATION_LABEL_STYLE_BASE } from '@/views/aviation-situation/constants/cesium-style-constants.ts'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { setTooltipPositionFromWindow } from '@/views/aviation-situation/composables/cesium-events/tooltip-position'
import { useDebounceFn } from '@vueuse/core'
import { useSatelliteStore } from '@/stores/satellite'
import { flyToLngLatAlt } from '@/utils/geoUtils'
import { selectSatellite } from '@/views/aviation-situation/composables/selection/useAviationSelectionActions'
import {
  handleSatelliteLeftClick
} from '@/views/aviation-situation/composables/cesium-events/event-handlers/interaction/satellite'
import type { LngLatAlt } from '@/views/aviation-situation/types/shared'
import {
  registerSatelliteRadarMaterial,
  SATELLITE_RADAR_DEFAULTS,
  SatelliteRadarMaterialProperty
} from '@/views/aviation-situation/composables/satellite/satellite-radar-material.ts'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import type { Airport } from '@/network/airport/type'
import {
  airplaneBlueSvgDataUrl
} from '@/views/aviation-situation/composables/aircraft/aircraft-constants'
import { toSatelliteSelectedData } from './satellite-property-utils'
/** 圆锥最小长度（米），避免高度接近 0 时几何退化 */
// const CYLINDER_MIN_LENGTH_M = 1
// const CYLINDER_BOTTOM_RADIUS_M = 200000.0

const CYLINDER_DEFAULTS = {
  minLengthM: 1,
  bottomRadiusM: 200_000
}

//不同的throttle时间，ms
const SATELLITE_TICK_THROTTLE_MS = {
  visualCylinderLength: 100, //每100ms改变圆锥体的长度
  coneScan: 1000, //每1秒进行圆锥体扫描
  satelliteStoreSync: 500, //每500ms更新store里的卫星table信息
}
const CYLINDER_LENGTH_HEIGHT_DELTA_THRESHOLD_M = 5
type SatelliteFilterQuery = {
  id?: string
  name?: string
  countries: string[]
}
type SatelliteRenderState = {
  data: Satellite
  entity: Cesium.Entity
  positionProperty: Cesium.SampledPositionProperty
  cylinderProps: {
    length: Cesium.ConstantProperty
    bottomRadius: Cesium.ConstantProperty
  }
}

function cylinderLengthFromPosition(positionProperty: Cesium.SampledPositionProperty, time: Cesium.JulianDate) {
  const pos = positionProperty.getValue(time)
  if (!pos) return CYLINDER_DEFAULTS.minLengthM
  const carto = Cesium.Cartographic.fromCartesian(pos)
  // 椭球高（米）。若需要「到真实地形」的长度，需 sampleTerrainMostDetailed（异步，一般不每帧做）。
  return Math.max(carto.height, CYLINDER_DEFAULTS.minLengthM)
}

export interface UseSatellitesOptions {
  refreshSatelliteConeScanWithAircraft?: (
    coneSnapshots: ConeSnapshot[],
  ) => Map<string, Map<string, Aircraft>>
  refreshSatelliteConeScanWithAirport?: (
    coneSnapshots: ConeSnapshot[],
  ) => Map<string, Map<string, Airport>>
}

export function useSatellite(
  viewer: ShallowRef<Cesium.Viewer>,
  options: UseSatellitesOptions = {},
) {
  registerSatelliteRadarMaterial()
  const aviationSelectionStore = useAviationSelectionStore()
  const satelliteStore = useSatelliteStore()

  const satelliteRenderMap = new Map<string, SatelliteRenderState>()
  const lastCylinderHeightBySatelliteId = new Map<string, number>()
  let isClockTickRegistered = false
  let lastVisualTickTime: Cesium.JulianDate | null = null //上次 visual tick   更新圆锥高度 + hover tooltip
  let lastConeScanTickTime: Cesium.JulianDate | null = null //上次 cone scan tick   锥体扫描飞机/机场
  let lastStoreSyncTickTime: Cesium.JulianDate | null = null //上次 store sync tick   同步卫星坐标到 Pinia

  const updateSatelliteCylinderLengths = (clock: Cesium.Clock) => {
    const time = clock.currentTime
    const shouldRunVisualTick =
      !lastVisualTickTime ||
      Math.abs(Cesium.JulianDate.secondsDifference(time, lastVisualTickTime)) * 1000 >=
        SATELLITE_TICK_THROTTLE_MS.visualCylinderLength //若当前时间time与上一次执行visual时间的秒差>=间隔
    const shouldRunConeScanTick =
      !lastConeScanTickTime ||
      Math.abs(Cesium.JulianDate.secondsDifference(time, lastConeScanTickTime)) * 1000 >=
        SATELLITE_TICK_THROTTLE_MS.coneScan
    const shouldRunStoreSyncTick =
      !lastStoreSyncTickTime ||
      Math.abs(Cesium.JulianDate.secondsDifference(time, lastStoreSyncTickTime)) * 1000 >=
        SATELLITE_TICK_THROTTLE_MS.satelliteStoreSync

    if (!shouldRunVisualTick && !shouldRunConeScanTick && !shouldRunStoreSyncTick) return
    const aircraftConeSnapshots: ConeSnapshot[] = []
    const airportConeSnapshots: ConeSnapshot[] = []

    let hasSatelliteStoreMutation = false
    for (const [key] of satelliteStore.matchedSatelliteMap.entries()) {
      const item = satelliteRenderMap.get(key)
      if (!item) continue
      const position = item.positionProperty.getValue(time)
      //现在单 entity：可以删 positionProperty，用 entity.position.getValue(time) 完全够用。
      //以后 model/cone 双 entity：更建议在 map 里保留 positionProperty 作为共享轨道引用。
      // const position=item.entity.positionProperty.getValue(time)

      if (!position) continue
      const carto = Cesium.Cartographic.fromCartesian(position)

      const longitude=Cesium.Math.toDegrees(carto.longitude)
      const latitude=Cesium.Math.toDegrees(carto.latitude)
      const height=carto.height

      if (shouldRunVisualTick) { //更新圆锥高度 + hover tooltip
        const previousHeight = lastCylinderHeightBySatelliteId.get(key) //上一次的圆锥体高度
        if (
          previousHeight === undefined ||
          Math.abs(height - previousHeight) >= CYLINDER_LENGTH_HEIGHT_DELTA_THRESHOLD_M
        ) {
          item.cylinderProps.length.setValue(height)
          // item.entity.cylinder.length=height
          lastCylinderHeightBySatelliteId.set(key, height)
        }
      }

      if (shouldRunConeScanTick) { //锥体扫描飞机/机场
        const bottomRadius=item.cylinderProps.bottomRadius.getValue()
        const axisDirection = Cesium.Cartesian3.normalize(
          Cesium.Cartesian3.negate(position, new Cesium.Cartesian3()),
          new Cesium.Cartesian3()
        )

        const coneSnapshot: ConeSnapshot = {
          id: key,
          topRadius: 0,
          bottomRadius,
          length: height,
          apexPosition: position,
          axisDirection,
          scan: { ...item.data.scan },
          lngLatAlt: {
            longitude,
            latitude,
            height,
          },
        }

        switch (item.data.scan.target) {
          case 'aircraft':
            aircraftConeSnapshots.push(coneSnapshot)
            break
          case 'airport':
            airportConeSnapshots.push(coneSnapshot)
            break
          case 'all':
            aircraftConeSnapshots.push(coneSnapshot)
            airportConeSnapshots.push(coneSnapshot)
            break
          case 'none':
            break
        }
      }

      const satellite = item.data
      if(
        shouldRunVisualTick &&
        aviationSelectionStore.hovered?.sourceType === 'satellite' &&
        satellite.id === aviationSelectionStore.hovered.id
      ){
        const screenPosition = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.value.scene, position)
        if (screenPosition) {
          setTooltipPositionFromWindow(screenPosition.x, screenPosition.y)
        }
      }

      if (shouldRunStoreSyncTick) { //同步卫星坐标到 Pinia（与 matched.satellite 同一引用）
        satellite.lngLatAlt.longitude = longitude
        satellite.lngLatAlt.latitude = latitude
        satellite.lngLatAlt.height = height
        hasSatelliteStoreMutation = true
      }
    }

    if (shouldRunVisualTick) {
      // lastVisualTickTime = Cesium.JulianDate.clone(time, lastVisualTickTime ?? new Cesium.JulianDate())
      if (lastVisualTickTime === null) {
        lastVisualTickTime = new Cesium.JulianDate()  // 新建独立空容器 B 赋值给lastVisualTickTime
      }
      //Cesium.JulianDate.clone(a, b)
      //                    把 a 复制到 b，并返回 b
      Cesium.JulianDate.clone(time, lastVisualTickTime)  // 把 A 的数值拷进 B
    }
    if (shouldRunConeScanTick) {
      const {
        refreshSatelliteConeScanWithAircraft,
        refreshSatelliteConeScanWithAirport,
      } = options

      if (refreshSatelliteConeScanWithAircraft || refreshSatelliteConeScanWithAirport) {
        satelliteStore.applyConeScanResults(
          refreshSatelliteConeScanWithAircraft?.(aircraftConeSnapshots),
          refreshSatelliteConeScanWithAirport?.(airportConeSnapshots),
        )
      }

      if (lastConeScanTickTime === null) {
        lastConeScanTickTime = new Cesium.JulianDate()
      }
      Cesium.JulianDate.clone(time, lastConeScanTickTime)
    }
    if (shouldRunStoreSyncTick && hasSatelliteStoreMutation) {
      //更新底部drawer里卫星table的信息，如坐标
      satelliteStore.commitMatchedSatellites()

      if (lastStoreSyncTickTime === null) {
        lastStoreSyncTickTime = new Cesium.JulianDate()
      }
      Cesium.JulianDate.clone(time, lastStoreSyncTickTime)
    } else if (shouldRunStoreSyncTick) {
      if (lastStoreSyncTickTime === null) {
        lastStoreSyncTickTime = new Cesium.JulianDate()
      }
      Cesium.JulianDate.clone(time, lastStoreSyncTickTime)
    }
  }

  const registerClockTick = () => {
    if (isClockTickRegistered) return
    viewer.value.clock.onTick.addEventListener(updateSatelliteCylinderLengths)
    //clock.onTick          ← ① 时钟先走一步
    //     ↓
    // scene.preUpdate       ← ② 场景「更新阶段」开始前
    //     ↓
    // （Cesium 内部 update：Entity/Primitive/DataSource、相机等）
    //     ↓
    // scene.postUpdate      ← ③ 场景更新完成
    //     ↓
    // scene.preRender       ← ④ 真正 GPU 绘制前
    //     ↓
    // （WebGL render：出图）
    //     ↓
    // scene.postRender      ← ⑤ 本帧绘制结束
    isClockTickRegistered = true
  }

  const unregisterClockTick = () => {
    if (!isClockTickRegistered) return
    if (viewer.value!==null&&!viewer.value.isDestroyed()) {
      viewer.value.clock.onTick.removeEventListener(updateSatelliteCylinderLengths)
    }
    isClockTickRegistered = false
  }

  const initSatellites=()=>{
    subscribeSatelliteEvents()
    setupSatelliteFilterFormWatch()
  }

  const drawSatellites = (satellites: Satellite[]) => {
    for (const satellite of satellites) {
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

      //大多数：satelliteRenderMap = { id, entity, businessData }
      //          要改 length → 从 entity.cylinder.length 取 Property 再 setValue
      //
      // 一部分：额外存 cylinderProps.length（和你们一样，偏工程规范）
      //          尤其团队大、怕写错 assignment 时
      //
      // 很少：  每个 label/path/model 字段都在 map 里存 Property
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
        // billboard:{
        //   image: airplaneBlueSvgDataUrl,
        //   width: 30,
        //   height: 30,
        // },
        label:{
          show:true,
          // show:false,
          text:satellite.name,
          font: AVIATION_LABEL_STYLE_BASE.FONT,
          style: AVIATION_LABEL_STYLE_BASE.STYLE,
          outlineWidth: AVIATION_LABEL_STYLE_BASE.OUTLINE_WIDTH,
          verticalOrigin: AVIATION_LABEL_STYLE_BASE.VERTICAL_ORIGIN,
          horizontalOrigin: AVIATION_LABEL_STYLE_BASE.HORIZONTAL_ORIGIN,
          pixelOffset: new Cesium.Cartesian2(0, 30),
          outlineColor: AVIATION_LABEL_STYLE_BASE.OUTLINE_COLOR,
          disableDepthTestDistance:0
        },
        cylinder: {
          // 在 clock.onTick 里批量更新，避免每个卫星各自 CallbackProperty 调度。
          length: cylinderProps.length,
          // length: CYLINDER_DEFAULTS.minLengthM, //Cesium 内部也会包成 ConstantProperty。
          topRadius: 0.0,
          bottomRadius: cylinderProps.bottomRadius,
          // material:new Cesium.ImageMaterialProperty({
          //   image:airplaneBlueSvgDataUrl,
          //   repeat:new Cesium.Cartesian2(3.0, 2.0),
          // }),
          // material:new Cesium.StripeMaterialProperty({
          //   orientation:Cesium.StripeOrientation.HORIZONTAL,
          //   evenColor:SATELLITE_RADAR_DEFAULTS.color,
          //   oddColor:Cesium.Color.TRANSPARENT,
          //   repeat:10,
          //   offset:.5
          // }),
          material: new SatelliteRadarMaterialProperty({
            color: SATELLITE_RADAR_DEFAULTS.color,
            repeat: SATELLITE_RADAR_DEFAULTS.repeat,
            thickness: SATELLITE_RADAR_DEFAULTS.thickness,
            durationMs: SATELLITE_RADAR_DEFAULTS.durationMs,
            offset: SATELLITE_RADAR_DEFAULTS.offset,
            phase: Math.random(),
          }),
          heightReference:Cesium.HeightReference.CLAMP_TO_TERRAIN
        },
        orientation: new Cesium.VelocityOrientationProperty(positionProperty),
        path: new Cesium.PathGraphics({
          width: 1,
          //path 默认隐藏、hover 才显，走 highlight-manager 直接改 entity.path.show 就行；不必 ConstantProperty，也不必进 map。
          // 只有像 length 这种 高频、批量、数值 更新才需要那套。
          show:false,
          material:Cesium.Color.fromCssColorString('rgba(128, 128, 128, .8)')
        }),
        properties:{
          id:satellite.id,
          sourceType:'satellite',
          model:{
            silhouetteSize:0,
            silhouetteColor:Cesium.Color.RED
          },
          path:{
            show:false
          },
        }
      })

      satelliteRenderMap.set(satellite.id, {
        data: satellite,
        entity:entity,
        //positionProperty、cylinderProps它俩都可以不用在satelliteRenderMap里存储维护
        //只是开发者要记得修改length时要entity.length.setValue(xxx)，而不是entity.length=xxx 【这样也会自动包装ConstantProperty，但是稍微消耗一点点性能】
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
    const previousHits = new Map(satelliteStore.matchedSatelliteMap)
    satelliteStore.clearMatchedSatellites()

    const form = satelliteStore.satelliteFilterForm
    const query: SatelliteFilterQuery = {
      id: form.id?.trim().toLowerCase(),
      name: form.name?.trim().toLowerCase(),
      countries: form.countries,
    }

    const countriesSet = new Set(query.countries)

    satelliteRenderMap.forEach(({ data: satellite, entity }) => {
      const match =
        (!query.id || satellite.id.toLowerCase().includes(query.id)) &&
        (!query.name || (satellite.name ?? '').toLowerCase().includes(query.name)) &&
        countriesSet.has(satellite.country) &&
        form.visible
      // (!countriesSet.size || countriesSet.has(satellite.originCountry))

      if (match) {
        const prev = previousHits.get(satellite.id)
        const matched = createMatchedSatellite(satellite)
        if (prev) {
          matched.aircraft = prev.aircraft
          matched.airport = prev.airport
        }
        satelliteStore.setMatchedSatellite(matched)
      }
      entity.show = match
    })

    satelliteStore.commitMatchedSatellites()
    // finishedSpatialSelection()
    // emitCesiumEvent('aviationFiltered')
  }, 300)

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

  const subscribeSatelliteEvents = () => {
    unsubSatelliteHover = onCesiumEvent(
      'satelliteHover',
      (
        properties: SatelliteProperties,
        screenPosition: Cesium.Cartesian2,
      ) => {
        const satellite = satelliteRenderMap.get(properties.id)?.data
        if (!satellite) return

        const selectedData = toSatelliteSelectedData(satellite)
        setTooltipPositionFromWindow(screenPosition.x, screenPosition.y)

        if (
          aviationSelectionStore.hovered === null ||
          aviationSelectionStore.hovered.sourceType !== 'satellite' ||
          aviationSelectionStore.hovered.id !== properties.id
        ) {
          aviationSelectionStore.setHovered(selectedData)
        }
      },
    )

    unsubSatelliteLeave = onCesiumEvent('satelliteLeave', () => {
      const hovered = aviationSelectionStore.hovered
      if (hovered?.sourceType === 'satellite') {
        aviationSelectionStore.clearHovered()
      }
    })

    unsubSatelliteLeftClick = onCesiumEvent(
      'satelliteLeftClick',
      (properties: SatelliteProperties, entity: Cesium.Entity) => {
        const satellite = satelliteRenderMap.get(properties.id)?.data
        if (!satellite) return
        selectSatellite(entity, toSatelliteSelectedData(satellite))
      },
    )

  }

  const flyToSatelliteById = (id: string): void => {
    const item = satelliteRenderMap.get(id)
    if (!item) return

    const { entity } = item
    const properties: SatelliteProperties | undefined = entity.properties?.getValue()
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

    // 与地图左键一致：第二参必须是 Entity，才会走 selectSatellite 描边高亮
    handleSatelliteLeftClick(properties, entity)
    flyToLngLatAlt(viewer, lngLatAlt)
  }

  onUnmounted(() => {
    unregisterClockTick()

    unsubSatelliteHover?.()
    unsubSatelliteLeave?.()
    unsubSatelliteLeftClick?.()

    unwatchSatelliteFilterForm?.()
  })

  return {
    initSatellites,
    loadAndDrawSatellites,
    filterSatellites,
    flyToSatelliteById,
  }
}
