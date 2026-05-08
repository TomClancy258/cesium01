import { ShallowRef } from 'vue'
import * as Cesium from "cesium"
import airplane01Jpg from "@/assets/img/airplane/jpg/airplane01.jpg"

export function drawColorGradient(viewer:ShallowRef<Cesium.Viewer>){

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
    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(-95.59777, 40.03883, 500000)
    ),
    attributes : {
      color : new Cesium.ColorGeometryInstanceAttribute(0.0, 0.0, 1.0, 0.5)
    }
  });


  const shaderSource = `
    uniform vec4 u_color;

    czm_material czm_getMaterial(czm_materialInput materialInput)
    {
      // vec4 outColor = u_color;
      vec4 outColor; //默认是[0.0,0.0,0.0,0.0]
      czm_material material = czm_getDefaultMaterial(materialInput);

      //渐变 纹理坐标
      vec2 st=materialInput.st;
      outColor.r=st.s; // [0,1]
      outColor.a=1.0; // [0,1]
      // outColor.a=fract(st.s * 3.0); //只取小数部分 得到三个[0,1)

      material.diffuse = czm_gammaCorrect(outColor.rgb);
      material.alpha = outColor.a;

      return material;
    }
	`


  const boxPrimitive=new Cesium.Primitive({
    geometryInstances : [boxGeometryInstance02],
    appearance : new Cesium.MaterialAppearance({
      material : new Cesium.Material({
        fabric: {
          type: 'test',
          uniforms: {
            // image: airplane01Jpg,
            // repeat: new Cesium.Cartesian2(3,2),
            u_color:new Cesium.Color(1,0,0,1)
          },
          source:shaderSource
        },
      }),
      faceForward : true,
    })
    //着色器程序
  })
  viewer.value.scene.primitives.add(boxPrimitive);

  viewer.value.scene.camera.setView({
    destination:Cesium.Cartesian3.fromDegrees(-95.59777, 40.03883, 5000000)
  })
}
