<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { Airport } from '@/network/airport/type'
import AirportHitTable from '@/views/aviation-situation/components/shared/AirportHitTable.vue'

defineProps<{
  airportMap?: Map<string, Airport>
}>()

const hitTableRef = ref<{ reset: () => void } | null>(null)

const onShow = async () => {
  await nextTick()
  hitTableRef.value?.reset()
}
</script>

<template>
  <template v-if="!airportMap?.size">—</template>
  <template v-else>
    <el-popover
      placement="top"
      width="70%"
      trigger="click"
      popper-class="airport-list-popover"
      @show="onShow"
    >
      <template #reference>
        <div class="tag-preview">
          <el-tag
            v-for="a in [...airportMap.values()].slice(0, 2)"
            :key="a.icao"
            size="small"
            type="success"
            style="margin: 1px"
          >
            {{ a.icao }}
          </el-tag>
          <el-tag v-if="airportMap.size > 2" size="small" type="warning">
            +{{ airportMap.size - 2 }}
          </el-tag>
        </div>
      </template>

      <AirportHitTable ref="hitTableRef" :airport-map="airportMap" />
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
