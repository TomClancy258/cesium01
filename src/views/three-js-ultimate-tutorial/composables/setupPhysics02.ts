import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { ShallowRef } from 'vue'
import Ammo from 'ammojs-typed'

export interface SetupPhysicsOptions {
  scene: ShallowRef<THREE.Scene | null>
  camera: ShallowRef<THREE.Camera | null>
  renderer: ShallowRef<THREE.WebGPURenderer | null>
  controls: ShallowRef<OrbitControls | null>
  setFrameRender?: (fn: (() => void) | null) => void
  registerObject?: (object: THREE.Object3D) => void
  unregisterObject?: (object: THREE.Object3D) => void
  setPickingBlocked?: (fn: () => boolean) => void
  onBeforeRender?: (cb: () => void) => () => void
}

type AmmoModule = typeof Ammo
type PhysicsObject = {
  mesh: THREE.Mesh
  body: Ammo.btRigidBody
}

const HIT_SOUND_URL = '/sounds/hit.mp3'
const IMPACT_IMPULSE_THRESHOLD = 1.5

/**
 * Ammo.js 物理演示：对齐 Journey cannon 课的 createSphere / createBox / reset / 碰撞音效。
 */
export async function setupPhysics02(
  options: SetupPhysicsOptions,
): Promise<{ dispose: () => void } | null> {
  const { scene, camera, renderer, onBeforeRender } = options
  if (!scene.value || !camera.value || !renderer.value) {
    console.error('[setupPhysics02] scene/camera/renderer is not ready')
    return null
  }

  const threeScene = scene.value
  const threeRenderer = renderer.value

  // Vite / ESM 严格模式下不能直接 Ammo()，要用 call 提供 this
  const ammo = (await (
    Ammo as unknown as {
      call: (thisArg: unknown, target?: unknown) => Promise<AmmoModule>
    }
  ).call({}, Ammo)) as AmmoModule

  const collisionConfiguration = new ammo.btDefaultCollisionConfiguration()
  const dispatcher = new ammo.btCollisionDispatcher(collisionConfiguration)
  const broadphase = new ammo.btDbvtBroadphase()
  const solver = new ammo.btSequentialImpulseConstraintSolver()
  const world = new ammo.btDiscreteDynamicsWorld(
    dispatcher,
    broadphase,
    solver,
    collisionConfiguration,
  )
  world.setGravity(new ammo.btVector3(0, -9.82, 0))

  const tmpTransform = new ammo.btTransform()
  const objectsToUpdate: PhysicsObject[] = []

  const root = new THREE.Group()
  root.name = 'physics-demo'
  threeScene.add(root)

  // Floor（视觉）
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
      color: '#777777',
      metalness: 0.3,
      roughness: 0.4,
    }),
  )
  floor.receiveShadow = true
  floor.rotation.x = -Math.PI * 0.5
  root.add(floor)

  // Floor（物理：静态盒，厚度方便稳定 resting）
  let floorBody: Ammo.btRigidBody
  {
    const halfExtents = new ammo.btVector3(5, 0.05, 5)
    const shape = new ammo.btBoxShape(halfExtents)
    const transform = new ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new ammo.btVector3(0, -0.05, 0))
    const motionState = new ammo.btDefaultMotionState(transform)
    const localInertia = new ammo.btVector3(0, 0, 0)
    const rbInfo = new ammo.btRigidBodyConstructionInfo(
      0,
      motionState,
      shape,
      localInertia,
    )
    floorBody = new ammo.btRigidBody(rbInfo)
    floorBody.setFriction(0.1)
    floorBody.setRestitution(0.7)
    world.addRigidBody(floorBody)
    ammo.destroy(halfExtents)
    ammo.destroy(localInertia)
  }

  const hitSound = new Audio(HIT_SOUND_URL)
  let lastHitSoundAt = 0

  const playHitSound = (impulse: number): void => {
    if (impulse <= IMPACT_IMPULSE_THRESHOLD) return
    const now = performance.now()
    // 避免同一帧多接触点连响
    if (now - lastHitSoundAt < 30) return
    lastHitSoundAt = now
    hitSound.volume = Math.min(1, Math.random() * 0.5 + impulse * 0.05)
    hitSound.currentTime = 0
    void hitSound.play().catch(() => {
      /* 浏览器可能拦截未手势触发的 Audio */
    })
  }

  const detectCollisions = (): void => {
    const numManifolds = dispatcher.getNumManifolds()
    for (let i = 0; i < numManifolds; i++) {
      const manifold = dispatcher.getManifoldByIndexInternal(i)
      const numContacts = manifold.getNumContacts()
      for (let j = 0; j < numContacts; j++) {
        const contactPoint = manifold.getContactPoint(j)
        if (contactPoint.getDistance() > 0) continue
        playHitSound(Math.abs(contactPoint.getAppliedImpulse()))
      }
    }
  }

  const createRigidBody = (
    shape: Ammo.btCollisionShape,
    mass: number,
    position: { x: number; y: number; z: number },
  ): Ammo.btRigidBody => {
    const transform = new ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new ammo.btVector3(position.x, position.y, position.z))
    const motionState = new ammo.btDefaultMotionState(transform)
    const localInertia = new ammo.btVector3(0, 0, 0)
    if (mass > 0) shape.calculateLocalInertia(mass, localInertia)
    const rbInfo = new ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      shape,
      localInertia,
    )
    const body = new ammo.btRigidBody(rbInfo)
    body.setFriction(0.1)
    body.setRestitution(0.7)
    // 贴近 cannon allowSleep
    body.setSleepingThresholds(0.1, 0.1)
    world.addRigidBody(body)
    ammo.destroy(localInertia)
    return body
  }

  const sphereGeometry = new THREE.SphereGeometry(1, 20, 20)
  const sphereMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.4,
  })

  const createSphere = (
    radius: number,
    position: { x: number; y: number; z: number },
  ): void => {
    const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial)
    mesh.castShadow = true
    mesh.scale.setScalar(radius)
    mesh.position.set(position.x, position.y, position.z)
    root.add(mesh)

    const shape = new ammo.btSphereShape(radius)
    const body = createRigidBody(shape, 1, position)
    objectsToUpdate.push({ mesh, body })
  }

  const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
  const boxMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.4,
  })

  const createBox = (
    width: number,
    height: number,
    depth: number,
    position: { x: number; y: number; z: number },
  ): void => {
    const mesh = new THREE.Mesh(boxGeometry, boxMaterial)
    mesh.castShadow = true
    mesh.scale.set(width, height, depth)
    mesh.position.set(position.x, position.y, position.z)
    root.add(mesh)

    // Ammo Box 半尺寸，对齐 cannon 的 width*0.5
    const halfExtents = new ammo.btVector3(width * 0.5, height * 0.5, depth * 0.5)
    const shape = new ammo.btBoxShape(halfExtents)
    const body = createRigidBody(shape, 1, position)
    objectsToUpdate.push({ mesh, body })
    ammo.destroy(halfExtents)
  }

  const reset = (): void => {
    for (const object of objectsToUpdate) {
      world.removeRigidBody(object.body)
      ammo.destroy(object.body)
      root.remove(object.mesh)
    }
    objectsToUpdate.length = 0
  }

  createBox(1, 1.5, 2, { x: 0, y: 3, z: 0 })

  const debugObject = {
    createSphere: () => {
      createSphere(Math.random() * 0.5, {
        x: (Math.random() - 0.5) * 3,
        y: 3,
        z: (Math.random() - 0.5) * 3,
      })
    },
    createBox: () => {
      createBox(Math.random(), Math.random(), Math.random(), {
        x: (Math.random() - 0.5) * 3,
        y: 3,
        z: (Math.random() - 0.5) * 3,
      })
    },
    reset,
  }

  const inspector = threeRenderer.inspector
  if (inspector?.createParameters) {
    const physicsGui = inspector.createParameters('Physics')
    physicsGui.add(debugObject, 'createSphere')
    physicsGui.add(debugObject, 'createBox')
    physicsGui.add(debugObject, 'reset')
  }

  const clock = new THREE.Clock()
  const unsubscribeBeforeRender = onBeforeRender?.(() => {
    const deltaTime = Math.min(clock.getDelta(), 0.1)
    world.stepSimulation(deltaTime, 3)

    for (const object of objectsToUpdate) {
      const motionState = object.body.getMotionState()
      if (!motionState) continue
      motionState.getWorldTransform(tmpTransform)
      const origin = tmpTransform.getOrigin()
      const rotation = tmpTransform.getRotation()
      object.mesh.position.set(origin.x(), origin.y(), origin.z())
      object.mesh.quaternion.set(
        rotation.x(),
        rotation.y(),
        rotation.z(),
        rotation.w(),
      )
    }

    detectCollisions()
  })

  const dispose = (): void => {
    unsubscribeBeforeRender?.()
    reset()
    world.removeRigidBody(floorBody)
    ammo.destroy(floorBody)
    ammo.destroy(tmpTransform)
    ammo.destroy(world)
    ammo.destroy(solver)
    ammo.destroy(broadphase)
    ammo.destroy(dispatcher)
    ammo.destroy(collisionConfiguration)
    sphereGeometry.dispose()
    sphereMaterial.dispose()
    boxGeometry.dispose()
    boxMaterial.dispose()
    floor.geometry.dispose()
    ;(floor.material as THREE.Material).dispose()
    threeScene.remove(root)
  }

  return { dispose }
}
