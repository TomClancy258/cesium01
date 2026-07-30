import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { onUnmounted, ref, shallowRef } from 'vue'

export function useThreeScene() {
  const containerRef = ref<HTMLElement | null>(null)
  const scene = shallowRef<THREE.Scene | null>(null)
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null)
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null)
  const controls = shallowRef<OrbitControls | null>(null)

  let animationFrameId = 0
  let resizeObserver: ResizeObserver | null = null

  const renderLoop = (): void => {
    if (!scene.value || !camera.value || !renderer.value) return
    animationFrameId = requestAnimationFrame(renderLoop)
    controls.value?.update()
    renderer.value.render(scene.value, camera.value)
  }

  const handleResize = (): void => {
    const container = containerRef.value
    if (!container || !camera.value || !renderer.value) return

    const { clientWidth, clientHeight } = container
    if (clientWidth === 0 || clientHeight === 0) return

    camera.value.aspect = clientWidth / clientHeight
    camera.value.updateProjectionMatrix()
    renderer.value.setSize(clientWidth, clientHeight)
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

    scene.value = threeScene
    camera.value = threeCamera
    renderer.value = threeRenderer
    controls.value = orbitControls

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
    initScene,
    destroyScene,
  }
}
