varying vec2 vUv;
varying vec2 vLocalPos;
varying vec3 v_worldPos;
uniform sampler2D ground01;
uniform vec2 u_lightPositions[4];
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

  float innerVisualCircleRadius=0.5;
  float outerVisualCircleRadius=0.75;
  float visibility=0.0;

  for(int i=0;i<4;i++){
    float distToLightCenter=distance(vLocalPos,u_lightPositions[i]);
    float distToLightCenterAA=max(fwidth(distToLightCenter),0.002);
    float innerVisualCircleShape=1.0-smoothstep(innerVisualCircleRadius-distToLightCenterAA,innerVisualCircleRadius+distToLightCenterAA,distToLightCenter);
    float outerVisualCircleShape=1.0-smoothstep(outerVisualCircleRadius-distToLightCenterAA,outerVisualCircleRadius+distToLightCenterAA,distToLightCenter);
    float ringAlpha=outerVisualCircleShape-innerVisualCircleShape;
    //lightVisibility=内圈1，环0.5，环外0
    float lightVisibility=innerVisualCircleShape+ringAlpha*0.5;
    visibility=max(visibility,lightVisibility);
  }

  float distToRole=distance(vLocalPos,u_rolePosition);
  float distToRoleAA=max(fwidth(distToRole),0.002);
  float roleInnerShape=1.0-smoothstep(innerVisualCircleRadius-distToRoleAA,innerVisualCircleRadius+distToRoleAA,distToRole);
  float roleOuterShape=1.0-smoothstep(outerVisualCircleRadius-distToRoleAA,outerVisualCircleRadius+distToRoleAA,distToRole);
  float roleRingShape=roleOuterShape-roleInnerShape;
  float roleVisibility=roleInnerShape+roleRingShape*0.5;
  //从内到外：内圆1 [1->0.5] 环0.5 [0.5->0] 环外0
  visibility=max(visibility,roleVisibility);

  vec3 groundColor=ground01Sample.rgb;
  vec3 color=mix(gray,groundColor,visibility);
  gl_FragColor = vec4(color,1.0);
}
