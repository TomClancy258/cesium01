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