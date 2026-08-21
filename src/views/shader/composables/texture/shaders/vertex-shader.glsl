varying vec2 vUv;
attribute vec3 simondevColours;
varying vec3 vColor;

void main() {
    vUv = uv;
    vColor=simondevColours;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}