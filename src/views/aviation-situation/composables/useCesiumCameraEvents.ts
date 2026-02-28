// src/views/aviation-situation/composables/useCesiumCameraEvents.ts
import { onUnmounted } from 'vue'
import type { ShallowRef, Viewer } from 'cesium'
import mittBus, { CameraEvent, CameraEventType } from './mittBus'

// 初始化相机事件监听（发布到 mitt 总线）
export function initCesiumCameraEvents(viewer: ShallowRef<Viewer | null>) {
  if (!viewer.value) return

  let removeMoveEndListener: (() => void) | null = null

  // 监听 Cesium 相机 moveEnd 事件
  removeMoveEndListener = viewer.value.camera.moveEnd.addEventListener(() => {
    const cameraEvent: CameraEvent = {
      type: 'moveEnd',
      payload: viewer.value!.camera
    }
    mittBus.emit('camera', cameraEvent) // 发布相机事件
  })

  // 组件卸载时清理
  onUnmounted(() => {
    removeMoveEndListener?.()
    // 可选：清空相机事件订阅（按需）
    mittBus.off('camera')
  })
}

// 订阅相机事件（对外暴露）
export function useCesiumCameraEvent(
  type: CameraEventType,
  callback: (camera: Cesium.Camera) => void
) {
  // 过滤指定类型的相机事件
  const handler = (event: CameraEvent) => {
    if (event.type === type) {
      callback(event.payload)
    }
  }

  mittBus.on('camera', handler)

  // 返回取消订阅函数
  return () => {
    mittBus.off('camera', handler)
  }
}

// 对外暴露订阅方法（兼容原调用方式）
export function onCameraEvent(type: CameraEventType, callback: (camera: Cesium.Camera) => void) {
  return useCesiumCameraEvent(type, callback)
}
