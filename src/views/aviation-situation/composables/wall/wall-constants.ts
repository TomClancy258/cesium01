import * as Cesium from 'cesium'
import type { WallLevel } from '@/network/wall/type'
import { CONTROL_ZONE_INTERACTION_OUTLINE } from '@/views/aviation-situation/composables/control-zone/control-zone-constants'
import multipleArrowNormalUrl from '@/assets/img/arrow/png/multiple-arrow-normal.png'
// import multipleArrowNormalUrl from '@/assets/img/airplane/jpg/airplane01.jpg'
import multipleArrowWarningUrl from '@/assets/img/arrow/png/multiple-arrow-warning.png'
import multipleArrowDangerUrl from '@/assets/img/arrow/png/multiple-arrow-danger.png'
import multipleArrowHoverUrl from '@/assets/img/arrow/png/multiple-arrow-hover.png'
import multipleArrowSelectUrl from '@/assets/img/arrow/png/multiple-arrow-select.png'

/** 分层环 / 箭头墙等级色（与管控区 outline 一致） */
export const WALL_LEVEL_COLORS: Record<WallLevel, Cesium.Color> = {
  danger: Cesium.Color.RED.withAlpha(0.9),
  warning: Cesium.Color.ORANGE.withAlpha(0.9),
  normal: Cesium.Color.LIME.withAlpha(0.9),
}

export const WALL_ARROW_IMAGES: Record<WallLevel, string> = {
  danger: multipleArrowDangerUrl,
  warning: multipleArrowWarningUrl,
  normal: multipleArrowNormalUrl,
}

export const WALL_ARROW_INTERACTION_IMAGES = {
  hover: multipleArrowHoverUrl,
  select: multipleArrowSelectUrl,
} as const

/** layeredRing：亮线从底到顶一圈的时间（ms） */
export const WALL_LAYERED_RING_DEFAULTS = {
  durationMs: 4_000,
  bandCount: 3,
  bandWidth: 0.7,
  glowStrength: 0.35,
} as const

/** arrowWall：纹理沿墙横向滚一圈的时间（ms） */
export const WALL_ARROW_WALL_DEFAULTS = {
  scrollDurationMs: 60_000,
} as const

export const WALL_INTERACTION_STYLE = {
  layeredRing: {
    hover: {
      kind: 'layeredRing' as const,
      color: CONTROL_ZONE_INTERACTION_OUTLINE.hover.withAlpha(0.95),
    },
    select: {
      kind: 'layeredRing' as const,
      color: CONTROL_ZONE_INTERACTION_OUTLINE.select.withAlpha(1),
    },
  },
  arrowWall: {
    hover: {
      kind: 'arrowWall' as const,
      image: WALL_ARROW_INTERACTION_IMAGES.hover,
    },
    select: {
      kind: 'arrowWall' as const,
      image: WALL_ARROW_INTERACTION_IMAGES.select,
    },
  },
} as const
