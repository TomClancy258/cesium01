varying vec2 vUv;
uniform float u_pi;
uniform float u_time;
uniform float u_incline;

uniform float u_densityY;
uniform float u_densityX;

uniform float u_frequencyY;
uniform float u_frequencyX;

void main() {
  vUv = uv;
  vec3 pos=position;
//  float u_time=0.25;
  float twoPi=2.0*u_pi;
  float offset=u_time*twoPi;
  pos.y+=sin(uv.x*u_densityY+offset)*u_frequencyY*uv.x;
  pos.x+=cos(uv.y*u_densityX+offset)*u_frequencyX*uv.x;

  pos.x+=uv.y*u_incline;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
