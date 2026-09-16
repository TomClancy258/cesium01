import * as THREE from 'three'
import type { ShallowRef } from 'vue'
import { Pane } from 'tweakpane'
import vertexShader from './shaders/vertex-shader.glsl?raw'
import fragmentShader from './shaders/fragment-shader.glsl?raw'

type BeforeRenderHandle = (fn: () => void) => () => void

export interface PixelateSetupResult {
  plane: THREE.Mesh
  dispose: () => void
}

export async function setupColorChange(
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
    '/textures/blob/blob_raw.png',
  )
  godot2DTexture.wrapS = THREE.RepeatWrapping
  godot2DTexture.wrapT = THREE.RepeatWrapping
  godot2DTexture.colorSpace = THREE.NoColorSpace

  const params={
    vibrance:1.0
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      godot2D: { value: godot2DTexture },
      u_vibrance: { value: params.vibrance },
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


  const unsubscribeBeforeRender = onBeforeRender(() => {
    timer.update()
    const elapsed = timer.getElapsed()
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
    godot2DTexture.dispose()
  }

  return { plane, dispose }
}
