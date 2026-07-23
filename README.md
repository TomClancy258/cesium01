# 三维航空态势可视化系统

基于 CesiumJS 的全球三维航空态势可视化平台，面向大规模节点渲染、倾斜摄影与白膜建筑、复杂空间交互与态势联动场景。

## 技术栈
Vue3 / TypeScript / CesiumJS / Turf.js / Element Plus / ECharts / Pinia / Mitt / VueUse

## 核心功能
- 1万+航班、2万+机场、多卫星实时三维渲染
- 倾斜摄影：多城倾斜摄影切换，按 bbox 动态裁切建筑 GeoJSON 并做单体化
- 白膜建筑：全球白膜加载与类型筛选，支持拾取高亮与详情展示
- 卫星轨道运行与圆锥体扫描地面节点（实时高亮 + 表格联动）；管控区飞入飞机高亮
- 空间测绘工具链（距离/多边形/圆形/半球）+ 万级节点框选空间命中判定
- 多优先级高亮管理（选中/hover/框选/扫描/管控，覆盖飞机/机场/卫星/建筑/管控区）
- 模拟 WebSocket 5s 推送，增量更新变化点位
- 多字段筛选与地图-表格双向联动
- 本地离线地图瓦片支持

## 性能优化
- Primitive 替代 Entity，主场景帧率稳定 50fps+
- 首屏加载从 4s 降至 1s 以内
- drillPick 节流优化，hover 帧率从 30fps 提升至 50fps+
- 相机海拔节流 + 按距离显隐管理
- Map/Set 增量更新，避免全量重建
- BBox 预筛 + Turf.js 精算两级空间命中判定
- 倾斜摄影建筑按 bbox 裁切并限制单次实例规模，控制内存与帧率
- onTick 分级节流

## 界面截图
**卫星扫描 + 管控区**（轨道扫描高亮航空节点，联动详情与表格；管控区飞入高亮）
<img width="1913" height="997" alt="卫星扫描 + 管控区" src="https://github.com/user-attachments/assets/06d82edb-f6ca-4abc-b513-8301eb4e31ea" />

**测绘+框选+table联动**（支持多边形/圆形/半球实时测绘，框选空间命中判定；测绘区域内节点实时筛选联动）
<img width="1907" height="1012" alt="测绘+框选+table联动" src="https://github.com/user-attachments/assets/dbe39a5f-57b7-40c4-aac9-2c1d782b83c4" />

**飞机航线和table联动**（1万+飞机节点实时渲染，点击航线与表格双向联动）
<img width="3812" height="1794" alt="飞机航线和table联动" src="https://github.com/user-attachments/assets/4d176cd0-17da-431a-9057-c28594d7a98d" />

**倾斜摄影与单体化**（多城切换，bbox 动态单体化，建筑拾取与详情）
<img width="1907" height="1007" alt="倾斜摄影与单体化" src="https://github.com/user-attachments/assets/6fa7b0f7-bcaa-4266-ac89-ba3ec3ade01f" />

**全球白膜建筑**（类型筛选，拾取高亮与详情）
<img width="1906" height="1013" alt="全球白膜建筑" src="https://github.com/user-attachments/assets/d4970905-03b3-4100-8db0-ca8b5790752d" />
