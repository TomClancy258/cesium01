import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import type { ShallowRef } from 'vue'
import { createShield, type ShieldInstance } from './anvil'
import {
  materialEmissive, pass, uv,
  positionViewDirection,
  instanceIndex,
  lessThanEqual,
  lessThan,
  deltaTime,
  mulAssign,
  select,
  subAssign,
  grayscale,
  If,
  materialColor,
  add,
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
const ANVIL_MODEL_URL = 'model/others/anvil.glb'
const HEXAGONS_URL = '/textures/shield/hexagons.png'
const FLOOR_URL = '/textures/floor/floor-color.jpg'

/**
 * 护盾演示：createShield 工厂 + 本函数装配场景 / 拾取 / bloom / dispose。
 */
export async function setupAnvil(
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
  let floorMesh: THREE.Mesh | null = null
  let shield: ShieldInstance | null = null
  let transform: TransformControls | null = null
  let renderPipeline: InstanceType<typeof THREE.RenderPipeline> | null = null
  let hammer=null

  const createGltfLoader = (): GLTFLoader => {
    dracoLoader ??= new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    return loader
  }

  const hexagonsTexture = await new THREE.TextureLoader().loadAsync(HEXAGONS_URL)
  hexagonsTexture.wrapS = THREE.RepeatWrapping
  hexagonsTexture.wrapT = THREE.RepeatWrapping

  // shield = createShield({ texture: hexagonsTexture })
  // shield.mesh.name = 'shield'
  // root.add(shield.mesh)
  // registerObject?.(shield.mesh)

  let sparklesLight=null
  const initSparklesLight=()=>{
    sparklesLight = new THREE.PointLight(0xff9955, 15)
    sparklesLight.position.set(-1.5, 1.5, -1)
    root.add(sparklesLight)
    const sparklesLightHelper = new THREE.PointLightHelper(sparklesLight, 0.25)
    root.add(sparklesLightHelper)
    sparklesLight.intensity=0
  }
  initSparklesLight()

  const loadFloor = (): void => {
    const floorTexture = new THREE.TextureLoader().load(FLOOR_URL)
    floorTexture.colorSpace = THREE.SRGBColorSpace
    floorTexture.wrapS = THREE.RepeatWrapping
    floorTexture.wrapT = THREE.RepeatWrapping

    const floorMaterial = new THREE.MeshStandardNodeMaterial({
      map: floorTexture,
      transparent: true,
      depthWrite: true, //false则不往深度缓冲写
    })
    const uvFromCenter=uv().sub(0.5).mul(2)
    const distToCenter=length(uvFromCenter)
    const distToCenterAA=max(fwidth(distToCenter),0.002)
    const radius=float(0.8)
    const floorShape=smoothstep(radius.sub(distToCenterAA),radius.add(distToCenterAA),distToCenter).oneMinus()

    floorMaterial.opacityNode = floorShape
    // floorMaterial.emissiveNode = materialEmissive.add(shield!.junctionNode)

    floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), floorMaterial)
    floorMesh.rotation.x = -Math.PI * 0.5
    floorMesh.receiveShadow = true
    floorMesh.renderOrder = -1
    root.add(floorMesh)
  }

  const loadAnvilModel = async (): Promise<void> => {
    const gltf = await createGltfLoader().loadAsync(ANVIL_MODEL_URL)
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
    anvilScene = gltf.scene
    root.add(gltf.scene)
    registerObject?.(anvilScene)
  }
  const initHammer=()=>{
    hammer = anvilScene.getObjectByName('hammer')
    hammer.rotation.reorder('YXZ')
    hammer.rotation.x = Math.PI * impact.hammer.rotationDefault
  }

  const addImpact=()=>{
    hammer.rotation.x =Math.PI*impact.hammer.rotationOnTheAnvil
    impact.anvil.effect.value+=impact.anvil.delta

    sparklesLight.intensity += 0.3

    threeRenderer.compute(sparklesExplodeCompute,SPARK_EXPLOSION_COUNT)

    spark.offset.value+=SPARK_EXPLOSION_COUNT
  }

  const restoreHammer=()=>{
    //1/3=0.033 = 33ms，即30fps
    const deltaTime = Math.min(1 / 30, timer.getDelta())
    if (hammer.rotation.x > Math.PI *impact.hammer.rotationDefault) {
      hammer.rotation.x-= hammer.rotation.x * deltaTime
    }
    if (impact.anvil.effect.value > 0) {
      impact.anvil.effect.value-=deltaTime*0.1
    }
    if (sparklesLight.intensity > 0) {
      sparklesLight.intensity-=deltaTime*0.5
    }
  }

  const impact={
    hammer:{
      // delta:0.01,
      rotationDefault:0.25,
      rotationOnTheAnvil:0.5
    },
    anvil:{
      delta:0.05,
      effect:uniform(0,'float'),
      //不含 a
      colorA: uniform(color(0xff007b)),
      colorB: uniform(color(0xffb070))
    }
  }
  const initBladeMaterial=()=>{
    const blade = anvilScene.getObjectByName('blade')
    blade.material = new THREE.MeshPhysicalNodeMaterial().copy(blade.material)
    blade.material.emissiveNode = Fn(() => {
      //grayscale灰度值,.r是红色分量                   中间黑的到边缘白色=》中间白到边缘黑
      // const mask = grayscale(materialColor.rgb)
      // const mask = grayscale(materialColor.rgb).remapClamp(0.02,0.1,1,0)
      const mask = grayscale(materialColor.rgb).remapClamp(0.02, 0.1, 0, 1).oneMinus()
      // return vec3(mask)
      // return materialColor.rgb

      const impactPosition=vec3(0,0,0.3)
      const distToImpact=distance(positionLocal,impactPosition)

      const effect=distToImpact.oneMinus().add(impact.anvil.effect).pow(10).mul(mask)

      const color=mix(impact.anvil.colorA,impact.anvil.colorB,effect).mul(effect)

      return vec3(color)
    })()
  }

  const SPARK_COUNT=2000
  const SPARK_EXPLOSION_COUNT=150
  const spark={
    positions:instancedArray(SPARK_COUNT, 'vec3'),
    velocities:instancedArray(SPARK_COUNT, 'vec3'),
    lives:instancedArray(SPARK_COUNT, 'float'),
    offset:uniform(0,'int'),
    mesh:null,
    colorA:uniform(color(0xff822e)),
    colorB:uniform(color(0x5e24ff)),
    emissiveStrength:10
  }

  let sparklesExplodeCompute=null
  let sparklesUpdateCompute=null

  const initSparkMaterial=()=>{
    const material = new THREE.SpriteNodeMaterial({ color: 0x000000 })
    spark.mesh = new THREE.Sprite(material)
    spark.mesh.count = SPARK_COUNT
    root.add(spark.mesh)

    //explode 的 instanceIndex =「这一波里的第几个」；加上 offset 才变成「缓冲区里的第几个」。
    // 2000-150=1850 个不是没渲染，是闲置在原点且又黑又静(position、velocity、life都为vec3(0)和0)；环形缓冲只是每次「唤醒/重置」其中 150 个槽。
    sparklesExplodeCompute = Fn(() => {
      //相当于slots，大小为SPARK_EXPLOSION_COUNT
      const newInstanceIndex = instanceIndex.add(spark.offset).mod(SPARK_COUNT)
      // const newInstanceIndex = instanceIndex.add(spark.offset)
      // const newInstanceIndex = instanceIndex

      // Buffers
      const position = spark.positions.element(newInstanceIndex)
      const velocity =spark.velocities.element(newInstanceIndex)
      const life =spark.lives.element(newInstanceIndex)

      // Position
      position.assign(vec3(0.05, 1.95, -0.1))

      // Velocity
      //hash(x)，x∈int / uint / float，return [0, 1] 的 float
      //hash：GPU，每个 compute 线程各算一次，该在compute里用
      //range：CPU，建一份实例 attribute，不该在compute里用
      const angle = hash(newInstanceIndex).mul(TWO_PI)
      // const angle = range(0,1).mul(TWO_PI)
      const explosionDirection = vec3(
        angle.sin(),
        hash(newInstanceIndex.add(1)),
        // range(0,1),
        angle.cos()
      ).normalize()
      velocity.assign(explosionDirection.mul(0.05))

      life.assign(hash(newInstanceIndex.add(2)))

    })().compute(SPARK_EXPLOSION_COUNT)

    //update：每帧更新全部 2000 个 → 直接用 instanceIndex
    sparklesUpdateCompute = Fn(() => {
      // const newInstanceIndex = instanceIndex.add(sparklesIndex).mod(count)
      const newInstanceIndex = instanceIndex.add(spark.offset)
      // const newInstanceIndex = instanceIndex

      // Buffers
      const position = spark.positions.element(instanceIndex)
      const velocity =spark.velocities.element(instanceIndex)
      const life =spark.lives.element(instanceIndex)
      velocity.y.subAssign(deltaTime.mul(0.0498))
      //velocity.y匀速越来越小
      // Position,y加速越来越小
      position.addAssign(velocity)
      // position.addAssign(velocity.mul(deltaTime))

      If(position.y.lessThan(0.05),()=>{
        position.y.assign(0.05)
        velocity.mulAssign(vec3(0.9,-0.5,0.9))
      })

      life.addAssign(deltaTime.mul(0.2))
      life.assign(min(life,1))
    })().compute(SPARK_COUNT)

    material.positionNode=Fn(()=>{
      return spark.positions.element(instanceIndex)
    })()

    material.scaleNode=Fn(()=>{
      const life=spark.lives.element(instanceIndex)
      const defaultScale=float(0.1).mul(range(0.5,1))
      const scale=defaultScale.mul(life.oneMinus().remapClamp(0.5,0,1,0))
      return scale
    })()

    material.colorNode=Fn(()=>{
      const mixColor=mix(spark.colorA,spark.colorB,hash(instanceIndex))
      return mixColor.mul(spark.emissiveStrength)
    })()
  }

  loadFloor()
  try {
    await loadAnvilModel()
    initHammer()
    initBladeMaterial()
    initSparkMaterial()
  } catch (error) {
    console.error('[setupGalaxy] failed to load anvil', { url: ANVIL_MODEL_URL, error })
  }

  const timer = new THREE.Timer()
  timer.connect(document)

  const unsubscribeBeforeRender = onBeforeRender(() => {
    timer.update()
    //timer.getElapsed() 上次 timer.update() 到这次的间隔（秒）
    const elapsed = timer.getElapsed()
    //timer.getDelta() 计时器启动以来的累计时间（秒）
    // const deltaTime = Math.min(1 / 30, timer.getDelta())
    restoreHammer()
    // sparklesUpdateCompute()
    threeRenderer.compute(sparklesUpdateCompute)

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

    const shieldGui = inspector.createParameters('Shield')
    // shieldGui
    //   .add(shield.radius, 'value', 0, 5, 0.01)
    //   .name('radius')
    //   .onChange((value: number) => {
    //     shield?.setRadius(value)
    //   })
    // shieldGui.addColor(shield.colorA, 'value').name('colorA')
    // shieldGui.addColor(shield.colorB, 'value').name('colorB')
    // shieldGui.add(shield.strength, 'value', 1, 100, 0.01).name('strength')
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
    hexagonsTexture.dispose()
    dracoLoader?.dispose()
    dracoLoader = null
  }

  return {
    dispose,
    addImpact
  }
}
