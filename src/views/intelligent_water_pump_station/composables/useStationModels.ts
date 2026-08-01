import * as THREE from 'three'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { onUnmounted, ref, shallowRef, type ShallowRef } from 'vue'
import type { EquipmentSource, EquipmentStatus, StationWsPayload } from '../types/station-equipment'
import {
  resolveTableKeyById,
  STATUS_HIGHLIGHT_COLOR,
  STATUS_HIGHLIGHT_INTENSITY,
} from '../types/station-equipment'

type EmissiveMaterial = THREE.Material & {
  emissive?: THREE.Color
  emissiveIntensity?: number
}

/** 材质视觉层：只备份 original 数值；status 由入参传入，真相在 store */
type MaterialVisual = {
  original: {
    emissive: number
    emissiveIntensity: number
  }
}

/** Draco 解码器放在 public/draco/gltf，支持内网部署 */
const DRACO_DECODER_PATH = '/draco/gltf/'

const MODEL_BASE = 'model/intelligent-water-pump-station'

/** public/model 经 Vite 代理后的泵站分片模型 */
const MODEL_FILES = [
  'sbz-daguanzi.glb',
  'sbz-dimian.glb',
  'sbz-dimian-ludeng.glb',
  'sbz-fangzi.glb',
  'sbz-guanzihefengshan.glb',
  'sbz-huatan-men.glb',
  'sbz-ludeng.glb',
  'sbz-shuichi.glb',
  'sbz-yancun.glb',
] as const

/** 需要 hover / select 的模型（声明用数组；查找用 Set） */
const MODEL_INTERACTION_FILES = [
  'sbz-daguanzi.glb',
  'sbz-fangzi.glb',
  'sbz-guanzihefengshan.glb',
  'sbz-shuichi.glb',
  'sbz-ludeng.glb',
  'sbz-yancun.glb',
] as const

const MODEL_INTERACTION_FILE_SET = new Set<string>(MODEL_INTERACTION_FILES)

function captureMaterialVisual(material: EmissiveMaterial): void {
  if (!material.emissive) return
  if (material.userData.visual) return
  material.userData.visual = {
    original: {
      emissive: material.emissive.getHex(),
      emissiveIntensity: material.emissiveIntensity ?? 1,
    },
  } satisfies MaterialVisual
}

/** status 由调用方传入（来自 store/帧数据）；normal 时写回 original 数值 */
function applyMaterialByPriority(
  material: EmissiveMaterial,
  status: EquipmentStatus,
): void {
  const visual = material.userData.visual as MaterialVisual | undefined
  if (!visual || !material.emissive) return

  if (status === 'normal') {
    material.emissive.setHex(visual.original.emissive)
    material.emissiveIntensity = visual.original.emissiveIntensity
    return
  }

  const color = STATUS_HIGHLIGHT_COLOR[status]
  if (color == null) return
  material.emissive.setHex(color)
  material.emissiveIntensity = STATUS_HIGHLIGHT_INTENSITY[status]
}

/** 交互节点材质各自 clone，并备份 original 数值 */
function ensureUniqueMaterials(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => material.clone())
    } else if (child.material) {
      child.material = child.material.clone()
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((material) => {
      if (material) captureMaterialVisual(material as EmissiveMaterial)
    })
  })
}

function markInteractive(child: THREE.Object3D): void {
  child.userData.interactive = true
  child.userData.name = child.name
  ensureUniqueMaterials(child)
}

