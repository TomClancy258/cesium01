import * as Cesium from 'cesium'

/**
 * 圆形贴地雷达扫描 Material
 *
 * materialInput.st 的含义（Ellipse）：
 *   st.s ∈ [0,1]  →  圆形 UV 的 x 轴方向
 *   st.t ∈ [0,1]  →  圆形 UV 的 y 轴方向
 *   中心在 (0.5, 0.5)，以极坐标计算旋转角和半径来实现扫描效果
 *
 * 效果：
 *   - 旋转扫描线（亮边）+ 扫描拖尾（渐隐弧形）
 *   - 脉冲圆环（从中心向外扩散）
 *   - 边缘渐隐
 */
export function createCircleRadarScanMaterial(
  scanColor: Cesium.Color = Cesium.Color.CYAN,
  scanSpeed: number = 0.15,
): Cesium.Material {
  return new Cesium.Material({
    strict: false, // 允许同名 type 重复注册，避免切换模式时报错
    fabric: {
      type: 'CircleRadarScan',
      uniforms: {
        color: scanColor,
        speed: scanSpeed,
        time: 0.0,
      },
      source: `
        uniform vec4 color;
        uniform float speed;
        uniform float time;

        czm_material czm_getMaterial(czm_materialInput materialInput) {
          czm_material material = czm_getDefaultMaterial(materialInput);

          // 以圆心为原点的 UV 向量
          vec2 uv = materialInput.st - vec2(0.5);
          float dist = length(uv);

          // 超出圆形范围直接透明
          if (dist > 0.5) {
            material.alpha = 0.0;
            return material;
          }

          // 归一化半径 [0, 1]
          float r = dist * 2.0;

          // ---- 旋转扫描线 + 拖尾 ----
          // 极坐标角度，映射到 [0, 1]
          float angle = fract((atan(uv.y, uv.x) + czm_pi) / czm_twoPi);
          // 扫描头当前角度位置
          float head = fract(time * speed);
          // 当前像素角度相对于扫描头的偏移（fract 保证循环连续）
          float diff = fract(angle - head + 1.0);

          float scan = 0.0;
          if (diff < 0.04) {
            // 扫描亮线
            scan = (1.0 - diff / 0.04) * 0.9;
          } else if (diff < 0.65) {
            // 扫描拖尾（指数衰减）
            float t = (diff - 0.04) / 0.61;
            scan = exp(-t * 3.5) * 0.35;
          }
          // 越靠近圆心扫描强度越弱（模拟中心盲区）
          scan *= smoothstep(0.05, 0.3, r);

          // ---- 脉冲扩散圆环 ----
          float pulse = sin(r * 10.0 - time * speed * 25.0) * 0.5 + 0.5;
          pulse *= (1.0 - r) * 0.25;

          // ---- 边缘渐隐底色 ----
          float base = (1.0 - r) * (1.0 - r) * 0.08;

          float alpha = clamp(scan + pulse + base, 0.0, 1.0) * color.a;

          material.diffuse = color.rgb;
          material.alpha   = alpha;

          return material;
        }
      `,
    },
  })
}

/**
 * 半球立体雷达扫描 Material
 *
 * materialInput.st 的含义（Ellipsoid）：
 *   st.s ∈ [0,1]  →  水平方向（绕 Z 轴经度，0=0°, 1=360°）
 *   st.t ∈ [0,1]  →  垂直方向（0=顶部/北极, 1=赤道）
 *   因为只保留上半球（maximumCone=90°），所以 t 从顶部到赤道线
 *
 * 效果：
 *   - 绕 Z 轴旋转的扫描面（亮边+拖尾）
 *   - 沿经线方向的脉冲波（从顶部向赤道扩散）
 *   - 经纬线网格（模拟雷达球面格栅）
 */
export function createHemisphereRadarScanMaterial(
  scanColor: Cesium.Color = Cesium.Color.CYAN,
  scanSpeed: number = 0.12,
): Cesium.Material {
  return new Cesium.Material({
    strict: false,
    fabric: {
      type: 'HemisphereRadarScan',
      uniforms: {
        color: scanColor,
        speed: scanSpeed,
        time: 0.0,
      },
      source: `
        uniform vec4 color;
        uniform float speed;
        uniform float time;

        czm_material czm_getMaterial(czm_materialInput materialInput) {
          czm_material material = czm_getDefaultMaterial(materialInput);

          float s = materialInput.st.s; // 水平角 [0,1]
          float t = materialInput.st.t; // 垂直角 [0,1]  0=顶 1=赤道

          // ---- 绕 Z 轴旋转的扫描面 + 拖尾 ----
          float head = fract(time * speed);
          float diff = fract(s - head + 1.0);

          float scan = 0.0;
          if (diff < 0.03) {
            // 扫描面主亮线
            scan = (1.0 - diff / 0.03) * 0.85;
          } else if (diff < 0.6) {
            float tt = (diff - 0.03) / 0.57;
            scan = exp(-tt * 3.0) * 0.3;
          }
          // 越靠近顶部（t→0）强度稍弱（顶点奇点过渡）
          scan *= smoothstep(0.0, 0.15, t) * (0.4 + 0.6 * t);

          // ---- 沿纬线脉冲波（从顶部向赤道扩散）----
          float pulse = sin(t * czm_pi * 5.0 - time * speed * 18.0) * 0.5 + 0.5;
          pulse *= t * (1.0 - t * 0.3) * 0.2;

          // ---- 经纬线网格 ----
          float gridLon = smoothstep(0.97, 1.0, abs(sin(s * czm_twoPi * 8.0)));
          float gridLat = smoothstep(0.97, 1.0, abs(sin(t * czm_pi * 5.0)));
          float grid = max(gridLon, gridLat) * 0.1;

          // ---- 底色（半球轮廓感）----
          float base = t * (1.0 - t) * 0.12;

          float alpha = clamp(scan + pulse + grid + base, 0.0, 1.0) * color.a;

          material.diffuse = color.rgb;
          material.alpha   = alpha;

          return material;
        }
      `,
    },
  })
}

/**
 * 雷达材质动画控制器
 * 在外部渲染循环（requestAnimationFrame）里每帧调用 update()，
 * 它会把经过的时间写入 material.uniforms.time，驱动 GLSL 里的动画。
 */
export class AnimatedRadarMaterial {
  private material: Cesium.Material
  private startTime: number
  private speed: number

  constructor(material: Cesium.Material, speed: number = 1.0) {
    this.material = material
    this.speed = speed
    this.startTime = performance.now()
  }

  update() {
    const elapsed = (performance.now() - this.startTime) / 1000
    this.material.uniforms.time = elapsed * this.speed
  }

  getMaterial(): Cesium.Material {
    return this.material
  }

  setSpeed(speed: number) {
    this.speed = speed
  }

  reset() {
    this.startTime = performance.now()
  }
}
