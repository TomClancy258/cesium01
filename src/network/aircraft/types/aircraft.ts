// types/aircraft.ts

/**
 * OpenSky 飞机原始元组（根据 data.json）
 */
export type AircraftTuple = [
  icao24: string,          // [0]
  callsign: string | null, // [1]
  originCountry: string,   // [2]
  timePosition: number,    // [3]
  lastContact: number,     // [4]
  longitude: number | null,// [5]
  latitude: number | null, // [6]
  baroAltitude: number | null, // [7] (米)
  onGround: boolean,           // [8]
  velocity: number | null,     // [9] (m/s)
  heading: number | null,      // [10] (度)
  verticalRate: number | null,  // [11] (m/s)
  sensors: null,               // [12] (通常为null)
  geoAltitude: number | null,  // [13] (米)
  squawk: string | null,       // [14]
  spi: boolean,                // [15]
  positionSource: number       // [16]
]
/**
 * 结构化飞机对象
 */
export interface Aircraft {
  icao24: string
  originCountry: string
  latitude: number | null
  longitude: number | null
  baroAltitude: number | null
  groundSpeed: number | null
  heading: number | null
  verticalRate: number | null
  callsign: string | null
  onGround: boolean
  velocity: number | null
  geomAltitude: number | null
  category: number | null
  squawk: string | null
  spi: boolean
  alert: boolean
}

/**
 * 转换单个元组 → 对象
 */
export function tupleToAircraft(tuple: AircraftTuple): Aircraft {
  // 安全处理 callsign（去除尾部空格）
  const callsign = tuple[1]?.trim() || null

  return {
    icao24: tuple[0],
    originCountry: tuple[2],
    latitude: tuple[6],          // ✅ 正确索引
    longitude: tuple[5],         // ✅ 正确索引
    baroAltitude: tuple[7],      // ✅ 正确索引
    groundSpeed: tuple[9],       // ✅ velocity 就是地速
    heading: tuple[10],          // ✅ 正确索引
    verticalRate: tuple[11],     // ✅ 正确索引
    callsign,
    onGround: tuple[8],          // ✅ 正确索引
    velocity: tuple[9],          // 与 groundSpeed 相同
    geomAltitude: tuple[13],     // ✅ 正确索引
    category: null,              // OpenSky 不提供 category
    squawk: tuple[14],           // ✅ 正确索引
    spi: tuple[15],              // ✅ 正确索引
    alert: false,                // OpenSky 不直接提供 alert
  }
}
/**
 * 转换整个 states 数组
 */
export function parseAircraftStates(data: (AircraftTuple | null)[]): Aircraft[] {
  // 过滤 null 条目（OpenSky 可能返回 null）
  return data
    .filter((item): item is AircraftTuple => item !== null)
    .map(tupleToAircraft)
}

/**
 * OpenSky API 原始响应
 */
export interface AircraftStatesRawResponse {
  time: number
  states: (AircraftTuple | null)[] | null
}

/**
 * API 最终返回类型
 */
export type AircraftStatesResponse = Aircraft[]
