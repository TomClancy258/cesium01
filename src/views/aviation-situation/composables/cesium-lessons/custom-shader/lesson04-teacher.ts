import { ShallowRef } from 'vue'
import * as Cesium from "cesium"
import airplane01Jpg from "@/assets/img/airplane/jpg/airplane01.jpg"

export function drawGraphicsInTexture(viewer:ShallowRef<Cesium.Viewer>){

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
    // attributes : {
    //   color : new Cesium.ColorGeometryInstanceAttribute(0.0, 0.0, 1.0, 0.5)
    // }
  });


  const shaderSourceCircle = `
    uniform vec4 u_color;

    czm_material czm_getMaterial(czm_materialInput materialInput)
    {
      vec4 outColor = u_color;
      czm_material material = czm_getDefaultMaterial(materialInput);

      //渐变 纹理坐标
      vec2 st=materialInput.st;
      vec2 origin=vec2(0.5,0.5);
      float dis=distance(st,origin);
      if(dis<=0.5){
        outColor.rgb=vec3(0.0,1.0,0.0);
      }

      material.diffuse = czm_gammaCorrect(outColor.rgb);
      material.alpha = outColor.a;

      return material;
    }
	`
  const shaderSourceLine = `
    uniform vec4 u_color;
    uniform float lineWidth;

    czm_material czm_getMaterial(czm_materialInput materialInput)
    {
      vec4 outColor = u_color;
      czm_material material = czm_getDefaultMaterial(materialInput);

      //渐变 纹理坐标
      vec2 st=materialInput.st;
      float lineHalfWidth=lineWidth/2.0;
      if(st.s<=0.5+lineHalfWidth && st.s>=0.5-lineHalfWidth){
        outColor.rgb=vec3(0.0,1.0,0.0);
      }
      if(st.t<=0.5+lineHalfWidth && st.t>=0.5-lineHalfWidth){
        outColor.rgb=vec3(0.0,1.0,0.0);
      }

      material.diffuse = czm_gammaCorrect(outColor.rgb);
      material.alpha = outColor.a;

      return material;
    }
	`

  const shaderSourceDynamicLine = `
    uniform vec4 u_color;
    uniform float lineWidth;

    czm_material czm_getMaterial(czm_materialInput materialInput)
    {
      vec4 outColor = u_color;
      czm_material material = czm_getDefaultMaterial(materialInput);

      //渐变 纹理坐标
      vec2 st=materialInput.st;

      float linePosition=fract(czm_frameNumber/60.0);
      float lineHalfWidth=lineWidth/2.0;

      if(st.s<=linePosition+lineHalfWidth && st.s>=linePosition-lineHalfWidth){
        outColor.rgb=vec3(0.0,1.0,0.0);
      }
      // if(st.t<=linePosition+lineHalfWidth && st.t>=linePosition-lineHalfWidth){
      //   outColor.rgb=vec3(0.0,1.0,0.0);
      // }

                                       //st.s=[0,               1)
      // float x=fract(st.s*3.0); //只取小数部分 得到[0,1)->[0,1)->[0,1) 三个一样的局部坐标
      // if(x<=linePosition+(lineHalfWidth*3.0) && x>=linePosition-(lineHalfWidth*3.0)){
      //   outColor.rgb=vec3(0.0,1.0,0.0);
      // }

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
            u_color:new Cesium.Color(1,0,0,1),
            lineWidth:0.1
          },
          source:shaderSourceDynamicLine
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
