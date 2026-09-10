varying vec2 vUv;
uniform sampler2D bird;
uniform float u_borderWidth;

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
  vec4 birdSample=texture(bird,vUv);

  //什么时候才上 TEXTURE_PIXEL_SIZE（或 1/w, 1/h）
  //同一套描边要套 很多不同分辨率 的图
  //想表达「大约扩 N 个像素」，换 64 / 256 / 512 都接近

  vec4 birdShiftBottomSample=texture(bird,vec2(vUv.x,vUv.y+u_borderWidth));
  vec4 birdShiftTopSample=texture(bird,vec2(vUv.x,vUv.y-u_borderWidth));
  vec4 birdShiftLeftSample=texture(bird,vec2(vUv.x+u_borderWidth,vUv.y));
  vec4 birdShiftRightSample=texture(bird,vec2(vUv.x-u_borderWidth,vUv.y));

  vec4 birdShiftLeftTopSample=texture(bird,vec2(vUv.x+u_borderWidth,vUv.y-u_borderWidth));
  vec4 birdShiftRightTopSample=texture(bird,vec2(vUv.x-u_borderWidth,vUv.y-u_borderWidth));
  vec4 birdShiftLeftBottomSample=texture(bird,vec2(vUv.x+u_borderWidth,vUv.y+u_borderWidth));
  vec4 birdShiftRightBottomSample=texture(bird,vec2(vUv.x-u_borderWidth,vUv.y+u_borderWidth));

  float borderedBirdAlpha=birdSample.a+
  birdShiftLeftSample.a+birdShiftRightSample.a+
  birdShiftBottomSample.a+birdShiftTopSample.a+
  birdShiftLeftTopSample.a+birdShiftRightTopSample.a+
  birdShiftLeftBottomSample.a+birdShiftRightBottomSample.a;

  float birdAlpha=min(borderedBirdAlpha,1.0);

  float isBorder=birdAlpha-birdSample.a;
  vec3 birdColor=mix(birdSample.rgb,white,isBorder);

  float uvWidth=0.01;
  float uvHalfWidth=uvWidth/2.0;
  float distToU=abs(vUv.x);
  float distToV=abs(vUv.y);
  float uAA=max(fwidth(distToU),0.002);
  float vAA=max(fwidth(distToV),0.002);

  float uTopAlpha=1.0-smoothstep(uvHalfWidth-uAA,uvHalfWidth+uAA,distToU);
  float vRightAlpha=1.0-smoothstep(uvHalfWidth-vAA,uvHalfWidth+vAA,distToV);

  float uvAxisAlpha=max(uTopAlpha,vRightAlpha);
  float alpha=max(uvAxisAlpha,birdAlpha);

  gl_FragColor = vec4(birdColor,alpha);
}
