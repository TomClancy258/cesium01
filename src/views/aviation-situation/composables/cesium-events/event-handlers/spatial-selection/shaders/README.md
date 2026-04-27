# 雷达扫描 Shader 说明文档

## 概述

本模块提供了两种雷达扫描效果的 Material，用于 Cesium 中的空域筛选可视化：
- **圆形雷达扫描**：用于地面贴着的圆形空域筛选（useCircleSpatialSelection.ts）
- **半球雷达扫描**：用于立体的半球空域筛选（useHemisphereSpatialSelection.ts）

## 文件说明

### radarScanMaterial.ts

包含以下导出函数和类：

#### 函数

1. **createCircleRadarScanMaterial(scanColor, scanSpeed)**
   - 创建圆形雷达扫描 Material
   - 参数：
     - `scanColor` (Cesium.Color): 扫描波的颜色，默认为 `Cesium.Color.CYAN`
     - `scanSpeed` (number): 扫描速度，范围 0-1，默认为 0.5
   - 返回：`Cesium.Material` 实例

2. **createHemisphereRadarScanMaterial(scanColor, scanSpeed)**
   - 创建半球雷达扫描 Material
   - 参数同上
   - 返回：`Cesium.Material` 实例

#### 类

**AnimatedRadarMaterial**

用于管理雷达扫描动画的动态更新：

```typescript
class AnimatedRadarMaterial {
  constructor(material: Cesium.Material, speed: number = 1.0)
  update(): void                    // 更新 material 的 time 参数
  getMaterial(): Cesium.Material    // 获取底层 Material 实例
  setSpeed(speed: number): void     // 设置扫描速度倍数
  reset(): void                     // 重置动画起始时间
}
```

## 使用示例

### 圆形空域筛选（useCircleSpatialSelection.ts）

```typescript
import { createCircleRadarScanMaterial, AnimatedRadarMaterial } from './shaders/radarScanMaterial'

// 创建材质
const scanColor = Cesium.Color.CYAN.withAlpha(0.6)
radarMaterial = new AnimatedRadarMaterial(
  createCircleRadarScanMaterial(scanColor, 0.8),
  1.0
)

// 应用到 Entity（动态绘制状态）
circleConfig.ellipse!.material = radarMaterial.getMaterial()

// 启动动画循环
if (radarMaterial && animationFrameId === null) {
  const updateRadar = () => {
    radarMaterial!.update()
    animationFrameId = requestAnimationFrame(updateRadar)
  }
  animationFrameId = requestAnimationFrame(updateRadar)
}

// 注意：保存后的实体使用静态颜色（Cesium.Color.SKYBLUE.withAlpha(0.25)）
// 这是为了避免自定义 Material 序列化错误
```

### 半球空域筛选（useHemisphereSpatialSelection.ts）

```typescript
import { createHemisphereRadarScanMaterial, AnimatedRadarMaterial } from './shaders/radarScanMaterial'

// 创建材质
const scanColor = Cesium.Color.CYAN.withAlpha(0.6)
radarMaterial = new AnimatedRadarMaterial(
  createHemisphereRadarScanMaterial(scanColor, 0.8),
  1.0
)

// 应用到 Entity
hemisphereConfig.ellipsoid!.material = radarMaterial.getMaterial()

// 启动动画循环
// 同上...
```

## Shader 效果详解

### 圆形雷达扫描

**CircleRadarScan Shader** 特点：
- 从中心向外扩展的扫描波
- 动态的径向渐变效果
- 扫描线呼吸感觉
- 适合表现雷达覆盖范围

**Shader 参数：**
- `color`: 扫描波颜色（vec4）
- `speed`: 扫描速度（float）
- `time`: 动画时间（float）

**效果计算：**
```glsl
// 1. 计算从中心的距离
float distance = length(st - center);

// 2. 扫描波效果
float wave = sin(distance * 20.0 - time * speed * 10.0) * 0.5 + 0.5;

// 3. 径向渐变
float alpha = (1.0 - distance) * 0.5;

// 4. 扫描线效果
float scanLine = sin(distance * 30.0 - time * speed * 15.0);
scanLine = smoothstep(0.0, 0.1, scanLine) * (1.0 - distance);

// 5. 综合透明度
material.alpha = (wave * 0.3 + scanLine * 0.4 + alpha * 0.3) * color.a;
```

