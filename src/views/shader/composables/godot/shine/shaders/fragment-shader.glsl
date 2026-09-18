varying vec2 vUv;
uniform sampler2D godot2D;
uniform float u_thickness;
uniform float u_slope;
uniform float u_shineOffset;

const vec3 red=vec3(1,0,0);
const vec3 green=vec3(0,1,0);
const vec3 blue=vec3(0,0,1);
const vec3 white=vec3(1.0,1.0,1.0);
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
  vec4 godot2DSample=texture(godot2D,vUv);
  vec2 uvFromCenter=(vUv-0.5)*2.0;
  float halfThickness=u_thickness/2.0;

  float slope=tan(u_slope);

  float distToLine = abs(slope * uvFromCenter.x - uvFromCenter.y + u_shineOffset) / sqrt(slope * slope + 1.0);
  float distToLineAA=max(fwidth(distToLine),0.002);
  float isThicknessZero=step(u_thickness,1e-4);
  float lineShape=mix(1.0-smoothstep(halfThickness-distToLineAA,halfThickness+distToLineAA,distToLine),0.0,isThicknessZero);
//  float lineShape=u_thickness<=0.0001?0.0:1.0-smoothstep(halfThickness-distToLineAA,halfThickness+distToLineAA,distToLine);

  vec3 color = mix(godot2DSample.rgb, white, lineShape);
  gl_FragColor = vec4(color,godot2DSample.a);
}
