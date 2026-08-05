<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import * as echarts from 'echarts'
import { useStationEquipmentStore } from '@/stores/station-equipment'
import type { EquipmentSource, EquipmentStatus } from '../../types/station-equipment'
import { STATUS_LABEL } from '../../types/station-equipment'

export interface EquipmentMetricRow {
  name: string
  text: string
  status: EquipmentStatus
}

export interface EquipmentMetricOption {
  key: string
  label: string
  yName: string
  /** 固定 Y 轴上限（如蓄水池液位 4）；不传则按数据 * 1.1 */
  yMax?: number
  getValue: (row: EquipmentMetricRow) => number
}

const props = defineProps<{
  rows: EquipmentMetricRow[]
  source: EquipmentSource
  metrics: EquipmentMetricOption[]
  /** tooltip 额外行；默认展示全部 metrics + 状态 */
  formatTooltip?: (row: EquipmentMetricRow) => string[]
}>()

const emit = defineEmits<{
  detail: [row: EquipmentMetricRow]
}>()

const store = useStationEquipmentStore()

type MetricSort = 'default' | 'asc' | 'desc'
const metricKey = ref(props.metrics[0]?.key ?? '')
const metricSort = ref<MetricSort>('desc')

watch(
  () => props.metrics,
  (list) => {
    if (!list.some((m) => m.key === metricKey.value)) {
      metricKey.value = list[0]?.key ?? ''
    }
  },
  { deep: true },
)

const showMetricSwitch = computed(() => props.metrics.length > 1)

const metricMeta = computed(
  () => props.metrics.find((m) => m.key === metricKey.value) ?? props.metrics[0],
)

const displayRows = computed(() => {
  const rows = props.rows
  const meta = metricMeta.value
  if (!meta) return rows
  if (metricSort.value === 'asc') {
    return [...rows].sort((a, b) => meta.getValue(a) - meta.getValue(b))
  }
  if (metricSort.value === 'desc') {
    return [...rows].sort((a, b) => meta.getValue(b) - meta.getValue(a))
  }
  return rows
})

const STATUS_BAR_COLOR: Record<EquipmentStatus, string> = {
  normal: '#409eff',
  warning: '#e6a23c',
  danger: '#f56c6c',
}
const SELECTED_BAR_BORDER = '#f59e0b'

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const handleChartResize = useDebounceFn(() => {
  chartInstance?.resize()
}, 200)

const buildTooltipHtml = (row: EquipmentMetricRow): string => {
  const lines = props.formatTooltip
    ? props.formatTooltip(row)
    : [
        ...props.metrics.map((m) => `${m.label}：${m.getValue(row)}`),
        `状态：${STATUS_LABEL[row.status]}`,
      ]
  return [
    `<div><strong>${row.text}</strong></div>`,
    `<div>编号：${row.name}</div>`,
    ...lines.map((line) => `<div>${line}</div>`),
  ].join('')
}

const buildChartOption = (): echarts.EChartsOption => {
  const rows = displayRows.value
  const meta = metricMeta.value
  if (!meta) return {}

  const selectedName =
    store.selected?.source === props.source ? store.selected.name : null
  const values = rows.map((row) => meta.getValue(row))
  const maxValue = values.length ? Math.max(...values, 0) : 0
  const yMax =
    meta.yMax != null
      ? meta.yMax
      : maxValue > 0
        ? Math.ceil(maxValue * 1.1 * 10) / 10
        : undefined

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params]
        const item = list[0]
        if (!item || item.dataIndex == null) return ''
        const row = rows[item.dataIndex]
        if (!row) return ''
        return buildTooltipHtml(row)
      },
    },
    grid: {
      left: 48,
      right: 16,
      top: 28,
      bottom: rows.length > 10 ? 56 : 40,
      containLabel: true,
    },
    dataZoom:
      rows.length > 10
        ? [
            { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
            {
              type: 'slider',
              xAxisIndex: 0,
              height: 18,
              bottom: 4,
              filterMode: 'none',
            },
          ]
        : undefined,
    xAxis: {
      type: 'category',
      data: rows.map((row) => row.text),
      axisLabel: {
        interval: 0,
        rotate: rows.length > 8 ? 30 : 0,
        fontSize: 11,
        triggerEvent: true,
      },
    },
    yAxis: {
      type: 'value',
      name: meta.yName,
      min: 0,
      max: yMax,
      axisLabel: { fontSize: 11 },
      splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } },
    },
    series: [
      {
        name: meta.label,
        type: 'bar',
        barMaxWidth: 36,
        label: {
          show: true,
          position: 'top',
          fontSize: 11,
          color: '#606266',
          formatter: '{c}',
        },
        data: rows.map((row) => ({
          value: meta.getValue(row),
          itemStyle: {
            color: STATUS_BAR_COLOR[row.status],
            borderColor: selectedName === row.name ? SELECTED_BAR_BORDER : 'transparent',
            borderWidth: selectedName === row.name ? 2 : 0,
            borderRadius: [6, 6, 0, 0],
          },
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 8,
            shadowColor: 'rgba(0, 0, 0, 0.25)',
          },
        },
      },
    ],
  }
}

const selectRowByIndex = (index: number): void => {
  const row = displayRows.value[index]
  if (!row) return
  emit('detail', row)
}

const onChartClick = (params: echarts.ECElementEvent): void => {
  if (params.componentType === 'series' && params.dataIndex != null) {
    selectRowByIndex(params.dataIndex)
    return
  }
  if (params.componentType === 'xAxis' && typeof params.value === 'string') {
    const index = displayRows.value.findIndex((row) => row.text === params.value)
    if (index >= 0) selectRowByIndex(index)
  }
}

const ensureChart = async (): Promise<void> => {
  await nextTick()
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
    chartInstance.on('click', onChartClick)
    window.addEventListener('resize', handleChartResize)
  }
  chartInstance.setOption(buildChartOption(), true)
  chartInstance.resize()
}

onMounted(() => {
  void ensureChart()
})

watch(
  [displayRows, metricKey, metricSort, () => store.selected, () => props.metrics],
  () => {
    if (!chartInstance) return
    chartInstance.setOption(buildChartOption(), true)
  },
  { deep: true },
)

onUnmounted(() => {
  window.removeEventListener('resize', handleChartResize)
  if (chartInstance) {
    chartInstance.off('click', onChartClick)
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<template>
  <div>
    <div class="chart-toolbar">
      <template v-if="showMetricSwitch">
        <span class="chart-toolbar__label">指标</span>
        <el-radio-group v-model="metricKey" size="small">
          <el-radio-button
            v-for="opt in metrics"
            :key="opt.key"
            :value="opt.key"
          >
            {{ opt.label }}
          </el-radio-button>
        </el-radio-group>
      </template>
      <span
        class="chart-toolbar__label"
        :class="{ 'chart-toolbar__label--sort': showMetricSwitch }"
      >
        排序
      </span>
      <el-radio-group v-model="metricSort" size="small">
        <el-radio-button value="default">默认</el-radio-button>
        <el-radio-button value="asc">升序</el-radio-button>
        <el-radio-button value="desc">降序</el-radio-button>
      </el-radio-group>
    </div>
    <div class="chart-wrap">
      <div ref="chartRef" class="metric-chart" />
      <div v-if="displayRows.length === 0" class="chart-empty">暂无筛选结果</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chart-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.chart-toolbar__label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.chart-toolbar__label--sort {
  margin-left: 8px;
}

.chart-wrap {
  position: relative;
}

.metric-chart {
  width: 100%;
  height: 280px;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  pointer-events: none;
}
</style>
