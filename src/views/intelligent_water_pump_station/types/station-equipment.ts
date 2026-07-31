/** 全站统一设备状态（不做 overload，少高亮、不花屏） */
export type EquipmentStatus = 'normal' | 'alarm' | 'fault'

/** 与 store map / 报文 source 对齐的英文表名 */
export type EquipmentSource =
  | 'reservoir'
  | 'coolingTower'
  | 'coolingTube'
  | 'streetLight'
  | 'pressureRegulatingTower'
  | 'mixingTank'
  | 'house'
  | 'verticalPressurizedTankBody'

/** @deprecated 兼容旧名，等同 EquipmentSource */
export type EquipmentTableKey = EquipmentSource

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

export const STATUS_HIGHLIGHT_COLOR: Record<EquipmentStatus, number | null> = {
  normal: null,
  alarm: 0xeab308,
  fault: 0xef4444,
}

export const TABLE_LABEL: Record<EquipmentSource, string> = {
  reservoir: '蓄水池',
  coolingTower: '冷却塔',
  coolingTube: '冷却管',
  streetLight: '路灯',
  pressureRegulatingTower: '调压塔',
  mixingTank: '搅拌池',
  house: '房子',
  verticalPressurizedTankBody: '立式承压罐',
}

export function resolveTableKeyById(id: string): EquipmentSource | null {
  if (id.startsWith('shuichi-')) return 'reservoir'
  if (id.startsWith('paifengshan-')) return 'coolingTower'
  if (id.startsWith('guanzi-')) return 'coolingTube'
  if (id.startsWith('ld')) return 'streetLight'
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
