// Cesium Fabric 材质片段（非完整 fragment shader，无 void main）
// uniforms 由 SatelliteRadarMaterialProperty.getValue 每帧注入

uniform sampler2D image;
uniform vec4 color;
uniform float time;
uniform float repeat;
uniform float offset;
uniform float thickness;

const float PI = 3.14159265359;

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);

  vec2 st = materialInput.st;
  vec4 texColor = texture(image, st);

  //  // 到 ST 中心距离 → 同心环带
  //distance(p0, p1) = length(p0 - p1)。即获得向量(p1->p0)的长度
  //从中心（即锥尖）往下由0到1
    float radial = distance(st, vec2(0.5));

  float timeMapTo2PI=remap(time,0.0,1.0, 0.0,2.0*PI);
  float xAxisFromSin=remap(radial, 0.0,1.0, 0.0, 2.0*PI);
  //*20=20个2PI
  float sinVal=sin(xAxisFromSin*20.0-timeMapTo2PI);

  //sinVal<0则返回0，>=0则返回1
  float wave=step(0.88,sinVal);

  //1白0黑相间条纹
  material.diffuse = mix(vec3(0.0),color.rgb,wave);
//  material.diffuse = texColor.rgb;
//  material.alpha=1.0;
  material.alpha = mix(0.0,color.a,wave);

  // // repeat = 30 → spacing ≈ 0.033，径向 [0,1] 上约 30 段
  //  float spacing = 1.0 / repeat;
  //
  //  // 到 ST 中心距离 → 同心环带
  //  float radial = distance(st, vec2(0.5));
  //
  //  // radial + offset - time：环随仿真时间平移
  //  float m = mod(radial + offset - time, spacing);
  //
  //  // thickness：每段里不透明环占的比例（0~1，非像素）
  //  float alpha = step(spacing * (1.0 - thickness), m);
  //
  //  material.diffuse = color.rgb;
  //  material.alpha = alpha * color.a;
  return material;
}
