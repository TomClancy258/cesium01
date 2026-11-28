import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { ShallowRef } from 'vue'
import gsap from 'gsap'
import { Pane } from 'tweakpane'
import {
  Fn,
  max,
  pow,
  color,
  instancedBufferAttribute,
  float,
  uniform,
  texture,
  smoothstep,
  reflect,
  cameraPosition,
  select,
  remapClamp,
  remap,
  hash,
  step,
  mix,
  addAssign,
  mulAssign,
  negate,
  min,
  frontFacing,
  mul,
  oneMinus,
  mx_noise_float,
  mx_noise_vec3,
  positionLocal,
  rotate,
  normalize,
  normalWorld,
  time,
  uv,
  fwidth,
  dot,
  vec2,
  positionWorld,
  vec3,
  sin,
} from 'three/tsl'

type BeforeRenderHandle = (fn: () => void) => () => void

export interface CoffeeSmokeOptions {
  scene: ShallowRef<THREE.Scene | null>
  camera: ShallowRef<THREE.Camera | null>
  renderer: ShallowRef<THREE.WebGPURenderer | null>
  controls: ShallowRef<OrbitControls | null>
  onBeforeRender: BeforeRenderHandle,
  registerObject,
  unregisterObject,
}

/** 与泵站一致：Draco 解码器放在 public/draco/gltf */
const DRACO_DECODER_PATH = '/draco/gltf/'

/** Journey 咖啡烟雾烘焙模型，放在 public/model/others/bakedModel.glb */
const SUZANNE_MODEL_URL = 'model/others/suzanne.glb'

/**
 * 咖啡烟雾场景：按泵站方式用 GLTFLoader + Draco 加载 baked 模型。
 */
