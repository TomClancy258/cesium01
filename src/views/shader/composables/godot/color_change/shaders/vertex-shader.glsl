varying vec2 vUv;

void main() {
  vUv = uv;
  // 均匀呼吸改由 JS plane.scale 驱动，顶点保持原 position
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
