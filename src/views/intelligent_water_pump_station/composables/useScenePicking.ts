import * as THREE from 'three'
import { useThrottleFn } from '@vueuse/core'
import { onUnmounted, reactive, type ShallowRef } from 'vue'
import { useStationEquipmentStore } from '@/stores/station-equipment'
import type { OutlineObjects } from '@/views/intelligent_water_pump_station/composables/useThreeScene'
import type {
  EquipmentSource,
  TooltipPosition,
} from '@/views/intelligent_water_pump_station/types/station-equipment'

/** pointermove 拾取节流（与航空态势 mouseMove 一致） */
const POINTER_MOVE_THROTTLE_MS = 100

/** 鼠标右下角偏移 */
const TOOLTIP_OFFSET = { x: 12, y: 16 } as const

type FindObjectByName = (
  name: string,
  source: EquipmentSource,
) => THREE.Object3D | null

/**
 * Three 没有 Cesium.ScreenSpaceEventHandler / ScreenSpaceEventType。
 * 等价做法：在 renderer.domElement 上监听原生 DOM 事件，再用 Raycaster 拾取。
 * - LEFT_CLICK  ≈ click / pointerup（需自己区分拖拽）
 * - MOUSE_MOVE  ≈ pointermove / mousemove
 *
 * hover / select：通过 setOutlineObjects 交给 scene 描边，不直接持有 OutlinePass
 */
export function useScenePicking(
  camera: ShallowRef<THREE.PerspectiveCamera | null>,
  renderer: ShallowRef<THREE.WebGLRenderer | null>,
  /** 可交互模型根节点列表（非响应式数组，同 airportRenderMap） */
  interactiveModels: THREE.Object3D[],
  setOutlineObjects: (targets: OutlineObjects) => void,
  getObjectByName: FindObjectByName,
) {
  const store = useStationEquipmentStore()
  /** 非响应式，仅给描边用（UI 用 store.hovered / selected） */
  let hoveredObject: THREE.Object3D | null = null
  let selectedObject: THREE.Object3D | null = null
  /** 相对三维容器的屏幕坐标；必须 reactive，子组件才能跟着鼠标更新 */
  const tooltipPosition = reactive<TooltipPosition>({ left: 0, top: 0 })

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const pointerDown = new THREE.Vector2()

  let boundCanvas: HTMLCanvasElement | null = null

  const refreshOutline = (): void => {
    setOutlineObjects({
      hovered: hoveredObject,
      selected: selectedObject,
    })
  }

  const toSelection = (object: THREE.Object3D | null) => {
    if (!object) return null
    const name = (object.userData.name as string) || object.name
    const source = object.userData.source as EquipmentSource | undefined
    if (!name || !source) return null
    return { name, source }
  }

  const updateTooltipPosition = (event: PointerEvent): void => {
    const canvas = renderer.value?.domElement
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    tooltipPosition.left = event.clientX - rect.left + TOOLTIP_OFFSET.x
    tooltipPosition.top = event.clientY - rect.top + TOOLTIP_OFFSET.y
  }

  /** 命中 mesh 后沿 parent 上溯到 userData.interactive 根 */
  const resolveInteractiveRoot = (hitObject: THREE.Object3D): THREE.Object3D | null => {
    let current: THREE.Object3D | null = hitObject
    while (current) {
      if (current.userData.interactive) return current
      current = current.parent
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
    const object = resolveInteractiveRoot(hits[0].object)
    //别删除这个输出
    console.log('object', object)
    return object
  }

  // ≈ Cesium MOUSE_MOVE（VueUse throttle）
  const onPointerMove = useThrottleFn(
    (event: PointerEvent): void => {
      updateTooltipPosition(event)

      const object = pickFirstObject(event)
      if (hoveredObject === object) return

      hoveredObject = object
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
    selectedObject = object
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

    hoveredObject = null
    selectedObject = null
    setOutlineObjects({ hovered: null, selected: null })
    store.clearHovered()
  }

  /** 表格详情等外部选中：同步 store + OutlinePass */
  const selectObject = (object: THREE.Object3D | null): void => {
    selectedObject = object
    store.setSelected(toSelection(object))
    refreshOutline()
  }

  const selectByName = (name: string, source: EquipmentSource): void => {
    selectObject(getObjectByName(name, source))
  }

  onUnmounted(() => {
    unbindPicking()
  })

  return {
    tooltipPosition,
    pickFirstObject,
    bindPicking,
    unbindPicking,
    selectObject,
    selectByName,
  }
}
