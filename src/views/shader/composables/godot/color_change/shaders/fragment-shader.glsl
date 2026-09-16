varying vec2 vUv;
uniform sampler2D godot2D;
uniform float u_vibrance;

const vec3 gray_weights = vec3(.299, .587, .114); // NTSC conversion weights

const vec3 red=vec3(1,0,0);
const vec3 green=vec3(0,1,0);
const vec3 blue=vec3(0,0,1);

const vec3 colors[6] = vec3[](
vec3(0.0, 1.0, 1.0),
vec3(0.1647, 0.7922, 0.8745),
vec3(0.0118, 0.6078, 0.6588),
vec3(0.0157, 0.4392, 0.4706),
vec3(0.0157, 0.2902, 0.3059),
vec3(1.0, 0.5294, 0.3608)

//red,
//green,
//blue
);


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

vec3 getColor(float r){
  return colors[int(round(r*100.0))/5];
}

void main() {
  vec4 godot2DSample=texture(godot2D,vUv);

  vec3 color=getColor(godot2DSample.r);
  float luminance=dot(color,gray_weights);

  color=mix(vec3(luminance),color,u_vibrance);

  float alpha=godot2DSample.a;
  gl_FragColor = vec4(color,alpha);
}
