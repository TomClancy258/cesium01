varying vec2 vUv;
uniform sampler2D diffuse;
uniform float offset;
uniform float colorVal;

uniform vec2 resolution;

float inverseLerp(float v, float minValue, float maxValue) {
    return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
}

vec3 red=vec3(1.0,0.0,0.0);
vec3 green=vec3(0.0,1.0,0.0);
vec3 blue=vec3(0.0,0.0,1.0);
vec3 yellow=vec3(1.0,1.0,0.0);

vec3 black=vec3(0.0,0.0,0.0);
vec3 white=vec3(1.0,1.0,1.0);
vec3 gray=vec3(0.75,0.75,0.75);

void main() {
    //中间大片圆白，往四周逐渐暗淡
    //不改变坐标系

    //length(vec2/3/4)求向量长度；参数必须是向量
    //distanceFromCenter=[0,根号0.5≈0.7]，中间黑0四周白1
    float distanceFromCenter=length(vUv-0.5);
    //vignette=[0.3,1]，反转，即中间白1四周黑0
    float vignette=1.0-distanceFromCenter;
    //把中间的白色圈扩大，并把中间灰度往亮拉。
    //白圈变大   ✅ vignette ≥ 0.8 都变成 1
    //中间也更亮 ✅ 0~0.8 之间沿 S 曲线上抬（例如 0.5 → ~0.84）
    //中心更亮   ❌ 中心本来就是 1，还是 1
    //在 0~0.8 之间平滑插到 (3-0/8-0=3/8)~1
    //【再把3/8计算来≈/~0.32即result】，[~0.32 … S曲线 … 1.0 … 1.0]，大于 0.8 的直接钳成 1。
    vignette=smoothstep(0.0,0.8,vignette);
    //整体线性增亮(线性：变化匀速，像直线 y = kx + b)
    vignette=remap(vignette,0.32,1.0,0.6,1.0);

    // 方案 A（教程味）
    //第一个参数和上一行的最小值0.3相同，这里左边的vignette就变为[0.0,s曲线,1.0]且大于0.8的直接钳成1了
    //但：
    //✅ 白圈变大：≥ 0.8 仍是 1
    //❌ 「0.5 → ~0.84」：不成立；0.5 会变成 ~0.35 【这个变了】
    //更准确的说法：靠近 0.8 的会被拉高，靠近 0.3 的会被压暗
//    vignette=smoothstep(0.3, 0.8, vignette);
//    vignette=remap(vignette, 0.0, 1.0, 0.3, 1.0); //第二个参数inMin也可以写成0.0了

//    gl_FragColor=vec4(vec3(vignette),1.0);

    //8*8的棋盘
//    vec3 cell=fract(vec3(vUv.x,vUv.y,0.0)*8.0);
//    gl_FragColor=vec4(cell,1.0);

    //10*10的棋盘
    vec2 cell=fract(vUv*10.0);
//    vec2 cell=fract(vUv * resolution / 100.0);
    //原点在单元格中心
    vec2 centerCell=cell-0.5;
    vec2 absCenterCell=abs(centerCell);
//    gl_FragColor=vec4(absCenterCell,0.0,1.0);

    //第四象限里，在y=x轴上方的区域，从左到右由0.5白到0黑；在下方的区域，从下到上由0.5白到0黑
    float fareastDistToAxis=max(absCenterCell.x,absCenterCell.y);

    //颜色反转变为从外到内部原点由0黑到0.5白=>*2=[0,1]
    float reverseNearestDistToAxis=(0.5-nearestDistToAxis)*2.0;

    //单元格有黑0边,reverseNearestDistToAxis<0.05则return 0，否则return 1
    float borderColor=step(0.05,reverseNearestDistToAxis);

    //把除了边的内部全变为gray：从cell外到中心原点，borderColor黑0边，则取black；往中心原点走全是1，则为gray
    vec3 cellColor=mix(black,gray,borderColor);

    //centerCoordSystem坐标系原点在uv坐标的(0.5,0.5)
    vec2 centerCoordSystem=vUv-0.5;
    //centerCoordSystem坐标系的y轴
    if(abs(centerCoordSystem.x-0.0)<=0.005){
        cellColor=blue;
    }
    //centerCoordSystem坐标系的x轴
    if(abs(centerCoordSystem.y-0.0)<=0.005){
        cellColor=blue;
    }
    //centerCoordSystem坐标系的y=x函数图像
    if(abs(centerCoordSystem.y-centerCoordSystem.x)<=0.005){
        cellColor=yellow;
    }
    //    float functionX=smoothstep(0.0,0.01,abs(centerCoordSystem.y-centerCoordSystem.x));
    //    cellColor=mix(yellow,cellColor,functionX);

//    if(abs(centerCoordSystem.y-abs(centerCoordSystem.x))<=0.005){
//        cellColor=red;
//    }
        float functionX=smoothstep(0.0,0.01,abs(centerCoordSystem.y-abs(centerCoordSystem.x)));
        cellColor=mix(red,cellColor,functionX);

    gl_FragColor=vec4(cellColor,1.0);
}
