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

export async function setupOrbit(
  scene: ShallowRef<THREE.Scene | null>,
  onBeforeRender: BeforeRenderHandle,
): Promise<PixelateSetupResult | null> {
  if (!scene.value) {
    console.error('[setupPixelate] scene is not ready')
    return null
  }

  const timer = new THREE.Timer()
  timer.connect(document)

  const attackTexture = await new THREE.TextureLoader().loadAsync(
    '/textures/attack.png',
  )
  attackTexture.wrapS = THREE.RepeatWrapping
  attackTexture.wrapT = THREE.RepeatWrapping
  attackTexture.colorSpace = THREE.NoColorSpace

  const params={
    vibrance:1.0
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      attack: { value: attackTexture },
      u_earthTime: { value: 0.0 },
      u_moonTime: { value: 0.0 },
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
    setPlanetRotation(elapsed)
  })

  const pane = new Pane({ title: 'Godot2D' })

  const dispose = (): void => {
    unsubscribeBeforeRender()
    pane.dispose()
    scene.value?.remove(plane)
    geometry.dispose()
    material.dispose()
    attackTexture.dispose()
  }

  return { plane, dispose }
}
