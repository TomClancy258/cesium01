// Cesium Fabric：计划航路 polyline 彗星流动
// uniforms 由 AircraftPlannedTrajectoryMaterialProperty.getValue 注入
// st.s：沿路径 0→1（起点→终点）；st.t：线宽方向

uniform sampler2D image;
uniform vec4 color;
uniform float time;
uniform float headCount;
uniform float headLength;
uniform float baseAlpha;

const vec3 red=vec3(1.0,0.0,0.0);
const vec3 green=vec3(0.0,1.0,0.0);

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);
  vec2 st = materialInput.st;
  vec4 texColor = texture(image, st);

  //headCount个[0,1)的x轴
  float headCountXAxis=fract(st.s*headCount);

  material.diffuse = vec3(headCountXAxis);
//  material.diffuse = texColor.rgb;
    material.alpha = 1.0;

  // time 增大 → 图案往 +s（终点）移动；每周期末段为亮头，往起点一侧变淡（彗星尾）
//  float u = fract(st.s * headCount - time);
//  float headStart = 1.0 - headLength;
//  float head = smoothstep(headStart, 1.0, u);
//
//  material.diffuse = color.rgb;
//  // material.diffuse = texColor.rgb;
//  material.alpha = mix(baseAlpha, color.a, head);
  return material;
}
