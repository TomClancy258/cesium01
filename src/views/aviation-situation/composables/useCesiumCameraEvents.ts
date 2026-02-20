// ============ useCesiumCameraEvents.ts ============
import { ref, inject, provide, onUnmounted } from 'vue'
import type { Viewer } from 'cesium'

type CameraEventType = 'moveEnd' | 'flyEnd' | 'changed'
type CameraEventCallback = () => void

const CESIUM_CAMERA_EVENTS_KEY = Symbol('CESIUM_CAMERA_EVENTS')

interface CameraEvents {
  onCameraEvent: (type: CameraEventType, callback: CameraEventCallback) => () => void
  initCameraEvents: () => void
}

export function provideCesiumCameraEvents(viewer: Ref<Viewer | null>) {
  const cameraEventCallbacks = ref<Record<CameraEventType, CameraEventCallback[]>>({
    moveEnd: [],
    flyEnd: [],
    changed: []
  })

  let removeMoveEndListener: (() => void) | null = null
  const removeFlyEndListener: (() => void) | null = null

  const initCameraEvents = () => {
    if (!viewer.value) return

    removeMoveEndListener = viewer.value.camera.moveEnd.addEventListener(() => {
      cameraEventCallbacks.value.moveEnd.forEach(cb => cb())
    })

    // removeFlyEndListener = viewer.value.camera.flyEnd.addEventListener(() => {
    //   cameraEventCallbacks.value.flyEnd.forEach(cb => cb())
    // })
  }

  const onCameraEvent = (type: CameraEventType, callback: CameraEventCallback) => {
    if (!cameraEventCallbacks.value[type].includes(callback)) {
      cameraEventCallbacks.value[type].push(callback)
    }
    return () => {
      cameraEventCallbacks.value[type] = cameraEventCallbacks.value[type].filter(cb => cb !== callback)
    }
  }

  provide<CameraEvents>(CESIUM_CAMERA_EVENTS_KEY, { onCameraEvent, initCameraEvents })

  onUnmounted(() => {
    removeMoveEndListener?.()
    removeFlyEndListener?.()
    cameraEventCallbacks.value = { moveEnd: [], flyEnd: [], changed: [] }
  })

  return { initCameraEvents, onCameraEvent }
}

export function useCesiumCameraEvents() {
  const cameraEvents = inject<CameraEvents | null>(CESIUM_CAMERA_EVENTS_KEY, null)
  if (!cameraEvents) {
    throw new Error('useCesiumCameraEvents must be used after provideCesiumCameraEvents')
  }
  return cameraEvents
}
