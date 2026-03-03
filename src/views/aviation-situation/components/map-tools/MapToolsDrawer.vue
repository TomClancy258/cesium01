<script lang="ts" setup>
import { ref } from 'vue'

import type { DrawerProps } from 'element-plus'
import SpatialSelect from '@/views/aviation-situation/components/map-tools/panels/SpatialSelect.vue'
import AircraftFilter from '@/views/aviation-situation/components/map-tools/panels/AircraftFilter.vue'
import AirportFilter from '@/views/aviation-situation/components/map-tools/panels/AirportFilter.vue'
import AircraftTrajectoryOptions from '@/views/aviation-situation/components/map-tools/panels/AircraftTrajectoryOptions.vue'

import { Fold, Filter, Share,PictureRounded } from '@element-plus/icons-vue'

const drawer = ref(false)
const direction = ref<DrawerProps['direction']>('rtl')

const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const toggleDrawer = (): void => {
  drawer.value = !drawer.value
}


const activeName = ref('')
</script>
<template>
  <div>
    <div class="drawer-toggle drawer-toggle--right">
      <el-icon @click="toggleDrawer">
        <Fold />
      </el-icon>
    </div>
    <el-drawer v-model="drawer" title="" size="20%" :direction="direction" :modal="false" :modal-penetrable="true">
      <div class="drawer-body">
        <el-collapse class="drawer-collapse" v-model="activeName">
          <el-collapse-item name="aircraftFilter">
            <template #title="{ isActive }">
              <div :class="['title-wrapper', { 'is-active': isActive }]">
                飞机筛选
                <el-icon class="header-icon">
                  <Filter />
                </el-icon>
              </div>
            </template>
            <div>
              <AircraftFilter/>
            </div>
          </el-collapse-item>
          <el-collapse-item name="airportFilter">
            <template #title="{ isActive }">
              <div :class="['title-wrapper', { 'is-active': isActive }]">
                机场筛选
                <el-icon class="header-icon">
                  <Filter />
                </el-icon>
              </div>
            </template>
            <div>
              <AirportFilter/>
            </div>
          </el-collapse-item>
          <el-collapse-item name="trajectoryOption">
            <template #title="{ isActive }">
              <div :class="['title-wrapper', { 'is-active': isActive }]">
                轨迹选项
                <el-icon class="header-icon">
                  <Share />
                </el-icon>
              </div>
            </template>
            <div>
              <AircraftTrajectoryOptions/>
            </div>
          </el-collapse-item>
          <el-collapse-item name="spatialSelect">
            <template #title="{ isActive }">
              <div :class="['title-wrapper', { 'is-active': isActive }]">
                空间选择
                <el-icon class="header-icon">
                  <PictureRounded />
                </el-icon>
              </div>
            </template>
            <div>
              <SpatialSelect/>
            </div>
          </el-collapse-item>

        </el-collapse>
      </div>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.drawer-toggle {
  position: absolute;
  top: 200px;
  font-size: 30px;
  cursor: pointer;

  background: #ffffff; /* 纯白背景 */
  color: #2c3e50; /* 深蓝灰图标 */
  border: 1px solid #e0e0e0; /* 浅灰描边（防白色地图融合） */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2); /* 轻微阴影提升层次 */
}

.drawer-toggle--right {
  right: 0;
}
.title-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.title-wrapper.is-active {
  color: var(--el-color-primary);
}

</style>
