varying vec2 vUv;
varying vec2 vLocalPos;
varying vec3 v_worldPos;
uniform sampler2D ground01;
uniform vec2 u_rolePosition;
uniform float u_minRadius;
uniform float u_maxRadius;
uniform float u_waveDensity;
uniform float u_waveOffsetX;
uniform float u_waveHeight;
uniform float u_pi;

const vec3 red=vec3(1,0,0);
const vec3 green=vec3(0,1,0);
const vec3 blue=vec3(0,0,1);
const vec3 white=vec3(1.0,1.0,1.0);
const vec3 black=vec3(0.0,0.0,0.0);
const vec3 gray=vec3(0.75,0.75,0.75);

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
  float twoPi=2.0*u_pi;
  vec4 ground01Sample=texture(ground01,vUv);
  vec2 uvFromCenter=(vUv-0.5)*2.0;


  vec3 groundColor=ground01Sample.rgb;
  vec3 color=groundColor.rgb;
  gl_FragColor = vec4(color,1.0);
}
