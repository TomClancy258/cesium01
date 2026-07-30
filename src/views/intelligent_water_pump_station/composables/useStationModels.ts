import * as THREE from 'three'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { onUnmounted, ref, shallowRef, type ShallowRef } from 'vue'

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
  'sbz-yancun.glb',
] as const

const MODEL_INTERACTION_FILE_SET = new Set<string>(MODEL_INTERACTION_FILES)

function collectInteractiveTargets(file: string, root: THREE.Object3D): THREE.Object3D[] {
  if (root.name === 'sbz-shuichi') {
    // 例：shuichi-01 … shuichi-14 各是独立 Group；排除 qiao-2 等非水池子节点
    return root.children.filter((child) => {
      const isPool = child.name.startsWith('shuichi')
      if (!isPool) return false
      child.userData.interactive = true
      // child.userData.chinese = child.name.replace('shuichi','水池')
      return true
    })
  }else if (root.name === 'sbz-guanzihefengshan') {
    return root.children.filter((child) => {
      const isPool = child.name.startsWith('paifengshan')
      if (!isPool) return false
      child.userData.interactive = true
      // child.userData.chinese = child.name.replace('paifengshan','冷却塔')
      return true
    })
  }else if (root.name === 'sbz-ludeng') {
    return root.children.filter((child) => {
      const isPool = child.name.startsWith('ld')
      if (!isPool) return false
      child.userData.interactive = true
      // child.userData.chinese = child.name.replace('ld','路灯')
      return true
    })
  }else if (root.name === 'sbz-yancun') {
    return root.children.filter((child) => {
      const isPool = child.name.startsWith('01')
      const isTower=child.name.startsWith('yancun')
      const isInteractive=isPool||isTower
      if (!isInteractive) return false
      child.userData.interactive = true
      // if (isPool) {
      //   child.userData.chinese = child.name.replace('yancun', '调压塔')
      // } else if (isTower) {
      //   child.userData.chinese = child.name.replace('01', '搅拌池')
      // }
      return true
    })
  }else if (root.name === 'sbz-fangzi') {
    return root.children.filter((child) => {
      const isPool = child.name.startsWith('fangzi')
      if (!isPool) return false
      child.userData.interactive = true
      // child.userData.chinese = child.name.replace('fangzi','房子')
      return true
    })
  }else if (root.name === 'sbz-daguanzi') {
    return root.children.filter((child) => {
      const isPool = child.name.startsWith('daguanzi')
      if (!isPool) return false
      child.userData.interactive = true
      // child.userData.chinese = child.name.replace('daguanzi','大管子')
      return true
    })
  }


  root.userData.interactive = true
  return [root]
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
  const loading = ref(false)
  const loadedCount = ref(0)
  const totalCount = MODEL_FILES.length

  let dracoLoader: DRACOLoader | null = null

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

      if (camera.value) {
        fitCameraToObject(group, camera.value, controls.value)
      }
    } catch (error) {
      console.error('[useStationModels] failed to load models', error)
      disposeObject3D(group)
      interactiveModels.length = 0
    } finally {
      loading.value = false
    }
  }

  const disposeModels = (): void => {
    const group = modelsGroup.value
    interactiveModels.length = 0
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
    loading,
    loadedCount,
    totalCount,
    loadModels,
    disposeModels,
  }
}
