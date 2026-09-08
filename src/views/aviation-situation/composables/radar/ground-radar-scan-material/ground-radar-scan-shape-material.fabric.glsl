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
  float dist = length(uvFromCenter);

  //[-π，π]
  float theta = atan(uvFromCenter.y, uvFromCenter.x);
  float isOverPi=step(theta,0.0);
  //[0,2π]
  float newTheata=mix(theta,theta+czm_twoPi,isOverPi);
  float aperture=sectorWidth* czm_twoPi;

  float head = fract(time + phase);
  float headAngle = head * czm_twoPi;
  float angleToHeadAngle=czm_twoPi-headAngle;
  float tailAngle = headAngle-aperture;

  float newTheataAA=max(fwidth(newTheata),0.002);
  float headAlpha=smoothstep(headAngle-newTheataAA,headAngle+newTheataAA,newTheata);
  float tailAlpha=1.0-smoothstep(tailAngle-newTheataAA,tailAngle+newTheataAA,newTheata);
  float sectorShape=headAlpha*tailAlpha;

  float alpha=sectorShape;

  float borderWidth=0.02;

  float edge = 0.5;
  float aa = max(fwidth(dist), 0.002);  // 对 r 求 fwidth 更贴切
  float ringInnerDistToCenter=edge-borderWidth;

  float alphaOuter = 1.0 - smoothstep(edge - aa, edge, dist);           // 贴边，只向内淡
  float alphaInner = smoothstep(ringInnerDistToCenter - aa, ringInnerDistToCenter, dist);
  float rim = alphaOuter * alphaInner;
  alpha = max(alpha, rim);

  material.diffuse = color.rgb;
  material.alpha = alpha* color.a;

  return material;
}
