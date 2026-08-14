<script setup lang="ts">
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { computed } from 'vue'
import {
  displayDetailHeight,
  displayDetailName,
  displayDetailValue,
} from '@/views/aviation-situation/utils/format-detail-value'
import { getPhotogrammetryBuildingProperties } from '@/views/aviation-situation/composables/photogrammetry/photogrammetry-building-registry'

const aviationSelectionStore = useAviationSelectionStore()

const building = computed(() => {
  const sel = aviationSelectionStore.selected
  if (sel?.sourceType !== 'photogrammetryBuilding') return null
  return getPhotogrammetryBuildingProperties(sel.id) ?? null
})
</script>

<template>
  <div v-if="building" class="aviation-detail">
    <div class="detail-header">
      <div class="detail-header__title">{{ displayDetailName(building.name) }}</div>
      <div class="detail-header__meta">{{ building.id }}</div>
    </div>

    <div class="detail-section">
      <div class="section-title">基本信息</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">id</span>
          <span class="value">{{ building.id }}</span>
        </div>
        <div class="info-item">
          <span class="label">名称</span>
          <span class="value">{{ displayDetailName(building.name) }}</span>
        </div>
        <div v-if="building.city" class="info-item">
          <span class="label">城市</span>
          <span class="value">{{ building.city }}</span>
        </div>
        <div v-if="building.landUse" class="info-item">
          <span class="label">类型 / 用地</span>
          <span class="value">{{ displayDetailValue(building.landUse) }}</span>
        </div>
        <div v-if="building.roofType" class="info-item">
          <span class="label">屋顶</span>
          <span class="value">{{ displayDetailValue(building.roofType) }}</span>
        </div>
        <div class="info-item">
          <span class="label">楼高</span>
          <span class="value">{{
            displayDetailHeight(building.buildingHeight ?? building.height)
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/detail-shared';
</style>
