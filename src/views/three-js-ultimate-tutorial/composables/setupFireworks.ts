import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { ShallowRef } from 'vue'
import gsap from 'gsap'
import {
  Fn,
  max,
  pow,
  instancedBufferAttribute,
  float,
  uniform,
  texture,
  smoothstep,
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
export async function setupFireworks(
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
  root.position.set(0, 2, -0.1)

  let dracoLoader: DRACOLoader | null = null
  let suzanneScene: THREE.Group | THREE.Object3D | null = null
  const textureLoader = new THREE.TextureLoader()
  /**
   * Fireworks
   */
  const textures = [
    textureLoader.load('/textures/particles/1.png'),
    textureLoader.load('/textures/particles/2.png'),
    textureLoader.load('/textures/particles/3.png'),
    textureLoader.load('/textures/particles/4.png'),
    textureLoader.load('/textures/particles/5.png'),
    textureLoader.load('/textures/particles/6.png'),
    textureLoader.load('/textures/particles/7.png'),
    textureLoader.load('/textures/particles/8.png'),
  ]

  const createGltfLoader = (): GLTFLoader => {
    dracoLoader ??= new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    return loader
  }

  let plane: THREE.Mesh | null = null
  const createPlane=()=>{
    plane=new THREE.Mesh(
      new THREE.PlaneGeometry(20,10),
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent:true,
        opacity: 0.3,
        color:'#000000'
      })
    )
    root.add(plane)

    options.registerObject?.(plane)

  }
  createPlane()
  const activeFireworks: Array<() => void> = [] // 存每朵的 destroy

  //为啥不会「替换」：
  // 共享 geometry 只表示：怎么画一张朝相机的四边形用同一套顶点。
  // 每颗烟花的「在哪炸、多少粒子、进度」在自己的 material + instance attribute + object.position 里。
  //
  // 类比：共用一张「纸的形状模板」，但墨水、内容、贴在墙上的位置各用各的——两张画可以同时挂着。
  //
  // 之前报错，是因为 geometry.dispose() 把这唯一的模板拆了，所有 Sprite 一起坏；不是因为第二次创建覆盖了第一次。
  const createFireworks = (position=new THREE.Vector3(0,0,0),count,radius,size,fireworksTexture,color) => {
    const positions=new Float32Array(count*3)
    const sizes=new Float32Array(count)

    const sphericalPosition = new THREE.Vector3()
    //这是在以原点为中心的球坐标里取一个随机点
    for (let i = 0; i < count; i++) {
      const spherical = new THREE.Spherical(
        radius * (0.75 + Math.random() * 0.25),
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2
      )
      //它只是把球坐标 (radius, theta, phi) 转成笛卡尔坐标 (x, y, z)，仍相对局部原点 (0,0,0)，不是世界坐标。
      sphericalPosition.setFromSpherical(spherical)

      const i3=i*3
      positions[i3]=sphericalPosition.x
      positions[i3+1]=sphericalPosition.y
      positions[i3+2]=sphericalPosition.z

      sizes[i]=Math.random()*size
    }

    const positionAttribute=new THREE.InstancedBufferAttribute(positions,3)
    const sizeAttribute=new THREE.InstancedBufferAttribute(sizes,1)
    //铁砧：positions / velocities / lives 要 compute 爆炸、每帧更新 → 必须 instancedArray。
    //烟花：球面方向 CPU 预烘焙，动画只靠 uProgress → InstancedBufferAttribute 就够。
    const seedPosition = instancedBufferAttribute(positionAttribute)
    const seedSize = instancedBufferAttribute(sizeAttribute)

    //用 PointsNodeMaterial（继承于 SpriteNodeMaterial）：
    // 烟花、星系、火焰火星、魔法粒子
    // 要「点越大越像发光粒子」、大小随距离衰减像传统 Points
    // 原课 WebGL Points + gl_PointSize 的 WebGPU 对应写法

    // 用 SpriteNodeMaterial：
    // UI/世界里的标记、角色头顶图标、树叶/公告板
    // 大小按「场景里几米宽」理解，而不是「点有多大」
    // 单个或少量 Sprite，不一定要粒子语义
    const material = new THREE.PointsNodeMaterial({
      // sizeNode: seedSize,
      // positionNode: seedPosition,
      //	       map                       	 alphaMap
      // 管什么   颜色（RGB，乘到材质 color 上）   透明度（灰度当 alpha）
      alphaMap:fireworksTexture,// 灰度当透明度（常用 G 通道）
      //一般下面俩是配套出现
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      // depthTest:false,
      color:color
    })

    //换成 scaleNode 也能动，但缩放曲线和对远近的响应会不一样，调参会别扭。
    // const material = new THREE.SpriteNodeMaterial({
    //   positionNode: instancedBufferAttribute(positionAttribute),
    //   scaleNode: instancedBufferAttribute(sizeAttribute), // 每颗不一样
    //   blending: THREE.AdditiveBlending,
    //   depthTest: false,
    //   depthWrite: false
    // })

    const fireworks= new THREE.Sprite(material)
    fireworks.count = count
    // position 是世界坐标；root 有偏移时转到 root 局部
    fireworks.position.copy(position)   // 设置烟花相对父节点的局部坐标，不是相对于世界原点。
    // fireworks.position.set(position.x,position.y,position.z)
    root.worldToLocal(fireworks.position) // 再换成相对 root 的局部坐标
    root.add(fireworks)
    //大多数不设置root.position，其默认值为(0,0,0)

    const uProgress=uniform(float(0))

    const progressTween = gsap.to(uProgress, {
      value: 1,
      duration: 3,
      ease: 'linear',
      onComplete: () => {
        destroyFireworks()
      },
    })

    material.positionNode=Fn(()=>{
      const positionFromLocal=seedPosition.toVar()
      const exploding=uProgress.remapClamp(0,0.1,0,1)
      //爆炸由快到慢
      exploding.assign(
        pow(exploding.oneMinus(),3)
          .oneMinus()
      )
      const falling=uProgress.remapClamp(0.1,1,0,1)
      falling.assign(
        pow(falling.oneMinus(),3)
          .oneMinus()
      )
      // toVar：shader 局部变量，便于 .y.subAssign；不是 JS 深拷贝
      positionFromLocal.y.subAssign(falling)

      return positionFromLocal.mul(exploding)
    })()

    material.sizeNode=Fn(()=>{
      const scaling=min(
        uProgress.remapClamp(0,0.2,0,1),
        uProgress.remapClamp(0.2,1,1,0),
      )
      const twinkling=uProgress.remapClamp(0.25,0.7,0,1)
      const sizeTwinkling = sin(uProgress.mul(30)).mul(0.5).add(0.5);
      sizeTwinkling.assign(
        sizeTwinkling.mul(twinkling).oneMinus()
      )
      return seedSize.mul(scaling,sizeTwinkling)
    })()

    //alphaMap冲突
    // material.opacityNode=Fn(()=>{
    //   const textureSample=texture(fireworksTexture)
    //   return textureSample.r
    // })()

    const destroyFireworks=()=>{
      progressTween.kill()
      root.remove(fireworks)
      // 禁止 fireworks.geometry.dispose()：
      // Sprite 共用全局 _geometry，一 dispose 会拆掉所有烟花的 GPU buffer
      // 禁止 dispose alphaMap：textures[] 是共享粒子贴图
      //material是每个烟花都独有的，可以销毁
      material.dispose()
    }
    //gsap 的 3 秒销毁只覆盖「播完」的情况。
    // 中途离开页面（路由切走、dispose）时，还有没播完的烟花：
    // tween 还在跑、material 还在 GPU 上。activeFireworks 是给场景级 dispose 用的，
    // 把活着的立刻清掉。
    activeFireworks.push(destroyFireworks)
  }

  const timer = new THREE.Timer()
  timer.connect(document)
  const unsubscribeBeforeRender = options.onBeforeRender(() => {
    timer.update()
    const elapsed = timer.getElapsed()
  })

  try {
    // await loadSuzanneModel()
  } catch (error) {
    console.error('[setupCoffeSmoke] failed to load bakedModel', {
      url: SUZANNE_MODEL_URL,
      error,
    })
  }

  const addFireworks=(hit)=>{
    // const localPosition:THREE.Vector3 = hit.object.worldToLocal(hit.point.clone())
    const positionWorld=hit.point.clone()
    const count = Math.round(400 + Math.random() * 1000)
    const radius = 3 + Math.random()
    const size = 0.1 + Math.random() * 0.1
    const texture = textures[Math.floor(Math.random() * textures.length)]
    const color = new THREE.Color()
    color.setHSL(Math.random(), 1, 0.7)
    createFireworks(positionWorld,count,radius,size,texture,color)
  }

  addFireworks({
    point:new THREE.Vector3(0,0,0)
  })

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
  }

  return { dispose,addFireworks }
}

//sizeAttenuation: true（默认）时，Three 会按粒子到相机的深度做透视缩放：近大远小。
