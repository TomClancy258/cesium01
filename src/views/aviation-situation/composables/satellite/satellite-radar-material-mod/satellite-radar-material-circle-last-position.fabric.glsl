uniform vec4 color;
uniform float time;
uniform float repeat;
uniform float offset;
uniform float thickness;

float inverseLerp(float v, float minValue, float maxValue) {
    return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
}

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
    //[0,0.033]
    float spacing = 1.0 / repeat;

    //radial径向:到 ST 中心的距离
    //算片元 st 到 (0.5, 0.5) 的欧氏距离
    // 同一距离 → 同一“圈”（在 ST 里是同心圆，贴到锥面上是弯带）
    //[0,1]
    float radial = distance(st, vec2(0.5));

    //repeat个[0,spacing)的x坐标轴
    float spacingX=mod(radial-time,spacing);

    //repeat个[0,1)
    float spacingXAixs=remap(spacingX,0.0,spacing, 0.0,1.0);
    //<(1-thickness)的return 0黑，>=(1-thickness)的return 1白，把光圈置为该端的后面，这样更好理解，别置为前面
    //  float leftEdge=1.0-thickness;
    //  float rightEdge=1.0;

    float leftEdge = 0.5;
    float rightEdge = 0.5 + thickness;

    //  float spacingXAixsRing=step(leftEdge,spacingXAixs);

    //spacingXAixs==1.0处会有很细的光圈
    //  float aa=max(fwidth(spacingXAixs),0.002);
    //这样写死可以解决
    //在折回附近，相邻像素 spacingXAixs 从 ~1 变 ~0，fwidth 会 非常大 → aa 巨大 → smoothstep 在接缝处算出 不该有的 alpha → 细亮圈。
    //固定 aa = 0.002 后，折回处不再被放大，细线就没了。但是不能自适应抗锯齿，效果差
    //推荐还是光圈置后面，只做lower即左边的抗锯齿，upper右边不作fade抗锯齿，因为光圈会变细
    float aa=0.002;
    // 左：缝 → 环
    float lower = smoothstep(leftEdge - aa, leftEdge + aa, spacingXAixs);
    // 右：环 → 缝（段末 fade out）
    //但如果做了右边fade抗锯齿，则光圈会变细些
    float upper = 1.0 - smoothstep(rightEdge - aa, rightEdge+aa, spacingXAixs);

    float alpha=lower*upper;
    //写回材质
    material.diffuse = color.rgb; // 不透明部分用这个颜色，【RGB】
    material.alpha = mix(0.0,color.a,alpha);  // 透明缝 alpha≈0，环上 alpha≈color.a，【环可见、缝透明 → 雷达扫描环效果】
    return material;
}