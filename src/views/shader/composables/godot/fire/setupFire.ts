import * as THREE from 'three'
import type { ShallowRef } from 'vue'
import { Pane } from 'tweakpane'
import vertexShader from './shaders/vertex-shader.glsl?raw'
import fragmentShader from './shaders/fragment-shader.glsl?raw'

type BeforeRenderHandle = (fn: () => void) => () => void
const NOISE_SCROLL_PERIOD_SEC = 5

export interface PixelateSetupResult {
  plane: THREE.Mesh
  dispose: () => void
}

export async function setupFire(
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
  const noiseTexture = await new THREE.TextureLoader().loadAsync(
    '/textures/noise/noise02.png',
  )
  godot2DTexture.wrapS = THREE.RepeatWrapping
  godot2DTexture.wrapT = THREE.RepeatWrapping
  godot2DTexture.colorSpace = THREE.NoColorSpace

  noiseTexture.wrapS = THREE.RepeatWrapping
  noiseTexture.wrapT = THREE.RepeatWrapping
  noiseTexture.colorSpace = THREE.NoColorSpace

  const imageWidth = godot2DTexture.width
  const imageHeight = godot2DTexture.height

  const params={
    pixelSize:4,
    mask:0.4,
    gradient:0.1
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      godot2D: { value: godot2DTexture },
      noise: { value: noiseTexture },
      u_imageSize: { value: new THREE.Vector2(imageWidth, imageHeight) },
      u_pixelSize: { value: params.pixelSize },
      u_mask: { value: params.mask },
      u_gradient: { value: params.gradient },
      u_noiseOffsetY: { value: 0.0 },
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

  /**
   * 与 setupSimpleShape 的 setZero2One 同型：
   * 每 NOISE_SCROLL_PERIOD_SEC 秒，offsetX 线性 0→1，到 1 后从 0 再开始
   */
  const setNoiseOffsetY = (elapsedSec: number): void => {
    const noiseOffsetY =
      (elapsedSec % NOISE_SCROLL_PERIOD_SEC) / NOISE_SCROLL_PERIOD_SEC
    material.uniforms.u_noiseOffsetY.value = noiseOffsetY
  }

  const unsubscribeBeforeRender = onBeforeRender(() => {
    timer.update()
    const elapsed = timer.getElapsed()
    setNoiseOffsetY(elapsed)
  })

  const pane = new Pane({ title: 'Godot2D' })
  pane
    .addBinding(params, 'pixelSize', {
      label: 'pixelSize',
      min: 1,
      max: 30,
      step: 1,
    })
    .on('change', (ev) => {
      material.uniforms.u_pixelSize.value = ev.value
    })
  pane
    .addBinding(params, 'mask', {
      label: 'mask',
      min: 0.0,
      max: 1.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_mask.value = ev.value
    })
  pane
    .addBinding(params, 'gradient', {
      label: 'gradient',
      min: 0.00,
      max: 0.10,
      step: 0.01,
    })
    .on('change', (ev) => {
      material.uniforms.u_gradient.value = ev.value
    })

  const dispose = (): void => {
    unsubscribeBeforeRender()
    pane.dispose()
    scene.value?.remove(plane)
    geometry.dispose()
    material.dispose()
    godot2DTexture.dispose()
    noiseTexture.dispose()
  }

  return { plane, dispose }
}
