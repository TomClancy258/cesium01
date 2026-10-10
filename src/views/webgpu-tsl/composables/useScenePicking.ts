import * as THREE from 'three'
import { useThrottleFn } from '@vueuse/core'
import { onUnmounted, type ShallowRef } from 'vue'

const POINTER_MOVE_THROTTLE_MS = 100

export type ScenePickHit = {
  object: THREE.Object3D
  /** 世界坐标交点 */
  point: THREE.Vector3
}

type RendererLike = {
  domElement: HTMLCanvasElement
}

export type UseScenePickingOptions = {
  camera: ShallowRef<THREE.Camera | null>
  renderer: ShallowRef<RendererLike | null>
  /** hover：仅回调 / log，不持久化 */
  onHover?: (hit: ScenePickHit | null) => void
  /** pointerdown 选中：仅当次回调 / log */
  onSelect?: (hit: ScenePickHit) => void
  /** 返回 true 时忽略指针交互（如 TransformControls 拖拽中） */
  isBlocked?: () => boolean
}

/**
 * WebGPU-TSL 精简拾取：
 * - pointermove → hover 回调
 * - pointerdown → select 回调（不做 impact / 不持久化选中）
 * - interactiveModels + registerObject 供 shield / patterns 等挂物体
 */
export function useScenePicking(options: UseScenePickingOptions) {
  const { camera, renderer, onHover, onSelect } = options

  const interactiveModels: THREE.Object3D[] = []
  let isBlocked: () => boolean = options.isBlocked ?? (() => false)
  let boundCanvas: HTMLCanvasElement | null = null
  let lastHovered: THREE.Object3D | null = null

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  const setBlocked = (fn: () => boolean): void => {
    isBlocked = fn
  }

  const registerObject = (object: THREE.Object3D): void => {
    if (!interactiveModels.includes(object)) {
      interactiveModels.push(object)
    }
  }

  const unregisterObject = (object: THREE.Object3D): void => {
    const index = interactiveModels.indexOf(object)
    if (index >= 0) interactiveModels.splice(index, 1)
  }

  const pick = (event: PointerEvent): ScenePickHit | null => {
    if (!camera.value || !renderer.value) return null
    if (!interactiveModels.length) return null

    const canvas = renderer.value.domElement
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(pointer, camera.value)
    const hits = raycaster.intersectObjects(interactiveModels, true)
    if (!hits.length) return null

    const first = hits[0]
    return {
      object: first.object,
      point: first.point.clone(),
    }
  }

  const onPointerMove = useThrottleFn(
    (event: PointerEvent): void => {
      if (isBlocked()) return
      const hit = pick(event)
      const next = hit?.object ?? null
      if (next === lastHovered) return
      lastHovered = next
      onHover?.(hit)
    },
    POINTER_MOVE_THROTTLE_MS,
    true,
    true,
  )

  const onPointerDown = (event: PointerEvent): void => {
    if (isBlocked()) return
    if (event.button !== 0) return
    const hit = pick(event)
    if (!hit) return
    onSelect?.(hit)
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
  }

  const unbindPicking = (): void => {
    if (boundCanvas) {
      boundCanvas.removeEventListener('pointermove', onPointerMove)
      boundCanvas.removeEventListener('pointerdown', onPointerDown)
      boundCanvas = null
    }
    lastHovered = null
  }

  onUnmounted(() => {
    unbindPicking()
  })

  return {
    interactiveModels,
    registerObject,
    unregisterObject,
    setBlocked,
    bindPicking,
    unbindPicking,
  }
}
