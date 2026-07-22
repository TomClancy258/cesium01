<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { usePhotogrammetryStore } from '@/stores/photogrammetry'
import type { MatchedPhotogrammetry } from '@/views/aviation-situation/types/photogrammetry'

const photogrammetryStore = usePhotogrammetryStore()

const addPhotogrammetryById = inject<(id: number) => Promise<void>>('addPhotogrammetryById')

const currentPage = ref(1)
const pageSize = ref(10)

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return photogrammetryStore.matchedPhotogrammetrys.slice(start, start + pageSize.value)
})

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const onDetail = (row: MatchedPhotogrammetry) => {
  if (photogrammetryStore.isLoadingPhotogrammetry || !addPhotogrammetryById) return
  addPhotogrammetryById(row.id)
}
</script>

<template>
  <div>
    <el-table
      v-loading="photogrammetryStore.isLoadingPhotogrammetry"
      :data="pagedData"
      border
      stripe
      size="small"
      style="width: 100%"
      row-key="id"
    >
      <el-table-column prop="id" label="id" />
      <el-table-column prop="name" label="名称" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="onDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="photogrammetryStore.matchedPhotogrammetrys.length"
      layout="total, sizes, prev, pager, next, jumper"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
      style="margin-top: 8px"
    />
  </div>
</template>

<style scoped lang="scss"></style>