export async function setupLightsShading(
  options: CoffeeSmokeOptions,
): Promise<{ dispose: () => void } | null> {
  const { scene } = options
  if (!scene.value) {
    console.error('[setupCoffeSmoke] scene is not ready')
    return null
  }

  const root = new THREE.Group()
  root.name = 'coffee-smoke'
  scene.value.add(root)
  root.position.set(0, 2, -3)

  let dracoLoader: DRACOLoader | null = null
  let suzanneScene: THREE.Group | THREE.Object3D | null = null
  const textureLoader = new THREE.TextureLoader()

  const createGltfLoader = (): GLTFLoader => {
    dracoLoader ??= new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    return loader
  }

  const entityParams={
    //tsl里的color是rgb
    uColor:uniform(color('#23a29b')),
  }
  const ambientLightParams={
    uColor:uniform(color('white')),
    // uColor:uniform(new THREE.Color('blue')), //都行
    uIntensity:uniform(float(0.2))
  }
  const directionalLightParams={
    uColor:uniform(color(0,1,0)),
    uIntensity:uniform(float(0.5)),
    uPosition:uniform(vec3(2,2,2)),
    uTargetPosition:uniform(vec3(0,0,0)),
  }
  const pointLightParams={
    uColor:uniform(color(1,0,0)),
    uIntensity:uniform(float(0.5)),
    uPosition:uniform(vec3(-2,4,-2)),
    uDecay:uniform(float(0.5)),
  }

  let material=null
  const createMaterial=()=>{
    //material=new THREE.MeshStandardNodeMaterial({
    material=new THREE.MeshBasicNodeMaterial({
      side:THREE.DoubleSide
    })

    const ambientLight=Fn(([color=vec3(0,0,0),intensity=float(1)])=>{
      return color.mul(intensity)
    })

    const directionalLight=Fn((
      [color=vec3(0,0,0),position=vec3(1,1,1),
        intensity=float(0.2),targetPosition=vec3(0,0,0)])=>{
      const directionLightDir=position.sub(targetPosition).normalize()
      const normalDir=normalWorld.normalize()
      const shading=directionLightDir.dot(normalDir).max(0)

      const reflection=directionLightDir.negate().reflect(normalDir)
      const viewDirection=positionWorld.sub(cameraPosition).normalize()
      const specular=reflection.dot(viewDirection).negate().max(0)
      specular.assign(specular.pow(20))

      return color.mul(shading).mul(intensity)
        .add(specular.mul(color,intensity))
    })

    const pointLight=Fn((
      [color=vec3(0,0,0),position=vec3(1,1,1),
        intensity=float(0.2),decay=float(1)])=>{
      const pointLightVector=position.sub(positionWorld)
      const pointLightDir=pointLightVector.normalize()
      const normalDir=normalWorld.normalize()
      const shading=pointLightDir.dot(normalDir).max(0)

      const reflection=pointLightDir.negate().reflect(normalDir)
      const viewDirection=positionWorld.sub(cameraPosition).normalize()
      const specular=reflection.dot(viewDirection).negate().max(0)
      specular.assign(specular.pow(20))

      const pointLightDist=pointLightVector.length().mul(decay).oneMinus().max(0)

      return color.mul(shading,intensity,pointLightDist)
        .add(specular.mul(color,intensity,pointLightDist))
    })
    material.colorNode=Fn(()=>{
      const ambient=ambientLight(ambientLightParams.uColor,ambientLightParams.uIntensity)
      const direction=directionalLight(
        directionalLightParams.uColor,directionalLightParams.uPosition,
        directionalLightParams.uIntensity,directionalLightParams.uTargetPosition
      )
      const point=pointLight(
        pointLightParams.uColor,pointLightParams.uPosition,
        pointLightParams.uIntensity,pointLightParams.uDecay
      )
      const light=vec3(0,0,0)//表示啥颜色也没有
      light.addAssign(ambient)
      light.addAssign(direction)
      light.addAssign(point)
      const color=entityParams.uColor
        .mul(light)
      return color
    })()
  }
  createMaterial()

  let torusKnot: THREE.Mesh | null = null
  const createTorusKnot=()=>{
    torusKnot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.6, 0.25, 128, 32),
      material
    )
    torusKnot.position.x = 3
    root.add(torusKnot)
  }
  createTorusKnot()

  let sphere: THREE.Mesh | null = null
  const createSphere=()=>{
    sphere = new THREE.Mesh(
      new THREE.SphereGeometry(),
      material
    )
    sphere.position.x = - 3
    root.add(sphere)
  }
  createSphere()

  const loadSuzanneModel = async (): Promise<void> => {
    const loader = createGltfLoader()
    const gltf = await loader.loadAsync('model/others/suzanne.glb')
    const modelName = 'suzanneModel'
    gltf.scene.name = modelName
    suzanneScene = gltf.scene
    suzanneScene.traverse((child) => {
      if (child.isMesh) child.material = material
    })

    root.add(gltf.scene)
  }

  let directionalLightHelper=null
  const syncDirectionalHelperColor = () => {
    directionalLightHelper.material.color.copy(directionalLightParams.uColor.value)
  }
  const syncDirectionalHelperPosition = () => {
    directionalLightHelper.position.copy(directionalLightParams.uPosition.value)
    directionalLightHelper.lookAt(directionalLightParams.uTargetPosition.value)
  }
  const syncDirectionalHelperLookAt = () => {
    directionalLightHelper.lookAt(directionalLightParams.uTargetPosition.value)
  }
  const createDirectionLightHelper=()=>{
    directionalLightHelper = new THREE.Mesh(
      new THREE.PlaneGeometry(),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
    )
    syncDirectionalHelperColor()
    syncDirectionalHelperPosition()
    scene.value.add(directionalLightHelper)
  }
  createDirectionLightHelper()

  let pointLightHelper=null
  const syncPointHelperColor = () => {
    pointLightHelper.material.color.copy(pointLightParams.uColor.value)
  }
  const syncPointHelperPosition = () => {
    pointLightHelper.position.copy(pointLightParams.uPosition.value)
  }
  const createPointLightHelper=()=>{
    pointLightHelper = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.1, 2),
      new THREE.MeshBasicNodeMaterial()
    )
    syncPointHelperColor()
    syncPointHelperPosition()
    scene.value.add(pointLightHelper)
  }
  createPointLightHelper()

  const timer = new THREE.Timer()
  timer.connect(document)
  const unsubscribeBeforeRender = options.onBeforeRender(() => {
    timer.update()
    const elapsed = timer.getElapsed()
    rotateEntities(elapsed)
  })

  const rotateEntities=(elapsed:number)=>{
    if (suzanneScene) {
      suzanneScene.rotation.x = -elapsed * 0.1
      suzanneScene.rotation.y = elapsed * 0.2
    }

    if (sphere) {
      sphere.rotation.x = - elapsed * 0.1
      sphere.rotation.y = elapsed * 0.2
    }

    if (torusKnot) {
      torusKnot.rotation.x = - elapsed * 0.1
      torusKnot.rotation.y = elapsed * 0.2
    }
  }

  try {
    await loadSuzanneModel()
  } catch (error) {
    console.error('[setupCoffeSmoke] failed to load bakedModel', {
      url: SUZANNE_MODEL_URL,
      error,
    })
  }

  const disposeObject3D = (object: THREE.Object3D): void => {
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.geometry?.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        if (!material) return
        // 与泵站一致：扫材质上所有 Texture，再 dispose material
        Object.values(material).forEach((value) => {
          if (value instanceof THREE.Texture) value.dispose()
        })
        material.dispose()
      })
    })
  }

  let paneContainer=null
  let lightPane=null
  const createPane = () => {
    //不会自动清掉。 局部变量出作用域，只是 JS 里没名字了；DOM 和 Pane 内部监听还挂着。
    paneContainer = document.createElement('div')
    Object.assign(paneContainer.style, {
      position: 'fixed',
      top: '100px',
      right: '8px',
      // zIndex: '1000',
    })
    document.body.appendChild(paneContainer)

    lightPane = new Pane({ title: 'Lights', container:paneContainer })

    const entityFolder = lightPane.addFolder({ title: 'Entity' })
    entityFolder.addBinding(entityParams.uColor, 'value', {
      label: 'uColor',
      color: { type: 'float' },
    })

    const ambientFolder = lightPane.addFolder({ title: 'Ambient' })
    ambientFolder.addBinding(ambientLightParams.uColor, 'value', {
      label: 'uColor',
      color: { type: 'float' },
    })
    ambientFolder.addBinding(ambientLightParams.uIntensity, 'value', {
      label: 'uIntensity',
      min: 0,
      max: 2,
      step: 0.01,
    })

    const directionFolder = lightPane.addFolder({ title: 'Direction' })
    directionFolder
      .addBinding(directionalLightParams.uColor, 'value', {
        label: 'uColor',
        color: { type: 'float' },
      })
      .on('change', syncDirectionalHelperColor)
    directionFolder.addBinding(directionalLightParams.uIntensity, 'value', {
      label: 'uIntensity',
      min: 0,
      max: 2,
      step: 0.01,
    })
    directionFolder
      .addBinding(directionalLightParams.uPosition, 'value', {
        label: 'uPosition',
        x: { min: -10, max: 10, step: 0.01 },
        y: { min: -10, max: 10, step: 0.01 },
        z: { min: -10, max: 10, step: 0.01 },
      })
      .on('change', syncDirectionalHelperPosition)
    directionFolder
      .addBinding(directionalLightParams.uTargetPosition, 'value', {
        label: 'uTargetPosition',
        x: { min: -10, max: 10, step: 0.01 },
        y: { min: -10, max: 10, step: 0.01 },
        z: { min: -10, max: 10, step: 0.01 },
      })
      .on('change', syncDirectionalHelperLookAt)

    const pointFolder = lightPane.addFolder({ title: 'Point' })
    pointFolder
      .addBinding(pointLightParams.uColor, 'value', {
        label: 'uColor',
        color: { type: 'float' },
      })
      .on('change', syncPointHelperColor)
    pointFolder.addBinding(pointLightParams.uIntensity, 'value', {
      label: 'uIntensity',
      min: 0,
      max: 2,
      step: 0.01,
    })
    pointFolder.addBinding(pointLightParams.uDecay, 'value', {
      label: 'uDecay',
      min: 0,
      max: 1,
      step: 0.01,
    })
    pointFolder
      .addBinding(pointLightParams.uPosition, 'value', {
        label: 'uPosition',
        x: { min: -10, max: 10, step: 0.01 },
        y: { min: -10, max: 10, step: 0.01 },
        z: { min: -10, max: 10, step: 0.01 },
      })
      .on('change', syncPointHelperPosition)
  }
  createPane()

  const dispose = (): void => {
    if (suzanneScene) {
      root.remove(suzanneScene)
      disposeObject3D(suzanneScene)
      suzanneScene = null
    }

    if (plane) {
      options.unregisterObject?.(plane)
      root.remove(plane)
      plane.geometry.dispose()//这里加";"，下面开头就不需加
      //Mesh.material 的类型是 Material | Material[]，数组没有 .dispose()，
      // 所以直接写 plane.material.dispose() 有时会报类型错。
      ;(plane.material as THREE.Material).dispose()
      plane = null
    }

    activeFireworks.slice().forEach((destroy) => destroy())

    textures.forEach((t) => t.dispose())

    unsubscribeBeforeRender()
    scene.value?.remove(root)
    dracoLoader?.dispose()
    dracoLoader = null

    if (lightPane) {
      pane.dispose()
    }
    if (paneContainer) {
      paneContainer.remove()
    }
  }

  return { dispose }
}

//sizeAttenuation: true（默认）时，Three 会按粒子到相机的深度做透视缩放：近大远小。
