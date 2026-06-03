/**
 * 按 NA-01 模板（FIXED 帧、14400s 稀疏关键帧）生成 NA-03 / NA-04 / NA-05。
 * 用法: node scripts/generate-na-satellites.mjs
 */
import * as Cesium from 'cesium'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'satellite')

const AVAILABILITY = '2012-03-15T10:00:00Z/2012-03-16T10:00:00Z'
const EPOCH_ISO = '2012-03-15T10:00:00Z'
const SAMPLE_TIMES = [0, 14400, 28800, 43200, 57600, 72000, 86400]
const HEIGHT_M = 620_000

/** NA-01 参考轨迹（FIXED / ECEF，米） */
const NA01_CARTESIAN = [
  0, -2748800, -4264200, 4760300,
  14400, -4580000, -2300000, 4890000,
  28800, -5200000, 1060000, 4920000,
  43200, -4060000, 3720000, 4840000,
  57600, -1380000, 5360000, 4700000,
  72000, 1970000, 5070000, 4520000,
  86400, 4470000, 2940000, 4310000,
]

const SATELLITES = [
  {
    id: 'Satellite/NA-03',
    name: 'NA-03',
    lon: -105.5359,
    lat: 36.5425,
    labelText: 'NA-03',
  },
  {
    id: 'Satellite/NA-04',
    name: 'NA-04',
    lon: -78.2517,
    lat: 28.7931,
    labelText: 'NA-04',
  },
  {
    id: 'Satellite/NA-05',
    name: 'NA-05',
    lon: -98.341,
    lat: 41.0264,
    labelText: 'NA-05',
  },
]

const DESCRIPTION =
  '<!--HTML-->\r\n<p>United States earth observation satellite operating in low Earth orbit.</p>'

function parseSamples(cartesian) {
  const out = []
  for (let i = 0; i < cartesian.length; i += 4) {
    out.push({
      t: cartesian[i],
      pos: new Cesium.Cartesian3(cartesian[i + 1], cartesian[i + 2], cartesian[i + 3]),
    })
  }
  return out
}

function rotationMatrixFromUnitVectors(v1, v2) {
  const axis = Cesium.Cartesian3.cross(v1, v2, new Cesium.Cartesian3())
  const axisMag = Cesium.Cartesian3.magnitude(axis)
  if (axisMag < 1e-12) {
    const dot = Cesium.Cartesian3.dot(v1, v2)
    if (dot < 0) {
      const ortho = new Cesium.Cartesian3(0, 0, 1)
      if (Math.abs(Cesium.Cartesian3.dot(v1, ortho)) > 0.9) {
        Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_X, ortho)
      }
      Cesium.Cartesian3.cross(v1, ortho, axis)
      Cesium.Cartesian3.normalize(axis, axis)
      return Cesium.Matrix3.fromQuaternion(Cesium.Quaternion.fromAxisAngle(axis, Math.PI))
    }
    return Cesium.Matrix3.clone(Cesium.Matrix3.IDENTITY)
  }
  Cesium.Cartesian3.normalize(axis, axis)
  const dot = Cesium.Math.clamp(Cesium.Cartesian3.dot(v1, v2), -1, 1)
  return Cesium.Matrix3.fromQuaternion(
    Cesium.Quaternion.fromAxisAngle(axis, Math.acos(dot)),
  )
}

function buildCartesian(samples, lon, lat) {
  const origin = samples[0].pos
  const target = Cesium.Cartesian3.fromDegrees(lon, lat, HEIGHT_M)
  const v1 = Cesium.Cartesian3.normalize(origin, new Cesium.Cartesian3())
  const v2 = Cesium.Cartesian3.normalize(target, new Cesium.Cartesian3())
  const rot = rotationMatrixFromUnitVectors(v1, v2)

  const cartesian = []
  for (const { t, pos } of samples) {
    const rotated = Cesium.Matrix3.multiplyByVector(rot, pos, new Cesium.Cartesian3())
    cartesian.push(
      t,
      Math.round(rotated.x),
      Math.round(rotated.y),
      Math.round(rotated.z),
    )
  }
  return cartesian
}

function buildPacket(config, cartesian) {
  return {
    id: config.id,
    name: config.name,
    country: 'United States',
    lngLatAlt: {
      longitude: config.lon,
      latitude: config.lat,
      height: HEIGHT_M,
    },
    scan: { target: 'all' },
    availability: AVAILABILITY,
    description: DESCRIPTION,
    billboard: {
      eyeOffset: { cartesian: [0, 0, 0] },
      horizontalOrigin: 'CENTER',
      image: 'satellite.png',
      pixelOffset: { cartesian2: [0, 0] },
      scale: 1.5,
      show: true,
      verticalOrigin: 'CENTER',
    },
    label: {
      fillColor: { rgba: [0, 229, 255, 255] },
      font: '11pt Lucida Console',
      horizontalOrigin: 'LEFT',
      outlineColor: { rgba: [0, 0, 0, 255] },
      outlineWidth: 2,
      pixelOffset: { cartesian2: [12, 0] },
      show: true,
      style: 'FILL_AND_OUTLINE',
      text: config.labelText,
      verticalOrigin: 'CENTER',
    },
    path: {
      show: [{ interval: AVAILABILITY, boolean: true }],
      width: 1,
      material: { solidColor: { color: { rgba: [0, 229, 255, 255] } } },
      resolution: 120,
      leadTime: [
        {
          interval: AVAILABILITY,
          epoch: EPOCH_ISO,
          number: [0, 86400, 86400, 0],
        },
      ],
      trailTime: [
        {
          interval: AVAILABILITY,
          epoch: EPOCH_ISO,
          number: [0, 0, 86400, 86400],
        },
      ],
    },
    position: {
      interpolationAlgorithm: 'LAGRANGE',
      interpolationDegree: 5,
      referenceFrame: 'FIXED',
      epoch: EPOCH_ISO,
      cartesian,
    },
  }
}

function verifyStart(packet) {
  const { cartesian } = packet.position
  const pos = new Cesium.Cartesian3(cartesian[1], cartesian[2], cartesian[3])
  const c = Cesium.Cartographic.fromCartesian(pos)
  return {
    lon: Cesium.Math.toDegrees(c.longitude),
    lat: Cesium.Math.toDegrees(c.latitude),
    height: c.height,
  }
}

function main() {
  const refSamples = parseSamples(NA01_CARTESIAN)
  const packets = SATELLITES.map((cfg) => {
    const cartesian = buildCartesian(refSamples, cfg.lon, cfg.lat)
    return buildPacket(cfg, cartesian)
  })

  mkdirSync(OUT_DIR, { recursive: true })

  for (const packet of packets) {
    const geo = verifyStart(packet)
    writeFileSync(join(OUT_DIR, `${packet.name}.json`), JSON.stringify(packet, null, 2), 'utf8')
    console.log(
      `${packet.name}: t=0 ~ lon ${geo.lon.toFixed(4)}, lat ${geo.lat.toFixed(4)}, h ${Math.round(geo.height)} m`,
    )
  }

  writeFileSync(join(OUT_DIR, 'satellites.json'), JSON.stringify(packets, null, 2), 'utf8')
  console.log(`Wrote ${packets.length} satellites to ${OUT_DIR}`)
}

main()
