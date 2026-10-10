import gsap from 'gsap'
import {
  positionViewDirection,
  lessThanEqual,
  select,
  add,
  pow,
  color,
  mulAssign,
  toFloat,
  mod,
  dot,
  toVar,
  fract,
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
  uv,
  vec2,
  vec3,
  vec4,
  min,
  fwidth,
  smoothstep,
  step,
  sin,
  clamp,
  abs,
  assign,
  distance,
  positionLocal,
  frontFacing,
  instanceIndex,
} from 'three/tsl'
import * as THREE from 'three/webgpu'
import type { Texture } from 'three'

export interface ShieldInstance {
  texture: Texture
  radius: ReturnType<typeof uniform>
  colorA: ReturnType<typeof uniform>
  colorB: ReturnType<typeof uniform>
  strength: ReturnType<typeof uniform>
  impacts: {
    count: number
    index: number
    uniforms: ReturnType<typeof uniformArray>
    data: THREE.Vector4[]
    add: (position: THREE.Vector3, radius?: number) => void
  }
  geometry: THREE.SphereGeometry
  material: THREE.MeshBasicNodeMaterial
  mesh: THREE.Mesh
  /** 同步 radius uniform 与 mesh.scale（拾取 / 控件依赖 scale） */
  setRadius: (value: number) => void
  dispose: () => void
}

export interface CreateShieldOptions {
  texture: Texture
  radius?: number
  colorA?: ReturnType<typeof color>
  colorB?: ReturnType<typeof color>
  strength?: number
}

/**
 * 护盾工厂（普通函数，不用 class / hook）：
 */
