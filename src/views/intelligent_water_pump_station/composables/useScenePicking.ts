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
/** 漫游准星拾取节流（挂在 beforeRender，避免每帧全量 intersect） */
const GAZE_PICK_THROTTLE_MS = 100
/** 准星拾取最远距离（米） */
const GAZE_PICK_FAR = 40

/** 鼠标右下角偏移 */
const TOOLTIP_OFFSET = { x: 12, y: 16 } as const

type FindObjectByName = (
  name: string,
  source: EquipmentSource,
) => THREE.Object3D | null

type AfterRenderHandle = (fn: () => void) => () => void

/**
 * 两套拾取：
 * - 屏幕指针（默认）：pointermove hover + pointerup select
 * - 相机前方（漫游）：准星视线 hover，关闭 click select
 */
export function useScenePicking(
  camera: ShallowRef<THREE.PerspectiveCamera | null>,
  renderer: ShallowRef<THREE.WebGLRenderer | null>,
  /** 可交互模型根节点列表（非响应式数组，同 airportRenderMap） */
  interactiveModels: THREE.Object3D[],
  setOutlineObjects: (targets: OutlineObjects) => void,
  getObjectByName: FindObjectByName,
  onBeforeRender?: AfterRenderHandle,
) {
  const store = useStationEquipmentStore()
  /** 非响应式，仅给描边用（UI 用 store.hovered / selected） */
  let hoveredObject: THREE.Object3D | null = null
  let selectedObject: THREE.Object3D | null = null
  /** true：相机前方准星 hover；false：屏幕指针 hover/select */
  let gazeMode = false
  let removeGazeTick: (() => void) | null = null

  /** 相对三维容器的屏幕坐标；必须 reactive，子组件才能跟着鼠标更新 */
  const tooltipPosition = reactive<TooltipPosition>({ left: 0, top: 0 })

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const pointerDown = new THREE.Vector2()
  const lookDir = new THREE.Vector3()

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

  const updateTooltipFromPointer = (event: PointerEvent): void => {
    const canvas = renderer.value?.domElement
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    tooltipPosition.left = event.clientX - rect.left + TOOLTIP_OFFSET.x
    tooltipPosition.top = event.clientY - rect.top + TOOLTIP_OFFSET.y
  }

  /** 漫游：tooltip 贴在准星附近（画布中心） */
  const updateTooltipToCrosshair = (): void => {
    const canvas = renderer.value?.domElement
    if (!canvas) return
    tooltipPosition.left = canvas.clientWidth / 2 + TOOLTIP_OFFSET.x
    tooltipPosition.top = canvas.clientHeight / 2 + TOOLTIP_OFFSET.y
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

  const applyHover = (object: THREE.Object3D | null): void => {
    if (hoveredObject === object) return
    hoveredObject = object
    store.setHovered(toSelection(object))
    refreshOutline()
  }

  /** 屏幕指针射线 */
  const pickByScreenPointer = (event: PointerEvent): THREE.Object3D | null => {
    if (!camera.value || !renderer.value) return null
    if (!interactiveModels.length) return null

    const canvas = renderer.value.domElement
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.far = Infinity
    raycaster.setFromCamera(pointer, camera.value)
    const hits = raycaster.intersectObjects(interactiveModels, true)
    if (!hits.length) return null
    const object = resolveInteractiveRoot(hits[0].object)
    console.log('object', object)
    return object
  }

  /** 相机正前方准星射线 */
  const pickByCameraForward = (): THREE.Object3D | null => {
    if (!camera.value) return null
    if (!interactiveModels.length) return null

    camera.value.getWorldDirection(lookDir)
    raycaster.far = GAZE_PICK_FAR
    raycaster.set(camera.value.position, lookDir)
    const hits = raycaster.intersectObjects(interactiveModels, true)
    if (!hits.length) return null
    return resolveInteractiveRoot(hits[0].object)
  }

  // ≈ Cesium MOUSE_MOVE（VueUse throttle）
  const onPointerMove = useThrottleFn(
    (event: PointerEvent): void => {
      if (gazeMode) return
      updateTooltipFromPointer(event)
      applyHover(pickByScreenPointer(event))
    },
    POINTER_MOVE_THROTTLE_MS,
    true,
    true,
  )

  const onPointerDown = (event: PointerEvent): void => {
    if (gazeMode) return
    pointerDown.set(event.clientX, event.clientY)
  }

  // ≈ Cesium LEFT_CLICK（用位移阈值避开 CameraControls 拖拽）
  const onPointerUp = (event: PointerEvent): void => {
    if (gazeMode) return
    const dx = event.clientX - pointerDown.x
    const dy = event.clientY - pointerDown.y
    if (dx * dx + dy * dy > 25) return

    const object = pickByScreenPointer(event)
    selectedObject = object
    store.setSelected(toSelection(object))
    refreshOutline()
  }

  const gazePickTick = useThrottleFn(
    (): void => {
      if (!gazeMode) return
      updateTooltipToCrosshair()
      applyHover(pickByCameraForward())
    },
    GAZE_PICK_THROTTLE_MS,
    true,
    true,
  )

  const stopGazePicking = (): void => {
    removeGazeTick?.()
    removeGazeTick = null
  }

  const startGazePicking = (): void => {
    stopGazePicking()
    if (!onBeforeRender) {
      console.warn('[useScenePicking] onBeforeRender missing; gaze picking disabled')
      return
    }
    removeGazeTick = onBeforeRender(() => {
      gazePickTick()
    })
  }

  /**
   * 切换拾取模式（由页面根据 roamEnabled 调用）。
   * - true：相机前方 hover，关闭 click select，清空 selected
   * - false：恢复屏幕指针 hover + select
   */
  const setGazePickingEnabled = (enabled: boolean): void => {
    if (gazeMode === enabled) return
    gazeMode = enabled

    if (enabled) {
      selectedObject = null
      store.setSelected(null)
      applyHover(null)
      updateTooltipToCrosshair()
      startGazePicking()
      refreshOutline()
      return
    }

    stopGazePicking()
    applyHover(null)
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
    stopGazePicking()
    gazeMode = false

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
    bindPicking,
    unbindPicking,
    setGazePickingEnabled,
    selectObject,
    selectByName,
  }
}
