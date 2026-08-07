// src/views/aviation-situation/composables/cesium-events/cesium-camera-events.ts
import { onUnmounted } from 'vue'
import type { ShallowRef } from 'vue'
import type { Viewer } from 'cesium'
import mittBus, { type CesiumCameraEventName } from '../mitt-bus'

/** Cesium 相机 → mitt：一事一名，payload 为 camera */
export function initCesiumCameraEvents(viewer: ShallowRef<Viewer | null>) {
  if (!viewer.value) return

  let removeMoveEndListener: (() => void) | null = null

  removeMoveEndListener = viewer.value.camera.moveEnd.addEventListener(() => {
    mittBus.emit('cameraMoveEnd', viewer.value!.camera)
  })

  // 仅解绑 Cesium 原生监听；mitt 订阅由各业务 unsub 自行清理
  onUnmounted(() => {
    removeMoveEndListener?.()
  })
}

export function useCesiumCameraEvent(
  eventName: CesiumCameraEventName,
  callback: (camera: Cesium.Camera) => void,
) {
  mittBus.on(eventName, callback)

  return () => {
    mittBus.off(eventName, callback)
  }
}
