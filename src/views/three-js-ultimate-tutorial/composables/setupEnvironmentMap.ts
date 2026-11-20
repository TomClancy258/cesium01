import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import type { ShallowRef } from 'vue'
import { createShield, type ShieldInstance } from './anvil'
import { randomSphericalPosition } from '@/utils/threejs-utils.ts'

import {
  materialEmissive,
  pass,
  uv,
  positionViewDirection,
  mx_noise_vec3,
  rotate,
  negate,
  instanceIndex,
  lessThanEqual,
  lessThan,
  deltaTime,
  normalLocal,
  mulAssign,
  select,
  addAssign,
  subAssign,
  grayscale,
  If,
  materialColor,
  add,
  greaterThan,
  fract,
  min,
  normalize,
  pow,
  instancedArray,
  range,
  color,
  dot,
  hash,
  toVar,
  float,
  Fn,
  Loop,
  max,
  mix,
  mul,
  div,
  normalView,
  objectPosition,
  positionWorld,
  texture,
  time,
  TWO_PI,
  PI,
  uniform,
  uniformArray,
  vec2,
  vec3,
  vec4,
  fwidth,
  smoothstep,
  sin,
  length,
  clamp,
  abs,
  sub,
  assign,
  distance,
  positionLocal,
  EPSILON,
} from 'three/tsl'

export interface SetupShieldOptions {
  scene: ShallowRef<THREE.Scene | null>
  camera: ShallowRef<THREE.Camera | null>
  renderer: ShallowRef<THREE.WebGPURenderer | null>
  controls: ShallowRef<OrbitControls | null>
  /** bloom 管线时覆盖默认 renderer.render */
  setFrameRender?: (fn: (() => void) | null) => void
  /** 把护盾 mesh 挂到通用拾取列表 */
  registerObject?: (object: THREE.Object3D) => void
  unregisterObject?: (object: THREE.Object3D) => void
  /** TransformControls 拖拽中屏蔽拾取 */
  setPickingBlocked?: (fn: () => boolean) => void
  onBeforeRender?: (cb: () => void) => () => void
}

const DRACO_DECODER_PATH = '/draco/gltf/'
const ANVIL_MODEL_URL = 'model/others/FlightHelmet/glTF/FlightHelmet.gltf'

/**
 * 护盾演示：createShield 工厂 + 本函数装配场景 / 拾取 / bloom / dispose。
 */
