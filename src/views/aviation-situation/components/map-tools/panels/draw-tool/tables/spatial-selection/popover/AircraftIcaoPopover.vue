<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { Aircraft } from '@/network/aircraft/types/aircraft'
import AircraftHitTable from '@/views/aviation-situation/components/shared/AircraftHitTable.vue'

defineProps<{
  aircraftMap?: Map<string, Aircraft>
}>()

const hitTableRef = ref<{ reset: () => void } | null>(null)

const onShow = async () => {
  await nextTick()
  hitTableRef.value?.reset()
}
</script>

<template>
  <template v-if="!aircraftMap?.size">—</template>
  <template v-else>
    <el-popover
      placement="top"
      width="70%"
      trigger="click"
      popper-class="aircraft-list-popover"
      @show="onShow"
    >
      <template #reference>
        <div class="tag-preview">
          <el-tag
            v-for="a in [...aircraftMap.values()].slice(0, 2)"
            :key="a.icao24"
            size="small"
            type="primary"
            style="margin: 1px"
          >
            {{ a.icao24 }}
          </el-tag>
          <el-tag v-if="aircraftMap.size > 2" size="small" type="warning">
            +{{ aircraftMap.size - 2 }}
          </el-tag>
        </div>
      </template>

      <AircraftHitTable ref="hitTableRef" :aircraft-map="aircraftMap" />
    </el-popover>
  </template>
</template>

<style scoped lang="scss">
.tag-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
  cursor: default;
}
</style>
