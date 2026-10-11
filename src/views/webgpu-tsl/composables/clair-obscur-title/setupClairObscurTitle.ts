import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import type { ShallowRef } from 'vue'
import { createShield, type ShieldInstance } from './anvil'
import {randomSphericalPosition} from "@/utils/threejs-utils.ts"

import {
  materialEmissive, pass, uv,
  positionViewDirection,
  mx_noise_vec3,
  rotate,
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
}

const DRACO_DECODER_PATH = '/draco/gltf/'
const TITLE_URL = '/textures/title/clair-obscur-title.png'
const PETAL_URL = '/textures/flower/petals-alpha-map.png'

/**
 * 护盾演示：createShield 工厂 + 本函数装配场景 / 拾取 / bloom / dispose。
 */
export async function setupClairObscurTitle(
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
    onBeforeRender
  } =
    options
  if (!scene.value || !camera.value || !renderer.value) {
    console.error('[setupGalaxy] scene/camera/renderer is not ready')
    return null
  }

  const threeScene = scene.value
  const threeCamera = camera.value
  const threeRenderer = renderer.value
  const canvas = threeRenderer.domElement

  const root = new THREE.Group()
  root.position.set(1,1,-1)
  root.name = 'shield-demo'
  threeScene.add(root)

  let dracoLoader: DRACOLoader | null = null
  let anvilScene: THREE.Object3D | null = null
  let floorMesh: THREE.Mesh | null = null
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

  const loadTitle = (): void => {
    const floorTexture = textureLoader.load(TITLE_URL)
    floorTexture.colorSpace = THREE.SRGBColorSpace
    floorTexture.wrapS = THREE.RepeatWrapping
    floorTexture.wrapT = THREE.RepeatWrapping

    const floorMaterial = new THREE.MeshStandardNodeMaterial({
      map: floorTexture,
      transparent: true,
      depthWrite: true, //false则不往深度缓冲写
      // side: THREE.DoubleSide,
    })

    floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), floorMaterial)
    // floorMesh.rotation.x = -Math.PI * 0.5
    floorMesh.receiveShadow = true
    floorMesh.renderOrder = -1
    root.add(floorMesh)
  }

  const PETAL_COUNT=3000
  let petal={
    mesh:null,
    uniform:{
      positions:instancedArray(PETAL_COUNT, 'vec3'),
      lives:instancedArray(PETAL_COUNT, 'float'),
      colorA:uniform(color(0xffcda3)),
      colorB:uniform(color(0xff142c)),
      radius:uniform(1,'float')
    }
  }
  const loadPetal=()=>{
// Geometry
    const geometry = new THREE.SphereGeometry(
      1,
      3,
      3,
      Math.PI * 0.4,
      Math.PI * 0.2,
      Math.PI * 0.4,
      Math.PI * 0.2
    )
    // geometry.translate(0, 0, -1)

// Texture
    const petalTexture = textureLoader.load(PETAL_URL)

// Material
    //MeshStandardNodeMaterial:PBR（金属/粗糙），更真、更贵
    //MeshLambertNodeMaterial:漫反射，便宜
    const material = new THREE.MeshLambertNodeMaterial({
      side: THREE.DoubleSide,
      alphaMap: petalTexture, //亮度：白=不透明，黑=透明
      alphaTest: 0.1 //用亮度（灰阶，来自 RGB）当成该片元的 alpha，alpha < 0.1 直接丢弃

      // map: petalTexture,
      // transparent: true,
    })

    petal.mesh = new THREE.Mesh(geometry, material)
    petal.mesh.count = PETAL_COUNT
    petal.mesh.castShadow = true
    petal.mesh.receiveShadow = true
    root.add(petal.mesh)
  }
  loadPetal()

  let initPetalCompute=null
  let petalUpdateCompute=null

  const initPetalMaterial=()=>{
    initPetalCompute = Fn(() => {
      // Buffers
      const position = petal.uniform.positions.element(instanceIndex)
      const life =petal.uniform.lives.element(instanceIndex)

      const spread = randomSphericalPosition(instanceIndex, 1)

      // Position
      position.assign(spread.mul(petal.uniform.radius))
      life.assign(hash(instanceIndex))

    })().compute(PETAL_COUNT)
    threeRenderer.compute(initPetalCompute)

    petalUpdateCompute = Fn(() => {
      // Buffers
      const position = petal.uniform.positions.element(instanceIndex)
      const life =petal.uniform.lives.element(instanceIndex)

      life.addAssign(deltaTime.mul(0.1))

      If(life.greaterThan(1),()=>{
        life.assign(0)
        const spread = randomSphericalPosition(instanceIndex, 1)
        position.assign(spread.mul(petal.uniform.radius))
      })

      // const wind = mx_noise_vec3(
      //   position,
      //   time.mul(0.01)
      // ).mul(0.03)

      const wind = mx_noise_vec3(
        //风场随时间演化
        position.add(time.mul(0.01))
        //几乎不会随时间演化
        // position.add(deltaTime.mul(0.01))
      ).mul(0.003)

      position.addAssign(wind)
    })().compute(PETAL_COUNT)

    //Sprite 只要告诉它「中心在哪」，四边形会绕这个点自动展开，不需要加 positionLocal。
    //Mesh 设「局部顶点positionLocal + 平移」。
    petal.mesh.material.positionNode=Fn(()=>{
      const instancePosition = petal.uniform.positions.element(instanceIndex)

      const life=petal.uniform.lives.element(instanceIndex)
      const scale=min(
        life.remapClamp(0,0.2,0,1),
        life.remapClamp(0.8,1,1,0)
      ).mul(0.5)

      // const scale=min(
      //   life.remap(0,0.2,0,1),
      //   life.remap(0.8,1,1,0)
      // ).clamp(0,1).mul(0.5)

      const scaled = positionLocal.mul(scale)

      // const angle=life.add(time.mul(0.1)).fract().mul(TWO_PI)
      // const angle=hash(instanceIndex.add(2)).add(time.mul(0.1)).fract().mul(TWO_PI)
      const rotation = instancePosition.add(instanceIndex).mul(10)

      //默认顺序：XYZ → 先绕局部 X，再 Y，再 Z
      // const rotated = rotate(scaled, vec3(angle)) // 按需改轴
      const rotated = rotate(scaled, rotation) // 按需改轴
      // const rotated = rotate(scaled, vec3(angle, angle, 0)) // 按需改轴

      // normalLocal.assign(rotate(normalLocal, angle))
      normalLocal.assign(rotate(normalLocal, rotation))

      const translated=rotated.add(instancePosition)
      return translated

      //先缩旋转后移 ✅
      //先移后缩/旋转 ❌，连位移一起被乘，实例会被拉向原点
    })()

    //scaleNode 没用：它主要给 SpriteNodeMaterial，不是普通 Mesh。
    // petal.mesh.material.scaleNode=Fn(()=>{
    //   const life=petal.uniform.lives.element(instanceIndex)
    //   const defaultScale=float(0.1).mul(range(0.5,1))
    //   const scale=defaultScale.mul(life.oneMinus())
    //   return scale
    // })()

    petal.mesh.material.colorNode=Fn(()=>{
      const mixColor=mix(petal.uniform.colorA,petal.uniform.colorB,hash(instanceIndex.add(1)))
      return mixColor
    })()

  }

  loadTitle()
  initPetalMaterial()

  const timer = new THREE.Timer()
  timer.connect(document)

  const unsubscribeBeforeRender = onBeforeRender(() => {
    timer.update()
    //timer.getElapsed() 上次 timer.update() 到这次的间隔（秒）
    const elapsed = timer.getElapsed()
    const deltaTime = Math.min(1 / 30, timer.getDelta())

    threeRenderer.compute(petalUpdateCompute)
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
    unsubscribeBeforeRender()
    if (shield) {
      unregisterObject?.(shield.mesh)
    }

    if (transform) {
      transform.detach()
      threeScene.remove(transform.getHelper())
      transform.dispose()
      transform = null
    }

    if (shield) {
      root.remove(shield.mesh)
      shield.dispose()
      shield = null
    }

    if (floorMesh) {
      root.remove(floorMesh)
      disposeObject3D(floorMesh)
      floorMesh = null
    }

    if (anvilScene) {
      root.remove(anvilScene)
      disposeObject3D(anvilScene)
      anvilScene = null
    }

    threeScene.remove(root)
    dracoLoader?.dispose()
    dracoLoader = null
  }

  return {
    dispose,
  }
}
