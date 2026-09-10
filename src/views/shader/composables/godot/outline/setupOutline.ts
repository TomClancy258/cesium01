import * as THREE from 'three'
import type { ShallowRef } from 'vue'
import { Pane } from 'tweakpane'
import vertexShader from './shaders/vertex-shader.glsl?raw'
import fragmentShader from './shaders/fragment-shader.glsl?raw'

type BeforeRenderHandle = (fn: () => void) => () => void

export interface ShieldSetupResult {
  plane: THREE.Mesh
  dispose: () => void
}

const baseURL='/textures/bird/'
const BIRDS=[
  'bird-fly-01.png',
  'bird-fly-02.png',
  'bird-fly-03.png',
  'bird-fly-04.png',
]

export function setupOutline(
  scene: ShallowRef<THREE.Scene | null>,
  onBeforeRender: BeforeRenderHandle,
): ShieldSetupResult | null {
  if (!scene.value) {
    console.error('[setupShield] scene is not ready')
    return null
  }

  const timer = new THREE.Timer()
  timer.connect(document)

  // 暂用噪声图；保持 RepeatWrapping 以便 UV 滚动
  const birdTexture = new THREE.TextureLoader().load(baseURL+BIRDS[0])
  birdTexture.wrapS = THREE.RepeatWrapping
  birdTexture.wrapT = THREE.RepeatWrapping
  birdTexture.colorSpace = THREE.SRGBColorSpace

  const params = {
      borderWidth:0.005
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      bird: { value: birdTexture },
      u_borderWidth: { value: params.borderWidth },
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

  const pane = new Pane({ title: 'Bird' })
  pane
    .addBinding(params, 'borderWidth', {
      label: 'borderWidth',
      min: 0,
      max: 0.01,
      step: 0.001,
    })
    .on('change', (ev) => {
      material.uniforms.u_borderWidth.value = ev.value
    })

  const dispose = (): void => {
    unsubscribeBeforeRender()
    pane.dispose()
    scene.value?.remove(plane)
    geometry.dispose()
    material.dispose()
    birdTexture.dispose()
  }

  return { plane, dispose }
}
