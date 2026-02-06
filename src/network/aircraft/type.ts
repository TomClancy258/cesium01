// 元组类型：严格对应 OpenSky 的 states 数组顺序
export type AircraftTuple = [
  icao24: string,
  callsign: string,
  origin_country: string,
  time_position: number,
  last_contact: number,
  longitude: number | null,
  latitude: number | null,
  geo_altitude: number | null,
  on_ground: boolean,
  velocity: number | null,
  heading: number | null,
  vertical_rate: number | null, // 注意：示例中是 0（number），不是 null
  sensors: number[] | null,     // OpenSky 文档说这是 number[] | null
  baro_altitude: number | null,
  squawk: string | null,
  spi: boolean,
  position_source: number
];

// 对象类型：转换后的结构
export interface Aircraft {
  icao24: string;
  callsign: string; // 已 trim()
  origin_country: string;
  time_position: number;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  geo_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  heading: number | null;
  vertical_rate: number | null;
  sensors: number[] | null;
  baro_altitude: number | null;
  squawk: string | null;
  spi: boolean;
  position_source: number;
}

export interface AircraftStatesResponse {
  time: number;          // OpenSky 返回的时间戳（可选）
  states: (AircraftTuple | null)[]; // ⚠️ 注意：OpenSky 的 states 中可能包含 null！
}

export function tupleToAircraft(tuple: AircraftTuple): Aircraft {
  return {
    icao24: tuple[0],
    callsign: tuple[1]?.trim(), // 去除尾部空格，如 "SWR494B "
    origin_country: tuple[2],
    time_position: tuple[3],
    last_contact: tuple[4],
    longitude: tuple[5],
    latitude: tuple[6],
    geo_altitude: tuple[7],
    on_ground: tuple[8],
    velocity: tuple[9],
    heading: tuple[10],
    vertical_rate: tuple[11],
    sensors: Array.isArray(tuple[12]) ? tuple[12] : null,
    baro_altitude: tuple[13],
    squawk: tuple[14],
    spi: tuple[15],
    position_source: tuple[16]
  };
}

// 主转换函数：从 API 响应到 Aircraft[]
export function parseAircraftStates(response: AircraftStatesResponse): Aircraft[] {
  return (response.states || [])
    .filter((item): item is AircraftTuple => item !== null) // 过滤 null，并让 TS 知道类型
    .map(tupleToAircraft);
}
