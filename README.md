# 三维航空态势可视化系统

基于 CesiumJS 实现的全球三维航空态势可视化平台。

## 技术栈
Vue3 / TypeScript / CesiumJS / Turf.js / Element Plus / ECharts / Pinia / VueUse

## 核心功能
- 1万+航班、2万+机场、多卫星实时三维渲染
- 卫星轨道运行与圆锥体扫描地面节点（实时高亮 + 联动）
- 空间测绘工具链（距离/多边形/圆形/半球）+ 万级节点框选碰撞检测
- 多优先级高亮管理（选中/hover/框选/扫描）
- 模拟WebSocket 5s推送，增量更新变化点位
- 多字段筛选与地图-表格双向联动
- 本地离线地图瓦片支持

## 性能优化
- Primitive替代Entity，主场景帧率稳定50fps+
- 首屏加载从4s降至1s以内
- drillPick节流优化，hover帧率从30fps提升至50fps+
- 相机海拔节流 + 按距离显隐管理
- Map/Set增量更新，避免全量重建
- BBox预筛 + Turf.js精算两级碰撞检测

## 界面截图
**卫星扫描**（实时轨道运行，扫描航空节点高亮，联动详情与表格）
<img width="1907" height="884" alt="卫星扫描和table联动" src="https://github.com/user-attachments/assets/da73a590-d919-4753-8f81-74e8f953f9a0" />

**测绘+框选**（支持多边形/圆形/半球实时测绘，框选碰撞检测）
<img width="3810" height="1771" alt="测绘+框选" src="https://github.com/user-attachments/assets/80820f28-be02-4f52-9206-bb1ea205ccf4" />

**测绘和table联动**（测绘区域内节点实时筛选联动）
<img width="3817" height="1765" alt="测绘和table联动" src="https://github.com/user-attachments/assets/a7716f60-8d6a-4cee-8778-12d0a9d9e949" />

**飞机航线和table联动**（1万+飞机节点实时渲染，点击航线与表格双向联动）
<img width="3812" height="1794" alt="飞机航线和table联动" src="https://github.com/user-attachments/assets/4d176cd0-17da-431a-9057-c28594d7a98d" />

**机场和table联动**（2万+机场节点，BillboardCollection批量渲染，稳定50fps+）
<img width="3809" height="1773" alt="机场table联动" src="https://github.com/user-attachments/assets/90ca863e-fd22-420f-b65d-dda66cc63265" />
