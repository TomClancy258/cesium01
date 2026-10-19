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

  const loadFloor = (): void => {
    const floorTexture = textureLoader.load(FLOOR_URL)
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
      const indexUV=uvec2(
        instanceIndex.mod(resolution),
        instanceIndex.div(resolution)
      )

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

      // Store
      //单位向量的每个分量都∈[-1,1]
      const _color = vec4(normal.remap(-1, 1), 1)
      // const _color = vec3(normal.remap(-1, 1))
      textureStore(terrainNormalTexture, indexUV, _color).toWriteOnly() //这里在设置terrainNormalTexture
    })().compute(resolution * resolution)

    threeRenderer.compute(computeNormal)
  }

  const loadGrass=()=>{
    const subdivisions = 100
    const count = subdivisions * subdivisions
    const size = 10
    const halfSize = size * 0.5
    const cellSize = size / subdivisions
    const halfCellSize=cellSize/2

    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array( [
      -0.25, 0.0,  0.0, // v0
      0.25, 0.0,  0.0, // v0
      0.0,  1.0,  0.0, // v2
    ] );
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    const material = new THREE.MeshStandardNodeMaterial( { side: THREE.DoubleSide } );
    const mesh = new THREE.Mesh( geometry, material );
    mesh.count = count
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.position.y=1
    root.add(mesh)

    const instancePositionsArray = new Float32Array(count * 3)
      for (let iX = 0; iX < subdivisions; iX++) {
        for (let iZ = 0; iZ < subdivisions; iZ++) {
        const grassIndex=iX*subdivisions+iZ
          const i=grassIndex*3
          //无push方法
        // instancePositionsArray.push(halfCellSize+iZ*cellSize, 0.0, halfCellSize+iX*cellSize)
          instancePositionsArray[i+0]=halfCellSize+iZ*cellSize-halfSize
          instancePositionsArray[i+1]=0.0
          instancePositionsArray[i+2]=halfCellSize+iX*cellSize-halfSize
      }
    }
    const instancePositions = new THREE.InstancedBufferAttribute(instancePositionsArray, 3)

    material.positionNode=Fn(()=>{
      const instancePosition = instancedBufferAttribute(instancePositions) //当前这棵草的 xz
      const scale=range(0.7,1).mul(0.4)
      const scaled=positionGeometry.mul(scale)
      const newPosition = scaled.add(instancePosition)
      return newPosition
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
