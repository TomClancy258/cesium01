varying vec2 vUv;
uniform sampler2D diffuse;
uniform sampler2D overlay;
uniform vec4 tint;

void main() {
    vec4 diffuseSample=texture2D(diffuse,vUv);
    vec4 overlaySample=texture2D(overlay,vUv);
//    gl_FragColor=diffuseSample;
//    gl_FragColor=vec4(diffuseSample.r,0.0,0.0,1.0);
//    gl_FragColor=diffuseSample*tint;

    //果 = 底图 × 上层
    //  上层某通道是 1 → 底图该通道不变
    //  上层是 0 → 结果变黑
    //  常见效果：暗化、滤色感、用第二张图(上层)当“遮罩/染色”
//    gl_FragColor=diffuseSample*overlaySample;

    //按透明度叠图：用 overlay 的 alpha 决定盖多少底图
    //  overlay.w（alpha）= 0 → 全看底图
    //  = 1 → 全看上层
    //  中间 → 半透明叠在一起
    //  有透明通道的 PNG 盖在 JPG 上，一般用这种。
    gl_FragColor=mix(diffuseSample,overlaySample,overlaySample.a); //rgba=xyzw，这里写w和a是一样的

//    vec2 vUv2=vUv*vec2(2.0,2.0);
//    vec2 vUv2=vUv*vec2(-1.0,-1.0);
//    diffuseSample=texture2D(diffuse,vUv2);
//    gl_FragColor=diffuseSample;
}