export function createMagicExplosion(options: CreateShieldOptions): ShieldInstance {
  const EXPLOSION_COUNT = 5
  const EXPLOSION_TIME = 3000
  const EXPLOSION_RADIUS = 0.5
  const {
    texture: hexTexture,
    radius: radiusValue = 1,
    colorA: colorAValue = color(0x1111ff),
    colorB: colorBValue = color(0xff1111),
    strength: strengthValue = 30,
  } = options

  const radius = uniform(radiusValue)
  const colorA = uniform(colorAValue)
  const colorB = uniform(colorBValue)
  const strength = uniform(strengthValue)

  const startIndex=uniform(0,'int')

  const data: THREE.Vector4[] = []
  for (let i = 0; i < 5; i++) {
    data.push(new THREE.Vector4(0, 0, 0, 0))
  }

  const explosion = {
    positions: [],
    radii: [],
    progresses: [],
    index:0,
    uniform: {
      positions: null,
      radii: null,
      progresses: null,
    },
  }
  const initExplosion = () => {
    for (let i = 0; i < EXPLOSION_COUNT; i++) {
      explosion.positions.push(new THREE.Vector3(0, 0, 0))
      explosion.radii.push(1)
      explosion.progresses.push(0)
    }
    explosion.uniform.positions = uniformArray(explosion.positions, 'vec3')
    explosion.uniform.radii = uniformArray(explosion.radii, 'float')
    //explosion.uniform.progresses.array === explosion.progresses
    explosion.uniform.progresses = uniformArray(explosion.progresses, 'float')
  }
  initExplosion()
  const addExplosion = (hit, radius = 1) => {
    const index = explosion.index
    const position = explosion.positions[index]
    position.copy(hit.point)
    explosion.radii[index] = radius
    explosion.progresses[index] = 0

    const dummy = { progress: 0 }

    gsap.to(dummy, {
      progress: 1,
      duration: 3,
      ease: 'linear',
      onUpdate: () => {
        explosion.progresses[index] = dummy.progress
      },
      onComplete: () => {
        // mesh.count--
        // if (mesh.count === 0) mesh.visible = false
      },
    })

    //0,1,2,3,4
    explosion.index=(explosion.index+1)%EXPLOSION_COUNT

    if (mesh.count === EXPLOSION_COUNT) {
      return
    }
    mesh.count++
  }

  const geometry = new THREE.SphereGeometry(
    1, // radius
    32, // widthSegments
    32, // heightSegments
    0, // phiStart   经度起点
    Math.PI * 2, // phiLength 经度扫过整圈
    0, // thetaStart 纬度起点（0 = 北极）
    Math.PI / 2, // thetaLength 只扫到赤道 → 上半球
  )
  const material = new THREE.MeshBasicNodeMaterial({
    // transparent: true, //true时，opacityNode才有透明
    // blending: THREE.AdditiveBlending,
    color: 0x000000, //THREE.AdditiveBlending+emissiveNode时，color越接近0越透明
    side: THREE.DoubleSide,
  })
  // 用 mesh.scale 控半径，不用 positionNode.mul(radius)：
  // Raycaster 只认 CPU 几何体，GPU 顶点偏移会导致「看得见却点不中」

  // const progress = time.mod(EXPLOSION_TIME_SECOND).div(EXPLOSION_TIME_SECOND)
  // const progress = explosion.uniform.progresses.element(instanceIndex)

  //slot=0,1,2,3,4
  const slot=instanceIndex.add(startIndex).mod(EXPLOSION_COUNT)
  const progress = explosion.uniform.progresses.element(slot)
  const indexWorldPosition = explosion.uniform.positions.element(slot)

  //可软边、半透明，和maskNode的区别
  // material.opacityNode = Fn(() => {
  //boolean:true则保留，false则丢弃，硬切
  material.maskNode = Fn(() => {
    //vec3/4都行，最终alpha=colorNode.a * opacityNode
    // material.colorNode = Fn(() => {
    //vec3（rgb）
    // material.emissiveNode = Fn(() => {
    // 等价雷达 normalizedTime = (elapsed % duration) / duration
    // TSL time 已是秒，循环 3 秒 0→1，不必再做 progress uniform
    // const progress = time.div(3).fract()
    //没做 X 拉伸，Y 在 Repeat 下铺了 3 次
    const magicExplosionSample01 = texture(options.texture, uv().mul(vec2(1, 3)))
    const noise01 = magicExplosionSample01.r.toVar()

    // const magicExplosionSample02 = texture(options.texture, uv().mul(vec2(1,5)))
    // const noise02=magicExplosionSample02.g.toVar()

    // const noise=noise01.add(noise02).div(2).pow(2)
    const noise = noise01.pow(2)
    const explosionShape = noise.sub(progress)
    const alpha = step(progress, noise)
    // return vec3(alpha)
    // return vec3(explosionShape)
    return explosionShape.greaterThan(0)
  })()

  //diffuseColor.a = colorNode.a × opacityNode（没有则用 material.opacity）
  // material.colorNode=Fn(()=>{
  material.emissiveNode = Fn(() => {
    // const emissiveProgress=progress
    const emissiveProgress = progress.smoothstep(0, 0.7) //更快到达colorB
    //frontFacing 是片元着色器里的内置量：当前片元是不是三角面的正面。
    // 正面（法线朝相机这一侧）：true
    // 背面（球体内壁、法线背对相机）：false
    // DoubleSide 时正反两面都会画，才能分得出。
    const isFront = frontFacing.toFloat()
    const fontMask = isFront.oneMinus()
    const color = mix(colorA, colorB, emissiveProgress).mul(strength)
    return color.mul(fontMask)
  })()

  material.positionNode = Fn(() => {
    // const showProgress=progress.smoothstep(0,0.2)
    const showProgress = progress.remap(0, 0.2)
    // const hideProgress=progress.smoothstep(0.2,1).oneMinus()
    const hideProgress = progress.remap(0.075, 1, 1, 0.3) //progress<0.075时，hideProgress>1
    // const positionProgress=showProgress.mul(hideProgress)
    const positionProgress = min(showProgress, hideProgress).toVar()
    //在1附近停留更长
    positionProgress.assign(positionProgress.oneMinus().pow(2).oneMinus())

    //必须先缩放再平移，是因为乘法会作用在「已经加进去的位移」上
    //instanceIndex：当前是第几份，第 1 份 0，第 2 份 1，…，最大 count-1
    const position = positionLocal.mul(positionProgress)

    // const indexWorldPosition = explosion.uniform.positions.element(instanceIndex)

    position.addAssign(indexWorldPosition)
    return position
  })()

  // const mesh = new THREE.Mesh(geometry, material)
  const mesh =  new THREE.InstancedMesh(geometry, material, EXPLOSION_COUNT)
  // mesh.scale.setScalar(radiusValue)
  mesh.count = 0

  const setRadius = (value: number): void => {
    radius.value = value
    mesh.scale.setScalar(value)
  }

  const dispose = (): void => {
    data.forEach((impact) => {
      gsap.killTweensOf(impact)
    })
    geometry.dispose()
    material.dispose()
  }

  return {
    texture: hexTexture,
    radius,
    colorA,
    colorB,
    strength,
    geometry,
    material,
    mesh,
    setRadius,
    dispose,
    addExplosion,
  }
}
