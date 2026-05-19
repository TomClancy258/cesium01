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
**卫星扫描**（）
<img width="3802" height="1760" alt="image" src="https://github.com/user-attachments/assets/e161a3b6-3617-48a2-9335-2a98cbe727fa" />

**测绘+框选**（支持多边形/圆形/半球实时测绘，框选碰撞检测）
<img width="3810" height="1771" alt="测绘+框选" src="https://github.com/user-attachments/assets/80820f28-be02-4f52-9206-bb1ea205ccf4" />

**测绘和table联动**（测绘区域内节点实时筛选联动）
<img width="3817" height="1765" alt="测绘和table联动" src="https://github.com/user-attachments/assets/a7716f60-8d6a-4cee-8778-12d0a9d9e949" />

**飞机航线和table联动**（1万+飞机节点实时渲染，点击航线与表格双向联动）
<img width="3812" height="1794" alt="飞机航线和table联动" src="https://github.com/user-attachments/assets/4d176cd0-17da-431a-9057-c28594d7a98d" />

**机场和table联动**（2万+机场节点，BillboardCollection批量渲染，稳定50fps+）
<img width="3809" height="1773" alt="机场table联动" src="https://github.com/user-attachments/assets/90ca863e-fd22-420f-b65d-dda66cc63265" />
