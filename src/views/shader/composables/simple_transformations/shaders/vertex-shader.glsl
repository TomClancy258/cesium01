varying vec2 vUv;
uniform float offset;
uniform float colorVal;
uniform float zero2One;

float inverseLerp(float v, float minValue, float maxValue) {
    return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
}

mat3 rotateX(float radians) {
    float s = sin(radians);
    float c = cos(radians);
    return mat3(
    1.0, 0.0, 0.0,
    0.0, c,   -s,
    0.0, s,    c
    );
}

mat3 rotateY(float radians) {
    float s = sin(radians);
    float c = cos(radians);
    return mat3(
    c,   0.0, s,
    0.0, 1.0, 0.0,
    -s,  0.0, c
    );
}

mat3 rotateZ(float radians) {
    float s = sin(radians);
    float c = cos(radians);
    return mat3(
    c,  -s,  0.0,
    s,   c,  0.0,
    0.0, 0.0, 1.0
    );
}

const float PI = 3.14159265359;

void main() {
    vUv = uv;

    //position局部坐标
    vec3 localSpacePosition = position;
//    localSpacePosition.x+=colorVal;
//    localSpacePosition.y+=colorVal;
//    localSpacePosition.z+=colorVal;

    // zero2One: 0→1 映射到 0→2π（一整圈）；等价于 zero2One * 2.0 * PI
    float angle = remap(zero2One, 0.0, 1.0, 0.0, 2.0 * PI);
//    localSpacePosition = rotateY(angle) * localSpacePosition;

    //gl_Position裁剪坐标，不是世界坐标（PVM）
    gl_Position = projectionMatrix * modelViewMatrix * vec4(localSpacePosition, 1.0);
}