function collectInteractiveTargets(file: string, root: THREE.Object3D): THREE.Object3D[] {
  if (root.name === 'sbz-shuichi') {
    // 例：shuichi-01 … shuichi-14 各是独立 Group；排除 qiao-2 等非水池子节点
    return root.children.filter((child) => {
      const isReservoir = child.name.startsWith('shuichi')
      if (!isReservoir) return false
      markInteractive(child)
      child.userData.text = child.name.replace('shuichi','蓄水池')
      child.userData.source = 'reservoir'
      return true
    })
  } else if (root.name === 'sbz-guanzihefengshan') {
    return root.children.filter((child) => {
      const isCoolingTower = child.name.startsWith('paifengshan')
      const isCoolingTube = child.name.startsWith('guanzi')
      const isInteractive = isCoolingTower || isCoolingTube
      if (!isInteractive) return false
      markInteractive(child)
      if (isCoolingTower) {
        child.userData.text = child.name.replace('paifengshan', '冷却塔')
        child.userData.source = 'coolingTower'
      } else if (isCoolingTube) {
        child.userData.text = child.name.replace('guanzi', '冷却管')
        child.userData.source = 'coolingTube'
      }
      return true
    })
  } else if (root.name === 'sbz-ludeng') {
    return root.children.filter((child) => {
      const isStreetLight = child.name.startsWith('ld')
      if (!isStreetLight) return false
      markInteractive(child)
      child.userData.text = child.name.replace('ld','路灯')
      child.userData.source = 'streetLight'
      return true
    })
  } else if (root.name === 'sbz-yancun') {
    return root.children.filter((child) => {
      const isMixingTank = child.name.startsWith('01')
      const isPressureRegulatingTower = child.name.startsWith('yancun')
      const isInteractive = isMixingTank || isPressureRegulatingTower
      if (!isInteractive) return false
      markInteractive(child)
      if (isPressureRegulatingTower) {
        child.userData.text = child.name.replace('yancun', '调压塔')
        child.userData.source = 'pressureRegulatingTower'
      } else if (isMixingTank) {
        child.userData.text = child.name.replace('01', '搅拌池')
        child.userData.source = 'mixingTank'
      }
      return true
    })
  } else if (root.name === 'sbz-fangzi') {
    return root.children.filter((child) => {
      const isHouse = child.name.startsWith('fangzi')
      if (!isHouse) return false
      markInteractive(child)
      child.userData.text = child.name.replace('fangzi','房子')
      child.userData.source = 'house'
      return true
    })
  } else if (root.name === 'sbz-daguanzi') {
    return root.children.filter((child) => {
      const isVerticalPressurizedTankBody = child.name.startsWith('daguanzi')
      if (!isVerticalPressurizedTankBody) return false
      markInteractive(child)
      child.userData.text = child.name.replace('daguanzi','立式承压罐体')
      child.userData.source = 'verticalPressurizedTankBody'
      return true
    })
  }

  root.userData.interactive = true
  root.userData.name = root.name
  ensureUniqueMaterials(root)
  return [root]
}

function applyStatusToObject(object: THREE.Object3D, status: EquipmentStatus): void {
  /** 设备根上可选缓存，便于调试；材质上不存 status */
  object.userData.status = status

  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((material) => {
      if (!material) return
      const mat = material as EmissiveMaterial
      captureMaterialVisual(mat)
      if (!mat.userData.visual) return
      applyMaterialByPriority(mat, status)
    })
  })
}

function disposeObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        if (!material) return
        Object.values(material).forEach((value) => {
          if (value instanceof THREE.Texture) value.dispose()
        })
        material.dispose()
      })
    }
  })
}

function fitCameraToObject(
  object: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls | null,
): void {
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) return

  const center = box.getCenter(new THREE.Vector3())
  // const size = box.getSize(new THREE.Vector3())
  // const maxSize = Math.max(size.x, size.y, size.z)
  // const fitDistance =
  //   maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2))

  // camera.position.copy(center).add(new THREE.Vector3(fitDistance, fitDistance * 0.6, fitDistance))

  camera.position.copy(center).add(new THREE.Vector3(70, 50, 70))
  // camera.near = Math.max(fitDistance / 100, 0.1)
  // camera.far = Math.max(fitDistance * 100, 2000)
  camera.updateProjectionMatrix()
  camera.lookAt(center)

  if (controls) {
    controls.target.copy(center)
    controls.update()
  }
}

