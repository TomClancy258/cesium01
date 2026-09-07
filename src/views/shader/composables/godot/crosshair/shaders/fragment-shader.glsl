varying vec2 vUv;
uniform sampler2D diffuse;
uniform float u_centerCircleRadius;
uniform float u_ringOuterDistance;
uniform float u_ringWidth;
uniform float u_gapWidth;
uniform float u_lineOuterDistToCenter;

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

float getGapMask(vec2 uvFromCenter,float distToYAxis,float distToYAxisAA,float distToXAxis,float distToXAxisAA){
  float gapHalfWidth=u_gapWidth /2.0;

  float yAxisGapMask=smoothstep(gapHalfWidth-distToYAxisAA,gapHalfWidth+distToYAxisAA,distToYAxis);
  float xAxisGapMask=smoothstep(gapHalfWidth-distToXAxisAA,gapHalfWidth+distToXAxisAA,distToXAxis);

  float gapMask=yAxisGapMask*xAxisGapMask;
  return gapMask;
}

float getLinesAlpha(vec2 uvFromCenter,float distToYAxis,float distToYAxisAA,float distToXAxis,float distToXAxisAA){
  float lineWidth=0.05;
  float lineHalfWidth=lineWidth/2.0;
  float lineHeight=0.2;
  float lineInnerDistToCenter=u_lineOuterDistToCenter-lineHeight;
  float verticalLineLeftRightAlpha=1.0-smoothstep(lineHalfWidth-distToYAxisAA,lineHalfWidth+distToYAxisAA,distToYAxis);

  float verticalLineOuterAlpha=1.0-smoothstep(u_lineOuterDistToCenter-distToXAxisAA,u_lineOuterDistToCenter+distToXAxisAA,distToXAxis);
  float verticalLineInnerAlpha=smoothstep(lineInnerDistToCenter-distToXAxisAA,lineInnerDistToCenter+distToXAxisAA,distToXAxis);
  float verticalLineOuterInnerAlpha=verticalLineOuterAlpha*verticalLineInnerAlpha;
  float verticalLineAlpha=verticalLineOuterInnerAlpha*verticalLineLeftRightAlpha;

  float horizontalLineLeftRightAlpha=1.0-smoothstep(lineHalfWidth-distToXAxisAA,lineHalfWidth+distToXAxisAA,distToXAxis);

  float horizontalLineOuterAlpha=1.0-smoothstep(u_lineOuterDistToCenter-distToYAxisAA,u_lineOuterDistToCenter+distToYAxisAA,distToYAxis);
  float horizontalLineInnerAlpha=smoothstep(lineInnerDistToCenter-distToYAxisAA,lineInnerDistToCenter+distToYAxisAA,distToYAxis);
  float horizontalLineOuterInnerAlpha=horizontalLineOuterAlpha*horizontalLineInnerAlpha;
  float horizontalLineAlpha=horizontalLineOuterInnerAlpha*horizontalLineLeftRightAlpha;

  float linesAlpha=max(verticalLineAlpha,horizontalLineAlpha);
  return linesAlpha;
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

  float distToYAxis=abs(uvFromCenter.x);
  //二维点距用下面
  //  float distToYAxis=distance(uvFromCenter.x,0.0);
  float distToYAxisAA=max(fwidth(distToYAxis),0.002);
  float distToXAxis=abs(uvFromCenter.y);
  float distToXAxisAA=max(fwidth(distToXAxis),0.002);

  float gapMask=getGapMask(uvFromCenter,distToYAxis,distToYAxisAA,distToXAxis,distToXAxisAA);
  float ringsAlpha=ringAlpha*gapMask;
  baseAlpha=max(baseAlpha,ringsAlpha);

  float linesAlpha= getLinesAlpha(uvFromCenter,distToYAxis,distToYAxisAA,distToXAxis,distToXAxisAA);
  baseAlpha=max(baseAlpha,linesAlpha);

  gl_FragColor = vec4(white, baseAlpha);
}
