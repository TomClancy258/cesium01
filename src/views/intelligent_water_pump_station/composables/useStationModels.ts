import * as THREE from 'three'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { onUnmounted, ref, shallowRef, type ShallowRef } from 'vue'
import type { EquipmentSource, EquipmentStatus, StationWsPayload } from '../types/station-equipment'
import {
  EQUIPMENT_SOURCES,
  STATUS_HIGHLIGHT_COLOR,
  STATUS_HIGHLIGHT_INTENSITY,
} from '../types/station-equipment'
import {
  applyWaterSurfaceEffect,
  disposeSharedWaterNormal,
  ensureWaterNormalLoaded,
  isSharedWaterNormalTexture,
} from './station-water-surface'

type EmissiveMaterial = THREE.Material & {
  emissive?: THREE.Color
  emissiveIntensity?: number
}

/** 材质视觉层：只备份 original 数值；status 由入参传入，真相在 store */
type MaterialVisual = {
  original: {
    emissive: number
    emissiveIntensity: number
  }
}

/** Draco 解码器放在 public/draco/gltf，支持内网部署 */
const DRACO_DECODER_PATH = '/draco/gltf/'

const MODEL_BASE = 'model/intelligent-water-pump-station'

/** public/model 经 Vite 代理后的泵站分片模型 */
const MODEL_FILES = [
  'sbz-daguanzi.glb',
  'sbz-dimian.glb',
  'sbz-dimian-ludeng.glb',
  'sbz-fangzi.glb',
  'sbz-guanzihefengshan.glb',
  'sbz-huatan-men.glb',
  'sbz-ludeng.glb',
  'sbz-shuichi.glb',
  'sbz-yancun.glb',
] as const

/** 需要 hover / select 的模型（声明用数组；查找用 Set） */
const MODEL_INTERACTION_FILES = [
  'sbz-daguanzi.glb',
  'sbz-fangzi.glb',
  'sbz-guanzihefengshan.glb',
  'sbz-shuichi.glb',
  'sbz-ludeng.glb',
  'sbz-yancun.glb',
] as const

const MODEL_INTERACTION_FILE_SET = new Set<string>(MODEL_INTERACTION_FILES)

function captureMaterialVisual(material: EmissiveMaterial): void {
  if (!material.emissive) return
  if (material.userData.visual) return
  material.userData.visual = {
    original: {
      emissive: material.emissive.getHex(),
      emissiveIntensity: material.emissiveIntensity ?? 1,
    },
  } satisfies MaterialVisual
}

/** status 由调用方传入（来自 store/帧数据）；normal 时写回 original 数值 */
function applyMaterialByPriority(
  material: EmissiveMaterial,
  status: EquipmentStatus,
): void {
  const visual = material.userData.visual as MaterialVisual | undefined
  if (!visual || !material.emissive) return

  if (status === 'normal') {
    material.emissive.setHex(visual.original.emissive)
    material.emissiveIntensity = visual.original.emissiveIntensity
    return
  }

  const color = STATUS_HIGHLIGHT_COLOR[status]
  if (color === null) return
  material.emissive.setHex(color)
  material.emissiveIntensity = STATUS_HIGHLIGHT_INTENSITY[status]
}

/** 交互节点材质各自 clone，并备份 original 数值 */
function ensureUniqueMaterials(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => material.clone())
    } else if (child.material) {
      child.material = child.material.clone()
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((material) => {
      if (material) captureMaterialVisual(material as EmissiveMaterial)
    })
  })
}

function markInteractive(child: THREE.Object3D): void {
  child.userData.interactive = true
  child.userData.name = child.name
  ensureUniqueMaterials(child)
}

/** 子树 Mesh 投射阴影（设备根多为 Group，需 traverse） */
function setCastShadow(object: THREE.Object3D, enabled = true): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = enabled
    }
  })
}

