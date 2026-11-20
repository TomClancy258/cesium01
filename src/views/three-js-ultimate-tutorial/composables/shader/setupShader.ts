import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import type { ShallowRef } from 'vue'
import type { ShieldInstance } from '../anvil'

// import vertexShader from './vertex.vert?raw'
// import fragmentShader from './fragment.frag?raw'

import { pass } from 'three/tsl'

import {
  materialEmissive, pass, uv,
  positionViewDirection,
  lessThanEqual,
  select,
  varying,
  remap,
  add,
  pow,
  color,
  dot,
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
  vec3 ,
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
export async function setupShader(
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

  const loadFlag = () => {
    const flagTexture = textureLoader.load('/textures/floor/flag/flag-french.jpg')
    flagTexture.colorSpace = THREE.SRGBColorSpace
    flagTexture.wrapS = THREE.RepeatWrapping
    flagTexture.wrapT = THREE.RepeatWrapping
    const flagMaterial = new THREE.MeshBasicNodeMaterial({
      // color: 0xffffff,
      // map:flagTexture,
      side: THREE.DoubleSide,
    })

    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8, 32, 32), // widthSegments, heightSegments
      flagMaterial
      // new THREE.RawShaderMaterial({
      // new THREE.ShaderMaterial({
      //   vertexShader: vertexShader,
      //   fragmentShader: fragmentShader,
      //   uniforms: {
      //     uFrequency: { value: new THREE.Vector2(10, 5) },
      //     uTime: { value: 0 },
      //     uColor: { value: new THREE.Color('orange') },
      //     uTexture: { value: flagTexture },
      //   },
      // }),
    )
    flag.position.y = 4
    flag.position.z = -4
    root.add(flag)

    // Fn(() => { ... })   // ① 用 JS 回调「定义」一个 TSL 函数，返回的是可调用的 Fn 节点
    // ()                  // ② 再调用它，才真正搭出要赋给 positionNode 的节点图
    // 类比普通 JS：
    //
    // const f = () => 1 + 2   // 定义，还没算
    // f()                     // 执行，得到 3
    const flagOption={
      frequency:10,
      strength:0.8
    }
    const elevation = varying(float(0))
    flagMaterial.positionNode=Fn(()=>{
      //positionLocal 是只读属性节点（顶点局部坐标），不是可改的 Vector3。
      const position=positionLocal.toVar()

      const elevationX=sin(
        uv().x
          .mul(flagOption.frequency)
          .add(time.mul(1))
      )
        .mul(flagOption.strength,uv().x)

      const elevationY= sin(
        uv().y
          .mul(flagOption.frequency)
          .add(time.mul(1))
      )
        .mul(flagOption.strength,uv().x)

      elevation.assign(elevationX.add(elevationY))

      //z = X + Y：两列浪叠在同一块布上，高低互相加减
      position.z.addAssign(elevationX)
      position.z.addAssign(elevationY)

      // 加：两列独立波叠在一起（旗子常用）
      // 乘：两列波的乘积调制（图案更怪、振幅更小）

      // position.z.addAssign(elevationX.mul(elevationY))

      position.y.addAssign(
        sin(
          uv().x
            .mul(flagOption.frequency)
            .add(time.mul(1))
        )
          .mul(flagOption.strength,uv().x)
      )

      position.x.addAssign(uv().y)

      return position
    })()

    flagMaterial.colorNode=Fn(()=>{
      const flagColor = texture(flagTexture)
      const elevationMax=float(flagOption.strength).mul(2)
      const elevationMin=elevationMax.mul(-1)

      const shadow=elevation.remap(elevationMin,elevationMax,0,1)
      return flagColor.mul(shadow)
    })()
  }
  loadFlag()

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

  const timer = new THREE.Timer()
  timer.connect(document)

  const unsubscribeBeforeRender = onBeforeRender?.(() => {
    timer.update()
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
