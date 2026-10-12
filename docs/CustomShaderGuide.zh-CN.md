# `CustomShader` 文档

> 原文地址：<https://github.com/CesiumGS/cesium/blob/main/Documentation/CustomShaderGuide/README.md>

## 构造函数

```js
const customShader = new Cesium.CustomShader({
  // 用户希望添加到着色器中的任意自定义 uniform。
  // 这些 uniform 可以在运行时通过 customShader.setUniform() 修改
  uniforms: {
    u_time: {
      value: 0, // 初始值
      type: Cesium.UniformType.FLOAT
    },
    // 纹理可以从 URL、Resource 或 TypedArray 加载。
    // 详见下文的 Uniforms 章节
    u_externalTexture: {
      value: new Cesium.TextureUniform({
        url: "http://example.com/image.png"
      }),
      type: Cesium.UniformType.SAMPLER_2D
    }
  },
  // 会出现在自定义顶点着色器和片元着色器文本中的自定义 varying。
  varyings: {
    v_customTexCoords: Cesium.VaryingType.VEC2
  },
  // 配置自定义着色器在片元着色器材质/光照流水线中的位置。
  // 下文会进一步说明。
  mode: Cesium.CustomShaderMode.MODIFY_MATERIAL,
  // 可根据期望结果选择 PBR（基于物理的渲染）或 UNLIT（非光照）。
  lightingModel: Cesium.LightingModel.PBR,
  // 即使 primitive 原本使用的是不透明材质，也强制着色器以透明方式渲染
  translucencyMode: Cesium.CustomShaderTranslucencyMode.TRANSLUCENT,
  // 自定义顶点着色器。这是一个从模型空间到模型空间的函数。
  // VertexInput 见下文说明
  vertexShaderText: `
    // 重要：函数签名必须使用这些参数名。
    // 这有助于运行时生成着色器并进行优化。
    void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
        // 在这里编写代码。空函数体表示不执行任何操作。
    }
  `,
  // 自定义片元着色器。
  // FragmentInput 见下文说明
  // 无论 mode 如何，这里都会接收一个 material，并对其进行原地修改。
  fragmentShaderText: `
    // 重要：函数签名必须使用这些参数名。
    // 这有助于运行时生成着色器并进行优化。
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        // 在这里编写代码。例如，将漫反射颜色设置为半透明红色：
        material.diffuse = vec3(1.0, 0.0, 0.0);
        material.alpha = 0.5;
    }
  `,
});
```

## 应用自定义着色器

自定义着色器可以应用到 3D Tiles、`Model` 或 `VoxelPrimitive`，示例如下：

```js
const customShader = new Cesium.CustomShader(/* ... */);

// 应用到 tileset 中的所有瓦片
const tileset = await Cesium.Cesium3DTileset.fromUrl(
  "http://example.com/tileset.json", {
    customShader: customShader,
});
viewer.scene.primitives.add(tileset);

// 直接应用到模型
const model = await Cesium.Model.fromGltfAsync({
  url: "http://example.com/model.gltf",
  customShader: customShader,
});

// 应用到 VoxelPrimitive
const provider = await Cesium.Cesium3DTilesVoxelProvider.fromUrl(
  "http://example.com/tileset.json",
);
const voxelPrimitive = new Cesium.VoxelPrimitive({
  provider: provider,
  customShader: customShader,
});
```

