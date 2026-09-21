varying vec2 vUv;
uniform float u_pi;
uniform float u_time;
uniform float u_rotX;
uniform float u_rotY;
uniform float u_rotZ;
uniform float u_scale;
uniform vec2 u_pivot;

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
  float twoPi=2.0*u_pi;
  mat3 rotX=rotateX(u_rotX*twoPi);
  mat3 rotY=rotateY(u_rotY*twoPi);
  mat3 rotZ=rotateZ(u_rotZ*twoPi);
  mat3 scale=scale2D(u_scale);

  //矩阵从右往左作用在点上
  mat3 rot=rotX*rotY*rotZ*scale;
  vec3 v = vec3(position.xy, 0.0) - vec3(u_pivot, 0.0);
  v = rot * v;
  //实际顺序是：
  //
  //scale * v：点还在平面上，x、y 一起变大，z 仍是 0。
  //rotZ、rotY、rotX：把这个已经变大的平面整个转走。掀起来之后，变大过的 x、y 会分到新的 z 上，所以厚度和大小一起转，形状还是原来的比例。
  //反过来 scale * rotX * rotY * rotZ * v 是先转再缩放：
  //
  //rotateX 之后，原来的 y 有一部分进了 z。
  //scale2D 只乘 x 和 y，不乘 z。已经转到 z 上的那截不会变大，还留在平面上的才会变大。
  //结果就是斜着的那一侧被压扁。所以要「先在平面里放大，再掀起来」，缩放必须写在最右边。
  v.xy += u_pivot;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(v, 1.0);
}
