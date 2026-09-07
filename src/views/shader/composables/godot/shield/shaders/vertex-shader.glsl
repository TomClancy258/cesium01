varying vec2 vUv;

uniform float u_time;
/** 径向呼吸幅度（本地坐标）；Godot 的 50.*0.1 是像素尺度，这里平面约 1×1，用很小的数 */
uniform float u_vertexPulse;

void main() {
  vUv = uv;

  // Godot: VERTEX += normalize(VERTEX) * 50. * sin(TIME) * 0.1;
  // Three: position 是本地坐标；先位移再进 MVP
  vec3 displaced = position;
  float len = length(position.xy);
  if (len > 1e-5) {
    displaced.xy += normalize(position.xy) * u_vertexPulse * sin(u_time);
  }
//      displaced.xy +=position.xy * ((sin(u_time)+2.0)/3.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
//  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}