体素仅支持自定义着色器功能的一个子集。参见 [将自定义着色器用于体素渲染](#using-custom-shaders-for-voxel-rendering)。

## Uniforms

当前 `CustomShader` 支持以下 uniform 类型：

| UniformType | GLSL 类型 | JS 类型 |
| ----------- | --------- | ------- |
| `FLOAT` | `float` | `Number` |
| `VEC2` | `vec2` | `Cartesian2` |
| `VEC3` | `vec3` | `Cartesian3` |
| `VEC4` | `vec4` | `Cartesian4` |
| `INT` | `int` | `Number` |
| `INT_VEC2` | `ivec2` | `Cartesian2` |
| `INT_VEC3` | `ivec3` | `Cartesian3` |
| `INT_VEC4` | `ivec4` | `Cartesian4` |
| `BOOL` | `bool` | `Boolean` |
| `BOOL_VEC2` | `bvec2` | `Cartesian2` |
| `BOOL_VEC3` | `bvec3` | `Cartesian3` |
| `BOOL_VEC4` | `bvec4` | `Cartesian4` |
| `MAT2` | `mat2` | `Matrix2` |
| `MAT3` | `mat3` | `Matrix3` |
| `MAT4` | `mat4` | `Matrix4` |
| `SAMPLER_2D` | `sampler2D` | `TextureUniform` |

### 纹理 Uniform

纹理 uniform 提供了更多选项，这些选项被封装在 `TextureUniform` 类中。纹理可以从 URL、`Resource` 或 typed array 加载。示例如下：

```js
const textureFromUrl = new Cesium.TextureUniform({
  url: "https://example.com/image.png",
});

const textureFromTypedArray = new Cesium.TextureUniform({
  typedArray: new Uint8Array([255, 0, 0, 255]),
  width: 1,
  height: 1,
  pixelFormat: Cesium.PixelFormat.RGBA,
  pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
});

// TextureUniform 也提供了控制采样器的选项
const textureWithSampler = new Cesium.TextureUniform({
  url: "https://example.com/image.png",
  repeat: false,
  minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
  magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
});
```

## Varyings

`varying` 在 `CustomShader` 构造函数中声明。Cesium 会自动在 GLSL 顶点着色器和片元着色器顶部，分别添加类似 `out float v_userDefinedVarying;` 和 `in float v_userDefinedVarying;` 这样的语句。

用户需要在 `vertexShaderText` 中为该 varying 赋值，并在 `fragmentShaderText` 中使用它。例如：

```js
const customShader = new Cesium.CustomShader({
  // 在这里声明 varying
  varyings: {
    v_selectedColor: Cesium.VaryingType.VEC4,
  },
  // 用户在顶点着色器中为 varying 赋值
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
  // 用户在片元着色器中使用 varying
  fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        material.diffuse = v_selectedColor.rgb;
    }
  `,
});
```

`CustomShader` 支持以下 varying 类型：

| VaryingType | GLSL 类型 |
| ----------- | --------- |
| `FLOAT` | `float` |
| `VEC2` | `vec2` |
| `VEC3` | `vec3` |
| `VEC4` | `vec4` |
| `MAT2` | `mat2` |
| `MAT3` | `mat3` |
| `MAT4` | `mat4` |

## Custom Shader 模式

自定义片元着色器是可配置的，因此它可以位于材质处理之前或之后，也可以位于光照处理之前。下面是可用模式概览：

| 模式 | 片元着色器流水线 | 说明 |
| ---- | ---------------- | ---- |
| `MODIFY_MATERIAL`（默认） | material -> custom shader -> lighting | 自定义着色器会修改材质阶段的输出结果 |
| `REPLACE_MATERIAL` | custom shader -> lighting | 完全跳过材质阶段，而是在自定义着色器中以程序方式生成材质 |

在上表中，`material` 阶段会先对纹理做预处理，最终得到一个 `czm_modelMaterial`。这对 PBR 尤其重要，但即使是 `UNLIT`，基础颜色纹理也仍然会在这一阶段处理。

## `VertexInput` 结构体

这是一个自动生成的 GLSL 结构体，用于包含属性数据。

```glsl
struct VertexInput {
    // 已处理的属性。参见下文 Attributes 结构体章节。
    Attributes attributes;
    // Feature ID / Batch ID。参见下文 FeatureIds 结构体章节。
    FeatureIds featureIds;
    // 元数据属性。参见下文 Metadata 结构体章节。
    Metadata metadata;
    // 元数据类属性。参见下文 MetadataClass 结构体章节。
    MetadataClass metadataClass;
    // 元数据统计信息。参见下文 Metadata Statistics 结构体章节
    MetadataStatistics metadataStatistics;
};
```

## `FragmentInput` 结构体

这个结构体与 `VertexInput` 类似，但会额外提供一些不同坐标空间中的位置相关自动变量。

```glsl
struct FragmentInput {
    // 已处理的属性值。参见下文 Attributes 结构体章节。
    Attributes attributes;
    // Feature ID / Batch ID。参见下文 FeatureIds 结构体章节。
    FeatureIds featureIds;
    // 元数据属性。参见下文 Metadata 结构体章节。
    Metadata metadata;
    // 元数据类属性。参见下文 MetadataClass 结构体章节。
    MetadataClass metadataClass;
    // 元数据统计信息。参见下文 Metadata Statistics 结构体章节
    MetadataStatistics metadataStatistics;
};
```

## `Attributes` 结构体

`Attributes` 结构体会根据自定义着色器中实际使用到的变量，以及待渲染 primitive 中可用的属性，动态生成。

例如，如果用户在着色器中使用了 `fsInput.attributes.texCoord_0`，运行时就会生成相应代码，从模型中的 `TEXCOORD_0` 属性（如果存在）中提供这个值。

如果某个 primitive 不具备满足自定义着色器需求的属性，Cesium 会尽可能推断默认值，以保证着色器仍然能够编译。否则，该 primitive 对应的自定义顶点/片元着色器部分会被禁用。

完整的内置属性列表如下。有些属性带有集合索引，它的形式为 `0, 1, 2, ...`（例如 `texCoord_0`），下面统一用 `N` 表示。

| 模型中的对应属性 | 着色器中的变量 | 类型 | 顶点着色器可用？ | 片元着色器可用？ | 说明 |
| ---------------- | -------------- | ---- | ---------------- | ---------------- | ---- |
| `POSITION` | `positionMC` | `vec3` | 是 | 是 | 模型坐标中的位置 |
| `POSITION` | `positionWC` | `vec3` | 否 | 是 | 世界坐标中的位置（WGS84 ECEF `(x, y, z)`）。精度较低。 |
| `POSITION` | `positionEC` | `vec3` | 否 | 是 | 眼坐标中的位置。 |
| `NORMAL` | `normalMC` | `vec3` | 是 | 否 | 模型坐标中的单位法线向量。仅在顶点着色器中可用。 |
| `NORMAL` | `normalEC` | `vec3` | 否 | 是 | 眼坐标中的单位法线向量。仅在片元着色器中可用。 |
| `TANGENT` | `tangentMC` | `vec3` | 是 | 否 | 模型坐标中的单位切线向量。该值始终为 `vec3`。对于提供了 `w` 分量的模型，Cesium 会在计算副切线后移除该分量。 |
| `TANGENT` | `tangentEC` | `vec3` | 否 | 是 | 眼坐标中的单位切线向量。该值始终为 `vec3`。对于提供了 `w` 分量的模型，Cesium 会在计算副切线后移除该分量。 |
| `NORMAL` & `TANGENT` | `bitangentMC` | `vec3` | 是 | 否 | 模型坐标中的单位副切线向量。仅当法线和切线都可用时才提供。 |
| `NORMAL` & `TANGENT` | `bitangentEC` | `vec3` | 否 | 是 | 眼坐标中的单位副切线向量。仅当法线和切线都可用时才提供。 |
| `TEXCOORD_N` | `texCoord_N` | `vec2` | 是 | 是 | 第 `N` 组纹理坐标。 |
| `COLOR_N` | `color_N` | `vec4` | 是 | 是 | 第 `N` 组顶点颜色。该值始终为 `vec4`；如果模型未指定 alpha，则默认为 1。 |
| `JOINTS_N` | `joints_N` | `ivec4` | 是 | 是 | 第 `N` 组骨骼关节索引。 |
| `WEIGHTS_N` | `weights_N` | `vec4` | 是 | 是 | 第 `N` 组权重。 |

自定义属性同样可用，不过它们会被重命名为小写字母加下划线形式。例如，模型中的属性 `_SURFACE_TEMPERATURE`，在着色器中会变成 `fsInput.attributes.surface_temperature`。

## `FeatureIds` 结构体

这个结构体会动态生成，用于把各种来源的 feature ID 汇总到一个统一集合中，无论这些值来自属性、纹理还是 varying。

Feature ID 在 GLSL 中表现为 `int`，不过在 WebGL 1 下有一些限制：

- 当值大于 `2^24` 时，由于 WebGL 1 会将 `highp int` 作为浮点值实现，因此可能会出现精度损失。
- 理想情况下类型应该是 `uint`，但这一类型要到 WebGL 2 才可用。

### 3D Tiles 1.0 Batch ID

在 3D Tiles 1.0 中，用于标识 primitive 内 feature 的同一概念被称为 `BATCH_ID`，或旧版写法 `_BATCHID`。这些 batch ID 会被统一重命名为一个 feature ID，并且始终使用索引 0：

- `vsInput.featureIds.featureId_0`（顶点着色器）
- `fsInput.featureIds.featureId_0`（片元着色器）

### `EXT_mesh_features` / `EXT_instance_features` Feature ID

当使用 glTF 扩展 `EXT_mesh_features` 或 `EXT_instance_features` 时，feature ID 会出现在两个位置：

1. 任意 glTF primitive 都可以带有一个 `featureIds` 数组。这个数组中可能包含 feature ID 属性、隐式 feature ID 属性以及/或 feature ID 纹理。无论 feature ID 的具体类型是什么，它们在自定义着色器中都会表现为 `(vsInput|fsInput).featureIds.featureId_N`，其中 `N` 是该 feature ID 在 `featureIds` 数组中的索引。
2. 任意带有 `EXT_mesh_gpu_instancing` 与 `EXT_instance_features` 的 glTF 节点也可以定义 feature ID。它们可以是 feature ID 属性或隐式 feature ID 属性，但不能是 feature ID 纹理。这些值在自定义着色器中会表现为 `(vsInput|fsInput).featureIds.instanceFeatureId_N`，其中 `N` 是该 feature ID 在 `featureIds` 数组中的索引。

此外，feature ID 纹理仅在片元着色器中受支持。

如果某组 feature ID 包含 `label` 属性（这是 `EXT_mesh_features` 中新增的能力），那么该标签还会作为别名提供。例如，若 `label: "alias"`，则在着色器中除了 `featureId_N` 之外，还可以访问 `(vsInput|fsInput).featureIds.alias`。

例如，假设某个 glTF primitive 具有如下 feature ID：

```jsonc
"nodes": [
  {
    "mesh": 0
    "extensions": {
      "EXT_mesh_gpu_instancing": {
        "attributes": {
          "TRANSLATION": 3,
          "_FEATURE_ID_0": 4
        }
      },
      "EXT_instance_features": {
        "featureIds": [
          {
            // 默认 feature ID（实例 ID）
            //
            // 顶点着色器：
            //   vsInput.featureIds.instanceFeatureId_0 或
            //   vsInput.featureIds.perInstance
            // 片元着色器：
            //   fsInput.featureIds.instanceFeatureId_0 或
            //   fsInput.featureIds.perInstance
            "label": "perInstance",
            "propertyTable": 0
          },
          {
            // Feature ID 属性。它对应上方 instancing 扩展中的 _FEATURE_ID_0。
            // 注意，由于它是 featureIds 数组中的第二组 feature ID，
            // 因此会被命名为 instanceFeatureId_1
            //
            // 顶点着色器：vsInput.featureIds.instanceFeatureId_1
            // 片元着色器：fsInput.featureIds.instanceFeatureId_1
            //
            // 由于没有 label 字段，因此必须使用 instanceFeatureId_1。
            "propertyTable": 1,
            "attribute": 0
          },
        ]
      }
    }
  }
],
"meshes": [
  {
    "primitives": [
      {
        "attributes": {
          "POSITION": 0,
          "_FEATURE_ID_0": 1,
          "_FEATURE_ID_1": 2
        },
        "extensions": {
          "EXT_mesh_features": {
            "featureIds": [
              {
                // Feature ID 纹理
                //
                // 顶点着色器：（不支持）
                // 片元着色器：
                //   fsInput.featureIds.featureId_0 或
                //   fsInput.featureIds.texture
                "label": "texture",
                "propertyTable": 2,
                "index": 0,
                "texCoord": 0,
                "channel": 0
              },
              {
                // 默认 feature ID（顶点 ID）
                //
                // 顶点着色器：
                //   vsInput.featureIds.featureId_1 或
                //   vsInput.featureIds.perVertex
                // 片元着色器：
                //   fsInput.featureIds.featureId_1 或
                //   fsInput.featureIds.perVertex
                "label": "perVertex",
                "propertyTable": 3,
              },
              {
                // Feature ID 属性（_FEATURE_ID_0）。
                // 注意，它在 featureIds 数组中的索引对应 featureId_2
                //
                // 顶点着色器：vsInput.featureIds.featureId_2
                // 片元着色器：fsInput.featureIds.featureId_2
                //
                // 由于没有 label，因此必须使用 featureId_2。
                "propertyTable": 4,
                "attribute": 0
              },
              {
                // Feature ID 属性（_FEATURE_ID_1）。
                // 注意，它在 featureIds 数组中的索引对应 featureId_3
                //
                // 顶点着色器：vsInput.featureIds.featureId_3
                // 片元着色器：fsInput.featureIds.featureId_3
                "propertyTable": 5,
                "attribute": 1
              }
            ]
          }
        }
      },
    ]
  }
]
```

### 旧版 `EXT_feature_metadata` Feature ID

`EXT_feature_metadata` 是 `EXT_mesh_features` 更早期的草案版本。虽然 feature ID 的概念本身变化不大，但其 JSON 结构略有不同。在旧版扩展中，`featureIdAttributes` 和 `featureIdTextures` 是分别存储的。在 CesiumJS 的实现中，feature 属性与 feature 纹理会被拼接成一个列表，本质上等价于：

`featureIds = featureIdAttributes.concat(featureIdTextures)`。

除了扩展 JSON 的这种差异外，feature ID 集合的命名方式与 `EXT_mesh_features` 相同，也就是说：

- `(vsInput|fsInput).featureIds.featureId_N` 对应每个 primitive 上合并后 `featureIds` 数组中的第 `N` 组 feature ID。
- `(vsInput|fsInput).featureIds.instanceFeatureId_N` 对应带有 `EXT_mesh_gpu_instancing` 扩展的节点上 `featureIds` 数组中的第 `N` 组 feature ID。

为了对照说明，下面把上一节中的同一个例子改写为 `EXT_feature_metadata` 扩展形式：

```jsonc
"nodes": [
  {
    "mesh": 0,
    "extensions": {
      "EXT_mesh_gpu_instancing": {
        "attributes": {
          "TRANSLATION": 3,
          "_FEATURE_ID_0": 4
        },
        "extensions": {
          "EXT_feature_metadata": {
            "featureIdAttributes": [
              {
                // 来自隐式范围的 Feature ID 属性
                //
                // 顶点着色器：vsInput.featureIds.instanceFeatureId_0
                // 片元着色器：fsInput.featureIds.instanceFeatureId_0
                "featureTable": "perInstanceTable",
                "featureIds": {
                  "constant": 0,
                  "divisor": 1
                }
              },
              {
                // Feature ID 属性。它对应上方 instancing 扩展中的 _FEATURE_ID_0。
                // 注意，由于它是 featureIds 数组中的第二组 feature ID，
                // 因此会被命名为 instanceFeatureId_1
                //
                // 顶点着色器：vsInput.featureIds.instanceFeatureId_1
                // 片元着色器：fsInput.featureIds.instanceFeatureId_1
                "featureTable": "perInstanceGroupTable",
                "featureIds": {
                  "attribute": "_FEATURE_ID_0"
                }
              }
            ],
          }
        }
      }
    }
  }
],
"meshes": [
  {
    "primitives": [
      {
        "attributes": {
          "POSITION": 0,
          "_FEATURE_ID_0": 1,
          "_FEATURE_ID_1": 2
        },
        "extensions": {
          "EXT_feature_metadata": {
            "featureIdAttributes": [
              {
                // 隐式 Feature ID 属性
                //
                // 顶点着色器：vsInput.featureIds.featureId_0
                // 片元着色器：fsInput.featureIds.featureId_0
                "featureTable": "perFaceTable",
                "featureIds": {
                  "constant": 0,
                  "divisor": 3
                }
              },
              {
                // Feature ID 属性（_FEATURE_ID_0）。
                // 注意，它在 featureIds 数组中的索引对应 featureId_1
                //
                // 顶点着色器：vsInput.featureIds.featureId_1
                // 片元着色器：fsInput.featureIds.featureId_1
                "featureTable": "perFeatureTable",
                "featureIds": {
                  "attribute": "_FEATURE_ID_0"
                }
              },
              {
                // Feature ID 属性（_FEATURE_ID_1）。
                // 注意，它在 featureIds 数组中的索引对应 featureId_2
                //
                // 顶点着色器：vsInput.featureIds.featureId_2
                // 片元着色器：fsInput.featureIds.featureId_2
                "featureTable": "otherFeatureTable",
                "featureIds": {
                  "attribute": "_FEATURE_ID_1"
                }
              }
            ],
            "featureIdTextures": [
              {
                // Feature ID 纹理。注意，由于 feature ID 纹理列表会拼接到
                // feature ID 属性列表之后，因此它会被命名为 featureId_3
                //
                // 顶点着色器：（不支持）
                // 片元着色器：fsInput.featureIds.featureId_3
                "featureTable": "perTexelTable",
                "featureIds": {
                  "texture": {
                    "texCoord": 0,
                    "index": 0
                  },
                  "channels": "r"
                }
              }
            ]
          }
        }
      },
    ]
  }
]
```

## `Metadata` 结构体

这个结构体包含模型可访问的相关元数据属性，来源于 glTF 扩展 [`EXT_structural_metadata`](https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata)（或较旧的 [`EXT_feature_metadata`](https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata) 扩展）。

当前支持以下几类元数据：

- 来自 `EXT_structural_metadata` glTF 扩展的 property attributes
- 来自 `EXT_structural_metadata` glTF 扩展的 property textures
- 来自 `EXT_structural_metadata` glTF 扩展的 property tables

目前并非所有数据类型都受支持。在 WebGL 1 中，仅支持 `UINT8`。在 WebGL 2 中，大多数基础类型都受支持（例如不同精度的浮点数、有符号整数和无符号整数），但仍有以下限制：

- 不支持布尔类型元数据。
- 不支持字符串或变长数组。
- 不支持矩阵类型元数据。
- 不支持超过 4 字节的数据类型（例如更大的定长数组、由大型分量类型组成的向量。注意：单分量 64 位数值类型是支持的，但会向下转换为 32 位类型）。

无论元数据来自哪里，这些属性都会按 property ID 汇总到一个结构体中。考虑下面这个 metadata class：

```jsonc
"schema": {
  "classes": {
    "wall": {
      "properties": {
        "temperature": {
          "name": "Surface Temperature",
          "type": "SCALAR",
          "componentType": "FLOAT32"
        }
      }
    }
  }
}
```

它会在着色器中表现为如下结构体字段：

```glsl
struct Metadata {
  float temperature;
}
```

此时即可通过 `vsInput.metadata.temperature` 或 `fsInput.metadata.temperature` 访问温度值。

### 归一化值

如果 class property 指定了 `normalized: true`，那么该属性会以对应的浮点类型出现在着色器中（例如 `float` 或 `vec3`）。所有分量都会位于 `[0, 1]`（无符号）或 `[-1, 1]`（有符号）的范围内。

例如：

```jsonc
"schema": {
  "classes": {
    "wall": {
      "properties": {
        // 在 glTF 中虽然以 UINT8 存储，但 damage 会被归一化到 0.0 到 1.0 之间
        "damageAmount": {
          "name": "Wall damage (normalized)",
          "type": "SCALAR",
          "componentType": "UINT32",
          "normalized": true
        }
      }
    }
  }
}
```

它会以 0.0 到 1.0 之间的 `float` 值形式出现在着色器中，可通过 `(vsInput|fsInput).metadata.damageAmount` 访问。

### 偏移与缩放

如果属性提供了 `offset` 或 `scale`，那么 Cesium 会在归一化之后（如果适用）自动应用它们。这可以方便地把数值预缩放到更适合使用的范围。

例如，将归一化温度值自动换算成摄氏度或华氏度：

```jsonc
"schema": {
  "classes": {
    "wall": {
      "properties": {
        // 缩放到摄氏度范围 [0, 100]
        "temperatureCelsius": {
          "name": "Temperature (°C)",
          "type": "SCALAR",
          "componentType": "UINT32",
          "normalized": true,
          // offset 默认值为 0，scale 默认值为 1
          "scale": 100
        },
        // 缩放/平移到华氏度范围 [32, 212]
        "temperatureFahrenheit": {
          "name": "Temperature (°C)",
          "type": "SCALAR",
          "componentType": "UINT32",
          "normalized": true,
          "offset": 32,
          "scale": 180
        }
      }
    }
  }
}
```

在着色器中，`(vsInput|fsInput).metadata.temperatureCelsius` 会是一个介于 0.0 到 100.0 之间的 `float`，而 `(vsInput|fsInput).metadata.temperatureFahrenheit` 会是一个范围为 `[32.0, 212.0]` 的 `float`。

### Property ID 清洗规则

GLSL 只支持字母数字标识符，也就是说，标识符不能以数字开头。此外，带有连续下划线（`__`）的标识符，以及以 `gl_` 为前缀的标识符，都是 GLSL 保留字。为了规避这些限制，property ID 会按以下规则修改：

1. 将所有连续的非字母数字字符替换为单个 `_`
2. 如果存在保留前缀 `gl_`，则移除它
3. 如果标识符以数字（`[0-9]`）开头，则在前面添加 `_`

下面是几个 property ID 与其在 `(vsInput|fsInput).metadata` 结构体中的变量名映射示例：

- `temperature ℃` -> `metadata.temperature_`
- `custom__property` -> `metadata.custom_property`
- `gl_customProperty` -> `metadata.customProperty`
- `12345` -> `metadata._12345`
- `gl_12345` -> `metadata._12345`

如果按照上述规则处理后得到空字符串，或者与其他 property ID 发生命名冲突，那么行为是未定义的。例如：

- `✖️✖️✖️` 会映射为空字符串，因此行为未定义。
- 两个属性名 `temperature ℃` 与 `temperature ℉` 都会映射成 `metadata.temperature`，因此行为未定义。

在使用点云（`.pnts`）格式时，每个点的属性会被转码为 property attributes。这些 property ID 也遵循相同规则。

## `MetadataClass` 结构体

这个结构体包含在 class schema 中为每个 metadata property 定义的常量。

无论元数据的来源是什么，这些属性都会按 property ID 汇总到一个结构体中。考虑下面这个 metadata class：

```json
"schema": {
  "classes": {
    "wall": {
      "properties": {
        "temperature": {
          "name": "Surface Temperature",
          "type": "SCALAR",
          "componentType": "FLOAT32",
          "noData": -9999.0,
          "default": 72.0,
          "min": -40.0,
          "max": 500.0,
        }
      }
    }
  }
}
```

它会在着色器中表现为如下结构体字段：

```glsl
struct floatMetadataClass {
  float noData;
  float defaultValue; // 'default' 是 GLSL 保留字
  float minValue; // 'min' 是 GLSL 保留字
  float maxValue; // 'max' 是 GLSL 保留字
}
struct MetadataClass {
  floatMetadataClass temperature;
}
```

每个 property 对应的子结构体类型会根据该 property 的实际值类型来选择，因此子结构体中的各个字段（如 `noData` 和 `defaultValue`）会与该 property 的实际值保持相同类型。

现在，就可以在顶点着色器中按如下方式访问 `noData` 和默认值：

```glsl
float noData = vsInput.metadataClass.temperature.noData;            // == -9999.0
float defaultTemp = vsInput.metadataClass.temperature.defaultValue; // == 72.0
float minTemp = vsInput.metadataClass.temperature.minValue;         // == -40.0
float maxTemp = vsInput.metadataClass.temperature.maxValue;         // == 500.0
```

在片元着色器中也可以通过 `fsInput` 结构体以相同方式访问。

## `MetadataStatistics` 结构体

如果模型是从某个 [3D Tiles tileset](https://github.com/CesiumGS/3d-tiles/tree/main/specification) 加载的，那么它可能在 `tileset.json` 的 `statistics` 属性中定义了统计信息。这些统计值会通过 `MetadataStatistics` 结构体暴露给 `CustomShader`。

### 组织方式

无论元数据来自哪里，这些属性都会按 property ID 汇总到单一来源中。考虑下面这个 metadata class：

```json
  "statistics": {
    "classes": {
      "exampleMetadataClass": {
        "count": 29338,
        "properties": {
          "intensity": {
            "min": 0.0,
            "max": 0.6333333849906921,
            "mean": 0.28973701532415364,
            "median": 0.25416669249534607,
            "standardDeviation": 0.18222664489583626,
            "variance": 0.03320655011,
            "sum": 8500.30455558002,
          },
          "classification": {
            "occurrences": {
              "MediumVegetation": 6876,
              "Buildings": 22462
            }
          }
        }
      }
    }
  }
