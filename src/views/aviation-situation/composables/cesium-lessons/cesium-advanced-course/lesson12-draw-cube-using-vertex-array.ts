import { ShallowRef } from 'vue'
import * as Cesium from "cesium"

export function drawCubeUsingVertexArray(viewer:ShallowRef<Cesium.Viewer>){
  //primitive boxGeometry 绘制长方体
  // 顶点数据 new BoxGeometry() → 创建 【长（X轴） = 250000 - 50000 = 200000】 x 【宽（Y轴）=200000】 x 【高（Z轴）=200000】 的立方体
  const boxGeometry01 = new Cesium.BoxGeometry({
    vertexFormat : Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
    maximum : new Cesium.Cartesian3(250000.0, 250000.0, 250000.0),
    // minimum : new Cesium.Cartesian3(-250000.0, -250000.0, -250000.0)
    minimum : new Cesium.Cartesian3(50000.0, 50000.0, 50000.0)
    //中心 = (250000+50000)/2 = (150000, 150000, 150000) ← 不是原点！
  });

  // 传递顶点属性给顶点着色器
  const boxGeometryInstance01 = new Cesium.GeometryInstance({
    geometry : boxGeometry01,
    id : 'boxGeometry01',
    // modelMatrix : Cesium.Matrix4.multiplyByTranslation(Cesium.Transforms.eastNorthUpToFixedFrame(
    //   Cesium.Cartesian3.fromDegrees(-95.59777, 40.03883)), new Cesium.Cartesian3(0.0, 0.0, 500000.0), new Cesium.Matrix4()),
    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(-95.59777, 40.03883, 500000)
    ),
    attributes : {
      color : new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 0.0, 1.0)
    }
  });

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


  const boxGeometry03 = Cesium.BoxGeometry.fromDimensions({
    vertexFormat : Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
    dimensions : new Cesium.Cartesian3(300000.0, 300000.0, 300000.0)
  });
  const boxGeometryInstance03 = new Cesium.GeometryInstance({
    geometry : boxGeometry03,
    id : 'boxGeometry03',
    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(-95.59777, 40.03883, 500000)
    ),
    attributes : {
      color : new Cesium.ColorGeometryInstanceAttribute(1.0, 0.0, 0.0, 0.5)
    }
  });

  const boxPrimitive=new Cesium.Primitive({
    geometryInstances : [boxGeometryInstance01,boxGeometryInstance02,boxGeometryInstance03],
    appearance : new Cesium.PerInstanceColorAppearance() //着色器程序
  })
  viewer.value.scene.primitives.add(boxPrimitive);

  //primitive 自定义顶点数据 绘制长方体
  const positions = new Float64Array([
    0.0, 0.0, 0.0,//0
    75000.0, 0.0, 0.0,//1
    0.0, 75000.0, 0.0,//2
    75000.0, 75000.0, 0.0,//3
    0.0, 0.0, 75000.0,//4
    75000.0, 0.0, 75000.0,//5
    0.0, 75000.0, 75000.0,//6
    75000.0, 75000.0, 75000.0,//7
  ]);

  const customGeometry01 = new Cesium.Geometry({
    attributes : {
      position : new Cesium.GeometryAttribute({
        componentDatatype : Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute : 3, //每个顶点属性有多少个分量（数值），这里每个顶点有 3 个分量
        values : positions
      })
    },
    indices : new Uint16Array([0, 1, 2, 1,2,3, 1,3,7, 1,5,7, 0,1,5, 0,4,5, 0,2,6, 0,4,6, 2,3,6, 3,6,7, 4,6,7, 4,5,7]),
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
    attributes : {
      color : new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 0.0, 0.5)
    }
  });

  const customPrimitive=new Cesium.Primitive({
    geometryInstances : [customGeometryInstance01],
    appearance : new Cesium.PerInstanceColorAppearance({ flat: true }), //着色器程序
    asynchronous : false
  })
  // 执行绘制
  // viewer.value.scene.primitives.add(customPrimitive);

  viewer.value.camera.setView({
    destination:Cesium.Cartesian3.fromDegrees(-100.59777, 40.03883,1000000)
  })
}
