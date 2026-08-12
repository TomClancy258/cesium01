import * as THREE from 'three'
import RAPIER from '@dimforge/rapier3d-compat'

/** 胶囊：总高 ≈ 2*halfHeight + 2*radius，对应站立约 PLAYER_HEIGHT */
//  ____
//  /    \     ← 上半球，半径 radius
// |      |
// |柱/中心|    ← 中间圆柱，高度 = 2 * halfHeight
// |      |
//  \____/     ← 下半球，半径 radius
  //总高度： 2×halfHeight+2×radius=2×0.45+2×0.35=0.9+0.7=1.6
  // 和之前的 PLAYER_HEIGHT = 1.6（大约一人高【估值】）对齐。
export const CAPSULE_RADIUS = 0.35 //radius：半球的半径
export const CAPSULE_HALF_HEIGHT = 0.45 //halfHeight：圆柱的高度的一半
/** 脚底(Three 原点) → 【胶囊中心】 =  底部半球半径 + 圆柱高度的一半 */
export const CAPSULE_CENTER_OFFSET_Y = CAPSULE_RADIUS + CAPSULE_HALF_HEIGHT

/** 不参与静态碰撞的节点名（叶片等动态/过碎网格） */
//因为这些网格不适合当成「固定墙/地」，硬加进静态碰撞会有问题或没必要。

  //fengshan*（风扇叶片）:
  // 在播 All Animations，叶片一直转
  // 静态 trimesh 是加载那一帧的形状，不会跟着转
  // 人走进冷却塔可能被「幽灵叶片」挡住，或形状和画面不一致
  // 三角多，还费建碰撞的时间
  // 碰撞应靠塔体外壳 / 底座等不动的 mesh，不靠转着的扇叶。

  //Cylinder001:
  // 在 useStationModels 里对地面模型做过 visible = false，多半是辅助体，不是给人走的地面
  // 看不见却能撞到，属于隐形障碍，体验怪

  //一句话： 只给「看得见、且基本不动」的建筑/地面做静态碰撞；动画件、隐藏辅助体跳过，避免错撞和白费性能。以后若某路灯太细也要跳过，往 SKIP_NAME_PREFIXES 加前缀即可。
const SKIP_NAME_PREFIXES = ['fengshan', 'Cylinder001'] as const

export type RapierPlayerPhysics = {
  world: RAPIER.World
  body: RAPIER.RigidBody
  collider: RAPIER.Collider
  controller: RAPIER.KinematicCharacterController
}

let rapierReady: Promise<void> | null = null

export function ensureRapierInit(): Promise<void> {
  rapierReady ??= RAPIER.init()
  return rapierReady
}

function shouldSkipMesh(mesh: THREE.Mesh): boolean {
  if (!mesh.visible || !mesh.geometry) return true
  let current: THREE.Object3D | null = mesh
  while (current) {
    const name = current.name || ''
    if (SKIP_NAME_PREFIXES.some((prefix) => name.startsWith(prefix))) return true
    current = current.parent
  }
  return false
}

/**
 * 把 Three Mesh 世界坐标三角网写入 Rapier 静态 trimesh。
 * 复杂站模可能较重，仅在加载时建一次。
 */
function addMeshTrimesh(
  world: RAPIER.World,
  mesh: THREE.Mesh,
  fixedBody: RAPIER.RigidBody,
): void {
  const geometry = mesh.geometry
  const position = geometry.getAttribute('position')
  if (!position || position.count < 3) return

  mesh.updateWorldMatrix(true, false)
  const vertices = new Float32Array(position.count * 3)
  const v = new THREE.Vector3()
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld)
    vertices[i * 3] = v.x
    vertices[i * 3 + 1] = v.y
    vertices[i * 3 + 2] = v.z
  }

  let indices: Uint32Array
  if (geometry.index) {
    indices = new Uint32Array(geometry.index.array)
  } else {
    indices = new Uint32Array(position.count)
    for (let i = 0; i < position.count; i++) indices[i] = i
  }
  if (indices.length < 3) return

  world.createCollider(RAPIER.ColliderDesc.trimesh(vertices, indices), fixedBody)
}

