import { reactive, onUnmounted } from 'vue'
import * as Cesium from 'cesium'

export function useBuildings(viewer) {
  const initBuildings =  () => {
    addBuildingA()
    addBuildingB()
  }
  const addBuildingA = async () => {
    // 方法1：使用 Cesium3DTileset（推荐）
    const tileset = await Cesium.Cesium3DTileset.fromUrl(
      'model/3dtileset/build/tileset.json'
    );
    viewer.value.scene.primitives.add(tileset);

// 自动飞到模型位置
//     viewer.value.zoomTo(tileset);
  }
  const addBuildingB = async () => {
    // 方法1：使用 Cesium3DTileset（推荐）
    const tileset = await Cesium.Cesium3DTileset.fromUrl(
      'model/3dtileset/ModelMW/tileset.json'
    );
    viewer.value.scene.primitives.add(tileset);

// 自动飞到模型位置
    viewer.value.zoomTo(tileset);
  }



  return{
    initBuildings
  }
}
