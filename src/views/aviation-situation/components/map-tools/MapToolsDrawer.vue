<script lang="ts" setup>
import { ref, watch } from 'vue'

import type { DrawerProps } from 'element-plus'
import SpatialSelection from '@/views/aviation-situation/components/map-tools/panels/draw-tool/DrawingTool.vue'
import AircraftFilter from '@/views/aviation-situation/components/map-tools/panels/AircraftFilter.vue'
import AirportFilter from '@/views/aviation-situation/components/map-tools/panels/AirportFilter.vue'
import ControlZoneFilter from '@/views/aviation-situation/components/map-tools/panels/ControlZoneFilter.vue'
import RadarFilter from '@/views/aviation-situation/components/map-tools/panels/RadarFilter.vue'
import WallFilter from '@/views/aviation-situation/components/map-tools/panels/WallFilter.vue'
import SatelliteFilter from '@/views/aviation-situation/components/map-tools/panels/SatelliteFilter.vue'

import { Fold, Filter, PictureRounded, OfficeBuilding } from '@element-plus/icons-vue'
import { useRegionSelectionStore } from '@/stores/region-selection'
import CityModel
  from '@/views/aviation-situation/components/map-tools/panels/city-model/CityModel.vue'

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

const regionSelectionStore = useRegionSelectionStore()

watch(
  () => regionSelectionStore.selected,
  (selected) => {
    if (!selected) return
    activeIndex.value =
      selected.sourceType === 'controlZone'
        ? 'controlZoneFilter'
        : selected.sourceType === 'radar'
          ? 'radarFilter'
          : selected.sourceType === 'wall'
            ? 'wallFilter'
            : 'spatialSelection'
    drawer.value = true
  },
)

</script>
<template>
  <div>
    <div class="drawer-toggle drawer-toggle--bottom">
      <el-icon @click="toggleDrawer" class="rotate-icon">
        <Fold />
      </el-icon>
    </div>
    <el-drawer v-model="drawer" :with-header="true" size="30%"
               :direction="direction" :modal="false"
               :modal-penetrable="true" class="map-tools-drawer">
      <div class="drawer-body">
        <el-row>
          <el-col :span="2">
            <el-menu
              :key="activeIndex"
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
              <el-menu-item index="satelliteFilter">
                <el-icon class="header-icon">
                  <Filter />
                </el-icon>
                <span>卫星筛选</span>
              </el-menu-item>
              <el-menu-item index="controlZoneFilter">
                <el-icon class="header-icon">
                  <Filter />
                </el-icon>
                <span>管控地区筛选</span>
              </el-menu-item>
              <el-menu-item index="radarFilter">
                <el-icon class="header-icon">
                  <Filter />
                </el-icon>
                <span>雷达筛选</span>
              </el-menu-item>
              <el-menu-item index="wallFilter">
                <el-icon class="header-icon">
                  <Filter />
                </el-icon>
                <span>电子围栏筛选</span>
              </el-menu-item>
              <el-menu-item index="spatialSelection">
                <el-icon class="header-icon">
                  <PictureRounded />
                </el-icon>
                <span>空间选择</span>
              </el-menu-item>
              <el-menu-item index="cityModel">
                <el-icon class="header-icon">
                  <OfficeBuilding />
                </el-icon>
                <span>城市模型</span>
              </el-menu-item>
            </el-menu>
          </el-col>
          <el-col :span="22" style="padding: 0 5px">
            <AircraftFilter v-show="activeIndex === 'aircraftFilter'" />
            <AirportFilter v-show="activeIndex === 'airportFilter'" />
            <ControlZoneFilter v-show="activeIndex === 'controlZoneFilter'" />
            <RadarFilter v-show="activeIndex === 'radarFilter'" />
            <WallFilter v-show="activeIndex === 'wallFilter'" />
            <SatelliteFilter v-show="activeIndex === 'satelliteFilter'" />
            <SpatialSelection v-show="activeIndex === 'spatialSelection'" />
            <CityModel v-show="activeIndex === 'cityModel'" />
          </el-col>
        </el-row>
      </div>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/css/mixins' as *;

.drawer-toggle {
  @include drawer-toggle;
}

.drawer-toggle--bottom {
  @include drawer-toggle-bottom;
}

:deep(.map-tools-drawer) {
  @include el-drawer-compact;
}
</style>
