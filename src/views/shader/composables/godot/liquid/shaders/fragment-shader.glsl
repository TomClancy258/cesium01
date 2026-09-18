varying vec2 vUv;
uniform sampler2D godot2D;
uniform float u_waveDensity;
uniform float u_waveOffsetX;
uniform float u_waveHeight;
uniform float u_pi;

const vec3 red=vec3(1,0,0);
const vec3 green=vec3(0,1,0);
const vec3 blue=vec3(0,0,1);
const vec3 white=vec3(1.0,1.0,1.0);
const vec3 black=vec3(0.0,0.0,0.0);
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
  float twoPi=2.0*u_pi;
  vec4 godot2DSample=texture(godot2D,vUv);
  vec2 uvFromCenter=(vUv-0.5)*2.0;

  float circleRadius=1.0;
  float distToCenter=length(uvFromCenter);
  float distToCenterAA=max(fwidth(distToCenter),0.002);
  float circleShape=1.0-smoothstep(circleRadius-distToCenterAA,circleRadius+distToCenterAA,distToCenter);

//  float aheadWave=sin(uvFromCenter.x*u_waveDensity+u_waveOffsetX)*cos(u_waveOffsetX)*0.1+u_waveHeight;
//  float behindWave=cos(uvFromCenter.x*u_waveDensity+u_waveOffsetX)*cos(u_waveOffsetX)*0.15+u_waveHeight;
  float aheadWave=sin(uvFromCenter.x*u_waveDensity+u_waveOffsetX)*0.1+u_waveHeight;
  float behindWave=cos(uvFromCenter.x*u_waveDensity+u_waveOffsetX)*0.15+u_waveHeight;

  float distToAheadWave=uvFromCenter.y-aheadWave;
  float distToBehindWave=uvFromCenter.y-behindWave;

  float distToAheadWaveAA=max(fwidth(distToAheadWave),0.002);
  float distToBehindWaveAA=max(fwidth(distToBehindWave),0.002);

  float aheadWaveShape=1.0-smoothstep(-distToAheadWaveAA,distToAheadWaveAA,distToAheadWave);
  float behindWaveShape=max(1.0-smoothstep(-distToBehindWaveAA,distToBehindWaveAA,distToBehindWave)-aheadWaveShape,0.0);

  float bgShape=1.0-aheadWaveShape-behindWaveShape;

  vec3 color=behindWaveShape*green+aheadWaveShape*red+bgShape*gray;
  float alpha=circleShape;
  gl_FragColor = vec4(color,alpha);
}
