varying vec2 vUv;
uniform sampler2D grass01;

void main() {
  vec4 sampleColor = texture(grass01, vUv);
  float alpha=sampleColor.a;
//  float alpha=1.0;
  gl_FragColor = vec4(sampleColor.rgb, alpha);
}