function addStaticCollidersFromObject(
  world: RAPIER.World,
  root: THREE.Object3D,
): void {
  //1. 更新世界矩阵
  //保证每个子节点的 matrixWorld 是最新的（含位移/旋转/缩放）。
  // 后面三角顶点要变到世界坐标，矩阵不准，墙会错位。
  root.updateWorldMatrix(true, true)
  //2. 一个固定刚体
  //fixed = 永远不动（地面、建筑）。
  // 后面很多 collider 都挂在这一个 body 上，相当于「整站静态碰撞绑在一根桩上」。
  const fixedBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed())
  let meshCount = 0
  //3. 遍历所有 Mesh
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    // 跳过风扇叶片等
    //一句话： 只给「看得见、且基本不动」的建筑/地面做静态碰撞；动画件、隐藏辅助体跳过，避免错撞和白费性能。以后若某路灯太细也要跳过，往 SKIP_NAME_PREFIXES 加前缀即可。
    if (shouldSkipMesh(child)) return
    try {
      addMeshTrimesh(world, child, fixedBody)
      meshCount += 1
    } catch (error) {
      console.warn('[rapierPlayerPhysics] skip mesh', child.name, error)
    }
  })
  if (meshCount === 0) {
    // 无场景网格时给一块地面，避免角色自由落体穿模
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(200, 0.1, 200).setTranslation(0, -0.1, 0),
      fixedBody,
    )
  }
}

/**
 * 创建世界：静态站模碰撞 + 角色运动学胶囊 + CharacterController。
 * feetY：Three 角色脚底世界高度。
 * 参数：
 * modelsRoot：泵站模型根（modelsGroup），用来生成静态碰撞
 * feetPosition：角色脚底位置（Three 里人站的位置）
 * options（有默认值）：{autostepMaxHeight：上台阶高度，snapToGroundDistance：贴地吸附距离}
 */
export function createRapierPlayerPhysics(
  modelsRoot: THREE.Object3D | null,
  feetPosition: THREE.Vector3,
  options?: { autostepMaxHeight?: number; snapToGroundDistance?: number },
): RapierPlayerPhysics {
  const autostepMaxHeight = options?.autostepMaxHeight ?? 0.45
  const snapToGroundDistance = options?.snapToGroundDistance ?? 0.3

  //1. 建物理世界，重力由外部 velocityY 写入 desiredMovement.y，世界重力置 0
  const world = new RAPIER.World({ x: 0, y: 0, z: 0 })
  //2. 静态碰撞（墙 / 地）
  if (modelsRoot) {
    // 站模 → trimesh
    addStaticCollidersFromObject(world, modelsRoot)
  } else {
    // 没有模型时，铺一块大平板当地面，避免掉进虚空
    const fixedBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed())
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(200, 0.1, 200).setTranslation(0, -0.1, 0),
      fixedBody,
    )
  }

  //「会动的壳」：位置、运动学/静态/动态。本身没有形状，即body=车架
  const body = world.createRigidBody(
    //3. 角色刚体（运动学）
    //etTranslation 设的是刚体（也是胶囊中心）的位置。
    //feetPosition为人物模型的脚底位置
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      feetPosition.x,
      feetPosition.y + CAPSULE_CENTER_OFFSET_Y,
      feetPosition.z,
    ),
  )
  //collider对撞机，参与碰撞的胶囊实体，即collider = 车的外形。
  const collider = world.createCollider(
    RAPIER.ColliderDesc.capsule(CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS),//设置胶囊形状
    body,//胶囊中心的世界坐标
  )

  //5. CharacterController（真正「走路逻辑」），即配置爬坡贴地
  const controller = world.createCharacterController(0.01)//离墙约 0.01m 就视为已碰撞、不能再贴进去
  //撞到动态物体时不推它们（站里几乎都是静态）
  controller.setApplyImpulsesToDynamicBodies(false)
  //允许自动迈上矮台阶
  //maxHeight = 0.45，台阶竖直高度 ≤ 约 0.45m 才尝试自动迈上去（不是保证一定能上，还看宽度等）
  //minWidth = 0.2，迈上去之后，落脚处前方还要有至少约 0.2m 宽的可站空间；太窄的檐/刀刃不算有效台阶
  //true，动态物体也可作为台阶（你们站里几乎都是静态）
  //所以：≤0.45m 且落脚够宽>=0.2m 才容易自动上台阶。
  controller.enableAutostep(autostepMaxHeight, 0.2, true)
  //贴地，减少悬空抖动
  controller.enableSnapToGround(snapToGroundDistance)
  //陡于约 45° 的坡爬不上去
  controller.setMaxSlopeClimbAngle((45 * Math.PI) / 180)
  //更陡时可能下滑
  controller.setMinSlopeSlideAngle((50 * Math.PI) / 180)

  //一句话： 建世界 → 场景当静态碰撞 → 人用运动学胶囊 → CharacterController 配置爬坡贴地；重力仍由外面的跳跃代码管。
  // body     → 人在世界的哪里（会动的点）
  // collider → 人碰撞时的外形（胶囊）
  // controller → 走路规则
  return { world, body, collider, controller }
}

