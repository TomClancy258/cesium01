varying vec2 vUv;
uniform sampler2D godot2D;
uniform vec2 u_imageSize;
uniform float u_pixelSize;

const vec3 white = vec3(1.0);

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
//  float grid=4.0;
//  vec2 uvFromGrid=floor(vUv*grid+0.5)/grid;

  vec2 grid=u_imageSize/u_pixelSize;
  vec2 uvFromGrid=floor(vUv*grid+0.5)/grid;

  vec4 godot2DSample=texture(godot2D,uvFromGrid);
  vec3 godot2DColor=godot2DSample.rgb;

  gl_FragColor = vec4(godot2DColor,godot2DSample.a);
}
