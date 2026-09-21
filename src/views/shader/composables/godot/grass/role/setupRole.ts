import * as THREE from 'three'
import type { Pane } from 'tweakpane'
import { PLANE_HALF } from '../ground/setupGround'

const ROLE_STEP = 0.25
const ROLE_SIZE = 0.8

export interface RoleSetupResult {
  role: THREE.Mesh
  material: THREE.MeshBasicMaterial
  dispose: () => void
}

export interface RoleSetupOptions {
  parent: THREE.Object3D
  pane: Pane
  /** 角色脚底（根）在地面局部 xy 变化时通知，由草去写 u_roleRootPosition */
  onRootPositionChange?: (rootPosition: THREE.Vector2) => void
}

export async function setupRole(
  options: RoleSetupOptions,
): Promise<RoleSetupResult> {
  const { parent, pane, onRootPositionChange } = options

  const params = {
    size: ROLE_SIZE,
  }

  const texture = await new THREE.TextureLoader().loadAsync(
    '/textures/role/milk-dragon/idle.png',
  )
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter

  // 脚底在局部原点；role.position 即脚底（根）在地面局部坐标
  const geometry = new THREE.PlaneGeometry(1, 1)
  geometry.translate(0, 0.5, 0)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    alphaTest: 0.1,
  })
  const role = new THREE.Mesh(geometry, material)
  const roleRootPosition = new THREE.Vector3(0, 0, 0.02)
  role.position.copy(roleRootPosition)
  role.scale.setScalar(params.size)
  role.renderOrder = 2
  parent.add(role)

  const syncRoleRootPosition = (): void => {
    onRootPositionChange?.(
      new THREE.Vector2(role.position.x, role.position.y),
    )
  }
  syncRoleRootPosition()

  const folder = pane.addFolder({ title: 'Role' })
  folder
    .addBinding(params, 'size', {
      min: 0.1,
      max: 2.0,
      step: 0.05,
    })
    .on('change', (ev) => {
      role.scale.setScalar(ev.value)
    })

  const onRoleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return

    let dx = 0
    let dy = 0
    if (event.key === 'ArrowLeft') dx = -ROLE_STEP
    else if (event.key === 'ArrowRight') dx = ROLE_STEP
    else if (event.key === 'ArrowDown') dy = -ROLE_STEP
    else if (event.key === 'ArrowUp') dy = ROLE_STEP
    else return

    event.preventDefault()
    role.position.x = THREE.MathUtils.clamp(
      role.position.x + dx,
      -PLANE_HALF,
      PLANE_HALF,
    )
    role.position.y = THREE.MathUtils.clamp(
      role.position.y + dy,
      -PLANE_HALF,
      PLANE_HALF,
    )
    syncRoleRootPosition()
  }
  window.addEventListener('keydown', onRoleKeyDown)

  const dispose = (): void => {
    window.removeEventListener('keydown', onRoleKeyDown)
    parent.remove(role)
    geometry.dispose()
    material.dispose()
    texture.dispose()
  }

  return { role, material, dispose }
}
