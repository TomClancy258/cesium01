import { reactive, onUnmounted } from 'vue'
import * as Cesium from 'cesium'

export function useBuildings(viewer) {
  const initBuildings =  () => {
    addHainan()
    addMacao()
    addJMD()
    addNewYorkCity()
  }
  const addHainan = async () => {
    // 方法1：使用 Cesium3DTileset（推荐）
    const tileset = await Cesium.Cesium3DTileset.fromUrl(
      'model/3dtileset/Hainan/tileset.json'
      // 'model/3dtileset/American/Seattle/tileset.json'
    );
    viewer.value.scene.primitives.add(tileset);

    viewer.value.zoomTo(tileset);

    tileset.style = new Cesium.Cesium3DTileStyle({
      // color : {
      //   conditions : [
      //     ['${Height} >= 100', 'color("purple", 0.5)'],
      //     ['${Height} >= 50', 'color("red")'],
      //     ['true', 'color("blue")']
      //   ]
      // },
      // show : '${Height} > 0',
      meta : {
        // description : '"Building id ${id} has height ${Height}."'
        type:'building'
      }
    });

  }
  const addMacao = async () => {
    const tileset = await Cesium.Cesium3DTileset.fromUrl(
      'model/3dtileset/Macao/tileset.json'
    );
    viewer.value.scene.primitives.add(tileset);

    viewer.value.zoomTo(tileset);
  }
  const addJMD = async () => {
    const tileset = await Cesium.Cesium3DTileset.fromUrl(
      'model/3dtileset/ModelMW/tileset.json'
    );
    viewer.value.scene.primitives.add(tileset);

    viewer.value.zoomTo(tileset);
  }

  const addNewYorkCity = async () => {
    const tileset = viewer.value.scene.primitives.add(
      await Cesium.Cesium3DTileset.fromIonAssetId(75343)
    );
    // viewer.value.scene.primitives.add(
    //   await Cesium.Cesium3DTileset.fromIonAssetId(96188)
    // );
    // viewer.value.scene.primitives.add(tileset);

    viewer.value.zoomTo(tileset);
  }



  return{
    initBuildings
  }
}
