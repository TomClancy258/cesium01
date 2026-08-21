varying vec2 vUv;
uniform sampler2D diffuse;
uniform float offset;
uniform float colorVal;

void main() {
    // 老式电视机上的条纹
    // float vStripeY = sin(vUv.y * 200.0 + offset);
    // vec4 diffuseSample = texture2D(diffuse, vUv);
    // vec4 overlayStripe = vec4(vec3(vStripeY), 1.0);
    // gl_FragColor = diffuseSample * overlayStripe;

    // colorVal：1s 0→1，再 1s 1→0（周期 2s）→ 红↔绿
//    gl_FragColor = mix(
//        vec4(1.0, 0.0, 0.0, 1.0),
//        vec4(0.0, 1.0, 0.0, 1.0),
//        colorVal
//    );

    //8*8的棋盘
    vec3 color=fract(vec3(vUv.x,vUv.y,0.0)*8.0);
    gl_FragColor=vec4(color,1.0);
}
