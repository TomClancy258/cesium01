import * as THREE from 'three'
import type { ShallowRef } from 'vue'
import { Pane } from 'tweakpane'
import vertexShader from './shaders/vertex-shader.glsl?raw'
import fragmentShader from './shaders/fragment-shader.glsl?raw'

type BeforeRenderHandle = (fn: () => void) => () => void

const EARTH_ORBIT_PERIOD_SEC = 5
const MOON_ORBIT_PERIOD_SEC = 3

export interface PixelateSetupResult {
  plane: THREE.Mesh
  dispose: () => void
}

export async function setupReload(
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
    edgeAngle:0.25,
    progress:0.2,
    radius:0.5,
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      godot2D: { value: godot2DTexture },
      u_edgeAngle: { value: params.edgeAngle },
      u_progress: { value: params.progress },
      u_radius: { value: params.radius },
      u_pi: { value: Math.PI },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  })

  const geometry = new THREE.PlaneGeometry(1, 1)
  const plane = new THREE.Mesh(geometry, material)
  plane.position.set(0, 0, 0)
  // 与 useThreeScene 中 threeCamera.position.set(1, 0, 1) 对齐，使平面正面朝向相机
  plane.lookAt(1, 0, 1)
  scene.value.add(plane)

  const setPlanetRotation = (elapsedSec: number): void => {
    const earthTime = elapsedSec % EARTH_ORBIT_PERIOD_SEC / EARTH_ORBIT_PERIOD_SEC
    const moonTime = elapsedSec % MOON_ORBIT_PERIOD_SEC / MOON_ORBIT_PERIOD_SEC
    material.uniforms.u_earthTime.value = earthTime
    material.uniforms.u_moonTime.value = moonTime
  }

  const unsubscribeBeforeRender = onBeforeRender(() => {
    timer.update()
    const elapsed = timer.getElapsed()
  })

  const pane = new Pane({ title: 'Reload' })
  pane
    .addBinding(params, 'edgeAngle', {
      label: 'edgeAngle',
      min: 0.0,
      max: 2.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_edgeAngle.value = ev.value
    })
  pane
    .addBinding(params, 'progress', {
      label: 'progress',
      min: 0.0,
      max: 1.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_progress.value = ev.value
    })
  pane
    .addBinding(params, 'radius', {
      label: 'radius',
      min: 0.0,
      max: 1.5,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_radius.value = ev.value
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
