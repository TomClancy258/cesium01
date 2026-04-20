# 三维航空态势可视化系统

基于 CesiumJS 实现的全球三维航空态势可视化平台。

## 技术栈
Vue3 / TypeScript / CesiumJS / Turf.js / Element Plus / ECharts / Pinia

## 核心功能
- 1万+航班、2万+机场实时三维渲染
- 模拟WebSocket实时数据更新
- 空间测绘工具链（距离/多边形/圆形/半球）
- 轨迹增量更新
- 本地离线地图瓦片支持

## 性能优化
- 使用Primitive替代Entity，渲染帧率稳定50fps+
- 首屏加载从4s降至1s以内
- drillPick节流优化，hover帧率从30fps以下提升至50fps+

## 界面截图
**测绘+框选**
<img width="1267" height="645" alt="测绘+框选" src="https://github.com/user-attachments/assets/d3e860c6-57cb-41fe-819c-74302c246849" />

**测绘和table联动**
<img width="1267" height="652" alt="测绘和table联动" src="https://github.com/user-attachments/assets/b631348b-d56f-431a-96f4-8bf54033addf" />

**飞机航线和table联动**
<img width="1265" height="642" alt="飞机航线和table联动" src="https://github.com/user-attachments/assets/26e436d0-2130-4838-9171-5c343f3b37e6" />

**机场和table联动**
<img width="1267" height="640" alt="机场table联动" src="https://github.com/user-attachments/assets/42dee339-e025-43ce-9a81-9a2cdc6fef5c" />
