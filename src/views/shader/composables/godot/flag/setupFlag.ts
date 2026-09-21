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

export async function setupFlag(
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
    incline:0.5,
    densityY:10.0,
    densityX:10.0,
    frequencyY:0.4,
    frequencyX:0.4,
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      godot2D: { value: godot2DTexture },
      u_time: { value: FLAG_PERIOD_SEC },
      u_incline: { value: params.incline },
      u_densityY: { value: params.densityY },
      u_densityX: { value: params.densityX },
      u_frequencyY: { value: params.frequencyY },
      u_frequencyX: { value: params.frequencyX },
      u_pi: { value: Math.PI },
    },
    vertexShader,
    fragmentShader,
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

  const pane = new Pane({ title: 'Flag' })
  pane
    .addBinding(params, 'incline', {
      label: 'incline',
      min: 0.0,
      max: 1.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_incline.value = ev.value
    })
  pane
    .addBinding(params, 'densityY', {
      label: 'densityY',
      min: 0.0,
      max: 20.0,
      step: 1.0,
    })
    .on('change', (ev) => {
      material.uniforms.u_densityY.value = ev.value
    })
  pane
    .addBinding(params, 'densityX', {
      label: 'densityX',
      min: 0.0,
      max: 20.0,
      step: 1.0,
    })
    .on('change', (ev) => {
      material.uniforms.u_densityX.value = ev.value
    })
  pane
    .addBinding(params, 'frequencyY', {
      label: 'frequencyY',
      min: 0.0,
      max: 1.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_frequencyY.value = ev.value
    })
  pane
    .addBinding(params, 'frequencyX', {
      label: 'frequencyX',
      min: 0.0,
      max: 1.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_frequencyX.value = ev.value
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
