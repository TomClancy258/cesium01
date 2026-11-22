import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import type { ShallowRef } from 'vue'
import { Pane } from 'tweakpane'
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
  varying,
  vertexIndex,
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
  attribute,
  Loop,
  max,
  mix,
  mul,
  uint,
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
  cos,
  length,
  clamp,
  abs,
  sub,
  assign,
  distance,
  random,
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
export async function setupAnimatedGalaxy(
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
    count: uniform(100000),
    size: 0.1,
    radius: uniform(5),
    branches: uniform(3),
    spin:uniform(2),
    randomness:uniform(0.2),
    randomnessPower:uniform(3),
    innerColor:uniform(color('#ff6030')),
    outerColor:uniform(color('#1b3984')),
  }

  let points: THREE.Points | null = null
  const generateGalaxy = (): void => {
    if (points) {
      root.remove(points)
      ;(points.material as THREE.Material).dispose() // 够了
      points = null
    }
    const galaxyCount=galaxy.count.value
    const positions = new Float32Array(galaxyCount * 3)
    // const colors = new Float32Array(galaxy.count * 3)
    // const scales = new Float32Array(galaxy.count)
    // const randomness = new Float32Array(galaxy.count*3)
    // const branchAngles = new Float32Array(galaxy.count)
    // const radius01s = new Float32Array(galaxy.count)

    // for (let i = 0; i < galaxy.count; i++) {
    //   const i3 = i * 3
      // const branchAngle =
      //   ((i % galaxy.branches) / galaxy.branches) * Math.PI * 2
      // const radius = Math.random() * galaxy.radius
      // const radius = i/galaxy.count * galaxy.radius
      // const radius01=radius/galaxy.radius

      // const spinAngle=galaxy.spin*radius
      // const spinAngle=galaxy.spin*radius-Math.pow(radius01,2)*3

      // const flare = 0.3 // 0=均匀缠绕，越大外缘越开
      // const spinAngle = galaxy.spin * radius * (1 - flare * radius01)

      // const randomX=Math.pow((Math.random()-0.5)*2,3)*galaxy.randomness*radius
      // const randomY=Math.pow((Math.random()-0.5)*2,3)*galaxy.randomness*radius
      // const randomZ=Math.pow((Math.random()-0.5)*2,3)*galaxy.randomness*radius

      // const randomX=Math.pow(Math.random(),galaxy.randomnessPower)*(Math.random()>0.5?1:-1)*galaxy.randomness*radius
      // const randomY=Math.pow(Math.random(),galaxy.randomnessPower)*(Math.random()>0.5?1:-1)*galaxy.randomness*radius
      // const randomZ=Math.pow(Math.random(),galaxy.randomnessPower)*(Math.random()>0.5?1:-1)*galaxy.randomness*radius

      // positions[i3] = Math.cos(branchAngle+spinAngle) * radius+randomX
      // positions[i3 + 1] = randomY
      // positions[i3 + 2] = Math.sin(branchAngle+spinAngle) * radius+randomZ

      // randomness[i3]=randomX
      // randomness[i3+1]=randomY
      // randomness[i3+2]=randomZ

      // const mixedColor = galaxy.innerColor.clone()
      // mixedColor.lerp(galaxy.outerColor, radius / galaxy.radius)
      //
      // colors[i3]=mixedColor.r
      // colors[i3+1]=mixedColor.g
      // colors[i3+2]=mixedColor.b

      // scales[i]=Math.random()*galaxy.size

      // branchAngles[i]=branchAngle
      // radius01s[i]=radius01
    // }

    //Sprite没有下面这些
    const geometry = new THREE.BufferGeometry()
    // geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    //要「动起来」，更推荐 TSL；InstancedBufferAttribute 更适合静态或只当种子数据。
    // const positionAttribute = new THREE.InstancedBufferAttribute(positions, 3)
    // const colorAttribute = new THREE.InstancedBufferAttribute(colors, 3)
    // const aScale = new THREE.InstancedBufferAttribute(scales, 1)

    //positions全部0占位，必须设置position，不能像sprite.count+无position来设置每个粒子的位置
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    // geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3))
    // geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    // geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    // geometry.setAttribute('aRadius01', new THREE.BufferAttribute(radius01s, 1))
    // geometry.setAttribute('aBranchAngle', new THREE.BufferAttribute(branchAngles, 1))

    //画「粒子点云」用 PointsNodeMaterial（继承于后者）；普通单个广告牌用 SpriteNodeMaterial
    //SpriteNodeMaterial  →  通用 Sprite（一张朝向相机的图）
    //        ↑
    // PointsNodeMaterial  →  当「有大小的点」用（再加 sizeNode）
    // const material = new THREE.PointsNodeMaterial({
    //   // size: galaxy.size,
    //   sizeNode: instancedBufferAttribute(aScale),
    //   positionNode: instancedBufferAttribute(positionAttribute),
    //   colorNode: instancedBufferAttribute(colorAttribute),
    //   sizeAttenuation: true,
    //   depthWrite: false,
    // })

    // points = new THREE.Sprite(material)
    // points.count = positionAttribute.count
    // root.add(points)

    // const aRandomness = attribute('aRandomness', 'vec3')
    //aRadius01（attribute）当成只读
    // const aRadius01 = attribute('aRadius01', 'float')
    // const aBranchAngle = attribute('aBranchAngle', 'float')
    // const aScale = attribute('aScale', 'float')

    const material = new THREE.PointsNodeMaterial({
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      // vertexColors: true, 和colorNode冲突
    })

    points = new THREE.Points(geometry, material)
    root.add(points)

    const getSign=Fn(([index = uint(0)])=>{
      return select(
        hash(index).greaterThan(0.5),
        float(1),
        float(-1),
      )
    })
    const vRadius01=varying(float(0))
    material.positionNode=Fn(()=>{
      const position=positionLocal.toVar()
      const index=float(vertexIndex)
      const branchAngle =index.mod(galaxy.branches).div(galaxy.branches).mul(TWO_PI)
      //((i % galaxy.branches) / galaxy.branches) * Math.PI * 2
      const seed01=index.div(galaxy.count)
      // const radius = seed01.mul(galaxy.radius)
      //x=-2.6，fract(x)=x-floor(x)【正负通用】=-2.6-floor(-2.6)=-2.6-(-3.0)=3.0-2.6=0.4
      // 负数可理解为 ceil(-x)-(x)
      vRadius01.assign(seed01.sub(time.mul(0.01)).fract()) //vRadius01=1->0
      const finalRadius=vRadius01.mul(galaxy.radius)
      const randomX=pow(hash(vertexIndex),galaxy.randomnessPower)
        .mul(getSign(uint(index)),galaxy.randomness,finalRadius)
      const randomY=pow(hash(vertexIndex.add(1)),galaxy.randomnessPower)
        .mul(getSign(uint(index.add(1))),galaxy.randomness,finalRadius)
      const randomZ=pow(hash(vertexIndex.add(2)),galaxy.randomnessPower)
        // .mul(getSign(vertexIndex.add(uint(2))),galaxy.randomness,finalRadius)
        .mul(getSign(uint(index.add(2))),galaxy.randomness,finalRadius)

      const spinAngle=finalRadius.mul(galaxy.spin)
        .sub(pow(vRadius01,2).mul(3))

      const angle=branchAngle.add(spinAngle)
      position.x.assign(cos(angle).mul(finalRadius).add(randomX))
      position.y.assign(randomY)
      position.z.assign(sin(angle).mul(finalRadius).add(randomZ))
      return position
    })()

    //webgpu里，无法修改points的scale，只能为默认值1，解决办法是换成sprite，动态银河不用容器存放顶点等数据，在positionNode里生成，即galaxy.ts里是对的
    // material.sizeNode = Fn(()=>{
    //   return aScale.mul(50)
    // })()

    material.colorNode = Fn(()=>{
      const mixedColor = mix(galaxy.innerColor,galaxy.outerColor,vRadius01)
      return mixedColor
    })()

  }
  generateGalaxy()

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

  const pane = new Pane({ title: 'Galaxy' })
  const bloomFolder = pane.addFolder({ title: 'Bloom' })
  bloomFolder.addBinding(bloomPass.threshold, 'value', {
    label: 'threshold',
    min: 0,
    max: 2,
    step: 0.01,
  })
  bloomFolder.addBinding(bloomPass.strength, 'value', {
    label: 'strength',
    min: 0,
    max: 2,
    step: 0.01,
  })

  const galaxyFolder = pane.addFolder({ title: 'Galaxy' })
  galaxyFolder.addBinding(galaxy.radius, 'value', {
    label: 'radius',
    min: 0.01,
    max: 20,
    step: 0.01,
  })
  galaxyFolder.addBinding(galaxy.branches, 'value', {
    label: 'branches',
    min: 2,
    max: 20,
    step: 1,
  })
  galaxyFolder.addBinding(galaxy.spin, 'value', {
    label: 'spin',
    min: -5,
    max: 5,
    step: 0.01,
  })
  galaxyFolder.addBinding(galaxy.randomness, 'value', {
    label: 'randomness',
    min: 0,
    max: 2,
    step: 0.001,
  })
  galaxyFolder.addBinding(galaxy.randomnessPower, 'value', {
    label: 'randomnessPower',
    min: 1,
    max: 10,
    step: 0.001,
  })

  const colorParams = {
    innerColor: '#ff6030',
    outerColor: '#1b3984',
  }
  galaxyFolder
    .addBinding(colorParams, 'innerColor', { label: 'innerColor', view: 'color' })
    .on('change', (ev) => {
      galaxy.innerColor.value.set(ev.value)
    })
  galaxyFolder
    .addBinding(colorParams, 'outerColor', { label: 'outerColor', view: 'color' })
    .on('change', (ev) => {
      galaxy.outerColor.value.set(ev.value)
    })

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
    pane.dispose()
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
