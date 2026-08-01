import * as THREE from 'three'
import type { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js'
import { useThrottleFn } from '@vueuse/core'
import { onUnmounted, reactive, shallowRef, type ShallowRef } from 'vue'
import { useStationEquipmentStore } from '@/stores/station-equipment'
import {
  resolveTableKeyById,
  type TooltipPosition,
} from '@/views/intelligent_water_pump_station/types/station-equipment'

/** pointermove 拾取节流（与航空态势 mouseMove 一致） */
const POINTER_MOVE_THROTTLE_MS = 100

/** 鼠标右下角偏移 */
const TOOLTIP_OFFSET = { x: 12, y: 16 } as const

/**
 * Three 没有 Cesium.ScreenSpaceEventHandler / ScreenSpaceEventType。
 * 等价做法：在 renderer.domElement 上监听原生 DOM 事件，再用 Raycaster 拾取。
 * - LEFT_CLICK  ≈ click / pointerup（需自己区分拖拽）
 * - MOUSE_MOVE  ≈ pointermove / mousemove
 *
 * hover / select：OutlinePass 描边（不改子 Mesh 材质，避免和 status emissive 冲突）
 */
export function useScenePicking(
  camera: ShallowRef<THREE.PerspectiveCamera | null>,
  renderer: ShallowRef<THREE.WebGLRenderer | null>,
  /** 可交互模型根节点列表（非响应式数组，同 airportRenderMap） */
  interactiveModels: THREE.Object3D[],
  outlineHoverPass: ShallowRef<OutlinePass | null>,
  outlineSelectPass: ShallowRef<OutlinePass | null>,
) {
  const store = useStationEquipmentStore()
  const hoveredObject = shallowRef<THREE.Object3D | null>(null)
  const selectedObject = shallowRef<THREE.Object3D | null>(null)
  /** 相对三维容器的屏幕坐标（不进 store） */
  const tooltipPosition = reactive<TooltipPosition>({ left: 0, top: 0 })

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const pointerDown = new THREE.Vector2()

  let boundCanvas: HTMLCanvasElement | null = null

  /** 优先级：selected > hovered（与 billboard 一致）；两 Pass 可同时描不同对象 */
  const refreshOutline = (): void => {
    const selected = selectedObject.value
    const hovered = hoveredObject.value
    const hoverPass = outlineHoverPass.value
    const selectPass = outlineSelectPass.value

    if (selectPass) {
      selectPass.selectedObjects = selected ? [selected] : []
    }
    if (hoverPass) {
      hoverPass.selectedObjects =
        hovered && hovered !== selected ? [hovered] : []
    }
  }

  const toSelection = (object: THREE.Object3D | null) => {
    if (!object) return null
    const name = (object.userData.name as string) || object.name
    if (!name) return null
    const source = resolveTableKeyById(name)
    if (!source) return null
    return { name, source }
  }

  const updateTooltipPosition = (event: PointerEvent): void => {
    const canvas = renderer.value?.domElement
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    tooltipPosition.left = event.clientX - rect.left + TOOLTIP_OFFSET.x
    tooltipPosition.top = event.clientY - rect.top + TOOLTIP_OFFSET.y
  }

  /** 命中 mesh 后回退到 interactiveModels 里的根节点 */
  const resolveInteractiveRoot = (hitObject: THREE.Object3D): THREE.Object3D | null => {
    let current: THREE.Object3D | null = hitObject
    while (current) {
      if (interactiveModels.includes(current)) return current
      current = current.parent
      console.log("current", current);
    }
    return null
  }

  /** 返回射线命中的第一个可交互模型根；未命中返回 null */
  const pickFirstObject = (event: PointerEvent): THREE.Object3D | null => {
    if (!camera.value || !renderer.value) return null
    if (!interactiveModels.length) return null

    const canvas = renderer.value.domElement
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(pointer, camera.value)
    const hits = raycaster.intersectObjects(interactiveModels, true)
    if (!hits.length) return null
    return resolveInteractiveRoot(hits[0].object)
  }

  // ≈ Cesium MOUSE_MOVE（VueUse throttle）
  const onPointerMove = useThrottleFn(
    (event: PointerEvent): void => {
      updateTooltipPosition(event)

      const object = pickFirstObject(event)
      if (hoveredObject.value === object) return

      hoveredObject.value = object
      store.setHovered(toSelection(object))
      refreshOutline()
    },
    POINTER_MOVE_THROTTLE_MS,
    true,
    true,
  )

  const onPointerDown = (event: PointerEvent): void => {
    pointerDown.set(event.clientX, event.clientY)
  }

  // ≈ Cesium LEFT_CLICK（用位移阈值避开 OrbitControls 拖拽）
  const onPointerUp = (event: PointerEvent): void => {
    const dx = event.clientX - pointerDown.x
    const dy = event.clientY - pointerDown.y
    if (dx * dx + dy * dy > 25) return

    const object = pickFirstObject(event)
    selectedObject.value = object
    store.setSelected(toSelection(object))
    refreshOutline()
  }

  const bindPicking = (): void => {
    unbindPicking()
    const canvas = renderer.value?.domElement
    if (!canvas) {
      console.error('[useScenePicking] renderer canvas is not ready')
      return
    }

    boundCanvas = canvas
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)
  }

  const unbindPicking = (): void => {
    if (boundCanvas) {
      boundCanvas.removeEventListener('pointermove', onPointerMove)
      boundCanvas.removeEventListener('pointerdown', onPointerDown)
      boundCanvas.removeEventListener('pointerup', onPointerUp)
      boundCanvas = null
    }

    hoveredObject.value = null
    selectedObject.value = null
    if (outlineHoverPass.value) outlineHoverPass.value.selectedObjects = []
    if (outlineSelectPass.value) outlineSelectPass.value.selectedObjects = []
    store.clearHovered()
  }

  onUnmounted(() => {
    unbindPicking()
  })

  return {
    hoveredObject,
    selectedObject,
    tooltipPosition,
    pickFirstObject,
    bindPicking,
    unbindPicking,
  }
}