export function setRapierBodyFromFeet(
  physics: RapierPlayerPhysics,
  feet: THREE.Vector3,
): void {
  physics.body.setTranslation(
    {
      x: feet.x,
      y: feet.y + CAPSULE_CENTER_OFFSET_Y,
      z: feet.z,
    },
    true,
  )
}

/**
 * 用期望位移做一次角色移动，写回脚底坐标，返回是否着地。
 * desiredMovement：本帧想移动的世界位移（含竖直）。
 */
export function stepRapierCharacter(
  physics: RapierPlayerPhysics,
  feet: THREE.Vector3,
  desiredMovement: THREE.Vector3,//「本帧想走多少」（含 WASD + 跳跃下落）
): boolean {
  // 人对齐物理，设置body的位置为feet的位置，即让物理车架和画面上的人对齐。
  setRapierBodyFromFeet(physics, feet)
  // 用期望位移算碰撞后位移=真实位移（先存在 controller 里）。
  physics.controller.computeColliderMovement(
    physics.collider,
    desiredMovement,
  )
  //computedMovement【已经计算好的存在 controller里的真实位移】 = get 结果。
  const movement = physics.controller.computedMovement()
  //读取「真实位移后，脚底是否着地」。
  // 给外面跳跃用：着地才能再跳、着地时清 velocityY。
  const grounded = physics.controller.computedGrounded()

  //当前 胶囊中心的世界坐标（位置），不是转向。
  const t = physics.body.translation()

  // 采纳结果，预约：下一步把车架（胶囊中心）放到「当前位置 + 实际可走位移」。就是设置车架的碰撞位移后的最终世界坐标
  // 运动学刚体常用 setNext...，等 world.step() 再生效。
  physics.body.setNextKinematicTranslation({
    x: t.x + movement.x,
    y: t.y + movement.y,
    z: t.z + movement.z,
  })
  //推进物理世界一拍：应用上面的 setNext...，更新 body 的真实 translation。
  physics.world.step()

  //step 之后，再读一次已经更新完的胶囊中心坐标。
  const after = physics.body.translation()
  //胶囊中心 → 减偏移 → Three 人物脚底位置（画面上的人跟过去）。
  feet.set(
    after.x,
    after.y - CAPSULE_CENTER_OFFSET_Y,
    after.z,
  )
  //告诉 tick：这帧着没着地。
  return grounded
}

export function disposeRapierPlayerPhysics(
  physics: RapierPlayerPhysics | null,
): void {
  if (!physics) return
  physics.world.free()
}
