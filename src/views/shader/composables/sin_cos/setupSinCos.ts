import * as THREE from 'three'
import type { ShallowRef } from 'vue'
import vertexShader from './shaders/vertex-shader.glsl?raw'
import fragmentShader from './shaders/fragment-shader.glsl?raw'
import airplane01Jpg from '@/assets/img/airplane/jpg/airplane01.jpg'
import { useThrottleFn } from '@vueuse/core'

type BeforeRenderHandle = (fn: () => void) => () => void

/** offset 节流间隔（秒）；过小≈每帧更新 */
const OFFSET_INTERVAL_SEC = 0.1
/** colorVal：0→1 用 1s，1→0 用 1s，周期 2s */
const COLOR_PERIOD_SEC = 2

export function setupSinCos(
  scene: ShallowRef<THREE.Scene | null>,
  onBeforeRender: BeforeRenderHandle,
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

  const material = new THREE.ShaderMaterial({
    uniforms: {
      diffuse: { value: texture },
      offset: { value: offset },
      colorVal: { value: 0 },
    },
    vertexShader,
    fragmentShader,
  })

  const geometry = new THREE.PlaneGeometry(1, 1)
  const plane = new THREE.Mesh(geometry, material)
  plane.position.set(0, 0, 0)
  scene.value.add(plane)

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

  onBeforeRender(() => {
    timer.update()

    setOffset()

    // colorVal：每帧按墙钟更新，保证任意 Hz 下都是 2s 一个周期
    //timer.getElapsed() 从计时开始到现在一共过了多少秒
    setColorVal(timer.getElapsed())
  })

  return plane
}
