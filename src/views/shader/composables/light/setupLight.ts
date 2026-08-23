import * as THREE from 'three'
import type { ShallowRef } from 'vue'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { onUnmounted } from 'vue'
import {
  disposeSharedWaterNormal, isSharedWaterNormalTexture
} from '@/views/intelligent_water_pump_station/composables/station-water-surface'

/** Draco 解码器放在 public/draco/gltf，支持内网部署 */
const DRACO_DECODER_PATH = '/draco/gltf/'
const MODEL_BASE = 'model/others'

/**
 * 与 useStationModels 一样：setup 时 scene 可能还是 null，
 * 只接收 ShallowRef；真正用 scene 放在 loadModel（initScene 之后）里。
 */
export function setupLight(scene: ShallowRef<THREE.Scene | null>) {
  let dracoLoader: DRACOLoader | null = null
  let group = new THREE.Group()
  group.name = 'shader-test'

  const createGltfLoader = (): GLTFLoader => {
    dracoLoader ??= new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    return loader
  }

  const loadModel = async (): Promise<void> => {
    if (!scene.value) {
      console.error('[setupLight] scene is not ready; call after initScene()')
      return null
    }
    try {

      const loader = createGltfLoader()
      const url = `${MODEL_BASE}/suzanne.glb`
      const gltf = await loader.loadAsync(url)
      gltf.scene.name = 'suzanne'
      group.add(gltf.scene)
      scene.value.add(group)
    }catch (e) {
      console.error('[useStationModels] failed to load models', e)
      disposeObject3D(group)
    }
  }

  onUnmounted(() => {
    dracoLoader?.dispose()
    dracoLoader = null
    disposeObject3D(group)
    group=null
  })

  return {
    loadModel,
  }
}

function disposeObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        if (!material) return
        Object.values(material).forEach((value) => {
          if (!(value instanceof THREE.Texture)) return
          value.dispose()
        })
        material.dispose()
      })
    }
  })
}
