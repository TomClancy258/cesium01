import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { useThrottleFn } from '@vueuse/core'
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
export async function setupPhysics01(
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

  //从 motionState 读出刚体当前世界位姿（位置 + 旋转）的临时容器，复用同一个避免每帧 new
  const tmpTransform = new ammo.btTransform()
  const objectsToUpdate: PhysicsObject[] = []

  const root = new THREE.Group()
  root.name = 'physics-demo'
  threeScene.add(root)

  // Floor（视觉）
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
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
    //半尺寸 → 实际约 10 × 0.1 × 10 的扁盒子
    const halfExtents = new ammo.btVector3(10, 0.05, 10)
    //碰撞形状用盒子（比无限平面更好 resting）
    const shape = new ammo.btBoxShape(halfExtents)
    const transform = new ammo.btTransform()
    //setIdentity()调用之后，这个 btTransform 变成「不平移、不旋转」,是为了清掉可能残留的旋转，避免一个新建的变换带着脏数据。
    transform.setIdentity()
    //把halfExtents的中心点世界坐标放在了(0, -0.05, 0)
    //若坚持中心 (0,0,0)，物体会在大约 y=0.05 就“落地”，看起来像浮在地板上一点。
    transform.setOrigin(new ammo.btVector3(0, -0.05, 0))
    //存初始位姿，动态体每帧靠它同步；地板基本不动
    const motionState = new ammo.btDefaultMotionState(transform)
    //静态体惯量一般为 0，写成 (0, 0, 0) 只表示这个物体绕三轴都没有旋转惯性。
    //localInertia 的三个分量是刚体自身局部坐标轴上的转动惯量，不是 Three.js 的世界坐标轴。物体没有旋转时，局部轴碰巧和世界 XYZ 重合；一旦物体转了，这三轴就跟着物体一起转。
    const localInertia = new ammo.btVector3(0, 0, 0)
    const rbInfo = new ammo.btRigidBodyConstructionInfo(
      0, //静态，不受重力、推不动。管什么：【平动：多重、重力、被推有多难加速】
      motionState, //存初始位姿（位置 + 旋转。 它不存速度。），动态体每帧靠它同步；地板基本不动
      shape, //碰撞形状用盒子（比无限平面更好 resting）
      //静态体惯量一般为 0，【静态地板 mass = 0：不参与动力学，惯量也写成 (0,0,0) 即可】。
      //管什么：【转动：绕 x/y/z 旋转有多难（力矩 → 角加速度）】
      localInertia,//不是当前转了多少。 它是转动惯量，表示绕自身三轴有多难被扭动。
    )
    floorBody = new ammo.btRigidBody(rbInfo)
    //摩擦偏小，物体更容易滑
    floorBody.setFriction(1)
    //弹性较高，更容易弹
    floorBody.setRestitution(0.7)
    //加入物理世界，之后才会参与碰撞
    world.addRigidBody(floorBody)
    //释放临时 btVector3，防 WASM 内存泄漏
    ammo.destroy(halfExtents)
    ammo.destroy(localInertia)
  }

  const hitSound = new Audio(HIT_SOUND_URL)

  // 避免同一帧多接触点连响；阈值判断放在 throttle 外，弱碰撞不占冷却
  const playHitSoundThrottled = useThrottleFn((impulse: number) => {
    //浏览器要求 Audio.volume 在 0 ~ 1。
    hitSound.volume = Math.min(1, Math.random() * 0.5 + impulse * 0.05)
    //让音效 从头再播。
    //同一段 Audio 若还在播或停在末尾，只调 play() 往往不会清脆地再响一声。先 currentTime = 0 再 play()，每次碰撞都像“重新敲一下”。
    hitSound.currentTime = 0
    void hitSound.play().catch(() => {
      /* 浏览器可能拦截未手势触发的 Audio */
    })
  }, 30)

  const playHitSound = (impulse: number): void => {
    if (impulse <= IMPACT_IMPULSE_THRESHOLD) return
    playHitSoundThrottled(impulse)
  }

  const detectCollisions = (): void => {
    //本帧碰撞调度器里有多少个 manifold（接触流形）。
    // 触碰对的个数（例如球 A ↔ 地面、箱 B ↔ 球 A，则numManifolds=2）。
    const numManifolds = dispatcher.getNumManifolds()
    for (let i = 0; i < numManifolds; i++) {
      //取出第 i 个接触对。
      const manifold = dispatcher.getManifoldByIndexInternal(i)

      //-------------------------------
      //**********
      //body.userData = { kind: 'metal' }
      //**********
      //const bodyA = manifold.getBody0()
      // const bodyB = manifold.getBody1()
      // const a = bodyInfo.get(bodyA)?.kind
      // const b = bodyInfo.get(bodyB)?.kind
      //------------------------------

      //这一对物体之间有几个 接触点（盒-盒可能多个角/边，球-面通常 1 个）。
      const numContacts = manifold.getNumContacts()
      for (let j = 0; j < numContacts; j++) {
        //第 j 个接触点的详细数据（位置、法线、距离、冲量等）。
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
    //质量大于 0 的动态刚体被撞偏、或力没有打在质心上时，就会一边移动一边自转。
    // calculateLocalInertia 就是按形状和质量算出它绕自身三轴有多难转。
    if (mass > 0) shape.calculateLocalInertia(mass, localInertia)
    //rb=rigid body=用来构造刚体的那包参数
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
    //参数一：线速度严格低于 0.1（米/秒）。参数二：角速度严格低于 0.1（弧度/秒）
    //两个速度同时低于阈值，并且保持大约 2 秒，这个刚体才会休眠。
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
    //没有规定必须写成 1。它只是演示里方便的默认值，大致可以当成千克。
    //真正影响手感的是物体之间的相对轻重：1 的球撞 1 的箱子会互相让；1 的球撞 100 的箱子，箱子几乎不动。
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
    //timeStep=deltaTime：这一帧要追赶的真实时间
    //maxSubSteps=3：内部最多用几个 1/60 小步追完，防止一帧算爆
    //fixedTimeStep 默认 1/60： 固定物理步长，保证模拟稳定
    world.stepSimulation(deltaTime, 3)

    for (const object of objectsToUpdate) {
      const motionState = object.body.getMotionState()
      if (!motionState) continue
      motionState.getWorldTransform(tmpTransform)
      const origin = tmpTransform.getOrigin()
      const rotation = tmpTransform.getRotation()
      object.mesh.position.set(origin.x(), origin.y(), origin.z())
      //四元数
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
