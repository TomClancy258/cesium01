import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import type { ShallowRef } from 'vue'
import {
  checker,
  float,
  positionLocal,
  sin,
  time,
  uv,
  vec2,
  vec3,
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
export function setupWebgpuBasics(
  options: WebgpuBasicsOptions,
): { dispose: () => void } | null {
  const { scene, camera, renderer, controls } = options
  if (!scene.value || !camera.value || !renderer.value) {
    console.error('[setupWebgpuBasics] scene/camera/renderer is not ready')
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
  // 不能写 1.0 - node（JS 减法会得到 NaN）；要用 TSL 的 .sub()
  const alpha = float(1).sub(distToCenter.smoothstep(0.2, 0.5))
  floorMaterial.opacityNode = alpha

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), floorMaterial)
  floor.rotation.x = -Math.PI * 0.5
  floor.receiveShadow = true
  root.add(floor)

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.5, 0.24, 128, 32),
    new THREE.MeshStandardMaterial({
      color: 0xc0c8d8,
      metalness: 0.2,
      roughness: 0.4,
    }),
  )
  knot.position.y = 1
  knot.castShadow = true
  knot.receiveShadow = true
  // root.add(knot)

  const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  const cube = new THREE.Mesh(boxGeometry, boxMaterial)
  cube.castShadow = true
  cube.receiveShadow = true
  cube.position.y = 1
  root.add(cube)

  const pattern = checker(uv().add(time.mul(0.02)).mul(vec2(5, 3)))
  boxMaterial.colorNode = vec3(pattern, 0, 0)
  boxMaterial.roughnessNode = pattern

  // positionLocal == 局部坐标 position
  const zOffset = sin(time.add(positionLocal.y.mul(3))).mul(0.4)
  boxMaterial.positionNode = positionLocal.add(vec3(0, 0, zOffset))

  // TransformControls 不是 Object3D，要 add(getHelper())；拖拽时关掉轨道相机
  const transformControls = new TransformControls(
    camera.value,
    renderer.value.domElement,
  )
  transformControls.attach(cube)
  const transformHelper = transformControls.getHelper()
  scene.value.add(transformHelper)

  const onDraggingChanged = (event: { value: unknown }): void => {
    if (controls.value) {
      controls.value.enabled = !event.value
    }
  }
  transformControls.addEventListener('dragging-changed', onDraggingChanged)

  const onTransformKeyDown = (event: KeyboardEvent): void => {
    const target = event.target
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      return
    }
    if (event.key === 'g') transformControls.setMode('translate')
    else if (event.key === 'r') transformControls.setMode('rotate')
    else if (event.key === 's') transformControls.setMode('scale')
  }
  window.addEventListener('keydown', onTransformKeyDown)

  const dispose = (): void => {
    window.removeEventListener('keydown', onTransformKeyDown)
    transformControls.removeEventListener('dragging-changed', onDraggingChanged)
    transformControls.detach()
    transformControls.dispose()
    scene.value?.remove(transformHelper)
    scene.value?.remove(root)
    floor.geometry.dispose()
    ;(floor.material as THREE.Material).dispose()
    floorTexture.dispose()
    knot.geometry.dispose()
    ;(knot.material as THREE.Material).dispose()
    boxGeometry.dispose()
    boxMaterial.dispose()
  }

  return { dispose }
}
