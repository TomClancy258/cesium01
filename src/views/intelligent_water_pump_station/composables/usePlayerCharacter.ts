import * as THREE from 'three'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type CameraControls from 'camera-controls'
import { onUnmounted, ref, shallowRef, type ShallowRef } from 'vue'
import {
  createRapierPlayerPhysics,
  disposeRapierPlayerPhysics,
  ensureRapierInit,
  setRapierBodyFromFeet,
  stepRapierCharacter,
  type RapierPlayerPhysics,
} from './rapierPlayerPhysics'

const DRACO_DECODER_PATH = '/draco/gltf/'
const ROBOT_URL = 'model/intelligent-water-pump-station/Xbot.glb'

/** 出生点（地面） */
const SPAWN_POSITION = new THREE.Vector3(-19, 0, 11)

const MOVE_SPEED = 6
const JUMP_SPEED = 6
const GRAVITY = 18
const PLAYER_HEIGHT = 1.6
const CAMERA_DISTANCE = 5.5
const CAMERA_HEIGHT = 2.2
const MOUSE_SENSITIVITY = 0.0022
const PITCH_MIN = -0.35
const PITCH_MAX = 0.65
/** Mixamo/Xbot 模型正面为 +Z；转到朝向世界 +X */
const DEFAULT_FACING_Y = Math.PI / 2
/** 相机在角色身后：朝 +X 时摄像头应在 -X 侧 */
const DEFAULT_YAW = -Math.PI / 2
const ANIM_FADE_SEC = 0.2

type AfterRenderHandle = (fn: () => void) => () => void
type LocomotionAnim = 'idle' | 'run'

function findClipByName(
  clips: readonly THREE.AnimationClip[],
  name: string,
): THREE.AnimationClip | undefined {
  const lower = name.toLowerCase()
  return clips.find((clip) => clip.name.toLowerCase() === lower)
}

function disposeObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    child.geometry?.dispose()
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((material) => {
      if (!material) return
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) value.dispose()
      })
      material.dispose()
    })
  })
}

/**
 * 第三人称机器人：加载角色 GLB、WASD / 空格、鼠标转视角。
 * 碰撞：Rapier 运动学胶囊 + CharacterController（站模静态 trimesh）。
 * 漫游开启时关闭 CameraControls；关闭时复位出生点并恢复轨道操控。
 * 角色 tick 须挂 onBeforeRender：否则 CameraControls.update / 晚一帧跟拍会像盯着原点。
 */
