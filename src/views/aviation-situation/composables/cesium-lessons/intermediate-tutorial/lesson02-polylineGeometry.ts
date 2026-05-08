import { ShallowRef } from 'vue'
import * as Cesium from "cesium"
import { flyToLngLatAlt } from '@/utils/geoUtils'

export function drawPolylineGeometry(viewer:ShallowRef<Cesium.Viewer>){
  // 顶点数据
  const polylineGeometry01 = new Cesium.PolylineGeometry({
    positions : Cesium.Cartesian3.fromDegreesArray([
      100, 40,
      100, 50,
      110, 40
    ]),
    width : 10.0
  });
  // 传递顶点属性给顶点着色器
  const polylineInstance01 = new Cesium.GeometryInstance({
    geometry : polylineGeometry01,
    id : 'polyline',
    attributes : {
      color : new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 0.0, 1.0)
    }
  });

  const polylineGeometry02 = new Cesium.PolylineGeometry({
    positions : Cesium.Cartesian3.fromDegreesArray([
      105, 40,
      105, 50,
      115, 40
    ]),
    width : 10.0
  });
  const polylineInstance02 = new Cesium.GeometryInstance({
    geometry : polylineGeometry02,
    id : 'polyline',
    attributes : {
      color : new Cesium.ColorGeometryInstanceAttribute(1.0, 0.0, 0.0, 1.0)
    }
  });

  const polylinePrimitive=new Cesium.Primitive({
    geometryInstances : [polylineInstance01,polylineInstance02],
    appearance : new Cesium.PolylineColorAppearance() //着色器程序
  })
  // 执行绘制
  viewer.value.scene.primitives.add(polylinePrimitive);
  const lngLatAlt={
    longitude:100,
    latitude:50,
    height:0.0
  }
  // flyToLngLatAlt(viewer, lngLatAlt, 2000,0)
  viewer.value.camera.setView({
    destination:Cesium.Cartesian3.fromDegrees(105,41,5000000)
  })
}
