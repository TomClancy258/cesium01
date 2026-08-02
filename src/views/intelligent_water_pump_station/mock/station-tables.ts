import type { StationWsPayload } from '../types/station-equipment'

export const STATION_FRAME_COUNT = 10

/** 预写死的 10 帧推送数据（可直接改数值 / status） */
export const stationEquipments: StationWsPayload[] = [
  [
    {
      "source": "reservoir",
      "data": [
        {
          "name": "shuichi-01",
          "text": "蓄水池-01",
          "level": 1.8,
          "maxLevel": 4,
          "temperature": 18,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "shuichi-02",
          "text": "蓄水池-02",
          "level": 2.16,
          "maxLevel": 4,
          "temperature": 18.77,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "shuichi-03",
          "text": "蓄水池-03",
          "level": 2.45,
          "maxLevel": 4,
          "temperature": 19.18,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "shuichi-04",
          "text": "蓄水池-04",
          "level": 2.62,
          "maxLevel": 4,
          "temperature": 19.04,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "shuichi-05",
          "text": "蓄水池-05",
          "level": 2.68,
          "maxLevel": 4,
          "temperature": 18.4,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "shuichi-06",
          "text": "蓄水池-06",
          "level": 1.71,
          "maxLevel": 4,
          "temperature": 17.58,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "shuichi-07",
          "text": "蓄水池-07",
          "level": 1.78,
          "maxLevel": 4,
          "temperature": 16.95,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "shuichi-08",
          "text": "蓄水池-08",
          "level": 1.95,
          "maxLevel": 4,
          "temperature": 16.82,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "shuichi-09",
          "text": "蓄水池-09",
          "level": 2.24,
          "maxLevel": 4,
          "temperature": 17.24,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "shuichi-10",
          "text": "蓄水池-10",
          "level": 2.6,
          "maxLevel": 4,
          "temperature": 18.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "shuichi-11",
          "text": "蓄水池-11",
          "level": 1.96,
          "maxLevel": 4,
          "temperature": 18.79,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "shuichi-12",
          "text": "蓄水池-12",
          "level": 2.25,
          "maxLevel": 4,
          "temperature": 19.19,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "shuichi-13",
          "text": "蓄水池-13",
          "level": 2.41,
          "maxLevel": 4,
          "temperature": 19.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "shuichi-14",
          "text": "蓄水池-14",
          "level": 2.48,
          "maxLevel": 4,
          "temperature": 18.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        }
      ]
    },
    {
      "source": "coolingTower",
      "data": [
        {
          "name": "paifengshan-01",
          "text": "冷却塔-01",
          "temperature": 42,
          "power": 15,
          "rpm": 900,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "paifengshan-02",
          "text": "冷却塔-02",
          "temperature": 43.29,
          "power": 15.64,
          "rpm": 919,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "paifengshan-03",
          "text": "冷却塔-03",
          "temperature": 43.97,
          "power": 15.99,
          "rpm": 930,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "paifengshan-04",
          "text": "冷却塔-04",
          "temperature": 43.73,
          "power": 15.86,
          "rpm": 926,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "paifengshan-05",
          "text": "冷却塔-05",
          "temperature": 42.67,
          "power": 15.33,
          "rpm": 910,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "paifengshan-06",
          "text": "冷却塔-06",
          "temperature": 41.3,
          "power": 14.65,
          "rpm": 889,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "paifengshan-07",
          "text": "冷却塔-07",
          "temperature": 40.26,
          "power": 14.13,
          "rpm": 874,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "paifengshan-08",
          "text": "冷却塔-08",
          "temperature": 40.04,
          "power": 14.02,
          "rpm": 871,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        }
      ]
    },
    {
      "source": "coolingTube",
      "data": [
        {
          "name": "guanzi-1",
          "text": "冷却管-1",
          "temperature": 36,
          "pressure": 0.35,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "guanzi-2",
          "text": "冷却管-2",
          "temperature": 36.97,
          "pressure": 0.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "guanzi-3",
          "text": "冷却管-3",
          "temperature": 37.48,
          "pressure": 0.39,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "guanzi-4",
          "text": "冷却管-4",
          "temperature": 37.29,
          "pressure": 0.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        }
      ]
    },
    {
      "source": "streetlight",
      "data": [
        {
          "name": "ld18",
          "text": "路灯-18",
          "power": 0.08,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "ld062",
          "text": "路灯-062",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "ld063",
          "text": "路灯-063",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "ld064",
          "text": "路灯-064",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "ld065",
          "text": "路灯-065",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "ld066",
          "text": "路灯-066",
          "power": 0.08,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "ld067",
          "text": "路灯-067",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "ld068",
          "text": "路灯-068",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "ld069",
          "text": "路灯-069",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "ld070",
          "text": "路灯-070",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "ld071",
          "text": "路灯-071",
          "power": 0.09,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "ld072",
          "text": "路灯-072",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "ld073",
          "text": "路灯-073",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "ld074",
          "text": "路灯-074",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        }
      ]
    },
    {
      "source": "pressureRegulatingTower",
      "data": [
        {
          "name": "yancun-01",
          "text": "调压塔-01",
          "pressure": 0.55,
          "maxPressure": 1.2,
          "level": 3.2,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "yancun-02",
          "text": "调压塔-02",
          "pressure": 0.58,
          "maxPressure": 1.2,
          "level": 3.33,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        }
      ]
    },
    {
      "source": "mixingTank",
      "data": [
        {
          "name": "01-01",
          "text": "搅拌池-01",
          "level": 1.8,
          "maxLevel": 3.5,
          "power": 7.5,
          "temperature": 22,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "01-02",
          "text": "搅拌池-02",
          "level": 1.93,
          "maxLevel": 3.5,
          "power": 7.82,
          "temperature": 22.64,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "01-03",
          "text": "搅拌池-03",
          "level": 2,
          "maxLevel": 3.5,
          "power": 7.99,
          "temperature": 22.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "01-04",
          "text": "搅拌池-04",
          "level": 1.97,
          "maxLevel": 3.5,
          "power": 7.93,
          "temperature": 22.86,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        }
      ]
    },
    {
      "source": "house",
      "data": [
        {
          "name": "fangzi-01",
          "text": "厂房-01",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "fangzi-02",
          "text": "厂房-02",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "fangzi-03",
          "text": "厂房-03",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "fangzi-04",
          "text": "厂房-04",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "fangzi-05",
          "text": "厂房-05",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "fangzi-06",
          "text": "厂房-06",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "fangzi-07",
          "text": "厂房-07",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "fangzi-08",
          "text": "厂房-08",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "fangzi-09",
          "text": "厂房-09",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "fangzi-10",
          "text": "厂房-10",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        }
      ]
    },
    {
      "source": "verticalPressurizedTankBody",
      "data": [
        {
          "name": "daguanzi-01",
          "text": "承压罐-01",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-02",
          "text": "承压罐-02",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.64,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-03",
          "text": "承压罐-03",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-04",
          "text": "承压罐-04",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.86,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-05",
          "text": "承压罐-05",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.33,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-06",
          "text": "承压罐-06",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.65,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-07",
          "text": "承压罐-07",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.13,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-08",
          "text": "承压罐-08",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-09",
          "text": "承压罐-09",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.37,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-10",
          "text": "承压罐-10",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-11",
          "text": "承压罐-11",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.66,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-12",
          "text": "承压罐-12",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-13",
          "text": "承压罐-13",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-14",
          "text": "承压罐-14",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-15",
          "text": "承压罐-15",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.63,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-16",
          "text": "承压罐-16",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.12,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-17",
          "text": "承压罐-17",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-18",
          "text": "承压罐-18",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-19",
          "text": "承压罐-19",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-20",
          "text": "承压罐-20",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.67,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-21",
          "text": "承压罐-21",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        },
        {
          "name": "daguanzi-22",
          "text": "承压罐-22",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        }
      ]
    }
  ],
  [
    {
      "source": "reservoir",
      "data": [
        {
          "name": "shuichi-01",
          "text": "蓄水池-01",
          "level": 1.96,
          "maxLevel": 4,
          "temperature": 18.77,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "shuichi-02",
          "text": "蓄水池-02",
          "level": 2.25,
          "maxLevel": 4,
          "temperature": 19.18,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "shuichi-03",
          "text": "蓄水池-03",
          "level": 2.42,
          "maxLevel": 4,
          "temperature": 19.04,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "shuichi-04",
          "text": "蓄水池-04",
          "level": 2.48,
          "maxLevel": 4,
          "temperature": 18.4,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "shuichi-05",
          "text": "蓄水池-05",
          "level": 2.51,
          "maxLevel": 4,
          "temperature": 17.58,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "shuichi-06",
          "text": "蓄水池-06",
          "level": 1.58,
          "maxLevel": 4,
          "temperature": 16.95,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "shuichi-07",
          "text": "蓄水池-07",
          "level": 1.75,
          "maxLevel": 4,
          "temperature": 16.82,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "shuichi-08",
          "text": "蓄水池-08",
          "level": 2.04,
          "maxLevel": 4,
          "temperature": 17.24,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "shuichi-09",
          "text": "蓄水池-09",
          "level": 2.4,
          "maxLevel": 4,
          "temperature": 18.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "shuichi-10",
          "text": "蓄水池-10",
          "level": 2.76,
          "maxLevel": 4,
          "temperature": 18.79,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "shuichi-11",
          "text": "蓄水池-11",
          "level": 2.05,
          "maxLevel": 4,
          "temperature": 19.19,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "shuichi-12",
          "text": "蓄水池-12",
          "level": 2.21,
          "maxLevel": 4,
          "temperature": 19.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "shuichi-13",
          "text": "蓄水池-13",
          "level": 2.28,
          "maxLevel": 4,
          "temperature": 18.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "shuichi-14",
          "text": "蓄水池-14",
          "level": 2.31,
          "maxLevel": 4,
          "temperature": 17.56,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        }
      ]
    },
    {
      "source": "coolingTower",
      "data": [
        {
          "name": "paifengshan-01",
          "text": "冷却塔-01",
          "temperature": 43.29,
          "power": 15.64,
          "rpm": 919,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "paifengshan-02",
          "text": "冷却塔-02",
          "temperature": 43.97,
          "power": 15.99,
          "rpm": 930,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "paifengshan-03",
          "text": "冷却塔-03",
          "temperature": 43.73,
          "power": 15.86,
          "rpm": 926,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "paifengshan-04",
          "text": "冷却塔-04",
          "temperature": 42.67,
          "power": 15.33,
          "rpm": 910,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "paifengshan-05",
          "text": "冷却塔-05",
          "temperature": 41.3,
          "power": 14.65,
          "rpm": 889,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "paifengshan-06",
          "text": "冷却塔-06",
          "temperature": 40.26,
          "power": 14.13,
          "rpm": 874,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "paifengshan-07",
          "text": "冷却塔-07",
          "temperature": 40.04,
          "power": 14.02,
          "rpm": 871,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "paifengshan-08",
          "text": "冷却塔-08",
          "temperature": 40.74,
          "power": 14.37,
          "rpm": 881,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        }
      ]
    },
    {
      "source": "coolingTube",
      "data": [
        {
          "name": "guanzi-1",
          "text": "冷却管-1",
          "temperature": 36.97,
          "pressure": 0.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "guanzi-2",
          "text": "冷却管-2",
          "temperature": 37.48,
          "pressure": 0.39,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "guanzi-3",
          "text": "冷却管-3",
          "temperature": 37.29,
          "pressure": 0.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "guanzi-4",
          "text": "冷却管-4",
          "temperature": 36.5,
          "pressure": 0.36,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        }
      ]
    },
    {
      "source": "streetlight",
      "data": [
        {
          "name": "ld18",
          "text": "路灯-18",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "ld062",
          "text": "路灯-062",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "ld063",
          "text": "路灯-063",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "ld064",
          "text": "路灯-064",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "ld065",
          "text": "路灯-065",
          "power": 0.08,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "ld066",
          "text": "路灯-066",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "ld067",
          "text": "路灯-067",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "ld068",
          "text": "路灯-068",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "ld069",
          "text": "路灯-069",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "ld070",
          "text": "路灯-070",
          "power": 0.09,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "ld071",
          "text": "路灯-071",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "ld072",
          "text": "路灯-072",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "ld073",
          "text": "路灯-073",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "ld074",
          "text": "路灯-074",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        }
      ]
    },
    {
      "source": "pressureRegulatingTower",
      "data": [
        {
          "name": "yancun-01",
          "text": "调压塔-01",
          "pressure": 0.58,
          "maxPressure": 1.2,
          "level": 3.33,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "yancun-02",
          "text": "调压塔-02",
          "pressure": 0.6,
          "maxPressure": 1.2,
          "level": 3.4,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        }
      ]
    },
    {
      "source": "mixingTank",
      "data": [
        {
          "name": "01-01",
          "text": "搅拌池-01",
          "level": 1.93,
          "maxLevel": 3.5,
          "power": 7.82,
          "temperature": 22.64,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "01-02",
          "text": "搅拌池-02",
          "level": 2,
          "maxLevel": 3.5,
          "power": 7.99,
          "temperature": 22.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "01-03",
          "text": "搅拌池-03",
          "level": 1.97,
          "maxLevel": 3.5,
          "power": 7.93,
          "temperature": 22.86,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "01-04",
          "text": "搅拌池-04",
          "level": 1.87,
          "maxLevel": 3.5,
          "power": 7.67,
          "temperature": 22.33,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        }
      ]
    },
    {
      "source": "house",
      "data": [
        {
          "name": "fangzi-01",
          "text": "厂房-01",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "fangzi-02",
          "text": "厂房-02",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "fangzi-03",
          "text": "厂房-03",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "fangzi-04",
          "text": "厂房-04",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "fangzi-05",
          "text": "厂房-05",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "fangzi-06",
          "text": "厂房-06",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "fangzi-07",
          "text": "厂房-07",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "fangzi-08",
          "text": "厂房-08",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "fangzi-09",
          "text": "厂房-09",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "fangzi-10",
          "text": "厂房-10",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        }
      ]
    },
    {
      "source": "verticalPressurizedTankBody",
      "data": [
        {
          "name": "daguanzi-01",
          "text": "承压罐-01",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.64,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-02",
          "text": "承压罐-02",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-03",
          "text": "承压罐-03",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.86,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-04",
          "text": "承压罐-04",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.33,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-05",
          "text": "承压罐-05",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.65,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-06",
          "text": "承压罐-06",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.13,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-07",
          "text": "承压罐-07",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-08",
          "text": "承压罐-08",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.37,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-09",
          "text": "承压罐-09",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-10",
          "text": "承压罐-10",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.66,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-11",
          "text": "承压罐-11",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-12",
          "text": "承压罐-12",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-13",
          "text": "承压罐-13",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-14",
          "text": "承压罐-14",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.63,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-15",
          "text": "承压罐-15",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.12,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-16",
          "text": "承压罐-16",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-17",
          "text": "承压罐-17",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-18",
          "text": "承压罐-18",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-19",
          "text": "承压罐-19",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.67,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-20",
          "text": "承压罐-20",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-21",
          "text": "承压罐-21",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        },
        {
          "name": "daguanzi-22",
          "text": "承压罐-22",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.3,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:05.000Z"
        }
      ]
    }
  ],
  [
    {
      "source": "reservoir",
      "data": [
        {
          "name": "shuichi-01",
          "text": "蓄水池-01",
          "level": 2.05,
          "maxLevel": 4,
          "temperature": 19.18,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "shuichi-02",
          "text": "蓄水池-02",
          "level": 2.22,
          "maxLevel": 4,
          "temperature": 19.04,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "shuichi-03",
          "text": "蓄水池-03",
          "level": 2.28,
          "maxLevel": 4,
          "temperature": 18.4,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "shuichi-04",
          "text": "蓄水池-04",
          "level": 2.31,
          "maxLevel": 4,
          "temperature": 17.58,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "shuichi-05",
          "text": "蓄水池-05",
          "level": 2.38,
          "maxLevel": 4,
          "temperature": 16.95,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "shuichi-06",
          "text": "蓄水池-06",
          "level": 1.55,
          "maxLevel": 4,
          "temperature": 16.82,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "shuichi-07",
          "text": "蓄水池-07",
          "level": 1.84,
          "maxLevel": 4,
          "temperature": 17.24,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "shuichi-08",
          "text": "蓄水池-08",
          "level": 2.2,
          "maxLevel": 4,
          "temperature": 18.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "shuichi-09",
          "text": "蓄水池-09",
          "level": 2.56,
          "maxLevel": 4,
          "temperature": 18.79,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "shuichi-10",
          "text": "蓄水池-10",
          "level": 2.85,
          "maxLevel": 4,
          "temperature": 19.19,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "shuichi-11",
          "text": "蓄水池-11",
          "level": 2.01,
          "maxLevel": 4,
          "temperature": 19.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "shuichi-12",
          "text": "蓄水池-12",
          "level": 2.08,
          "maxLevel": 4,
          "temperature": 18.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "shuichi-13",
          "text": "蓄水池-13",
          "level": 2.11,
          "maxLevel": 4,
          "temperature": 17.56,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "shuichi-14",
          "text": "蓄水池-14",
          "level": 2.18,
          "maxLevel": 4,
          "temperature": 16.94,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        }
      ]
    },
    {
      "source": "coolingTower",
      "data": [
        {
          "name": "paifengshan-01",
          "text": "冷却塔-01",
          "temperature": 43.97,
          "power": 15.99,
          "rpm": 930,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "paifengshan-02",
          "text": "冷却塔-02",
          "temperature": 43.73,
          "power": 15.86,
          "rpm": 926,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "paifengshan-03",
          "text": "冷却塔-03",
          "temperature": 42.67,
          "power": 15.33,
          "rpm": 910,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "paifengshan-04",
          "text": "冷却塔-04",
          "temperature": 41.3,
          "power": 14.65,
          "rpm": 889,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "paifengshan-05",
          "text": "冷却塔-05",
          "temperature": 40.26,
          "power": 14.13,
          "rpm": 874,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "paifengshan-06",
          "text": "冷却塔-06",
          "temperature": 40.04,
          "power": 14.02,
          "rpm": 871,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "paifengshan-07",
          "text": "冷却塔-07",
          "temperature": 40.74,
          "power": 14.37,
          "rpm": 881,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "paifengshan-08",
          "text": "冷却塔-08",
          "temperature": 42.03,
          "power": 15.02,
          "rpm": 901,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        }
      ]
    },
    {
      "source": "coolingTube",
      "data": [
        {
          "name": "guanzi-1",
          "text": "冷却管-1",
          "temperature": 37.48,
          "pressure": 0.39,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "guanzi-2",
          "text": "冷却管-2",
          "temperature": 37.29,
          "pressure": 0.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "guanzi-3",
          "text": "冷却管-3",
          "temperature": 36.5,
          "pressure": 0.36,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "guanzi-4",
          "text": "冷却管-4",
          "temperature": 35.47,
          "pressure": 0.34,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        }
      ]
    },
    {
      "source": "streetlight",
      "data": [
        {
          "name": "ld18",
          "text": "路灯-18",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "ld062",
          "text": "路灯-062",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "ld063",
          "text": "路灯-063",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "ld064",
          "text": "路灯-064",
          "power": 0.08,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "ld065",
          "text": "路灯-065",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "ld066",
          "text": "路灯-066",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "ld067",
          "text": "路灯-067",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "ld068",
          "text": "路灯-068",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "ld069",
          "text": "路灯-069",
          "power": 0.09,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "ld070",
          "text": "路灯-070",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "ld071",
          "text": "路灯-071",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "ld072",
          "text": "路灯-072",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "ld073",
          "text": "路灯-073",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "ld074",
          "text": "路灯-074",
          "power": 0.07,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        }
      ]
    },
    {
      "source": "pressureRegulatingTower",
      "data": [
        {
          "name": "yancun-01",
          "text": "调压塔-01",
          "pressure": 0.6,
          "maxPressure": 1.2,
          "level": 3.4,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "yancun-02",
          "text": "调压塔-02",
          "pressure": 0.59,
          "maxPressure": 1.2,
          "level": 3.37,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        }
      ]
    },
    {
      "source": "mixingTank",
      "data": [
        {
          "name": "01-01",
          "text": "搅拌池-01",
          "level": 2,
          "maxLevel": 3.5,
          "power": 7.99,
          "temperature": 22.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "01-02",
          "text": "搅拌池-02",
          "level": 1.97,
          "maxLevel": 3.5,
          "power": 7.93,
          "temperature": 22.86,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "01-03",
          "text": "搅拌池-03",
          "level": 1.87,
          "maxLevel": 3.5,
          "power": 7.67,
          "temperature": 22.33,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "01-04",
          "text": "搅拌池-04",
          "level": 1.73,
          "maxLevel": 3.5,
          "power": 7.32,
          "temperature": 21.65,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        }
      ]
    },
    {
      "source": "house",
      "data": [
        {
          "name": "fangzi-01",
          "text": "厂房-01",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "fangzi-02",
          "text": "厂房-02",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "fangzi-03",
          "text": "厂房-03",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "fangzi-04",
          "text": "厂房-04",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "fangzi-05",
          "text": "厂房-05",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "fangzi-06",
          "text": "厂房-06",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "fangzi-07",
          "text": "厂房-07",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "fangzi-08",
          "text": "厂房-08",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "fangzi-09",
          "text": "厂房-09",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "fangzi-10",
          "text": "厂房-10",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        }
      ]
    },
    {
      "source": "verticalPressurizedTankBody",
      "data": [
        {
          "name": "daguanzi-01",
          "text": "承压罐-01",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-02",
          "text": "承压罐-02",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.86,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-03",
          "text": "承压罐-03",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.33,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-04",
          "text": "承压罐-04",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.65,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-05",
          "text": "承压罐-05",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.13,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-06",
          "text": "承压罐-06",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-07",
          "text": "承压罐-07",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.37,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-08",
          "text": "承压罐-08",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-09",
          "text": "承压罐-09",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.66,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-10",
          "text": "承压罐-10",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-11",
          "text": "承压罐-11",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-12",
          "text": "承压罐-12",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-13",
          "text": "承压罐-13",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.63,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-14",
          "text": "承压罐-14",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.12,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-15",
          "text": "承压罐-15",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-16",
          "text": "承压罐-16",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-17",
          "text": "承压罐-17",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-18",
          "text": "承压罐-18",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.67,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-19",
          "text": "承压罐-19",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-20",
          "text": "承压罐-20",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-21",
          "text": "承压罐-21",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.3,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        },
        {
          "name": "daguanzi-22",
          "text": "承压罐-22",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.62,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:10.000Z"
        }
      ]
    }
  ],
  [
    {
      "source": "reservoir",
      "data": [
        {
          "name": "shuichi-01",
          "text": "蓄水池-01",
          "level": 2.02,
          "maxLevel": 4,
          "temperature": 19.04,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "shuichi-02",
          "text": "蓄水池-02",
          "level": 2.08,
          "maxLevel": 4,
          "temperature": 18.4,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "shuichi-03",
          "text": "蓄水池-03",
          "level": 2.11,
          "maxLevel": 4,
          "temperature": 17.58,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "shuichi-04",
          "text": "蓄水池-04",
          "level": 2.18,
          "maxLevel": 4,
          "temperature": 16.95,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "shuichi-05",
          "text": "蓄水池-05",
          "level": 2.35,
          "maxLevel": 4,
          "temperature": 16.82,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "shuichi-06",
          "text": "蓄水池-06",
          "level": 1.64,
          "maxLevel": 4,
          "temperature": 17.24,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "shuichi-07",
          "text": "蓄水池-07",
          "level": 2,
          "maxLevel": 4,
          "temperature": 18.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "shuichi-08",
          "text": "蓄水池-08",
          "level": 2.36,
          "maxLevel": 4,
          "temperature": 18.79,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "shuichi-09",
          "text": "蓄水池-09",
          "level": 2.65,
          "maxLevel": 4,
          "temperature": 19.19,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "shuichi-10",
          "text": "蓄水池-10",
          "level": 2.81,
          "maxLevel": 4,
          "temperature": 19.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "shuichi-11",
          "text": "蓄水池-11",
          "level": 1.88,
          "maxLevel": 4,
          "temperature": 18.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "shuichi-12",
          "text": "蓄水池-12",
          "level": 1.91,
          "maxLevel": 4,
          "temperature": 17.56,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "shuichi-13",
          "text": "蓄水池-13",
          "level": 1.98,
          "maxLevel": 4,
          "temperature": 16.94,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "shuichi-14",
          "text": "蓄水池-14",
          "level": 2.16,
          "maxLevel": 4,
          "temperature": 16.82,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        }
      ]
    },
    {
      "source": "coolingTower",
      "data": [
        {
          "name": "paifengshan-01",
          "text": "冷却塔-01",
          "temperature": 43.73,
          "power": 15.86,
          "rpm": 926,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "paifengshan-02",
          "text": "冷却塔-02",
          "temperature": 42.67,
          "power": 15.33,
          "rpm": 910,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "paifengshan-03",
          "text": "冷却塔-03",
          "temperature": 41.3,
          "power": 14.65,
          "rpm": 889,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "paifengshan-04",
          "text": "冷却塔-04",
          "temperature": 40.26,
          "power": 14.13,
          "rpm": 874,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "paifengshan-05",
          "text": "冷却塔-05",
          "temperature": 40.04,
          "power": 14.02,
          "rpm": 871,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "paifengshan-06",
          "text": "冷却塔-06",
          "temperature": 40.74,
          "power": 14.37,
          "rpm": 881,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "paifengshan-07",
          "text": "冷却塔-07",
          "temperature": 42.03,
          "power": 15.02,
          "rpm": 901,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "paifengshan-08",
          "text": "冷却塔-08",
          "temperature": 43.31,
          "power": 15.66,
          "rpm": 920,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        }
      ]
    },
    {
      "source": "coolingTube",
      "data": [
        {
          "name": "guanzi-1",
          "text": "冷却管-1",
          "temperature": 37.29,
          "pressure": 0.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "guanzi-2",
          "text": "冷却管-2",
          "temperature": 36.5,
          "pressure": 0.36,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "guanzi-3",
          "text": "冷却管-3",
          "temperature": 35.47,
          "pressure": 0.34,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "guanzi-4",
          "text": "冷却管-4",
          "temperature": 34.69,
          "pressure": 0.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        }
      ]
    },
    {
      "source": "streetlight",
      "data": [
        {
          "name": "ld18",
          "text": "路灯-18",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "ld062",
          "text": "路灯-062",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "ld063",
          "text": "路灯-063",
          "power": 0.08,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "ld064",
          "text": "路灯-064",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "ld065",
          "text": "路灯-065",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "ld066",
          "text": "路灯-066",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "ld067",
          "text": "路灯-067",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "ld068",
          "text": "路灯-068",
          "power": 0.09,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "ld069",
          "text": "路灯-069",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "ld070",
          "text": "路灯-070",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "ld071",
          "text": "路灯-071",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "ld072",
          "text": "路灯-072",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "ld073",
          "text": "路灯-073",
          "power": 0.07,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "ld074",
          "text": "路灯-074",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        }
      ]
    },
    {
      "source": "pressureRegulatingTower",
      "data": [
        {
          "name": "yancun-01",
          "text": "调压塔-01",
          "pressure": 0.59,
          "maxPressure": 1.2,
          "level": 3.37,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "yancun-02",
          "text": "调压塔-02",
          "pressure": 0.57,
          "maxPressure": 1.2,
          "level": 3.27,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        }
      ]
    },
    {
      "source": "mixingTank",
      "data": [
        {
          "name": "01-01",
          "text": "搅拌池-01",
          "level": 1.97,
          "maxLevel": 3.5,
          "power": 7.93,
          "temperature": 22.86,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "01-02",
          "text": "搅拌池-02",
          "level": 1.87,
          "maxLevel": 3.5,
          "power": 7.67,
          "temperature": 22.33,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "01-03",
          "text": "搅拌池-03",
          "level": 1.73,
          "maxLevel": 3.5,
          "power": 7.32,
          "temperature": 21.65,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "01-04",
          "text": "搅拌池-04",
          "level": 1.63,
          "maxLevel": 3.5,
          "power": 7.06,
          "temperature": 21.13,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        }
      ]
    },
    {
      "source": "house",
      "data": [
        {
          "name": "fangzi-01",
          "text": "厂房-01",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "fangzi-02",
          "text": "厂房-02",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "fangzi-03",
          "text": "厂房-03",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "fangzi-04",
          "text": "厂房-04",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "fangzi-05",
          "text": "厂房-05",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "fangzi-06",
          "text": "厂房-06",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "fangzi-07",
          "text": "厂房-07",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "fangzi-08",
          "text": "厂房-08",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "fangzi-09",
          "text": "厂房-09",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "fangzi-10",
          "text": "厂房-10",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        }
      ]
    },
    {
      "source": "verticalPressurizedTankBody",
      "data": [
        {
          "name": "daguanzi-01",
          "text": "承压罐-01",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.86,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-02",
          "text": "承压罐-02",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.33,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-03",
          "text": "承压罐-03",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.65,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-04",
          "text": "承压罐-04",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.13,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-05",
          "text": "承压罐-05",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-06",
          "text": "承压罐-06",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.37,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-07",
          "text": "承压罐-07",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-08",
          "text": "承压罐-08",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.66,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-09",
          "text": "承压罐-09",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-10",
          "text": "承压罐-10",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-11",
          "text": "承压罐-11",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-12",
          "text": "承压罐-12",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.63,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-13",
          "text": "承压罐-13",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.12,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-14",
          "text": "承压罐-14",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-15",
          "text": "承压罐-15",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-16",
          "text": "承压罐-16",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-17",
          "text": "承压罐-17",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.67,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-18",
          "text": "承压罐-18",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-19",
          "text": "承压罐-19",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-20",
          "text": "承压罐-20",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.3,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-21",
          "text": "承压罐-21",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.62,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        },
        {
          "name": "daguanzi-22",
          "text": "承压罐-22",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.11,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:15.000Z"
        }
      ]
    }
  ],
  [
    {
      "source": "reservoir",
      "data": [
        {
          "name": "shuichi-01",
          "text": "蓄水池-01",
          "level": 1.88,
          "maxLevel": 4,
          "temperature": 18.4,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "shuichi-02",
          "text": "蓄水池-02",
          "level": 1.91,
          "maxLevel": 4,
          "temperature": 17.58,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "shuichi-03",
          "text": "蓄水池-03",
          "level": 1.98,
          "maxLevel": 4,
          "temperature": 16.95,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "shuichi-04",
          "text": "蓄水池-04",
          "level": 2.15,
          "maxLevel": 4,
          "temperature": 16.82,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "shuichi-05",
          "text": "蓄水池-05",
          "level": 2.44,
          "maxLevel": 4,
          "temperature": 17.24,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "shuichi-06",
          "text": "蓄水池-06",
          "level": 1.8,
          "maxLevel": 4,
          "temperature": 18.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "shuichi-07",
          "text": "蓄水池-07",
          "level": 2.16,
          "maxLevel": 4,
          "temperature": 18.79,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "shuichi-08",
          "text": "蓄水池-08",
          "level": 2.45,
          "maxLevel": 4,
          "temperature": 19.19,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "shuichi-09",
          "text": "蓄水池-09",
          "level": 2.61,
          "maxLevel": 4,
          "temperature": 19.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "shuichi-10",
          "text": "蓄水池-10",
          "level": 2.68,
          "maxLevel": 4,
          "temperature": 18.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "shuichi-11",
          "text": "蓄水池-11",
          "level": 1.71,
          "maxLevel": 4,
          "temperature": 17.56,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "shuichi-12",
          "text": "蓄水池-12",
          "level": 1.78,
          "maxLevel": 4,
          "temperature": 16.94,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "shuichi-13",
          "text": "蓄水池-13",
          "level": 1.96,
          "maxLevel": 4,
          "temperature": 16.82,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "shuichi-14",
          "text": "蓄水池-14",
          "level": 2.25,
          "maxLevel": 4,
          "temperature": 17.26,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        }
      ]
    },
    {
      "source": "coolingTower",
      "data": [
        {
          "name": "paifengshan-01",
          "text": "冷却塔-01",
          "temperature": 42.67,
          "power": 15.33,
          "rpm": 910,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "paifengshan-02",
          "text": "冷却塔-02",
          "temperature": 41.3,
          "power": 14.65,
          "rpm": 889,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "paifengshan-03",
          "text": "冷却塔-03",
          "temperature": 40.26,
          "power": 14.13,
          "rpm": 874,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "paifengshan-04",
          "text": "冷却塔-04",
          "temperature": 40.04,
          "power": 14.02,
          "rpm": 871,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "paifengshan-05",
          "text": "冷却塔-05",
          "temperature": 40.74,
          "power": 14.37,
          "rpm": 881,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "paifengshan-06",
          "text": "冷却塔-06",
          "temperature": 42.03,
          "power": 15.02,
          "rpm": 901,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "paifengshan-07",
          "text": "冷却塔-07",
          "temperature": 43.31,
          "power": 15.66,
          "rpm": 920,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "paifengshan-08",
          "text": "冷却塔-08",
          "temperature": 43.98,
          "power": 15.99,
          "rpm": 930,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        }
      ]
    },
    {
      "source": "coolingTube",
      "data": [
        {
          "name": "guanzi-1",
          "text": "冷却管-1",
          "temperature": 36.5,
          "pressure": 0.36,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "guanzi-2",
          "text": "冷却管-2",
          "temperature": 35.47,
          "pressure": 0.34,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "guanzi-3",
          "text": "冷却管-3",
          "temperature": 34.69,
          "pressure": 0.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "guanzi-4",
          "text": "冷却管-4",
          "temperature": 34.53,
          "pressure": 0.31,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        }
      ]
    },
    {
      "source": "streetlight",
      "data": [
        {
          "name": "ld18",
          "text": "路灯-18",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "ld062",
          "text": "路灯-062",
          "power": 0.08,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "ld063",
          "text": "路灯-063",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "ld064",
          "text": "路灯-064",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "ld065",
          "text": "路灯-065",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "ld066",
          "text": "路灯-066",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "ld067",
          "text": "路灯-067",
          "power": 0.09,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "ld068",
          "text": "路灯-068",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "ld069",
          "text": "路灯-069",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "ld070",
          "text": "路灯-070",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "ld071",
          "text": "路灯-071",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "ld072",
          "text": "路灯-072",
          "power": 0.07,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "ld073",
          "text": "路灯-073",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "ld074",
          "text": "路灯-074",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        }
      ]
    },
    {
      "source": "pressureRegulatingTower",
      "data": [
        {
          "name": "yancun-01",
          "text": "调压塔-01",
          "pressure": 0.57,
          "maxPressure": 1.2,
          "level": 3.27,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "yancun-02",
          "text": "调压塔-02",
          "pressure": 0.53,
          "maxPressure": 1.2,
          "level": 3.13,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        }
      ]
    },
    {
      "source": "mixingTank",
      "data": [
        {
          "name": "01-01",
          "text": "搅拌池-01",
          "level": 1.87,
          "maxLevel": 3.5,
          "power": 7.67,
          "temperature": 22.33,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "01-02",
          "text": "搅拌池-02",
          "level": 1.73,
          "maxLevel": 3.5,
          "power": 7.32,
          "temperature": 21.65,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "01-03",
          "text": "搅拌池-03",
          "level": 1.63,
          "maxLevel": 3.5,
          "power": 7.06,
          "temperature": 21.13,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "01-04",
          "text": "搅拌池-04",
          "level": 1.6,
          "maxLevel": 3.5,
          "power": 7.01,
          "temperature": 21.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        }
      ]
    },
    {
      "source": "house",
      "data": [
        {
          "name": "fangzi-01",
          "text": "厂房-01",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "fangzi-02",
          "text": "厂房-02",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "fangzi-03",
          "text": "厂房-03",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "fangzi-04",
          "text": "厂房-04",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "fangzi-05",
          "text": "厂房-05",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "fangzi-06",
          "text": "厂房-06",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "fangzi-07",
          "text": "厂房-07",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "fangzi-08",
          "text": "厂房-08",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "fangzi-09",
          "text": "厂房-09",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "fangzi-10",
          "text": "厂房-10",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        }
      ]
    },
    {
      "source": "verticalPressurizedTankBody",
      "data": [
        {
          "name": "daguanzi-01",
          "text": "承压罐-01",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.33,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-02",
          "text": "承压罐-02",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.65,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-03",
          "text": "承压罐-03",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.13,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-04",
          "text": "承压罐-04",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-05",
          "text": "承压罐-05",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.37,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-06",
          "text": "承压罐-06",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-07",
          "text": "承压罐-07",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.66,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-08",
          "text": "承压罐-08",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-09",
          "text": "承压罐-09",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-10",
          "text": "承压罐-10",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-11",
          "text": "承压罐-11",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.63,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-12",
          "text": "承压罐-12",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.12,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-13",
          "text": "承压罐-13",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-14",
          "text": "承压罐-14",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-15",
          "text": "承压罐-15",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-16",
          "text": "承压罐-16",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.67,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-17",
          "text": "承压罐-17",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-18",
          "text": "承压罐-18",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-19",
          "text": "承压罐-19",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.3,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-20",
          "text": "承压罐-20",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.62,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-21",
          "text": "承压罐-21",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.11,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        },
        {
          "name": "daguanzi-22",
          "text": "承压罐-22",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:20.000Z"
        }
      ]
    }
  ],
  [
    {
      "source": "reservoir",
      "data": [
        {
          "name": "shuichi-01",
          "text": "蓄水池-01",
          "level": 1.71,
          "maxLevel": 4,
          "temperature": 17.58,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "shuichi-02",
          "text": "蓄水池-02",
          "level": 1.78,
          "maxLevel": 4,
          "temperature": 16.95,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "shuichi-03",
          "text": "蓄水池-03",
          "level": 1.95,
          "maxLevel": 4,
          "temperature": 16.82,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "shuichi-04",
          "text": "蓄水池-04",
          "level": 2.24,
          "maxLevel": 4,
          "temperature": 17.24,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "shuichi-05",
          "text": "蓄水池-05",
          "level": 2.6,
          "maxLevel": 4,
          "temperature": 18.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "shuichi-06",
          "text": "蓄水池-06",
          "level": 1.96,
          "maxLevel": 4,
          "temperature": 18.79,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "shuichi-07",
          "text": "蓄水池-07",
          "level": 2.25,
          "maxLevel": 4,
          "temperature": 19.19,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "shuichi-08",
          "text": "蓄水池-08",
          "level": 2.41,
          "maxLevel": 4,
          "temperature": 19.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "shuichi-09",
          "text": "蓄水池-09",
          "level": 2.48,
          "maxLevel": 4,
          "temperature": 18.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "shuichi-10",
          "text": "蓄水池-10",
          "level": 2.51,
          "maxLevel": 4,
          "temperature": 17.56,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "shuichi-11",
          "text": "蓄水池-11",
          "level": 1.58,
          "maxLevel": 4,
          "temperature": 16.94,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "shuichi-12",
          "text": "蓄水池-12",
          "level": 1.76,
          "maxLevel": 4,
          "temperature": 16.82,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "shuichi-13",
          "text": "蓄水池-13",
          "level": 2.05,
          "maxLevel": 4,
          "temperature": 17.26,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "shuichi-14",
          "text": "蓄水池-14",
          "level": 2.41,
          "maxLevel": 4,
          "temperature": 18.04,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        }
      ]
    },
    {
      "source": "coolingTower",
      "data": [
        {
          "name": "paifengshan-01",
          "text": "冷却塔-01",
          "temperature": 41.3,
          "power": 14.65,
          "rpm": 889,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "paifengshan-02",
          "text": "冷却塔-02",
          "temperature": 40.26,
          "power": 14.13,
          "rpm": 874,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "paifengshan-03",
          "text": "冷却塔-03",
          "temperature": 40.04,
          "power": 14.02,
          "rpm": 871,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "paifengshan-04",
          "text": "冷却塔-04",
          "temperature": 40.74,
          "power": 14.37,
          "rpm": 881,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "paifengshan-05",
          "text": "冷却塔-05",
          "temperature": 42.03,
          "power": 15.02,
          "rpm": 901,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "paifengshan-06",
          "text": "冷却塔-06",
          "temperature": 43.31,
          "power": 15.66,
          "rpm": 920,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "paifengshan-07",
          "text": "冷却塔-07",
          "temperature": 43.98,
          "power": 15.99,
          "rpm": 930,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "paifengshan-08",
          "text": "冷却塔-08",
          "temperature": 43.71,
          "power": 15.85,
          "rpm": 926,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        }
      ]
    },
    {
      "source": "coolingTube",
      "data": [
        {
          "name": "guanzi-1",
          "text": "冷却管-1",
          "temperature": 35.47,
          "pressure": 0.34,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "guanzi-2",
          "text": "冷却管-2",
          "temperature": 34.69,
          "pressure": 0.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "guanzi-3",
          "text": "冷却管-3",
          "temperature": 34.53,
          "pressure": 0.31,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "guanzi-4",
          "text": "冷却管-4",
          "temperature": 35.05,
          "pressure": 0.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        }
      ]
    },
    {
      "source": "streetlight",
      "data": [
        {
          "name": "ld18",
          "text": "路灯-18",
          "power": 0.08,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "ld062",
          "text": "路灯-062",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "ld063",
          "text": "路灯-063",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "ld064",
          "text": "路灯-064",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "ld065",
          "text": "路灯-065",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "ld066",
          "text": "路灯-066",
          "power": 0.09,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "ld067",
          "text": "路灯-067",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "ld068",
          "text": "路灯-068",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "ld069",
          "text": "路灯-069",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "ld070",
          "text": "路灯-070",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "ld071",
          "text": "路灯-071",
          "power": 0.07,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "ld072",
          "text": "路灯-072",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "ld073",
          "text": "路灯-073",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "ld074",
          "text": "路灯-074",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        }
      ]
    },
    {
      "source": "pressureRegulatingTower",
      "data": [
        {
          "name": "yancun-01",
          "text": "调压塔-01",
          "pressure": 0.53,
          "maxPressure": 1.2,
          "level": 3.13,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "yancun-02",
          "text": "调压塔-02",
          "pressure": 0.51,
          "maxPressure": 1.2,
          "level": 3.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        }
      ]
    },
    {
      "source": "mixingTank",
      "data": [
        {
          "name": "01-01",
          "text": "搅拌池-01",
          "level": 1.73,
          "maxLevel": 3.5,
          "power": 7.32,
          "temperature": 21.65,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "01-02",
          "text": "搅拌池-02",
          "level": 1.63,
          "maxLevel": 3.5,
          "power": 7.06,
          "temperature": 21.13,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "01-03",
          "text": "搅拌池-03",
          "level": 1.6,
          "maxLevel": 3.5,
          "power": 7.01,
          "temperature": 21.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "01-04",
          "text": "搅拌池-04",
          "level": 1.67,
          "maxLevel": 3.5,
          "power": 7.18,
          "temperature": 21.37,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        }
      ]
    },
    {
      "source": "house",
      "data": [
        {
          "name": "fangzi-01",
          "text": "厂房-01",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "fangzi-02",
          "text": "厂房-02",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "fangzi-03",
          "text": "厂房-03",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "fangzi-04",
          "text": "厂房-04",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "fangzi-05",
          "text": "厂房-05",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "fangzi-06",
          "text": "厂房-06",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "fangzi-07",
          "text": "厂房-07",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "fangzi-08",
          "text": "厂房-08",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "fangzi-09",
          "text": "厂房-09",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "fangzi-10",
          "text": "厂房-10",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        }
      ]
    },
    {
      "source": "verticalPressurizedTankBody",
      "data": [
        {
          "name": "daguanzi-01",
          "text": "承压罐-01",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.65,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-02",
          "text": "承压罐-02",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.13,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-03",
          "text": "承压罐-03",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-04",
          "text": "承压罐-04",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.37,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-05",
          "text": "承压罐-05",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-06",
          "text": "承压罐-06",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.66,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-07",
          "text": "承压罐-07",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-08",
          "text": "承压罐-08",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-09",
          "text": "承压罐-09",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-10",
          "text": "承压罐-10",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.63,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-11",
          "text": "承压罐-11",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.12,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-12",
          "text": "承压罐-12",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-13",
          "text": "承压罐-13",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-14",
          "text": "承压罐-14",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-15",
          "text": "承压罐-15",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.67,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-16",
          "text": "承压罐-16",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-17",
          "text": "承压罐-17",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-18",
          "text": "承压罐-18",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.3,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-19",
          "text": "承压罐-19",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.62,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-20",
          "text": "承压罐-20",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.11,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-21",
          "text": "承压罐-21",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        },
        {
          "name": "daguanzi-22",
          "text": "承压罐-22",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.4,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:25.000Z"
        }
      ]
    }
  ],
  [
    {
      "source": "reservoir",
      "data": [
        {
          "name": "shuichi-01",
          "text": "蓄水池-01",
          "level": 1.58,
          "maxLevel": 4,
          "temperature": 16.95,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "shuichi-02",
          "text": "蓄水池-02",
          "level": 1.75,
          "maxLevel": 4,
          "temperature": 16.82,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "shuichi-03",
          "text": "蓄水池-03",
          "level": 2.04,
          "maxLevel": 4,
          "temperature": 17.24,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "shuichi-04",
          "text": "蓄水池-04",
          "level": 2.4,
          "maxLevel": 4,
          "temperature": 18.02,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "shuichi-05",
          "text": "蓄水池-05",
          "level": 2.76,
          "maxLevel": 4,
          "temperature": 18.79,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "shuichi-06",
          "text": "蓄水池-06",
          "level": 2.05,
          "maxLevel": 4,
          "temperature": 19.19,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "shuichi-07",
          "text": "蓄水池-07",
          "level": 2.21,
          "maxLevel": 4,
          "temperature": 19.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "shuichi-08",
          "text": "蓄水池-08",
          "level": 2.28,
          "maxLevel": 4,
          "temperature": 18.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "shuichi-09",
          "text": "蓄水池-09",
          "level": 2.31,
          "maxLevel": 4,
          "temperature": 17.56,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "shuichi-10",
          "text": "蓄水池-10",
          "level": 2.38,
          "maxLevel": 4,
          "temperature": 16.94,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "shuichi-11",
          "text": "蓄水池-11",
          "level": 1.56,
          "maxLevel": 4,
          "temperature": 16.82,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "shuichi-12",
          "text": "蓄水池-12",
          "level": 1.85,
          "maxLevel": 4,
          "temperature": 17.26,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "shuichi-13",
          "text": "蓄水池-13",
          "level": 2.21,
          "maxLevel": 4,
          "temperature": 18.04,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "shuichi-14",
          "text": "蓄水池-14",
          "level": 2.57,
          "maxLevel": 4,
          "temperature": 18.8,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        }
      ]
    },
    {
      "source": "coolingTower",
      "data": [
        {
          "name": "paifengshan-01",
          "text": "冷却塔-01",
          "temperature": 40.26,
          "power": 14.13,
          "rpm": 874,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "paifengshan-02",
          "text": "冷却塔-02",
          "temperature": 40.04,
          "power": 14.02,
          "rpm": 871,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "paifengshan-03",
          "text": "冷却塔-03",
          "temperature": 40.74,
          "power": 14.37,
          "rpm": 881,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "paifengshan-04",
          "text": "冷却塔-04",
          "temperature": 42.03,
          "power": 15.02,
          "rpm": 901,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "paifengshan-05",
          "text": "冷却塔-05",
          "temperature": 43.31,
          "power": 15.66,
          "rpm": 920,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "paifengshan-06",
          "text": "冷却塔-06",
          "temperature": 43.98,
          "power": 15.99,
          "rpm": 930,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "paifengshan-07",
          "text": "冷却塔-07",
          "temperature": 43.71,
          "power": 15.85,
          "rpm": 926,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "paifengshan-08",
          "text": "冷却塔-08",
          "temperature": 42.64,
          "power": 15.32,
          "rpm": 910,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        }
      ]
    },
    {
      "source": "coolingTube",
      "data": [
        {
          "name": "guanzi-1",
          "text": "冷却管-1",
          "temperature": 34.69,
          "pressure": 0.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "guanzi-2",
          "text": "冷却管-2",
          "temperature": 34.53,
          "pressure": 0.31,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "guanzi-3",
          "text": "冷却管-3",
          "temperature": 35.05,
          "pressure": 0.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "guanzi-4",
          "text": "冷却管-4",
          "temperature": 36.03,
          "pressure": 0.35,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        }
      ]
    },
    {
      "source": "streetlight",
      "data": [
        {
          "name": "ld18",
          "text": "路灯-18",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "ld062",
          "text": "路灯-062",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "ld063",
          "text": "路灯-063",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "ld064",
          "text": "路灯-064",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "ld065",
          "text": "路灯-065",
          "power": 0.09,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "ld066",
          "text": "路灯-066",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "ld067",
          "text": "路灯-067",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "ld068",
          "text": "路灯-068",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "ld069",
          "text": "路灯-069",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "ld070",
          "text": "路灯-070",
          "power": 0.07,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "ld071",
          "text": "路灯-071",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "ld072",
          "text": "路灯-072",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "ld073",
          "text": "路灯-073",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "ld074",
          "text": "路灯-074",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        }
      ]
    },
    {
      "source": "pressureRegulatingTower",
      "data": [
        {
          "name": "yancun-01",
          "text": "调压塔-01",
          "pressure": 0.51,
          "maxPressure": 1.2,
          "level": 3.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "yancun-02",
          "text": "调压塔-02",
          "pressure": 0.5,
          "maxPressure": 1.2,
          "level": 3,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        }
      ]
    },
    {
      "source": "mixingTank",
      "data": [
        {
          "name": "01-01",
          "text": "搅拌池-01",
          "level": 1.63,
          "maxLevel": 3.5,
          "power": 7.06,
          "temperature": 21.13,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "01-02",
          "text": "搅拌池-02",
          "level": 1.6,
          "maxLevel": 3.5,
          "power": 7.01,
          "temperature": 21.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "01-03",
          "text": "搅拌池-03",
          "level": 1.67,
          "maxLevel": 3.5,
          "power": 7.18,
          "temperature": 21.37,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "01-04",
          "text": "搅拌池-04",
          "level": 1.8,
          "maxLevel": 3.5,
          "power": 7.51,
          "temperature": 22.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        }
      ]
    },
    {
      "source": "house",
      "data": [
        {
          "name": "fangzi-01",
          "text": "厂房-01",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "fangzi-02",
          "text": "厂房-02",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "fangzi-03",
          "text": "厂房-03",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "fangzi-04",
          "text": "厂房-04",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "fangzi-05",
          "text": "厂房-05",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "fangzi-06",
          "text": "厂房-06",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "fangzi-07",
          "text": "厂房-07",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "fangzi-08",
          "text": "厂房-08",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "fangzi-09",
          "text": "厂房-09",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "fangzi-10",
          "text": "厂房-10",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        }
      ]
    },
    {
      "source": "verticalPressurizedTankBody",
      "data": [
        {
          "name": "daguanzi-01",
          "text": "承压罐-01",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.13,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-02",
          "text": "承压罐-02",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-03",
          "text": "承压罐-03",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.37,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-04",
          "text": "承压罐-04",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-05",
          "text": "承压罐-05",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.66,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-06",
          "text": "承压罐-06",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-07",
          "text": "承压罐-07",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-08",
          "text": "承压罐-08",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-09",
          "text": "承压罐-09",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.63,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-10",
          "text": "承压罐-10",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.12,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-11",
          "text": "承压罐-11",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-12",
          "text": "承压罐-12",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-13",
          "text": "承压罐-13",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-14",
          "text": "承压罐-14",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.67,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-15",
          "text": "承压罐-15",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-16",
          "text": "承压罐-16",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-17",
          "text": "承压罐-17",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.3,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-18",
          "text": "承压罐-18",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.62,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-19",
          "text": "承压罐-19",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.11,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-20",
          "text": "承压罐-20",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-21",
          "text": "承压罐-21",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.4,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        },
        {
          "name": "daguanzi-22",
          "text": "承压罐-22",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.05,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:30.000Z"
        }
      ]
    }
  ],
  [
    {
      "source": "reservoir",
      "data": [
        {
          "name": "shuichi-01",
          "text": "蓄水池-01",
          "level": 1.55,
          "maxLevel": 4,
          "temperature": 16.82,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "shuichi-02",
          "text": "蓄水池-02",
          "level": 1.84,
          "maxLevel": 4,
          "temperature": 17.24,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "shuichi-03",
          "text": "蓄水池-03",
          "level": 2.2,
          "maxLevel": 4,
          "temperature": 18.02,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "shuichi-04",
          "text": "蓄水池-04",
          "level": 2.56,
          "maxLevel": 4,
          "temperature": 18.79,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "shuichi-05",
          "text": "蓄水池-05",
          "level": 2.85,
          "maxLevel": 4,
          "temperature": 19.19,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "shuichi-06",
          "text": "蓄水池-06",
          "level": 2.01,
          "maxLevel": 4,
          "temperature": 19.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "shuichi-07",
          "text": "蓄水池-07",
          "level": 2.08,
          "maxLevel": 4,
          "temperature": 18.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "shuichi-08",
          "text": "蓄水池-08",
          "level": 2.11,
          "maxLevel": 4,
          "temperature": 17.56,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "shuichi-09",
          "text": "蓄水池-09",
          "level": 2.18,
          "maxLevel": 4,
          "temperature": 16.94,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "shuichi-10",
          "text": "蓄水池-10",
          "level": 2.36,
          "maxLevel": 4,
          "temperature": 16.82,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "shuichi-11",
          "text": "蓄水池-11",
          "level": 1.65,
          "maxLevel": 4,
          "temperature": 17.26,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "shuichi-12",
          "text": "蓄水池-12",
          "level": 2.01,
          "maxLevel": 4,
          "temperature": 18.04,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "shuichi-13",
          "text": "蓄水池-13",
          "level": 2.37,
          "maxLevel": 4,
          "temperature": 18.8,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "shuichi-14",
          "text": "蓄水池-14",
          "level": 2.65,
          "maxLevel": 4,
          "temperature": 19.19,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        }
      ]
    },
    {
      "source": "coolingTower",
      "data": [
        {
          "name": "paifengshan-01",
          "text": "冷却塔-01",
          "temperature": 40.04,
          "power": 14.02,
          "rpm": 871,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "paifengshan-02",
          "text": "冷却塔-02",
          "temperature": 40.74,
          "power": 14.37,
          "rpm": 881,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "paifengshan-03",
          "text": "冷却塔-03",
          "temperature": 42.03,
          "power": 15.02,
          "rpm": 901,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "paifengshan-04",
          "text": "冷却塔-04",
          "temperature": 43.31,
          "power": 15.66,
          "rpm": 920,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "paifengshan-05",
          "text": "冷却塔-05",
          "temperature": 43.98,
          "power": 15.99,
          "rpm": 930,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "paifengshan-06",
          "text": "冷却塔-06",
          "temperature": 43.71,
          "power": 15.85,
          "rpm": 926,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "paifengshan-07",
          "text": "冷却塔-07",
          "temperature": 42.64,
          "power": 15.32,
          "rpm": 910,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "paifengshan-08",
          "text": "冷却塔-08",
          "temperature": 41.27,
          "power": 14.63,
          "rpm": 889,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        }
      ]
    },
    {
      "source": "coolingTube",
      "data": [
        {
          "name": "guanzi-1",
          "text": "冷却管-1",
          "temperature": 34.53,
          "pressure": 0.31,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "guanzi-2",
          "text": "冷却管-2",
          "temperature": 35.05,
          "pressure": 0.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "guanzi-3",
          "text": "冷却管-3",
          "temperature": 36.03,
          "pressure": 0.35,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "guanzi-4",
          "text": "冷却管-4",
          "temperature": 36.99,
          "pressure": 0.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        }
      ]
    },
    {
      "source": "streetlight",
      "data": [
        {
          "name": "ld18",
          "text": "路灯-18",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "ld062",
          "text": "路灯-062",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "ld063",
          "text": "路灯-063",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "ld064",
          "text": "路灯-064",
          "power": 0.09,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "ld065",
          "text": "路灯-065",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "ld066",
          "text": "路灯-066",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "ld067",
          "text": "路灯-067",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "ld068",
          "text": "路灯-068",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "ld069",
          "text": "路灯-069",
          "power": 0.07,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "ld070",
          "text": "路灯-070",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "ld071",
          "text": "路灯-071",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "ld072",
          "text": "路灯-072",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "ld073",
          "text": "路灯-073",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "ld074",
          "text": "路灯-074",
          "power": 0.09,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        }
      ]
    },
    {
      "source": "pressureRegulatingTower",
      "data": [
        {
          "name": "yancun-01",
          "text": "调压塔-01",
          "pressure": 0.5,
          "maxPressure": 1.2,
          "level": 3,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "yancun-02",
          "text": "调压塔-02",
          "pressure": 0.52,
          "maxPressure": 1.2,
          "level": 3.07,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        }
      ]
    },
    {
      "source": "mixingTank",
      "data": [
        {
          "name": "01-01",
          "text": "搅拌池-01",
          "level": 1.6,
          "maxLevel": 3.5,
          "power": 7.01,
          "temperature": 21.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "01-02",
          "text": "搅拌池-02",
          "level": 1.67,
          "maxLevel": 3.5,
          "power": 7.18,
          "temperature": 21.37,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "01-03",
          "text": "搅拌池-03",
          "level": 1.8,
          "maxLevel": 3.5,
          "power": 7.51,
          "temperature": 22.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "01-04",
          "text": "搅拌池-04",
          "level": 1.93,
          "maxLevel": 3.5,
          "power": 7.83,
          "temperature": 22.66,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        }
      ]
    },
    {
      "source": "house",
      "data": [
        {
          "name": "fangzi-01",
          "text": "厂房-01",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "fangzi-02",
          "text": "厂房-02",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "fangzi-03",
          "text": "厂房-03",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "fangzi-04",
          "text": "厂房-04",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "fangzi-05",
          "text": "厂房-05",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "fangzi-06",
          "text": "厂房-06",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "fangzi-07",
          "text": "厂房-07",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "fangzi-08",
          "text": "厂房-08",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "fangzi-09",
          "text": "厂房-09",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "fangzi-10",
          "text": "厂房-10",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        }
      ]
    },
    {
      "source": "verticalPressurizedTankBody",
      "data": [
        {
          "name": "daguanzi-01",
          "text": "承压罐-01",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-02",
          "text": "承压罐-02",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.37,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-03",
          "text": "承压罐-03",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-04",
          "text": "承压罐-04",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.66,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-05",
          "text": "承压罐-05",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-06",
          "text": "承压罐-06",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-07",
          "text": "承压罐-07",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-08",
          "text": "承压罐-08",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.63,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-09",
          "text": "承压罐-09",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.12,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-10",
          "text": "承压罐-10",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-11",
          "text": "承压罐-11",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-12",
          "text": "承压罐-12",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.03,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-13",
          "text": "承压罐-13",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.67,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-14",
          "text": "承压罐-14",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-15",
          "text": "承压罐-15",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-16",
          "text": "承压罐-16",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.3,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-17",
          "text": "承压罐-17",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.62,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-18",
          "text": "承压罐-18",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.11,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-19",
          "text": "承压罐-19",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-20",
          "text": "承压罐-20",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.4,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-21",
          "text": "承压罐-21",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.05,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        },
        {
          "name": "daguanzi-22",
          "text": "承压罐-22",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.68,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:35.000Z"
        }
      ]
    }
  ],
  [
    {
      "source": "reservoir",
      "data": [
        {
          "name": "shuichi-01",
          "text": "蓄水池-01",
          "level": 1.64,
          "maxLevel": 4,
          "temperature": 17.24,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "shuichi-02",
          "text": "蓄水池-02",
          "level": 2,
          "maxLevel": 4,
          "temperature": 18.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "shuichi-03",
          "text": "蓄水池-03",
          "level": 2.36,
          "maxLevel": 4,
          "temperature": 18.79,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "shuichi-04",
          "text": "蓄水池-04",
          "level": 2.65,
          "maxLevel": 4,
          "temperature": 19.19,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "shuichi-05",
          "text": "蓄水池-05",
          "level": 2.81,
          "maxLevel": 4,
          "temperature": 19.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "shuichi-06",
          "text": "蓄水池-06",
          "level": 1.88,
          "maxLevel": 4,
          "temperature": 18.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "shuichi-07",
          "text": "蓄水池-07",
          "level": 1.91,
          "maxLevel": 4,
          "temperature": 17.56,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "shuichi-08",
          "text": "蓄水池-08",
          "level": 1.98,
          "maxLevel": 4,
          "temperature": 16.94,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "shuichi-09",
          "text": "蓄水池-09",
          "level": 2.16,
          "maxLevel": 4,
          "temperature": 16.82,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "shuichi-10",
          "text": "蓄水池-10",
          "level": 2.45,
          "maxLevel": 4,
          "temperature": 17.26,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "shuichi-11",
          "text": "蓄水池-11",
          "level": 1.81,
          "maxLevel": 4,
          "temperature": 18.04,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "shuichi-12",
          "text": "蓄水池-12",
          "level": 2.17,
          "maxLevel": 4,
          "temperature": 18.8,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "shuichi-13",
          "text": "蓄水池-13",
          "level": 2.45,
          "maxLevel": 4,
          "temperature": 19.19,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "shuichi-14",
          "text": "蓄水池-14",
          "level": 2.61,
          "maxLevel": 4,
          "temperature": 19.01,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        }
      ]
    },
    {
      "source": "coolingTower",
      "data": [
        {
          "name": "paifengshan-01",
          "text": "冷却塔-01",
          "temperature": 40.74,
          "power": 14.37,
          "rpm": 881,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "paifengshan-02",
          "text": "冷却塔-02",
          "temperature": 42.03,
          "power": 15.02,
          "rpm": 901,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "paifengshan-03",
          "text": "冷却塔-03",
          "temperature": 43.31,
          "power": 15.66,
          "rpm": 920,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "paifengshan-04",
          "text": "冷却塔-04",
          "temperature": 43.98,
          "power": 15.99,
          "rpm": 930,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "paifengshan-05",
          "text": "冷却塔-05",
          "temperature": 43.71,
          "power": 15.85,
          "rpm": 926,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "paifengshan-06",
          "text": "冷却塔-06",
          "temperature": 42.64,
          "power": 15.32,
          "rpm": 910,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "paifengshan-07",
          "text": "冷却塔-07",
          "temperature": 41.27,
          "power": 14.63,
          "rpm": 889,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "paifengshan-08",
          "text": "冷却塔-08",
          "temperature": 40.24,
          "power": 14.12,
          "rpm": 874,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        }
      ]
    },
    {
      "source": "coolingTube",
      "data": [
        {
          "name": "guanzi-1",
          "text": "冷却管-1",
          "temperature": 35.05,
          "pressure": 0.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "guanzi-2",
          "text": "冷却管-2",
          "temperature": 36.03,
          "pressure": 0.35,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "guanzi-3",
          "text": "冷却管-3",
          "temperature": 36.99,
          "pressure": 0.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "guanzi-4",
          "text": "冷却管-4",
          "temperature": 37.48,
          "pressure": 0.39,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        }
      ]
    },
    {
      "source": "streetlight",
      "data": [
        {
          "name": "ld18",
          "text": "路灯-18",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "ld062",
          "text": "路灯-062",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "ld063",
          "text": "路灯-063",
          "power": 0.09,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "ld064",
          "text": "路灯-064",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "ld065",
          "text": "路灯-065",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "ld066",
          "text": "路灯-066",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "ld067",
          "text": "路灯-067",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "ld068",
          "text": "路灯-068",
          "power": 0.07,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "ld069",
          "text": "路灯-069",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "ld070",
          "text": "路灯-070",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "ld071",
          "text": "路灯-071",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "ld072",
          "text": "路灯-072",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "ld073",
          "text": "路灯-073",
          "power": 0.09,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "ld074",
          "text": "路灯-074",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        }
      ]
    },
    {
      "source": "pressureRegulatingTower",
      "data": [
        {
          "name": "yancun-01",
          "text": "调压塔-01",
          "pressure": 0.52,
          "maxPressure": 1.2,
          "level": 3.07,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "yancun-02",
          "text": "调压塔-02",
          "pressure": 0.55,
          "maxPressure": 1.2,
          "level": 3.2,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        }
      ]
    },
    {
      "source": "mixingTank",
      "data": [
        {
          "name": "01-01",
          "text": "搅拌池-01",
          "level": 1.67,
          "maxLevel": 3.5,
          "power": 7.18,
          "temperature": 21.37,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "01-02",
          "text": "搅拌池-02",
          "level": 1.8,
          "maxLevel": 3.5,
          "power": 7.51,
          "temperature": 22.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "01-03",
          "text": "搅拌池-03",
          "level": 1.93,
          "maxLevel": 3.5,
          "power": 7.83,
          "temperature": 22.66,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "01-04",
          "text": "搅拌池-04",
          "level": 2,
          "maxLevel": 3.5,
          "power": 7.99,
          "temperature": 22.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        }
      ]
    },
    {
      "source": "house",
      "data": [
        {
          "name": "fangzi-01",
          "text": "厂房-01",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "fangzi-02",
          "text": "厂房-02",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "fangzi-03",
          "text": "厂房-03",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "fangzi-04",
          "text": "厂房-04",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "fangzi-05",
          "text": "厂房-05",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "fangzi-06",
          "text": "厂房-06",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "fangzi-07",
          "text": "厂房-07",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "fangzi-08",
          "text": "厂房-08",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "fangzi-09",
          "text": "厂房-09",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "fangzi-10",
          "text": "厂房-10",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        }
      ]
    },
    {
      "source": "verticalPressurizedTankBody",
      "data": [
        {
          "name": "daguanzi-01",
          "text": "承压罐-01",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.37,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-02",
          "text": "承压罐-02",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-03",
          "text": "承压罐-03",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.66,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-04",
          "text": "承压罐-04",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-05",
          "text": "承压罐-05",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-06",
          "text": "承压罐-06",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-07",
          "text": "承压罐-07",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.63,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-08",
          "text": "承压罐-08",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.12,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-09",
          "text": "承压罐-09",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-10",
          "text": "承压罐-10",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-11",
          "text": "承压罐-11",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-12",
          "text": "承压罐-12",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.67,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-13",
          "text": "承压罐-13",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-14",
          "text": "承压罐-14",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-15",
          "text": "承压罐-15",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.3,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-16",
          "text": "承压罐-16",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.62,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-17",
          "text": "承压罐-17",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.11,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-18",
          "text": "承压罐-18",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-19",
          "text": "承压罐-19",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.4,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-20",
          "text": "承压罐-20",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.05,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-21",
          "text": "承压罐-21",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.68,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        },
        {
          "name": "daguanzi-22",
          "text": "承压罐-22",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:40.000Z"
        }
      ]
    }
  ],
  [
    {
      "source": "reservoir",
      "data": [
        {
          "name": "shuichi-01",
          "text": "蓄水池-01",
          "level": 1.8,
          "maxLevel": 4,
          "temperature": 18.02,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "shuichi-02",
          "text": "蓄水池-02",
          "level": 2.16,
          "maxLevel": 4,
          "temperature": 18.79,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "shuichi-03",
          "text": "蓄水池-03",
          "level": 2.45,
          "maxLevel": 4,
          "temperature": 19.19,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "shuichi-04",
          "text": "蓄水池-04",
          "level": 2.61,
          "maxLevel": 4,
          "temperature": 19.03,
          "status": "warning",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "shuichi-05",
          "text": "蓄水池-05",
          "level": 2.68,
          "maxLevel": 4,
          "temperature": 18.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "shuichi-06",
          "text": "蓄水池-06",
          "level": 1.71,
          "maxLevel": 4,
          "temperature": 17.56,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "shuichi-07",
          "text": "蓄水池-07",
          "level": 1.78,
          "maxLevel": 4,
          "temperature": 16.94,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "shuichi-08",
          "text": "蓄水池-08",
          "level": 1.96,
          "maxLevel": 4,
          "temperature": 16.82,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "shuichi-09",
          "text": "蓄水池-09",
          "level": 2.25,
          "maxLevel": 4,
          "temperature": 17.26,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "shuichi-10",
          "text": "蓄水池-10",
          "level": 2.61,
          "maxLevel": 4,
          "temperature": 18.04,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "shuichi-11",
          "text": "蓄水池-11",
          "level": 1.97,
          "maxLevel": 4,
          "temperature": 18.8,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "shuichi-12",
          "text": "蓄水池-12",
          "level": 2.25,
          "maxLevel": 4,
          "temperature": 19.19,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "shuichi-13",
          "text": "蓄水池-13",
          "level": 2.41,
          "maxLevel": 4,
          "temperature": 19.01,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "shuichi-14",
          "text": "蓄水池-14",
          "level": 2.48,
          "maxLevel": 4,
          "temperature": 18.36,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        }
      ]
    },
    {
      "source": "coolingTower",
      "data": [
        {
          "name": "paifengshan-01",
          "text": "冷却塔-01",
          "temperature": 42.03,
          "power": 15.02,
          "rpm": 901,
          "status": "danger",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "paifengshan-02",
          "text": "冷却塔-02",
          "temperature": 43.31,
          "power": 15.66,
          "rpm": 920,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "paifengshan-03",
          "text": "冷却塔-03",
          "temperature": 43.98,
          "power": 15.99,
          "rpm": 930,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "paifengshan-04",
          "text": "冷却塔-04",
          "temperature": 43.71,
          "power": 15.85,
          "rpm": 926,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "paifengshan-05",
          "text": "冷却塔-05",
          "temperature": 42.64,
          "power": 15.32,
          "rpm": 910,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "paifengshan-06",
          "text": "冷却塔-06",
          "temperature": 41.27,
          "power": 14.63,
          "rpm": 889,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "paifengshan-07",
          "text": "冷却塔-07",
          "temperature": 40.24,
          "power": 14.12,
          "rpm": 874,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "paifengshan-08",
          "text": "冷却塔-08",
          "temperature": 40.04,
          "power": 14.02,
          "rpm": 871,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        }
      ]
    },
    {
      "source": "coolingTube",
      "data": [
        {
          "name": "guanzi-1",
          "text": "冷却管-1",
          "temperature": 36.03,
          "pressure": 0.35,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "guanzi-2",
          "text": "冷却管-2",
          "temperature": 36.99,
          "pressure": 0.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "guanzi-3",
          "text": "冷却管-3",
          "temperature": 37.48,
          "pressure": 0.39,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "guanzi-4",
          "text": "冷却管-4",
          "temperature": 37.28,
          "pressure": 0.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        }
      ]
    },
    {
      "source": "streetlight",
      "data": [
        {
          "name": "ld18",
          "text": "路灯-18",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "ld062",
          "text": "路灯-062",
          "power": 0.09,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "ld063",
          "text": "路灯-063",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "ld064",
          "text": "路灯-064",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "ld065",
          "text": "路灯-065",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "ld066",
          "text": "路灯-066",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "ld067",
          "text": "路灯-067",
          "power": 0.07,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "ld068",
          "text": "路灯-068",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "ld069",
          "text": "路灯-069",
          "power": 0.07,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "ld070",
          "text": "路灯-070",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "ld071",
          "text": "路灯-071",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "ld072",
          "text": "路灯-072",
          "power": 0.09,
          "on": false,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "ld073",
          "text": "路灯-073",
          "power": 0.09,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "ld074",
          "text": "路灯-074",
          "power": 0.08,
          "on": true,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        }
      ]
    },
    {
      "source": "pressureRegulatingTower",
      "data": [
        {
          "name": "yancun-01",
          "text": "调压塔-01",
          "pressure": 0.55,
          "maxPressure": 1.2,
          "level": 3.2,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "yancun-02",
          "text": "调压塔-02",
          "pressure": 0.58,
          "maxPressure": 1.2,
          "level": 3.33,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        }
      ]
    },
    {
      "source": "mixingTank",
      "data": [
        {
          "name": "01-01",
          "text": "搅拌池-01",
          "level": 1.8,
          "maxLevel": 3.5,
          "power": 7.51,
          "temperature": 22.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "01-02",
          "text": "搅拌池-02",
          "level": 1.93,
          "maxLevel": 3.5,
          "power": 7.83,
          "temperature": 22.66,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "01-03",
          "text": "搅拌池-03",
          "level": 2,
          "maxLevel": 3.5,
          "power": 7.99,
          "temperature": 22.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "01-04",
          "text": "搅拌池-04",
          "level": 1.97,
          "maxLevel": 3.5,
          "power": 7.93,
          "temperature": 22.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        }
      ]
    },
    {
      "source": "house",
      "data": [
        {
          "name": "fangzi-01",
          "text": "厂房-01",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "fangzi-02",
          "text": "厂房-02",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "fangzi-03",
          "text": "厂房-03",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "fangzi-04",
          "text": "厂房-04",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "fangzi-05",
          "text": "厂房-05",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "fangzi-06",
          "text": "厂房-06",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "fangzi-07",
          "text": "厂房-07",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "fangzi-08",
          "text": "厂房-08",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "fangzi-09",
          "text": "厂房-09",
          "status": "normal",
          "remark": "配电/控制室",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "fangzi-10",
          "text": "厂房-10",
          "status": "normal",
          "remark": "设备间",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        }
      ]
    },
    {
      "source": "verticalPressurizedTankBody",
      "data": [
        {
          "name": "daguanzi-01",
          "text": "承压罐-01",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-02",
          "text": "承压罐-02",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.66,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-03",
          "text": "承压罐-03",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-04",
          "text": "承压罐-04",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-05",
          "text": "承压罐-05",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.32,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-06",
          "text": "承压罐-06",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.63,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-07",
          "text": "承压罐-07",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.12,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-08",
          "text": "承压罐-08",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-09",
          "text": "承压罐-09",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.38,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-10",
          "text": "承压罐-10",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.03,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-11",
          "text": "承压罐-11",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.67,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-12",
          "text": "承压罐-12",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-13",
          "text": "承压罐-13",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.85,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-14",
          "text": "承压罐-14",
          "pressure": 0.62,
          "maxPressure": 1.6,
          "temperature": 25.3,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-15",
          "text": "承压罐-15",
          "pressure": 0.58,
          "maxPressure": 1.6,
          "temperature": 24.62,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-16",
          "text": "承压罐-16",
          "pressure": 0.55,
          "maxPressure": 1.6,
          "temperature": 24.11,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-17",
          "text": "承压罐-17",
          "pressure": 0.54,
          "maxPressure": 1.6,
          "temperature": 24.02,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-18",
          "text": "承压罐-18",
          "pressure": 0.56,
          "maxPressure": 1.6,
          "temperature": 24.4,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-19",
          "text": "承压罐-19",
          "pressure": 0.6,
          "maxPressure": 1.6,
          "temperature": 25.05,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-20",
          "text": "承压罐-20",
          "pressure": 0.64,
          "maxPressure": 1.6,
          "temperature": 25.68,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-21",
          "text": "承压罐-21",
          "pressure": 0.66,
          "maxPressure": 1.6,
          "temperature": 25.99,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        },
        {
          "name": "daguanzi-22",
          "text": "承压罐-22",
          "pressure": 0.65,
          "maxPressure": 1.6,
          "temperature": 25.84,
          "status": "normal",
          "updatedAt": "2026-01-01T00:00:45.000Z"
        }
      ]
    }
  ]
]

export function rowsToMap<T extends { name: string }>(rows: T[]): Map<string, T> {
  const arr=rows.map((row) => [row.name, row])
  return new Map(arr)
}
