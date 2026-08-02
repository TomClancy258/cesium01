<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DrawerProps } from 'element-plus'
import { Fold } from '@element-plus/icons-vue'
import { useStationEquipmentStore } from '@/stores/station-equipment'
import type { EquipmentSource, StationRow } from '../types/station-equipment'
import ReservoirFilter from './equipment/ReservoirFilter.vue'
import CoolingTowerFilter from './equipment/CoolingTowerFilter.vue'
import CoolingTubeFilter from './equipment/CoolingTubeFilter.vue'
import StreetlightFilter from './equipment/StreetlightFilter.vue'
import PressureRegulatingTowerFilter from './equipment/PressureRegulatingTowerFilter.vue'
import MixingTankFilter from './equipment/MixingTankFilter.vue'
import HouseFilter from './equipment/HouseFilter.vue'
import VerticalPressurizedTankBodyFilter from './equipment/VerticalPressurizedTankBodyFilter.vue'

import reservoirSvg from "@/assets/img/reservoir/reservoir.svg"
import fanSvg from "@/assets/img/fan/fan.svg"
import streetlightSvg from "@/assets/img/streetlight/streetlight.svg"
import cellTowerSvg from "@/assets/img/tower/cell-tower.svg"
import mixingSvg from "@/assets/img/mixing/mixing.svg"
import factorySvg from "@/assets/img/build/factory.svg"
import jarSvg from "@/assets/img/jar/jar.svg"

const props = defineProps<{
  flyToByName: (name: string) => void
  selectByName: (name: string) => void
}>()

const store = useStationEquipmentStore()
const drawer = ref(false)
const direction = ref<DrawerProps['direction']>('btt')
const activeIndex = ref<EquipmentSource>(store.activeTableKey)

const toggleDrawer = (): void => {
  drawer.value = !drawer.value
}

watch(
  () => store.selected,
  (selected) => {
    if (!selected) return
    activeIndex.value = selected.source
    store.setActiveTableKey(selected.source)
    drawer.value = true
  },
)

watch(activeIndex, (key) => {
  store.setActiveTableKey(key)
})

const onDetail = (row: StationRow): void => {
  props.selectByName(row.name)
  props.flyToByName(row.name)
}
</script>

<template>
  <div class="equipment-drawer-root">
    <div class="drawer-toggle drawer-toggle--bottom">
      <el-icon class="rotate-icon" @click="toggleDrawer">
        <Fold />
      </el-icon>
    </div>

    <el-drawer
      v-model="drawer"
      class="equipment-drawer"
      :with-header="true"
      title=""
      size="36%"
      :direction="direction"
      :modal="false"
      :modal-penetrable="true"
    >
      <div class="drawer-body">
        <el-row>
          <el-col :span="2">
            <el-menu
              :key="activeIndex"
              :default-active="activeIndex"
              @select="(index: string) => (activeIndex = index as EquipmentSource)"
            >
              <el-menu-item index="reservoir">
                <el-icon class="header-icon">
                  <img :src="reservoirSvg" alt="" class="menu-svg-icon" />
                </el-icon>
                <span>蓄水池</span>
              </el-menu-item>
              <el-menu-item index="coolingTower">
                <el-icon class="header-icon">
                  <img :src="fanSvg" alt="" class="menu-svg-icon" />
                </el-icon>
                <span>冷却塔</span>
              </el-menu-item>
              <el-menu-item index="coolingTube">
                <el-icon class="header-icon">
                  <img :src="fanSvg" alt="" class="menu-svg-icon" />
                </el-icon>
                <span>冷却管</span>
              </el-menu-item>
              <el-menu-item index="streetlight">
                <el-icon class="header-icon">
                  <img :src="streetlightSvg" alt="" class="menu-svg-icon" />
                </el-icon>
                <span>路灯</span>
              </el-menu-item>
              <el-menu-item index="pressureRegulatingTower">
                <el-icon class="header-icon">
                  <img :src="cellTowerSvg" alt="" class="menu-svg-icon" />
                </el-icon>
                <span>调压塔</span>
              </el-menu-item>
              <el-menu-item index="mixingTank">
                <el-icon class="header-icon">
                  <img :src="mixingSvg" alt="" class="menu-svg-icon" />
                </el-icon>
                <span>搅拌池</span>
              </el-menu-item>
              <el-menu-item index="house">
                <el-icon class="header-icon">
                  <img :src="factorySvg" alt="" class="menu-svg-icon" />
                </el-icon>
                <span>房子</span>
              </el-menu-item>
              <el-menu-item index="verticalPressurizedTankBody">
                <el-icon class="header-icon">
                  <img :src="jarSvg" alt="" class="menu-svg-icon" />
                </el-icon>
                <span>立式承压罐</span>
              </el-menu-item>
            </el-menu>
          </el-col>
          <el-col :span="22" style="padding: 0 5px">
            <ReservoirFilter v-show="activeIndex === 'reservoir'" @detail="onDetail" />
            <CoolingTowerFilter v-show="activeIndex === 'coolingTower'" @detail="onDetail" />
            <CoolingTubeFilter v-show="activeIndex === 'coolingTube'" @detail="onDetail" />
            <StreetlightFilter v-show="activeIndex === 'streetlight'" @detail="onDetail" />
            <PressureRegulatingTowerFilter
              v-show="activeIndex === 'pressureRegulatingTower'"
              @detail="onDetail"
            />
            <MixingTankFilter v-show="activeIndex === 'mixingTank'" @detail="onDetail" />
            <HouseFilter v-show="activeIndex === 'house'" @detail="onDetail" />
            <VerticalPressurizedTankBodyFilter
              v-show="activeIndex === 'verticalPressurizedTankBody'"
              @detail="onDetail"
            />
          </el-col>
        </el-row>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/css/mixins' as *;

.drawer-toggle {
  @include drawer-toggle;
}

.drawer-toggle--bottom {
  @include drawer-toggle-bottom;
}

.drawer-body {
  height: 100%;
  overflow: auto;
}

:deep(.equipment-drawer) {
  @include el-drawer-compact;
}

.menu-svg-icon {
  width: 1em;
  height: 1em;
  display: block;
}
</style>
