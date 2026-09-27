import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { ShallowRef } from 'vue'
import { float, mrt, normalWorld, output, pass, uv } from 'three/tsl'

export interface CoffeeSmokeOptions {
  scene: ShallowRef<THREE.Scene | null>
  camera: ShallowRef<THREE.Camera | null>
  renderer: ShallowRef<THREE.WebGPURenderer | null>
  controls: ShallowRef<OrbitControls | null>
  /** 用 RenderPipeline 时覆盖默认 renderer.render */
  setFrameRender?: (fn: (() => void) | null) => void
}

/** 与泵站一致：Draco 解码器放在 public/draco/gltf */
const DRACO_DECODER_PATH = '/draco/gltf/'

/** Journey 咖啡烟雾烘焙模型，放在 public/model/others/anvil.glb */
const BAKED_MODEL_URL = 'model/others/anvil.glb'

/**
 * 咖啡烟雾场景：按泵站方式用 GLTFLoader + Draco 加载 baked 模型。
 */
export async function setupPostProcessing(
  options: CoffeeSmokeOptions,
): Promise<{ dispose: () => void } | null> {
  const { scene, camera, renderer, setFrameRender } = options
  if (!scene.value || !camera.value || !renderer.value) {
    console.error('[setupPostProcessing] scene/camera/renderer is not ready')
    return null
  }

  const root = new THREE.Group()
  root.name = 'coffee-smoke'
  scene.value.add(root)
  root.position.set(0,1,0)

  let dracoLoader: DRACOLoader | null = null
  let bakedScene: THREE.Group | THREE.Object3D | null = null

  const createGltfLoader = (): GLTFLoader => {
    dracoLoader ??= new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    return loader
  }

  const loadFloor=()=>{
    const floorTexture = new THREE.TextureLoader().load(
      '/textures/floor/floor-color.jpg',
    )
    floorTexture.colorSpace = THREE.SRGBColorSpace
    floorTexture.wrapS = THREE.RepeatWrapping
    floorTexture.wrapT = THREE.RepeatWrapping

    // transparent: true 后 opacity / opacityNode 才会混合；否则 alpha 被忽略
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      transparent: true,
      depthWrite: false,
    })
    // uv 从中心拉到约 [-1,1]，再按距离做边缘虚化
    const uvFromCenter = uv().sub(0.5).mul(2.0)
    const distToCenter = uvFromCenter.length()
    // 不能写 1.0 - node（JS 减法会得到 NaN）；要用 TSL 的 .sub()
    const alpha = float(1).sub(distToCenter.smoothstep(0.2, 0.5))
    floorMaterial.opacityNode = alpha

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), floorMaterial)
    floor.rotation.x = -Math.PI * 0.5
    floor.receiveShadow = true
    root.add(floor)
  }

  /** 与 useStationModels.loadModels 同套路：loadAsync → 命名 → 挂到 root */
  const loadAnvilModel = async (): Promise<void> => {
    const loader = createGltfLoader()
    const gltf = await loader.loadAsync(BAKED_MODEL_URL)
    const modelName = 'anvil'
    gltf.scene.name = modelName

    // Journey：提高 baked 贴图各向异性过滤
    const baked = gltf.scene.getObjectByName('anvil')
    if (baked instanceof THREE.Mesh) {
      const materials = Array.isArray(baked.material)
        ? baked.material
        : [baked.material]
      materials.forEach((material) => {
        if (
          material &&
          'map' in material &&
          material.map instanceof THREE.Texture
        ) {
          material.map.anisotropy = 8
        }
      })
    }

    bakedScene = gltf.scene
    root.add(gltf.scene)
  }

  loadFloor()
  try {
    await loadAnvilModel()
  } catch (error) {
    console.error('[setupCoffeSmoke] failed to load anvil', {
      url: BAKED_MODEL_URL,
      error,
    })
  }
  let renderPipeline: InstanceType<typeof THREE.RenderPipeline> | null = null

  const postProcessing01 = (): void => {
    //自定义管线
    renderPipeline = new THREE.RenderPipeline(renderer.value!)
    renderPipeline.outputColorTransform = false

    const inspector = renderer.value!.inspector
    if (inspector?.createParameters) {
      inspector.createParameters('Post processing')
    }

    const scenePass = pass(scene.value!, camera.value!)
    scenePass.setMRT(
      mrt({
        output, // 美颜/颜色缓冲
        normal: normalWorld, // 世界法线缓冲
      }),
    )
    //字符串 'output' 对应 mrt 里的 output 键
    renderPipeline.outputNode = scenePass.getTextureNode('output')

    setFrameRender?.(() => {
      renderPipeline?.render()
    })
  }
  // postProcessing01()

  const disposeObject3D = (object: THREE.Object3D): void => {
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.geometry?.dispose()
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material]
      materials.forEach((material) => {
        if (!material) return
        // 与泵站一致：扫材质上所有 Texture，再 dispose material
        Object.values(material).forEach((value) => {
          if (value instanceof THREE.Texture) value.dispose()
        })
        material.dispose()
      })
    })
  }

  const dispose = (): void => {
    setFrameRender?.(null)
    renderPipeline = null
    if (bakedScene) {
      root.remove(bakedScene)
      disposeObject3D(bakedScene)
      bakedScene = null
    }
    scene.value?.remove(root)
    dracoLoader?.dispose()
    dracoLoader = null
  }

  return { dispose }
}
