import type { TilesetMeta } from '@/views/aviation-situation/types/tileset-meta'

declare module 'cesium' {
  interface Cesium3DTileset {
    /** 应用层自定义元数据（Cesium 自带 properties 为 readonly） */
    meta?: TilesetMeta
  }
}

export {}
