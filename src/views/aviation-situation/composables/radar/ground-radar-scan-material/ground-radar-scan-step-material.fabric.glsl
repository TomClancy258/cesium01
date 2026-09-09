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

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

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

//[0, π]
float angleBetween(vec2 a, vec2 b) {
  return acos(clamp(dot(normalize(a), normalize(b)), -1.0, 1.0));
}

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);

  // st 中心在圆心，dist 为 [0, 0.5] 半径
  vec2 uv = materialInput.st - vec2(0.5);
  float dist = length(uv);

  //sdPie + 旋转 + 角度渐变，扇形、运动、渐变就分开了，
  //角度差 diff < sectorWidth，扇形、渐变、运动是一起的

  // head — 扫描前缘 [0,1)。time 已由 TS 归一化为一圈进度，勿再乘大秒数
  float head = fract(time + phase);
//  float head = fract(time);

  // glsl 里：每个片元算一次，逻辑集中
  float aperture=sectorWidth* czm_twoPi;
  //halfAperture=与y轴正方向的夹角,扇形按y轴正方向对称，所以sectorWidth/2.0=45°/2
  float halfAperture = aperture/2.0;
  //扇形右边的顶点坐标
  vec2 c = vec2(sin(halfAperture), cos(halfAperture));
  //在扇形外部，>0；在扇形边上，=0；在扇形内部，<0，在扇形内部，绝对值 = 到最近边界的距离，最近边界可能是：外圆弧、左径向边、右径向边，不是固定「到对称轴」。
  //即在扇形上，<=0；在扇形外，>0
  float rotationRadius=head*czm_twoPi;
  // 不是转扇形，也不是改 uv 变量：
  // 用旋转后的坐标 sectorPos = R * uv 去测「固定的」sdPie
  //顺时针旋转rotationRadius弧度，再顺时针旋转 czm_pi/2.0-halfAperture  弧度
//  vec2 sectorPos=rotate2DCW(czm_pi/2.0-halfAperture)*rotate2DCW(rotationRadius)*uv;
    //sectorPos 是片元在「扇形局部坐标系」里的坐标；在这个坐标系里，参考扇形固定、关于 +Y 对称。
  vec2 sectorPos=rotate2DCW(rotationRadius)*uv;
  float distToPie=sdPie(sectorPos,c,0.5);

  //---------------------------------------------------------------
//  float alpha=mix(1.0,0.0,step(0.0,distToPie)); //用下面的“亮边外侧抗锯齿”代替这行，
  //---------------------------------------------------------------
  float aaPie = max(fwidth(distToPie), 0.002);
  
  float sectorPosDistToCenter=length(sectorPos);
  float isLengthSafe=step(1e-5,sectorPosDistToCenter);
  float isInPie=step(distToPie,0.0);
  float isOutofPie=1.0-isInPie;

  float alpha=0.0;
  float radius = mix(0.0, angleBetween(c, sectorPos), isLengthSafe);
//  float sectorAlpha=mix(0.0,1.0-radius/aperture,isInPie*isLengthSafe);
  float sectorAlpha=mix(0.0,1.0-radius/aperture,isInPie*isLengthSafe);

  float isRadiusSmallerThanHalfAperture=step(radius,halfAperture);
  //亮边外面 距离[0,aa]的mask=[1,0]
  float mask = mix(0.0,1.0 - smoothstep(0.0, aaPie, distToPie),isRadiusSmallerThanHalfAperture*isOutofPie);  // 软进出


  float borderWidth=0.02;

  float edge = 0.5;
  float aa = max(fwidth(dist), 0.002);  // 对 r 求 fwidth 更贴切

  float alphaOuter = 1.0 - smoothstep(edge - aa, edge, dist);           // 贴边，只向内淡
  float alphaInner = smoothstep(edge - borderWidth - aa, edge - borderWidth, dist);
  float rim = alphaOuter * alphaInner;
  alpha = max(sectorAlpha, rim);
  alpha = max(alpha, mask);

  float distToBorder=0.5-borderWidth;

  float axisWidth=0.01;

  material.diffuse = color.rgb;
  material.alpha = alpha* color.a;

  return material;
}
