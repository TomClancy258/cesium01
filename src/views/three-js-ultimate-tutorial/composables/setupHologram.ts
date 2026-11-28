import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { ShallowRef } from 'vue'
import {
  Fn,
  max,
  float,
  texture,
  smoothstep,
  cameraPosition,
  select,
  hash,
  step,
  mix,
  addAssign,
  mulAssign,
  negate,
  min,
  frontFacing,
  mul,
  oneMinus,
  mx_noise_float,
  mx_noise_vec3,
  positionLocal,
  rotate,
  normalize,
  normalWorld,
  time,
  uv,
  fwidth,
  dot,
  vec2,
  positionWorld,
  vec3,
  sin,
} from 'three/tsl'

type BeforeRenderHandle = (fn: () => void) => () => void

export interface CoffeeSmokeOptions {
  scene: ShallowRef<THREE.Scene | null>
  camera: ShallowRef<THREE.Camera | null>
  renderer: ShallowRef<THREE.WebGPURenderer | null>
  controls: ShallowRef<OrbitControls | null>
  onBeforeRender: BeforeRenderHandle
}

/** 与泵站一致：Draco 解码器放在 public/draco/gltf */
const DRACO_DECODER_PATH = '/draco/gltf/'

/** Journey 咖啡烟雾烘焙模型，放在 public/model/others/bakedModel.glb */
const SUZANNE_MODEL_URL = 'model/others/suzanne.glb'

/**
 * 咖啡烟雾场景：按泵站方式用 GLTFLoader + Draco 加载 baked 模型。
 */
