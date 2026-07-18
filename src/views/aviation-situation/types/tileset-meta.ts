/** Cesium3DTileset 上挂的应用层元数据（properties 为 readonly，故用 meta） */
export interface OSMBuildingTilesetMeta {
  sourceType: 'osmBuilding'
}

export interface PhotogrammetryTilesetMeta {
  sourceType: 'photogrammetry'
  name: string
}

export type TilesetMeta = OSMBuildingTilesetMeta | PhotogrammetryTilesetMeta
