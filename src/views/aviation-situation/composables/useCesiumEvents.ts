import * as Cesium from 'cesium'
import { useDebounceFn,useThrottleFn } from '@vueuse/core'
import {
  AirportBaseProperties,
  AirportBillboardProperties, AirportLabelProperties
} from '../types/airport'
import type {
  AircraftBaseProperties,
  AircraftBillboardProperties,
} from '../types/aircraft'
import { onUnmounted, shallowRef } from 'vue'
import { clearHighlight } from './useHighlightManager'
export function useCesiumEvents(
  viewer: ShallowRef<Cesium.Viewer | null>,
  options?: {
    onAirportHover?: (
      properties: AirportProperties,
      position: Cesium.Cartesian2,
      billboard: Cesium.Billboard,
    ) => void
    onAirportLeftClick?: (properties: AirportProperties) => void
    onAirportLeave?: () => void

    onAircraftHover?: (
      properties: AircraftBaseProperties,
      position: Cesium.Cartesian2,
      billboard: Cesium.Billboard,
    ) => void
    onAircraftLeftClick?: (properties: AircraftBaseProperties) => void
    onAircraftLeave?: () => void
  }
) {
  // let handler:Cesium.ScreenSpaceEventHandler|null = null
  const handler = shallowRef<Cesium.ScreenSpaceEventHandler | null>(null)

  const initEvents = () => {
    handler.value = new Cesium.ScreenSpaceEventHandler(
      viewer.value.scene.canvas
    )

    setLeftClickAction()
    setMouseMoveAction()
  }

  const setLeftClickAction = (): void => {
    handler.value.setInputAction((click): void => {
      const pickedObject = viewer.value.scene.pick(click.position)
      console.log('pickedObject', pickedObject)
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        if (pickedObject.id instanceof Cesium.Entity) {
          const entity: Cesium.Entity = pickedObject.id
        } else if (pickedObject.primitive instanceof Cesium.Billboard) {
          const properties: AircraftBillboardProperties = pickedObject.primitive.properties
          if (
            properties.sourceType === 'airport' &&
            properties.type === 'billboard'
          ) {
            options?.onAirportLeftClick()?.(properties)
          } else if(
            properties.sourceType === 'aircraft' &&
            properties.type === 'billboard'){

            const baseProperties: AircraftBaseProperties = {
              type: properties.type,
              sourceType: properties.sourceType,
              icao24: properties.icao24,
              origin_country: properties.origin_country,
              callsign: properties.callsign,
              longitude: properties.longitude,
              latitude: properties.latitude,
              baro_altitude: properties.baro_altitude,
              heading: properties.heading,
            }

            options?.onAircraftLeftClick()?.(baseProperties)
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  }

  const setMouseMoveAction = (): void => {
    handler.value.setInputAction((movement:Cesium.ScreenSpaceEventHandler.PositionedEvent): void => {

      mouseMove(movement)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  }

  const mouseMove = useThrottleFn((movement:Cesium.ScreenSpaceEventHandler.PositionedEvent): void => {
    const pickedObject = viewer.value.scene.pick(movement.endPosition)

    if (Cesium.defined(pickedObject) && pickedObject.id) {
      if (pickedObject.id instanceof Cesium.Entity) {
        const entity: Cesium.Entity = pickedObject.id
      } else if (pickedObject.primitive instanceof Cesium.Billboard) {
        const properties: AircraftBillboardProperties|AircraftLabelProperties|AirportBillboardProperties|AirportLabelProperties = pickedObject.primitive.properties

        const position:Cesium.Cartesian3 = pickedObject.primitive.position
        const screenPosition: Cesium.Cartesian2 =
          Cesium.SceneTransforms.worldToWindowCoordinates(
            viewer.value.scene,
            position
          )
        if (properties.type !== 'billboard') return;
        if (
          properties.sourceType === 'airport'
        ) {
          const baseProperties: AirportBaseProperties = {
            type: properties.type, // 'billboard' —— 注意：这里保留原值，或可设为 'aircraft'
            sourceType: properties.sourceType,
            icao: properties.icao,
            country: properties.country,
            name: properties.name,
            longitude: properties.longitude,
            latitude: properties.latitude,
          }

          options?.onAirportHover?.(baseProperties, screenPosition,pickedObject.primitive)
        } else if(
          properties.sourceType === 'aircraft'){
          // ✅ 提取 AircraftBaseProperties 部分（剥离 originalColor 等渲染属性）
          const baseProperties: AircraftBaseProperties = {
            type: properties.type, // 'billboard' —— 注意：这里保留原值，或可设为 'aircraft'
            sourceType: properties.sourceType,
            icao24: properties.icao24,
            origin_country: properties.origin_country,
            callsign: properties.callsign,
            longitude: properties.longitude,
            latitude: properties.latitude,
            baro_altitude: properties.baro_altitude,
            heading: properties.heading,
          }
          options?.onAircraftHover?.(baseProperties, screenPosition,pickedObject.primitive)
        }
      }
    }else {
      clearHighlight()
      options?.onAirportLeave?.()
      options?.onAircraftLeave?.()
    }
  }, 100)

  const destroyHandler = (): void => {
    if (handler.value) {
      handler.value.destroy()
      handler.value = null
    }
  }

  onUnmounted(():void => {
    destroyHandler()
  })

  return {
    initEvents,
  }
}
