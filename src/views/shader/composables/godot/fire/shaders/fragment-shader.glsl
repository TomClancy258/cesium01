varying vec2 vUv;
uniform sampler2D godot2D;
uniform sampler2D noise;
uniform vec2 u_imageSize;
uniform float u_pixelSize;
uniform float u_mask;
uniform float u_gradient;
uniform float u_noiseOffsetY;
const vec3 red=vec3(1,0,0);
const vec3 green=vec3(0,1,0);
const vec3 blue=vec3(0,0,1);

const vec3 outerFireColor=vec3(1.0, 0.3059, 0.1137);
const vec3 middleFireColor=vec3(1.0, 0.6667, 0.0);
const vec3 innerFireColor=vec3(1.0, 0.8039, 0.5451);

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
  vec4 noiseSample=texture(noise,vec2(vUv.x,vUv.y-u_noiseOffsetY));

  float width=0.8;
  float halfWidth=width/2.0;
  vec2 uvFromCenter=(vUv - 0.5)*2.0;
  float distToCenterInEllipse=length(vec2(uvFromCenter.x*2.0,uvFromCenter.y));
  float ellipseAA=max(fwidth(distToCenterInEllipse),0.002);
  float ellipseShape=1.0-smoothstep(halfWidth-ellipseAA,halfWidth+ellipseAA,distToCenterInEllipse);

  float gradientFromEllipseCenter=1.0-smoothstep(0.2,halfWidth,distToCenterInEllipse);

  float gradientFromBottom=1.0-smoothstep(0.0,halfWidth,uvFromCenter.y);
  float alpha=ellipseShape*gradientFromEllipseCenter*gradientFromBottom;

  float noiseAlpha=noiseSample.r;

  float outerFireAlpha=0.3;
  float middleFireAlpha=0.4;
  float innerFireAlpha=0.5;
  float outerFireAA=0.002;
  float outerFireShape=smoothstep(outerFireAlpha-outerFireAA,outerFireAlpha+outerFireAA,noiseAlpha);
  float middleFireShape=step(middleFireAlpha,noiseAlpha);
  float innerFireShape=step(innerFireAlpha,noiseAlpha);

  float outerShape=outerFireShape-middleFireShape;
  float middleShape=middleFireShape-innerFireShape;
  float innerShape=innerFireShape;

  alpha*=outerFireShape;
  vec3 color=outerShape*outerFireColor+middleShape*middleFireColor+innerShape*innerFireColor;

  gl_FragColor = vec4(color,alpha);
}
