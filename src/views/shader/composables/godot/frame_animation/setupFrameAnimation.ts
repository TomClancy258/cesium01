import * as THREE from 'three'
import type { ShallowRef } from 'vue'
import { Pane } from 'tweakpane'
import vertexShader from './shaders/vertex-shader.glsl?raw'
import fragmentShader from './shaders/fragment-shader.glsl?raw'

type BeforeRenderHandle = (fn: () => void) => () => void

const FRAME_COUNT = 4
const FRAME_ANIMATION_PERIOD_SEC = 2
const ONE_FRAME_PERIOD_SEC = FRAME_ANIMATION_PERIOD_SEC / FRAME_COUNT

export interface PixelateSetupResult {
  plane: THREE.Mesh
  dispose: () => void
}

export async function setupFrameAnimation(
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
      u_currentFrame: { value: 0.0 },
      u_frames: { value: FRAME_COUNT },
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

  const setCurrentFrame = (elapsedSec: number): void => {
    const t = elapsedSec % FRAME_ANIMATION_PERIOD_SEC
    const frame = Math.floor(t / ONE_FRAME_PERIOD_SEC) // 0→1→2→3→0…
    material.uniforms.u_currentFrame.value = frame
  }

  const unsubscribeBeforeRender = onBeforeRender(() => {
    timer.update()
    const elapsed = timer.getElapsed()
    setCurrentFrame(elapsed)
  })

  const pane = new Pane({ title: 'Godot2D' })
  pane
    .addBinding(params, 'vibrance', {
      label: 'vibrance',
      min: 0.0,
      max: 2.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_vibrance.value = ev.value
    })

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
