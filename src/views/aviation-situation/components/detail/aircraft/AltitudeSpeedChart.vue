<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import * as echarts from 'echarts'

const props = defineProps<{
  chartData: {
    altitudes: number[]
    speeds: number[]
    times: string[]
  }
}>()

const chartRef = ref()
let chartInstance: echarts.ECharts | null = null

const handleResize = useDebounceFn(() => {
  if (chartInstance) {
    chartInstance.resize()
  }
}, 300)

const initChart = () => {
  if (!chartRef.value) return
  const chart = echarts.init(chartRef.value)
  chartInstance = chart
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(50, 50, 50, 0.8)',
      borderColor: '#333',
      textStyle: { color: '#fff', fontSize: 11 },
    },
    grid: {
      left: 40,
      right: 40,
      top: 20,
      bottom: 20,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: props.chartData.times,
      axisLabel: { fontSize: 10, color: '#999' },
      axisTick: { lineStyle: { color: '#f0f0f0' } },
      axisLine: { lineStyle: { color: '#f0f0f0' } },
    },
    yAxis: [
      {
        type: 'value',
        name: '高度(m)',
        position: 'left',
        axisLabel: { fontSize: 10, color: '#999' },
        axisLine: { lineStyle: { color: '#f0f0f0' } },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
      },
      {
        type: 'value',
        name: '速度(km/h)',
        position: 'right',
        axisLabel: { fontSize: 10, color: '#999' },
        axisLine: { lineStyle: { color: '#f0f0f0' } },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '高度',
        type: 'line',
        data: props.chartData.altitudes,
        yAxisIndex: 0,
        stroke: 'solid',
        smooth: true,
        itemStyle: { color: '#4CAF50' },
        lineStyle: { color: '#4CAF50', width: 2 },
        areaStyle: { color: 'rgba(76, 175, 80, 0.2)' },
        symbol: 'none',
      },
      {
        name: '速度',
        type: 'line',
        data: props.chartData.speeds,
        yAxisIndex: 1,
        smooth: true,
        itemStyle: { color: '#FFC107' },
        lineStyle: { color: '#FFC107', width: 2 },
        symbol: 'none',
      },
    ],
  }
  chart.setOption(option)
  window.addEventListener('resize', handleResize)
}

onMounted(() => {
  initChart()
})

onUnmounted(() => {
  if (chartInstance) {
    window.removeEventListener('resize', handleResize)
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<style scoped lang="scss">
.chart-container {
  height: 20vh;
  width: 20vw;
  margin: 8px 0;
}
</style>
