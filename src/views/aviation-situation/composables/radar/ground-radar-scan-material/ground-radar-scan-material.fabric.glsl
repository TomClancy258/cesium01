uniform vec4 color;
uniform float time;
uniform float speed;
uniform float phase;
uniform float sectorWidth;
uniform float baseAlpha;
uniform float rimStrength;
uniform float highlight;

vec3 red=vec3(1.0,0.0,0.0);
vec3 green=vec3(0.0,1.0,0.0);
vec3 blue=vec3(0.0,0.0,1.0);
vec3 yellow=vec3(1.0,1.0,0.0);

vec3 black=vec3(0.0,0.0,0.0);
vec3 white=vec3(1.0,1.0,1.0);
vec3 gray=vec3(0.75,0.75,0.75);

float sdPie( in vec2 p, in vec2 c, in float r ) {
  p.x = abs(p.x);
  float l = length(p) - r;
  float m = length(p-c*clamp(dot(p,c),0.0,r)); // c=sin/cos of aperture
  return max(l,m*sign(c.y*p.x-c.x*p.y));
}

//逆时针旋转
mat2 rotate2D(float theta){
  float sinTheta = sin(theta);
  float cosTheta = cos(theta);

  return mat2(cosTheta, -sinTheta,
  sinTheta, cosTheta);
}

mat2 rotate2DCW(float theta) {
  return rotate2D(-theta);
}

//[0, π]
float angleBetween(vec2 a, vec2 b) {
  return acos(clamp(dot(normalize(a), normalize(b)), -1.0, 1.0));
}

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);

  // st 中心在圆心，dist 为 [0, 0.5] 半径
  vec2 uv = materialInput.st - vec2(0.5);
  float dist = length(uv);

  //sdPie + 旋转 + 角度渐变，扇形、运动、渐变就分开了，
  //角度差 diff < sectorWidth，扇形、渐变、运动是一起的

  // head — 扫描前缘 [0,1)。time 已由 TS 归一化为一圈进度，勿再乘大秒数
  float head = fract(time + phase);
//  float head = fract(time);

  // glsl 里：每个片元算一次，逻辑集中
  float aperture=sectorWidth* czm_twoPi;
  //haldAperture=与y轴正方向的夹角,扇形按y轴正方向对称，所以sectorWidth/2.0=45°/2
  float haldAperture = aperture/2.0;
  //扇形右边的顶点坐标
  vec2 c = vec2(sin(haldAperture), cos(haldAperture));
  //在扇形外部，>0；在扇形边上，=0；在扇形内部，<0，在扇形内部，绝对值 = 到最近边界的距离，最近边界可能是：外圆弧、左径向边、右径向边，不是固定「到对称轴」。
  //即在扇形上，<=0；在扇形外，>0
  float rotationRadius=head*czm_twoPi;
  // 不是转扇形，也不是改 uv 变量：
  // 用旋转后的坐标 sectorPos = R * uv 去测「固定的」sdPie
  //顺时针旋转rotationRadius弧度，再顺时针旋转 czm_pi/2.0-haldAperture  弧度
  vec2 sectorPos=rotate2DCW(czm_pi/2.0-haldAperture)*rotate2DCW(rotationRadius)*uv;
  float distToPie=sdPie(sectorPos,c,0.5);

  //---------------------------------------------------------------
//  float alpha=mix(1.0,0.0,step(0.0,distToPie)); //用下面的“亮边外侧抗锯齿”代替这行，
  //---------------------------------------------------------------
  float aaPie = max(fwidth(distToPie), 0.002);
  float mask = 1.0 - smoothstep(0.0, aaPie, distToPie);  // 软进出

  float trail = 0.0;
  if (distToPie <= aaPie && length(sectorPos) >= 1e-5) {
    float radius = angleBetween(c, sectorPos);
    trail = 1.0 - clamp(radius / aperture, 0.0, 1.0);
  }

 float alpha = trail * mask;   // 不要再用 step 那行
  // 然后：alpha = max(alpha, rim);
//---------------------------------------------------------------

  //法一
//  vec2 headPos=vec2(0.5,0);
//  headPos=rotate2DCW(rotationRadius)*headPos;
  //uv 转了多少，亮边就要反着转多少
//  headPos = rotate2D(rotationRadius) * headPos;

  //法二
  //0在外部，1在内部
