varying vec2 vUv;
uniform sampler2D godot2D;
uniform float u_radius;
uniform float u_progress;
uniform float u_edgeAngle;
uniform float u_pi;

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
  float twoPi=2.0*u_pi;
  vec4 godot2DSample=texture(godot2D,vUv);
  vec2 uvFromCenter=(vUv-0.5)*2.0;
  vec2 uvFromCenterByRotation=rotate2D(0.5*u_pi)*uvFromCenter;
  float theta=atan(uvFromCenterByRotation.y,uvFromCenterByRotation.x);
//  float theta=atan(uvFromCenter.x,uvFromCenter.y);
  float isNegative=step(theta,0.0);
  theta=mix(theta,twoPi+theta,isNegative);
  theta =twoPi- theta;
  float theta01=theta/twoPi;

//  float edgeAngle=u_edgeAngle*u_pi;
  float edgeAngle=u_progress*twoPi;
  float angleToZeroAA=max(fwidth(theta),0.002);
//  float progressShape = u_edgeAngle < 0.1
//  ? 1.0
//  : smoothstep(edgeAngle-angleToZeroAA,edgeAngle+angleToZeroAA,theta);

  float theta01AA=max(fwidth(theta01),0.002);

  float isProgressZero=step(u_progress,0.01);
//  float progressShape = mix(smoothstep(edgeAngle-angleToZeroAA,edgeAngle+angleToZeroAA,theta),1.0,isProgressZero);
  float progressShape = mix(smoothstep(u_progress-theta01AA,u_progress+theta01AA,theta01),1.0,isProgressZero);

  float isProgressOne=step(1.0,u_progress);
  progressShape = mix(progressShape,0.0,isProgressOne);
//  float progressShape=smoothstep(u_progress-theta01AA,u_progress+theta01AA,theta01);


  // aa 用小常量，不要 fwidth(theta01)
  float distToCenter=length(uvFromCenter);
  float distToCenterAA=max(fwidth(distToCenter),0.002);
  float circleShape=1.0-smoothstep(u_radius-distToCenterAA,u_radius+distToCenterAA,distToCenter);

  float mainMaskShape=progressShape*circleShape*0.6;
  vec3 color=mix(godot2DSample.rgb,green,mainMaskShape);

  float alpha=godot2DSample.a;
  gl_FragColor = vec4(color,alpha);
}
