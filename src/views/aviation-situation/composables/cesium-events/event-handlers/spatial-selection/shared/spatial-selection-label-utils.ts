import { Segment } from '@/views/aviation-situation/types/draw-tools'
import { LngLatAlt, SegmentResult } from '@/views/aviation-situation/types/shared'

export const buildSpatialSelectionLabelText=(
  text:string,
  operationType:string,
  spatialSelectionTarget:string,
  icao24SetSize:number,
  icaoSetSize:number
):string=>{
  if(operationType==='spatialSelection'){
    if(spatialSelectionTarget==='aircraft'){
      text=`飞机：${icao24SetSize} 架\n`+text
    }else if(spatialSelectionTarget==='airport'){
      text=`机场：${icaoSetSize} 个\n`+text
    }else if(spatialSelectionTarget==='all'){
      text=`飞机：${icao24SetSize} 架\n机场：${icaoSetSize} 个\n`+text
    }
  }
  return text
}

export const buildSegments = (lngLatAltArray: number[], segments: Segment[]):SegmentResult[] => {
  return segments.map((segment:Segment, i) => {
    const si = i * 3
    const ei = (i + 1) * 3
    return {
      startLngLatAlt: {
        longitude: lngLatAltArray[si],
        latitude: lngLatAltArray[si + 1],
        height: lngLatAltArray[si + 2],
      },
      endLngLatAlt: {
        longitude: lngLatAltArray[ei],
        latitude: lngLatAltArray[ei + 1],
        height: lngLatAltArray[ei + 2],
      },
      distance:segment.distance,
      midLngLatAlt:segment.midLngLatAlt,
    }
  })
}

export const buildLngLatAltList = (lngLatAltArray: number[]):LngLatAlt[] => {
  const pointCount=lngLatAltArray.length/3
  const lngLatAltList:LngLatAlt[]=[]
  for(let i=0; i<pointCount; i++) {
    const baseIndex = i * 3
    lngLatAltList.push({
      longitude: lngLatAltArray[baseIndex],
      latitude: lngLatAltArray[baseIndex + 1],
      height: lngLatAltArray[baseIndex + 2],
    })
  }
  return lngLatAltList
}
