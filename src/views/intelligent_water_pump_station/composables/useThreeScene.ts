import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { useThrottleFn } from '@vueuse/core'
import { onUnmounted, ref, shallowRef } from 'vue'

/** hover / select 描边色（与原先 emissive 高亮区分） */
const OUTLINE = {
  hover: 0x3b82f6,
  select: 0xf59e0b,
} as const
//npm run build打包时：

//src/assets
// 只有被代码 import / 模板引用到的才会进产物
// 没引用的文件不会被打包进去
// 引用到的会经 Vite 处理（hash、可能压缩等）

// public
// 整个目录原样拷到产物根目录，不管有没有被用到
// 不走模块打包，也没有 tree-shaking
// 没用到的大图也会跟着部署体积走

/** 与 scene 初始底色一致，resize 清屏时不透出页面白底 */
const SCENE_CLEAR_COLOR = 0x0b1220

/** public/textures 下的等距柱状天空图 */
const DAY_SKY_URL = '/textures/daySky.jpg'

/** 窗口拖拽中合并 setSize，减轻 RT 重建导致的闪白 */
const RESIZE_THROTTLE_MS = 100

export type OutlineObjects = {
  hovered: THREE.Object3D | null
  selected: THREE.Object3D | null
}

export function useThreeScene() {
  const containerRef = ref<HTMLElement | null>(null)
  const scene = shallowRef<THREE.Scene | null>(null)
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null)
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null)
  const controls = shallowRef<OrbitControls | null>(null)

  /** 非响应式：后处理实例只给渲染/描边用 */
  let composer: EffectComposer | null = null
  let outlineHoverPass: OutlinePass | null = null
  let outlineSelectPass: OutlinePass | null = null
  let skyTexture: THREE.Texture | null = null

  let animationFrameId = 0
  let resizeObserver: ResizeObserver | null = null
  /** composer 之后追加（如 CSS2DRenderer.render）；存的是渲染回调，不是取消函数 */
  const afterRenderFns: Array<() => void> = []

  /**
   * 登记 composer 之后每帧要跑的回调（subscribe → 返回 unsubscribe）。
   * @returns 取消函数：从 afterRenderFns 移除本次登记的 fn
   */
  const onAfterRender = (fn: () => void): (() => void) => {
    afterRenderFns.push(fn)
    return () => {
      const index = afterRenderFns.indexOf(fn)
      if (index >= 0) afterRenderFns.splice(index, 1)
    }
  }

  /** 主循环：先 WebGL/后处理，再跑 afterRenderFns（标签等 DOM 叠加层） */
  const renderLoop = (): void => {
    if (!composer) return
    animationFrameId = requestAnimationFrame(renderLoop)
    controls.value?.update()
    composer.render()
    for (let i = 0; i < afterRenderFns.length; i++) {
      afterRenderFns[i]()
    }
  }

  /** 同步相机 / WebGL / composer / OutlinePass 分辨率到容器尺寸 */
  const handleResize = (): void => {
    const container = containerRef.value
    if (!container || !camera.value || !renderer.value || !composer) return

    const { clientWidth, clientHeight } = container
    if (clientWidth === 0 || clientHeight === 0) return

    camera.value.aspect = clientWidth / clientHeight
    camera.value.updateProjectionMatrix()
    // false：不写 canvas inline 宽高，避免和 CSS 100% 打架触发 ResizeObserver 抖动
    renderer.value.setSize(clientWidth, clientHeight, false)
    composer.setSize(clientWidth, clientHeight)

    const resolution = new THREE.Vector2(clientWidth, clientHeight)
    outlineHoverPass?.resolution.copy(resolution)
    outlineSelectPass?.resolution.copy(resolution)
  }

  /** 拖窗口时合并 setSize，减轻 RT 重建闪白 */
  const throttledHandleResize = useThrottleFn(handleResize, RESIZE_THROTTLE_MS, true, true)

  const createOutlinePass = (
    threeScene: THREE.Scene,
    threeCamera: THREE.PerspectiveCamera,
    width: number,
    height: number,
    edgeColor: number,
  ): OutlinePass => {
    const pass = new OutlinePass(
      new THREE.Vector2(width, height),
      threeScene,
      threeCamera,
    )
    pass.edgeStrength = 3
    pass.edgeGlow = 0.2
    pass.edgeThickness = 1.5
    pass.pulsePeriod = 0
    pass.visibleEdgeColor.setHex(edgeColor)
    pass.hiddenEdgeColor.setHex(edgeColor)
    return pass
  }

  /** picking 只传「描谁」；Pass 细节留在 scene 内 */
  const setOutlineObjects = ({ hovered, selected }: OutlineObjects): void => {
    if (outlineSelectPass) {
      outlineSelectPass.selectedObjects = selected ? [selected] : []
    }
    if (outlineHoverPass) {
      outlineHoverPass.selectedObjects =
        hovered && hovered !== selected ? [hovered] : []
    }
  }

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

    new THREE.TextureLoader().load(
      DAY_SKY_URL,
      (texture) => {
        // 已销毁或已换 scene 时丢弃晚到的贴图
        if (scene.value !== threeScene) {
          texture.dispose()
          return
        }
        texture.mapping = THREE.EquirectangularReflectionMapping
        texture.colorSpace = THREE.SRGBColorSpace
        skyTexture?.dispose()
        skyTexture = texture
        threeScene.background = texture
      },
      undefined,
      (error) => {
        console.error('[useThreeScene] failed to load skybox', DAY_SKY_URL, error)
      },
    )

    const threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
    threeCamera.position.set(0, 8, 16)
    threeCamera.lookAt(0, 0, 0)

    // 不透明：有 scene.background，alpha 只会在 composer 重建 RT 时透出页面白底
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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(10, 20, 10)
    threeScene.add(ambientLight, directionalLight)

    // 红 X / 绿 Y / 蓝 Z
    const axesHelper = new THREE.AxesHelper(5)
    threeScene.add(axesHelper)

    const threeComposer = new EffectComposer(threeRenderer)
    threeComposer.setSize(width, height)
    threeComposer.addPass(new RenderPass(threeScene, threeCamera))

    outlineHoverPass = createOutlinePass(
      threeScene,
      threeCamera,
      width,
      height,
      OUTLINE.hover,
    )
    outlineSelectPass = createOutlinePass(
      threeScene,
      threeCamera,
      width,
      height,
      OUTLINE.select,
    )
    threeComposer.addPass(outlineHoverPass)
    threeComposer.addPass(outlineSelectPass)
    threeComposer.addPass(new OutputPass())
    composer = threeComposer

    camera.value = threeCamera
    renderer.value = threeRenderer
    controls.value = orbitControls

    // 盯局部 container → ResizeObserver；throttle 减轻拖拽窗口时 RT 狂建
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
    afterRenderFns.length = 0

    controls.value?.dispose()
    controls.value = null

    setOutlineObjects({ hovered: null, selected: null })
    composer?.dispose()
    composer = null
    outlineHoverPass = null
    outlineSelectPass = null

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
    skyTexture?.dispose()
    skyTexture = null
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
    setOutlineObjects,
    onAfterRender,
    initScene,
    destroyScene,
  }
}