export function useStationModels(
  scene: ShallowRef<THREE.Scene | null>,
  camera: ShallowRef<THREE.PerspectiveCamera | null>,
  controls: ShallowRef<OrbitControls | null>,
) {
  const modelsGroup = shallowRef<THREE.Group | null>(null)
  /** 可交互模型根节点（非响应式，同 airportRenderMap 思路） */
  const interactiveModels: THREE.Object3D[] = []
  /** name → Object3D，供 table / WS 状态着色 */
  const objectById = new Map<string, THREE.Object3D>()
  /** 分类型 name → gltf.scene 子节点（可交互 Object3D） */
  const reservoirMap = new Map<string, THREE.Object3D>()
  const coolingTowerMap = new Map<string, THREE.Object3D>()
  const coolingTubeMap = new Map<string, THREE.Object3D>()
  const streetLightMap = new Map<string, THREE.Object3D>()
  const pressureRegulatingTowerMap = new Map<string, THREE.Object3D>()
  const mixingTankMap = new Map<string, THREE.Object3D>()
  const houseMap = new Map<string, THREE.Object3D>()
  const verticalPressurizedTankBodyMap = new Map<string, THREE.Object3D>()
  const loading = ref(false)
  const loadedCount = ref(0)
  const totalCount = MODEL_FILES.length

  let dracoLoader: DRACOLoader | null = null

  const clearEquipmentMaps = (): void => {
    objectById.clear()
    reservoirMap.clear()
    coolingTowerMap.clear()
    coolingTubeMap.clear()
    streetLightMap.clear()
    pressureRegulatingTowerMap.clear()
    mixingTankMap.clear()
    houseMap.clear()
    verticalPressurizedTankBodyMap.clear()
  }

  const rebuildObjectMaps = (list: THREE.Object3D[]): void => {
    clearEquipmentMaps()
    list.forEach((object) => {
      const key = (object.userData.name as string) || object.name
      if (!key) return
      objectById.set(key, object)

      switch (resolveTableKeyById(key)) {
        case 'reservoir':
          reservoirMap.set(key, object)
          break
        case 'coolingTower':
          coolingTowerMap.set(key, object)
          break
        case 'coolingTube':
          coolingTubeMap.set(key, object)
          break
        case 'streetLight':
          streetLightMap.set(key, object)
          break
        case 'pressureRegulatingTower':
          pressureRegulatingTowerMap.set(key, object)
          break
        case 'mixingTank':
          mixingTankMap.set(key, object)
          break
        case 'house':
          houseMap.set(key, object)
          break
        case 'verticalPressurizedTankBody':
          verticalPressurizedTankBodyMap.set(key, object)
          break
      }
    })
  }

  const getObjectMapBySource = (
    source: EquipmentSource,
  ): Map<string, THREE.Object3D> | null => {
    switch (source) {
      case 'reservoir':
        return reservoirMap
      case 'coolingTower':
        return coolingTowerMap
      case 'coolingTube':
        return coolingTubeMap
      case 'streetLight':
        return streetLightMap
      case 'pressureRegulatingTower':
        return pressureRegulatingTowerMap
      case 'mixingTank':
        return mixingTankMap
      case 'house':
        return houseMap
      case 'verticalPressurizedTankBody':
        return verticalPressurizedTankBodyMap
      default:
        return null
    }
  }

  /** 按帧数据 status 给对应模型上色（normal / warning / danger） */
  const applyStatusFromPayload = (packets: StationWsPayload): void => {
    packets.forEach((packet) => {
      const objectMap = getObjectMapBySource(packet.source)
      if (!objectMap) return

      packet.data.forEach((row) => {
        const object = objectMap.get(row.name)
        if (!object) return
        applyStatusToObject(object, row.status)
      })
    })
  }

  const createGltfLoader = (): GLTFLoader => {
    dracoLoader ??= new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    return loader
  }

  //凡是 async 函数，调用时一定返回 Promise，不用手写 return new Promise(...)。
  const loadModels = async (): Promise<void> => {
    if (!scene.value) {
      console.error('[useStationModels] scene is not ready')
      return
    }

    disposeModels()

    loading.value = true
    loadedCount.value = 0

    const group = new THREE.Group()
    group.name = 'intelligent-water-pump-station'
    const interactiveList: THREE.Object3D[] = []
    const loader = createGltfLoader()

    try {
      // 1. map 返回新数组：[Promise, Promise, ...]
      const promises = MODEL_FILES.map(async (file) => {
        const url = `${MODEL_BASE}/${file}`
        const gltf = await loader.loadAsync(url)
        const modelName = file.replace(/\.glb$/i, '')
        gltf.scene.name = modelName
        // 全部模型都要进场景显示
        group.add(gltf.scene)

        // 只有交互名单里的，才交给拾取
        if (MODEL_INTERACTION_FILE_SET.has(file)) {
          interactiveList.push(...collectInteractiveTargets(file, gltf.scene))
        }

        loadedCount.value += 1
      })

      // 2. 把这个新数组传给 Promise.all 使用
      await Promise.all(promises)

      scene.value.add(group)
      modelsGroup.value = group
      interactiveModels.length = 0
      interactiveModels.push(...interactiveList)
      rebuildObjectMaps(interactiveList)

      if (camera.value) {
        fitCameraToObject(group, camera.value, controls.value)
      }
    } catch (error) {
      console.error('[useStationModels] failed to load models', error)
      disposeObject3D(group)
      interactiveModels.length = 0
      clearEquipmentMaps()
    } finally {
      loading.value = false
    }
  }

  const disposeModels = (): void => {
    const group = modelsGroup.value
    interactiveModels.length = 0
    clearEquipmentMaps()
    if (!group) return

    group.removeFromParent()
    disposeObject3D(group)
    modelsGroup.value = null
    loadedCount.value = 0
  }

  onUnmounted(() => {
    disposeModels()
    dracoLoader?.dispose()
    dracoLoader = null
  })

  return {
    modelsGroup,
    interactiveModels,
    objectById,
    reservoirMap,
    coolingTowerMap,
    coolingTubeMap,
    streetLightMap,
    pressureRegulatingTowerMap,
    mixingTankMap,
    houseMap,
    verticalPressurizedTankBodyMap,
    loading,
    loadedCount,
    totalCount,
    loadModels,
    disposeModels,
    applyStatusFromPayload,
  }
}
