import * as THREE from 'three'
import type { ShallowRef } from 'vue'
import vertexShader from './shaders/vertex-shader.glsl?raw'
import fragmentShader from './shaders/fragment-shader.glsl?raw'

/**
 * 对应教程里的 setupProject_：
 * 用自定义 ShaderMaterial 铺一块 Plane，演示 UV → 颜色。
 * 接收 ShallowRef，与 useStationModels 等 composable 一致；调用方在 initScene 之后传入 scene。
 */
export function setupStepMixSmoothstep(
  scene: ShallowRef<THREE.Scene | null>,
): THREE.Mesh | null {
  if (!scene.value) {
    console.error('[setupVaryingUniformAttribute] scene is not ready')
    return null
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
    },
    vertexShader,
    fragmentShader,
  })

  const geometry = new THREE.PlaneGeometry(1, 1)

  const plane = new THREE.Mesh(geometry, material)
  plane.position.set(0, 0, 0)
  scene.value.add(plane)

  return plane
}
