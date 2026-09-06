varying vec2 vUv;
uniform sampler2D diffuse;
uniform float u_centerCircleRadius;
uniform float u_ringOuterDistance;
uniform float u_ringWidth;
uniform float u_gapWidth;

const vec3 white = vec3(1.0);

float getCenterCircleAlpha(float distToCenter,float aa) {
  float centerCircleAlpha =
    1.0 -
    smoothstep(
      u_centerCircleRadius - aa,
      u_centerCircleRadius + aa,
      distToCenter
    );
  return centerCircleAlpha;
}

float getRingAlpha(float distToCenter,float aa){
  float ringInnerDistance=u_ringOuterDistance-u_ringWidth;
  float ringOuterAlpha=1.0-smoothstep(u_ringOuterDistance-aa,u_ringOuterDistance+aa,distToCenter);
  float ringInnerAlpha=smoothstep(ringInnerDistance-aa,ringInnerDistance+aa,distToCenter);
  float ringAlpha=ringOuterAlpha*ringInnerAlpha;
  return ringAlpha;
}

float getGapMask(vec2 uvFromCenter){
  float gapHalfWidth=u_gapWidth /2.0;
  float distToYAxis=abs(uvFromCenter.x);
  //二维点距用下面
  //  float distToYAxis=distance(uvFromCenter.x,0.0);
  float distToYAxisAA=max(fwidth(distToYAxis),0.002);
  float yAxisGapMask=smoothstep(gapHalfWidth-distToYAxisAA,gapHalfWidth+distToYAxisAA,distToYAxis);

  float distToXAxis=abs(uvFromCenter.y);
  float distToXAxisAA=max(fwidth(distToXAxis),0.002);
  float xAxisGapMask=smoothstep(gapHalfWidth-distToXAxisAA,gapHalfWidth+distToXAxisAA,distToXAxis);

  float gapMask=yAxisGapMask*xAxisGapMask;
  return gapMask;
}

void main() {
  float baseAlpha = 0.0;

  vec2 center = vec2(0.5);
  float distToCenter = distance(vUv, center);
  float distToCenterAA = max(fwidth(distToCenter), 0.002);

  float centerCircleAlpha = getCenterCircleAlpha(distToCenter,distToCenterAA);
  baseAlpha = max(baseAlpha, centerCircleAlpha);

  float ringAlpha = getRingAlpha(distToCenter,distToCenterAA);

  vec2 uvFromCenter=vUv-0.5;
  float gapMask=getGapMask(uvFromCenter);
  float ringsAlpha=ringAlpha*gapMask;

  float lineWidth=0.1;
  float lineHalfWidth=lineWidth/2.0;


  baseAlpha=max(baseAlpha,ringsAlpha);

  gl_FragColor = vec4(white, baseAlpha);
}
