// src/views/aviation-situation/composables/cesium-events/event-handlers/spatial-selection/usePolygonSpatialSelection02.ts
import * as Cesium from 'cesium'
import { onUnmounted, ShallowRef, watch } from 'vue'
import { useSpatialSelectionStore } from '@/stores/spatial-selection'
import { generateBizUniqueId } from '@/utils/uuid'
import { useKeyboardEvents } from '../useKeyboardEvents'
import {
  calculateSurfaceDistance,
  getSurfaceMidpoint,
  createPolygonFromLngLatAltArray,
} from '@/utils/geoUtils'
import type {
  DrawingDataSource,
  LngLatAlt,
  SpatialSelectionData,
  FinishedPolygonSpatialSelectionData,
  SegmentResult,
} from '@/views/aviation-situation/types/shared'
import type { Airport } from '@/network/airport/type'
import { useAirportStore } from '@/stores/airport'
import { BOX_SELECTION_STYLE } from '@/views/aviation-situation/constants/cesium-style-constants'
import { cloneEntityAsConfig } from '@/utils/cesiumUtils'
import type { EntityProperties } from '@/views/aviation-situation/types/entity'
import { useDynamicSegmentDistanceLabel } from '../shared/useDynamicSegmentDistanceLabel'
import { type DrawingToolForm, useDrawingToolStore } from '@/stores/drawing-tool'
import { emitCesiumEvent, onCesiumEvent } from '@/views/aviation-situation/composables/mitt-bus'
import {
  emitSpatialSelectByTarget,
  emitClearSpatialSelectionByTarget,
} from '../shared/spatial-selection-event-emitters'
import type { SegmentDistancesState } from '@/views/aviation-situation/types/draw-tools.ts'
import {
  buildSegments,
} from '../spatial-selection/shared/spatial-selection-label-utils'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import { useAircraftStore } from '@/stores/aircraft'

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_TYPE = 'polygonSpatialSelection' as const
const SUBTYPE = 'polygon02' as const

// ─── LngLatAlt conversion helpers ────────────────────────────────────────────

/** Convert a single LngLatAlt to [lon, lat, alt] */
const toArr = (p: LngLatAlt): number[] => [p.longitude, p.latitude, p.height]

/** Flatten an LngLatAlt array to a number[] for Cesium / geo APIs */
const toFlat = (points: LngLatAlt[]): number[] => points.flatMap(toArr)

/** Convert LngLatAlt[] directly to Cesium Cartesian3[] */
const toCartesian3Array = (points: LngLatAlt[]): Cesium.Cartesian3[] =>
  Cesium.Cartesian3.fromDegreesArrayHeights(toFlat(points))

// ─── Types ────────────────────────────────────────────────────────────────────

/** Active drawing session entities */
interface DrawingSession {
  dataSource: Cesium.CustomDataSource | null
  /** One entity per confirmed point — has both point visual and coordinate label */
  surveyPoints: Cesium.Entity[]
  /** One segment-distance label entity per confirmed segment (grows alongside surveyPoints) */
  segmentDistanceLabels: Cesium.Entity[]
  dynamicPolygon: Cesium.Entity | null
}

// ─── Style factory ────────────────────────────────────────────────────────────

const createPolygonEntityConfig = (
  positions: Cesium.Cartesian3[] | Cesium.CallbackProperty | null = null,
): Cesium.Entity.ConstructorOptions => {
  const config: Cesium.Entity.ConstructorOptions = {
    show: true,
    polygon: {
      outlineWidth: BOX_SELECTION_STYLE.POLYGON.OUTLINE_WIDTH,
      outlineColor: BOX_SELECTION_STYLE.POLYGON.OUTLINE_COLOR,
      outline: BOX_SELECTION_STYLE.POLYGON.OUTLINE,
      height: BOX_SELECTION_STYLE.POLYGON.HEIGHT,
      material: BOX_SELECTION_STYLE.POLYGON.MATERIAL,
      arcType: BOX_SELECTION_STYLE.POLYGON.ARC_TYPE,
    },
  }
  if (positions) config.polygon.hierarchy = positions
  return config
}

// ─── Composable ───────────────────────────────────────────────────────────────

