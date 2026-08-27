uniform vec4 color;
uniform float time;
uniform float speed;
uniform float phase;
uniform float sectorWidth;
uniform float baseAlpha;
uniform float rimStrength;
uniform float highlight;

vec3 red=vec3(1.0,0.0,0.0);
vec3 green=vec3(0.0,1.0,0.0);
vec3 blue=vec3(0.0,0.0,1.0);
vec3 yellow=vec3(1.0,1.0,0.0);

vec3 black=vec3(0.0,0.0,0.0);
vec3 white=vec3(1.0,1.0,1.0);
vec3 gray=vec3(0.75,0.75,0.75);

float sdPie( in vec2 p, in vec2 c, in float r ) {
  p.x = abs(p.x);
  float l = length(p) - r;
  float m = length(p-c*clamp(dot(p,c),0.0,r)); // c=sin/cos of aperture
  return max(l,m*sign(c.y*p.x-c.x*p.y));
}

//逆时针旋转
mat2 rotate2D(float theta){
  float sinTheta = sin(theta);
  float cosTheta = cos(theta);

  return mat2(cosTheta, -sinTheta,
  sinTheta, cosTheta);
}

mat2 rotate2DCW(float theta) {
  return rotate2D(-theta);
}

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);

  // st 中心在圆心，dist 为 [0, 0.5] 半径
  vec2 uv = materialInput.st - vec2(0.5);
  float dist = length(uv);

  //sdPie + 旋转 + 角度渐变，扇形、运动、渐变就分开了，
  //角度差 diff < sectorWidth，扇形、渐变、运动是一起的

  // glsl 里：每个片元算一次，逻辑集中
//  //haldAperture=与y轴正方向的夹角,扇形按y轴正方向对称，所以sectorWidth/2.0=45°/2
//  float haldAperture = sectorWidth/2.0 * czm_twoPi;
//  //扇形右边的顶点坐标
//  vec2 c = vec2(sin(haldAperture), cos(haldAperture));
//  //在扇形外部，>0；在扇形边上，=0；在扇形内部，<0，在扇形内部，绝对值 = 到最近边界的距离，最近边界可能是：外圆弧、左径向边、右径向边，不是固定「到对称轴」。
//  //即在扇形上，<=0；在扇形外，>0
//  vec2 sectorPos=rotate2DCW(czm_pi/2.0-haldAperture)*uv;
//  float distToPie=sdPie(sectorPos,c,0.5);
//  float alpha=mix(1.0,0.0,step(0.0,distToPie));
//
//  float axisWidth=0.01;
//  //y轴
//  //[-0.5,-0.05]=color,[-0.05,0.5]=yellow
//  vec3 finalColor=mix(color.rgb,yellow,step(-axisWidth,uv.s));
//  finalColor=mix(finalColor,color.rgb,step(axisWidth,uv.s));
//  //x轴
//  finalColor=mix(color.rgb,yellow,step(-axisWidth,uv.t));
//  finalColor=mix(finalColor,color.rgb,step(axisWidth,uv.t));
//
//  material.diffuse = finalColor;
//  material.alpha = alpha;



//  // CircleGeometry 的 st 为 [0,1] 方形域，超出圆盘透明
//  if (dist > 0.5) {
//    material.alpha = 0.0;
//    return material;
//  }
//
//  float r = dist * 2.0;
//  float aa = max(fwidth(r), 0.002);
//
//  // 外缘描边（替代 GroundPolyline outline）
//  float rim = 1.0 - smoothstep(1.0 - aa * 2.0, 1.0, r);
//  rim *= rimStrength * (1.0 + highlight * 0.35);
//
//  //第 1 步：angle — 这个像素在圆上的「方位」
  //1.1 atan(uv.y, uv.x)=[0,π]∪[-π,0]
  //1.2 atan(uv.y, uv.x)/czm_twoPi=弧度 → 占一圈的比例，范围约 (-0.5, 0.5]。
  //1.3 + 0.5=把 0 点从 +X 平移到别处（常见是让 +Y 或「上」≈ 0），范围约 (0, 1]。
  //1.4 + phase=每个雷达加随机偏移，100 个雷达不会同步扫。
  //1.5 fract(...)=折到 [0, 1)，即整圈归一化方位：
  //0 ─────────────────────────────→ 1
  //↑                              ↑
  //同一点（360° = 0°）

//  float angle = fract(atan(uv.y, uv.x) / czm_twoPi + 0.5 + phase);
//  float head = fract(time * speed);
//  float diff = fract(angle - head + 1.0);
//
//  // 扫描扇区：前缘最亮，扇内拖尾渐隐
//  float scan = 0.0;
//  if (diff < sectorWidth) {
//    float t = diff / sectorWidth;
//    scan = mix(1.0, 0.05, t * t);
//  }
//
//  float body = baseAlpha + scan * 0.55;
//  float alpha = clamp(body + rim, 0.0, 1.0) * color.a;
//
//  material.diffuse = color.rgb * (1.0 + highlight * 0.08);
//  material.alpha = alpha;
  return material;
}
