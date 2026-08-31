uniform sampler2D image;
uniform float time;

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);
  vec2 st = materialInput.st;
  st.s = fract((st.s+time)*23.0);
  vec4 texColor = texture(image, st);

  float alpha=max(0.1,texColor.a);

  material.diffuse = texColor.rgb;
  material.alpha = alpha;
  return material;
}
