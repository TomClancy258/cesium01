varying vec2 vUv;
uniform sampler2D noise;

const vec3 white = vec3(1.0);
uniform float u_shieldOuterDistToCenter;
uniform float u_shieldWidth;
uniform float u_highlightPointRadius;
uniform float u_highlightPointAngle;
uniform float u_intensity;
/** 噪声 UV 横向偏移，JS 每 5s 锯齿波 0→1 循环写入 */
uniform float u_noiseOffsetX;

const float PI = 3.14159265359;

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
  float baseAlpha = 0.0;

  vec2 center = vec2(0.5);
  float distToCenter = distance(vUv, center);
  float distToCenterAA = max(fwidth(distToCenter), 0.002);
  float shieldInnerDistToCenter=u_shieldOuterDistToCenter-u_shieldWidth;

  float shieldOuterAlpha =
  1.0 -
  smoothstep(
    u_shieldOuterDistToCenter - distToCenterAA,
    u_shieldOuterDistToCenter + distToCenterAA,
    distToCenter
  );
  float shieldInnerAlpha =
  smoothstep(
    shieldInnerDistToCenter - distToCenterAA,
    shieldInnerDistToCenter + distToCenterAA,
    distToCenter
  );
  //护盾范围，不包含渐变
  float shieldShape=shieldInnerAlpha*shieldOuterAlpha;

  //环从内到外alpha=[0.0,0.5]
  float shieldGradientAlpha=smoothstep(shieldInnerDistToCenter,u_shieldOuterDistToCenter,distToCenter)*0.5;
  //没必要为了那aa范围的[1.0,0.5]而做下面那样复杂
//  float shieldGradientAlpha=smoothstep(shieldInnerDistToCenter,u_shieldOuterDistToCenter-distToCenterAA,distToCenter);

  //护盾渐变
//  float shieldAlpha=shieldGradientAlpha*shieldOuterAlpha;
  float shieldAlpha=shieldShape*shieldGradientAlpha;

  vec2 uvFromCenter=vUv-0.5;

  vec2 highlightPointPos=vec2(u_highlightPointRadius*cos(u_highlightPointAngle),u_highlightPointRadius*sin(u_highlightPointAngle));
  float distToHighlightPos=distance(highlightPointPos,uvFromCenter);
  //从高两点向四周，(1.0-distToHighlightPos)=[1.0,0.0]，再*shieldAlpha=[0.0,0.5],且把highlightPointAlphaInShield固定在了环内
//  float highlightPointAlphaInShield=(1.0-distToHighlightPos)*shieldAlpha;
  //让高光集中于高亮点，但次方越大，高光越暗，因为小数的次方是更小
  float highlightPointAlphaInShield=pow((1.0-distToHighlightPos),8.0)*shieldShape;
//  float highlightPointAlphaInShield=pow((1.0-distToHighlightPos),2.0)*shieldAlpha;

  //texture2D(webgl1)/texture(webgl2，推荐)一样的，都是返回 vec4（RGBA）
  //noise图片的RGBA都一样，即灰度值在四个值上都一样
  //  vec4 noiseSample=texture2D(noise,vUv);
  //相当于noise在往x轴负方向移动，比如移动了0.5，那[0.5,1.0]部分应该就没有纹理图片了呀
  //——不会「没图」。UV 越界后怎么取，取决于贴图的 wrap。
  //即noiseTexture.wrapS = THREE.RepeatWrapping和noiseTexture.wrapT = THREE.RepeatWrapping
  //*3.0是让噪声更拥挤（更多）
  float noiseSampleAlpha=texture(noise,vUv+vec2(u_noiseOffsetX,0.0)).r*3.0;
//  float rotateRadian=remap(u_noiseOffsetX,0.0,1.0, 0.0, 2.0*PI);
//  float noiseSampleAlpha=texture(noise,rotate2D(rotateRadian)*uvFromCenter).r*3.0;

//  baseAlpha=shieldAlpha;
//  baseAlpha=highlightPointAlphaInShield;
  //[0.0,0.5+0.5]*intensity，最亮点=高两点=1.0*intensity
  baseAlpha=(shieldAlpha+highlightPointAlphaInShield)*noiseSampleAlpha;

  vec3 red=vec3(1.0,0.0,0.0);
  vec3 blue=vec3(0.0,0.0,1.0);
  //形走 alpha，亮走 color。 你这版这样分，就是常见做法。
  //u_intensity:让颜色更亮（发光更强）
  //u_intensity > 1：RGB 变大 → 更亮，甚至发白、过曝
  //u_intensity < 1：变暗、发灰
  vec3 baseColor=(red*shieldAlpha+blue*highlightPointAlphaInShield)*u_intensity;

  gl_FragColor = vec4(baseColor, baseAlpha);
//  gl_FragColor = noiseSample;
}
