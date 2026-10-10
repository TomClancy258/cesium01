import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import type { ShallowRef } from 'vue'
import { createMagicExplosion, type ExplosionInstance } from './magic-explosion'
import {
  materialEmissive, pass, uv,
  positionViewDirection,
  lessThanEqual,
  select,
  add,
  pow,
  color,
  dot,
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

export interface SetupExplosionOptions {
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
const MAGIC_EXPLOSION_URL = '/textures/shield/simplex-tiling-noise-256x256.png'
const FLOOR_URL = '/textures/floor/floor-color.jpg'

/**
 * 护盾演示：createMagicExplosion 工厂 + 本函数装配场景 / 拾取 / bloom / dispose。
 */
export async function setupMagicExplosion(
  options: SetupExplosionOptions,
): Promise<{ dispose: () => void } | null> {
  const { scene, camera, renderer, controls, setFrameRender, registerObject, unregisterObject, setPickingBlocked } =
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
  root.name = 'explosion-demo'
  threeScene.add(root)

  let dracoLoader: DRACOLoader | null = null
  let anvilScene: THREE.Object3D | null = null
  let floorMesh: THREE.Mesh | null = null
  let explosion: ExplosionInstance | null = null
  let transform: TransformControls | null = null
  let renderPipeline: InstanceType<typeof THREE.RenderPipeline> | null = null

  const createGltfLoader = (): GLTFLoader => {
    dracoLoader ??= new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    return loader
  }

  const hexagonsTexture = await new THREE.TextureLoader().loadAsync(MAGIC_EXPLOSION_URL)
  hexagonsTexture.wrapS = THREE.RepeatWrapping
  hexagonsTexture.wrapT = THREE.RepeatWrapping

  explosion = createMagicExplosion({ texture: hexagonsTexture })
  explosion.mesh.name = 'explosion'
  root.add(explosion.mesh)
  // registerObject?.(explosion.mesh)

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
    // const uvFromCenter=uv().sub(0.5).mul(2)
    // const distToCenter=length(uvFromCenter)
    // const distToCenterAA=max(fwidth(distToCenter),0.002)
    // const radius=float(0.8)
    // const floorShape=smoothstep(radius.sub(distToCenterAA),radius.add(distToCenterAA),distToCenter).oneMinus()
    //
    // floorMaterial.opacityNode = floorShape

    floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), floorMaterial)
    floorMesh.rotation.x = -Math.PI * 0.5
    floorMesh.receiveShadow = true
    floorMesh.renderOrder = -1
    floorMesh.position.set(-1,1,-1)
    root.add(floorMesh)

    registerObject?.(floorMesh)
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
        if ('map' in material && material.map instanceof THREE.Texture) {
          material.map.anisotropy = 8
        }
      })
    })
    anvilScene = gltf.scene
    root.add(gltf.scene)
  }

  loadFloor()
  try {
    // await loadAnvilModel()
  } catch (error) {
    console.error('[setupGalaxy] failed to load anvil', { url: ANVIL_MODEL_URL, error })
  }

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

    const explosionGui = inspector.createParameters('Explosion')
    explosionGui
      .add(explosion.radius, 'value', 0, 5, 0.01)
      .name('radius')
      .onChange((value: number) => {
        explosion?.setRadius(value)
      })
    explosionGui.addColor(explosion.colorA, 'value').name('colorA')
    explosionGui.addColor(explosion.colorB, 'value').name('colorB')
    explosionGui.add(explosion.strength, 'value', 1, 100, 0.01).name('strength')
  }

  // TransformControls
  // transform = new TransformControls(threeCamera, canvas)
  // transform.attach(explosion.mesh)
  // threeScene.add(transform.getHelper())
  // transform.addEventListener('dragging-changed', (event) => {
  //   if (controls.value) {
  //     controls.value.enabled = !event.value
  //   }
  // })
  // setPickingBlocked?.(() => Boolean(transform?.dragging))

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

    if (explosion) {
      unregisterObject?.(explosion.mesh)
    }

    if (transform) {
      transform.detach()
      threeScene.remove(transform.getHelper())
      transform.dispose()
      transform = null
    }

    if (explosion) {
      root.remove(explosion.mesh)
      explosion.dispose()
      explosion = null
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

  return { dispose,addExplosion:explosion.addExplosion }
}
