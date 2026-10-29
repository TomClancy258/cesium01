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
  instancedBufferAttribute ,
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
const TITLE_URL = '/textures/title/clair-obscur-title.png'
const PETAL_URL = '/textures/flower/petals-alpha-map.png'

/**
 * 护盾演示：createShield 工厂 + 本函数装配场景 / 拾取 / bloom / dispose。
 */
export async function setupGalaxy(
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
  root.position.set(1,1,1)
  root.name = 'shield-demo'
  threeScene.add(root)

  let dracoLoader: DRACOLoader | null = null
  let anvilScene: THREE.Object3D | null = null
  let titleMesh: THREE.Mesh | null = null
  let shield: ShieldInstance | null = null
  let transform: TransformControls | null = null
  let renderPipeline: InstanceType<typeof THREE.RenderPipeline> | null = null
  const textureLoader = new THREE.TextureLoader()
  let gltfLoader: GLTFLoader | null = null

  const getGltfLoader = (): GLTFLoader => {
    if (gltfLoader) return gltfLoader
    // 空值合并赋值：只有左边是 null 或 undefined 时，才赋右边
    dracoLoader ??= new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)
    gltfLoader = new GLTFLoader()
    gltfLoader.setDRACOLoader(dracoLoader)
    return gltfLoader
  }

  const galaxy = {
    count: 100000,
    size: 0.02,
    radius: 5,
    branches: 3,
    spin:2,
    randomness:0.2,
    randomnessPower:3,
    innerColor:new THREE.Color('#ff6030'),
    outerColor:new THREE.Color('#1b3984'),
  }

  let points: THREE.Points | null = null

  const loadPoints = (): void => {
    const positions = new Float32Array(galaxy.count * 3)
    const colors = new Float32Array(galaxy.count * 3)

    for (let i = 0; i < galaxy.count; i++) {
      const i3 = i * 3
      const branchAngle =
        ((i % galaxy.branches) / galaxy.branches) * Math.PI * 2
      const radius = Math.random() * galaxy.radius
      const radius01=radius/galaxy.radius

      // const spinAngle=galaxy.spin*radius
      const spinAngle=galaxy.spin*radius-Math.pow(radius01,2)*3

      // const flare = 0.3 // 0=均匀缠绕，越大外缘越开
      // const spinAngle = galaxy.spin * radius * (1 - flare * radius01)

      // const randomX=Math.pow((Math.random()-0.5)*2,3)*galaxy.randomness*radius
      // const randomY=Math.pow((Math.random()-0.5)*2,3)*galaxy.randomness*radius
      // const randomZ=Math.pow((Math.random()-0.5)*2,3)*galaxy.randomness*radius

      const randomX=Math.pow(Math.random(),galaxy.randomnessPower)*(Math.random()>0.5?1:-1)*galaxy.randomness*radius
      const randomY=Math.pow(Math.random(),galaxy.randomnessPower)*(Math.random()>0.5?1:-1)*galaxy.randomness*radius
      const randomZ=Math.pow(Math.random(),galaxy.randomnessPower)*(Math.random()>0.5?1:-1)*galaxy.randomness*radius

      positions[i3] = Math.cos(branchAngle+spinAngle) * radius+randomX
      positions[i3 + 1] = randomY
      positions[i3 + 2] = Math.sin(branchAngle+spinAngle) * radius+randomZ

      const mixedColor = galaxy.innerColor.clone()
      mixedColor.lerp(galaxy.outerColor, radius / galaxy.radius)

      colors[i3]=mixedColor.r
      colors[i3+1]=mixedColor.g
      colors[i3+2]=mixedColor.b
    }

    //Sprite没有下面这些
    // const geometry = new THREE.BufferGeometry()
    // geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    //要「动起来」，更推荐 TSL；InstancedBufferAttribute 更适合静态或只当种子数据。
    const positionAttribute = new THREE.InstancedBufferAttribute(positions, 3)
    const colorAttribute = new THREE.InstancedBufferAttribute(colors, 3)

    //画「粒子点云」用 PointsNodeMaterial（继承于后者）；普通单个广告牌用 SpriteNodeMaterial
    //SpriteNodeMaterial  →  通用 Sprite（一张朝向相机的图）
    //        ↑
    // PointsNodeMaterial  →  当「有大小的点」用（再加 sizeNode）
    const material = new THREE.PointsNodeMaterial({
      size: galaxy.size,
      positionNode: instancedBufferAttribute(positionAttribute),
      colorNode: instancedBufferAttribute(colorAttribute),
      sizeAttenuation: true,
      depthWrite: false,
    })

    const sprite = new THREE.Sprite(material)
    sprite.count = positionAttribute.count
    root.add(sprite)
  }
  loadPoints()

  const timer = new THREE.Timer()
  timer.connect(document)

  const unsubscribeBeforeRender = onBeforeRender(() => {
    timer.update()
    //timer.getElapsed() 上次 timer.update() 到这次的间隔（秒）
    const elapsed = timer.getElapsed()
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

    if (titleMesh) {
      root.remove(titleMesh)
      disposeObject3D(titleMesh)
      titleMesh = null
    }

    if (points) {
      root.remove(points)
      points.geometry.dispose()
      ;(points.material as THREE.Material).dispose()
      points = null
    }

    threeScene.remove(root)
    dracoLoader?.dispose()
    dracoLoader = null
  }

  return {
    dispose,
  }
}
