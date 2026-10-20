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
  toVarying,
  textureStore,
  uvec2,
  rotate,
  negate,
  instanceIndex,
  lessThanEqual,
  lessThan,
  positionGeometry,
  instancedBufferAttribute,
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
const ANVIL_MODEL_URL = 'model/others/anvil.glb'
const FLOOR_URL = '/textures/floor/floor-color.jpg'
const FLOOR_DATA_URL = '/textures/floor/floor-data.png'
const FLOOR_NOISE_URL = '/textures/floor/noise/simplex-tiling-noise-256x256.png'

/**
 * 护盾演示：createShield 工厂 + 本函数装配场景 / 拾取 / bloom / dispose。
 */
export async function setupStylizedNatureScene(
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
  root.position.set(-1,-1,-3)
  root.name = 'shield-demo'
  threeScene.add(root)

  let dracoLoader: DRACOLoader | null = null
  let anvilScene: THREE.Object3D | null = null
  let titleMesh: THREE.Mesh | null = null
  let shield: ShieldInstance | null = null
  let transform: TransformControls | null = null
  let renderPipeline: InstanceType<typeof THREE.RenderPipeline> | null = null
  const textureLoader = new THREE.TextureLoader()
  let terrainNormalTexture=null

  const createGltfLoader = (): GLTFLoader => {
    dracoLoader ??= new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    return loader
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
    anvilScene.position.set(-3,1,2.8)
    registerObject?.(anvilScene)
  }

  //马上返回 Texture    不等图片，像素往往还没到    颜色图可以，到了再显示
  // const floorTerrainTexture=textureLoader.load(FLOOR_DATA_URL)
  //返回 Promise<Texture>   等到像素加载完才继续   算法线前必须用这个
  const floorTerrainTexture=await textureLoader.loadAsync(FLOOR_DATA_URL)
  const floorNoiseTexture=await textureLoader.loadAsync(FLOOR_NOISE_URL)
  floorNoiseTexture.wrapS = THREE.RepeatWrapping
  floorNoiseTexture.wrapT = THREE.RepeatWrapping
  const floorTexture = textureLoader.load(FLOOR_URL)

  const loadFloor = (): void => {
    floorTexture.colorSpace = THREE.SRGBColorSpace
    floorTexture.wrapS = THREE.RepeatWrapping
    floorTexture.wrapT = THREE.RepeatWrapping

    const floorMaterial = new THREE.MeshStandardNodeMaterial({
      //高度 = 红色通道 × displacementScale + displacementBias
      displacementMap: floorTerrainTexture,
      map: floorTexture,
      normalMap: terrainNormalTexture
    })

    const floorMesh = new THREE.Mesh(
      // 宽 10，高 10
      // 宽分成 20 段，高分成 20 段
      new THREE.PlaneGeometry(10, 10, 20, 20),
      floorMaterial)
    floorMesh.rotation.x = -Math.PI * 0.5
    floorMesh.receiveShadow = true
    floorMesh.renderOrder = -1
    root.add(floorMesh)
  }

  /**
   * Compute normal
   */
  const computeFloorNormal=()=>{
    const resolution = 32

    terrainNormalTexture = new THREE.StorageTexture(resolution, resolution)

    const computeNormal = Fn(() =>
    {
      // UV
      //uvec2 是 textureStore 的像素坐标类型。它要知道写到第几列、第几行，所以indexUV是两个无符号【整数】
      const indexUV=uvec2(
        instanceIndex.mod(resolution),
        instanceIndex.div(resolution)
      )

      // Sample texture on each side
      //texel=texture element = 纹素
      //屏幕上的一个点叫 pixel，贴图上的一个点叫 texel。 这里量的是高度图上相邻两个点的 UV 间距，所以用 texelSize，不用 pixelSize。
      // pixelSize 通常指屏幕像素，比如一个像素占多少窗口宽度。两边都是「一个点」，但一个在屏幕上，一个在贴图上。
      const textureUV=indexUV.toVec2().div(resolution)
      const texelSize=float(1).div(resolution)
      const xPos=texture(floorTerrainTexture,textureUV.add(vec2(texelSize, 0))).r
      const xNeg=texture(floorTerrainTexture,textureUV.sub(vec2(texelSize, 0))).r
      const yPos=texture(floorTerrainTexture,textureUV.add(vec2(0,texelSize))).r
      const yNeg=texture(floorTerrainTexture,textureUV.sub(vec2(0,texelSize))).r

      const normal = vec3(
        // xPos.sub(xNeg),
        // yPos.sub(yNeg),

        xNeg.sub(xPos),
        yNeg.sub(yPos),

        1,
      ).normalize()
      //归一化就是把向量缩成「方向不变、长度为 1」。 这样的向量叫单位向量。
      //归一化过程：
      //1.长度 = √((x原)² + (y原)² + (z原)²)
      //2.归一化后的向量= 单位向量 = (x原 / 长度, y原 / 长度, z原 / 长度)=(X新,Y新,Z新)，且新长度=1

      // Store
      //单位向量的每个分量都∈[-1,1]
      const _color = vec4(normal.remap(-1, 1), 1)
      // const _color = vec3(normal.remap(-1, 1))
      //uvec2 是 textureStore 的像素坐标类型。它要知道写到第几列、第几行，所以indexUV是两个无符号【整数】
      textureStore(terrainNormalTexture, indexUV, _color).toWriteOnly() //这里在设置terrainNormalTexture
    })().compute(resolution * resolution)

    threeRenderer.compute(computeNormal)
  }

  const loadGrass=()=>{
    const subdivisions = 100
    const count = subdivisions * subdivisions
    // const size = 10
    const size = 9.75
    const halfSize = size * 0.5
    const cellSize = size / subdivisions
    const halfCellSize=cellSize/2

    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array( [
      -0.25, 0.0,  0.0, // v0
      0.25, 0.0,  0.0, // v1
      0.0,  1.0,  0.0, // v2
    ] );
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([
      0, 0,   // 底左
      1, 0,   // 底右
      0.5, 1, // 尖
    ]), 2))
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.hypot(halfSize, halfSize))
    const material = new THREE.MeshStandardNodeMaterial( { side: THREE.DoubleSide } );
    const mesh = new THREE.Mesh( geometry, material );
    mesh.count = count
    mesh.castShadow = true
    mesh.receiveShadow = true
    // mesh.frustumCulled = false

    // mesh.position.y=1
    root.add(mesh)

    const instancePositionsArray = new Float32Array(count * 3)
      for (let iX = 0; iX < subdivisions; iX++) {
        for (let iZ = 0; iZ < subdivisions; iZ++) {
        const grassIndex=iX*subdivisions+iZ
          const i=grassIndex*3
          //无push方法
        // instancePositionsArray.push(halfCellSize+iZ*cellSize, 0.0, halfCellSize+iX*cellSize)
          instancePositionsArray[i+0]=halfCellSize*(Math.random()*2)+iZ*cellSize-halfSize
          instancePositionsArray[i+1]=0.0
          instancePositionsArray[i+2]=halfCellSize*(Math.random()*2)+iX*cellSize-halfSize
      }
    }
    const instancePositions = new THREE.InstancedBufferAttribute(instancePositionsArray, 3)

    const grassColorVarying=vec3(0).toVarying()

    material.positionNode=Fn(()=>{
      const instancePosition = instancedBufferAttribute(instancePositions) //当前这棵草的 xz

      //instancePosition[]
      const terrainUv = vec2(instancePosition.x,instancePosition.z).div(10).add(0.5)
      // terrainUv.subAssign(vec2(0,1)) 加上这个是错误的

      //(0,0) →→ (1,0)
      //   ↓
      // (0,1)
      //只需要 terrainUv.y.assign(terrainUv.y.oneMinus()) 就把terrainUv原点从左上角移动到左下角
      //(0,1)
      //   ↑
      // (0,0) →→ (1,0)
      terrainUv.y.assign(terrainUv.y.oneMinus())
      const terrainData = texture(floorTerrainTexture, terrainUv).rg
      //这里写在草的 positionNode 里，uv() 是草叶片几何体自己的 UV，不是地板的 UV。
      // const terrainData = texture(floorTerrainTexture, uv()).rg

      const terrainScale=terrainData.g
        .remapClamp(0,0.2,0,1)
      // const terrainScale=terrainData.r

      const angle=range(0,TWO_PI)
      const rotated=rotate(positionGeometry,vec3(0,angle,0))

      const scale=range(0.7,1).mul(0.4)
        .mul(terrainScale)
      const scaled=rotated.mul(scale)

      const translated = scaled.add(instancePosition)
      translated.y.addAssign(terrainData.r)

      const wind=texture(
        floorNoiseTexture,
        terrainUv
          .mul(0.4)
          .add(time.mul(0.08))
      ).r
      const wiggleSpeed=7
      const wiggleStrength=0.06
      const wiggle=sin(time.add(instanceIndex).mul(wiggleSpeed)).mul(wiggleStrength)
        .mul(uv().y)
        .mul(terrainData.r) //海拔越低越不摇
        .mul(terrainScale) //摇晃值跟随大小成等比例
        .mul(wind)
      translated.x.addAssign(wiggle)

      const bend=wind.remap(0,1,-0.1,0.1)
        .mul(uv().y)
        .mul(terrainScale)
      translated.x.addAssign(bend)

      //该草坐标（三角形底部中点）对应的地面的uv坐标（terrainUv）里的位置，将terrainUv坐标的纹理颜色传递给草的colorNode
      grassColorVarying.assign(texture(floorTexture,terrainUv).rgb)

      return translated
    })()

    material.colorNode=Fn(()=>{
      return grassColorVarying
    })()
  }
  computeFloorNormal()
  loadFloor()
  loadGrass()

  try {
    await loadAnvilModel()
  } catch (error) {
    console.error('[setupGalaxy] failed to load anvil', { url: ANVIL_MODEL_URL, error })
  }

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
