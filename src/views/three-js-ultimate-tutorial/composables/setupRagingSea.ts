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
  materialEmissive,
  pass,
  uv,
  int,
  positionViewDirection,
  lessThanEqual,
  select,
  mx_noise_float,
  mx_noise_vec3,
  varying,
  remap,
  add,
  pow,
  color,
  dot,
  toVar,
  float,
  subAssign,
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
export async function setupRagingSea(
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

  const ragingSea = {
    mesh: null,
    options: {
      biggestWave: {
        //数字自动转成float，uniform(3, 'int') 需要整数（否则 3 也常被当 float）
        uStrength: uniform(0.2),
        uFrequency: uniform(vec2(4, 1.5)),
        uSpeed: uniform(0.75),
      },
      smallWave: {
        uStrength: uniform(0.15),
        uFrequency: uniform(3),
        uSpeed: uniform(0.2),
        iterations: uniform(4),
      },
      color:{
        // surface:color('#9bd8ff'),
        surface:uniform(color('#9bd8ff')),
        depth:uniform(color('#5c9ec1')),
        offset:uniform(0.08),
        multiplier:uniform(5)
      }
    },
  }
  const loadRagingSea = () => {
    const ragingSeaMaterial = new THREE.MeshBasicNodeMaterial({
      // color: 0xffffff,
      side: THREE.DoubleSide,
    })
    const ragingSeaGeometry = new THREE.PlaneGeometry(8, 8, 512, 512) // widthSegments, heightSegments
    //旋转geometry就不会改变其局部坐标轴的方向，其本来就和世界坐标轴方向一致
    ragingSeaGeometry.rotateX(-Math.PI * 0.5)
    ragingSea.mesh = new THREE.Mesh(
      ragingSeaGeometry,
      ragingSeaMaterial,
      // new THREE.RawShaderMaterial({
      // new THREE.ShaderMaterial({
      //   vertexShader: vertexShader,
      //   fragmentShader: fragmentShader,
      //   uniforms: {
      //     uFrequency: { value: new THREE.Vector2(10, 5) },
      //     uTime: { value: 0 },
      //     uColor: { value: new THREE.Color('orange') },
      //     uTexture: { value: ragingSeaTexture },
      //   },
      // }),
    )
    //mesh旋转后，局部坐标的坐标轴方向和世界坐标的就不一样了，原本是一样的
    // ragingSea.mesh.rotation.x = -Math.PI * 0.5
    root.add(ragingSea.mesh)

    // Fn(() => { ... })   // ① 用 JS 回调「定义」一个 TSL 函数，返回的是可调用的 Fn 节点
    // ()                  // ② 再调用它，才真正搭出要赋给 positionNode 的节点图
    // 类比普通 JS：
    //
    // const f = () => 1 + 2   // 定义，还没算
    // f()                     // 执行，得到 3
    const elevation = varying(float(0))
    ragingSeaMaterial.positionNode = Fn(() => {
      //positionLocal 是只读属性节点（顶点局部坐标），不是可改的 Vector3。
      const position = positionLocal.toVar()
      const elevationX = sin(
        position.x
          .mul(ragingSea.options.biggestWave.uFrequency.x)
          .add(time.mul(ragingSea.options.biggestWave.uSpeed)),
      )

      const elevationZ = sin(
        position.z
          .mul(ragingSea.options.biggestWave.uFrequency.y)
          .add(time.mul(ragingSea.options.biggestWave.uSpeed)),
      )

      elevation.assign(elevationX.mul(elevationZ).mul(ragingSea.options.biggestWave.uStrength))

      //mx_noise_float 大致在 [-1, 1]（和 Perlin 一类）
      //mx_noise_float 都能接：float / vec2 / vec3（1D / 2D / 3D 噪声）。
      //x 不动，噪声场沿 z 滑动。 可以，等于浪往一个方向走；想斜向漂就写成 vec2(time.mul(a), time.mul(b))。
      Loop(
        {
          start: float(1), //别在算高度的公式里混用两套类型。
          end: ragingSea.options.smallWave.iterations,
          type: 'float',
          condition: '<=',
          name: 'iX',
        },
        ({ iX }) => {
          elevation.subAssign(
            abs(
              mx_noise_float(
                vec3(
                  position.xz.mul(ragingSea.options.smallWave.uFrequency, iX),
                  time.mul(ragingSea.options.smallWave.uSpeed),
                ),
              )
                .mul(ragingSea.options.smallWave.uStrength)
                .div(iX),
            ),
          )
        },
      )
      //写法	                                                            维度	  观感
      // mx_noise_float(position.xz.sub(vec2(0, time*0.1)))             2D   只沿 z 平移
      // mx_noise_float(position.xz.sub(vec2(time*a, time*b)))          2D   斜向漂,像布在传送带上滑，方向感强、更「有规律」
      // mx_noise_float(vec3(position.xz.mul(freq), time.mul(speed)))   3D   xz 不漂，沿时间轴演变（课程这种），更像水面原地「沸腾 / 演变」，方向感弱
      position.y.addAssign(elevation)
      return position
    })()

    ragingSeaMaterial.colorNode = Fn(() => {
      const mixStrength=elevation
        .add(ragingSea.options.color.offset)
        .mul(ragingSea.options.color.multiplier)
      const ragingSeaColor = mix(ragingSea.options.color.depth,ragingSea.options.color.surface,mixStrength)
      return ragingSeaColor
    })()
  }
  loadRagingSea()

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

    const ragingSeaBiggestWave = inspector.createParameters('RagingSeaBiggestWave')
    ragingSeaBiggestWave
      .add(ragingSea.options.biggestWave.uStrength, 'value', 0, 20, 0.01)
      .name('uStrength')
    ragingSeaBiggestWave
      .add(ragingSea.options.biggestWave.uFrequency.value, 'x', 0, 20, 0.01)
      .name('frequencyX')
    ragingSeaBiggestWave
      .add(ragingSea.options.biggestWave.uFrequency.value, 'y', 0, 20, 0.01)
      .name('frequencyY')
    ragingSeaBiggestWave
      .add(ragingSea.options.biggestWave.uSpeed, 'value', 0, 20, 0.01)
      .name('uSpeed')

    const ragingSeaSmallWave = inspector.createParameters('RagingSeaSmallWave')
    ragingSeaSmallWave
      .add(ragingSea.options.smallWave.uStrength, 'value', 0, 20, 0.01)
      .name('uStrength')
    ragingSeaSmallWave
      .add(ragingSea.options.smallWave.uFrequency, 'value', 0, 20, 0.01)
      .name('uFrequency')
    ragingSeaSmallWave.add(ragingSea.options.smallWave.uSpeed, 'value', 0, 20, 0.01).name('uSpeed')
    ragingSeaSmallWave
      .add(ragingSea.options.smallWave.iterations, 'value', 0, 20, 1)
      .name('iterations')

    const ragingSeaColor = inspector.createParameters('RagingSeaColor')
    ragingSeaColor
      .add(ragingSea.options.color.offset, 'value', 0, 1, 0.01)
      .name('uOffset')
    ragingSeaColor
      .add(ragingSea.options.color.multiplier, 'value', 0, 5, 0.01)
      .name('uMultiplier')
    ragingSeaColor.addColor(ragingSea.options.color.surface, 'value').name('uSurface')
    ragingSeaColor.addColor(ragingSea.options.color.depth, 'value').name('uDepth')
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
