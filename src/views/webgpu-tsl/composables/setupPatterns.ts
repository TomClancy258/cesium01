import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import type { ShallowRef } from 'vue'
import {
  checker,
  max,
  mix,
  color,
  fwidth,
  step,
  float,
  time,
  uv,
  pow,
  vec2,
  vec3,
  mx_noise_float,
  mx_worley_noise_float,
  parallaxUV,
  smoothstep,
  oneMinus,
} from 'three/tsl'

export interface WebgpuBasicsOptions {
  scene: ShallowRef<THREE.Scene | null>
  camera: ShallowRef<THREE.Camera | null>
  renderer: ShallowRef<THREE.WebGPURenderer | null>
  /** 拖拽 gizmo 时要关掉，避免和 OrbitControls 抢事件 */
  controls: ShallowRef<OrbitControls | null>
}

/**
 * WebGPU 入门场景：只用内置材质 + TSL 节点。
 * 现有 GLSL ShaderMaterial（草 / Godot demo）在 WebGPURenderer 下不可用，需改写成 TSL。
 */
export function setupPatterns(
  options: WebgpuBasicsOptions,
): { dispose: () => void } | null {
  const { scene, camera, renderer, controls } = options
  if (!scene.value || !camera.value || !renderer.value) {
    console.error('[setupPatterns] scene/camera/renderer is not ready')
    return null
  }

  const root = new THREE.Group()
  root.position.set(0, 0, 0)
  scene.value.add(root)

  const floorTexture = new THREE.TextureLoader().load(
    '/textures/floor/floor-color.jpg',
  )
  floorTexture.colorSpace = THREE.SRGBColorSpace
  floorTexture.wrapS = THREE.RepeatWrapping
  floorTexture.wrapT = THREE.RepeatWrapping

  // transparent: true 后 opacity / opacityNode 才会混合；否则 alpha 被忽略
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    transparent: true,
    depthWrite: false,
  })
  // uv 从中心拉到约 [-1,1]，再按距离做边缘虚化
  const uvFromCenter = uv().sub(0.5).mul(2.0)
  const distToCenter = uvFromCenter.length()
  const alpha = float(1).sub(distToCenter.smoothstep(0.2, 0.5))
  floorMaterial.opacityNode = alpha

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), floorMaterial)
  floor.rotation.x = -Math.PI * 0.5
  floor.receiveShadow = true
  root.add(floor)

  const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
  const boxMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00 ,
    // transparent: true,
    // depthWrite: false,
  })
  const cube = new THREE.Mesh(boxGeometry, boxMaterial)
  cube.castShadow = true
  cube.receiveShadow = true
  cube.position.y = 1
  root.add(cube)


  // parallaxUV 实现是 uv - vec3 方向，实际常得到 vec3；.xy 收成二维再和 time 拼
  const depthUv = parallaxUV(uv().mul(5), 0.5).xy
  //[0,1]
  //time是场景跑起来之后的已过秒数（大约从 0 往上加），不是 Unix 时间戳。会一直增大。
  let underwaterNoise = mx_worley_noise_float(vec3(depthUv, time.mul(0.1)))
  underwaterNoise=underwaterNoise.pow(3)
  // underwaterNoise=step(0.5,underwaterNoise)
  const underwaterColor=mix(color(0x1b3956), color(0x11eeff),underwaterNoise)
  boxMaterial.colorNode = underwaterColor

  const foamUv = uv().mul(5)
  // Perlin ~[-1,1] → abs → oneMinus：零交叉附近变亮（泡沫脊）
  const foamNoise = mx_noise_float(vec3(foamUv, time.mul(0.05))).abs().oneMinus()
  const foamEdge = float(0.9)
  // fwidth 做屏幕空间抗锯齿；min 宽度避免过细闪烁
  const foamAA = max(fwidth(foamNoise), float(0.02))
  // 不能写 foamEdge - foamAA（JS 减法会得到 NaN），要用 TSL 的 sub/add
  const foamShape = smoothstep(
    foamEdge.sub(foamAA),
    foamEdge.add(foamAA),
    foamNoise,
  )
  const foamColor=mix(color(0xe5f7ff),color(0xffffff),foamShape)
  // boxMaterial.colorNode = foamColor

  const pondColor=mix(underwaterColor,color(0xe5f7ff),foamShape)

  const lilyPadUv=uv().mul(5)
  // const lilyPadNoise=mx_worley_noise_float(vec3(lilyPadUv,time.mul(0.01)))
  const lilyPadNoise=mx_worley_noise_float(vec3(lilyPadUv,1))
  const lilyPadEdge=float(0.2)

  const lilyPadAA=max(fwidth(lilyPadNoise),0.002);
  const lilyPadShape=smoothstep(lilyPadEdge.sub(lilyPadAA),lilyPadEdge.add(lilyPadAA),lilyPadNoise).oneMinus()

  const lilyPadBorderGradientColor = mix(color(0xd7e689),color(0x329a89), lilyPadNoise.mul(5))
  boxMaterial.colorNode = mix(pondColor,lilyPadBorderGradientColor,lilyPadShape)

  const dispose = (): void => {
    scene.value?.remove(root)
    floor.geometry.dispose()
    ;(floor.material as THREE.Material).dispose()
    floorTexture.dispose()
    boxGeometry.dispose()
    boxMaterial.dispose()
  }

  return { dispose }
}
