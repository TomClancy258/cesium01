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

    //radial径向:到 ST 中心的距离
    //算片元 st 到 (0.5, 0.5) 的欧氏距离
    // 同一距离 → 同一“圈”（在 ST 里是同心圆，贴到锥面上是弯带）
    //[0,0.5]
    float radial = distance(st, vec2(0.5));
    //[0,1.0]
    float xAxis=remap(radial,0.0,0.5, 0.0,1.0);

    //repeat个[0,1)
    float spacingXAixs=fract((xAxis-time)*repeat);
    //<(1-thickness)的return 0黑，>=(1-thickness)的return 1白，把光圈置为该端的后面，这样更好理解，别置为前面
    //  float leftEdge=1.0-thickness;
    //  float rightEdge=1.0;

    float leftEdge = 0.5;
    float rightEdge = 0.5 + thickness;

    //  float spacingXAixsRing=step(leftEdge,spacingXAixs);

    //spacingXAixs==1.0处会有很细的光圈
      float aa=max(fwidth(spacingXAixs),0.002);

    //接缝硬切，最容易锯齿
//    if(min(spacingXAixs, 1.0 - spacingXAixs) < 0.1){
        //接缝硬切，最容易锯齿
//        aa=0.0;
        //接缝若还有残留，略软
//        aa=0.002;
        //这俩抗锯齿效果差不多
//    }

    //这样写死可以解决
    //在折回附近，相邻像素 spacingXAixs 从 ~1 变 ~0，fwidth 会 非常大 → aa 巨大 → smoothstep 在接缝处算出 不该有的 alpha → 细亮圈。
    //固定 aa = 0.002 后，折回处不再被放大，细线就没了。但是不能自适应抗锯齿，效果差
    //推荐还是光圈置后面，只做lower即左边的抗锯齿，upper右边不作fade抗锯齿，因为光圈会变细
//    float aa=0.002;
    // 左：缝 → 环
    //lower在[0,leftEdge-aa)=0,[leftEdge-aa,leftEdge+aa]=[0,1],[leftEdge + aa,1)=1
    float lower = smoothstep(leftEdge - aa, leftEdge + aa, spacingXAixs);
    // 右：环 → 缝（段末 fade out）
    //但如果做了右边fade抗锯齿，则光圈会变细些
    //upper在[0,rightEdge-aa)=0,[rightEdge-aa,rightEdge+aa]=[0,1],[rightEdge + aa,1)=1
    float upper = 1.0 - smoothstep(rightEdge - aa, rightEdge+aa, spacingXAixs);

    //画个图就知道为啥*了
    float alpha=lower*upper;

    //直接透明，无所谓 AA（推荐这个消除这跟很细的光圈）
    //[0.9,1.0]和[0.0,1.1]的alpha都=0，即去污渍
    //spacingXAixs∈[0,0.1)则zero=0,∈[0.1,1]则zero=1
    float killNearZero =step(0.1,spacingXAixs);
    alpha=mix(0.0,alpha,killNearZero);

    //spacingXAixs<0.9 return 1-0=1; >=0.9 return 1-1=0;
    float killNearOne =1.0-step(0.9,spacingXAixs);
    alpha=mix(0.0,alpha,killNearOne);

    //上面俩等价于：
    // 离 0 或 1 都 < 0.1 → 杀掉
//    float keep = step(0.1, min(spacingXAixs, 1.0 - spacingXAixs));
//    alpha *= keep;

    // → [0, 0.1) 和 (0.9, 1] 都算近
    //min(spacingXAixs, 1.0 - spacingXAixs) < 0.1
//    if(1.0-spacingXAixs<0.1){
//        alpha=0.0;
//    }
//else if(spacingXAixs<0.1){
//        alpha=0.0;
//    }

    //写回材质
    material.diffuse = color.rgb; // 不透明部分用这个颜色，【RGB】
    material.alpha = alpha*color.a;
    return material;
}