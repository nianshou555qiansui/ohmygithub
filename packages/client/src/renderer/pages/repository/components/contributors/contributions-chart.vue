<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { DataZoomComponent, GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { cssColorVar, useChartThemeVersion } from '@/components/charts/chart-theme'

use([CanvasRenderer, DataZoomComponent, GridComponent, LineChart, TooltipComponent])

const WEEK_SECONDS = 7 * 24 * 60 * 60

const props = defineProps<{
  weeks: number[]
  values: number[]
  metric: 'commits' | 'additions' | 'deletions'
}>()

const emit = defineEmits<{
  'update:range': [range: { start: number; end: number } | null]
}>()

const { locale, t } = useI18n()
const chartRef = ref<InstanceType<typeof VChart> | null>(null)
const themeVersion = useChartThemeVersion()

const chartTheme = computed(() => {
  themeVersion.value

  return {
    background: cssColorVar('--popover', '#171717'),
    border: cssColorVar('--border', 'rgb(64 64 64)'),
    foreground: cssColorVar('--foreground', '#e5e5e5'),
    mutedForeground: cssColorVar('--muted-foreground', '#a3a3a3'),
    series: props.metric === 'deletions'
      ? cssColorVar('--destructive', '#f85149')
      : cssColorVar('--success', '#3fb950'),
  }
})

const chartData = computed<Array<[number, number]>>(() =>
  props.weeks.map((week, index) => [week * 1000, props.values[index] ?? 0])
)

const chartOption = computed<EChartsOption>(() => {
  const theme = chartTheme.value

  return {
    animation: false,
    backgroundColor: 'transparent',
    grid: { bottom: 56, left: 48, right: 16, top: 16 },
    xAxis: {
      type: 'time',
      axisLabel: { color: theme.mutedForeground, fontSize: 11 },
      axisLine: { lineStyle: { color: theme.border } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: theme.mutedForeground, fontSize: 11 },
      splitLine: { lineStyle: { color: theme.border, opacity: 0.5 } },
    },
    series: [
      {
        type: 'line',
        data: chartData.value,
        showSymbol: false,
        lineStyle: { color: theme.series, width: 1.5 },
        itemStyle: { color: theme.series },
        areaStyle: { color: theme.series, opacity: 0.2 },
      },
    ],
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        height: 28,
        bottom: 8,
        borderColor: theme.border,
        fillerColor: 'rgba(127, 127, 127, 0.12)',
        handleStyle: { color: theme.background, borderColor: theme.mutedForeground },
        moveHandleSize: 4,
        textStyle: { color: theme.mutedForeground, fontSize: 10 },
        brushSelect: true,
      },
      { type: 'inside', xAxisIndex: 0 },
    ],
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: theme.background,
      borderColor: theme.border,
      borderWidth: 1,
      confine: true,
      formatter: formatTooltip,
      padding: [6, 8],
      textStyle: { color: theme.foreground, fontSize: 12 },
    },
  }
})

function formatTooltip(params: unknown): string {
  const first = Array.isArray(params) ? params[0] : params
  const data = typeof first === 'object' && first !== null && 'data' in first
    ? (first as { data?: unknown }).data
    : null
  if (!Array.isArray(data)) return ''

  const weekStart = Number(data[0] ?? 0)
  const value = Number(data[1] ?? 0)
  const date = new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(weekStart))

  return t(`repository.contributors.tooltip.${props.metric}`, {
    count: new Intl.NumberFormat().format(value),
    date,
  })
}

function handleDataZoom(): void {
  const chart = chartRef.value
  const firstWeek = props.weeks[0]
  const lastWeek = props.weeks[props.weeks.length - 1]
  if (!chart || firstWeek === undefined || lastWeek === undefined) return

  const option = chart.getOption() as {
    dataZoom?: Array<{ startValue?: number | string; endValue?: number | string }>
  }
  const zoom = option.dataZoom?.[0]
  const startValue = Number(zoom?.startValue)
  const endValue = Number(zoom?.endValue)
  if (!Number.isFinite(startValue) || !Number.isFinite(endValue)) {
    emit('update:range', null)
    return
  }

  const start = snapToWeek(startValue / 1000, firstWeek, 'floor')
  const end = snapToWeek(endValue / 1000, firstWeek, 'ceil')
  if (start <= firstWeek && end >= lastWeek) {
    emit('update:range', null)
    return
  }

  emit('update:range', {
    start: Math.max(firstWeek, start),
    end: Math.min(lastWeek, end),
  })
}

function snapToWeek(seconds: number, firstWeek: number, mode: 'floor' | 'ceil'): number {
  const offset = (seconds - firstWeek) / WEEK_SECONDS

  return firstWeek + (mode === 'floor' ? Math.floor(offset) : Math.ceil(offset)) * WEEK_SECONDS
}
</script>

<template>
  <div class="rounded-lg border border-border p-3">
    <VChart
      ref="chartRef"
      autoresize
      :option="chartOption"
      :style="{ height: '256px', width: '100%' }"
      @datazoom="handleDataZoom"
    />
  </div>
</template>