function collectInteractiveTargets(file: string, root: THREE.Object3D): THREE.Object3D[] {
  if (root.name === 'sbz-shuichi') {
    // 例：shuichi-01 … shuichi-14 各是独立 Group；排除 qiao-2 等非水池子节点
    return root.children.filter((child) => {
      const isReservoir = child.name.startsWith('shuichi')
      if (!isReservoir) return false
      applyWaterSurfaceEffect(child)
      markInteractive(child)
      child.userData.text = child.name.replace('shuichi', '蓄水池')
      child.userData.source = 'reservoir'
      return true
    })
  } else if (root.name === 'sbz-guanzihefengshan') {
    return root.children.filter((child) => {
      // const isFan=child.name.startsWith('fengshan')
      // if (isFan) {
      //   console.log("child", child);
      // }
      const isCoolingTower = child.name.startsWith('paifengshan')
      const isCoolingTube = child.name.startsWith('guanzi')
      const isInteractive = isCoolingTower || isCoolingTube
      if (!isInteractive) return false
      markInteractive(child)
      if (isCoolingTower) {
        child.userData.text = child.name.replace('paifengshan', '冷却塔')
        child.userData.source = 'coolingTower'
      } else if (isCoolingTube) {
        child.userData.text = child.name.replace('guanzi', '冷却管')
        child.userData.source = 'coolingTube'
      }
      return true
    })
  } else if (root.name === 'sbz-ludeng') {
    return root.children.filter((child) => {
      const isStreetLight = child.name.startsWith('ld')
      if (!isStreetLight) return false
      markInteractive(child)
      child.userData.text = child.name.replace('ld','路灯')
      child.userData.source = 'streetlight'
      return true
    })
  } else if (root.name === 'sbz-yancun') {
    return root.children.filter((child) => {
      const isMixingTank = child.name.startsWith('01')
      const isPressureRegulatingTower = child.name.startsWith('yancun')
      const isInteractive = isMixingTank || isPressureRegulatingTower
      if (!isInteractive) return false
      markInteractive(child)
      if (isPressureRegulatingTower) {
        child.userData.text = child.name.replace('yancun', '调压塔')
        child.userData.source = 'pressureRegulatingTower'
      } else if (isMixingTank) {
        child.userData.text = child.name.replace('01', '搅拌池')
        child.userData.source = 'mixingTank'
      }
      return true
    })
  } else if (root.name === 'sbz-fangzi') {
    return root.children.filter((child) => {
      const isHouse = child.name.startsWith('fangzi')
      if (!isHouse) return false
      // fangzi-07 等内部可能有 shuimian-1 水面，与蓄水池共用波纹逻辑
      applyWaterSurfaceEffect(child)
      markInteractive(child)
      child.userData.text = child.name.replace('fangzi','厂房')
      child.userData.source = 'factoryBuilding'
      return true
    })
  } else if (root.name === 'sbz-daguanzi') {
    return root.children.filter((child) => {
      const isVerticalPressurizedTankBody = child.name.startsWith('daguanzi')
      if (!isVerticalPressurizedTankBody) return false
      markInteractive(child)
      child.userData.text = child.name.replace('daguanzi','承压罐')
      child.userData.source = 'pressurizedTank'
      return true
    })
  }

  console.warn('[collectInteractiveTargets] unhandled interaction root', root.name, file)
  return []
}

function applyStatusToObject(object: THREE.Object3D, status: EquipmentStatus): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    //child.material有可能是MeshStandardMaterial类型的对象，也有可能是MeshStandardMaterial[]类型的数组
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((material) => {
      if (!material) return
      // visual.original 已在 ensureUniqueMaterials 写入，此处只按 status 刷色
      applyMaterialByPriority(material as EmissiveMaterial, status)
    })
  })
}

function disposeObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        if (!material) return
        Object.values(material).forEach((value) => {
          if (!(value instanceof THREE.Texture)) return
          // 共享水面法线由 disposeSharedWaterNormal 统一释放
          if (isSharedWaterNormalTexture(value)) return
          value.dispose()
        })
        material.dispose()
      })
    }
  })
}

