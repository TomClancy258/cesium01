import * as THREE from 'three'

/** 单张法线做微荡；不用 Water_2 切换（切换会像两张图来回切） */
const WATER_NORMAL_URL = '/textures/water/Water_1_M_Normal.jpg'

/** 水色：偏青蓝（避免沿用原材质浅色导致乳白） */
const WATER_SURFACE_COLOR = 0x3aa8d8

/**
 * 水面材质名：shui / shuimian / shuimian-1 …
 * 蓄水池多为直系子 mesh；厂房 fangzi-07 水面在更深子节点，需 traverse。
 */
function isWaterMaterialName(name: string): boolean {
  return name === 'shui' || name.startsWith('shuimian')
}

let sharedWaterNormalSource: THREE.Texture | null = null
let waterNormalLoadPromise: Promise<THREE.Texture> | null = null

/**
 * 必须 loadAsync 等图片就绪再赋给材质。
 * 副本(2) 无报警但透明会透出丑底；当前文件用 load()+clone 未就绪纹理 → 报警。
 * 异步就绪后再赋法线，避免 no image data。
 */
export function ensureWaterNormalLoaded(): Promise<THREE.Texture> {
  if (sharedWaterNormalSource?.image) {
    return Promise.resolve(sharedWaterNormalSource)
  }
  if (!waterNormalLoadPromise) {
    waterNormalLoadPromise = new THREE.TextureLoader()
      .loadAsync(WATER_NORMAL_URL)
      .then((texture) => {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.colorSpace = THREE.NoColorSpace
        texture.repeat.set(1.5, 1.5)
        // 禁止 disposeObject3D 误销毁共享法线
        texture.userData.sharedWaterNormal = true
        sharedWaterNormalSource = texture
        return texture
      })
  }
  return waterNormalLoadPromise
}

function applyWaterMaterialToMesh(waterMesh: THREE.Mesh): void {
  if (!sharedWaterNormalSource?.image) return

  const material = Array.isArray(waterMesh.material)
    ? waterMesh.material[0]
    : waterMesh.material
  if (!(material instanceof THREE.MeshStandardMaterial)) return
  if (!isWaterMaterialName(material.name)) return

  // 丑图来自 AO；清掉即可（map 保留）
  material.aoMap = null
  material.color.setHex(WATER_SURFACE_COLOR)
  material.normalMap = sharedWaterNormalSource
  material.normalScale.set(0.32, 0.32)
  material.roughness = 0.45
  material.metalness = 0
  material.envMapIntensity = 0.35
  material.transparent = true
  material.opacity = 0.92
  material.needsUpdate = true

  waterMesh.onBeforeRender = () => {
    const mat = waterMesh.material
    if (!(mat instanceof THREE.MeshStandardMaterial) || !mat.normalMap) return
    const t = performance.now() * 0.001
    const scale = 0.26 + 0.1 * Math.sin(t * 2.4) + 0.04 * Math.sin(t * 4.1)
    mat.normalScale.set(scale, scale)
    mat.normalMap.offset.set(Math.sin(t * 1.3) * 0.04, Math.cos(t * 1.1) * 0.035)
  }
}

/**
 * 青蓝半透明水面 + 单张法线微荡（已清 aoMap；不改 emissive）。
 * 复用于蓄水池 / 厂房内水面；须先 ensureWaterNormalLoaded；建议在 markInteractive 之前调用。
 */
export function applyWaterSurfaceEffect(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return
    applyWaterMaterialToMesh(obj)
  })
}

/** 卸载场景时释放共享法线（勿在 disposeObject3D 里提前 dispose） */
export function disposeSharedWaterNormal(): void {
  sharedWaterNormalSource?.dispose()
  sharedWaterNormalSource = null
  waterNormalLoadPromise = null
}

/** dispose 材质纹理时跳过共享水面法线 */
export function isSharedWaterNormalTexture(texture: THREE.Texture): boolean {
  return (
    texture.userData?.sharedWaterNormal === true || texture === sharedWaterNormalSource
  )
}
