<script setup lang="ts">
import { useAviationSelectionStore } from '@/stores/aviation-selection'
import { computed } from 'vue'
import {
  displayDetailHeight,
  displayDetailName, displayDetailType,
  displayDetailValue
} from '@/views/aviation-situation/utils/format-detail-value'

const aviationSelectionStore = useAviationSelectionStore()

const building = computed(() => {
  const sel = aviationSelectionStore.selected
  if (sel?.sourceType === 'osmBuilding') return sel
  return null
})

const displayName = computed(() => displayDetailName(building.value?.name))

const displayType = computed(() => {
  if (!building.value) return ''
  return building.value.type.shop || building.value.type.building || ''
})

const formattedAddress = computed(() => {
  if (!building.value) return ''
  const { housenumber, street, city, state } = building.value.addr
  return [housenumber, street, city, state].filter(Boolean).join(', ')
})
</script>

<template>
  <div v-if="building" class="aviation-detail">
    <div class="detail-header">
      <div class="detail-header__title">{{ displayName }}</div>
      <div class="detail-header__meta">
        {{ building.elementType }} / {{ building.elementId }}
      </div>
    </div>

    <div class="detail-section">
      <div class="section-title">基本信息</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">类型</span>
          <span class="value">{{ displayDetailType(building.type.building) }}</span>
        </div>
        <div class="info-item">
          <span class="label">预估高度</span>
          <span class="value">{{ displayDetailHeight(building.estimatedHeight) }}</span>
        </div>
        <div class="info-item info-item--full">
          <span class="label">地址</span>
          <span class="value">{{ displayDetailValue(formattedAddress) }}</span>
        </div>
        <div class="info-item">
          <span class="label">经度</span>
          <span class="value">{{ building.lngLatAlt.longitude.toFixed(4) }}</span>
        </div>
        <div class="info-item">
          <span class="label">纬度</span>
          <span class="value">{{ building.lngLatAlt.latitude.toFixed(4) }}</span>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <div class="section-title">经营信息</div>
      <div class="info-grid">
        <div class="info-item info-item--full">
          <span class="label">营业时间</span>
          <span class="value">{{ displayDetailValue(building.business.openingHours) }}</span>
        </div>
        <div class="info-item info-item--full">
          <span class="label">电话</span>
          <span class="value">{{ displayDetailValue(building.business.phone) }}</span>
        </div>
        <div class="info-item info-item--full">
          <span class="label">网站</span>
          <span class="value">{{ displayDetailValue(building.business.website) }}</span>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <div class="section-title">扩展信息</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">ATM</span>
          <span class="value">{{ displayDetailValue(building.extension.atm) }}</span>
        </div>
        <div class="info-item">
          <span class="label">无障碍</span>
          <span class="value">{{ displayDetailValue(building.extension.wheelchair) }}</span>
        </div>
        <div class="info-item">
          <span class="label">网络</span>
          <span class="value">{{ displayDetailValue(building.extension.internetAccess) }}</span>
        </div>
        <div class="info-item">
          <span class="label">核查日期</span>
          <span class="value">{{ displayDetailValue(building.extension.checkDate) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use './detail-shared';
</style>
