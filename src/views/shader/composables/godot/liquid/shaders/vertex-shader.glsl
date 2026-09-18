varying vec2 vUv;

void main() {
  vUv = uv;
  float x=position.x+sin(position.y*10.0);
  vec3 pos=vec3(x,position.y,position.z);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
