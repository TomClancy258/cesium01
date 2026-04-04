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