export async function setupHologram(
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
  root.position.set(0, 2, 0)

  let dracoLoader: DRACOLoader | null = null
  let suzanneScene: THREE.Group | THREE.Object3D | null = null

  const createGltfLoader = (): GLTFLoader => {
    dracoLoader ??= new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    return loader
  }

  let commonMaterial = null
  const getCommonMaterial = () => {
    commonMaterial = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      // color:'white',
    })
  }
  const setCommonMaterial = () => {
    commonMaterial.opacityNode = Fn(() => {
      //就是vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
      const positionFromWorld = positionWorld.toVar()

      //stripe
      const y=positionFromWorld.y.sub(time.mul(0.1)).mul(10)
      //mod(y,1)和y.fract()在y正负数都相同
      const stripe=y.fract()
      const stripeAA=max(fwidth(y),0.002)
      const lightEdge=float(0.9)
      const lineWidth=float(0.5)
      const gradientEdge=lightEdge.sub(lineWidth)
      const lightAlpha=smoothstep(lightEdge,lightEdge.add(stripeAA),stripe).oneMinus()
      const gradientAlpha=smoothstep(gradientEdge,lightEdge,stripe)
      const line=lightAlpha.mul(gradientAlpha)

      //fresnel
      // const positionFromLocal=positionLocal.toVar()
      //cameraPosition是世界坐标
      const viewDirection =positionFromWorld.sub(cameraPosition).normalize()
      // const normalFromWorld=normalWorld.normalize().toVar()
      // normalFromWorld.assign(select(frontFacing,normalFromWorld,normalFromWorld.negate()))
      // const fresnel=dot(viewDirection,normalFromWorld).add(1).pow(2)
      const normalFromWorld=normalWorld.normalize().toVar()
      const fresnel=dot(viewDirection,normalFromWorld).abs().oneMinus().pow(3)

      //falloff
      const falloff = smoothstep(0.2,1.0, fresnel).oneMinus();

      const holographic  = stripe.mul(fresnel);
      holographic.addAssign(fresnel.mul(1.25));  // 额外加一层菲涅尔底光
      holographic.mulAssign(falloff);

      return holographic
      // return line.mul(fresnel).mul(falloff)
      // return min(line,fresnel,falloff).add(fresnel.mul(1.25))
    })()

    commonMaterial.positionNode=Fn(()=>{
      const positionFromLocal=positionLocal.toVar()
      const positionFromWorld=positionWorld.toVar()

      const glitchStrength=float(0.2)
      const glitchSpeed=float(3)
      const glitchFrequency=float(10)
      const glitchTime=positionFromWorld.y
        .mul(glitchFrequency)
        .add(time.mul(glitchSpeed))
      const glitch = sin(glitchTime).add(
        sin(glitchTime.mul(3.45)),
        sin(glitchTime.mul(8.76))
        ).mul(glitchStrength)

      const glitchEdge=float(0.3)
      const isLessThan=step(glitch,glitchEdge)
      // glitch.assign(mix(glitch,0,isLessThan))
      glitch.assign(smoothstep(0.3,1.0,glitch))

      //hash(1) / hash(2) —— 就是一函数，实参相同，返回值相同

      //不加time：hash 只跟 xz/zx 有关：
      // 同一顶点（同一 xz）      方向固定；大小仍随 glitch（sin + y + 时间）变
      // 同一 y、不同 x/z        xz 不同 → hash 不同 → 方向一般也不同
      // 不同帧、同一顶点         方向一直一样，只是被 glitch 放大缩小
      // const glitchX=hash(positionFromWorld.xz).sub(0.5).mul(glitch) //xz相同，y不同的点的hash值相同
      // const glitchZ=hash(positionFromWorld.zx).sub(0.5).mul(glitch) //xz相同，y不同的点的hash值相同
      //                   或者positionFromWorld.xz.add(非0的随机值)

      //xz平面的顶点hash值各不相同,time只是确保下一帧里，xz平面上的hash值可能不同
      const glitchX=hash(positionFromWorld.xz.add(time)).sub(0.5).mul(glitch)
      const glitchZ=hash(positionFromWorld.zx.add(time)).sub(0.5).mul(glitch)

      //只有 time      → 全顶点的glitchX、glitchZ相同，容易整模乱飞
      // const glitchX=hash(time.add(1)).sub(0.5).mul(glitch)
      // const glitchZ=hash(time.add(2)).sub(0.5).mul(glitch)

      //float random2D(vec2 value){
      //     return fract(sin(dot(value.xy, vec2(12.9898,78.233))) * 43758.5453123);
      // }

      positionFromLocal.xz.addAssign(vec2(glitchX,glitchZ))
      return positionFromLocal
    })()
  }
  getCommonMaterial()
  setCommonMaterial()

  /** 与 useStationModels.loadModels 同套路：loadAsync → 命名 → 挂到 root */
  const loadSuzanneModel = async (): Promise<void> => {
    const loader = createGltfLoader()
    const gltf = await loader.loadAsync(SUZANNE_MODEL_URL)
    const modelName = 'suzanneModel'
    gltf.scene.name = modelName
    suzanneScene = gltf.scene
    suzanneScene.traverse((child) => {
      if (child.isMesh) child.material = commonMaterial
    })

    root.add(gltf.scene)
  }

  let torusKnot=null
  const loadTorusKnot = () => {
    torusKnot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.6, 0.25, 128, 32),
      commonMaterial,
    )
    torusKnot.position.x = 3
    root.add(torusKnot)
  }
  loadTorusKnot()

  let sphere=null
  const loadSphere = () => {
    sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), commonMaterial)
    sphere.position.x = -3
    root.add(sphere)
  }
  loadSphere()

  const rotateEntities=(elapsed:number)=>{
    if (suzanneScene) {
      suzanneScene.rotation.x = -elapsed * 0.1
      suzanneScene.rotation.y = elapsed * 0.2
    }

    if (sphere) {
      sphere.rotation.x = - elapsed * 0.1
      sphere.rotation.y = elapsed * 0.2
    }

    if (torusKnot) {
      torusKnot.rotation.x = - elapsed * 0.1
      torusKnot.rotation.y = elapsed * 0.2
    }
  }

  const timer = new THREE.Timer()
  timer.connect(document)
  const unsubscribeBeforeRender = options.onBeforeRender(() => {
    timer.update()
    const elapsed = timer.getElapsed()

    rotateEntities(elapsed)
  })

  try {
    await loadSuzanneModel()
  } catch (error) {
    console.error('[setupCoffeSmoke] failed to load bakedModel', {
      url: SUZANNE_MODEL_URL,
      error,
    })
  }

  const disposeObject3D = (object: THREE.Object3D): void => {
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.geometry?.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
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
    if (suzanneScene) {
      root.remove(suzanneScene)
      disposeObject3D(suzanneScene)
      suzanneScene = null
    }
    unsubscribeBeforeRender()
    scene.value?.remove(root)
    dracoLoader?.dispose()
    dracoLoader = null
  }

  return { dispose }
}
