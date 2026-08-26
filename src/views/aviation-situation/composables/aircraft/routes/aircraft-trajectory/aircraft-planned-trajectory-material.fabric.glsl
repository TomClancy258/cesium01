// Cesium Fabric：计划航路 polyline 彗星流动
// uniforms 由 AircraftPlannedTrajectoryMaterialProperty.getValue 注入
// st.s：沿路径 0→1（起点→终点）；st.t：线宽方向
//
// time ∈ [0,1) 走完 durationMs：每个亮头沿整条线跑完一圈（与 headCount 无关）
// headCount：同一时刻线上有几个彗星
//
// 每个周期 u∈[0,1)：
//   [headStart, 1)     → headAlpha
//   [tailStart, headStart) → otherAlpha → headAlpha（尾）
//   [0, tailStart)     → otherAlpha

uniform sampler2D image;
uniform vec4 color;
uniform float time;
uniform float headCount;
uniform float headLength; //0.2
uniform float tailLength; //0.3
uniform float headAlpha; //1.0
uniform float otherAlpha; //0.35

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);
  vec2 st = materialInput.st;

  // (st.s - time)*headCount：time 0→1 时图案沿整条线平移 1.0（跑完全程）
  // 若写成 st.s*headCount - time，则 time 0→1 只平移 1/headCount
  float u = fract((st.s - time) * headCount);

  float headStart = 1.0 - headLength;            // 0.8
  float tailStart = headStart - tailLength;      // 0.5

  // 默认底线
  float alpha = otherAlpha;

  //头[0.8,1.0) alpha=1.0
//  alpha=mix(alpha,headAlpha,step(headStart,u));
  //尾[0.5,0.8] alpha=[0.35,1.0]
  alpha=mix(otherAlpha,headAlpha,smoothstep(tailStart,headStart,u));

  // 头：u≥headStart → headAlpha（平台亮）
  //  alpha = mix(alpha, headAlpha, step(headStart, u));
  // 尾：u∈[tailStart, headStart] → otherAlpha→headAlpha
//  alpha = mix(otherAlpha, headAlpha, smoothstep(tailStart, headStart, u));


  material.diffuse = color.rgb;
  material.alpha = alpha;
  return material;
}
