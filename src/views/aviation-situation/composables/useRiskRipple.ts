import type { ShallowRef } from 'vue'
import * as Cesium from 'cesium'

export type RiskLevel = 'high' | 'medium' | 'normal'

interface RiskRippleState {
  billboards: Cesium.Billboard[]
  position: Cesium.Cartesian3
  visible: boolean
}

export interface UseRiskRippleOptions {
  idPrefix: string
  sourceType: string
  imageUrl: string
  color: string
  style?: {
    baseSizePx?: number
    maxSizePx?: number
    durationMs?: number
    alpha?: number
    timeOffsetsMs?: readonly number[]
  }
}

export interface SyncRiskRippleInput {
  id: string
  position: Cesium.Cartesian3
  riskLevel: RiskLevel
  visible: boolean
}

const DEFAULT_STYLE = {
  baseSizePx: 30,
  maxSizePx: 84,
  durationMs: 1400,
  alpha: 0.5,
  timeOffsetsMs: [0, 450, 900] as const,
}

export function useRiskRipple(viewer: ShallowRef<Cesium.Viewer>, options: UseRiskRippleOptions) {
  const rippleMap = new Map<string, RiskRippleState>()
  let rippleBillboards: Cesium.BillboardCollection | null = null
  let unbindPreRender: (() => void) | null = null

  const style = {
    baseSizePx: options.style?.baseSizePx ?? DEFAULT_STYLE.baseSizePx,
    maxSizePx: options.style?.maxSizePx ?? DEFAULT_STYLE.maxSizePx,
    durationMs: options.style?.durationMs ?? DEFAULT_STYLE.durationMs,
    alpha: options.style?.alpha ?? DEFAULT_STYLE.alpha,
    timeOffsetsMs: options.style?.timeOffsetsMs ?? DEFAULT_STYLE.timeOffsetsMs,
  }
  const rippleColor = Cesium.Color.fromCssColorString(options.color)

  const init = (): void => {
    if (rippleBillboards || !viewer.value || viewer.value.isDestroyed()) return
    rippleBillboards = viewer.value.scene.primitives.add(new Cesium.BillboardCollection())
    registerPreRender()
  }

  const registerPreRender = (): void => {
    if (unbindPreRender) return

    const onPreRender = (): void => {
      const nowMs = Date.now()
      rippleMap.forEach((state) => {
        state.billboards.forEach((ripple, index) => {
          const offsetMs = style.timeOffsetsMs[index] ?? 0
          const progress = ((nowMs + offsetMs) % style.durationMs) / style.durationMs
          const sizePx = style.baseSizePx + (style.maxSizePx - style.baseSizePx) * progress
          const alpha = Math.max(0, style.alpha * (1 - progress))

          ripple.show = state.visible
          ripple.position = state.position
          ripple.width = sizePx
          ripple.height = sizePx
          ripple.color = Cesium.Color.fromAlpha(rippleColor, alpha, ripple.color)
        })
      })
    }

    if (!viewer.value || viewer.value.isDestroyed()) return

    viewer.value.scene.preRender.addEventListener(onPreRender)
    unbindPreRender = () => {
      if (viewer.value && !viewer.value.isDestroyed()) {
        viewer.value.scene.preRender.removeEventListener(onPreRender)
      }
      unbindPreRender = null
    }
  }

  const add = (id: string, position: Cesium.Cartesian3, visible: boolean): void => {
    if (!rippleBillboards) return
    if (rippleMap.has(id)) return

    const billboards: Cesium.Billboard[] = style.timeOffsetsMs.map((_, index) => {
      const billboard = rippleBillboards!.add({
        id: `${options.idPrefix}_${id}_${index}`,
        show: visible,
        position,
        image: options.imageUrl,
        width: style.baseSizePx,
        height: style.baseSizePx,
        color: Cesium.Color.fromAlpha(rippleColor, style.alpha),
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      })
      ;(billboard as any).properties = {
        type: 'billboard',
        sourceType: options.sourceType,
      }
      return billboard
    })

    rippleMap.set(id, { billboards, position, visible })
  }

  const remove = (id: string): void => {
    if (!rippleBillboards) return
    const state = rippleMap.get(id)
    if (!state) return

    state.billboards.forEach((ripple) => {
      rippleBillboards?.remove(ripple)
    })
    rippleMap.delete(id)
  }

  const sync = (input: SyncRiskRippleInput): void => {
    const { id, position, riskLevel, visible } = input
    if (riskLevel !== 'high') {
      remove(id)
      return
    }

    if (!rippleMap.has(id)) {
      add(id, position, visible)
      return
    }

    const state = rippleMap.get(id)
    if (!state) return
    state.position = position
    state.visible = visible
  }

  const clear = (): void => {
    rippleBillboards?.removeAll()
    rippleMap.clear()
  }

  const destroy = (): void => {
    unbindPreRender?.()
    if (rippleBillboards && viewer.value && !viewer.value.isDestroyed()) {
      viewer.value.scene.primitives.remove(rippleBillboards)
    }
    rippleBillboards = null
    rippleMap.clear()
  }

  return {
    init,
    sync,
    remove,
    clear,
    destroy,
  }
}
