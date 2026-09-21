import * as THREE from 'three'
import type { Pane } from 'tweakpane'
import vertexShader from './shaders/vertex-shader.glsl?raw'
import fragmentShader from './shaders/fragment-shader.glsl?raw'

const GRASS_WIDTH = 0.5
const GRASS_HEIGHT = 0.55

export interface GrassSetupResult {
  mesh: THREE.InstancedMesh
  material: THREE.ShaderMaterial
  setRoleRootPosition: (rootPosition: THREE.Vector2) => void
  dispose: () => void
}

/** 每棵草根在地面局部坐标系中的位置 */
const grassRootPositions = [
  new THREE.Vector3(-5, -5, 0),
  new THREE.Vector3(2, 2, 0),
  new THREE.Vector3(-1.0, -1.0, 0),
  new THREE.Vector3(-1.5, -1.0, 0),
  new THREE.Vector3(-2.0, -1.0, 0),
  new THREE.Vector3(-1.0, -1.5, 0),
  new THREE.Vector3(-1.5, -1.5, 0),
  new THREE.Vector3(-2.0, -1.5, 0),
  new THREE.Vector3(-1.0, -2.0, 0),
  new THREE.Vector3(-1.5, -2.0, 0),
  new THREE.Vector3(-2.0, -2.0, 0),
  new THREE.Vector3(-1.0, -3, 0),
]

export async function setupGrass(
  parent: THREE.Object3D,
  pane: Pane,
): Promise<GrassSetupResult> {
  const params = {
    scale: 1.0,
  }
  const grass01Texture = await new THREE.TextureLoader().loadAsync(
    '/textures/grass/grass01.png',
  )
  grass01Texture.colorSpace = THREE.NoColorSpace
  grass01Texture.magFilter = THREE.NearestFilter
  grass01Texture.minFilter = THREE.NearestFilter

  const material = new THREE.ShaderMaterial({
    uniforms: {
      grass01: { value: grass01Texture },
      u_pi: { value: Math.PI },
      u_roleRootPosition: { value: new THREE.Vector2(0, 0) },
      u_maxDistance: { value: 0.50 },
      u_minDistance: { value: 0.25 },
      u_maxBend: { value: 0.6 },
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
  })

  // 根部在局部原点，方便之后绕根弯曲
  const geometry = new THREE.PlaneGeometry(GRASS_WIDTH, GRASS_HEIGHT)
  geometry.translate(0, GRASS_HEIGHT / 2, 0)

  const mesh = new THREE.InstancedMesh(
    geometry,
    material,
    grassRootPositions.length,
  )
  mesh.renderOrder = 1
  parent.add(mesh)

  const dummy = new THREE.Object3D()
  const writeInstanceMatrices = (scale: number): void => {
    grassRootPositions.forEach((rootPosition, i) => {
      dummy.position.copy(rootPosition)
      // 草根在局部原点，缩放不会改变草根落点
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }
  writeInstanceMatrices(params.scale)

  const folder = pane.addFolder({ title: 'Grass' })
  folder
    .addBinding(params, 'scale', {
      min: 0.5,
      max: 2.0,
      step: 0.1,
    })
    .on('change', (ev) => {
      writeInstanceMatrices(ev.value)
    })
  folder.addBinding(material.uniforms.u_maxDistance, 'value', {
    label: 'maxDistance',
    min: 0.5,
    max: 5.0,
    step: 0.1,
  })
  folder.addBinding(material.uniforms.u_minDistance, 'value', {
    label: 'minDistance',
    min: 0.0,
    max: 2.0,
    step: 0.1,
  })
  folder.addBinding(material.uniforms.u_maxBend, 'value', {
    label: 'maxBend',
    min: 0.0,
    max: 1.5,
    step: 0.05,
  })

  const setRoleRootPosition = (rootPosition: THREE.Vector2): void => {
    material.uniforms.u_roleRootPosition.value.copy(rootPosition)
  }

  const dispose = (): void => {
    parent.remove(mesh)
    geometry.dispose()
    material.dispose()
    grass01Texture.dispose()
  }

  return { mesh, material, setRoleRootPosition, dispose }
}
