// types/aircraft.ts
export const FLIGHT_COUNTRY_ALIASES = {
  'Russian Federation': 'Russia',
  'Republic of Korea': 'South Korea',
  "Lao People's Democratic Republic": 'Laos',
  'Libyan Arab Jamahiriya': 'Libya',
  'Islamic Republic of Iran': 'Iran',
  'Kingdom of the Netherlands': 'Netherlands',
  'Republic of Moldova': 'Moldova',
  'Viet Nam': 'Vietnam',
  'Fiji': 'Fiji',           // Oceania
  'Haiti': 'Haiti',          // North America
  'Maldives': 'Maldives',    // Asia
  'Nepal': 'Nepal',          // Asia
  'Papua New Guinea': 'Papua New Guinea', // Oceania
  'Paraguay': 'Paraguay',    // South America
  'Rwanda': 'Rwanda',        // Africa
  'San Marino': 'San Marino', // Europe
  'Seychelles': 'Seychelles', // Africa
};

/**
 * OpenSky 飞机原始元组（根据 data.json）
 */
export type AircraftTuple = [
  icao24: string,          // [0] ICAO 24位地址 (飞机的唯一硬件ID，如 "aa9f5c")
  callsign: string | null, // [1] 航班呼号 (如 "CCA1501", "N78395")，通用航空可能为null
  originCountry: string,   // [2] 注册国家名称 (如 "United States", "China")
  timePosition: number,    // [3] 位置更新时间戳 (秒级 Unix 时间戳)
  lastContact: number,     // [4] 最后通信联系时间戳 (秒级 Unix 时间戳)
  longitude: number | null,// [5] 经度 (WGS84, 度)
  latitude: number | null, // [6] 纬度 (WGS84, 度)
  baroAltitude: number | null, // [7] 气压高度 (米，相对于标准海平面)
  onGround: boolean,           // [8] 是否在地面 (true=地面滑行/停靠，false=空中飞行)
  velocity: number | null,     // [9] 地速 (米/秒 m/s)
  heading: number | null,      // [10] 航向角 (度，0-360，正北为0)
  verticalRate: number | null, // [11] 垂直速率 (米/秒 m/s，正数表示爬升，负数表示下降)
  sensors: null,               // [12] 传感器ID列表 (通常为null，用于多接收站定位)
  geoAltitude: number | null,  // [13] 几何高度 (米，GPS测得的高度，通常比气压高度更准)
  squawk: string | null,       // [14] 应答机代码 (四位八进制码，如 "7700" 紧急，"7600" 失联)
  spi: boolean,                // [15] 特殊位置识别位 (SPI pulse)，通常用于雷达识别确认
  positionSource: number,       // [16] 位置源 (0=ADS-B, 1=AST, 2=MLAT等，指示定位技术来源)
  riskLevel: 'high'|'medium'|'normal'

  // ⚠️ 注意：此原生数据中【不包含】出发机场 (origin) 和 到达机场 (destination)
  // 如果你的系统能按机场筛选，说明后端已经通过 callsign 关联了航班计划数据。
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
  riskLevel: 'high'|'medium'|'normal'
}

/**
 * 转换单个元组 → 对象
 */
export function tupleToAircraft(tuple: AircraftTuple): Aircraft {
  // 安全处理 callsign（去除尾部空格）
  const callsign = tuple[1]?.trim() || null

  return {
    icao24: tuple[0],
    originCountry: FLIGHT_COUNTRY_ALIASES[tuple[2]] ?? tuple[2],
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
    riskLevel: tuple[17]??'normal'
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
