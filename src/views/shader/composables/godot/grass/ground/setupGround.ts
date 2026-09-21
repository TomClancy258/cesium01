import * as THREE from 'three'
import type { Pane } from 'tweakpane'
import vertexShader from './shaders/vertex-shader.glsl?raw'
import fragmentShader from './shaders/fragment-shader.glsl?raw'

export const PLANE_SIZE = 10
export const PLANE_HALF = PLANE_SIZE / 2

export interface GroundSetupResult {
  ground: THREE.Mesh
  material: THREE.ShaderMaterial
  dispose: () => void
}

export async function setupGround(
  scene: THREE.Scene,
  pane: Pane,
  onPositionChange?: (position: THREE.Vector3) => void,
): Promise<GroundSetupResult> {
  const params = {
    rotX: 0.0,
    rotY: 0.0,
    rotZ: 0.0,
    scale: 1.0,
    position: new THREE.Vector3(0, 0, 0),
  }
  const ground01Texture = await new THREE.TextureLoader().loadAsync(
    '/textures/ground/ground01.png',
  )
  ground01Texture.wrapS = THREE.RepeatWrapping
  ground01Texture.wrapT = THREE.RepeatWrapping
  ground01Texture.colorSpace = THREE.NoColorSpace

  const material = new THREE.ShaderMaterial({
    uniforms: {
      ground01: { value: ground01Texture },
      u_time: { value: 0 },
      u_rotX: { value: params.rotX },
      u_rotY: { value: params.rotY },
      u_rotZ: { value: params.rotZ },
      u_scale: { value: params.scale },
      u_pi: { value: Math.PI },
      u_rolePosition: { value: new THREE.Vector2(0, 0) },
      u_minRadius: { value: 0.8 },
      u_maxRadius: { value: 1.8 },
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
  })

  const geometry = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, 64, 64)
  const ground = new THREE.Mesh(geometry, material)
  ground.position.set(5, 5, 0)
  ground.lookAt(5, 5, 1)
  scene.add(ground)

  const folder = pane.addFolder({ title: 'Ground' })
  folder
    .addBinding(params, 'rotX', {
      min: 0.0,
      max: 1.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_rotX.value = ev.value
    })
  folder
    .addBinding(params, 'rotY', {
      min: 0.0,
      max: 1.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_rotY.value = ev.value
    })
  folder
    .addBinding(params, 'rotZ', {
      min: 0.0,
      max: 1.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_rotZ.value = ev.value
    })
  folder
    .addBinding(params, 'scale', {
      min: 1.0,
      max: 2.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      material.uniforms.u_scale.value = ev.value
    })
  // AxesHelper：+X 红向右，+Y 绿向上，+Z 蓝朝向默认观察侧。拾取框默认 Y 朝下，所以 Y 要 inverted。
  folder
    .addBinding(params, 'position', {
      x: { min: -20.0, max: 20.0, step: 1.0 },
      y: { min: -20.0, max: 20.0, step: 1.0, inverted: true },
      z: { min: -20.0, max: 20.0, step: 1.0 },
    })
    .on('change', (ev) => {
      ground.position.set(ev.value.x, ev.value.y, ev.value.z)
      onPositionChange?.(ground.position)
    })

  const dispose = (): void => {
    scene.remove(ground)
    geometry.dispose()
    material.dispose()
    ground01Texture.dispose()
  }

  return { ground, material, dispose }
}
