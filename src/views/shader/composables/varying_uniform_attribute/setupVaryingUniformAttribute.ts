import * as THREE from 'three'
import type { ShallowRef } from 'vue'
import vertexShader from './shaders/vertex-shader.glsl?raw'
import fragmentShader from './shaders/fragment-shader.glsl?raw'

/**
 * 对应教程里的 setupProject_：
 * 用自定义 ShaderMaterial 铺一块 Plane，演示 UV → 颜色。
 * 接收 ShallowRef，与 useStationModels 等 composable 一致；调用方在 initScene 之后传入 scene。
 */
export function setupVaryingUniformAttribute(
  scene: ShallowRef<THREE.Scene | null>,
): THREE.Mesh | null {
  if (!scene.value) {
    console.error('[setupVaryingUniformAttribute] scene is not ready')
    return null
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      color1:{value:new THREE.Vector4(1,1,0,1)},
      color2:{value:new THREE.Vector4(0,1,1,1)},
    },
    vertexShader,
    fragmentShader,
  })


  const colours = [
    new THREE.Color(0xFF0000),
    new THREE.Color(0x00FF00),
    new THREE.Color(0x0000FF),
    new THREE.Color(0x00FFFF),
  ];

  //toArray()：把 THREE.Color 变成 [r, g, b]（每个分量 0~1）
  // 例如 0xFF0000 → [1, 0, 0]
  // map 之后 先是二维：[[1,0,0], [0,1,0], [0,0,1], [0,1,1]]
  // flat()：压成一维：[1,0,0, 0,1,0, 0,0,1, 0,1,1]
  const colourFloats = colours.map(c => c.toArray()).flat();

  // PlaneGeometry(1, 1) 默认 4 个顶点，每个顶点对应colourFloats的3个数据
  const geometry = new THREE.PlaneGeometry(1, 1)
  geometry.setAttribute(
    'simondevColours',
    new THREE.Float32BufferAttribute(colourFloats, 3)
  )

  const plane = new THREE.Mesh(geometry, material)
  // 教程 OrthographicCamera(0,1,1,0) 时用 (0.5,0.5,0) 铺满；
  // 当前是透视相机，放在原点即可，用 OrbitControls 观察。
  plane.position.set(0, 0, 0)
  scene.value.add(plane)

  return plane
}
