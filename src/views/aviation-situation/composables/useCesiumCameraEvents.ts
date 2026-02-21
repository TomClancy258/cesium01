// ============ useCesiumCameraEvents.ts ============
import { ref, inject, provide, onUnmounted } from 'vue'
import type { ShallowRef, Viewer } from 'cesium'

type CameraEventType = 'moveEnd' | 'flyEnd' | 'changed'
type CameraEventCallback = (camera: Viewer['camera']) => void // 传递camera参数，方便计算距离

const CESIUM_CAMERA_EVENTS_KEY = Symbol('CESIUM_CAMERA_EVENTS')

interface CameraEvents {
  onCameraEvent: (type: CameraEventType, callback: CameraEventCallback) => () => void
  initCameraEvents: () => void
}

export function provideCesiumCameraEvents(viewer: ShallowRef<Viewer | null>) {
  const cameraEventCallbacks = ref<Record<CameraEventType, CameraEventCallback[]>>({
    moveEnd: [],
    flyEnd: [],
    changed: []
  })

  let removeMoveEndListener: (() => void) | null = null
  // let removeFlyEndListener: (() => void) | null = null

  const initCameraEvents = () => {
    if (!viewer.value) return

    // 监听moveEnd事件，传递camera参数
    removeMoveEndListener = viewer.value.camera.moveEnd.addEventListener(() => {
      cameraEventCallbacks.value.moveEnd.forEach(cb => cb(viewer.value!.camera))
    })

    // 补全flyEnd监听（相机飞行结束后触发）
    // removeFlyEndListener = viewer.value.camera.flyEnd.addEventListener(() => {
    //   cameraEventCallbacks.value.flyEnd.forEach(cb => cb(viewer.value!.camera))
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
    // removeFlyEndListener?.()
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
