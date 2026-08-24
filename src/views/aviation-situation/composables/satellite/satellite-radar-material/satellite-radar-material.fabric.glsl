uniform vec4 color;
uniform float time;
uniform float repeat;
uniform float offset;
uniform float thickness;

//Cesium 每个片元调用一次
// materialInput：该片元的 st、法线等
// czm_getMaterial 返回 czm_material材质结构体（含默认 diffuse/alpha/specular 等） 给 Cesium 做光照/混合，不是该片元的最终颜色
//就是返回该片元的材质结构体
czm_material czm_getMaterial(czm_materialInput materialInput) {
  //material保存可用于照明的材质信息。由所有 czm_getMaterial 函数返回。
  //拿默认材质（含默认 diffuse/alpha/specular 等），后面只改需要的字段。
  czm_material material = czm_getDefaultMaterial(materialInput);

  //纹理坐标，st.s、st.t轴的范围是[0,1]
  //该片元对应的st坐标，比如st.s为.1，st.t为.4
  vec2 st = materialInput.st;

  //spacing环间距
  //repeat = 30 → spacing ≈ 0.033
  // 在径向 [0,1] 上大约分 repeat 段
  float spacing = 1.0 / repeat;

  //radial径向:到 ST 中心的距离
  //算片元 st 到 (0.5, 0.5) 的欧氏距离
  // 同一距离 → 同一“圈”（在 ST 里是同心圆，贴到锥面上是弯带）
  float radial = distance(st, vec2(0.5));

  // m:相位 + 动画
  //部分                  作用
  // radial              在哪一圈
  // offset              整体相位
  // - time              随时间减小 → 环在动
  // mod(..., spacing)   折回到 [0, spacing)，形成周期重复
  float m = mod(radial + offset - time, spacing);

  //alpha:环的明暗/透明
  //step(edge, x)：x >= edge 为 1，否则为 0。
  //
  //  （1）spacing * (1.0 - thickness)：每条环里“透明段”的上界
  //  （2）thickness 大 → 不透明环更宽
  //  （3）thickness 小 → 环更细、透明缝更多
  //示意（一个周期内）：
  // m:     0 --------|████████|-------- spacing
  //                  ↑ 透明    ↑ 不透明环
  //            step 阈值 = spacing*(1-thickness)
  float alpha = step(spacing * (1.0 - thickness), m);

  //写回材质
  material.diffuse = color.rgb; // 不透明部分用这个颜色，【RGB】
  material.alpha = alpha * color.a;  // 透明缝 alpha≈0，环上 alpha≈color.a，【环可见、缝透明 → 雷达扫描环效果】
  return material;
}