varying vec2 vUv;
uniform float u_earthTime;
uniform float u_moonTime;
const float PI = 3.14159265359;

const vec3 red=vec3(1,0,0);
const vec3 green=vec3(0,1,0);
const vec3 blue=vec3(0,0,1);
vec3 gray=vec3(0.75,0.75,0.75);

mat2 rotate2D(float theta){
  float sinTheta = sin(theta);
  float cosTheta = cos(theta);

  return mat2(cosTheta, -sinTheta,
  sinTheta, cosTheta);
}

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

void main() {
  vec2 uvFromCenter=(vUv-0.5)*2.0;
  float distToCenter=length(uvFromCenter);
  float sunRadius=0.3;
  float earthRadius=0.1;
  float distToEarthFromSun=0.6;
  float earthTheta=u_earthTime*2.0*PI;
  float moonRadius=0.05;
  float moonTheta=-(u_moonTime*2.0*PI+0.25*PI);
  float distToMoonFromEarth=0.2;

  float distToCenterAA=max(fwidth(distToCenter),0.002);//只保留一个AA也行
  float sunShape=1.0-smoothstep(sunRadius-distToCenterAA,sunRadius+distToCenterAA,distToCenter);

  vec2 earthPos=vec2(distToEarthFromSun*cos(earthTheta),distToEarthFromSun*sin(earthTheta));
  vec2 uvFromEarth=uvFromCenter-earthPos;
  float distToEarth=length(uvFromEarth);
  float distToEarthAA=max(fwidth(distToEarth),0.002);
  float earthShape=1.0-smoothstep(earthRadius-distToEarthAA,earthRadius+distToEarthAA,distToEarth);


  vec2 moonPos=vec2(distToMoonFromEarth*cos(moonTheta),distToMoonFromEarth*sin(moonTheta));
  vec2 uvFromMoon=uvFromEarth-moonPos;
  float distToMoon=length(uvFromMoon);
  float distToMoonAA=max(fwidth(distToMoon),0.002);
  float moonShape=1.0-smoothstep(moonRadius-distToMoonAA,moonRadius+distToMoonAA,distToMoon);

  vec3 color=sunShape*red+earthShape*blue+moonShape*gray;

  gl_FragColor = vec4(color,1.0);
}
