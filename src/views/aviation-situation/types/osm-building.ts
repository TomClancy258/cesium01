import { LngLatAlt } from '@/views/aviation-situation/types/shared'
import * as Cesium from 'cesium'
interface OSMBuildingType{
  shop:string|undefined, //类型
  building:string|undefined,  //类型，没有shop才采用这个
}
//地址
//addr:housenumber + addr:street + addr:city + addr:state
interface OSMBuildingAddr{
  housenumber:string|undefined,
  street:string|undefined,
  city:string|undefined,
  state:string|undefined,
}
interface OSMBuildingBaseProperties{
  name:string|undefined,
  type:OSMBuildingType,
  addr:OSMBuildingAddr
  estimatedHeight:number|undefined,
  lngLatAlt:LngLatAlt
}

export type OSMBuildingHoveredProperties=OSMBuildingBaseProperties

interface OSMBuildingBusiness {
  openingHours: string;
  phone: string;
  website: string;
}

interface OSMBuildingExtension {
  atm: string;
  wheelchair: string;
  internetAccess: string;
  checkDate: string;
}

export interface OSMBuildingSelectedProperties extends OSMBuildingBaseProperties {
  sourceType: 'osmBuilding'
  elementType: string
  elementId: number
  business: OSMBuildingBusiness
  extension: OSMBuildingExtension
}

export interface OSMBuildingHighlightConfig {
  color: Cesium.Color
}
