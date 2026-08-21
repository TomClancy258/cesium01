varying vec2 vUv;

uniform vec4 color1;
uniform vec4 color2;

varying vec3 vColor;

void main() {
    //    gl_FragColor = vec4(1.0,1.0, 1.0, 1.0);
    //从左到右：黑（全0）到白（全1）
    //    gl_FragColor = vec4(vUv.x,vUv.x, vUv.x, 1.0);
    //mix(a,b,t)获得a到b之间的线性插值t，即a+t*(b-a)，t 就是插值占比（权重）
    //    eg:
    //mix(10.0, 20.0, 0.0) -> 10.0
    //mix(10.0, 20.0, 0.25) -> 12.5
    //mix(10.0, 20.0, 0.75) -> 17.5
    //mix(10.0, 20.0, 1.0) -> 20.0
    //    gl_FragColor = mix(
    //        vec4(0.0,0.0, 0.0, 1.0),
    //        vec4(1.0,1.0, 1.0, 1.0),
    //        vUv.x
    //    );

    //从左到右：白（全1）到黑（全0）
    //    gl_FragColor = vec4(1.0-vUv.x,1.0-vUv.x, 1.0-vUv.x, 1.0);
    //    gl_FragColor = mix(
    //        vec4(1.0,1.0, 1.0, 1.0),
    //        vec4(0.0,0.0, 0.0, 1.0),
    //        vUv.x
    //    );

    //从左到右：红到绿
    //gl_FragColor = mix(
    //    vec4(1.0,0.0, 0.0, 1.0),
    //    vec4(0.0,1.0, 0.0, 1.0),
    //    vUv.x
    //);

    //uniform传值
//    gl_FragColor = mix(
//        color1,
//        color2,
//        vUv.x
//    );

    gl_FragColor=vec4(vColor,1.0);
}