import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { SkyMesh } from 'three/addons/objects/SkyMesh.js'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import { chromaticAberration } from 'three/addons/tsl/display/ChromaticAberrationNode.js'
import { fxaa } from 'three/addons/tsl/display/FXAANode.js'
import { pixelationPass } from 'three/addons/tsl/display/PixelationPassNode.js'
import { sobel } from 'three/addons/tsl/display/SobelOperatorNode.js'
import type { ShallowRef } from 'vue'
import {
  texture,
  renderOutput,
  uniform,
  color,
  convertToTexture,
  normalWorld,
  output,
  mrt,
  float,
  pass,
  Fn,
  max,
  min,
  mul,
  oneMinus,
  mx_noise_float,
  mx_noise_vec3,
  positionLocal,
  rotate,
  time,
  uv,
  vec2,
  vec3,
  vec4,
  sin,
} from 'three/tsl'
import { shatter } from '@/views/webgpu-tsl/composables/post-processing/ShatterNode02'

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
  root.name = 'post-processing'
  scene.value.add(root)
  root.position.set(0, 1, 0)

  let dracoLoader: DRACOLoader | null = null
  let bakedScene: THREE.Group | THREE.Object3D | null = null

  const createGltfLoader = (): GLTFLoader => {
    dracoLoader ??= new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    return loader
  }

  const loadFloor = () => {
    const floorTexture = new THREE.TextureLoader().load('/textures/floor/floor-color.jpg')
    floorTexture.colorSpace = THREE.SRGBColorSpace
    floorTexture.wrapS = THREE.RepeatWrapping
    floorTexture.wrapT = THREE.RepeatWrapping

    // transparent: true 后 opacity / opacityNode 才会混合；否则 alpha 被忽略
    const floorMaterial = new THREE.MeshStandardNodeMaterial({
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
    // floor.material.mrtNode = mrt({
    //   output: output,
    //   normal: vec4(1)
    // })

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
      const materials = Array.isArray(baked.material) ? baked.material : [baked.material]
      materials.forEach((material) => {
        if (material && 'map' in material && material.map instanceof THREE.Texture) {
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

  const sky = new SkyMesh()
  sky.scale.setScalar(1000)
  // scene.value.add(sky)

  const postProcessing01 = (): void => {
    //自定义管线
    renderPipeline = new THREE.RenderPipeline(renderer.value!)
    renderPipeline.outputColorTransform = false

    const inspector = renderer.value!.inspector
     const postProcessingGui= inspector.createParameters('Post processing')

    const scenePass = pass(scene.value!, camera.value!)
    scenePass.setMRT(
      mrt({
        output, // 美颜/颜色缓冲
        normal: normalWorld, // 世界法线缓冲
      }),
    )
    //字符串 'output' 对应 mrt 里的 output 键；shatter 前必须先接场景，否则吃到默认纯蓝
    const beauty = scenePass.getTextureNode('output')
    renderPipeline.outputNode = beauty

    // // Pixelation pass
    //     const pixelationPassOutput = pixelationPass(scene.value!, camera.value!, 5, 2, 1)
    //     renderPipeline.outputNode = pixelationPassOutput

    // // Chromatic aberration pass
    //叠加上一个pass
    // const chromaticAberrationPass = chromaticAberration(renderPipeline.outputNode, 2, vec2(0.5), 1)
    //不叠加
    // const chromaticAberrationPass = chromaticAberration(scenePass, 2, vec2(0.5), 1)
    // renderPipeline.outputNode = chromaticAberrationPass

    // // Sobel pass
    //remapClamp(0.2, 1, 0, 1) ：滤掉很淡的线，只留较强边缘，并保证在 0～1。
    //输入里 < 0.2 → 映射后当 0（弱边缘压掉）
    // 0.2 → 1 → 线性拉到 0 → 1
    // > 1 → 夹在 1
    // const sobelPass = sobel(scenePass.getTextureNode('normal')).remapClamp(0.2, 1, 0, 1)
    // renderPipeline.outputNode = beauty.add(sobelPass)

    // // Drunk
    // const drunkTexture = convertToTexture(scenePass)
    // const waveUv = vec2(uv().x, uv().y.add(uv().x.add(time.mul(0.2)).mul(7).sin().mul(0.1)))
    // renderPipeline.outputNode = texture(drunkTexture, waveUv).mul(color('aquamarine'))

    const subdivision = uniform(3)
    const seed = uniform(18, 'int')
    // uniform(x)  JS 里不管 18 还是 0.5，typeof 都是 'number'，TSL 一律推成 float
    const progress = uniform(0.5)
    const thickness = uniform(0.02)
    const _color = uniform(color(0xff824d))
    const colorStrength = uniform(3)
    const offsetStrength = uniform(0.05)
    const shatterPass = shatter(
      renderPipeline.outputNode,
      subdivision,
      seed,
      progress,
      thickness,
      _color,
      colorStrength,
      offsetStrength,
    )
    renderPipeline.outputNode = shatterPass

    const shatterGui = postProcessingGui.addFolder('shatter')
    shatterGui.add(subdivision, 'value', 1, 10, 1).name('subdivision')
    shatterGui.add(seed, 'value', 0, 100, 1).name('seed')
    shatterGui.add(progress, 'value', 0, 1, 0.001).name('progress')
    shatterGui.add(thickness, 'value', 0, 0.05, 0.0001).name('thickness')
    shatterGui.addColor(_color, 'value') .name('color')
    shatterGui.add(colorStrength, 'value', 1, 10, 0.01).name('colorStrength')
    shatterGui.add(offsetStrength, 'value', 0, 0.2, 0.0001).name('offsetStrength')


    // Bloom pass
    const bloomPass = bloom(renderPipeline.outputNode)
    bloomPass.threshold.value = 0.25
    bloomPass.strength.value = 1
    //// ② 原图 + bloom
    renderPipeline.outputNode = renderPipeline.outputNode.add(bloomPass)

    const bloomGui = postProcessingGui.addFolder('bloom')
    bloomGui.add(bloomPass.threshold, 'value', 0, 2, 0.01).name('threshold')
    bloomGui.add(bloomPass.strength, 'value', 0, 2, 0.01).name('strength')

// Color transform pass
    // ③: 对 ② 做 tone/色彩
    renderPipeline.outputNode = renderOutput(renderPipeline.outputNode)

// FXAA pass
    //// ④: 对 ③ 做抗锯齿
    const fxaaPass = fxaa(renderPipeline.outputNode)
    // 最终输出 = ④
    renderPipeline.outputNode = fxaaPass

    setFrameRender?.(() => {
      renderPipeline?.render()
    })
  }
  postProcessing01()

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
