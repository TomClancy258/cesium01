varying vec2 vUv;
uniform sampler2D attack;
uniform float u_currentFrame;
uniform float u_frames;

const vec3 red=vec3(1,0,0);
const vec3 green=vec3(0,1,0);
const vec3 blue=vec3(0,0,1);

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
  float frameWidth=1.0/u_frames;
  float currentFrame=0.0;
  float uvX=u_currentFrame*frameWidth+vUv.x/u_frames;
  vec4 attackSample=texture(attack,vec2(uvX,vUv.y));

  float alpha=attackSample.a;
  gl_FragColor = vec4(attackSample.rgb,1.0);
}
