import * as THREE from 'three'
import type { ShallowRef } from 'vue'
import { Pane } from 'tweakpane'
import { setupGround } from './ground/setupGround'
import { setupGrass } from './grass/setupGrass'
import { setupRole } from './role/setupRole'

type BeforeRenderHandle = (fn: () => void) => () => void

const FLAG_PERIOD_SEC = 5

export interface GrassSceneSetupResult {
  ground: THREE.Mesh
  dispose: () => void
}

export async function setupGrassScene(
  scene: ShallowRef<THREE.Scene | null>,
  onBeforeRender: BeforeRenderHandle,
): Promise<GrassSceneSetupResult | null> {
  if (!scene.value) {
    console.error('[setupGrassScene] scene is not ready')
    return null
  }

  const timer = new THREE.Timer()
  timer.connect(document)


  const pane = new Pane({ title: 'Grass' })

  const groundSetup = await setupGround(scene.value, pane)
  const { ground, material: groundMaterial } = groundSetup

  const grassSetup = await setupGrass(ground, pane)

  const roleSetup = await setupRole({
    parent: ground,
    pane,
    onRootPositionChange: grassSetup.setRoleRootPosition,
  })

  const unsubscribeBeforeRender = onBeforeRender(() => {
    timer.update()
    const elapsed = timer.getElapsed()
    groundMaterial.uniforms.u_time.value =
      (elapsed % FLAG_PERIOD_SEC) / FLAG_PERIOD_SEC
  })

  const dispose = (): void => {
    unsubscribeBeforeRender()
    pane.dispose()
    roleSetup.dispose()
    grassSetup.dispose()
    groundSetup.dispose()
  }

  return { ground, dispose }
}
