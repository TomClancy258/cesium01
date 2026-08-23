import * as THREE from 'three'
import type { ShallowRef } from 'vue'
import vertexShader from './shaders/vertex-shader.glsl?raw'
import fragmentShader from './shaders/fragment-shader.glsl?raw'
import airplane01Jpg from '@/assets/img/airplane/jpg/airplane01.jpg'
import { useThrottleFn } from '@vueuse/core'

type BeforeRenderHandle = (fn: () => void) => () => void
type ResizeHandle = (fn: (width: number, height: number) => void) => () => void

/** offset 节流间隔（秒）；过小≈每帧更新 */
const OFFSET_INTERVAL_SEC = 0.1
/** colorVal：0→1 用 1s，1→0 用 1s，周期 2s */
const COLOR_PERIOD_SEC = 2
/** zero2One：每 3s 线性 0→1，然后归零再 0→1（锯齿波，不回落） */
const ZERO2ONE_PERIOD_SEC = 3

export function setupSimpleTransformations(
  scene: ShallowRef<THREE.Scene | null>,
  onBeforeRender: BeforeRenderHandle,
  onResize: ResizeHandle,
): THREE.Mesh | null {
  if (!scene.value) {
    console.error('[setupSinCos] scene is not ready')
    return null
  }

  let offset = 0

  const timer = new THREE.Timer()
  timer.connect(document)

  const texture = new THREE.TextureLoader().load(airplane01Jpg)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace

  const resolution = new THREE.Vector2()

  const material = new THREE.ShaderMaterial({
    uniforms: {
      diffuse: { value: texture },
      offset: { value: offset },
      colorVal: { value: 0 },
      zero2One:{value: 0},
      resolution: { value: resolution },
    },
    vertexShader,
    fragmentShader,
  })

  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(0, 0, 0)
  scene.value.add(mesh)

  const setOffset = useThrottleFn((): void => {
    offset = (offset + 0.1) % 200
    material.uniforms.offset.value = offset
  },OFFSET_INTERVAL_SEC)

  /**
   * colorVal 三角波：周期 2s
   * [0,1)s → 0 线性增到 1；[1,2)s → 1 线性减到 0
   * 等价：1 - abs((t % 2) - 1)
   */
  const setColorVal = (elapsedSec: number): void => {
    const t = elapsedSec % COLOR_PERIOD_SEC //模2=[0,2)不断循环
    const colorVal = t <= 1 ? t : COLOR_PERIOD_SEC - t

    // 两端慢、中间快（缓入缓出）
    // 不是线性
    // 更适合呼吸灯、柔和闪烁
    // 周期 2s：角频率 ω = 2π / T = π
    // const colorVal = 0.5 + 0.5 * Math.sin(elapsedSec * Math.PI)
    // 或 shader 里：0.5 + 0.5 * sin(time * PI)

    material.uniforms.colorVal.value = colorVal
  }

  const setResolution = (width: number, height: number): void => {
    // 原地改同一个 Vector2，不要 new：ShaderMaterial 拿的是这份引用
    resolution.set(width, height)
  }

  /**
   * zero2One 锯齿波：每 3s 线性 0→1，到 1 后从 0 再开始（不 1→0）
   */
  const setZero2One = (elapsedSec: number): void => {
    const zero2One = (elapsedSec % ZERO2ONE_PERIOD_SEC) / ZERO2ONE_PERIOD_SEC
    material.uniforms.zero2One.value = zero2One
  }

  onBeforeRender(() => {
    timer.update()

    setOffset()

    // colorVal：每帧按墙钟更新，保证任意 Hz 下都是 2s 一个周期
    //timer.getElapsed() 从计时开始到现在一共过了多少秒
    const elapsed = timer.getElapsed()
    setColorVal(elapsed)
    setZero2One(elapsed)
  })

  onResize(setResolution)

  return mesh
}
