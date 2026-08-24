// Cesium Fabric 材质片段（非完整 fragment shader，无 void main）
// uniforms 由 SatelliteRadarMaterialProperty.getValue 每帧注入

uniform sampler2D image;
uniform vec4 color;
uniform float time;
uniform float ringCount;
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

  // time: 0→1 表示扫完顶→底；映射到 [0, 2.0 * PI * ringCount] 得到sweepPhase，即sin往左边偏移sweepPhase
  //time表示单个光圈从锥尖走到底部圆边的时间，最大偏移量就得2PI*ringCount，若是ringCount-1则光圈只走到了最后2PI里的前1PI里
  float sweepPhase = remap(time, 0.0, 1.0, 0.0, 2.0 * PI * ringCount);
  float radialPhase = remap(radial, 0.0, 1.0, 0.0, 2.0 * PI);
  //y = sin(x)
  //峰在 x = π/2。
  //
  //y = sin(x - a)，且 a > 0：
  //峰满足 x - a = π/2 ⇒ x = π/2 + a
  //峰比原来 往右移了 a（+x）。
  //
  //时间 t 变大时，ωt 变大，相当于 a 变大 → 峰不断往右挪 → 波往 +x 传。
  //
  //y = sin(x + a)，a > 0：
  //x + a = π/2 ⇒ x = π/2 - a → 峰往 左（-x）。

  //一句话口诀
  //减号：图像往正方向移；加号：往负方向移。
  //（对 f(x ± a)，a>0 时：-a 右移，+a 左移）
  float sinVal = sin(radialPhase * ringCount - sweepPhase);

  //sinVal<0.88则返回0(即透明)，>=0.88则返回1(即才是亮环)，硬切=》相邻像素一个过阈值、一个不过 → 锯齿。
//  float wave=step(0.88,sinVal);

  //这三行是在做一件事：别在 sinVal == 0.88 处硬切，而是在附近弄一条软过渡带，减轻锯齿。
  float edge = 0.88;
  // 软边宽度：用导数自适应（推荐），或写死一个小数
  //fwidth=（右邻像素点）水平变化有多快 + （上邻像素点）竖直变化有多快 ≈ |水平导数| + |竖直导数|
  float aa = max(fwidth(sinVal), 0.002);
  //sinVal                       wave
  //< 0.88 - aa                  ≈ 0（暗）
  //[0.88 - aa,0.88 + aa]        0→1 平滑过渡（软边）
  //> 0.88 + aa                  ≈ 1（亮）
  float wave = smoothstep(edge - aa, edge + aa, sinVal);

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
