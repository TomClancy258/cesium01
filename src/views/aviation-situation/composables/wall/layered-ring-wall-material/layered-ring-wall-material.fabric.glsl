uniform vec4 color;
uniform float time;
uniform float bandCount;
uniform float bandWidth;
uniform float glowStrength;

vec3 yellow=vec3(1.0,1.0,0.0);

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);
  vec2 st = materialInput.st;
  float t = st.t;

  //bandCount个[0,1]
  float bandCountT=fract((st.t-time)*bandCount);

  float bottomEdge=0.1;
  float topEdge=bottomEdge+bandWidth;

  float aa=max(fwidth(bandCountT),0.002);

  //从下到上：亮边下面[0,0] 亮边抗锯齿[0,1] 亮边到坐标轴1为[1,1]
  float bottomAlpha=smoothstep(bottomEdge-aa,bottomEdge+aa,bandCountT);

  //中间alpha=1，两边软边
//  float topAlpha=1.0-smoothstep(topEdge-aa,topEdge+aa,bandCountT);
//  float alpha=bottomAlpha*topAlpha;

  //亮头软边
  float distToAA=bandCountT-(bottomEdge+aa);
  float bandWidthWithoutAA=bandWidth-aa;
  //注意一点：若 bandWidth ≲ aa【bandWidth非常接近于aa】，bandWidthWithoutAA ≤ 0，smoothstep 会坏掉，应写成：
  //但这里bandWidth=0.4，几乎不可能 bandWidth ≲ aa
//  float bandWidthWithoutAA = max(bandWidth - aa, 1e-4);
  //[bottomEdge+aa,topEdge]才是alpha[1,0]
  float bandAlphaFromAA=1.0-smoothstep(0.0,bandWidthWithoutAA,distToAA);

  //亮头软边，中间[1,0]，其余0，画个图就知道了
  float alpha=bottomAlpha*bandAlphaFromAA;

  float killNearZero =step(0.05,bandCountT);
  alpha=mix(0.0,alpha,killNearZero);

  float killNearOne =1.0-step(0.95,bandCountT);
  alpha=mix(0.0,alpha,killNearOne);

  alpha=max(0.1,alpha);

  material.diffuse = color.rgb;
  material.alpha = alpha*color.a;

//  float alpha = 0.0;
//  float spacing = 1.0 / max(bandCount, 1.0);
//
//  for (int i = 0; i < 8; i++) {
//    if (float(i) >= bandCount) {
//      break;
//    }
//    float center = (float(i) + 0.5) * spacing;
//    float dist = abs(t - center);
//    float ring = 1.0 - smoothstep(bandWidth * 0.5, bandWidth * 0.5 + 0.015, dist);
//    alpha = max(alpha, ring * 0.55);
//  }
//
//  float pulsePos = fract(time);
//  float pulseDist = abs(t - pulsePos);
//  pulseDist = min(pulseDist, 1.0 - pulseDist);
//  float pulse = 1.0 - smoothstep(0.0, 0.035, pulseDist);
//  alpha = max(alpha, pulse);
//
//  material.diffuse = color.rgb;
//  material.alpha = alpha * color.a;
//  material.emission = color.rgb * alpha * glowStrength;
  return material;
}
