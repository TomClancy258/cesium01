import gsap from 'gsap'
import {
  positionViewDirection,
  lessThanEqual,
  select,
  add,
  pow,
  color,
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
  vec3 ,
  vec4,
  fwidth,
  smoothstep,
  sin,
  clamp,
  abs,
  assign,
  distance,
  positionLocal,
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
    add: (position: THREE.Vector3, radius?: number) => void
  }
  geometry: THREE.SphereGeometry
  material: THREE.MeshBasicNodeMaterial
  mesh: THREE.Mesh
  junctionNode: ReturnType<ReturnType<typeof Fn>>
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
 * 网格球 + 菲涅尔/六边形/冲击波；junctionNode 给地面/模型叠接触光晕。
 */
export function createShield(options: CreateShieldOptions): ShieldInstance {
  const IMPACT_COUNT = 5
  const IMPACT_RADIUS = 0.5
  const {
    texture: hexTexture,
    radius: radiusValue = 2,
    colorA: colorAValue = color(0x1a5bff),
    colorB: colorBValue = color(0xff2e43),
    strength: strengthValue = 3,
  } = options

  const radius = uniform(radiusValue)
  const colorA = uniform(colorAValue)
  const colorB = uniform(colorBValue)
  const strength = uniform(strengthValue)

  const impactObj={
    impacts:[],
    uniforms:null,
    index:0,
  }
  const initImpact=()=>{
    for (let i=0;i<IMPACT_COUNT;i++) {
      impactObj.impacts.push(new THREE.Vector4(0,0,0,0))
    }
    impactObj.uniforms=uniformArray(impactObj.impacts, 'vec4')
  }
  initImpact()
  const addImpact=(hit)=>{
    const localPosition:THREE.Vector3 = hit.object.worldToLocal(hit.point.clone())
    if (impactObj.impacts.length === impactObj.index) {
      impactObj.index=0
    }
    const impact=impactObj.impacts[impactObj.index]
    impact.set(localPosition.x,localPosition.y,localPosition.z,IMPACT_RADIUS)

    //impact.w=newW，impact.setW(newW) 一样，都支持
    gsap.to(impact, {
      w: IMPACT_RADIUS,
      duration: 0.1,
      ease: 'power2.out',
      onComplete: () => {
        gsap.to(impact, {
          w: 0,
          duration: 1,
          ease: 'power2.in',
        })
      },
    })
    impactObj.index++
  }

  const geometry = new THREE.SphereGeometry(1, 32, 32)
  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true, //true时，opacityNode才有透明
    blending: THREE.AdditiveBlending,
    color: 0x000000, //THREE.AdditiveBlending+emissiveNode时，color越接近0越透明
    side: THREE.DoubleSide,
  })
  // 用 mesh.scale 控半径，不用 positionNode.mul(radius)：
  // Raycaster 只认 CPU 几何体，GPU 顶点偏移会导致「看得见却点不中」

  // material.opacityNode = Fn(() => {
  //vec3/4都行，最终alpha=colorNode.a * opacityNode
  // material.colorNode = Fn(() => {
  //vec3（rgb）
  material.emissiveNode = Fn(() => {
    const impactShape=float(0)
    Loop(impactObj.impacts.length,({i})=>{
      const impact=impactObj.uniforms.element(i)
      const distToImpactCenter=distance(positionLocal,impact.xyz)
      const impactItemShape=distToImpactCenter.div(impact.w).pow(3).oneMinus().max(0)
      // const impactItemShape=select(
      //   distToImpactCenter.lessThanEqual(impact.w),
      //   float(1),
      //   float(0)
      // )
      impactShape.assign(max(impactShape,impactItemShape))
    })
    // return vec3(impactShape)

    // Fresnel
    // positionViewDirection：视线（view，归一化）≈ 表面 → 相机
    // normalView：法线（view，归一化）≈ 垂直切平面、指向外侧
    //归一化：x² + y² + z² = 1
    //fresnel=abs([-1,1])=[0,1]，再oneMinus=[0,1]
    //fresnel 在这里当「边缘遮罩」：球的边缘亮、正对相机的中间暗。
    //v1=dot(positionViewDirection, normalView)，球体外表面的positionViewDirection都指向相机，normalView是球体外表面的法向量，所以v1是[-1,1]，其中相机对着方向的球背面的v1=-1，上下左右边缘是0，球正面是1
    //A·B = AxBx + AyBy + AzBz = |A| |B| cosθ ，上下左右边缘的positionViewDirection ⊥ normalView，cos90°=0
    const fresnel=dot(positionViewDirection,normalView).abs().oneMinus()
    //中心黑色圆变大,冲击圆优先于fresnel
    const fresnelMask=max(impactShape,fresnel.pow(2))

    const absYFromCenter=uv().y.sub(0.5).abs().mul(2)
    const shieldWidth=float(0.8)
    const shieldAA=max(fwidth(absYFromCenter),0.002)
    const shieldShape=smoothstep(shieldWidth.sub(shieldAA),shieldWidth.add(shieldAA),absYFromCenter).oneMinus()

    const hexagonsSample=texture(options.texture,uv().mul(3))
    const hexagonsWidth= sin(
      float(hexagonsSample.g.toVar().mul(TWO_PI)).add(time.mul(0.5))
    ).add(1).div(2)
      .max(impactShape)
    const hexagonsShape=hexagonsSample.r.toVar()
    const hexagonsAA=max(fwidth(hexagonsShape),0.002)
    hexagonsShape.assign(smoothstep(hexagonsWidth.sub(hexagonsAA),hexagonsWidth.add(hexagonsAA),hexagonsShape).oneMinus())
    const hexagonsGradient=hexagonsSample.r.toVar()
    const hexagonsFill=max(hexagonsGradient,impactShape)
    const hexagonsGap=hexagonsSample.b.toVar()

    const fractDistToBottom=uv().y.add(time.mul(0.03)).mul(50).fract()
    const lineLightPos=float(0.9)
    const lineWidth=float(0.3)
    const lineBottomPos=lineLightPos.sub(lineWidth)
    const line=smoothstep(lineBottomPos,lineLightPos,fractDistToBottom).mul(0.01)

    //[0,1].mul(strength)=>[0,strength]
    const alpha=hexagonsShape.mul(
      shieldShape,fresnelMask,hexagonsGap,hexagonsFill
    ).add(line,fresnel.pow(3)).mul(strength)

    const color=mix(colorA,colorB,alpha).mul(alpha)

    // return alpha
    return vec3(color)
    // return vec3(alpha)
    // return vec4(vec3(alpha),1)
    // return vec4(vec3(hexagonsSample.r),1)
    // return vec4(vec3(fresnel),1)
  })()

  //diffuseColor.a = colorNode.a × opacityNode（没有则用 material.opacity）
  // material.colorNode=Fn(()=>{
  //   const hexagonsSample=texture(options.texture,uv().mul(3))
  //   return vec3(hexagonsSample.rgb)
  // })()

  const mesh = new THREE.Mesh(geometry, material)
  mesh.scale.setScalar(radiusValue)

  const setRadius = (value: number): void => {
    radius.value = value
    mesh.scale.setScalar(value)
  }

  const center = objectPosition(mesh)
  const junctionNode = Fn(() => {
    const sdf = positionWorld.distance(center).sub(radius)
    const mask = sdf.negate().step(0)
    const junctionStrength = sdf
      .remapClamp(0, -0.2, 1, 0)
      .mul(mask)
      .pow(3)
      .mul(strength)
    return mix(colorA, colorB, junctionStrength).mul(junctionStrength)
  })()

  const dispose = (): void => {
    impactObj.impacts.forEach((impact) => {
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
    junctionNode,
    setRadius,
    dispose,
    addImpact,
  }
}
