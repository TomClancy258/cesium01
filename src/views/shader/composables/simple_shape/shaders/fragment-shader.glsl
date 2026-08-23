varying vec2 vUv;
uniform sampler2D diffuse;
uniform float offset;
uniform float colorVal;
uniform float zero2One;

const float PI = 3.14159265359;

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
vec3 pink=vec3(1.0, 0.7529, 0.7961);

vec3 black=vec3(0.0,0.0,0.0);
vec3 white=vec3(1.0,1.0,1.0);
vec3 gray=vec3(0.75,0.75,0.75);

//当前点 p 到 半径radius的圆（圆心在原点） 的最短距离（像素）
float sdfCircle(vec2 pixelPosition, float radius){
    return length(pixelPosition) - radius;
}

//当前点 p 到线段 a→b 的最短距离（像素）
float sdfLine(vec2 p, vec2 a, vec2 b){
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa,ba) / dot(ba, ba), 0.0, 1.0);

    return length(pa - ba * h);

}

float sdfBox(vec2 p, vec2 b){
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

//https://iquilezles.org/articles/distfunctions2d/
//r:该正六边形里面能存放的最大的圆的半径
float sdfHexagon( in vec2 p, in float r )
{
    const vec3 k = vec3(-0.866025404,0.5,0.577350269);
    p = abs(p);
    p -= 2.0*min(dot(k.xy,p),0.0)*k.xy;
    p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
    return length(p)*sign(p.y);
}

//逆时针旋转
mat2 rotate2D(float theta){
    float sinTheta = sin(theta);
    float cosTheta = cos(theta);

    return mat2(cosTheta, -sinTheta,
    sinTheta, cosTheta);
}

void main() {
    //先 abs 整张面，再 fract； 对折后再切； 9×9，中心格加倍。所以显示错误
    //10*10的棋盘，要先拆10份，再改变坐标系
    vec2 cell=fract(vUv*10.0);
    //坐标系范围[-0.5,0.5]
    vec2 cellCenterCoordSystem=cell-0.5;
    //坐标系范围[0.5,0,0.5]
    vec2 cellAbsCellCoordSystem=abs(cellCenterCoordSystem);


    //fareastDistToAxis由外0.5向中心原点0 再*2 = 由外1向中心原点0
    float fareastDistToAxis=max(cellAbsCellCoordSystem.x,cellAbsCellCoordSystem.y)*2.0;
    //由外0向中心原点1
    float reverseFareastDistToAixs=1.0-fareastDistToAxis;

    //四边为0.05宽的黑边0，中间全白1
    float color=step(0.05,reverseFareastDistToAixs);

    vec3 cellColor=mix(vec3(color),gray,color);

    vec2 centerCoordSystem=vUv-0.5;
    if(abs(centerCoordSystem.y-0.0)<=0.005){
        cellColor=blue;
    }

    //最不推荐
//    float functionX=smoothstep(0.0,0.01,abs(centerCoordSystem.y-0.0));
//    cellColor=mix(blue,cellColor,functionX);

//    cellColor=mix(blue,cellColor,step(0.005,abs(centerCoordSystem.y-0.0)));

//    float d = abs(centerCoordSystem.y);
//    cellColor = mix(blue, cellColor, smoothstep(0.005, 0.005 + fwidth(d), d));

    if(abs(centerCoordSystem.x-0.0)<=0.005){
        cellColor=blue;
    }

    //绘制r=0.1的圆
    float distToCenterCircle=sdfCircle(centerCoordSystem-vec2(-0.3,0.3),0.1);
    //step返回0则在r=0.1的圆内部，返回1则在圆边线和外部
    cellColor=mix(pink,cellColor,step(0.0,distToCenterCircle));

    //绘制vec2(0.1,0.3)->vec2(0.2,0.1)，宽0.004的线
    float distToLine=sdfLine(centerCoordSystem,vec2(0.1,0.3),vec2(0.2,0.1));
    if(distToLine<0.002){
        cellColor=pink;
    }

    //长0.4 宽0.2 的矩形的中心点从原点移动到(0.3,-0.4)
    float distToBox=sdfBox(centerCoordSystem-vec2(0.3,-0.3),vec2(0.2,0.1));
    if(distToBox<0.0){
        cellColor=pink;
    }

    float radian = remap(zero2One,0.0,1.0,0.0,2.0*PI);
    //2*2矩阵 * 2*1向量 =2*1向量，注意：尽量别反过来
    //先平移再旋转 R * (p - T)
    //p = T 时 p' = 0，中心钉在 T = (-0.3, -0.3)。旋转只绕这个中心转，六边形在原地打转。
    vec2 hexagonPos=rotate2D(radian)*(centerCoordSystem-vec2(-0.3,-0.3));
    //先旋转再平移 R * p - T
    //p' = 0 时 p = R⁻¹ * T。中心本身绕 坐标系原点 转，六边形会绕原点公转，同时自转。
//    vec2 hexagonPos=rotate2D(radian)*centerCoordSystem-vec2(-0.3,-0.3);
    float distToHexagon=sdfHexagon(hexagonPos,0.15);
    if(distToHexagon<0.0){
        cellColor=pink;
    }

    gl_FragColor=vec4(cellColor,1.0);
}
