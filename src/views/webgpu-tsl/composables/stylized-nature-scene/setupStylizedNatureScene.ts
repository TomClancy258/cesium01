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
  cameraFar,
  rotate,
  linearDepth,
  negate,
  instanceIndex,
  lessThanEqual,
  lessThan,
  positionGeometry,
  viewportLinearDepth,
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
  transformNormalToView,
  add,
  greaterThan,
  viewportSharedTexture,
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
  cameraNear,
  uniformArray,
  vec2,
  vec3 ,
  vec4,
  fwidth,
  smoothstep,
  step,
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
  // root.rotation.z =- Math.PI / 4
  // root.rotateZ(Math.PI / 4)
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
      //normalMap要求： (切线方向坡, 副切线方向坡, 表面朝外)
      // 所以terrainNormalTexture必须为 (坡U, 坡V, 朝外)
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
        instanceIndex.mod(resolution), //instanceIndex来自resolution²，即∈[0,resolution²-1]
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

      //贴图：(坡U, 坡V, 朝外)
      const normal = vec3(
        // xPos.sub(xNeg),
        // yPos.sub(yNeg),

        //假设:左边高度 xNeg = 0,右边高度 xPos = 1
        //两种减法:
        //xPos - xNeg = 1 - 0 = +1
        //xNeg - xPos = 0 - 1 = -1
        //法线该往哪倾？斜坡右边高时，法线应偏向左边，所以 x 分量应该是负数

        xNeg.sub(xPos), //必须这么写
        yNeg.sub(yPos),
        1,
      ).normalize()
      //归一化就是把向量缩成「方向不变、长度为 1」。 这样的向量叫单位向量。
      //归一化过程：
      //1.长度 = √((x原)² + (y原)² + (z原)²)
      //2.归一化后的向量= 单位向量 = (x原 / 长度, y原 / 长度, z原 / 长度)=(X新,Y新,Z新)，且新长度=1

      // Store
      //单位向量的每个分量都∈[-1,1]
      const _color = vec4(normal.remap(-1, 1, 0,1), 1)
      // const _color = vec3(normal.remap(-1, 1))
      //uvec2 是 textureStore 的像素坐标类型。它要知道写到第几列、第几行，所以indexUV是两个无符号【整数】
      //resolution = 32 时就是算 32×32 = 1024 个法线。
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
    const grassNormalVarying=vec3(0).toVarying()

    material.positionNode=Fn(()=>{
      //instancePosition：当前该草[三角形底边中心点]位于root的世界坐标，y=0，x、z∈(-5,5)
      const instancePosition = instancedBufferAttribute(instancePositions)

      //terrainUv.x/y∈(0,1)
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

      const visible=step(0.05,scale)

      const scaled=rotated.mul(scale).mul(visible)

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
      //terrainUv里草的数量(subdivision²)远远大于terrainNormalTexture里法线的数量(resolution²)，是three自动用差值计算的该草对应的地面法线
      //地面的_color把法线的[-1，1]映射为了[0,1]保存在terrainNormalTexture里，这里就要解构出法线的[-1,1]
      //(坡U, 坡V, 朝外【这里「朝外」是贴图平面法向，还不是世界 +Y。】)  ≈  (normal.x, normal.y, normal.z)
      const normal=texture(terrainNormalTexture,terrainUv).rgb.remap(0, 1, -1, 1)
      //只转 root，地板/草相对 root 不动，法线就仍对
      //因为floor的位于root 本地 XZ平面内，垂直于root本地y轴，且没有围绕root本地y旋转，
      // 所以normal.x和root本地x轴方向相同，normal.y和root本地z轴方向相反，normal.z方向和root本地y轴相同。
      // 若floor没位于root本地zx平面，又或者围绕root本地y轴旋转，则以上不成立
      normal.assign(vec3(
        normal.x,
        normal.z,
        normal.y.negate()
      ))

      // 叶片真实法线（绕 Y 转之后）
      const bladeNormal = rotate(vec3(0, 0, 1), vec3(0, angle, 0))

      //做法	                    法线指向	              观感	                成本
      // 现在：借地面法线           当地坡度（大致朝上）     草地像地毯，和山坡一体   最低
      // 每片草用面法线            垂直叶片（大致水平）      卡片感，一侧死黑        低
      // 折中：朝上 + 一点叶片朝向   介于两者之间            多数游戏用这个          低
      grassNormalVarying.assign(
        normal
          // .mul(0.75)
          // .add(bladeNormal.mul(0.25))
          // .normalize()
      )

      return translated
    })()

    material.colorNode=Fn(()=>{
      return grassColorVarying
    })()
    //叶子有多亮、高光在哪
    //通常每个顶点都要带一个法线，所以三角草一般是 3 个法线值。但三个可以相同
    material.normalNode=Fn(()=>{
      return transformNormalToView(grassNormalVarying)
    })()
  }

  const loadWater=()=>{
    const geometry = new THREE.PlaneGeometry(10, 10)
    const material = new THREE.MeshStandardNodeMaterial({ transparent: true })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = 0.65
    mesh.rotation.x = - Math.PI * 0.5
    mesh.receiveShadow = true
    root.add(mesh)

    //backdropNode:该片元的颜色来自其背后已渲染的场景,一般要先transparent:true,且背后要先画好
    //colorNode:该片元的颜色来自其自己
    material.backdropNode = Fn(() =>
    {
      // Water depth
      //waterDepth 表示：沿着视线，从水面到「水面后面那东西」之间，隔了多厚的
      //相机射线 ----> 水面 ----------> 水下地面
      //            ↑                ↑
      //       linearDepth()   viewportLinearDepth
      //            |←——  射线长度  ——→|
      const waterDepth = viewportLinearDepth //射线从相机到 waterMesh 背后最近实体 的线性长度[0,1],camera.near处,其为0.far处其为1
        .sub(linearDepth()) //linearDepth:射线从相机near处到该waterMesh的线性长度,在far处其线性长度为1
        .mul(cameraFar.sub(cameraNear)) //沿相机深度方向的水厚（场景单位）
        .max(0)
      //解决waterMesh后面没有实体，导致waterDepth 过长
      If(waterDepth.greaterThan(20), () => { waterDepth.assign(1) })
      return vec3(waterDepth)
      // Blur
      const blurAmount = waterDepth.mul(0.02)
      const newColor = hashBlur(viewportSharedTexture(), blurAmount, { repeats: 25 })

      // Absorption
      const absorption = vec3(0.45, 0.07, 0.01)
      const transmittance = absorption.negate().mul(waterDepth).mul(7).exp()
      newColor.mulAssign(transmittance)

      return newColor
    })()

  }

  computeFloorNormal()
  loadFloor()
  loadGrass()
  loadWater()

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
