varying vec2 vUv;

void main() {
    //从左到右：1/4黑，3/4白
    //阶跃函数 step(edge,x)，即 if(x<edge)return 0;否则return 1
    //即超过某值时，就从0跳到1
    //    gl_FragColor=vec4(vec3(step(0.25,vUv.x)),1.0);


    //从左到右：由红线性变蓝
    //(线性)混合函数 mix(a,b,t)获得a到b之间的线性插值，即a+t*(b-a)，t 就是插值占比（权重）
    //    gl_FragColor=mix(
    //            vec4(1.0,0.0,0.0,1.0),
    //            vec4(0.0,0.0,1.0,1.0),
    //            vUv.x
    //    );

    //smoothstep(edge1,edge2,x) 比mix、InverseLerp更柔和
    //这只是中间一步 t，不是最终输出
    //t = (x - edge0) / (edge1 - edge0)   // x=0.3 → t=3/8
    // smoothstep 还要再做 S 形：【和类似的InverseLerp的区别，且前者要钳在 [0, 1]】
    //result = t * t * (3.0 - 2.0 * t)   // ≈ 0.32，不是 3/8
    //return result，即 n长度/m总长度 的百分比[0,1]

    //类似于InverseLerp(currentValue, minValue, maxValue),注：glsl无内置InverseLerp
    //即return (currentValue - minValue) / (maxValue - minValue);
    //eg：
    //InverseLerp(25.0, 0.0, 100.0) -> 0.25
    //InverseLerp(75.0, 0.0, 100.0) -> 0.75
    //InverseLerp(100.0, 0.0, 100.0) -> 1.0

    //由黑变白
//    gl_FragColor = vec4(vec3(smoothstep(0.0,1.0,vUv.x)),1.0);
    //由红边蓝
//    gl_FragColor = vec4(smoothstep(0.0,1.0,1.0-vUv.x),0.0,smoothstep(0.0,1.0,vUv.x) ,1.0);


    float difference= vUv.y-0.5;
    if(difference>0.01){
        gl_FragColor = mix(
                vec4(1.0,0.0,0.0,1.0),
                vec4(0.0,0.0,1.0,1.0),
                vUv.x
        );
    }else if(difference<-0.01){
        gl_FragColor = vec4(smoothstep(0.0,1.0,1.0-vUv.x),0.0,smoothstep(0.0,1.0,vUv.x),1.0);
    }else{
        gl_FragColor = vec4(1.0,1.0,1.0,1.0);
    }


    //clamp(a, minValue, maxValue)：
    //把 a 限制在 [minValue, maxValue] 里——太小抬到(返回)下限，太大压到(返回)上限，中间就原样返回。
    //eg:
    //clamp(-1,  0, 1) → 0    // 太小 → 下限
    //clamp(0.2, 0, 1) → 0.2  // 在范围内 → 原值
    //clamp(0.9, 0, 1) → 0.9
    //clamp(1.1, 0, 1) → 1    // 太大 → 上限

    //saturate(a) = 把 a 夹到 [0, 1]。注：它不是glsl内置函数
    //等价于：clamp(a, 0.0, 1.0)
    //eg：
    //saturate(-1)  0
    //saturate(0.2) 0.2
    //saturate(0.9) 0.9
    //saturate(1.1) 1

    //部分普通函数：
    //abs(x)
    //floor(x) 地板，往下舍去
    //ceil(x) 天花板，网上入
    //round(x) 最接近x的整数
    //fract(x) 取小数部分
    //mod(a,b) 取模

    //重映射：Remap(currentValue, inMin, inMax, outMin, outMax),注：glsl无内置remap
    //eg：
    //Remap(0.0, 0.0, 100.0, 5.0, 10.0) -> 5.0
    //Remap(50.0, 0.0, 100.0, 5.0, 10.0) -> 7.5 即50在0到100的占比映射到5到10之间的占比是7.5
    //Remap(100.0, 0.0, 100.0, 5.0, 10.0) -> 10.0


    //sqrt(x, y)
    //  • Square root of x
    //  • = x^y
    //注：sqrt 原生只有单参数 sqrt(x) 代表 √x，幂运算通用使用 pow(x,1/2)
    //
    //inversesqrt(x)
    //  • Inverse sqrt of x
    //  • = 1.0 / sqrt(x)
    //
    //pow(x, y)
    //  • Raises x to the power y
    //  • = xʸ
    //
    //exp(x)
    //  • Raises e to the power of x
    //  • = eˣ
    //
    //exp2(x)
    //  • Raises 2 to the power of x
    //  • = 2ˣ
    //
    //log(x)
    //  • Natural logarithm of x
    //
    //log2(x)
    //  • Base 2 logarithm of x


    //vec4 example = vec4(1.0, 2.0, 3.0, 4.0);
    //
    //vec2 v1 = example.xy; // => vec2(1.0, 2.0)
    //vec3 v2 = example.xyz; // => vec3(1.0, 2.0, 3.0)
    //vec3 v3 = example.rgb; // => vec3(1.0, 2.0, 3.0)

    //example.x = 0.0; // => example = vec4(0.0, 2.0, 3.0, 4.0)
    //example.xy = vec2(8.0, 9.0); // => example = vec4(8.0, 9.0, 3.0, 4.0)

    //vec3 someVector = ...
    //vec3 normal = ...
    //
    //// Calculates length of vector
    //float d = length(someVector);
    //即length(v)：求向量模长（长度）\(\sqrt{x^2+y^2+z^2}\)
    //distance(p0, p1) = length(p0 - p1)。即获得向量(p1->p0)的长度
    //
    //// Returns a normalized copy
    //vec3 nv = normalize(someVector);
    //即normalize(v)：归一化向量，得到模长 = 1 的单位向量
    //
    //// Calculates the dot product
    //float dp = dot(someVector, normal);
    //即dot(a,b)：点积（标量），常用于求夹角、光照衰减
    //
    //// Calculates cross product
    //vec3 cp = cross(someVector, normal);
    //即cross(a,b)：叉积（向量），生成垂直于两个输入向量的法线
    //
    //// Calculates reflection vector
    //vec3 rfl = reflect(someVector, normal);
    //即reflect(I,N)：反射向量，I 是入射向量，N 是法线（常用于镜面光照）
    //
    //// Calculates refraction vector
    //vec3 rfr = refract(someVector, normal);
    //即refract(I,N,eta)：折射向量（图上省略了第三个折射率参数 eta）
}

//连续、线性、平滑（柔和）
//词	     意思	                               例子
//连续        没有「跳一下」的断点，挨着画能连上           折线、S 曲线都算连续
//线性        变化匀速，像直线 y = kx + b              remap、mix、直线
//平滑/柔和    常指观感或拐弯处不突兀；数学上也可指导数连续   smoothstep 的 S 形