<script setup lang="ts">
//AircraftTrajectoryOptions.vue
import { useAircraftStore } from '@/stores/aircraft'

const aircraftStore = useAircraftStore()
</script>

<template>
  <div>
    <el-form
      :model="aircraftStore.aircraftTrajectoryOptions"
      label-width="85px"
      :inline="true"
    >
<!--      <el-row>-->
<!--        <el-col :span="12">-->
          <el-form-item label="计划轨迹" prop="planned.trajectoryVisible">
            <el-checkbox v-model="aircraftStore.aircraftTrajectoryOptions.planned.trajectoryVisible" />
          </el-form-item>
<!--        </el-col>-->
<!--        <el-col :span="12">-->
          <el-form-item label="计划航路点" prop="planned.waypointsVisible">
            <el-checkbox v-model="aircraftStore.aircraftTrajectoryOptions.planned.waypointsVisible" />
          </el-form-item>
<!--        </el-col>-->
<!--      </el-row>-->
    </el-form>
  </div>
</template>

<style scoped lang="scss"></style>
