import { ShallowRef } from 'vue'
import * as Cesium from "cesium"
import airplane01Jpg from "@/assets/img/airplane/jpg/airplane01.jpg"

export function addTexture2Cube(viewer:ShallowRef<Cesium.Viewer>){
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


  const boxPrimitive=new Cesium.Primitive({
    geometryInstances : [boxGeometryInstance02],
    appearance : new Cesium.MaterialAppearance({
      material : new Cesium.Material({
        fabric: {
          type: 'Image',
          uniforms: {
            image: airplane01Jpg,
            repeat: new Cesium.Cartesian2(3,2),
          }
        }
      }),
      faceForward : true
    })
    //着色器程序
  })
  // viewer.value.scene.primitives.add(boxPrimitive);

  //primitive 自定义顶点数据 绘制长方体
  const positions = new Float64Array([
    //底部的面
    0.0, 0.0, 0.0,//0
    75000.0, 0.0, 0.0,//1
    0.0, 75000.0, 0.0,//2
    75000.0, 75000.0, 0.0,//3

    //顶部的面
    0.0, 0.0, 75000.0,//4
    75000.0, 0.0, 75000.0,//5
    0.0, 75000.0, 75000.0,//6
    75000.0, 75000.0, 75000.0,//7

    //前面的面
    0.0, 75000.0, 0.0,//2=8
    75000.0, 75000.0, 0.0,//3=9
    75000.0, 75000.0, 75000.0,//7=10
    0.0, 75000.0, 75000.0,//6=11

    //后面的面
    0.0, 0.0, 0.0,//0=12
    75000.0, 0.0, 0.0,//1=13
    75000.0, 0.0, 75000.0,//5=14
    0.0, 0.0, 75000.0,//4=15

    //左边的面
    0.0, 75000.0, 0.0,//2=16
    0.0, 0.0, 0.0,//0=17
    0.0, 0.0, 75000.0,//4=18
    0.0, 75000.0, 75000.0,//6=19

    //右边的面
    75000.0, 0.0, 0.0,//1=20
    75000.0, 75000.0, 0.0,//3=21
    75000.0, 75000.0, 75000.0,//7=22
    75000.0, 0.0, 75000.0,//5=23

  ]);

  const texCoords = new Float32Array([
    //底部的面
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    1.0, 1.0,

    //顶部的面
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    1.0, 1.0,

    //前面的面
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,

    //后面的面
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,

    //左边的面
    1.0, 0.0,
    0.0, 0.0,
    0.0, 1.0,
    1.0, 1.0,

    //右边的面
    1.0, 0.0,
    0.0, 0.0,
    0.0, 1.0,
    1.0, 1.0,
  ])

  const customGeometry01 = new Cesium.Geometry({
    attributes : {
      position : new Cesium.GeometryAttribute({
        componentDatatype : Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute : 3, //每个顶点属性有多少个分量（数值），这里每个顶点有 3 个分量
        values : positions
      }),
      st : new Cesium.GeometryAttribute({
        componentDatatype : Cesium.ComponentDatatype.FLOAT,
        componentsPerAttribute : 2, //每个顶点属性有多少个分量（数值），这里每个顶点有 3 个分量
        values : texCoords
      }),
    },
    indices : new Uint16Array([
      //底部的面
      0,1,2,
      1,2,3,

      //顶部的面
      4,5,6,
      5,6,7,

      //前面的面
      // 2,3,7,
      8,9,10,
      // 2,7,6,
      8,10,11,

      //后面的面
      // 0,1,5,
      12,13,14,
      // 0,4,5,
      12,15,14,

      //左面的面
      // 0,2,6,
      17,16,19,
      // 0,6,4,
      17,19,18,

      //右面的面
      // 1,3,7,
      20,21,22,
      // 1,7,5
      20,22,23
    ]),
    primitiveType : Cesium.PrimitiveType.TRIANGLES,
    // indices : new Uint16Array([0, 1, 1, 2, 2, 0]),
    // primitiveType : Cesium.PrimitiveType.LINES,
    boundingSphere : Cesium.BoundingSphere.fromVertices(positions)
  });

  const customGeometryInstance01 = new Cesium.GeometryInstance({
    geometry : customGeometry01,
    id : 'customGeometry01',
    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(-100.59777, 40.03883, 500000)
    ),
    // attributes : {
    //   color : new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 0.0, 0.5)
    // }
  });

  const customPrimitive=new Cesium.Primitive({
    geometryInstances : [customGeometryInstance01],
    appearance : new Cesium.MaterialAppearance({
      material : new Cesium.Material({
        fabric: {
          type: 'Image',
          uniforms: {
            image: airplane01Jpg,
            repeat: new Cesium.Cartesian2(3,2),
          }
        }
      }),
      faceForward : true
    }), //着色器程序
    asynchronous : false
  })
  // 执行绘制
  viewer.value.scene.primitives.add(customPrimitive);

  viewer.value.camera.setView({
    destination:Cesium.Cartesian3.fromDegrees(-100.59777, 40.03883,1000000)
  })
}
