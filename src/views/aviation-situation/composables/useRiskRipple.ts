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
  /** 该实例响应的风险等级，默认 high */
  activeRiskLevel?: RiskLevel
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
  //若该useRiskRipple为useHighRiskRipple，则rippleMap存放的是high危险等级的飞机icao24及其信息
  //若该useRiskRipple为useMediumRiskRipple，则rippleMap存放的是medium危险等级的飞机icao24及其信息
  //详情见useAircraftRiskRipple.ts
  const rippleMap = new Map<string, RiskRippleState>()
  /** 外部图层注入的 Collection（如 aircraftGraphic.primitives.riskRippleBillboards） */
  //除了billboardCollection是外层传过来的，全部useRiskRipple共享的外，其余变量是该useHighRiskRipple或useMediumRiskRipple独享的
  let billboardCollection: Cesium.BillboardCollection | null = null
  let unbindPreRender: (() => void) | null = null
  const activeRiskLevel = options.activeRiskLevel ?? 'high'

  const style = {
    baseSizePx: options.style?.baseSizePx ?? DEFAULT_STYLE.baseSizePx,
    maxSizePx: options.style?.maxSizePx ?? DEFAULT_STYLE.maxSizePx,
    durationMs: options.style?.durationMs ?? DEFAULT_STYLE.durationMs,
    alpha: options.style?.alpha ?? DEFAULT_STYLE.alpha,
    timeOffsetsMs: options.style?.timeOffsetsMs ?? DEFAULT_STYLE.timeOffsetsMs,
  }
  // 贴图已带色；color 只用白×alpha 做呼吸淡出，避免二次染色

  const init = (collection: Cesium.BillboardCollection): void => {
    if (!viewer.value || viewer.value.isDestroyed()) return
    if (!billboardCollection) {
      billboardCollection = collection
    }
    registerPreRender()
  }

  const registerPreRender = (): void => {
    if (unbindPreRender) return

    const onPreRender = (): void => {
      const nowMs = Date.now()
      rippleMap.forEach((state) => {
        //一帧里的效果（3 个圈）:三圈叠加 = 连续呼吸涟漪。
        //圈0 (offset 0ms):   ●小亮 → ○大淡
        //圈1 (offset 450ms):       ●小亮 → ○大淡   （错半拍）
        //圈2 (offset 900ms):             ●小亮 → ○大淡
        state.billboards.forEach((ripple, index) => {
          //1.相位偏移：
          //  第 0/1/2 个圈：0 / 450 / 900ms
          const offsetMs = style.timeOffsetsMs[index] ?? 0

          //2.进度 progress（0 → 1 循环）：
          //  nowMs + offsetMs：给第 2、3 个圈「提前/滞后」相位
          //  % durationMs：每 1.4 秒循环一圈
          //  / durationMs：归一化到 0~1
          //progress=0 刚起，progress→1 即将结束并回到 0。
          const progress = ((nowMs + offsetMs) % style.durationMs) / style.durationMs

          //3. 尺寸：从小变大
          //30px → 84px 线性放大，像波纹向外扩散。
          const sizePx = style.baseSizePx + (style.maxSizePx - style.baseSizePx) * progress

          //4. 透明度：随扩散淡出
          //progress=0 最亮（0.5），progress=1 完全透明；圈变大同时变淡。
          const alpha = Math.max(0, style.alpha * (1 - progress))

          //5. 写回 Billboard
          //ConstantProperty → 只给 Entity
          ripple.show = state.visible
          ripple.position = state.position
          ripple.width = sizePx
          ripple.height = sizePx
          ripple.color = Cesium.Color.fromAlpha(Cesium.Color.WHITE, alpha, ripple.color)
        })
      })
    }

    if (!viewer.value || viewer.value.isDestroyed()) return

    viewer.value.scene.preRender.addEventListener(onPreRender)
    unbindPreRender = () => {
      if (viewer.value && !viewer.value.isDestroyed()) {
        viewer.value.scene.preRender.removeEventListener(onPreRender)
        //为什么涟漪适合 preRender 而不是onTick
        // 1. 纯 UI 装饰动画，不应绑仿真时间
        //
        // 高风险机场的波纹是「一直在呼吸的警示圈」，希望：
        //
        // 时钟暂停看态势 → 波纹仍动
        // 时间倍速看轨道 → 波纹速度不变（别跟着 100x 狂闪）

        //clock.onTick          ← ① 时钟先走一步
        //     ↓
        // scene.preUpdate       ← ② 场景「更新阶段」开始前
        //     ↓
        // （Cesium 内部 update：Entity/Primitive/DataSource、相机等）
        //     ↓
        // scene.postUpdate      ← ③ 场景更新完成
        //     ↓
        // scene.preRender       ← ④ 真正 GPU 绘制前
        //     ↓
        // （WebGL render：出图）
        //     ↓
        // scene.postRender      ← ⑤ 本帧绘制结束  //这一帧已经画完了，这里改 最早下一帧 才看见 → 白晚一帧，快速动画可能闪/抖
      }
      unbindPreRender = null
    }
  }

  const add = (id: string, position: Cesium.Cartesian3, visible: boolean): void => {
    if (!billboardCollection) return
    if (rippleMap.has(id)) return

    //一个高风险机场/目标
    //     └── 3 个 Billboard（同一圆环贴图，同一位置）
    //             ├── ripple[0]  相位 offset = 0ms
    //             ├── ripple[1]  相位 offset = 450ms
    //             └── ripple[2]  相位 offset = 900ms
    //创建时在 add() 里一次性加 3 个：
    const billboards: Cesium.Billboard[] = style.timeOffsetsMs.map((_, index) => {
      const billboard = billboardCollection!.add({
        id: `${options.idPrefix}_${id}_${index}`,
        show: visible,
        position,
        image: options.imageUrl,
        width: style.baseSizePx,
        height: style.baseSizePx,
        color: Cesium.Color.fromAlpha(Cesium.Color.WHITE, style.alpha),
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      })
      billboard.properties = {
        type: 'billboard',
        sourceType: options.sourceType,
      }
      return billboard
    })

    rippleMap.set(id, { billboards, position, visible })
  }

  const remove = (id: string): void => {
    if (!billboardCollection) return
    const state = rippleMap.get(id)
    if (!state) return

    state.billboards.forEach((ripple) => {
      billboardCollection?.remove(ripple)
    })
    rippleMap.delete(id)
  }

  const sync = (input: SyncRiskRippleInput): void => {
    const { id, position, riskLevel, visible } = input
    //当前飞机的危险等级不是high或者medium，就删除该飞机的危险等级光圈
    if (riskLevel !== activeRiskLevel) {
      remove(id)
      return
    }

    //是新的危险等级飞机则添加
    if (!rippleMap.has(id)) {
      add(id, position, visible)
      return
    }

    //已存在危险等级飞机则更新危险等级光圈的位置和显隐
    const state = rippleMap.get(id)
    if (!state) return
    state.position = position
    state.visible = visible
  }

  const clear = (): void => {
    // 共享 collection，只删本实例管理的圈，不能 removeAll
    for (const id of [...rippleMap.keys()]) {
      remove(id)
    }
    rippleMap.clear()
  }

  const destroy = (): void => {
    unbindPreRender?.()
    clear()
    //只清掉模块自己的引用，并没有billboardCollection.removeAll()
    billboardCollection = null
  }

  return {
    init,
    sync,
    remove,
    clear,
    destroy,
  }
}
