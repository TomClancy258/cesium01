import { ShallowRef } from 'vue'
import * as Cesium from "cesium"
import airplane01Jpg from "@/assets/img/airplane/jpg/airplane01.jpg"

export function changeCubePrimitiveLngLatAlt(viewer:ShallowRef<Cesium.Viewer>){
  const scene = viewer.value.scene
  //fromDimensions() → 创建 400000 x 400000 x 400000 的立方体
  const boxGeometry02 = Cesium.BoxGeometry.fromDimensions({
    // vertexFormat : Cesium.PerInstanceColorAppearance.VERTEX_FORMAT, //多色几何体
    // vertexFormat : Cesium.VertexFormat.POSITION_AND_NORMAL, //单色带光照
    vertexFormat : Cesium.VertexFormat.ALL, //单色带光照
    dimensions : new Cesium.Cartesian3(400000.0, 400000.0, 400000.0)
  });

  const boxGeometryInstance02 = new Cesium.GeometryInstance({
    geometry : boxGeometry02,
    id : 'boxGeometry02',
    // 世界坐标放在 Primitive.modelMatrix 上，否则创建 Primitive 后再改 instance.modelMatrix 通常不会生效
    modelMatrix: Cesium.Matrix4.IDENTITY,
    attributes : {
      color : new Cesium.ColorGeometryInstanceAttribute(0.0, 0.0, 1.0, 0.5)
    }
  });

  const boxPrimitive=new Cesium.Primitive({
    geometryInstances : [boxGeometryInstance02],
    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(-95.59777, 40.03883, 500000)
    ),
    appearance : new Cesium.MaterialAppearance({
      material : new Cesium.Material({
        fabric: {
          type: 'Color',
          uniforms: {
            color:Cesium.Color.GREEN
          }
        }
      }),
      faceForward : true
    })
    //着色器程序
  })
  viewer.value.scene.primitives.add(boxPrimitive);

  let longitude = -95.59777
  const latitude = 40.03883
  let height = 500000

  setInterval(() => {
    longitude += 0.02
    // height += 5000
    boxPrimitive.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
    )
    const matAppearance = boxPrimitive.appearance as Cesium.MaterialAppearance
    matAppearance.material.uniforms.color = Cesium.Color.fromRandom({ alpha: 1.0 })
  }, 1000)
}
