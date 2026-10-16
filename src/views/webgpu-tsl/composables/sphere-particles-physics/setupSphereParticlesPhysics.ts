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
}

const DRACO_DECODER_PATH = '/draco/gltf/'
const TITLE_URL = '/textures/title/clair-obscur-title.png'
const PETAL_URL = '/textures/flower/petals-alpha-map.png'

/**
 * 护盾演示：createShield 工厂 + 本函数装配场景 / 拾取 / bloom / dispose。
 */
export async function setupSphereParticlesPhysics(
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
  root.position.set(2,2,-1)
  root.name = 'shield-demo'
  threeScene.add(root)

  let dracoLoader: DRACOLoader | null = null
  let anvilScene: THREE.Object3D | null = null
  let titleMesh: THREE.Mesh | null = null
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

  let intersectionSprite=null
  const initPlane=()=>{
    const material = new THREE.SpriteMaterial();
    intersectionSprite = new THREE.Sprite( material );
    intersectionSprite.scale.set(10, 10, 1)
    intersectionSprite.visible=false
    root.add( intersectionSprite )
    registerObject?.(intersectionSprite)
  }
  initPlane()

  const updateSphereParticles=(hit)=>{
    const pos=hit.object.worldToLocal(hit.point.clone())
    console.log("pos", pos);
    //速度（带方向）=现在的交点 - 上一帧位置
    //pos.sub(cursor.uniform.position.value)会改变pos
    // cursor.uniform.velocity.value.copy(pos.sub(cursor.uniform.position.value))//错误
    cursor.uniform.velocity.value.copy(pos).sub(cursor.uniform.position.value)//对，这样sub只改变velocity
    cursor.uniform.position.value.copy(pos)
  }

  const PETAL_COUNT=1000
  let petal={
    mesh:null,
    uniform:{
      positions:instancedArray(PETAL_COUNT, 'vec3'),
      velocities:instancedArray(PETAL_COUNT, 'vec3'),
      heats:instancedArray(PETAL_COUNT, 'float'),
      colorA:uniform(color(0xffcda3)),
      colorB:uniform(color(0xff142c)),
      radius:uniform(0.1,'float'),
      spawnPosition:uniform(vec3(0,0,0),'vec3'),
      impactDamping:uniform(0.1,'float'),
      //一般阻尼
      generalDamping:uniform(0.4,'float'),
      heatDamping:uniform(3,'float'),
      heatImpactStrength:uniform(30,'float'),

      emissiveColor:uniform(color(0xff3f0f))
    }
  }
  let cursor={
    uniform:{
      position:uniform(vec3(),'vec3'),
      velocity:uniform(vec3(),'vec3'),
      radius:uniform(1.75),
      strength:uniform(0.05),
    }
  }
  const loadPetal=()=>{
    //第一个参数是半径 radius = 1（外接球半径约 1），第二个是细分 detail = 2。
    const geometry = new THREE.IcosahedronGeometry(1, 2)
    const material = new THREE.MeshLambertNodeMaterial({
      // color: 0xffffff,
      color: 0x000000,
    })

    petal.mesh = new THREE.Mesh(geometry, material)
    petal.mesh.count = PETAL_COUNT
    petal.mesh.castShadow = true
    petal.mesh.receiveShadow = true
    petal.mesh.frustumCulled = false
    root.add(petal.mesh)
  }
  loadPetal()

  let initPetalCompute=null
  let petalUpdateCompute=null

  const initPetalMaterial=()=>{
    initPetalCompute = Fn(() => {
      // Buffers
      const position = petal.uniform.positions.element(instanceIndex)

      //若不加sub(0.5)，则全部position都是正的，positionLocal.addAssign(position)就全部往正的一个方向遍布，
      //每轴独立：x,y,z ∈ [-2.5, 2.5) → 边长 5 的正方体
      //加了才会在 正方体（内切球半径 2.5）内生成坐标
      position.assign(vec3(
        hash(instanceIndex),
        hash(instanceIndex.add(1)),
        hash(instanceIndex.add(2)),
      ).sub(0.5).mul(5))

    })().compute(PETAL_COUNT)
    threeRenderer.compute(initPetalCompute)
  const clampedDeltaTime=deltaTime.min(1/30)
    petalUpdateCompute = Fn(() => {
      // Buffers
      const aPosition = petal.uniform.positions.element(instanceIndex)
      const aVelocity =petal.uniform.velocities.element(instanceIndex)
      const aHeat =petal.uniform.heats.element(instanceIndex)

      // Cursor
      const distToCursor=distance(aPosition,cursor.uniform.position)
      const distToCursor01=distToCursor.div(cursor.uniform.radius).oneMinus().max(0)
      const cursorVelocity=cursor.uniform.velocity.mul(distToCursor01)
        .mul(cursor.uniform.strength)
      //a的方向速度上加了鼠标在sprite上移动的方向
      aVelocity.addAssign(cursorVelocity)
      aHeat.addAssign(cursorVelocity.length().mul(50))

      // Center gravity
      const direction=aPosition.negate().normalize()
      const gravityVelocity=direction.mul(0.005).mul(clampedDeltaTime)
      aVelocity.addAssign(gravityVelocity)

      // Spheres collision
      Loop({start:instanceIndex.add(1),end:PETAL_COUNT,condition:'<',name:'i'},({i})=>{
        // Buffers
        const bPosition = petal.uniform.positions.element(i)
        const bVelocity =petal.uniform.velocities.element(i)
        const bHeat =petal.uniform.heats.element(i)

        const distanceAB=distance(aPosition,bPosition)
        const radius2=petal.uniform.radius.mul(2)
        If(distanceAB.lessThan(radius2),()=>{
          const overlap=radius2.sub(distanceAB)
          const avoidance=overlap.mul(0.5)
          // const directionA2B=bPosition.sub(aPosition).normalize() //俩位置重叠，0.normalize()会报错
          const directionA2B=bPosition.sub(aPosition).div(distanceAB.max(EPSILON))//得用div+max来防御性归一化
          const avoidanceA2B=directionA2B.mul(avoidance)
          // 把「重叠长度」当成速度增量，量纲错了：重叠是米，速度是米/秒；
          // aVelocity.subAssign(avoidanceA2B)
          // bVelocity.addAssign(avoidanceA2B)

          aPosition.subAssign(avoidanceA2B)
          bPosition.addAssign(avoidanceA2B)

          bPosition.addAssign(bVelocity)

          const relativeVelocity=aVelocity.sub(bVelocity)
          const impactStrength=dot(relativeVelocity,directionA2B)
          const impactVelocity=directionA2B
            .mul(impactStrength)
            .mul(petal.uniform.impactDamping.oneMinus())
          aVelocity.subAssign(impactVelocity)
          bVelocity.addAssign(impactVelocity)

          //impactStrength  sub(0.01).max(0)        含义
          //≤ 0             0                       在分开或没靠近，不加热
          //0～0.01          0                       蹭一下、数值抖动，忽略
          //> 0.01          impactStrength - 0.01   真正撞上，超出的部分才算热
          const heat = impactStrength.sub(0.001).max(0)
            .mul(petal.uniform.heatImpactStrength)
          aHeat.addAssign(heat)
          bHeat.addAssign(heat)
        })
      })

      aVelocity.mulAssign(petal.uniform.generalDamping.mul(clampedDeltaTime).oneMinus())
      //正常帧率下是的：大于 0、小于 1。
      aHeat.mulAssign(petal.uniform.heatDamping.mul(clampedDeltaTime).oneMinus())
      aPosition.addAssign(aVelocity)
    })().compute(PETAL_COUNT)

    petal.mesh.material.positionNode=Fn(()=>{
      const instancePosition = petal.uniform.positions.element(instanceIndex)
      const scaled=positionLocal.mul(petal.uniform.radius)
      const translated=scaled.add(instancePosition)
      return translated
    })()

    // petal.mesh.material.colorNode=Fn(()=>{
    //   const mixColor=mix(petal.uniform.colorA,petal.uniform.colorB,hash(instanceIndex.add(1)))
    //   return mixColor
    // })()

    petal.mesh.material.emissiveNode=Fn(()=>{
      return petal.uniform.emissiveColor.mul(petal.uniform.heats.element(instanceIndex))
    })()

  }

  // loadTitle()
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

    const bowGui = inspector.createParameters('Bow')
    bowGui.add(petal.uniform.impactDamping, 'value', 0, 1, 0.01).name('impactDamping')
    bowGui.add(petal.uniform.generalDamping, 'value', 0, 1, 0.01).name('generalDamping')
    bowGui.add(petal.uniform.heatDamping, 'value', 1, 10, 0.1).name('heatDamping')

    const cursorGui = inspector.createParameters('Cursor')
    cursorGui.add(cursor.uniform.radius, 'value', 0, 5, 0.01).name('radius')
    cursorGui.add(cursor.uniform.strength, 'value', 0, 0.1, 0.01).name('strength')
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
    updateSphereParticles,
  }
}
