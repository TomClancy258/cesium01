import gsap from 'gsap'
import {
  positionViewDirection,
  add,
  color,
  dot,
  float,
  Fn,
  Loop,
  max,
  mix,
  mul,
  normalView,
  objectPosition,
  positionLocal,
  positionWorld,
  texture,
  time,
  TWO_PI,
  uniform,
  uniformArray,
  uv,
  vec2,
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
  junctionNode: ReturnType<ReturnType<typeof Fn>>
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
  const {
    texture: hexTexture,
    radius: radiusValue = 2,
    colorA: colorAValue = color(0x1a5bff),
    colorB: colorBValue = color(0xff2e43),
    strength: strengthValue = 7,
  } = options

  const radius = uniform(radiusValue)
  const colorA = uniform(colorAValue)
  const colorB = uniform(colorBValue)
  const strength = uniform(strengthValue)

  const data: THREE.Vector4[] = []
  for (let i = 0; i < 5; i++) {
    data.push(new THREE.Vector4(0, 0, 0, 0))
  }

  const impacts = {
    count: 5,
    index: 0,
    data,
    uniforms: uniformArray(data, 'vec4'),
    add: (_position: THREE.Vector3, _radius?: number) => undefined as void,
  }

  const geometry = new THREE.SphereGeometry(1, 32, 32)
  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    color: 0x000000,
    side: THREE.DoubleSide,
  })
  material.positionNode = positionLocal.mul(radius)

  material.emissiveNode = Fn(() => {
    const finalImpact = float(0).toVar()

    Loop(impacts.count, ({ i }) => {
      const impactData = impacts.uniforms.element(i)
      const impactDistance = impactData.xyz.distance(positionLocal)
      const impact = impactDistance.div(impactData.w).oneMinus().max(0)
      finalImpact.assign(max(finalImpact, impact))
    })
    finalImpact.assign(finalImpact.remap(0.4, 0, 1, 0))

    const fresnel = dot(positionViewDirection, normalView).abs().oneMinus()

    const hexagonsColor = texture(hexTexture, uv().mul(vec2(6, 4)))
    const hexagonsStep = max(
      time.add(hexagonsColor.g.mul(TWO_PI)).sin().remap(-1, 1),
      finalImpact,
    )
    const hexagonsMask = hexagonsStep.step(hexagonsColor.r)
    const hexagonsPolarMask = uv().y.sub(0.5).abs().remapClamp(0.35, 0.2)
    const hexagonsFresnelMask = max(fresnel.pow(2), finalImpact)
    const hexagonsFill = max(hexagonsColor.r, finalImpact)
    const hexagons = mul(
      hexagonsMask,
      hexagonsColor.b,
      hexagonsPolarMask,
      hexagonsFresnelMask,
      hexagonsFill,
    )

    const linesStrength = positionWorld.y
      .mul(3)
      .sub(time)
      .sin()
      .remap(-1, 1)
      .mul(0.05)
    const lines = positionWorld.y
      .mul(20)
      .add(time)
      .fract()
      .pow(3)
      .mul(linesStrength)

    const emissiveStrength = add(hexagons, fresnel.pow(5), lines).mul(strength)
    return mix(colorA, colorB, emissiveStrength).mul(emissiveStrength)
  })()

  const mesh = new THREE.Mesh(geometry, material)

  impacts.add = (position, impactRadius = 1) => {
    const impact = data[impacts.index]
    const localPosition = mesh.worldToLocal(position.clone())
    impact.x = localPosition.x
    impact.y = localPosition.y
    impact.z = localPosition.z

    gsap.to(impact, {
      w: impactRadius,
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

    impacts.index++
    if (impacts.index >= impacts.count) {
      impacts.index = 0
    }
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
    impacts,
    geometry,
    material,
    mesh,
    junctionNode,
    dispose,
  }
}
