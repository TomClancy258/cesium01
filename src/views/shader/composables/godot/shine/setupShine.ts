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

export async function setupShine(
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
    thickness:0.5,
    slope:0.25*Math.PI,
    shineOffset:0.0,
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      godot2D: { value: godot2DTexture },
      u_thickness: { value: params.thickness },
      u_slope: { value: params.slope },
      u_shineOffset: { value: params.shineOffset },
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

  const pane = new Pane({ title: 'Shine' })
  pane
    .addBinding(params, 'thickness', {
      label: 'thickness',
      min: 0.0,
      max: 2.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_thickness.value = ev.value
    })
  pane
    .addBinding(params, 'slope', {
      label: 'slope',
      min: -(0.5*Math.PI-0.001),
      max: 0.5*Math.PI-0.001,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_slope.value = ev.value
    })
  pane
    .addBinding(params, 'shineOffset', {
      label: 'shineOffset',
      min: -2.0,
      max: 2.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_shineOffset.value = ev.value
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
