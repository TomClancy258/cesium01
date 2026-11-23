import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { ShallowRef } from 'vue'
import { Fn,max, texture,smoothstep, min, mul,oneMinus, mx_noise_float, mx_noise_vec3, positionLocal, rotate, time, uv, vec2, vec3,sin } from 'three/tsl'

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
export async function setupCoffeeSmoke(
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
  root.position.set(0,-2,0)

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

  const loadSmoke=async ()=>{
    const noiseTexture = await new THREE.TextureLoader().loadAsync('/textures/noise/perlin.png')
    noiseTexture.wrapS = THREE.RepeatWrapping
    noiseTexture.wrapT = THREE.RepeatWrapping

    const geometry = new THREE.PlaneGeometry(1.5, 5, 64, 64)
    const material = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      transparent:true,
      // wireframe: true,
      wireframe: false,
      // depthWrite: false,
      color: 0x7e583a
    })
    const plane = new THREE.Mesh(geometry, material)
    geometry.translate(0, 4.5, 0)
    // plane.position.set(0, 4.5, 0)
    root.add(plane)

    const getPosition = Fn(() => {
      const position = positionLocal.toVar()

      //twist
      const twistSample=texture(
        noiseTexture,
        vec2(0.5,uv().y.sub(time.mul(0.1)).mul(0.2))
      )
      const angle=twistSample.r.mul(15)
      const rotation=rotate(position.xz,angle)
      position.xz.addAssign(rotation)

      //wind
      const windSample1=texture(
        noiseTexture,
        vec2(0.25,uv().y.sub(time.mul(0.1)).mul(0.2))
      )
      const windSample2=texture(
        noiseTexture,
        vec2(0.75,uv().y.sub(time.mul(0.1)).mul(0.2))
      )
      const wind=vec2(windSample1.r,windSample2.r)
        .sub(0.5).mul(2).mul(10).mul(uv().y.pow(2))
      //若只有一个参数，那xz轴方向的相加值相同，则结果只沿着xz轴的对角线移动。
      //这里就得改为x、z轴方向都各自加自己单独的值，就会沿着xz平面移动了
      position.xz.addAssign(wind)

      return position
    })

    material.positionNode = getPosition()

    // material.opacityNode= edgeFade.mul(smokeNoise).clamp(0,1)
    material.opacityNode=Fn(()=>{
      const alphaSample=texture(
        noiseTexture,
        vec2(uv().x.mul(0.5),uv().y.sub(time.mul(0.1)))
      )
      const edge=min(
        smoothstep(0,0.2,uv().x),
        smoothstep(0.8,1.0,uv().x).oneMinus(),
        smoothstep(0,0.2,uv().y),
        smoothstep(0.6,1.0,uv().y).oneMinus(),
      )

      const alpha=alphaSample.r.mul(edge)
      // const alpha=alphaSample.r.smoothstep(0.3,0.6)
      // const alpha=alphaSample.r.pow(3)
      return alpha
    })()
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
