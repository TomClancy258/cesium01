import { LngLatAlt } from '@/views/aviation-situation/types/shared'

export interface Scan{
  target:'none'|'aircraft'|'airport'|'all'
}
/**
 * 卫星轨道 Entity（SampledPositionProperty + clock）所需的最小数据结构。
 * 对应从 CZML packet 抽出的字段；无需携带 billboard、path 里分段 lead/trail 等展示细节。
 *
 * 若后端将来下发「完整 CZML」或额外元数据，可在 network 层映射进本类型；原始大包另存类型即可。
 */
export interface Satellite {
  id: string
  name?: string
  country:string,
  lngLatAlt:LngLatAlt,
  scan:Scan,
  description?: string
  /** CZML availability，如 `2012-03-15T10:00:00Z/2012-03-16T10:00:00Z` */
  availability?: string
  position: {
    epoch: string
    referenceFrame?: 'INERTIAL' | 'FIXED'
    /** [t0,x0,y0,z0, t1,x1,y1,z1, ...]，t 为相对 epoch 的秒 */
    cartesian: number[]
    interpolationDegree?: number
    interpolationAlgorithm?: 'LAGRANGE'
  }
}

export interface RawSatellite {
  id: string
  name?: string
  country:string,
  lngLatAlt:LngLatAlt,
  description?: string
  scan:Scan,
  /** CZML availability，如 `2012-03-15T10:00:00Z/2012-03-16T10:00:00Z` */
  availability?: string
  position: {
    epoch: string
    referenceFrame?: 'INERTIAL' | 'FIXED'
    /** [t0,x0,y0,z0, t1,x1,y1,z1, ...]，t 为相对 epoch 的秒 */
    cartesian: number[]
    interpolationDegree?: number
    interpolationAlgorithm?: 'LAGRANGE'
  }
}
