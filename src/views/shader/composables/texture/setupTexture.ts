import * as THREE from 'three'
import type { ShallowRef } from 'vue'
import vertexShader from './shaders/vertex-shader.glsl?raw'
import fragmentShader from './shaders/fragment-shader.glsl?raw'
import airplane01Jpg from '@/assets/img/airplane/jpg/airplane01.jpg'
import warningCirclePng from '@/assets/img/effects/png/warning-circle.png'

export function setupTexture(
  scene: ShallowRef<THREE.Scene | null>,
): THREE.Mesh | null {
  if (!scene.value) {
    console.error('[setupVaryingUniformAttribute] scene is not ready')
    return null
  }

  const texture = new THREE.TextureLoader().load(airplane01Jpg)
  const overlayTexture = new THREE.TextureLoader().load(warningCirclePng)

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  texture.colorSpace = THREE.SRGBColorSpace
  overlayTexture.colorSpace = THREE.SRGBColorSpace

  const material = new THREE.ShaderMaterial({
    uniforms: {
      diffuse: { value: texture },
      overlay: { value: overlayTexture },
      tint: { value: new THREE.Vector4(1,0,0,1) },
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
