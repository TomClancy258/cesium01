import * as THREE from 'three'
import { onUnmounted, ref, shallowRef, type ShallowRef } from 'vue'

/** 所有交互设备共用同一套高亮；hover / select 颜色区分 */
const HIGHLIGHT = {
  hover: { color: 0x3b82f6, intensity: 0.55 }, // 蓝
  select: { color: 0xf59e0b, intensity: 0.85 }, // 橙
} as const

type MaterialBackup = {
  mesh: THREE.Mesh
  originalMaterial: THREE.Material | THREE.Material[]
}

type EmissiveMaterial = THREE.Material & {
  emissive?: THREE.Color
  emissiveIntensity?: number
}

/**
 * Three 没有 Cesium.ScreenSpaceEventHandler / ScreenSpaceEventType。
 * 等价做法：在 renderer.domElement 上监听原生 DOM 事件，再用 Raycaster 拾取。
 * - LEFT_CLICK  ≈ click / pointerup（需自己区分拖拽）
 * - MOUSE_MOVE  ≈ pointermove / mousemove
 *
 * 高亮：整体自发光。必须 clone 材质——glTF 里多栋房子常共用同一 Material，
 * 直接改 emissive 会导致「点一个、全亮」。
 */
export function useScenePicking(
  camera: ShallowRef<THREE.PerspectiveCamera | null>,
  renderer: ShallowRef<THREE.WebGLRenderer | null>,
  /** 可交互模型根节点列表（非响应式数组，同 airportRenderMap） */
  interactiveModels: THREE.Object3D[],
) {
  const hoveredObject = shallowRef<THREE.Object3D | null>(null)
  const selectedObject = shallowRef<THREE.Object3D | null>(null)
  const hoveredName = ref<string | null>(null)
  const selectedName = ref<string | null>(null)

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const pointerDown = new THREE.Vector2()

  let boundCanvas: HTMLCanvasElement | null = null
  let rafId = 0
  let pendingEvent: PointerEvent | null = null
  let hoverBackups: MaterialBackup[] = []
  let selectBackups: MaterialBackup[] = []

  const disposeMaterial = (material: THREE.Material | THREE.Material[]): void => {
    const list = Array.isArray(material) ? material : [material]
    list.forEach((item) => item.dispose())
  }

  const clearEmissive = (backups: MaterialBackup[]): void => {
    backups.forEach(({ mesh, originalMaterial }) => {
      const highlighted = mesh.material
      mesh.material = originalMaterial
      disposeMaterial(highlighted)
    })
    backups.length = 0
  }

  const cloneWithEmissive = (
    material: THREE.Material,
    color: number,
    intensity: number,
  ): THREE.Material => {
    const cloned = material.clone() as EmissiveMaterial
    if (cloned.emissive) {
      cloned.emissive.setHex(color)
      cloned.emissiveIntensity = intensity
    }
    return cloned
  }

  const applyEmissive = (
    object: THREE.Object3D,
    color: number,
    intensity: number,
  ): MaterialBackup[] => {
    const backups: MaterialBackup[] = []
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return

      backups.push({
        mesh: child,
        originalMaterial: child.material,
      })

      if (Array.isArray(child.material)) {
        child.material = child.material.map((mat) =>
          cloneWithEmissive(mat, color, intensity),
        )
      } else {
        child.material = cloneWithEmissive(child.material, color, intensity)
      }
    })
    return backups
  }

  const refreshHighlight = (): void => {
    clearEmissive(hoverBackups)
    clearEmissive(selectBackups)

    const selected = selectedObject.value
    const hovered = hoveredObject.value

    if (selected) {
      selectBackups = applyEmissive(
        selected,
        HIGHLIGHT.select.color,
        HIGHLIGHT.select.intensity,
      )
    }

    // hover 且不是当前选中时，才叠加蓝高亮
    if (hovered && hovered !== selected) {
      hoverBackups = applyEmissive(hovered, HIGHLIGHT.hover.color, HIGHLIGHT.hover.intensity)
    }
  }

  /** 命中 mesh 后回退到 interactiveModels 里的根节点 */
  const resolveInteractiveRoot = (hitObject: THREE.Object3D): THREE.Object3D | null => {
    let current: THREE.Object3D | null = hitObject
    while (current) {
      if (interactiveModels.includes(current)) return current
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
    return resolveInteractiveRoot(hits[0].object)
  }

  const flushPointerMove = (): void => {
    rafId = 0
    const event = pendingEvent
    pendingEvent = null
    if (!event) return

    const object = pickFirstObject(event)
    if (hoveredObject.value === object) return

    hoveredObject.value = object
    hoveredName.value = object?.name || null
    refreshHighlight()
  }

  // ≈ Cesium MOUSE_MOVE
  const onPointerMove = (event: PointerEvent): void => {
    pendingEvent = event
    if (rafId) return
    rafId = requestAnimationFrame(flushPointerMove)
  }

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
    selectedName.value = object?.name || null
    refreshHighlight()
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
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
    pendingEvent = null

    clearEmissive(hoverBackups)
    clearEmissive(selectBackups)

    if (boundCanvas) {
      boundCanvas.removeEventListener('pointermove', onPointerMove)
      boundCanvas.removeEventListener('pointerdown', onPointerDown)
      boundCanvas.removeEventListener('pointerup', onPointerUp)
      boundCanvas = null
    }

    hoveredObject.value = null
    selectedObject.value = null
    hoveredName.value = null
    selectedName.value = null
  }

  onUnmounted(() => {
    unbindPicking()
  })

  return {
    hoveredObject,
    selectedObject,
    hoveredName,
    selectedName,
    pickFirstObject,
    bindPicking,
    unbindPicking,
  }
}
