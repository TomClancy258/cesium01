import * as THREE from 'three'
import type { ShallowRef } from 'vue'
import { Pane } from 'tweakpane'
import vertexShader from './shaders/vertex-shader.glsl?raw'
import fragmentShader from './shaders/fragment-shader.glsl?raw'
import airplane01Jpg from '@/assets/img/airplane/jpg/airplane01.jpg'

type BeforeRenderHandle = (fn: () => void) => () => void

/** 噪声 UV.x 偏移：每 5s 线性 0→1，然后归零再循环（锯齿波） */
const NOISE_SCROLL_PERIOD_SEC = 5

export interface ShieldSetupResult {
  plane: THREE.Mesh
  dispose: () => void
}

export function setupShield(
  scene: ShallowRef<THREE.Scene | null>,
  onBeforeRender: BeforeRenderHandle,
): ShieldSetupResult | null {
  if (!scene.value) {
    console.error('[setupShield] scene is not ready')
    return null
  }

  const timer = new THREE.Timer()
  timer.connect(document)

  // 暂用飞机图当噪声；换真正噪声图时保持 RepeatWrapping
  const noiseTexture = new THREE.TextureLoader().load('/textures/noise/noise01.png')
  noiseTexture.wrapS = THREE.RepeatWrapping
  noiseTexture.wrapT = THREE.RepeatWrapping
  noiseTexture.colorSpace = THREE.SRGBColorSpace

  const params = {
    shieldOuterDistToCenter: 0.5,
    shieldWidth: 0.25,
    intensity: 1.0,
    highlightPoint: {
      radius: 0.5,
      angle: Math.PI,
    },
    vertexPulse: 0.05,
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      noise: { value: noiseTexture },
      u_shieldOuterDistToCenter: { value: params.shieldOuterDistToCenter },
      u_shieldWidth: { value: params.shieldWidth },
      u_highlightPointRadius: { value: params.highlightPoint.radius },
      u_highlightPointAngle: { value: params.highlightPoint.angle },
      u_intensity: { value: params.intensity },
      u_noiseOffsetX: { value: 0 },
      u_time: { value: 0 },
      u_vertexPulse: { value: params.vertexPulse },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  })

  // 多分段，顶点径向位移才看得出「呼吸」；1×1 只有四角几乎像整片缩放
  // const geometry = new THREE.PlaneGeometry(1, 1, 32, 32)
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
  const setNoiseOffsetX = (elapsedSec: number): void => {
    const noiseOffsetX =
      (elapsedSec % NOISE_SCROLL_PERIOD_SEC) / NOISE_SCROLL_PERIOD_SEC
    material.uniforms.u_noiseOffsetX.value = noiseOffsetX
  }

  const unsubscribeBeforeRender = onBeforeRender(() => {
    timer.update()
    const elapsed = timer.getElapsed()
    material.uniforms.u_time.value = elapsed
    setNoiseOffsetX(elapsed)
  })

  const pane = new Pane({ title: 'Shield' })
  pane
    .addBinding(params, 'shieldOuterDistToCenter', {
      label: 'shieldOuterDistToCenter',
      min: 0,
      max: 0.5,
      step: 0.001,
    })
    .on('change', (ev) => {
      material.uniforms.u_shieldOuterDistToCenter.value = ev.value
    })

  pane
    .addBinding(params, 'shieldWidth', {
      label: 'shieldWidth',
      min: 0,
      max: 0.5,
      step: 0.001,
    })
    .on('change', (ev) => {
      material.uniforms.u_shieldWidth.value = ev.value
    })

  pane
    .addBinding(params, 'intensity', {
      label: 'intensity',
      min: 0,
      max: 5,
      step: 0.01,
    })
    .on('change', (ev) => {
      material.uniforms.u_intensity.value = ev.value
    })

  pane
    .addBinding(params, 'vertexPulse', {
      label: 'vertexPulse',
      min: 0,
      max: 0.2,
      step: 0.001,
    })
    .on('change', (ev) => {
      material.uniforms.u_vertexPulse.value = ev.value
    })

  const highlightFolder = pane.addFolder({ title: 'Highlight' })
  highlightFolder
    .addBinding(params.highlightPoint, 'radius', {
      label: 'radius',
      min: 0,
      max: 0.5,
      step: 0.001,
    })
    .on('change', (ev) => {
      material.uniforms.u_highlightPointRadius.value = ev.value
    })

  highlightFolder
    .addBinding(params.highlightPoint, 'angle', {
      label: 'angle',
      min: 0,
      max: Math.PI * 2,
      step: 0.01,
    })
    .on('change', (ev) => {
      material.uniforms.u_highlightPointAngle.value = ev.value
    })

  const dispose = (): void => {
    unsubscribeBeforeRender()
    pane.dispose()
    scene.value?.remove(plane)
    geometry.dispose()
    material.dispose()
    noiseTexture.dispose()
  }

  return { plane, dispose }
}
