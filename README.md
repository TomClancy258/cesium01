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
**测绘+框选**（支持多边形/圆形/半球实时测绘，框选碰撞检测）
<img width="1901" height="860" alt="测绘+框选" src="https://github.com/user-attachments/assets/650ef8e2-5067-4ceb-b271-46f96c4687a4" />

**测绘和table联动**（测绘区域内节点实时筛选联动）
<img width="3818" height="1784" alt="测绘和table联动" src="https://github.com/user-attachments/assets/89746512-7857-45c5-aed0-3d18daab944d" />

**飞机航线和table联动**（1万+飞机节点实时渲染，点击航线与表格双向联动）
<img width="3804" height="1816" alt="飞机航线和table联动" src="https://github.com/user-attachments/assets/53e8b18a-b954-4a46-8a7c-a86779f6f143" />

**机场和table联动**（2万+机场节点，BillboardCollection批量渲染，稳定50fps+）
<img width="3806" height="1774" alt="机场table联动" src="https://github.com/user-attachments/assets/7b837614-6695-4151-ae3c-6ed7c05d1c46" />
