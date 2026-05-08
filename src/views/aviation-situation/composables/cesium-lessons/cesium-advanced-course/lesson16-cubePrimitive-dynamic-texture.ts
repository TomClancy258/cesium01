import { ShallowRef } from 'vue'
import * as Cesium from 'cesium'
import airplane01Jpg from '@/assets/img/airplane/jpg/airplane01.jpg'

/** 折回 [0,1)，等价于 GLSL 的 fract；用于滚动偏移，避免 sOffset 过大时与 v_st 相加丢 float32 精度 */
function fract01(x: number): number {
  return x - Math.floor(x)
}

export function drawCubePrimitiveDynamicTexture(viewer: ShallowRef<Cesium.Viewer>) {
  //fromDimensions() → 创建 400000 x 400000 x 400000 的立方体
  const boxGeometry02 = Cesium.BoxGeometry.fromDimensions({
    // vertexFormat : Cesium.PerInstanceColorAppearance.VERTEX_FORMAT, //多色几何体
    // vertexFormat : Cesium.VertexFormat.POSITION_AND_NORMAL, //单色带光照
    vertexFormat: Cesium.VertexFormat.ALL, //单色带光照
    dimensions: new Cesium.Cartesian3(400000.0, 400000.0, 400000.0),
  })

  const boxGeometryInstance02 = new Cesium.GeometryInstance({
    geometry: boxGeometry02,
    id: 'boxGeometry02',
    // 世界坐标放在 Primitive.modelMatrix 上，否则创建 Primitive 后再改 instance.modelMatrix 通常不会生效
    modelMatrix: Cesium.Matrix4.IDENTITY,
    attributes: {
      color: new Cesium.ColorGeometryInstanceAttribute(0.0, 0.0, 1.0, 0.5),
    },
  })

  const appearance=new Cesium.MaterialAppearance({
    material: new Cesium.Material({
      fabric: {
        type: 'Image',
        uniforms: {
          image: airplane01Jpg,
          repeat:new Cesium.Cartesian2(1,1)
        },
      },
    }),
    faceForward: true,
    vertexShaderSource: `
      in vec3 position3DHigh;
      in vec3 position3DLow;
      in vec3 normal;
      in vec3 tangent;
      in vec3 bitangent;
      in vec2 st;
      in float batchId;

      out vec3 v_positionEC;
      out vec3 v_normalEC;
      out vec3 v_tangentEC;
      out vec3 v_bitangentEC;
      out vec2 v_st;
      uniform float zdelta;

      void main()
      {
          vec4 p = czm_computePosition();   // ← 假设是 CesiumJS 的内置函数（将高/低位位置组合为世界坐标）
          // p.z += zdelta;                    // 垂直偏移（如地形抬升）

          v_positionEC = (czm_modelViewRelativeToEye * p).xyz;   // 转换到眼坐标系（eye coordinates）
          v_normalEC   = czm_normal * normal;                     // 法向量变换到眼坐标
          v_tangentEC  = czm_normal * tangent;                    // 切线变换到眼坐标
          v_bitangentEC= czm_normal * bitangent;                  // 副切线变换到眼坐标
          v_st         = st;                                       // 纹理坐标直接传递

          gl_Position = czm_modelViewProjectionRelativeToEye * p; // 最终投影坐标
      }
      `,
    fragmentShaderSource:`
      in vec3 v_positionEC;
      in vec3 v_normalEC;
      in vec3 v_tangentEC;
      in vec3 v_bitangentEC;
      in vec2 v_st;
      uniform float sOffset;
      void main()
      {
        vec3 positionToEyeEC = -v_positionEC;
        mat3 tangentToEyeSpaceMatrix = czm_tangentToEyeSpaceMatrix(v_normalEC, v_tangentEC, v_bitangentEC);

        vec3 normalEC = normalize(v_normalEC);
      #ifdef FACE_FORWARD
        normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
      #endif
        czm_materialInput materialInput;
        materialInput.normalEC = normalEC;
        materialInput.tangentToEyeMatrix = tangentToEyeSpaceMatrix;
        materialInput.positionToEyeEC = positionToEyeEC;
        float x=v_st.x+sOffset;
        materialInput.st = vec2(x,v_st.y);
        czm_material material = czm_getMaterial(materialInput);

      #ifdef FLAT
        out_FragColor = vec4(material.diffuse + material.emission, material.alpha);
      #else
        out_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
      #endif
      }
      `
  })

  appearance.uniforms={
    sOffset:0.1
  }

  const boxPrimitive = new Cesium.Primitive({
    geometryInstances: [boxGeometryInstance02],
    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(-95.59777, 40.03883, 500000),
    ),
    appearance: appearance,
  })
  viewer.value.scene.primitives.add(boxPrimitive)

  const sDelta = 0.1
  let sOffset=0
  setInterval(() => {
    // appearance.uniforms.sOffset = fract01(appearance.uniforms.sOffset + sDelta) //[0,1)：
    appearance.uniforms.sOffset =sOffset
    sOffset+=sDelta
    if (sOffset > 1) {
      sOffset=0
    }
  }, 1000)
}