```

它会在着色器中表现为如下结构体字段：

```glsl
struct floatMetadataStatistics {
  float minValue; // 'min' 是 GLSL 保留字
  float maxValue; // 'max' 是 GLSL 保留字
  float mean;
  float median;
  float standardDeviation;
  float variance;
  float sum;
}
struct MetadataStatistics {
  floatMetadataStatistics intensity;
}
```

在顶点着色器中，可以按如下方式访问这些统计值：

```glsl
float minValue = vsInput.metadataStatistics.intensity.minValue;
float mean = vsInput.metadataStatistics.intensity.mean;
```

在片元着色器中也可以通过 `fsInput` 结构体以相同方式访问。

### 类型

对于 `SCALAR`、`VECN` 和 `MATN` 类型的属性，统计结构体中的 `minValue`、`maxValue`、`median` 和 `sum` 字段，会声明为与其所描述 metadata property 相同的类型。`mean`、`standardDeviation` 和 `variance` 字段则会使用与该 metadata property 维度相同、但分量类型为浮点数的类型。

对于 `ENUM` 类型元数据，该 property 对应的统计结构体理论上应该包含 `occurrence` 字段，但目前尚未实现。

## `czm_modelVertexOutput` 结构体

这是一个内置结构体，参见[文档注释](../../packages/engine/Source/Shaders/Builtin/Structs/modelVertexOutput.glsl)。

该结构体包含自定义顶点着色器的输出，具体包括：

- `positionMC`：模型空间坐标中的顶点位置。这个结构体字段可用于扰动顶点或实现顶点动画等效果。它会以 `vsInput.attributes.positionMC` 初始化。自定义着色器可以修改它，最终结果会用于计算 `gl_Position`。
- `pointSize`：对应 `gl_PointSize`。仅当模型以 `gl.POINTS` 方式渲染时才会生效，否则会被忽略。它会覆盖 `Cesium3DTileStyle` 对模型应用的任何点大小样式。

> **实现说明**：`positionMC` 不会修改 primitive 的包围球。如果顶点被移动到包围球之外，根据当前视锥体状态，primitive 可能会被意外裁剪。

## `czm_modelMaterial` 结构体

这是一个内置结构体，参见[文档注释](../../packages/engine/Source/Shaders/Builtin/Structs/modelMaterial.glsl)。它与旧版 Fabric 系统中的 `czm_material` 类似，但字段略有不同，因为它支持 PBR 光照。

这个结构体是片元着色器流水线各阶段的基础输入/输出。例如：

- 材质阶段会生成一个 material
- 光照阶段会接收这个 material，计算光照，并将结果写入 `material.diffuse`
- 自定义着色器（无论位于流水线哪个位置）都会接收一个 material（即使它只是默认值构成的 material），然后对其进行修改

### 材质颜色空间

材质颜色（例如 `material.diffuse`）始终处于线性色彩空间中，即使 `lightingModel` 使用的是 `LightingModel.UNLIT` 也是如此。

当 `scene.highDynamicRange` 为 `false` 时，最终计算出的颜色（经过自定义着色器与光照之后）会被转换为 `sRGB`。

<a id="using-custom-shaders-for-voxel-rendering"></a>

## 将自定义着色器用于体素渲染

体素渲染只支持自定义着色器功能的一个子集。

提供的着色器只会在片元着色器中执行。（如果提供了 `vertexShaderText`，它会被忽略。）

提供的片元着色器会在穿过体素进行 raymarching 的每一步执行一次。

某个像素的最终渲染颜色，会由沿射线所有步进位置的着色器执行结果进行 alpha 混合后得到。

在体素着色器中，`FragmentInput` 结构体与其他自定义着色器相比有以下差异：

- `Attributes`：仅支持 `positionEC` 与 `normalEC` 属性
- `FeatureIds`：体素着色器中不存在
- `Metadata`：完全支持
- `MetadataClass`：不存在
- `MetadataStatistics`：仅支持 `min` 与 `max` 统计值
