varying vec2 vUv;
uniform sampler2D godot2D;
uniform sampler2D noise;
uniform vec2 u_imageSize;
uniform float u_pixelSize;
uniform float u_mask;
uniform float u_gradient;
const vec3 green=vec3(0,1,0);

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
  vec4 godot2DSample=texture(godot2D,vUv);
//  vec4 noiseSample=texture(noise,vUv/1700.0);
  vec4 noiseSample=texture(noise,vUv);

  //r越1白则不透明，r越0黑则透明
//  float noiseAlpha=step(u_mask,noiseSample.r);
//  float alpha=noiseAlpha*godot2DSample.a;
//  float alpha=min(noiseAlpha,godot2DSample.a);

  float noiseAlpha = smoothstep(u_mask - u_gradient, u_mask + u_gradient, noiseSample.r);
  float alpha=min(noiseAlpha,godot2DSample.a);

  float isInGradient=step(u_mask - u_gradient,noiseSample.r)*step(noiseSample.r,u_mask + u_gradient);
  vec3 color=mix(godot2DSample.rgb,green,isInGradient);

//  float isAlphaLessThan1=step(alpha,0.5);
//  vec3 color=mix(godot2DSample.rgb,green,isAlphaLessThan1);

  gl_FragColor = vec4(color,alpha);
}
