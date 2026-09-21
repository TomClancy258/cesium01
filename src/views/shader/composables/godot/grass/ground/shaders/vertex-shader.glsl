varying vec2 vUv;
varying vec2 vLocalPos;
uniform float u_pi;
uniform float u_time;
varying vec3 v_worldPos;

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
mat3 translate(vec2 t) {
  return mat3(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(t, 1.0));
}
mat3 scale2D(float s) {
  return mat3(vec3(s, 0.0, 0.0), vec3(0.0, s, 0.0), vec3(0.0, 0.0, 1.0));
}
//上下区别就是：上面的没有放大z轴方向
mat3 scale_matrix(float scale){
  return mat3(vec3(scale,0,0),vec3(0,scale,0), vec3(0,0,scale));
}


void main() {
  vUv = uv;
  vLocalPos = position.xy;
  float twoPi=2.0*u_pi;
  vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  v_worldPos=worldPos;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
