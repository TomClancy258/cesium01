import * as THREE from 'three'
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'
import { useThrottleFn } from '@vueuse/core'
import { onUnmounted, watch, type Ref, type ShallowRef } from 'vue'
import { useStationEquipmentStore } from '@/stores/station-equipment'
import { EQUIPMENT_SOURCES, type EquipmentSource } from '../types/station-equipment'
import './equipment-label.scss'

/** 标签锚点相对包围盒顶面的上抬（世界单位） */
const LABEL_Y_OFFSET = 0.8

const RESIZE_THROTTLE_MS = 100

type AfterRenderHandle = (fn: () => void) => () => void

/**
 * 设备头顶名称条：CSS2DRenderer，仅与 store.labelVisibleBySource 联动，
 * 不跟 hover / select。
 */
export function useEquipmentLabels(
  containerRef: Ref<HTMLElement | null>,
  scene: ShallowRef<THREE.Scene | null>,
  camera: ShallowRef<THREE.PerspectiveCamera | null>,
  interactiveModels: THREE.Object3D[],
  onAfterRender: AfterRenderHandle,
) {
  const store = useStationEquipmentStore()

  let labelRenderer: CSS2DRenderer | null = null
  let labelsGroup: THREE.Group | null = null
  let resizeObserver: ResizeObserver | null = null
  /** onAfterRender 返回的注销器；dispose 时调用，停止每帧 labelRenderer.render */
  let removeAfterRender: (() => void) | null = null

  /** 把 CSS2D 叠加层尺寸对齐到三维容器（只改投影视口，不改标签 CSS 样式大小） */
  const syncLabelRendererSize = (): void => {
    const container = containerRef.value
    if (!container || !labelRenderer) return
    const { clientWidth, clientHeight } = container
    if (clientWidth === 0 || clientHeight === 0) return
    labelRenderer.setSize(clientWidth, clientHeight)
  }

  const throttledSyncLabelRendererSize = useThrottleFn(
    syncLabelRendererSize,
    RESIZE_THROTTLE_MS,
    true,
    true,
  )

  /** 按 store.labelVisibleBySource 显隐各 source 的 CSS2DObject */
  const applyVisibility = (): void => {
    if (!labelsGroup) return
    labelsGroup.children.forEach((child: THREE.Object3D) => {
      const source = child.userData.source as EquipmentSource | undefined
      if (!source) return
      child.visible = store.labelVisibleBySource[source] === true
    })
  }

  /** 清空 labelsGroup 内标签，并移除对应 DOM */
  const clearLabels = (): void => {
    if (!labelsGroup) return
    while (labelsGroup.children.length > 0) {
      const child = labelsGroup.children[0]
      labelsGroup.remove(child)
      if (child instanceof CSS2DObject) {
        child.element.remove()
      }
    }
  }

  /** 模型加载完成后调用：按 interactiveModels + userData.text 重建头顶标签（演员） */
  const rebuildLabels = (): void => {
    if (!scene.value) return

    if (!labelsGroup) {
      labelsGroup = new THREE.Group()
      labelsGroup.name = 'equipment-labels'
      scene.value.add(labelsGroup)
    } else {
      clearLabels()
    }

    const box = new THREE.Box3()
    const center = new THREE.Vector3()

    interactiveModels.forEach((object) => {
      const text = object.userData.text as string | undefined
      const source = object.userData.source as EquipmentSource | undefined
      if (!text || !source) return

      box.setFromObject(object)
      if (box.isEmpty()) return
      box.getCenter(center)

      const el = document.createElement('div')
      el.className = 'equipment-label'
      el.textContent = text

      const label = new CSS2DObject(el)
      label.position.set(center.x, box.max.y + LABEL_Y_OFFSET, center.z)
      label.userData.source = source
      label.visible = store.labelVisibleBySource[source] === true
      labelsGroup!.add(label)
    })
  }

  /**
   * 创建 CSS2DRenderer（放映机），并登记到 scene 的 onAfterRender：
   * 每帧 composer 之后执行 labelRenderer.render。
   */
  const initLabelRenderer = (): void => {
    const container = containerRef.value
    if (!container) {
      console.error('[useEquipmentLabels] containerRef is not bound')
      return
    }
    if (labelRenderer) return

    const renderer = new CSS2DRenderer()
    renderer.domElement.className = 'equipment-label-layer'
    container.appendChild(renderer.domElement)
    labelRenderer = renderer
    syncLabelRendererSize()

    resizeObserver = new ResizeObserver(() => {
      throttledSyncLabelRendererSize()
    })
    resizeObserver.observe(container)

    removeAfterRender = onAfterRender(() => {
      if (!labelRenderer || !scene.value || !camera.value) return
      labelRenderer.render(scene.value, camera.value)
    })
  }

  /** 注销后置渲染、标签 DOM / Group、CSS2DRenderer */
  const disposeLabels = (): void => {
    removeAfterRender?.()
    removeAfterRender = null

    resizeObserver?.disconnect()
    resizeObserver = null

    clearLabels()
    if (labelsGroup) {
      labelsGroup.removeFromParent()
      labelsGroup = null
    }

    if (labelRenderer) {
      labelRenderer.domElement.remove()
      labelRenderer = null
    }
  }

  watch(
    () => EQUIPMENT_SOURCES.map((source) => store.labelVisibleBySource[source]),
    applyVisibility,
  )

  onUnmounted(() => {
    disposeLabels()
  })

  return {
    initLabelRenderer,
    rebuildLabels,
    clearLabels,
    disposeLabels,
  }
}