function fitCameraToObject(
  object: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls | null,
  offset?:THREE.Vector3
): void {
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) return

  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxSize = Math.max(size.x, size.y, size.z)
  const fitDistance =
    maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2))

  if (offset !== undefined) {
    camera.position.copy(center).add(offset)
  }else{
    camera.position.copy(center).add(new THREE.Vector3(fitDistance, fitDistance * 0.6, fitDistance))
  }

  // camera.near = Math.max(fitDistance / 100, 0.1)
  // camera.far = Math.max(fitDistance * 100, 2000)
  camera.updateProjectionMatrix()
  camera.lookAt(center)

  if (controls) {
    controls.target.copy(center)
    controls.update()
  }
}

type AfterRenderHandle = (fn: () => void) => () => void

export function useStationModels(
  scene: ShallowRef<THREE.Scene | null>,
  camera: ShallowRef<THREE.PerspectiveCamera | null>,
  controls: ShallowRef<OrbitControls | null>,
  onAfterRender?: AfterRenderHandle,
) {
  /** 整站模型根（加载成功后才有值）；角色物理 / 销毁 / 框选整站共用 */
  const modelsGroup = shallowRef<THREE.Group | null>(null)
  /**
   * 各 GLB 的 AnimationMixer 列表，供每帧统一 update。
   * play() 只把 clip 标成「在播」；必须 mixer.update(delta) 叶片才会转。
   */
  const animationMixers: THREE.AnimationMixer[] = []
  /** onAfterRender 返回的注销函数；dispose / 重载时卸掉，避免重复 tick */
  let removeAnimationTick: (() => void) | null = null
  /** 替代已弃用的 THREE.Clock：先 update()，再 getDelta() 取帧间隔（秒） */
  const animationTimer = new THREE.Timer()
  animationTimer.connect(document)
  /** 可交互根节点扁平缓存（由各类型 Map 重建，供 raycast / 标签） */
  const interactiveModels: THREE.Object3D[] = []
  /** 分类型 name → 可交互 Object3D */
  const reservoirMap = new Map<string, THREE.Object3D>()
  const coolingTowerMap = new Map<string, THREE.Object3D>()
  const coolingTubeMap = new Map<string, THREE.Object3D>()
  const streetlightMap = new Map<string, THREE.Object3D>()
  const pressureRegulatingTowerMap = new Map<string, THREE.Object3D>()
  const mixingTankMap = new Map<string, THREE.Object3D>()
  const factoryBuildingMap = new Map<string, THREE.Object3D>()
  const pressurizedTankMap = new Map<string, THREE.Object3D>()

  const loading = ref(false)
  const loadedCount = ref(0)
  const totalCount = MODEL_FILES.length

  let dracoLoader: DRACOLoader | null = null

  const getObjectMapBySource = (
    source: EquipmentSource,
  ): Map<string, THREE.Object3D> | null => {
    switch (source) {
      case 'reservoir':
        return reservoirMap
      case 'coolingTower':
        return coolingTowerMap
      case 'coolingTube':
        return coolingTubeMap
      case 'streetlight':
        return streetlightMap
      case 'pressureRegulatingTower':
        return pressureRegulatingTowerMap
      case 'mixingTank':
        return mixingTankMap
      case 'factoryBuilding':
        return factoryBuildingMap
      case 'pressurizedTank':
        return pressurizedTankMap
      default:
        return null
    }
  }

  const clearEquipmentMaps = (): void => {
    reservoirMap.clear()
    coolingTowerMap.clear()
    coolingTubeMap.clear()
    streetlightMap.clear()
    pressureRegulatingTowerMap.clear()
    mixingTankMap.clear()
    factoryBuildingMap.clear()
    pressurizedTankMap.clear()
  }

  /** 从各类型 Map 摊平到 interactiveModels（拾取 / 标签用） */
  const rebuildInteractiveModels = (): void => {
    interactiveModels.length = 0
    EQUIPMENT_SOURCES.forEach((source) => {
      const map = getObjectMapBySource(source)
      if (!map) return
      interactiveModels.push(...map.values())
    })
  }

  const registerInteractiveObject = (object: THREE.Object3D): void => {
    const key = (object.userData.name as string) || object.name
    const source = object.userData.source as EquipmentSource | undefined
    if (!key || !source) return
    getObjectMapBySource(source)?.set(key, object)
    setCastShadow(object, true)
  }

  const getObjectByName = (
    name: string,
    source: EquipmentSource,
  ): THREE.Object3D | null => {
    return getObjectMapBySource(source)?.get(name) ?? null
  }

  /** 按帧数据 status 给对应模型上色（normal / warning / danger） */
  const applyStatusFromPayload = (packets: StationWsPayload): void => {
    packets.forEach((packet) => {
      const objectMap = getObjectMapBySource(packet.source)
      if (!objectMap) return

      packet.data.forEach((row) => {
        const object = objectMap.get(row.name)
        if (!object) return
        applyStatusToObject(object, row.status)
      })
    })
  }

  const createGltfLoader = (): GLTFLoader => {
    dracoLoader ??= new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    return loader
  }

  //凡是 async 函数，调用时一定返回 Promise，不用手写 return new Promise(...)。
  const loadModels = async (): Promise<void> => {
    if (!scene.value) {
      console.error('[useStationModels] scene is not ready')
      return
    }

    disposeModels()

    loading.value = true
    loadedCount.value = 0

    // const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    // const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    // const cube = new THREE.Mesh( geometry, material );
    // cube.position.set(-19, 1, 11);
    // scene.value.add( cube );


    /**
     * 整站模型根（局部变量，加载过程中用）。
     * 流程：各 GLB 先 group.add 组装 → 全部成功后再 scene.add(group) 一次提交；
     * 成功后赋给 modelsGroup，供销毁 / 飞相机 / 角色物理碰撞共用同一根。
     * 用局部 group 而不是全程 modelsGroup.value：异步闭包里引用稳定，避免 .value 变 null。
     */
    const group = new THREE.Group()
    group.name = 'intelligent-water-pump-station'
    const loader = createGltfLoader()

    try {
      await ensureWaterNormalLoaded()

      // 1. map 返回新数组：[Promise, Promise, ...]
      const promises = MODEL_FILES.map(async (file) => {
        const url = `${MODEL_BASE}/${file}`
        const gltf = await loader.loadAsync(url)
        const modelName = file.replace(/\.glb$/i, '')
        gltf.scene.name = modelName
        // 先挂到 group 组装，尚未进 scene（批量提交前）
        group.add(gltf.scene)

        if (gltf.scene.name === 'sbz-dimian') {
          // getObjectByName：整棵子树查找；children.find 只查一层
          const cylinder: THREE.Object3D | undefined =
            gltf.scene.getObjectByName('Cylinder001')
          if (cylinder) {
            cylinder.visible = false
          }

          // dimian_1 本身是 Mesh，直接设即可
          const ground = gltf.scene.getObjectByName('dimian_1')
          if (ground instanceof THREE.Mesh) {
            ground.receiveShadow = true
          }
        } else if (gltf.scene.name === 'sbz-dimian-ludeng') {
          const cylinder: THREE.Object3D | undefined =
            gltf.scene.getObjectByName('dizhuan')
          if (cylinder) {
            // dizhuan_* 一层子节点已是 Mesh
            cylinder.children.forEach((child) => {
              if (child.name.startsWith('dizhuan') && child instanceof THREE.Mesh) {
                child.receiveShadow = true
              }
            })
          }
        } else if (gltf.scene.name === 'sbz-guanzihefengshan') {
          /**
           * 风扇动画：clip 在 gltf.animations（如 All Animations），不在 fengshan-*.animations。
           * 该 clip 内含 fengshan-01…08 的 quaternion 轨道，play 一次即八扇同转。
           */
          console.log("gltf", gltf);
          if (gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(gltf.scene)
            gltf.animations.forEach((clip) => {
              // 打开该 clip 的播放开关（等价 viewer 勾选动画）；停用用 action.stop()
              mixer.clipAction(clip).play()
            })
            //可能多个 GLB 各自有动画（风扇、以后水池等）,就用数组animationMixers保存每个模型的动画管理器mixer
            animationMixers.push(mixer)
          }
        }
        // 交互模型直接进各类型 Map，最后再摊平到 interactiveModels
        if (MODEL_INTERACTION_FILE_SET.has(file)) {
          const targets = collectInteractiveTargets(file, gltf.scene)
          for (const target of targets) {
            registerInteractiveObject(target)
          }
        }

        loadedCount.value += 1
      })

      // 2. 全部 GLB 就绪后再一次性进场景（批量提交，避免逐个蹦出来）
      await Promise.all(promises)

      scene.value.add(group)
      // 对外公布整站根：角色物理、disposeModels、fit 整站相机等
      modelsGroup.value = group
      rebuildInteractiveModels()

      // 挂到渲染循环：每帧推进 Mixer（无此步则 play 了也不转）
      removeAnimationTick?.()
      removeAnimationTick = null
      if (onAfterRender && animationMixers.length > 0) {
        animationTimer.reset()
        removeAnimationTick = onAfterRender(() => {
          animationTimer.update()
          // getDelta：相对上一帧的秒数，不是累计时间、也不是转角
          const delta = Math.min(animationTimer.getDelta(), 0.05)
          for (let i = 0; i < animationMixers.length; i++) {
            // 按 delta 推进关键帧，写入 fengshan-* 等节点变换
            animationMixers[i].update(delta)
          }
        })
      }

      if (camera.value) {
        fitCameraToObject(group, camera.value, controls.value, new THREE.Vector3(70, 50, 70))
      }
    } catch (error) {
      console.error('[useStationModels] failed to load models', error)
      removeAnimationTick?.()
      removeAnimationTick = null
      animationMixers.forEach((mixer) => mixer.stopAllAction())
      animationMixers.length = 0
      // 失败时 group 可能还没 add 进 scene；直接 dispose 掉半成品，避免泄漏
      disposeObject3D(group)
      interactiveModels.length = 0
      clearEquipmentMaps()
    } finally {
      loading.value = false
    }
  }

  const disposeModels = (): void => {
    removeAnimationTick?.()
    removeAnimationTick = null
    animationMixers.forEach((mixer) => mixer.stopAllAction())
    animationMixers.length = 0

    // 一次摘掉并释放整站根（及其下所有已提交的 GLB）
    const group = modelsGroup.value
    interactiveModels.length = 0
    clearEquipmentMaps()
    if (!group) return

    group.removeFromParent()
    disposeObject3D(group)
    modelsGroup.value = null
    loadedCount.value = 0
  }

  onUnmounted(() => {
    disposeModels()
    animationTimer.dispose()
    dracoLoader?.dispose()
    dracoLoader = null
    disposeSharedWaterNormal()
  })

  /** 表格「详情」/ 定位：相机飞到指定设备 */
  const flyToByName = (name: string, source: EquipmentSource): void => {
    const object = getObjectByName(name, source)
    if (!object || !camera.value) return
    fitCameraToObject(object, camera.value, controls.value)
  }

  return {
    modelsGroup,
    interactiveModels,
    reservoirMap,
    coolingTowerMap,
    coolingTubeMap,
    streetlightMap,
    pressureRegulatingTowerMap,
    mixingTankMap,
    factoryBuildingMap,
    pressurizedTankMap,
    loading,
    loadedCount,
    totalCount,
    loadModels,
    disposeModels,
    applyStatusFromPayload,
    getObjectByName,
    flyToByName,
  }
}
