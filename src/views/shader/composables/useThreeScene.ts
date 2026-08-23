import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { useThrottleFn } from '@vueuse/core'
import { onUnmounted, ref, shallowRef } from 'vue'

/** 与 scene 初始底色一致，天空盒加载前 / resize 清屏时不透出页面白底 */
const SCENE_CLEAR_COLOR = 0x0b1220

/** public/textures/cloud_sunset：CubeTexture 顺序 px, nx, py, ny, pz, nz */
const CLOUD_SUNSET_CUBE_URLS = [
  '/textures/cloud_sunset/Cold_Sunset__Cam_2_Left+X.png',
  '/textures/cloud_sunset/Cold_Sunset__Cam_3_Right-X.png',
  '/textures/cloud_sunset/Cold_Sunset__Cam_4_Up+Y.png',
  '/textures/cloud_sunset/Cold_Sunset__Cam_5_Down-Y.png',
  '/textures/cloud_sunset/Cold_Sunset__Cam_0_Front+Z.png',
  '/textures/cloud_sunset/Cold_Sunset__Cam_1_Back-Z.png',
] as const

/** 窗口拖拽中合并 setSize，减轻重建导致的闪白 */
const RESIZE_THROTTLE_MS = 100

export function useThreeScene() {
  const containerRef = ref<HTMLElement | null>(null)
  const scene = shallowRef<THREE.Scene | null>(null)
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null)
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null)
  const controls = shallowRef<OrbitControls | null>(null)

  let animationFrameId = 0
  let resizeObserver: ResizeObserver | null = null
  let skyCubeTexture: THREE.CubeTexture | null = null
  /** 每帧渲染前回调（如更新 shader uniform）；存的是回调，不是取消函数 */
  const beforeRenderFns: Array<() => void> = []
  /** 容器尺寸变化后回调；参数是 canvas CSS 像素，不是 window */
  const resizeFns: Array<(width: number, height: number) => void> = []

  /**
   * 登记每帧渲染前要跑的回调（subscribe → 返回 unsubscribe）。
   * 用于 setupSinCos 的 setOffset 等，不必 mitt / 构造函数。
   */
  //形参fn，形参fn后面的()=>void是形参的ts类型，
    // (() => void) 是onBeforeRender 返回值的类型是个函数即()=>void，但返回值类型必须用()包起来，所以是(() => void)
    //因为 : 后面若直接写 () => void =>，解析会乱。
  const onBeforeRender = (fn: () => void): (() => void) => {
    beforeRenderFns.push(fn)
    return () => {
      const index = beforeRenderFns.indexOf(fn)
      if (index >= 0) beforeRenderFns.splice(index, 1)
    }
  }

  /**
   * 登记 resize 回调，签名与 onBeforeRender 相同：subscribe → unsubscribe。
   * 订阅时立刻用当前容器尺寸调一次（setup 在 initScene 之后，首帧 ResizeObserver 可能已经错过）。
   */
  const onResize = (
    fn: (width: number, height: number) => void,
  ): (() => void) => {
    resizeFns.push(fn)
    const container = containerRef.value
    if (container && container.clientWidth > 0 && container.clientHeight > 0) {
      fn(container.clientWidth, container.clientHeight)
    }
    return () => {
      const index = resizeFns.indexOf(fn)
      if (index >= 0) resizeFns.splice(index, 1)
    }
  }

  //type Unsubscribe = () => void
  // 别名，同理
  // const onBeforeRender = (fn: () => void): Unsubscribe => {
  //   beforeRenderFns.push(fn)
  //   return () => { /* 从数组里删掉 fn */ }
  // }

  const renderLoop = (): void => {
    if (!renderer.value || !scene.value || !camera.value) return
    animationFrameId = requestAnimationFrame(renderLoop)
    if (controls.value?.enabled) {
      controls.value.update()
    }
    for (let i = 0; i < beforeRenderFns.length; i++) {
      beforeRenderFns[i]()
    }
    renderer.value.render(scene.value, camera.value)
  }

  const handleResize = (): void => {
    const container = containerRef.value
    if (!container || !camera.value || !renderer.value) return

    const { clientWidth, clientHeight } = container
    if (clientWidth === 0 || clientHeight === 0) return

    camera.value.aspect = clientWidth / clientHeight
    camera.value.updateProjectionMatrix()
    // false：不写 canvas inline 宽高，避免和 CSS 100% 打架触发 ResizeObserver 抖动
    renderer.value.setSize(clientWidth, clientHeight, false)
    for (let i = 0; i < resizeFns.length; i++) {
      resizeFns[i](clientWidth, clientHeight)
    }
  }

  const throttledHandleResize = useThrottleFn(handleResize, RESIZE_THROTTLE_MS, true, true)

  const initScene = (): void => {
    const container = containerRef.value
    if (!container) {
      console.error('[useThreeScene] containerRef is not bound')
      return
    }

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    const threeScene = new THREE.Scene()
    // 加载前先用深色底，避免白闪
    threeScene.background = new THREE.Color(SCENE_CLEAR_COLOR)
    scene.value = threeScene

    new THREE.CubeTextureLoader().load(
      [...CLOUD_SUNSET_CUBE_URLS],
      (cubeTexture) => {
        if (scene.value !== threeScene) {
          cubeTexture.dispose()
          return
        }
        cubeTexture.colorSpace = THREE.SRGBColorSpace
        skyCubeTexture?.dispose()
        skyCubeTexture = cubeTexture
        threeScene.background = cubeTexture
      },
      undefined,
      (error) => {
        console.error('[useThreeScene] failed to load skybox', CLOUD_SUNSET_CUBE_URLS, error)
      },
    )

    const threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
    threeCamera.position.set(1, 1, 2)
    threeCamera.lookAt(0, 0, 0)

    const threeRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    })
    threeRenderer.setClearColor(SCENE_CLEAR_COLOR, 1)
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    threeRenderer.setSize(width, height, false)
    threeRenderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(threeRenderer.domElement)

    const orbitControls = new OrbitControls(threeCamera, threeRenderer.domElement)
    orbitControls.enableDamping = true
    orbitControls.dampingFactor = 0.05
    orbitControls.target.set(0, 0, 0)
    orbitControls.update()

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(50, 80, 50)
    threeScene.add(ambientLight, directionalLight)

    // 红 X / 绿 Y / 蓝 Z
    const axesHelper = new THREE.AxesHelper(5)
    threeScene.add(axesHelper)

    camera.value = threeCamera
    renderer.value = threeRenderer
    controls.value = orbitControls

    resizeObserver = new ResizeObserver(() => {
      throttledHandleResize()
    })
    resizeObserver.observe(container)

    renderLoop()
  }

  const destroyScene = (): void => {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = 0

    resizeObserver?.disconnect()
    resizeObserver = null
    beforeRenderFns.length = 0
    resizeFns.length = 0

    controls.value?.dispose()
    controls.value = null

    if (renderer.value) {
      const canvas = renderer.value.domElement
      canvas.parentElement?.removeChild(canvas)
      renderer.value.dispose()
      renderer.value = null
    }

    if (scene.value) {
      scene.value.background = null
      scene.value.clear()
      scene.value = null
    }
    skyCubeTexture?.dispose()
    skyCubeTexture = null
    camera.value = null
  }

  onUnmounted(() => {
    destroyScene()
  })

  return {
    containerRef,
    scene,
    camera,
    renderer,
    controls,
    onBeforeRender,
    onResize,
    initScene,
    destroyScene,
  }
}
