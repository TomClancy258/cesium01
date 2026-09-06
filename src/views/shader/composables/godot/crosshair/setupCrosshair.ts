import * as THREE from 'three'
import type { ShallowRef } from 'vue'
import { Pane } from 'tweakpane'
import vertexShader from './shaders/vertex-shader.glsl?raw'
import fragmentShader from './shaders/fragment-shader.glsl?raw'
import airplane01Jpg from '@/assets/img/airplane/jpg/airplane01.jpg'

export interface CrosshairSetupResult {
  plane: THREE.Mesh
  dispose: () => void
}

export function setupCrosshair(
  scene: ShallowRef<THREE.Scene | null>,
): CrosshairSetupResult | null {
  if (!scene.value) {
    console.error('[setupCrosshair] scene is not ready')
    return null
  }

  const texture = new THREE.TextureLoader().load(airplane01Jpg)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace

  const params = {
    centerCircleRadius: 0.05,
    ringOuterDistance: 0.5,
    ringWidth: 0.05,
    gapWidth: 0.2,
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      diffuse: { value: texture },
      u_centerCircleRadius: { value: params.centerCircleRadius },
      u_ringOuterDistance: { value: params.ringOuterDistance },
      u_ringWidth: { value: params.ringWidth },
      u_gapWidth: { value: params.gapWidth },
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

  const pane = new Pane({ title: 'Crosshair' })
  pane
    .addBinding(params, 'centerCircleRadius', {
      label: 'center radius',
      min: 0,
      max: 0.5,
      step: 0.001,
    })
    .on('change', (ev) => {
      material.uniforms.u_centerCircleRadius.value = ev.value
    })

  pane
    .addBinding(params, 'ringOuterDistance', {
      label: 'ringOuterDistance',
      min: 0,
      max: 0.5,
      step: 0.001,
    })
    .on('change', (ev) => {
      material.uniforms.u_ringOuterDistance.value = ev.value
    })

  pane
    .addBinding(params, 'ringWidth', {
      label: 'ringWidth',
      min: 0,
      max: 0.5,
      step: 0.001,
    })
    .on('change', (ev) => {
      material.uniforms.u_ringWidth.value = ev.value
    })

  pane
    .addBinding(params, 'gapWidth', {
      label: 'gapWidth',
      min: 0,
      max: 0.5,
      step: 0.001,
    })
    .on('change', (ev) => {
      material.uniforms.u_gapWidth.value = ev.value
    })

  const dispose = (): void => {
    pane.dispose()
    scene.value?.remove(plane)
    geometry.dispose()
    material.dispose()
    texture.dispose()
  }

  return { plane, dispose }
}
