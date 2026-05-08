import { ShallowRef } from 'vue'
import * as Cesium from "cesium"
import airplane01Jpg from "@/assets/img/airplane/jpg/airplane01.jpg"

export function applyingCustomShader(viewer:ShallowRef<Cesium.Viewer>){
  const customShader = new Cesium.CustomShader({
    // Any custom uniforms the user wants to add to the shader.
    // these can be changed at runtime via customShader.setUniform()
    // 用户想要添加到着色器的任何自定义统一变量。// 这些可以在运行时通过customShader.setUniform()更改。
    uniforms: {
      u_time: {
        value: 0, // initial value
        type: Cesium.UniformType.FLOAT
      },
      // Textures can be loaded from a URL, a Resource, or a TypedArray.
      // See the Uniforms section for more detail
      // 纹理可以从 URL、资源或 TypedArray 中加载。// 更多详情请参见 Uniforms 部分
      u_externalTexture: {
        value: new Cesium.TextureUniform({
          url: airplane01Jpg
        }),
        type: Cesium.UniformType.SAMPLER_2D
      }
    },
    // Custom varyings that will appear in the custom vertex and fragment shader
    // text.
    // 自定义的varyings，将出现在自定义顶点和片元着色器文本中。
    varyings: {
      v_customTexCoords: Cesium.VaryingType.VEC2
    },
    // configure where in the fragment shader's materials/lighting pipeline the
    // custom shader goes. More on this below.
    // 配置自定义着色器在片元着色器的材质/光照管线中的位置。更多内容见下文。
    mode: Cesium.CustomShaderMode.MODIFY_MATERIAL,
    // either PBR (physically-based rendering) or UNLIT depending on the desired
    // results.
    // 根据所需结果选择 PBR（基于物理的渲染）或不加光照。
    lightingModel: Cesium.LightingModel.PBR,
    // Force the shader to render as transparent, even if the primitive had
    // an opaque material
    // 强制着色器以透明方式渲染，即使原始图元具有不透明材质
    translucencyMode: Cesium.CustomShaderTranslucencyMode.TRANSLUCENT,
    // Custom vertex shader. This is a function from model space -> model space.
    // VertexInput is documented below
    // 自定义顶点着色器。这是一个从模型空间到模型空间的函数。
    // VertexInput的说明见下文
    vertexShaderText: `
    // IMPORTANT: the function signature must use these parameter names. This
    // makes it easier for the runtime to generate the shader and make optimizations.
    // 重要提示：函数签名必须使用这些参数名称。这使运行时更容易生成着色器并进行优化。
    void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
        // code goes here. An empty body is a no-op.
        //代码在这里。空荡荡的身体是不允许的。
    }
  `,
    // Custom fragment shader.
    // FragmentInput will be documented below
    // Regardless of the mode, this always takes in a material and modifies it in place.
    // 自定义片段着色器。// 片段输入将在下方文档中说明// 无论模式如何，这始终接收一个材质并在原地修改它。
    fragmentShaderText: `
    // IMPORTANT: the function signature must use these parameter names. This
    // makes it easier for the runtime to generate the shader and make optimizations.
    // 重要提示：函数签名必须使用这些参数名称。这使运行时更容易生成着色器并进行优化。
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        // code goes here. e.g. to set the diffuse color to a translucent red:
        // 代码在此处。例如，将漫反射颜色设置为半透明的红色:
        material.diffuse = vec3(1.0, 0.0, 0.0);
        material.alpha = 0.5;
    }
  `,
  });

  const customShader02 = new Cesium.CustomShader({
    // Varying is declared here
    varyings: {
      v_selectedColor: Cesium.VaryingType.VEC4,
    },
    // User assigns the varying in the vertex shader
    vertexShaderText: `
    void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
        float positiveX = step(0.0, vsOutput.positionMC.x);
        v_selectedColor = mix(
            vsInput.attributes.color_0,
            vsInput.attributes.color_1,
            vsOutput.positionMC.x
        );
    }
  `,
    // User uses the varying in the fragment shader
    fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        material.diffuse = v_selectedColor.rgb;
    }
  `,
  });

  const addBuildingA = async () => {
    // 方法1：使用 Cesium3DTileset（推荐）
    const tileset = await Cesium.Cesium3DTileset.fromUrl(
      'model/3dtileset/build/tileset.json',
      {
        customShader: customShader,
      }
    );
    viewer.value.scene.primitives.add(tileset);

    viewer.value.zoomTo(tileset);
  }

  addBuildingA()
}