### 半球雷达扫描

**HemisphereRadarScan Shader** 特点：
- 旋转扫描的扫描线
- 高度感知的波动效果
- 立体感强的扫描覆盖
- 适合表现 3D 空间搜索范围

**Shader 参数：**
- `color`: 扫描波颜色（vec4）
- `speed`: 扫描速度（float）
- `time`: 动画时间（float）

**效果计算：**
```glsl
// 1. 基于表面法向量的计算
float height = normal.z;

// 2. 旋转扫描线（极坐标）
float angle = atan(normal.y, normal.x);
float scanAngle = mod(angle + time * speed * 3.14159, 6.28318);

// 3. 高度波动
float wave = sin(height * 10.0 - time * speed * 8.0) * 0.5 + 0.5;

// 4. 扫描光线
float scanLine = smoothstep(0.0, 0.2, fract(scanAngle / 1.57079)) 
               * (1.0 - abs(height - 0.5) * 2.0);

// 5. 综合效果
material.alpha = (wave * 0.2 + scanLine * 0.4 + alpha * 0.4) * color.a;
```

## 性能注意事项

1. **动画帧率**：使用 `requestAnimationFrame` 确保动画与屏幕刷新率同步
2. **清理资源**：在组件卸载时及时调用 `cancelAnimationFrame` 释放资源
3. **Material 复用**：同类型的扫描可以复用相同的 Material 以减少内存占用
4. **色彩调整**：通过 `withAlpha()` 调整透明度可以改变视觉层次

## 自定义扩展

### 修改扫描颜色

```typescript
// 红色扫描波
const redScan = new AnimatedRadarMaterial(
  createCircleRadarScanMaterial(Cesium.Color.RED.withAlpha(0.6), 0.8)
)

// 绿色扫描波
const greenScan = new AnimatedRadarMaterial(
  createCircleRadarScanMaterial(Cesium.Color.GREEN.withAlpha(0.6), 0.8)
)
```

### 调整扫描速度

```typescript
// 快速扫描（倍数 > 1）
radarMaterial.setSpeed(2.0)

// 慢速扫描（倍数 < 1）
radarMaterial.setSpeed(0.5)
```

### 自定义 Shader

可以编辑 `radarScanMaterial.ts` 中的 shader 源代码来实现：
- 不同的扫描图案
- 多层扫描波
- 脉冲效果
- 干扰噪声等

## 浏览器兼容性

- 需要支持 WebGL 的浏览器
- Cesium 1.100+ 版本
- 现代浏览器（Chrome, Firefox, Safari, Edge）

## 重要说明：动态 vs 静态显示

### 动态显示（绘制状态）
- **材质**：自定义雷达扫描 Material
- **动画**：实时扫描波动画
- **外观**：青色（Cyan）放射状扫描效果
- **用途**：用户正在绘制空域时，提供视觉反馈

### 静态显示（保存状态）
- **材质**：静态蓝色（Cesium.Color.SKYBLUE.withAlpha(0.25)）
- **动画**：无
- **外观**：半透明天蓝色
- **原因**：自定义 Material 无法被 Cesium 正确序列化，使用静态颜色避免错误

### 技术背景
Cesium 的自定义 Material 在序列化和克隆时存在限制。为了确保保存的实体能被正确克隆和显示，
我们在克隆动态实体时使用 Cesium 的原生颜色材质。这样做的好处是：
- ✅ 避免"Unable to infer material type"错误
- ✅ 保证数据持久化和恢复的稳定性
- ✅ 性能更好（原生颜色材质渲染开销小）

缺点是：
- ❌ 保存后的实体没有动画效果
- ❌ 视觉表现从扫描波变成静态颜色

### 未来优化方向
如果需要保存后的实体也保持动画效果，可以考虑：
1. 自定义 Entity 序列化/反序列化逻辑
2. 使用 Cesium 的 PostProcessStage 实现全局扫描效果
3. 在应用层存储 Material 配置，加载时重新创建

## 相关文件

- `useCircleSpatialSelection.ts` - 圆形空域筛选的集成
- `useHemisphereSpatialSelection.ts` - 半球空域筛选的集成
