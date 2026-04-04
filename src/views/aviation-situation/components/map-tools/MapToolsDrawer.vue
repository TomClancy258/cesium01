<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'

import type { DrawerProps } from 'element-plus'
import SpatialSelection from '@/views/aviation-situation/components/map-tools/panels/draw-tool/DrawingTool.vue'
import AircraftFilter from '@/views/aviation-situation/components/map-tools/panels/AircraftFilter.vue'
import AirportFilter from '@/views/aviation-situation/components/map-tools/panels/AirportFilter.vue'
import AircraftTrajectoryOptions from '@/views/aviation-situation/components/map-tools/panels/AircraftTrajectoryOptions.vue'

import { Fold, Filter, Share,PictureRounded } from '@element-plus/icons-vue'
import { useMeasurementSelectionStore } from '@/stores/drawingToolSelection'

const drawer = ref(false)
const direction = ref<DrawerProps['direction']>('btt')
// const direction = ref<DrawerProps['direction']>('rtl')

const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const toggleDrawer = (): void => {
  drawer.value = !drawer.value
}

const activeIndex = ref('aircraftFilter')

const activeName = ref('')

const measurementSelectionStore = useMeasurementSelectionStore()

watch(
  () => measurementSelectionStore.selected,
  (selected) => {
    if (!selected) return
    activeIndex.value='spatialSelection'
    drawer.value=true
  }
)

</script>
<template>
  <div>
    <div class="drawer-toggle drawer-toggle--bottom">
      <el-icon @click="toggleDrawer" class="rotate-icon">
        <Fold />
      </el-icon>
    </div>
    <el-drawer v-model="drawer" :with-header="true" size="25%"
               :direction="direction" :modal="false"
               :modal-penetrable="true" class="map-tools-drawer">
      <div class="drawer-body">
        <el-row>
          <el-col :span="2">
            <el-menu
              :default-active="activeIndex"
              class="el-menu-vertical-demo"
              @open="handleOpen"
              @close="handleClose"
              @select="(index) => activeIndex = index"
            >
              <el-menu-item index="aircraftFilter">
                <el-icon class="header-icon">
                  <Filter />
                </el-icon>
                <span>飞机筛选</span>
              </el-menu-item>
              <el-menu-item index="airportFilter">
                <el-icon class="header-icon">
                  <Filter />
                </el-icon>
                <span>机场筛选</span>
              </el-menu-item>
              <el-menu-item index="trajectoryOption">
                <el-icon class="header-icon">
                  <Share />
                </el-icon>
                <span>轨迹选项</span>
              </el-menu-item>
              <el-menu-item index="spatialSelection">
                <el-icon class="header-icon">
                  <PictureRounded />
                </el-icon>
                <span>空间选择</span>
              </el-menu-item>
            </el-menu>
          </el-col>
          <el-col :span="22">
            <AircraftFilter v-show="activeIndex === 'aircraftFilter'" />
            <AirportFilter v-show="activeIndex === 'airportFilter'" />
            <AircraftTrajectoryOptions v-show="activeIndex === 'trajectoryOption'" />
            <SpatialSelection v-show="activeIndex === 'spatialSelection'" />
          </el-col>
        </el-row>
      </div>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.drawer-toggle {
  position: absolute;
  //top: 200px;
  font-size: 30px;
  cursor: pointer;

  background: #ffffff; /* 纯白背景 */
  color: #2c3e50; /* 深蓝灰图标 */
  border: 1px solid #e0e0e0; /* 浅灰描边（防白色地图融合） */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2); /* 轻微阴影提升层次 */

  .rotate-icon {
    transform: rotate(90deg);
  }
}

.drawer-toggle--right {
  right: 0;
}
.drawer-toggle--bottom {
  bottom: 0;
  right: 30px;
}
.title-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.title-wrapper.is-active {
  color: var(--el-color-primary);
}

:deep(.map-tools-drawer) {
  --el-drawer-padding-primary: 0;
  .el-drawer__header{
    margin-bottom: 0;
  }
}
</style>
