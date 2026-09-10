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
  vec2 uvFromCenter = materialInput.st - vec2(0.5);
  float distToCenter = length(uvFromCenter);

  //[-π，π]
  float theta = atan(uvFromCenter.y, uvFromCenter.x);
  float isOverPi=step(theta,0.0);
  //[0,2π]
  theta=mix(theta,theta+czm_twoPi,isOverPi);

  //逆时针运动时，sectorWidth=0.2head=0.15时，
  //若该片元的theta01=0.1，则diff=fract(0.05)=0.05<sectorWidth，则该片元在扇内；
  //若theta01=0.2，则diff=fract(0.15-0.2)=fract(-0.05)=-0.05-floor(-0.05)=-0.05-(-1)=1-0.05=0.95>sectorWidth，则该片元在扇形外面：
  //若theta01=0.97，则diff=fract(0.15-0.97)=fract(-0.82)=-0.82-floor(-0.82)=-0.82-(-1)=1-0.82=0.18<sectorWidth，则在扇形内；
  //若theta01=0.9，则diff=fract(0.15-0.9)=fract(-0.75)=-0.75-floor(-0.75)=-0.75-(-1)=1-0.75=0.25>sectorWidth，则不在扇形内；

  //[0,2π]=>[0,1]
  float theta01=theta/czm_twoPi;

  //逆时针旋转
//  float head01=fract(time+phase);
  //顺时针旋转
  float head01=fract(-time+phase);
  float distToHead=fract(head01-theta01);
//fract(x) 当x为负数时，返回结果为 -floor(x)-|x|

  float distToHeadAA=max(fwidth(distToHead),0.002);

  float tailAlpha=1.0-smoothstep(sectorWidth-distToHeadAA,sectorWidth+distToHeadAA,distToHead);
  float headAlpha=smoothstep(0.0,distToHeadAA,distToHead);
  float sectorShape=tailAlpha*headAlpha;
  //逆时针亮头
//  float sectorGradientAlpha=1.0-smoothstep(0.0,sectorWidth,distToHead);
  //顺时针亮头
  float sectorGradientAlpha=smoothstep(0.0,sectorWidth,distToHead);
  float sectorAlpha=sectorShape*sectorGradientAlpha;
  float borderWidth=0.02;

  float edge = 0.5;
  float distToCenterAA = max(fwidth(distToCenter), 0.002);  // 对 r 求 fwidth 更贴切
  float ringInnerDistToCenter=edge-borderWidth;

  float alphaOuter = 1.0 - smoothstep(edge - distToCenterAA, edge, distToCenter);           // 贴边，只向内淡
  float alphaInner = smoothstep(ringInnerDistToCenter - distToCenterAA, ringInnerDistToCenter+distToCenterAA, distToCenter);
  float rim = alphaOuter * alphaInner;
  float alpha = max(sectorAlpha, rim);

  material.diffuse = color.rgb;
  material.alpha = alpha* color.a;

  return material;
}
