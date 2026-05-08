import { ShallowRef } from 'vue'
import * as Cesium from "cesium"
import airplane01Jpg from "@/assets/img/airplane/jpg/airplane01.jpg"
import {
  Cartesian3,
  Color,
  Primitive,
  PolygonGeometry,
  BoxGeometry,
  PolygonHierarchy,
  PolylineGeometry,
  EllipsoidGeometry,
  GeometryInstance,
  Material,
  MaterialAppearance,
  PolylineMaterialAppearance,
  Transforms,
} from 'cesium'

export function drawGraphicsInTextureByTeacher(viewer:ShallowRef<Cesium.Viewer>){
  const shaderSource = `
	uniform vec4 color;
uniform float lineWidth;

czm_material czm_getMaterial(czm_materialInput materialInput) {
\tvec4 outColor = color;
\tczm_material material = czm_getDefaultMaterial(materialInput);

\tvec2 st = materialInput.st;
\tvec2 origin = vec2(0.5, 0.5);
\tfloat radius = 0.5;
\tfloat dis = distance(origin, st);
\tif(dis > radius - lineWidth / 2.0 && dis < radius + lineWidth / 2.0) {
\t\toutColor.rgb = vec3(0.0, 1.0, 0.0);
\t}

\tmaterial.diffuse = czm_gammaCorrect(outColor.rgb);
\tmaterial.alpha = outColor.a;
\treturn material;
}
`
  const shaderSource02 = `
  uniform vec4 color;
uniform float percent;

czm_material czm_getMaterial(czm_materialInput materialInput) {
\tvec4 outColor = color;
\tczm_material material = czm_getDefaultMaterial(materialInput);

\tvec2 st = materialInput.st;
\tfloat time = fract(czm_frameNumber / 144.0);
\tfloat startPosition = time;
\toutColor.a = 0.0;
\tif(st.s > startPosition - percent && st.s < startPosition) {
\t\t// 使用smoothstep替换原本的线性映射
\t\tfloat value = smoothstep(startPosition - percent, startPosition, st.s);
\t\toutColor.a = value;
\t}

\tmaterial.diffuse = czm_gammaCorrect(outColor.rgb);
\tmaterial.alpha = outColor.a;
\treturn material;
}
`

  const myMaterial = new Material({
    translucent: false,
    fabric: {
      type: 'test',
      uniforms: {
        color: new Color(1, 0, 0, 1),
        percent:0.2
      },
      source: shaderSource02
    }
  })


  const appearance = new MaterialAppearance({
    material: myMaterial,
  })

  const polylineAppearance = new PolylineMaterialAppearance({
    material: myMaterial
  })

  const polygonPrimitive = new Primitive({
    geometryInstances: new GeometryInstance({
      geometry: new PolygonGeometry({
        polygonHierarchy: new PolygonHierarchy(Cartesian3.fromDegreesArray([
          114, 25,
          114.01, 25,
          114.01, 25.01,
          114, 25.01,
        ])),
        height: 1000
      })
    }),
    appearance
  })

  const boxPrimitive = new Primitive({
    geometryInstances: new GeometryInstance({
      geometry: BoxGeometry.fromDimensions({
        dimensions: new Cartesian3(1000, 1000, 1000)
      }),
      modelMatrix: Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(114.005, 25.02, 1000))
    }),
    appearance
  })

  const polylinePrimitive = new Primitive({
    geometryInstances: new GeometryInstance({
      geometry: new PolylineGeometry({
        positions: Cartesian3.fromDegreesArrayHeights([
          114.02, 25.02, 1000,
          114.05, 25.02, 1000
        ]),
        width: 2,
      })
    }),
    appearance: polylineAppearance
  })

  const ellipsoidPrimitive = new Primitive({
    geometryInstances: new GeometryInstance({
      geometry: new EllipsoidGeometry({
        radii: new Cartesian3(1000, 1000, 1000),
      }),
      modelMatrix: Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(114.03, 25.005, 1000))
    }),
    appearance
  })

  viewer.value.scene.primitives.add(polygonPrimitive)
  viewer.value.scene.primitives.add(boxPrimitive)
  viewer.value.scene.primitives.add(polylinePrimitive)
  viewer.value.scene.primitives.add(ellipsoidPrimitive)

  viewer.value.camera.flyTo({
    destination: Cartesian3.fromDegrees(114.02, 25.01, 10000),
    duration: 0
  })
}
