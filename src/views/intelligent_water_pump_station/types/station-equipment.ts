/** 全站统一设备状态（不做 overload，少高亮、不花屏） */
export type EquipmentStatus = 'normal' | 'warning' | 'danger'

/** 与 store map / 报文 source 对齐的英文表名 */
export type EquipmentSource =
  | 'reservoir'
  | 'coolingTower'
  | 'coolingTube'
  | 'streetlight'
  | 'pressureRegulatingTower'
  | 'mixingTank'
  | 'house'
  | 'verticalPressurizedTankBody'

/** @deprecated 兼容旧名，等同 EquipmentSource */
export type EquipmentTableKey = EquipmentSource

/** hover / select 身份（对齐 aviation-selection.hovered） */
export interface EquipmentSelection {
  name: string
  source: EquipmentSource
}

/**
 * 行数据：name 与三维模型 name 一致；text 为展示名。
 */
export interface EquipmentBase {
  name: string
  text: string
  status: EquipmentStatus
  updatedAt: string
}

export interface ReservoirRow extends EquipmentBase {
  level: number
  maxLevel: number
  temperature: number
}

export interface CoolingTowerRow extends EquipmentBase {
  temperature: number
  power: number
  rpm: number
}

export interface CoolingTubeRow extends EquipmentBase {
  temperature: number
  pressure?: number
}

export interface StreetLightRow extends EquipmentBase {
  power: number
  on: boolean
}

export interface PressureRegulatingTowerRow extends EquipmentBase {
  pressure: number
  maxPressure: number
  level?: number
}

export interface MixingTankRow extends EquipmentBase {
  level: number
  maxLevel: number
  power: number
  temperature: number
}

export interface HouseRow extends EquipmentBase {
  remark?: string
}

export interface VerticalPressurizedTankBodyRow extends EquipmentBase {
  pressure: number
  maxPressure: number
  temperature?: number
}

/** 旧类型别名，避免大面积改引用失败 */
export type ShuichiRow = ReservoirRow
export type PaifengshanRow = CoolingTowerRow
export type GuanziRow = CoolingTubeRow
export type LudengRow = StreetLightRow
export type YancunRow = PressureRegulatingTowerRow
export type JiaobanRow = MixingTankRow
export type FangziRow = HouseRow
export type DaguanziRow = VerticalPressurizedTankBodyRow

export type StationRow =
  | ReservoirRow
  | CoolingTowerRow
  | CoolingTubeRow
  | StreetLightRow
  | PressureRegulatingTowerRow
  | MixingTankRow
  | HouseRow
  | VerticalPressurizedTankBodyRow

/** 后台 / mock 单表结构：用 source，避免和行内 name 混淆 */
export interface StationTablePacket {
  source: EquipmentSource
  data: StationRow[]
}

/** 一帧推送：8 张表 */
export type StationWsPayload = StationTablePacket[]

/** 状态自发光：固定色（不闪烁，避免多设备同时告警时花屏） */
export const STATUS_HIGHLIGHT_COLOR: Record<EquipmentStatus, number | null> = {
  normal: null,
  warning: 0xeab308, // 琥珀黄
  danger: 0xef4444, // 红
}

export const STATUS_HIGHLIGHT_INTENSITY: Record<Exclude<EquipmentStatus, 'normal'>, number> = {
  warning: 0.45,
  danger: 0.75,
}

export const TABLE_LABEL: Record<EquipmentSource, string> = {
  reservoir: '蓄水池',
  coolingTower: '冷却塔',
  coolingTube: '冷却管',
  streetlight: '路灯',
  pressureRegulatingTower: '调压塔',
  mixingTank: '搅拌池',
  house: '房子',
  verticalPressurizedTankBody: '立式承压罐',
}

export const STATUS_LABEL: Record<EquipmentStatus, string> = {
  normal: '正常',
  warning: '预警',
  danger: '危险',
}

export const STATUS_FILTER_OPTIONS: { label: string; value: EquipmentStatus }[] = [
  { label: '正常', value: 'normal' },
  { label: '预警', value: 'warning' },
  { label: '危险', value: 'danger' },
]

/** Element Plus el-tag type */
export const STATUS_TAG_TYPE: Record<EquipmentStatus, 'primary' | 'warning' | 'danger'> = {
  normal: 'primary',
  warning: 'warning',
  danger: 'danger',
}

export const EQUIPMENT_SOURCES: EquipmentSource[] = [
  'reservoir',
  'coolingTower',
  'coolingTube',
  'streetlight',
  'pressureRegulatingTower',
  'mixingTank',
  'house',
  'verticalPressurizedTankBody',
]

export interface TooltipPosition {
  left: number
  top: number
}

export function resolveTableKeyById(id: string): EquipmentSource | null {
  if (id.startsWith('shuichi-')) return 'reservoir'
  if (id.startsWith('paifengshan-')) return 'coolingTower'
  if (id.startsWith('guanzi-')) return 'coolingTube'
  if (id.startsWith('ld')) return 'streetlight'
  if (id.startsWith('yancun-')) return 'pressureRegulatingTower'
  if (id.startsWith('01-')) return 'mixingTank'
  if (id.startsWith('fangzi-')) return 'house'
  if (id.startsWith('daguanzi-')) return 'verticalPressurizedTankBody'
  return null
}

export function packetsToRecord(
  packets: StationWsPayload,
): Record<EquipmentSource, StationRow[]> {
  const record = {} as Record<EquipmentSource, StationRow[]>
  packets.forEach((packet) => {
    record[packet.source] = packet.data
  })
  return record
}