//  float isInSector=1.0-step(0.0,distToPie);
//  if(distToPie<=0.0){
//    vec2 headPos=vec2(0.5,0);
////    headPos=rotate2DCW(rotationRadius)*headPos;
//      headPos = rotate2D(rotationRadius) * headPos;
//    float radiusBetweenHead=angleBetween(headPos,uv);
//    //[0,1]
//    float radiusBetweenHeadNormalized=radiusBetweenHead/aperture;
//    alpha=1.0-radiusBetweenHeadNormalized;
//  }

  //法三：推荐
  // 扇外根本不算，两路逻辑差很多（一边算、一边不算） 用if
  if (distToPie <= 0.0 && length(sectorPos)>=1e-5) {
    // sectorPos 里扇形已固定，直接量局部角，sectorPos坐标就是sector以y轴正方向对称
    float radius=angleBetween(c,sectorPos);
    alpha=1.0-radius/aperture;
  }

  //distance(vec1,vec2)
  //length(vec)
  float r=length(uv);
  float borderWidth=0.02;
  float distToBorder=0.5-borderWidth;

  float borderOuterToR=0.005;
  float borderOuter=0.5-borderOuterToR;//0.495
  float borderInner=0.5-borderOuterToR-borderWidth;//0.475

  float aa=max(fwidth(distToBorder),0.002);

  float alphaOuter=1.0-smoothstep(borderOuter-aa,borderOuter+aa,r);
  float alphaInner=smoothstep(borderInner-aa,borderInner+aa,r);

  float rim = alphaOuter * alphaInner;
  alpha = max(alpha, rim);

//  alpha=mix(alpha,1.0,step(distToBorder,r));

  //法三的if->step版本：
//  float inside = 1.0 - step(0.0, distToPie);
//  float farEnough = step(1e-5, length(sectorPos));
//  float radius = angleBetween(c, sectorPos);  // 圆心时结果无效，但下面乘 0
//  float trail = 1.0 - clamp(radius / aperture, 0.0, 1.0);
//  // 扇内且离圆心够远：用 trail；否则：扇内圆心用 1，扇外用 0
//  alpha = inside * mix(1.0, trail, farEnough);



  float axisWidth=0.01;
  //y轴
  //[-0.5,-0.05]=color,[-0.05,0.5]=yellow
//  vec3 finalColor=mix(color.rgb,yellow,step(-axisWidth,uv.s));
//  finalColor=mix(finalColor,color.rgb,step(axisWidth,uv.s));
  //x轴
//  finalColor=mix(color.rgb,yellow,step(-axisWidth,uv.t));
//  finalColor=mix(finalColor,color.rgb,step(axisWidth,uv.t));

  //上面的改进方法
//  float onYAxis = 1.0 - step(axisWidth, abs(uv.x)); // 竖线：|x| 小
//  float onXAxis = 1.0 - step(axisWidth, abs(uv.y)); // 横线：|y| 小
//  float onAxis = max(onXAxis, onYAxis);
//  vec3 finalColor = mix(color.rgb, yellow, onAxis);

  material.diffuse = color.rgb;
  material.alpha = alpha;



//  // CircleGeometry 的 st 为 [0,1] 方形域，超出圆盘透明
//  if (dist > 0.5) {
//    material.alpha = 0.0;
//    return material;
//  }
//
//  float r = dist * 2.0;
//  float aa = max(fwidth(r), 0.002);
//
//  // 外缘描边（替代 GroundPolyline outline）
//  float rim = 1.0 - smoothstep(1.0 - aa * 2.0, 1.0, r);
//  rim *= rimStrength * (1.0 + highlight * 0.35);
//
//  //第 1 步：angle=[0, 1) — 这个像素在圆上的「方位」
  //1.1 atan(uv.y, uv.x)=[0,π]∪[-π,0]
  //1.2 atan(uv.y, uv.x)/czm_twoPi=弧度 → 占一圈的比例，范围约 (-0.5, 0.5]。
  //1.3 + 0.5=把 0 点从 +X 平移到别处（常见是让 +Y 或「上」≈ 0），范围约 (0, 1]。
  //1.4 + phase=每个雷达加随机偏移，100 个雷达不会同步扫。
  //1.5 fract(...)=折到 [0, 1)，即整圈归一化方位：
  //0 ─────────────────────────────→ 1
  //↑                              ↑
  //同一点（360° = 0°）
//  float angle = fract(atan(uv.y, uv.x) / czm_twoPi + 0.5 + phase);
  //          +y  0.75
  //           |
  //-x 0  -----+----- +x 0.5   （0 和 ~1 是同一条径向线）
  //           |
  //          -y  0.25

  //第 2 步：head — 扫描前缘现在在哪,逆时针方向，位置与时间time有关
  //speed=圈/秒
  //time * speed=转了多少「圈」（可 >1）
  //fract(...) 只保留小数部分 → [0, 1)
  //例：speed = 0.125（8 秒一圈）
  //t=0s  → head=0
  //t=4s  → head=0.5  （半圈）
  //t=8s  → head=0    （一圈，回到起点）
//  float head = fract(time * speed);

//第 3 步：diff — 像素相对前缘「落后多少」
  //核心公式。diff = 从扫描前缘 head 沿扫描方向到 angle 的角距（归一化到 [0,1)）。
//  float diff = fract(angle - head + 1.0);
//
//  // 扫描扇区：前缘最亮，扇内拖尾渐隐
//  float scan = 0.0;
//  if (diff < sectorWidth) {
//    float t = diff / sectorWidth;
//    scan = mix(1.0, 0.05, t * t);
//  }
//
//  float body = baseAlpha + scan * 0.55;
//  float alpha = clamp(body + rim, 0.0, 1.0) * color.a;
//
//  material.diffuse = color.rgb * (1.0 + highlight * 0.08);
//  material.alpha = alpha;
  return material;
}