export function usePlayerCharacter(
  scene: ShallowRef<THREE.Scene | null>,
  camera: ShallowRef<THREE.PerspectiveCamera | null>,
  renderer: ShallowRef<THREE.WebGLRenderer | null>,
  controls: ShallowRef<CameraControls | null>,
  modelsGroup: ShallowRef<THREE.Group | null>,
  onBeforeRender: AfterRenderHandle,
) {
  const roamEnabled = ref(false)
  const loading = ref(false)
  const robot = shallowRef<THREE.Group | null>(null)

  let dracoLoader: DRACOLoader | null = null
  let mixer: THREE.AnimationMixer | null = null
  /** 人物位移动画：默认 idle，WASD 移动时切 run（见 setLocomotionAnim） */
  let idleAction: THREE.AnimationAction | null = null
  let runAction: THREE.AnimationAction | null = null
  let currentLocomotion: LocomotionAnim = 'idle'
  let removeBeforeRender: (() => void) | null = null
  const timer = new THREE.Timer()
  timer.connect(document)

  let physics: RapierPlayerPhysics | null = null
  let velocityY = 0
  let grounded = false
  let yaw = DEFAULT_YAW
  let pitch = 0.28
  let pointerLocked = false

  const keys = {
    forward: false,
    back: false,
    left: false,
    right: false,
    jump: false,
  }

  const _forward = new THREE.Vector3()
  const _right = new THREE.Vector3()
  const _wish = new THREE.Vector3()
  const _desiredMove = new THREE.Vector3()
  const _lookAt = new THREE.Vector3()
  const _camOffset = new THREE.Vector3()

  const createGltfLoader = (): GLTFLoader => {
    dracoLoader ??= new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    return loader
  }

  const resetToSpawn = (): void => {
    const root = robot.value
    if (!root) return
    root.position.copy(SPAWN_POSITION)
    root.rotation.set(0, DEFAULT_FACING_Y, 0)
    velocityY = 0
    grounded = true
    yaw = DEFAULT_YAW
    pitch = 0.28
    if (physics) setRapierBodyFromFeet(physics, root.position)
    setLocomotionAnim('idle')
  }

  /** 在 idle / run 之间交叉淡入淡出（对应 glTF viewer 勾选动画） */
  const setLocomotionAnim = (next: LocomotionAnim): void => {
    if (currentLocomotion === next) return
    const from = currentLocomotion === 'idle' ? idleAction : runAction
    const to = next === 'idle' ? idleAction : runAction
    if (!to) return
    to.reset().setEffectiveWeight(1).fadeIn(ANIM_FADE_SEC).play()
    from?.fadeOut(ANIM_FADE_SEC)
    currentLocomotion = next
  }

  const updateCameraFollow = (playerPos: THREE.Vector3): void => {
    if (!camera.value) return
    const cosPitch = Math.cos(pitch)
    _camOffset.set(
      Math.sin(yaw) * cosPitch * CAMERA_DISTANCE,
      Math.sin(pitch) * CAMERA_DISTANCE + CAMERA_HEIGHT * 0.15,
      Math.cos(yaw) * cosPitch * CAMERA_DISTANCE,
    )
    camera.value.position.copy(playerPos).add(_camOffset)
    _lookAt.copy(playerPos)
    _lookAt.y += PLAYER_HEIGHT * 0.65
    camera.value.lookAt(_lookAt)
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!roamEnabled.value) return
    const key = event.code
    if (key === 'KeyW') keys.forward = true
    if (key === 'KeyS') keys.back = true
    if (key === 'KeyA') keys.left = true
    if (key === 'KeyD') keys.right = true
    if (key === 'Space') {
      event.preventDefault()
      keys.jump = true
    }
  }

  const onKeyUp = (event: KeyboardEvent): void => {
    const key = event.code
    if (key === 'KeyW') keys.forward = false
    if (key === 'KeyS') keys.back = false
    if (key === 'KeyA') keys.left = false
    if (key === 'KeyD') keys.right = false
    if (key === 'Space') keys.jump = false
  }

  const onMouseMove = (event: MouseEvent): void => {
    if (!roamEnabled.value || !pointerLocked) return
    yaw -= event.movementX * MOUSE_SENSITIVITY
    // 正 Y：鼠标下移 → pitch 增大 → 镜头抬高、视角朝下（不再反转）
    pitch += event.movementY * MOUSE_SENSITIVITY
    pitch = THREE.MathUtils.clamp(pitch, PITCH_MIN, PITCH_MAX)
  }

  const onPointerLockChange = (): void => {
    const canvas = renderer.value?.domElement
    pointerLocked = Boolean(canvas && document.pointerLockElement === canvas)
  }

  const requestPointerLock = (): void => {
    // 仅漫游模式下才锁指针；未勾选时点击场景不得隐藏鼠标
    if (!roamEnabled.value) return
    const canvas = renderer.value?.domElement
    if (!canvas || document.pointerLockElement === canvas) return
    void canvas.requestPointerLock()
  }

  const exitPointerLock = (): void => {
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
    pointerLocked = false
  }

  const bindPointerLockClick = (): void => {
    renderer.value?.domElement.addEventListener('click', requestPointerLock)
  }

  const unbindPointerLockClick = (): void => {
    renderer.value?.domElement.removeEventListener('click', requestPointerLock)
  }

  const bindInput = (): void => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('pointerlockchange', onPointerLockChange)
  }

  const unbindInput = (): void => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('pointerlockchange', onPointerLockChange)
    unbindPointerLockClick()
    exitPointerLock()
  }

  const tick = (): void => {
    const root = robot.value
    if (!root) return

    // Timer 须先 update；getDelta 为帧间隔（秒），供动画与位移共用
    timer.update()
    //timer.getDelta() 当前帧与上一帧之间的时间差（秒）。
    const delta = Math.min(timer.getDelta(), 0.05)
    mixer?.update(delta)

    if (!roamEnabled.value) return

    _forward.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize()
    _right.set(Math.cos(yaw), 0, -Math.sin(yaw)).normalize()
    _wish.set(0, 0, 0)
    if (keys.forward) _wish.add(_forward)
    if (keys.back) _wish.sub(_forward)
    if (keys.right) _wish.add(_right)
    if (keys.left) _wish.sub(_right)
    if (_wish.lengthSq() > 0) {
      _wish.normalize()
      // 模型正面 +Z：atan2(x,z) 使朝向与移动方向一致
      root.rotation.y = Math.atan2(_wish.x, _wish.z)
      setLocomotionAnim('run')
    } else {
      setLocomotionAnim('idle')
    }

    if (keys.jump && grounded) {
      velocityY = JUMP_SPEED
      grounded = false
      keys.jump = false
    }

    velocityY -= GRAVITY * delta

    // 期望位移交给 Rapier CharacterController（挡墙 / 贴地 / 上台阶）
    _desiredMove.set(
      _wish.x * MOVE_SPEED * delta,
      velocityY * delta,
      _wish.z * MOVE_SPEED * delta,
    )

    if (physics) {
      grounded = stepRapierCharacter(physics, root.position, _desiredMove)
      if (grounded && velocityY < 0) velocityY = 0
    } else {
      root.position.add(_desiredMove)
    }

    updateCameraFollow(root.position)
  }

  const setRoamEnabled = (enabled: boolean): void => {
    roamEnabled.value = enabled
    if (!controls.value) return

    if (enabled) {
      controls.value.enabled = false
      timer.reset()
      if (robot.value) {
        if (physics) setRapierBodyFromFeet(physics, robot.value.position)
        updateCameraFollow(robot.value.position)
      }
      // 勾选漫游后才监听点击并锁指针；浏览器可能要求再次点击画布才真正锁定
      bindPointerLockClick()
      requestPointerLock()
    } else {
      unbindPointerLockClick()
      controls.value.enabled = true
      resetToSpawn()
      exitPointerLock()
      if (camera.value && controls.value) {
        // 退出漫游后飞回站点俯视习惯位，避免停在角色身后
        const target = robot.value?.position.clone() ?? SPAWN_POSITION.clone()
        void controls.value
          .normalizeRotations()
          .setLookAt(
            target.x + 70,
            target.y + 50,
            target.z + 70,
            target.x,
            target.y,
            target.z,
            true,
          )
      }
    }
  }

  const loadRobot = async (): Promise<void> => {
    if (!scene.value) {
      console.error('[usePlayerCharacter] scene is not ready')
      return
    }
    disposeRobot()
    loading.value = true
    try {
      await ensureRapierInit()

      const loader = createGltfLoader()
      const gltf = await loader.loadAsync(ROBOT_URL)
      const root = gltf.scene
      root.name = 'robot'
      root.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      root.position.copy(SPAWN_POSITION)
      root.rotation.set(0, DEFAULT_FACING_Y, 0)
      scene.value.add(root)
      robot.value = root

      disposeRapierPlayerPhysics(physics)
      physics = createRapierPlayerPhysics(modelsGroup.value, root.position)

      /**
       * 人物动画控制处：clip 在 gltf.animations（idle / run / walk…）。
       * 默认只 play idle；WASD 有移动时 tick → setLocomotionAnim('run')。
       * 推进仍靠每帧 mixer.update(delta)。
       */
      idleAction = null
      runAction = null
      currentLocomotion = 'idle'
      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(root)
        const idleClip = findClipByName(gltf.animations, 'idle')
        const runClip = findClipByName(gltf.animations, 'run')
        if (idleClip) {
          idleAction = mixer.clipAction(idleClip)
          idleAction.play()
        }
        if (runClip) {
          runAction = mixer.clipAction(runClip)
          runAction.setEffectiveWeight(0)
        }
        if (!idleClip) {
          console.warn('[usePlayerCharacter] missing idle clip', gltf.animations.map((c) => c.name))
        }
        if (!runClip) {
          console.warn('[usePlayerCharacter] missing run clip', gltf.animations.map((c) => c.name))
        }
      }

      removeBeforeRender?.()
      timer.reset()
      // 须在 composer.render 之前更新相机，否则本帧仍被 CameraControls 或旧朝向画出去
      removeBeforeRender = onBeforeRender(tick)
      bindInput()
    } catch (error) {
      console.error('[usePlayerCharacter] failed to load robot', error)
    } finally {
      loading.value = false
    }
  }

  const disposeRobot = (): void => {
    unbindInput()
    removeBeforeRender?.()
    removeBeforeRender = null
    disposeRapierPlayerPhysics(physics)
    physics = null
    mixer?.stopAllAction()
    mixer = null
    idleAction = null
    runAction = null
    currentLocomotion = 'idle'
    const root = robot.value
    if (root) {
      root.removeFromParent()
      disposeObject3D(root)
      robot.value = null
    }
    roamEnabled.value = false
    if (controls.value) controls.value.enabled = true
  }

  onUnmounted(() => {
    disposeRobot()
    timer.dispose()
    dracoLoader?.dispose()
    dracoLoader = null
  })

  return {
    roamEnabled,
    loading,
    robot,
    loadRobot,
    disposeRobot,
    setRoamEnabled,
  }
}
