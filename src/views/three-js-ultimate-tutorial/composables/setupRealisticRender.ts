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
export async function setupRealisticRender(
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

  const createGltfLoader = (): GLTFLoader => {
    dracoLoader ??= new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    return loader
  }

  const createHDRLoader = (): HDRLoader => {
    hdrLoader = new HDRLoader()
    hdrLoader.load('/environmentMaps/0/2k.hdr', (environmentMap) => {
      //告诉 Three：这张图是「全景环境」，拿来当反射/天空，不是一张贴在平面上的普通贴图。
      environmentMap.mapping = THREE.EquirectangularReflectionMapping
      threeScene.background = environmentMap
      threeScene.environment = environmentMap
    })
  }
  createHDRLoader()

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
  // await loadBackground()

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

  const loadFloor=()=>{
    const floorColorTexture = textureLoader.load('/textures/floor/wood_cabinet_worn_long/wood_cabinet_worn_long_diff_1k.jpg')
    const floorNormalTexture = textureLoader.load('/textures/floor/wood_cabinet_worn_long/wood_cabinet_worn_long_nor_gl_1k.png')
    const floorAORoughnessMetalnessTexture = textureLoader.load('/textures/floor/wood_cabinet_worn_long/wood_cabinet_worn_long_arm_1k.jpg')

    floorColorTexture.colorSpace = THREE.SRGBColorSpace

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshStandardMaterial({
        map: floorColorTexture,
        //法线和 AO 做的不是同一件事。 法线改的是「光怎么打在表面上」，AO 改的是「缝里该固有多暗」。
        //没有方向光时：normalMap：几乎看不出凹凸    aoMap：仍能靠环境光/IBL 把缝压暗，不随灯光变化
        normalMap: floorNormalTexture,
        //AO = Ambient Occlusion（环境光遮蔽）。
        //一张（多为灰阶）贴图，标出缝隙、夹角、凹陷里该多暗——比如砖缝、模型凹处。
        aoMap: floorAORoughnessMetalnessTexture,
        roughnessMap: floorAORoughnessMetalnessTexture,
        metalnessMap: floorAORoughnessMetalnessTexture,
      })
    )
    floor.rotation.x = - Math.PI * 0.5
    floor.receiveShadow=true
    root.add(floor)
  }
  loadFloor()

  const loadWall=()=>{
    const wallColorTexture = textureLoader.load('/textures/floor/castle_brick_broken_06/castle_brick_broken_06_diff_1k.jpg')
    const wallNormalTexture = textureLoader.load('/textures/floor/castle_brick_broken_06/castle_brick_broken_06_nor_gl_1k.png')
    const wallAORoughnessMetalnessTexture = textureLoader.load('/textures/floor/castle_brick_broken_06/castle_brick_broken_06_arm_1k.jpg')

    wallColorTexture.colorSpace = THREE.SRGBColorSpace

    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshStandardMaterial({
        map: wallColorTexture,
        normalMap: wallNormalTexture,
        aoMap: wallAORoughnessMetalnessTexture,
        roughnessMap: wallAORoughnessMetalnessTexture,
        metalnessMap: wallAORoughnessMetalnessTexture,
      })
    )
    wall.position.y = 4
    wall.position.z = - 4
    wall.receiveShadow=true
    root.add(wall)
  }
  loadWall()

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
    // helmetScene.position.set(0, 2.5, 0)
    root.add(gltf.scene)
    registerObject?.(helmetScene)
  }

  let hamburgerScene: THREE.Object3D | null = null
  const loadHamburgerModel = async (): Promise<void> => {
    const gltf = await createGltfLoader().loadAsync('model/others/hamburger.glb')
    gltf.scene.name = 'anvil'
    gltf.scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material]
      materials.forEach((material) => {
        if (!material) return
        if ('emissiveNode' in material) {
          ;(material as THREE.MeshStandardNodeMaterial).emissiveNode =
            materialEmissive.add(shield!.junctionNode)
        }
        if ('map' in material && material.map instanceof THREE.Texture) {
          material.map.anisotropy = 8
        }
      })
    })
    hamburgerScene = gltf.scene
    hamburgerScene.scale.set(0.1,0.1,0.1)
    hamburgerScene.position.set(2.5,0,2.5)
    root.add(gltf.scene)
  }
  try {
    await loadHamburgerModel()
  } catch (error) {
    console.error('[setupGalaxy] failed to load anvil', { url: ANVIL_MODEL_URL, error })
  }

  const envMap = {
    intensity: 1,
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

  let directionalLight=null
  const loadDirectionLight=()=>{
    directionalLight = new THREE.DirectionalLight('#ffffff', 6)
    directionalLight.position.set(- 4, 6.5, 2.5)
    directionalLight.target.position.set(0, 4, 0)
    //castShadow = true 不是为了“光能亮”，是为了让渲染器去维护 shadow.camera。
    directionalLight.castShadow = true

    //-------------------------------------------------
    directionalLight.shadow.camera.far = 15
    directionalLight.shadow.mapSize.set(512,512)

    directionalLight.shadow.normalBias = 0.027
    directionalLight.shadow.bias = - 0.004
    //-------------------------------------------------

    // directionalLight.shadow.mapSize.set(4096,4096)
    // directionalLight.target.updateWorldMatrix()
    threeScene.add(directionalLight)
    threeScene.add(directionalLight.target)
    //DirectionalLightHelper 只管光照示意；阴影裁大了、裁小了、物体在影子外，要看 CameraHelper
    // const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight,5);
    // threeScene.add(directionalLightHelper);

    const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
    threeScene.add(directionalLightCameraHelper)

    // 每帧或改完光之后
    // directionalLightCameraHelper.update()
  }
  loadDirectionLight()


  // threeScene.backgroundBlurriness=0.2
  // threeScene.backgroundIntensity=5

  const timer = new THREE.Timer()
  timer.connect(document)

  const unsubscribeBeforeRender = onBeforeRender?.(() => {
    timer.update()
    //总时长
    const elapsed = timer.getElapsed()
    //timer.getDelta()= 上次 timer.update() 到这次的间隔（秒）
    const deltaTime = Math.min(1 / 30, timer.getDelta())

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

    const directionalLightGui = inspector.createParameters('DirectionalLight')
    directionalLightGui.add(directionalLight, 'intensity', 0, 10, 0.1).name('intensity')
    directionalLightGui.add(directionalLight.position, 'x',-10,10,0.01).name('lightX')
    directionalLightGui.add(directionalLight.position, 'y',-10,10,0.01).name('lightY')
    directionalLightGui.add(directionalLight.position, 'z',-10,10,0.01).name('lightZ')

    directionalLightGui.add(directionalLight, 'castShadow')
    directionalLightGui.add(directionalLight.shadow, 'normalBias',- 0.05,0.05,0.001)
    directionalLightGui.add(directionalLight.shadow, 'bias',- 0.05,0.05,0.001)
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
//UV 是贴在每个顶点上的二维坐标，用来在三角形上插值后去贴图上采样。