export const usePolygonSpatialSelection02 = (
  viewer: ShallowRef<Cesium.Viewer | null>,
  mouseFollowPointLabelManager,
  perimeterAndAreaLabel,
) => {
  const drawingToolStore = useDrawingToolStore()
  const aircraftStore = useAircraftStore()
  const airportStore = useAirportStore()
  const spatialSelectionStore = useSpatialSelectionStore()

  // Two floating segment-distance labels shown during drawing:
  //   lastButOne → last confirmed point → mouse cursor
  //   last       → first confirmed point → mouse cursor (closing edge preview)
  const lastButOneSegmentLabel = useDynamicSegmentDistanceLabel(
    viewer,
    'lastButOnePolygon02DynamicSegmentLabel',
  )
  const lastSegmentLabel = useDynamicSegmentDistanceLabel(
    viewer,
    'lastPolygon02DynamicSegmentLabel',
  )

  const session: DrawingSession = {
    dataSource: null,
    surveyPoints: [],
    segmentDistanceLabels: [],
    dynamicPolygon: null,
  }

  /**
   * User-confirmed polygon vertices.
   * The mouse cursor position is intentionally kept separate so confirmed state
   * is always clean — no embedded trailing point, no pointCount needed.
   */
  const confirmedPoints: LngLatAlt[] = []

  /**
   * Current mouse cursor position on the globe.
   * Null until the user moves the mouse for the first time.
   * Combined with confirmedPoints on every render frame via CallbackProperty.
   */
  let mousePos: LngLatAlt | null = null

  const segmentDistancesState: SegmentDistancesState = { segments: [] }

  // ─── Mouse move handler ───────────────────────────────────────────────────

  const polygonSpatialSelection02 = (cartesian2: Cesium.Cartesian2): void => {
    const ray = viewer.value.camera.getPickRay(cartesian2)
    const cartesian3 = viewer.value.scene.globe.pick(ray, viewer.value.scene)
    if (!cartesian3) return

    mouseFollowPointLabelManager.updateTempPointLabel(cartesian3)
    mousePos = mouseFollowPointLabelManager.tempPointLabel.position.lngLatAlt

    updateDynamicLabels()
  }

  // ─── Dynamic label updates (called on mousemove + aviationFiltered) ────────

  const updateDynamicLabels = (): void => {
    if (confirmedPoints.length < 1 || !mousePos) return

    const last = confirmedPoints[confirmedPoints.length - 1]
    const first = confirmedPoints[0]

    // Segment: last confirmed point → mouse cursor
    const lastToMouseDist = calculateSurfaceDistance(toArr(last), toArr(mousePos))
    const lastToMouseMid = getSurfaceMidpoint(toArr(last), toArr(mousePos))
    lastButOneSegmentLabel.updateTempSegmentDistanceLabel(lastToMouseMid, lastToMouseDist)

    if (confirmedPoints.length >= 2) {
      // Closing edge preview: first confirmed point → mouse cursor
      const firstToMouseDist = calculateSurfaceDistance(toArr(first), toArr(mousePos))
      const firstToMouseMid = getSurfaceMidpoint(toArr(first), toArr(mousePos))
      lastSegmentLabel.updateTempSegmentDistanceLabel(firstToMouseMid, firstToMouseDist)

      // Perimeter + area — treat mouse position as the latest tentative vertex
      const allPoints = [...confirmedPoints, mousePos]
      const polygon = createPolygonFromLngLatAltArray(toFlat(allPoints))
      perimeterAndAreaLabel.updateTempPerimeterAndAreaLabel(toFlat(allPoints), polygon)

      // Live spatial selection
      const spatialSelectionData: SpatialSelectionData = {
        dataSourceName: session.dataSource.name,
        type: 'polygon',
        sourceType: SOURCE_TYPE,
        graphic: polygon,
        isActive: true,
      }
      emitSpatialSelectByTarget(
        drawingToolStore.drawingToolForm.spatialSelectionTarget,
        spatialSelectionData,
      )
    }
  }

  // ─── Confirm survey point (left click) ───────────────────────────────────

  const confirmSurveyPoint = (): void => {
    if (!mousePos) return

    // addTempPointLabelToDataSource creates an entity with both point visual
    // and coordinate label (经度 / 纬度 / 海拔), pushes it to session.surveyPoints
    const pointProperties: EntityProperties = {
      operationType: 'spatialSelection',
      sourceType: SOURCE_TYPE,
      type: 'tempSurveyPoint',
      dataSourceName: session.dataSource.name,
    }
    const lngLatAlt = mouseFollowPointLabelManager.addTempPointLabelToDataSource(
      session,
      pointProperties,
    )
    confirmedPoints.push(lngLatAlt)

    // From the 2nd point onward, solidify the just-completed segment as a label entity
    if (confirmedPoints.length >= 2) {
      const segmentLabelProperties: EntityProperties = {
        operationType: 'spatialSelection',
        sourceType: SOURCE_TYPE,
        type: 'tempSegmentLengthLabel',
        dataSourceName: session.dataSource.name,
        isDraft: true,
      }
      // Pushes to session.segmentDistanceLabels
      lastButOneSegmentLabel.addTempSegmentDistanceLabelToDataSource(
        session,
        segmentLabelProperties,
        true, // visible while drawing
      )
      segmentDistancesState.segments.push({
        distance: lastButOneSegmentLabel.tempSegmentDistanceLabel.distanceInfo.distance,
        midLngLatAlt: lastButOneSegmentLabel.tempSegmentDistanceLabel.position.lngLatAlt,
      })
    }
  }

  // ─── Init active drawing session ──────────────────────────────────────────

  const initSession = (): void => {
    const dataSourceId = generateBizUniqueId('activePolygonSpatialSelection02')
    session.dataSource = new Cesium.CustomDataSource(dataSourceId)
    drawingToolStore.setDrawingDataSource({ name: dataSourceId } as DrawingDataSource)

    lastButOneSegmentLabel.addTempSegmentDistanceLabelToViewer()
    lastSegmentLabel.addTempSegmentDistanceLabelToViewer()

    /**
     * Dynamic polygon position driver.
     *
     * On every render frame Cesium evaluates this callback.
     * confirmedPoints and mousePos are plain mutable variables — no Vue
     * reactivity needed here since Cesium pulls values on its own render tick.
     *
     * Key difference from the original: we never mutate a shared PolygonHierarchy
     * object. Instead, a fresh PolygonHierarchy is created from the current
     * state of confirmedPoints + mousePos, keeping concerns cleanly separated.
     */
    const positionCallback = new Cesium.CallbackProperty((): Cesium.PolygonHierarchy => {
      if (confirmedPoints.length === 0 || !mousePos) return new Cesium.PolygonHierarchy([])
      return new Cesium.PolygonHierarchy(toCartesian3Array([...confirmedPoints, mousePos]))
    }, false)

    const polygonConfig = createPolygonEntityConfig(positionCallback)

    session.dynamicPolygon = session.dataSource.entities.add({
      id: generateBizUniqueId('activePolygon02'),
      properties: {
        operationType: 'spatialSelection',
        sourceType: SOURCE_TYPE,
        type: 'polygon',
        dataSourceName: dataSourceId,
        originalPolygonMaterial: polygonConfig.polygon?.material,
        polygon: { originalMaterial: polygonConfig.polygon?.material },
        isDraft: true,
      },
      ...polygonConfig,
    })

    viewer.value?.dataSources.add(session.dataSource)
  }

  // ─── Finish drawing (double click / toolbar confirm) ─────────────────────

  const finishPolygonSpatialSelection02 = (): void => {
    if (confirmedPoints.length <= 2) return

    // confirmedPoints contains only user-confirmed vertices.
    // mousePos was never mixed in, so no cleanup step is needed here.

    const uniqueId = generateBizUniqueId('polygonSpatialSelection02DataSource')
    const newDataSource = new Cesium.CustomDataSource(uniqueId)

    // ── Index 0: static polygon (highlight target) ────────────────────────
    const polygonConfig = createPolygonEntityConfig(toCartesian3Array(confirmedPoints))
    polygonConfig.polygon.outline = false // hidden; shown on hover/click via highlight manager

    newDataSource.entities.add({
      id: generateBizUniqueId('polygon02Static'),
      properties: {
        operationType: 'spatialSelection',
        sourceType: SOURCE_TYPE,
        type: 'polygon',
        isDraft: true,
        dataSourceName: uniqueId,
        originalPolygonMaterial: polygonConfig.polygon?.material,
        polygon: { originalMaterial: polygonConfig.polygon?.material },
      } as EntityProperties,
      ...polygonConfig,
    })

    // ── Index 1: perimeter + area label (show=false) ──────────────────────
    const polygon = createPolygonFromLngLatAltArray(toFlat(confirmedPoints))
    const perimeterLabelProperties: EntityProperties = {
      operationType: 'spatialSelection',
      sourceType: SOURCE_TYPE,
      type: 'perimeterAndAreaLabel',
      dataSourceName: uniqueId,
      isDraft: true,
      aircraft: {
        icao24Set: new Set<string>(spatialSelectionStore.activeSpatialSelection.aircraft.icao24Set),
      },
      airport: {
        icaoSet: new Set<string>(spatialSelectionStore.activeSpatialSelection.airport.icaoSet),
      },
      spatialSelectionTarget: drawingToolStore.drawingToolForm.spatialSelectionTarget,
      label: {
        perimeterInfo: {
          perimeter: perimeterAndAreaLabel.tempPerimeterAndAreaLabel.perimeterInfo.perimeter,
          formattedPerimeterStr:
            perimeterAndAreaLabel.tempPerimeterAndAreaLabel.perimeterInfo.formattedPerimeterStr,
        },
        areaInfo: {
          area: perimeterAndAreaLabel.tempPerimeterAndAreaLabel.areaInfo.area,
          formattedAreaStr: perimeterAndAreaLabel.tempPerimeterAndAreaLabel.areaInfo.formattedAreaStr,
        },
      },
    }
    perimeterAndAreaLabel.addTempPerimeterAndAreaLabelToDataSource(
      newDataSource,
      toFlat(confirmedPoints),
      perimeterLabelProperties,
      polygon,
    )

    // ── Solidify closing segment (first → last confirmed point) ───────────
    // Add to session so cloneSurveyPointsAndLabels picks it up in the loop below
    lastSegmentLabel.addTempSegmentDistanceLabelToDataSource(
      session,
      {
        operationType: 'spatialSelection',
        sourceType: SOURCE_TYPE,
        type: 'tempSegmentLengthLabel',
        dataSourceName: session.dataSource?.name,
        isDraft: true,
      } as EntityProperties,
      true,
    )
    segmentDistancesState.segments.push({
      distance: lastSegmentLabel.tempSegmentDistanceLabel.distanceInfo.distance,
      midLngLatAlt: lastSegmentLabel.tempSegmentDistanceLabel.position.lngLatAlt,
    })

    // ── Index 2+: (surveyPoint, segmentLabel) pairs — all show=false ──────
    // On hover/click, the highlight manager calls showEntities() on index 1+,
    // revealing perimeter label, coordinate labels, and segment distances at once.
    cloneSurveyPointsAndLabelsToDataSource(newDataSource, uniqueId)

    viewer.value?.dataSources.add(newDataSource)

    // ── Build segment results ─────────────────────────────────────────────
    // Close the ring by appending the first point again
    const ringPoints = [...confirmedPoints, confirmedPoints[0]]
    const segmentResults: SegmentResult[] = buildSegments(
      toFlat(ringPoints),
      segmentDistancesState.segments,
    )

    // ── Collect matched aircraft and airports ─────────────────────────────
    const aircraftMap = new Map<string, Aircraft>()
    for (const icao24 of spatialSelectionStore.activeSpatialSelection.aircraft.icao24Set) {
      const aircraft = aircraftStore.matchedAircraftMap.get(icao24)
      if (aircraft) aircraftMap.set(icao24, aircraft)
    }
    const airportMap = new Map<string, Airport>()
    for (const icao of spatialSelectionStore.activeSpatialSelection.airport.icaoSet) {
      const airport = airportStore.matchedAirportMap.get(icao)
      if (airport) airportMap.set(icao, airport)
    }

    const spatialSelectionTarget = drawingToolStore.drawingToolForm.spatialSelectionTarget

    const finishedData: FinishedPolygonSpatialSelectionData = {
      dataSourceName: uniqueId,
      type: 'polygon',
      sourceType: SOURCE_TYPE,
      graphic: polygon,
      isActive: false,
      isDraft: true,
      centroidLngLatAlt: perimeterAndAreaLabel.tempPerimeterAndAreaLabel.position.lngLatAlt,
      aircraft: { aircraftMap },
      airport: { airportMap },
      spatialSelectionTarget,
      label: {
        perimeterInfo: {
          perimeter: perimeterAndAreaLabel.tempPerimeterAndAreaLabel.perimeterInfo.perimeter,
          formattedPerimeterStr:
            perimeterAndAreaLabel.tempPerimeterAndAreaLabel.perimeterInfo.formattedPerimeterStr,
        },
        areaInfo: {
          area: perimeterAndAreaLabel.tempPerimeterAndAreaLabel.areaInfo.area,
          formattedAreaStr: perimeterAndAreaLabel.tempPerimeterAndAreaLabel.areaInfo.formattedAreaStr,
        },
      },
      // confirmedPoints is already LngLatAlt[] — no conversion needed
      polygonState: { lngLatAltList: [...confirmedPoints] },
      segments: segmentResults,
    }

    emitSpatialSelectByTarget(spatialSelectionTarget, finishedData)
    emitClearSpatialSelectionByTarget(spatialSelectionTarget, { isActive: true })

    drawingToolStore.setOperationType('none')
    spatialSelectionStore.clearActiveAviationSpatialSelection()
  }

  // ─── Clone survey points + segment labels to finished dataSource ──────────

  /**
   * Pairs session.surveyPoints[i] with session.segmentDistanceLabels[i].
   * After finishPolygonSpatialSelection02 adds the closing segment label,
   * both arrays have the same length (= confirmedPoints.length).
   */
  const cloneSurveyPointsAndLabelsToDataSource = (
    dataSource: Cesium.CustomDataSource,
    dataSourceName: string,
  ): void => {
    for (let i = 0; i < session.segmentDistanceLabels.length; i++) {
      const oldPoint = session.surveyPoints[i]
      const oldLabel = session.segmentDistanceLabels[i]

      if (oldPoint) {
        const pointConfig = cloneEntityAsConfig(
          oldPoint,
          generateBizUniqueId('surveyPoint02'),
          viewer,
        )
        pointConfig.properties = {
          type: 'surveyPoint',
          sourceType: SOURCE_TYPE,
          operationType: 'spatialSelection',
          dataSourceName,
          isDraft: true,
        }
        pointConfig.show = false
        dataSource.entities.add(pointConfig)
      }

      if (oldLabel) {
        const labelConfig = cloneEntityAsConfig(
          oldLabel,
          generateBizUniqueId('segmentLabel02'),
          viewer,
        )
        labelConfig.properties = {
          type: 'segmentLengthLabel',
          sourceType: SOURCE_TYPE,
          operationType: 'spatialSelection',
          dataSourceName,
          label: { originalFillColor: labelConfig.properties?.label?.originalFillColor },
          isDraft: true,
        }
        labelConfig.show = false
        dataSource.entities.add(labelConfig)
      }
    }
  }

  // ─── Reset ────────────────────────────────────────────────────────────────

  const resetDrawingState = (): void => {
    confirmedPoints.length = 0
    mousePos = null
    segmentDistancesState.segments = []
  }

  const cleanupSession = (): void => {
    session.surveyPoints = []
    session.segmentDistanceLabels = []
    viewer.value?.dataSources.remove(session.dataSource)
  }

  const resetSession = (): void => {
    lastButOneSegmentLabel.removeTempSegmentDistanceLabel()
    lastSegmentLabel.removeTempSegmentDistanceLabel()
    cleanupSession()
    resetDrawingState()
  }

  // ─── Watch drawingToolForm ────────────────────────────────────────────────

  let unwatchDrawingToolForm: () => void

  const setupDrawingToolWatch = (): void => {
    unwatchDrawingToolForm = watch(
      () => drawingToolStore.drawingToolForm,
      (newForm: DrawingToolForm) => {
        if (
          newForm.operationType === 'spatialSelection' &&
          newForm.spatialSelectionSubtype === SUBTYPE
        ) {
          resetSession()
          initSession()
        } else {
          resetSession()
          emitCesiumEvent('clearAircraftSpatialSelection')
          emitCesiumEvent('clearAirportSpatialSelection')
        }
      },
      { deep: true },
    )
  }

  // ─── Event subscription ───────────────────────────────────────────────────

  let unsubAircraftFiltered: () => void

  const subscribePolygonSpatialSelectionEvents = (): void => {
    unsubAircraftFiltered = onCesiumEvent('aviationFiltered', () => {
      updateDynamicLabels()
    })
  }

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────

  const isActive = (): boolean =>
    drawingToolStore.drawingToolForm.operationType === 'spatialSelection' &&
    drawingToolStore.drawingToolForm.spatialSelectionSubtype === SUBTYPE

  const handleEsc = (): void => {
    emitClearSpatialSelectionByTarget(
      drawingToolStore.drawingToolForm.spatialSelectionTarget,
      { isActive: true },
    )
    drawingToolStore.setOperationType('none')
  }

  const handleBackspace = (): void => {
    if (confirmedPoints.length < 2) return

    // Clean state — single pop per structure, no index math
    confirmedPoints.pop()
    session.dataSource.entities.remove(session.surveyPoints.pop())
    session.dataSource.entities.remove(session.segmentDistanceLabels.pop())
    segmentDistancesState.segments.pop()

    updateDynamicLabels()

    if (confirmedPoints.length === 1) {
      emitClearSpatialSelectionByTarget(
        drawingToolStore.drawingToolForm.spatialSelectionTarget,
        { isActive: true },
      )
    }
  }

  const { unbindKeyboardEvents } = useKeyboardEvents(handleEsc, handleBackspace, isActive)

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  onUnmounted(() => {
    unwatchDrawingToolForm?.()
    unbindKeyboardEvents()
    unsubAircraftFiltered?.()
  })

  // ─── Public API ───────────────────────────────────────────────────────────

  return {
    polygonSpatialSelection02,
    confirmSurveyPoint,
    setupDrawingToolWatch,
    finishPolygonSpatialSelection02,
    subscribePolygonSpatialSelectionEvents,
  }
}
