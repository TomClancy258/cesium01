varying vec2 vUv;
varying vec2 vLocalPos;
varying vec3 v_worldPos;
uniform float u_pi;
uniform vec2 u_roleRootPosition;
uniform float u_maxDistance;
uniform float u_minDistance;
uniform float u_maxBend;

mat3 rotateX(float a) {
  float c = cos(a), s = sin(a);
  return mat3(vec3(1.0, 0.0, 0.0), vec3(0.0, c, s), vec3(0.0, -s, c));
}
mat3 rotateY(float a) {
  float c = cos(a), s = sin(a);
  return mat3(vec3(c, 0.0, -s), vec3(0.0, 1.0, 0.0), vec3(s, 0.0, c));
}
mat3 rotateZ(float a) {
  float c = cos(a), s = sin(a);
  return mat3(vec3(c, s, 0.0), vec3(-s, c, 0.0), vec3(0.0, 0.0, 1.0));
}

void main() {
  vUv = uv;
//position 就是几何体做完 geometry.translate(0, GRASS_HEIGHT / 2, 0) 之后，写进顶点缓冲里的局部坐标。
  // InstancedMesh 挂在 ground 上时，instanceMatrix 平移即草根在地面局部坐标
  vec2 grassRootPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xy;
  float distToRole = distance(grassRootPos, u_roleRootPosition);

  //dist>u_maxDistance=0; u_minDistance<=dist<=u_maxDistance=[0,1]; dist<u_minDistance=1
  //「越近越弯」的权重，bend=弯曲
  float bendWeight =clamp((u_maxDistance - distToRole) / (u_maxDistance - u_minDistance),0.0,1.0);
//    bendWeight  = smoothstep(0.0, 1.0, bendWeight  * 0.5);
    vec2 toRole = u_roleRootPosition - grassRootPos;

//  float isCoincident=step(length(toRole),0.0001);
  //无论isCoincident是多少，glsl仍会先算前俩参数
//  float rotationAngle=mix(bendWeight *u_maxBend*normalize(toRole).x,0.0,isCoincident);

  float rotationAngle=length(toRole)>0.0001?bendWeight *u_maxBend*normalize(toRole).x:0.0;

  vec3 bentLocalPos=rotateZ(rotationAngle)*position;

  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(bentLocalPos, 1.0);
//  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * localPos;
}