export async function setupEnvironmentMap(
  options: SetupShieldOptions,
): Promise<{ dispose: () => void } | null> {
  const {
    scene,
    camera,
    renderer,
    controls,
    setFrameRender,
    registerObject,
    unregisterObject,
    setPickingBlocked,
    onBeforeRender,
  } = options
  if (!scene.value || !camera.value || !renderer.value) {
    console.error('[setupEnvironmentMap] scene/camera/renderer is not ready')
    return null
  }

  const threeScene = scene.value
  const threeCamera = camera.value
  const threeRenderer = renderer.value

  const root = new THREE.Group()
  // root.position.set(2,2,-1)
  root.name = 'environment-map-demo'
  threeScene.add(root)

  let dracoLoader: DRACOLoader | null = null
  let hdrLoader: HDRLoader | null = null
  let helmetScene: THREE.Object3D | null = null
  let shield: ShieldInstance | null = null
  let transform: TransformControls | null = null
  let renderPipeline: InstanceType<typeof THREE.RenderPipeline> | null = null
  const textureLoader = new THREE.TextureLoader()

  let holyDonut: THREE.Mesh | null = null

  const createGltfLoader = (): GLTFLoader => {
    dracoLoader ??= new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    return loader
  }

  const createHDRLoader = (): HDRLoader => {
    hdrLoader = new HDRLoader()
    hdrLoader.load('/environmentMaps/0/blender-light-2k.hdr', (environmentMap) => {
      //告诉 Three：这张图是「全景环境」，拿来当反射/天空，不是一张贴在平面上的普通贴图。
      environmentMap.mapping = THREE.EquirectangularReflectionMapping
      threeScene.background = environmentMap
      threeScene.environment = environmentMap
    })
  }
  // createHDRLoader()

  const loadBackground = async (): void => {
    const environmentMap = await textureLoader.loadAsync(
      '/environmentMaps/blockadesLabsSkybox/interior_views_cozy_wood_cabin_with_cauldron_and_p.jpg',
    )
    // environmentMap.wrapS = THREE.RepeatWrapping
    // environmentMap.wrapT = THREE.RepeatWrapping
    environmentMap.mapping = THREE.EquirectangularReflectionMapping
    environmentMap.colorSpace = THREE.SRGBColorSpace

    // threeScene.environment=environmentMap
    threeScene.background = environmentMap
  }
  await loadBackground()

  const loadTorusKnot = () => {
    const torusKnot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1, 0.4, 100, 16),
      new THREE.MeshStandardMaterial({ roughness: 0, metalness: 1, color: 0xaaaaaa }),
    )
    torusKnot.position.x = -4
    torusKnot.position.y = 4
    root.add(torusKnot)
  }
  loadTorusKnot()

  let intersectionSprite = null
  const initPlane = () => {
    const material = new THREE.SpriteMaterial()
    intersectionSprite = new THREE.Sprite(material)
    intersectionSprite.scale.set(10, 10, 1)
    intersectionSprite.visible = false
    root.add(intersectionSprite)
    registerObject?.(intersectionSprite)
  }
  // initPlane()

  const loadHolyDonut = () => {
    holyDonut = new THREE.Mesh(
      new THREE.TorusGeometry(8, 0.5),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(10, 4, 2) }),
    )
    holyDonut.layers.enable(1)
    holyDonut.position.y = 3.5
    root.add(holyDonut)
  }
  loadHolyDonut()

  let cubeRenderTarget=null
  const loadCubeRenderTarget = (): void => {
    cubeRenderTarget = new THREE.CubeRenderTarget(256, {
      type: THREE.HalfFloatType, // WebGPU 更常用；FloatType 也可试
    })
    //让cubeCamera六个面的摄像结果作为整体的环境反射
    threeScene.environment = cubeRenderTarget.texture
  }
  loadCubeRenderTarget()

  let cubeCamera=null
  const loadCubeCamera=()=>{
    //CubeCamera 内部是 6 个 PerspectiveCamera（+X/-X/+Y/-Y/+Z/-Z），
    // 渲染结果写进 CubeRenderTarget 的六张面，拼成一张立方环境贴图，再赋给 scene.environment 做实时反射。
     cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget)
    //默认在 世界原点 (0,0,0)
    // cubeCamera.position.set(0, 3.5, 0)
    cubeCamera.layers.set(1)//只有layers.enable(1)的才会被cubeCamera所拍摄进去
  }
  loadCubeCamera()

  const loadHelmet = async (): Promise<void> => {
    const gltf = await createGltfLoader().loadAsync(ANVIL_MODEL_URL)
    gltf.scene.name = 'anvil'
    gltf.scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        if (!material) return
        if ('emissiveNode' in material) {
          ;(material as THREE.MeshStandardNodeMaterial).emissiveNode = materialEmissive.add(
            shield!.junctionNode,
          )
        }
        if ('map' in material && material.map instanceof THREE.Texture) {
          material.map.anisotropy = 8
        }
      })
    })
    helmetScene = gltf.scene
    helmetScene.scale.set(5, 5, 5)
    // helmetScene.position.set(0, -2.5, 0)
    helmetScene.position.set(0, 2.5, 0)
    root.add(gltf.scene)
    registerObject?.(helmetScene)
  }

  const envMap = {
    intensity: 3,
  }

  /**
   * WebGPU / NodeMaterial：材质没有自己的 envMap 时，
   * 着色器用的是 scene.environmentIntensity，不是 material.envMapIntensity。
   */
  const updateMaterials = (intensity: number): void => {
    threeScene.environmentIntensity = intensity
  }

  // 必须等头盔进场景后再刷；否则 traverse 时还没有那些 Mesh
  await loadHelmet()
  // updateMaterials()

  // threeScene.backgroundBlurriness=0.2
  // threeScene.backgroundIntensity=5

  const rotateHolyDonut = (elapsedTime) => {
    if (!holyDonut||!cubeCamera) {
      return
    }
    holyDonut.rotation.x = Math.sin(elapsedTime) * 2
    cubeCamera.update(threeRenderer, threeScene)
  }

  const timer = new THREE.Timer()
  timer.connect(document)

  const unsubscribeBeforeRender = onBeforeRender?.(() => {
    timer.update()
    //总时长
    const elapsed = timer.getElapsed()
    //timer.getDelta()= 上次 timer.update() 到这次的间隔（秒）
    const deltaTime = Math.min(1 / 30, timer.getDelta())

    rotateHolyDonut(elapsed)
  })

  // Bloom 后处理
  renderPipeline = new THREE.RenderPipeline(threeRenderer)
  const scenePass = pass(threeScene, threeCamera)
  const scenePassColor = scenePass.getTextureNode('output')
  const bloomPass = bloom(scenePassColor)
  bloomPass.threshold.value = 0
  bloomPass.strength.value = 0.05
  renderPipeline.outputNode = scenePassColor.add(bloomPass)
  setFrameRender?.(() => {
    renderPipeline?.render()
  })

  const inspector = threeRenderer.inspector
  if (inspector?.createParameters) {
    const bloomGui = inspector.createParameters('Bloom')
    bloomGui.add(bloomPass.threshold, 'value', 0, 2, 0.01).name('threshold')
    bloomGui.add(bloomPass.strength, 'value', 0, 2, 0.01).name('strength')

    const envMapGui = inspector.createParameters('EnvMap')
    envMapGui.add(envMap, 'intensity', 0, 10, 0.1).name('intensity').onChange(updateMaterials)
  }

  const disposeObject3D = (object: THREE.Object3D): void => {
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.geometry?.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        if (!material) return
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
    unsubscribeBeforeRender?.()
    if (shield) {
      unregisterObject?.(shield.mesh)
    }

    if (transform) {
      transform.detach()
      threeScene.remove(transform.getHelper())
      transform.dispose()
      transform = null
    }

    if (helmetScene) {
      unregisterObject?.(helmetScene)
      root.remove(helmetScene)
      disposeObject3D(helmetScene)
      helmetScene = null
    }

    threeScene.remove(root)
    dracoLoader?.dispose()
    dracoLoader = null
  }

  return {
    dispose,
  }
}
