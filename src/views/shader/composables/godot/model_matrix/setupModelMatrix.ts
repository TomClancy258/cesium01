import * as THREE from 'three'
import type { ShallowRef } from 'vue'
import { Pane } from 'tweakpane'
import vertexShader from './shaders/vertex-shader.glsl?raw'
import fragmentShader from './shaders/fragment-shader.glsl?raw'

type BeforeRenderHandle = (fn: () => void) => () => void

const FLAG_PERIOD_SEC = 5

const white=new THREE.Vector3(1.0,1.0,1.0)
const red=new THREE.Vector3(1.0,0.0,0.0)

export interface PixelateSetupResult {
  plane: THREE.Mesh
  dispose: () => void
}

export async function setupModelMatrix(
  scene: ShallowRef<THREE.Scene | null>,
  onBeforeRender: BeforeRenderHandle,
): Promise<PixelateSetupResult | null> {
  if (!scene.value) {
    console.error('[setupPixelate] scene is not ready')
    return null
  }

  const timer = new THREE.Timer()
  timer.connect(document)

  const godot2DTexture = await new THREE.TextureLoader().loadAsync(
    '/textures/godot2D.png',
  )
  godot2DTexture.wrapS = THREE.RepeatWrapping
  godot2DTexture.wrapT = THREE.RepeatWrapping
  godot2DTexture.colorSpace = THREE.NoColorSpace

  const params={
    rotX:0.0,
    rotY:0.0,
    rotZ:0.0,
    scale:1.0,
    position: new THREE.Vector3(0, 0, 0),
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      godot2D: { value: godot2DTexture },
      u_time: { value: FLAG_PERIOD_SEC },
      u_rotX: { value: params.rotX },
      u_rotY: { value: params.rotY },
      u_rotZ: { value: params.rotZ },
      u_scale: { value: params.scale },
      u_pi: { value: Math.PI },
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
  })

  // const geometry = new THREE.PlaneGeometry(5, 5)
  //顶点数大约是 (宽段数 + 1) × (高段数 + 1)，这里是 2 × 65 = 130 个。
  const geometry = new THREE.PlaneGeometry(5, 5, 64, 64)
  const plane = new THREE.Mesh(geometry, material)
  plane.position.set(0, 0, 0)
  // 与 useThreeScene 中 threeCamera.position.set(1, 0, 1) 对齐，使平面正面朝向相机
  plane.lookAt(1, 0, 1)
  scene.value.add(plane)

  const setFlagPeriod = (elapsedSec: number): void => {
    const time = elapsedSec % FLAG_PERIOD_SEC / FLAG_PERIOD_SEC
    material.uniforms.u_time.value = time
  }

  const unsubscribeBeforeRender = onBeforeRender(() => {
    timer.update()
    const elapsed = timer.getElapsed()
    setFlagPeriod(elapsed)
  })

  const pane = new Pane({ title: 'Fake3D' })
  pane
    .addBinding(params, 'rotX', {
      label: 'rotX',
      min: 0.0,
      max: 1.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_rotX.value = ev.value
    })
  pane
    .addBinding(params, 'rotY', {
      label: 'rotY',
      min: 0.0,
      max: 1.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_rotY.value = ev.value
    })
  pane
    .addBinding(params, 'rotZ', {
      label: 'rotZ',
      min: 0.0,
      max: 1.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_rotZ.value = ev.value
    })
  pane
    .addBinding(params, 'scale', {
      label: 'scale',
      min: 1.0,
      max: 2.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_scale.value = ev.value
    })

  // AxesHelper：+X 红向右，+Y 绿向上，+Z 蓝朝向默认观察侧。拾取框默认 Y 朝下，所以 Y 要 inverted。
  pane.addBinding(params, 'position', {
    label: 'position',
    x: { min: -20.0, max: 20.0, step: 1.0 },
    y: { min: -20.0, max: 20.0, step: 1.0, inverted: true },
    z: { min: -20.0, max: 20.0, step: 1.0 },
  }).on('change', (ev) => {
    plane.position.set(ev.value.x, ev.value.y, ev.value.z)
  })

  const dispose = (): void => {
    unsubscribeBeforeRender()
    pane.dispose()
    scene.value?.remove(plane)
    geometry.dispose()
    material.dispose()
    godot2DTexture.dispose()
  }

  return { plane, dispose }
}
