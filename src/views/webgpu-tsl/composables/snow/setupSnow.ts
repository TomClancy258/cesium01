import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import type { ShallowRef } from 'vue'
import { hashBlur } from 'three/addons/tsl/display/hashBlur.js'

import {
  materialEmissive,
  pass,
  uv,
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
  vec3,
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

const objectsOptions = {
  wireframe: false,
  animated: true,
}

const DRACO_DECODER_PATH = '/draco/gltf/'
const ANVIL_MODEL_URL = 'model/others/anvil.glb'
const MICHELLE_MODEL_URL = 'model/role/Michelle.glb'
const SNOW_NORMAL_URL = '/textures/floor/snow_field_aerial_nor_gl_2k.png'

/**
 * 护盾演示：createShield 工厂 + 本函数装配场景 / 拾取 / bloom / dispose。
 */
export async function setupSnow(
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
    onBeforeRender,
  } = options
  if (!scene.value || !camera.value || !renderer.value) {
    console.error('[setupGalaxy] scene/camera/renderer is not ready')
    return null
  }

  const threeScene = scene.value
  const threeCamera = camera.value
  const threeRenderer = renderer.value
  const canvas = threeRenderer.domElement

  const root = new THREE.Group()
  root.position.set(-1, -1, -3)
  // root.rotation.z =- Math.PI / 4
  // root.rotateZ(Math.PI / 4)
  root.name = 'shield-demo'
  threeScene.add(root)

  let dracoLoader: DRACOLoader | null = null
  let gltfLoader: GLTFLoader | null = null
  let michelleScene: THREE.Object3D | null = null
  let michelleMixer: THREE.AnimationMixer | null = null
  let titleMesh: THREE.Mesh | null = null
  let shield: ShieldInstance | null = null
  let transform: TransformControls | null = null
  let renderPipeline: InstanceType<typeof THREE.RenderPipeline> | null = null
  const textureLoader = new THREE.TextureLoader()
  let terrainNormalTexture = null

  const getGltfLoader = (): GLTFLoader => {
    if (gltfLoader) return gltfLoader
    // 空值合并赋值：只有左边是 null 或 undefined 时，才赋右边
    dracoLoader ??= new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)
    gltfLoader = new GLTFLoader()
    gltfLoader.setDRACOLoader(dracoLoader)
    return gltfLoader
  }

  const loadMichelleModel = async (): Promise<void> => {
    const loader = getGltfLoader()
    const model = await loader.loadAsync(MICHELLE_MODEL_URL)
    const michelle = model.scene
    const michelleMesh = michelle.children[0].children[0] as THREE.Mesh
    if (michelleMesh.material && 'side' in michelleMesh.material) {
      michelleMesh.material.side = THREE.FrontSide
      if ('wireframe' in michelleMesh.material) {
        michelleMesh.material.wireframe = objectsOptions.wireframe
      }
    }
    michelleMesh.castShadow = true
    michelleMesh.receiveShadow = true
    michelle.scale.setScalar(2)
    //michelle.scale.set(2, 2, 2) //等价写法，且必须写三个参数对应xyz上的放大

    michelleScene = michelle
    root.add(michelle)
    michelleScene.position.set(-3, 0, 2.8)

    // play() 只启动；每帧还要 mixer.update(delta) 才会推进骨骼
    if (model.animations.length > 0) {
      michelleMixer = new THREE.AnimationMixer(michelle)
      michelleMixer.clipAction(model.animations[0]).play()
    }
  }

  const snowNormalTexture = textureLoader.load(SNOW_NORMAL_URL)

  let floorMesh=null
  const loadSnow = (): void => {
    const size = 20
    const resolution = 512
    // const resolution = 256
    const thickness = uniform(0.3)

    // snowNormalTexture.colorSpace = THREE.NoColorSpace
    snowNormalTexture.wrapS = THREE.RepeatWrapping
    snowNormalTexture.wrapT = THREE.RepeatWrapping

    snowNormalTexture.repeat.x = 3
    snowNormalTexture.repeat.y = 3

    const material = new THREE.MeshStandardNodeMaterial({
      normalMap: snowNormalTexture,
      roughness: 0.5,
      side: THREE.DoubleSide,
      transparent: true,
    })

    floorMesh = new THREE.Mesh(
      //512 × 512 个四边形格子 = 512 × 512 × 2 ≈ 52.4 万个三角面
      //沿宽：widthSegments 段 → 顶点列数 = widthSegments + 1
      // 沿高：同理 → 顶点行数 = heightSegments + 1
      //∴顶点数：(512+1) × (512+1) ≈ 26.3 万
      new THREE.PlaneGeometry(size, size, resolution, resolution),
      material,
    )

    // material.opacityNode = uv().sub(0.5).length().smoothstep(0.5, 0.35)
    //下面更好
    material.opacityNode = uv().sub(0.5).length().smoothstep(0.35, 0.5).oneMinus()

    const snowElevation = Fn(([ position ]) =>
    {
      const snowUV = position.div(size).add(0.5)
      return texture(depthTexture, snowUV).r
    })

    material.positionNode = Fn(() =>
    {
      // Elevation
      const newPosition = positionLocal.toVar()
      newPosition.z.addAssign(snowElevation(newPosition.xy))

      // Normal
      // const spacing = size / resolution
      // const positionA = positionLocal.add(vec3(spacing, 0, 0))
      // const positionB = positionLocal.add(vec3(0, spacing, 0))
      // positionA.z.addAssign(snowElevation(positionA.xy))
      // positionB.z.addAssign(snowElevation(positionB.xy))
      // const toA = positionA.sub(newPosition).normalize()
      // const toB = positionB.sub(newPosition).normalize()
      // normalLocal.assign(cross(toA, toB))

      return newPosition
    })()

    floorMesh.rotation.x = -Math.PI * 0.5
    floorMesh.receiveShadow = true
    floorMesh.castShadow = true
    floorMesh.renderOrder = -1
    root.add(floorMesh)
    // 显示用密网格；鼠标跟球用下面的数学平面，不要 registerObject(floorMesh)
  }

  let boxMesh: null | THREE.Mesh = null
  const loadBox = () => {
    boxMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ wireframe: objectsOptions.wireframe, color: 0xf5f5f5 }),
    )
    boxMesh.castShadow = true
    boxMesh.receiveShadow = true
    boxMesh.material.shadowSide = THREE.FrontSide
    boxMesh.position.y = 0.75
    root.add(boxMesh)
  }

  let sphereMesh: null | THREE.Mesh = null
  const loadSphere = () => {
    sphereMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.65, 1),
      new THREE.MeshStandardMaterial({ wireframe: objectsOptions.wireframe, color: 0xf5f5f5 }),
    )
    sphereMesh.castShadow = true
    sphereMesh.receiveShadow = true
    sphereMesh.material.shadowSide = THREE.FrontSide
    sphereMesh.position.y = 0.5
    root.add(sphereMesh)
  }
  loadBox()
  loadSphere()

  const setBoxAnimation = (elapsedTime: number) => {
    if (!boxMesh) return
    const radius = 2
    const angle = elapsedTime * 0.6
    boxMesh.position.z = radius * Math.sin(angle)
    boxMesh.position.x = radius * Math.cos(angle)
    boxMesh.rotation.x = elapsedTime
    boxMesh.rotation.z = elapsedTime * 1.23
  }

  /**
   * Common
   */
  const size = 20
  const resolution = 512
  const thickness = uniform(0.3)
  const blurStrength = uniform(5)
  const accumulationStrength = uniform(0.03)
  let depthCamera=null
  const loadOrthographicCamera = () => {
    /**
     * Depth
     */
    const halfSize = size * 0.5
    const near = 1
    const safe = uniform(1)
    const far = near + safe.value + thickness.value

    // Camera
    //const camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
    //         top = height/2
    //             ↑
    //     ┌───────┼───────┐
    //     │       │       │
    // left│       ●       │right
    // -width/2    │    +width/2
    //     │       │       │
    //     └───────┼───────┘
    //             ↓
    //        bottom = -height/2
    //
    // near = 1 ……………… far = 1000   （沿视线深度）
    depthCamera = new THREE.OrthographicCamera(
      -halfSize,
      halfSize,
      halfSize,
      -halfSize,
      near,
      far,
    )
    depthCamera.position.y = -(near + safe.value)
    depthCamera.rotation.x = Math.PI * 0.5
    root.add(depthCamera)

    const cameraHelper = new THREE.CameraHelper(depthCamera)
    threeScene.add(cameraHelper)
  }

  let depthRenderTarget=null
  let depthTexture=null
  let depthMaterial=null
  //这是给雪地**「从下往上拍深度」**用的，用来算物体压进雪多深（脚印/挖坑）
  //从下雪地往上看「谁压进来了」，好在雪上挖坑
  const loadRenderTarget = () => {
    // Render target
    //离屏画布，不画到屏幕上。分辨率和雪高图一样（如 512），一一对应。
    //即：离屏渲染容器
    depthRenderTarget = new THREE.RenderTarget(resolution, resolution)

    // Depth texture
    //DepthTexture 挂到 depthRenderTarget.depthTexture
    //这次离屏渲染只关心深度，结果写进这张深度图。
    // 每个像素：从 depthCamera 看，最近物体有多远。
    //即：存「谁压在雪上、压多深」
    depthTexture = new THREE.DepthTexture()
    depthRenderTarget.depthTexture = depthTexture

    // Depth material
    //临时覆盖场景材质，颜色无所谓，只要物体写入深度。
    // （颜色可以全黑，深度缓冲照样更新。）
    //即：让物体只贡献深度，方便画这张图
    depthMaterial = new THREE.NodeMaterial()
    depthMaterial.fragmentNode = vec4(0, 0, 0, 1)
  }
  loadRenderTarget()
  loadOrthographicCamera()

  // // Debug mesh
  const loadDebugMesh = () => {
    const debugMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.NodeMaterial())
    //debugMesh显示depthRenderTarget的内容
    // debugMesh.material.fragmentNode = vec4(texture(snowTexture).r, 0, 0, 1)
    debugMesh.material.fragmentNode = vec4(texture(depthTexture).r, 0, 0, 1)
    // debugMesh.material.fragmentNode = texture(depthRenderTarget.texture)
    debugMesh.position.y = 2.5
    debugMesh.scale.setScalar(2)
    root.add(debugMesh)
  }
  loadDebugMesh()

  //depthRenderTarget显示depthCamera的内容
  const renderSnowDepth=()=>{
    //临时改渲染器去画别的东西前，先把当前状态存起来，画完再还原，避免搞乱后面的正常画面 / bloom。
    const rendererState = THREE.RendererUtils.resetRendererState(renderer.value)

    //Render depth
    //false = 拍深度时别让地板掺和
    floorMesh.visible = false
    scene.value.overrideMaterial = depthMaterial
    //用 depthCamera（地板下朝上） 把场景画进 离屏 depthRenderTarget，不画到屏幕。
    renderer.value.setRenderTarget(depthRenderTarget)
    renderer.value.render(scene.value, depthCamera)

    //Restore
    floorMesh.visible = true
    scene.value.overrideMaterial = null
    renderer.value.setRenderTarget(null)
    THREE.RendererUtils.restoreRendererState(renderer.value, rendererState)
  }

  // 数学平面求交（教程做法）：pointer 只更新 NDC，每帧 O(1) 求交 + 插值
  const cursorNdc = new THREE.Vector2()
  const sphereRaycaster = new THREE.Raycaster()
  // 无限平面平行于xz平面，垂直于y轴，
  // 相对世界 xz 平面（y=0）：在下方 1 个单位（距离是 |root.position.y|，位置由符号决定）
  const intersectionPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -root.position.y)
  const groundHit = new THREE.Vector3()
  const groundHitLocal = new THREE.Vector3()

  const onSpherePointerMove = (event: PointerEvent): void => {
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    //x、y∈[-1, 1]，原点在屏幕中心
    cursorNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    cursorNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }
  canvas.addEventListener('pointermove', onSpherePointerMove)

  const updateSphereFollow = (frameDelta: number): void => {
    if (!sphereMesh) return
    // intersectionPlane.set(new THREE.Vector3(0, 1, 0), -root.position.y)
    sphereRaycaster.setFromCamera(cursorNdc, threeCamera)
    //groundHit世界坐标
    if (!sphereRaycaster.ray.intersectPlane(intersectionPlane, groundHit)) return
    groundHitLocal.copy(groundHit)
    root.worldToLocal(groundHitLocal)
    //阻尼效果
    sphereMesh.position.x += (groundHitLocal.x - sphereMesh.position.x) * frameDelta * 3
    sphereMesh.position.z += (groundHitLocal.z - sphereMesh.position.z) * frameDelta * 3
    // sphereMesh.position.x = groundHitLocal.x
    // sphereMesh.position.z = groundHitLocal.z
    // sphereMesh.position.y = 0.5
  }

  loadSnow()

  try {
    await loadMichelleModel()
  } catch (error) {
    console.error('[setupGalaxy] failed to load anvil', { url: MICHELLE_MODEL_URL, error })
  }

  const timer = new THREE.Timer()
  timer.connect(document)

  const unsubscribeBeforeRender = onBeforeRender(() => {
    timer.update()
    const deltaTime = Math.min(1 / 30, timer.getDelta())
    const elapsedTime = timer.getElapsed()
    michelleMixer?.update(deltaTime)
    setBoxAnimation(elapsedTime)
    updateSphereFollow(deltaTime)

    renderSnowDepth()
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
      const materials = Array.isArray(child.material) ? child.material : [child.material]
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
    canvas.removeEventListener('pointermove', onSpherePointerMove)
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

    if (michelleMixer) {
      michelleMixer.stopAllAction()
      michelleMixer = null
    }
    if (michelleScene) {
      root.remove(michelleScene)
      disposeObject3D(michelleScene)
      michelleScene = null
    }

    threeScene.remove(root)
    gltfLoader = null
    dracoLoader?.dispose()
    dracoLoader = null
  }

  return {
    dispose,
  }
}

// Standard → 真光照（方向光、阴影、PBR） 【map:texture】
// Matcap  → 假光照（一张图） 【matcap:texture】
//Basic   → 无光照 【map:texture，无法设置光照效果，颜色基本就是 color / map 原样，也没有靠灯产生的高光、阴影接收（除非用别的套路）】

//若要光照：
//需求	            用
// 真光照、阴影     MeshStandardMaterial / Lambert / Phong
// 假光照、省性能    MeshMatcapMaterial（matcap 贴图）
// 完全不受灯        MeshBasicMaterial
