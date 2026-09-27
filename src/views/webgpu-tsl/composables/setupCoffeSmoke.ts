import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { ShallowRef } from 'vue'
import { Fn,max, min, mul,oneMinus, mx_noise_float, mx_noise_vec3, positionLocal, rotate, time, uv, vec2, vec3,sin } from 'three/tsl'

export interface CoffeeSmokeOptions {
  scene: ShallowRef<THREE.Scene | null>
  camera: ShallowRef<THREE.Camera | null>
  renderer: ShallowRef<THREE.WebGPURenderer | null>
  controls: ShallowRef<OrbitControls | null>
}

/** 与泵站一致：Draco 解码器放在 public/draco/gltf */
const DRACO_DECODER_PATH = '/draco/gltf/'

/** Journey 咖啡烟雾烘焙模型，放在 public/model/others/bakedModel.glb */
const BAKED_MODEL_URL = 'model/others/bakedModel.glb'

/**
 * 咖啡烟雾场景：按泵站方式用 GLTFLoader + Draco 加载 baked 模型。
 */
export async function setupCoffeSmoke(
  options: CoffeeSmokeOptions,
): Promise<{ dispose: () => void } | null> {
  const { scene } = options
  if (!scene.value) {
    console.error('[setupCoffeSmoke] scene is not ready')
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

  /** 与 useStationModels.loadModels 同套路：loadAsync → 命名 → 挂到 root */
  const loadBakedModel = async (): Promise<void> => {
    const loader = createGltfLoader()
    const gltf = await loader.loadAsync(BAKED_MODEL_URL)
    const modelName = 'bakedModel'
    gltf.scene.name = modelName

    // Journey：提高 baked 贴图各向异性过滤
    const baked = gltf.scene.getObjectByName('baked')
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

  const loadSmoke=()=>{
    const geometry = new THREE.PlaneGeometry(1.5, 5, 64, 64)
    const material = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      transparent:true,
      // wireframe: true,
      wireframe: false,
      color: 0x7e583a
    })
    const plane = new THREE.Mesh(geometry, material)
    plane.position.set(0, 4.5, 0)
    root.add(plane)

    const getNewPosition = Fn(() => {
      const newPosition = positionLocal.toVar()

      //twist
      const angle=time.mul(0.3).sub(positionLocal.y)
      newPosition.xz.assign(rotate(positionLocal.xz,angle))

      //wind
      const wind = mx_noise_vec3(newPosition.sub(vec3(0,time.mul(0.1),0))).mul(0.4)
      wind.assign(
        wind.mul(
          uv().y.mul(2)
        )
      )
      newPosition.addAssign(wind)

      return newPosition
    })

    material.positionNode = getNewPosition()
    // material.positionNode = Fn(() =>
    // {
    //   const newPosition = positionLocal.toVar()
    //
    //   // Twist
    //   const angle = positionLocal.y
    //     .mul(0.3)
    //     .sub(time.mul(0.2))
    //     .sin()
    //     .mul(3)
    //   // newPosition.xz.assign(rotate(newPosition.xz, angle))
    //
    //   // Wind
    //   //time是场景跑起来之后的已过秒数（大约从 0 往上加），不是 Unix 时间戳。会一直增大。
    //   const windCoordinates = newPosition.sub(vec3(0, time.mul(0.3), 0)).mul(0.4)
    //   const windStrength = uv().y.mul(5)
    //   //输入坐标在动，输出是噪声场在该点的值，大约在 [-1, 1] 里跳，不是跟着输入 y 单调递减。
    //   const wind = mx_noise_vec3(windCoordinates).mul(windStrength)
    //   //根部 uv.y ≈ 0，风力约 0，y 几乎不动；越往上 uv.y 越大，xyz（含 y）晃得越厉害。
    //   newPosition.addAssign(wind)
    //
    //   return newPosition
    // })()

    const smokeNoise = mx_noise_float(
      uv().
      mul(3,2).
      sub(vec2(0,time.mul(0.1)))
    )
    // material.opacityNode=smokeNoise

    // const edgeFade=min(
    //   uv().y.mul(10).clamp(0,1),
    //   uv().y.oneMinus(),
    //   uv().x.mul(5).clamp(0,1),
    //   uv().x.oneMinus().mul(5).clamp(0,1)
    // )
    const edgeFade=min(
      uv().y.mul(10),
      uv().y.oneMinus(),
      uv().x.mul(5),
      uv().x.oneMinus().mul(5)
    )

    material.opacityNode= edgeFade.mul(smokeNoise).clamp(0,1)
  }

  try {
    await loadBakedModel()
    //上面model加载失败就不会执行loadSmoke()
    loadSmoke()
  } catch (error) {
    console.error('[setupCoffeSmoke] failed to load bakedModel', {
      url: BAKED_MODEL_URL,
      error,
    })
  }


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
