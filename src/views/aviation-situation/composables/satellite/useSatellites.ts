//src/views/aviation-situation/composables/satellite/useSatellite.ts
import { onUnmounted, watch } from 'vue'
import type { ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import { getSatellites } from '@/network/satellite/index.ts'
import type { Satellite } from '@/network/satellite/type'
import type {
  SatelliteHoveredProperties,
  SatelliteProperties,
  ConeSnapshot,
} from '@/views/aviation-situation/types/satellite.ts'
import { onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import { useAviationTooltip } from '@/views/aviation-situation/composables/useAviationTooltip'

import { AVIATION_LABEL_STYLE_BASE } from '@/views/aviation-situation/constants/cesium-style-constants.ts'
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { useDebounceFn } from '@vueuse/core'
import { useSatelliteStore } from '@/stores/satellite'
import { flyToLngLatAlt } from '@/utils/geoUtils'
import {
  handleSatelliteLeftClick
} from '@/views/aviation-situation/composables/cesium-events/event-handlers/interaction/satellite'
import type { LngLatAlt } from '@/views/aviation-situation/types/shared'
/** 圆锥最小长度（米），避免高度接近 0 时几何退化 */
// const CYLINDER_MIN_LENGTH_M = 1
// const CYLINDER_BOTTOM_RADIUS_M = 200000.0

const CYLINDER_DEFAULTS = {
  minLengthM: 1,
  bottomRadiusM: 200_000
}
const SATELLITE_RADAR_MATERIAL_TYPE = 'SatelliteRadarPrimitive'
const SATELLITE_RADAR_DEFAULTS = {
  color: Cesium.Color.CYAN.withAlpha(0.85),
  durationMs: 2200,
  repeat: 30,
  offset: 0,
  thickness: 0.12,
}
let isSatelliteRadarMaterialRegistered = false
const RADAR_TIME_EPOCH = Cesium.JulianDate.fromDate(new Date(0))

const SATELLITE_TICK_THROTTLE_MS = {
  visualCylinderLength: 100,
  coneScan: 1000,
  satelliteStoreSync: 500,
}
const CYLINDER_LENGTH_HEIGHT_DELTA_THRESHOLD_M = 5
type SatelliteFilterQuery = {
  id?: string
  name?: string
  countries: string[]
}
type SatelliteTooltipProperties = SatelliteHoveredProperties & { type: string }
type SatelliteRenderState = {
  data: Satellite
  entity: Cesium.Entity
  positionProperty: Cesium.SampledPositionProperty
  cylinderProps: {
    length: Cesium.ConstantProperty
    bottomRadius: Cesium.ConstantProperty
  }
}

interface SatelliteRadarMaterialOptions {
  color?: Cesium.Color
  durationMs?: number
  repeat?: number
  offset?: number
  thickness?: number
  phase?: number
}

const registerSatelliteRadarMaterial = () => {
  if (isSatelliteRadarMaterialRegistered) return

  ;(Cesium.Material as any)._materialCache.addMaterial(SATELLITE_RADAR_MATERIAL_TYPE, {
    fabric: {
      type: SATELLITE_RADAR_MATERIAL_TYPE,
      uniforms: {
        color: SATELLITE_RADAR_DEFAULTS.color,
        time: 0,
        repeat: SATELLITE_RADAR_DEFAULTS.repeat,
        offset: SATELLITE_RADAR_DEFAULTS.offset,
        thickness: SATELLITE_RADAR_DEFAULTS.thickness,
      },
      source: `
        uniform vec4 color;
        uniform float time;
        uniform float repeat;
        uniform float offset;
        uniform float thickness;

        czm_material czm_getMaterial(czm_materialInput materialInput) {
          czm_material material = czm_getDefaultMaterial(materialInput);
          vec2 st = materialInput.st;
          float spacing = 1.0 / repeat;
          float radial = distance(st, vec2(0.5));
          float m = mod(radial + offset - time, spacing);
          float alpha = step(spacing * (1.0 - thickness), m);
          material.diffuse = color.rgb;
          material.alpha = alpha * color.a;
          return material;
        }
      `,
    },
    translucent: () => true,
  })

  isSatelliteRadarMaterialRegistered = true
}

class SatelliteRadarMaterialProperty {
  private readonly _definitionChanged = new Cesium.Event()
  private readonly _color: Cesium.Color
  private readonly durationMs: number
  private readonly repeat: number
  private readonly offset: number
  private readonly thickness: number
  private readonly phase: number

  constructor(options: SatelliteRadarMaterialOptions = {}) {
    this._color = options.color?.clone() ?? SATELLITE_RADAR_DEFAULTS.color.clone()
    this.durationMs = options.durationMs ?? SATELLITE_RADAR_DEFAULTS.durationMs
    this.repeat = options.repeat ?? SATELLITE_RADAR_DEFAULTS.repeat
    this.offset = options.offset ?? SATELLITE_RADAR_DEFAULTS.offset
    this.thickness = options.thickness ?? SATELLITE_RADAR_DEFAULTS.thickness
    this.phase = options.phase ?? Math.random()
  }

  get isConstant() {
    return false
  }

  get definitionChanged() {
    return this._definitionChanged
  }

  getType() {
    return SATELLITE_RADAR_MATERIAL_TYPE
  }

  getValue(time: Cesium.JulianDate, result?: Record<string, unknown>) {
    const materialResult = result ?? {}
    const elapsedSeconds = Cesium.JulianDate.secondsDifference(time, RADAR_TIME_EPOCH)
    const elapsedMs = elapsedSeconds * 1000
    const normalizedTime = ((elapsedMs + this.phase * this.durationMs) % this.durationMs) / this.durationMs / 10
    materialResult.color = this._color
    materialResult.time = normalizedTime
    materialResult.repeat = this.repeat
    materialResult.offset = this.offset
    materialResult.thickness = this.thickness
    return materialResult
  }

  equals(other: unknown) {
    return (
      this === other ||
      (other instanceof SatelliteRadarMaterialProperty &&
        Cesium.Color.equals(this._color, other._color) &&
        this.durationMs === other.durationMs &&
        this.repeat === other.repeat &&
        this.offset === other.offset &&
        this.thickness === other.thickness &&
        this.phase === other.phase)
    )
  }
}

function cylinderLengthFromPosition(positionProperty: Cesium.SampledPositionProperty, time: Cesium.JulianDate) {
  const pos = positionProperty.getValue(time)
  if (!pos) return CYLINDER_DEFAULTS.minLengthM
  const carto = Cesium.Cartographic.fromCartesian(pos)
  // 椭球高（米）。若需要「到真实地形」的长度，需 sampleTerrainMostDetailed（异步，一般不每帧做）。
  return Math.max(carto.height, CYLINDER_DEFAULTS.minLengthM)
}

export function useSatellites(viewer:ShallowRef<Cesium.Viewer>) {
  registerSatelliteRadarMaterial()
  const aviationSelectionStore = useAviationSelectionStore()
  const satelliteStore = useSatelliteStore()

  let onConeTick: ((snapshots: ConeSnapshot[]) => void) | null = null

  const registerSatelliteDataUpdatedListener = (listener: (() => void) | null): void => {
    onConeTick = listener //发送事件
  }

  const satelliteRenderMap = new Map<string, SatelliteRenderState>()
  const lastCylinderHeightBySatelliteId = new Map<string, number>()
  let isClockTickRegistered = false
  let lastVisualTickTime: Cesium.JulianDate | null = null
  let lastConeScanTickTime: Cesium.JulianDate | null = null
  let lastStoreSyncTickTime: Cesium.JulianDate | null = null

  const updateSatelliteCylinderLengths = (clock: Cesium.Clock) => {
    const time = clock.currentTime
    const shouldRunVisualTick =
      !lastVisualTickTime ||
      Math.abs(Cesium.JulianDate.secondsDifference(time, lastVisualTickTime)) * 1000 >=
        SATELLITE_TICK_THROTTLE_MS.visualCylinderLength
    const shouldRunConeScanTick =
      !lastConeScanTickTime ||
      Math.abs(Cesium.JulianDate.secondsDifference(time, lastConeScanTickTime)) * 1000 >=
        SATELLITE_TICK_THROTTLE_MS.coneScan
    const shouldRunStoreSyncTick =
      !lastStoreSyncTickTime ||
      Math.abs(Cesium.JulianDate.secondsDifference(time, lastStoreSyncTickTime)) * 1000 >=
        SATELLITE_TICK_THROTTLE_MS.satelliteStoreSync

    if (!shouldRunVisualTick && !shouldRunConeScanTick && !shouldRunStoreSyncTick) return
    const coneSnapshots: ConeSnapshot[] = []

    let hasSatelliteStoreMutation = false
    for (const [key] of satelliteStore.matchedSatellites.entries()) {
      const item = satelliteRenderMap.get(key)
      if (!item) continue
      const position = item.positionProperty.getValue(time)
      if (!position) continue
      const carto = Cesium.Cartographic.fromCartesian(position)

      const longitude=Cesium.Math.toDegrees(carto.longitude)
      const latitude=Cesium.Math.toDegrees(carto.latitude)
      const height=carto.height

      if (shouldRunVisualTick) {
        const previousHeight = lastCylinderHeightBySatelliteId.get(key)
        if (
          previousHeight === undefined ||
          Math.abs(height - previousHeight) >= CYLINDER_LENGTH_HEIGHT_DELTA_THRESHOLD_M
        ) {
          item.cylinderProps.length.setValue(height)
          lastCylinderHeightBySatelliteId.set(key, height)
        }
      }

      if (shouldRunConeScanTick) {
        const bottomRadius=item.cylinderProps.bottomRadius.getValue()
        const axisDirection = Cesium.Cartesian3.normalize(
          Cesium.Cartesian3.negate(position, new Cesium.Cartesian3()),
          new Cesium.Cartesian3()
        )

        coneSnapshots.push({
          id: key,
          topRadius:0,
          bottomRadius:bottomRadius,
          length:height,
          apexPosition:position,
          axisDirection,
          //geodetic
          lngLatAlt:{
            longitude,
            latitude,
            height,
          }
        } as ConeSnapshot)
      }

      const satellite:Satellite=item.data
      if(
        shouldRunVisualTick &&
        aviationSelectionStore.hovered?.sourceType === 'satellite' &&
        satellite.id === aviationSelectionStore.hovered.id
      ){
        const screenPosition = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.value.scene, position)
        if (screenPosition) {
          const properties:SatelliteTooltipProperties = {
            type: 'none',
            id:satellite.id,
            name: satellite.name ?? '',
            country:satellite.country ?? '',
            description: satellite.description ?? '',
            sourceType:'satellite',
            scan:{
              target:satellite.scan.target,
            },
            lngLatAlt: {
              longitude: longitude,
              latitude: latitude,
              height: height
            }
          }
          // aviationSelectionStore.setHovered(properties)
          //hovered卫星节点显示tooltip卫星简略信息时，更新tooltip里卫星的信息（比如坐标），节流100ms
          showSatelliteTooltip(screenPosition, properties)
        }
      }

      const selected=aviationSelectionStore.selected
      if(shouldRunStoreSyncTick&&selected!==null&&selected.sourceType==='satellite'&&selected.id===satellite.id) {
        //左键点击选中selected卫星节点显示左侧drawer卫星详细信息时，更新drawer里卫星的信息（比如坐标），节流500ms
       aviationSelectionStore.setSelectedLngLatAlt({longitude,latitude,height})
      }

      if (shouldRunStoreSyncTick) {
        const lngLatAlt=satellite.lngLatAlt
        lngLatAlt.longitude=longitude
        lngLatAlt.latitude=latitude
        lngLatAlt.height=height

        satelliteStore.updateMatchedSatellite(satellite)
        hasSatelliteStoreMutation = true
      }
    }

    if (shouldRunVisualTick) {
      lastVisualTickTime = Cesium.JulianDate.clone(time, lastVisualTickTime ?? new Cesium.JulianDate())
    }
    if (shouldRunConeScanTick) {
      onConeTick?.(coneSnapshots)
      lastConeScanTickTime = Cesium.JulianDate.clone(time, lastConeScanTickTime ?? new Cesium.JulianDate())
    }
    if (shouldRunStoreSyncTick && hasSatelliteStoreMutation) {
      //更新底部drawer里卫星table的信息，如坐标
      satelliteStore.commitMatchedSatellites()
      lastStoreSyncTickTime = Cesium.JulianDate.clone(time, lastStoreSyncTickTime ?? new Cesium.JulianDate())
    } else if (shouldRunStoreSyncTick) {
      lastStoreSyncTickTime = Cesium.JulianDate.clone(time, lastStoreSyncTickTime ?? new Cesium.JulianDate())
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
        },
        cylinder: {
          // 在 clock.onTick 里批量更新，避免每个卫星各自 CallbackProperty 调度。
          length: cylinderProps.length,
          topRadius: 0.0,
          bottomRadius: cylinderProps.bottomRadius,
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
          show:false,
          material:Cesium.Color.fromCssColorString('rgba(128, 128, 128, .8)')
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
          scan:{...satellite.scan},
          path:{
            show:false
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
  } = useAviationTooltip<SatelliteTooltipProperties>({
    id: '',
    type: 'none',
    sourceType: 'satellite',
    name: '',
    country: '',
    description: '',
    scan: {
      target: 'none',
    },
    lngLatAlt: {
      longitude: 0,
      latitude: 0,
      height: 0,
    },
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

  const subscribeAirportEvents = () => {
    // 订阅机场hover事件
    unsubSatelliteHover = onCesiumEvent(
      'satelliteHover',
      ((properties, screenPosition) => {
        const satelliteProperties = properties as SatelliteTooltipProperties
        showSatelliteTooltip(screenPosition as Cesium.Cartesian2, satelliteProperties)

        if (
          aviationSelectionStore.hovered === null ||
          aviationSelectionStore.hovered.sourceType !== 'satellite' ||
          aviationSelectionStore.hovered.id !== satelliteProperties.id
        ) {
          aviationSelectionStore.setHovered(satelliteProperties)
        }
      }) as (...args: any[]) => void
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
      ((data) => {
        const satelliteProperties = data as SatelliteProperties
        // highlightBillboardOnSelect(data, billboard, airplaneSelectedSvgRawDataUrl)
        const selected=aviationSelectionStore.selected
        if(selected===null||selected.sourceType!=='satellite'||selected.id!==satelliteProperties.id) {
          aviationSelectionStore.setSelected(satelliteProperties)
        }
      }) as (...args: any[]) => void,
    )

  }

  const flyToSatelliteById = (id: string): void => {
    const item = satelliteRenderMap.get(id)
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

    unwatchSatelliteFilterForm?.()
  })

  return {
    initSatellites,
    loadAndDrawSatellites,
    tooltip,
    filterSatellites,
    flyToSatelliteById,

    registerSatelliteDataUpdatedListener,
  }
}
