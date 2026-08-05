<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import * as echarts from 'echarts'

const props = defineProps<{
  chartData: {
    altitudes: number[]
    speeds: number[]
    times: string[]
  }
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null
let rafId = 0

const buildOption = () => ({
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
})

const handleResize = useDebounceFn(() => {
  chartInstance?.resize()
}, 300)

const initChart = () => {
  const el = chartRef.value
  if (!el || chartInstance) return

  // 抽屉打开 / v-show 切换时宽高可能仍为 0，等有尺寸再 init
  if (el.clientWidth === 0 || el.clientHeight === 0) {
    rafId = requestAnimationFrame(initChart)
    return
  }

  chartInstance = echarts.init(el)
  chartInstance.setOption(buildOption())
}

onMounted(async () => {
  await nextTick()
  initChart()

  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (!chartInstance) {
        initChart()
        return
      }
      handleResize()
    })
    resizeObserver.observe(chartRef.value)
  }

  window.addEventListener('resize', handleResize)
})

watch(
  () => props.chartData,
  () => {
    chartInstance?.setOption(buildOption())
  },
  { deep: true },
)

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', handleResize)
  resizeObserver?.disconnect()
  resizeObserver = null
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<style scoped lang="scss">
.chart-container {
  height: 20vh;
  width: 100%;
  min-height: 160px;
  margin: 8px 0;
}
</style>
