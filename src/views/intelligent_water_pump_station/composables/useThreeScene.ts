import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { onUnmounted, ref, shallowRef } from 'vue'

/** hover / select 描边色（与原先 emissive 高亮区分） */
const OUTLINE = {
  hover: 0x3b82f6,
  select: 0xf59e0b,
} as const

export function useThreeScene() {
  const containerRef = ref<HTMLElement | null>(null)
  const scene = shallowRef<THREE.Scene | null>(null)
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null)
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null)
  const controls = shallowRef<OrbitControls | null>(null)
  const composer = shallowRef<EffectComposer | null>(null)
  const outlineHoverPass = shallowRef<OutlinePass | null>(null)
  const outlineSelectPass = shallowRef<OutlinePass | null>(null)

  let animationFrameId = 0
  let resizeObserver: ResizeObserver | null = null

  const renderLoop = (): void => {
    if (!composer.value) return
    animationFrameId = requestAnimationFrame(renderLoop)
    controls.value?.update()
    composer.value.render()
  }

  const handleResize = (): void => {
    const container = containerRef.value
    if (!container || !camera.value || !renderer.value || !composer.value) return

    const { clientWidth, clientHeight } = container
    if (clientWidth === 0 || clientHeight === 0) return

    camera.value.aspect = clientWidth / clientHeight
    camera.value.updateProjectionMatrix()
    renderer.value.setSize(clientWidth, clientHeight)
    composer.value.setSize(clientWidth, clientHeight)

    const resolution = new THREE.Vector2(clientWidth, clientHeight)
    outlineHoverPass.value?.resolution.copy(resolution)
    outlineSelectPass.value?.resolution.copy(resolution)
  }

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

  const initScene = (): void => {
    const container = containerRef.value
    if (!container) {
      console.error('[useThreeScene] containerRef is not bound')
      return
    }

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    const threeScene = new THREE.Scene()
    threeScene.background = new THREE.Color(0x0b1220)

    const threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
    threeCamera.position.set(0, 8, 16)
    threeCamera.lookAt(0, 0, 0)

    const threeRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    threeRenderer.setSize(width, height)
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

    const hoverPass = createOutlinePass(threeScene, threeCamera, width, height, OUTLINE.hover)
    const selectPass = createOutlinePass(threeScene, threeCamera, width, height, OUTLINE.select)
    threeComposer.addPass(hoverPass)
    threeComposer.addPass(selectPass)
    threeComposer.addPass(new OutputPass())

    scene.value = threeScene
    camera.value = threeCamera
    renderer.value = threeRenderer
    controls.value = orbitControls
    composer.value = threeComposer
    outlineHoverPass.value = hoverPass
    outlineSelectPass.value = selectPass

    //盯局部 container → 用 ResizeObserver 是推荐做法；不是 Three 官方 API，但是前端里监听容器大小的标准方式。
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    renderLoop()
  }

  const destroyScene = (): void => {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = 0

    resizeObserver?.disconnect()
    resizeObserver = null

    controls.value?.dispose()
    controls.value = null

    composer.value?.dispose()
    composer.value = null
    outlineHoverPass.value = null
    outlineSelectPass.value = null

    if (renderer.value) {
      const canvas = renderer.value.domElement
      canvas.parentElement?.removeChild(canvas)
      renderer.value.dispose()
      renderer.value = null
    }

    scene.value?.clear()
    scene.value = null
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
    composer,
    outlineHoverPass,
    outlineSelectPass,
    initScene,
    destroyScene,
  }
}
