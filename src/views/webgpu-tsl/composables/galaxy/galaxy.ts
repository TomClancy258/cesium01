import gsap from 'gsap'
import {
  positionViewDirection,
  lessThanEqual,
  select,
  add,
  pow,
  hash,
  length,
  remapClamp,
  varying,
  oneMinus,
  exp,
  color,
  range,
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
  cos,
  clamp,
  abs,
  equal,
  assign,
  distance,
  positionLocal,
  frontFacing,
  instanceIndex,
} from 'three/tsl'
import * as THREE from 'three/webgpu'
import type { Texture } from 'three'
import {randomSphericalPosition} from "@/utils/threejs-utils.ts"

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
  const GALAXY_COUNT = 500
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

  let galaxy=null;
  const data=[]

  const initGalaxy = () => {
    const material = new THREE.SpriteNodeMaterial({
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false
    })
    galaxy= new THREE.Sprite(material)
    galaxy.count = GALAXY_COUNT
  }

  const initAnimation=()=>{
    //[0, 0.5)
    galaxy.material.scaleNode=range(0.01,0.05)
    const radius=float(1)
    // galaxy.material.positionNode=Fn(()=>{
    //   const index=instanceIndex.toFloat().mod(3).div(3)//不float就会div(3)=0
    //   const modIndex=instanceIndex.toFloat().div(GALAXY_COUNT)
    //   const radius=modIndex.sub(time.mul(0.001)).fract().mul(5)
    //   // const radius=instanceIndex.toFloat().mul(0.02).sub(time.mul(0.1))
    //   const angle=index.mul(TWO_PI).add(radius)
    //
    //   const position=vec3(radius.mul(cos(angle)),0,radius.mul(sin(angle)))
    //   return position
    // })()

    const progress=varying(0)
    galaxy.material.positionNode=Fn(()=>{
      const index=instanceIndex.toFloat().mod(3).div(3)//不float就会div(3)=0
      //(1->0]=》[0,1)
      progress.assign(range(0,1).sub(time.mul(0.01)).fract().oneMinus())
      //1->0 => 6->0
      const radius=progress.oneMinus().mul(6)

      //(1->0]
      // const progress=range(0,1).sub(time.mul(0.01)).fract()
      // const progress=range(0,1).sub(0.2).fract()
      // const radius=progress.mul(6)

      const angle=index.mul(TWO_PI).add(float(2).pow(progress.mul(3)))
      // const angle=index.mul(TWO_PI).add(progress.mul(2).exp())
        // const angle=index.mul(TWO_PI).add(radius.mul(.5))
        // const angle=index.mul(TWO_PI).add(radius.pow(1.5))

      const position=vec3(radius.mul(cos(angle)),0,radius.mul(sin(angle)))

      //spreadRadius和radius从外向内递减，所以由外向内spread变小
      const spreadRadius = progress.oneMinus().mul(range(0, 1))
      const spread = randomSphericalPosition(instanceIndex, spreadRadius)
      position.addAssign(spread)
      // position.y.assign(spread.y)

      return position
    })()

    galaxy.material.opacityNode=Fn(()=>{
      const uvFromCenter=uv().sub(0.5).mul(2)
      const distToCenter=length(uvFromCenter)
      const aa=max(fwidth(distToCenter),0.002)
      const outerRadius=float(1.0)
      const ringWidth=float(0.2)
      const innerRadius=outerRadius.sub(ringWidth)
      const innerShape=smoothstep(innerRadius.sub(aa),innerRadius.add(aa),distToCenter)
      const outerShape=smoothstep(outerRadius.sub(aa),outerRadius.add(aa),distToCenter).oneMinus()
      // const outerShape=smoothstep(outerRadius.sub(aa),outerRadius,distToCenter).oneMinus()
      const ring=innerShape.mul(outerShape)
      const innerCircle=innerShape.oneMinus()
      const alpha=select(instanceIndex.mod(2).equal(0),ring,innerCircle)
      const fade=progress.remapClamp(0,0.2,0,1).pow(2)
      alpha.mulAssign(fade)
      return alpha
    })()

    galaxy.material.colorNode=Fn(()=>{
      return vec3(1).mul(15)
    })()
  }
  initGalaxy()
  initAnimation()
  const dispose = (): void => {
    data.forEach((impact) => {
      gsap.killTweensOf(impact)
    })
    galaxy.material.dispose()
  }

  return {
    texture: hexTexture,
    radius,
    colorA,
    colorB,
    strength,
    mesh:galaxy,
    dispose,
  }
}
