<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Analytics</h1>
    <div class="mb-8">
      <div class="flex items-center gap-2 mb-2">
        <label>Date Range:</label>
        <input type="date" v-model="startDate" class="border rounded px-2 py-1" />
        <span>-</span>
        <input type="date" v-model="endDate" class="border rounded px-2 py-1" />
        <button @click="fetchSmsSent" class="ml-2 px-3 py-1 border rounded bg-blue-500 text-white">Update</button>
      </div>
      <h2 class="text-lg font-semibold mb-2">Number of SMS Sent Throughout Specific Timeframe</h2>
      <div v-if="loadingSmsSent" class="text-gray-500">Loading...</div>
      <div v-else>
        <div class="bar-chart-scroll-wrapper">
          <div :style="{ minWidth: '400px', width: Math.max(smsSentData.length * 50, 400) + 'px', height: '300px' }">
            <Bar v-if="smsSentData.length"
              :data="smsSentChartData"
              :options="barOptions"
              :plugins="[ChartDataLabels, BarHoverHighlight]"
              :width="Math.max(smsSentData.length * 50, 400)"
              :height="300"
            />
            <div v-else class="text-gray-500">No data available for selected range.</div>
          </div>
        </div>
      </div>
    </div>
    <div>
      <h2 class="text-lg font-semibold mb-2">Number of SMS Sent to Specific States</h2>
      <div v-if="loadingSmsByState" class="text-gray-500">Loading...</div>
      <div v-else>
        <div class="bar-chart-scroll-wrapper">
          <Bar v-if="smsByStateData.length"
            :data="smsByStateChartData"
            :options="barOptionsByState"
            :plugins="[ChartDataLabels, BarHoverHighlight]"
            :width="Math.max(smsByStateData.length * 50, 400)"
            :height="300"
          />
          <div v-else class="text-gray-500">No data available for states.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import api from '../api'
import { Bar } from 'vue-chartjs'
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { useRoute, useRouter } from 'vue-router'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)
Chart.register(ChartDataLabels)

function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function getDefaultStartDate() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return formatDateLocal(d);
}
function getDefaultEndDate() {
  const d = new Date();
  return formatDateLocal(d);
}

const route = useRoute();
const router = useRouter();

const startDate = ref(route.query.start ? String(route.query.start) : getDefaultStartDate());
const endDate = ref(route.query.end ? String(route.query.end) : getDefaultEndDate());

function updateQuery(params: Record<string, any>) {
  router.replace({ query: { ...route.query, ...params } })
}

let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

watch([startDate, endDate], ([newStart, newEnd]) => {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    updateQuery({ start: newStart, end: newEnd });
    fetchSmsSent();
    fetchSmsByState();
  }, 500);
});

onMounted(() => {
  // If not present in query, set defaults in URL
  if (!route.query.start || !route.query.end) {
    updateQuery({ start: startDate.value, end: endDate.value });
  }
  fetchSmsSent();
  fetchSmsByState();
});

const smsSentData = ref<{ sms_date: string, count: number }[]>([])
const smsByStateData = ref<{ state_display: string, count: number }[]>([])
const loadingSmsSent = ref(false)
const loadingSmsByState = ref(false)
const hoveredBarIndex = ref<number | null>(null)

const smsSentChartData = computed(() => ({
  labels: smsSentData.value.map(row => row.sms_date),
  datasets: [
    {
      label: 'SMS Sent',
      backgroundColor: '#3b82f6',
      data: smsSentData.value.map(row => row.count)
    }
  ]
}))

const smsByStateChartData = computed(() => ({
  labels: smsByStateData.value.map(row => row.state_display),
  datasets: [
    {
      label: 'SMS Sent',
      backgroundColor: (ctx: any) => {
        const index = ctx.dataIndex
        // if (hoveredBarIndex.value === index) {
        //   return '#f59e42' // Highlight color
        // }
        return '#10b981' // Default color
      },
      data: smsByStateData.value.map(row => row.count)
    }
  ]
}))

const barOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    datalabels: {
      anchor: 'end' as const,
      align: 'center' as const,
      color: '#333',
      font: { weight: 'bold' as const },
      formatter: (value: number) => value
    }
  },
  scales: {
    y: { beginAtZero: true },
    x: {
      ticks: {
        callback: function(this: any, value: any): string {
          const label = this.getLabelForValue(value);
          const date = new Date(label);
          if (isNaN(date.getTime())) return label; // fallback if not a date
          if (date.getDate() === 1) {
            const month = date.toLocaleString('default', { month: 'short' });
            return `${month}-${date.getDate()}`;
          } else {
            return date.getDate().toString();
          }
        }
      }
    }
  },
  interaction: {
    mode: 'index' as const,
    intersect: false
  },
  onHover: (event: any, elements: any[], chart: any) => {
    if (elements && elements.length > 0) {
      hoveredBarIndex.value = elements[0].index
    } else {
      hoveredBarIndex.value = null
    }
  }
}

const barOptionsByState = {
  responsive: false,
  plugins: {
    legend: { display: false },
    datalabels: {
      anchor: 'end' as const,
      align: 'center' as const,
      color: '#333',
      font: { weight: 'bold' as const },
      formatter: (value: number) => value
    }
  },
  scales: {
    y: { beginAtZero: true }
  },
  interaction: {
    mode: 'index' as const,
    intersect: false
  },
  onHover: (event: any, elements: any[], chart: any) => {
    if (elements && elements.length > 0) {
      hoveredBarIndex.value = elements[0].index
    } else {
      hoveredBarIndex.value = null
    }
  },
  onClick: (event: any, elements: any[], chart: any) => {
    let index = elements[0]?.index;
    if (index !== undefined) {
      let state = smsByStateData.value[index]?.state_display;
      if (state) {
        router.push({
          path: '/candidators',
          query: { sortField: 'gmail_timestamp', sortOrder: 'dsc', state: state, page: 1, status: 'transferred', statusFilter: 'success' }
        })
      }
    }
  }
}

const BarHoverHighlight = {
  id: 'barHoverHighlight',
  afterDraw(chart: any) {
    const { ctx, chartArea, tooltip } = chart;
    if (!tooltip || !tooltip.dataPoints || !tooltip.dataPoints.length) return;
    const dataIndex = tooltip.dataPoints[0].dataIndex;
    const meta = chart.getDatasetMeta(0);
    const bar = meta.data[dataIndex];
    if (!bar) return;
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(
      bar.x - bar.width / 2,
      chartArea.top,
      bar.width,
      chartArea.bottom - chartArea.top
    );
    ctx.restore();
  }
};

async function fetchSmsSent() {
  loadingSmsSent.value = true
  try {
    const { data } = await api.get('/api/analytics/sms-sent', {
      params: { start: startDate.value, end: endDate.value }
    })
    smsSentData.value = data.data || []
  } catch (err) {
    smsSentData.value = []
  } finally {
    loadingSmsSent.value = false
  }
}

async function fetchSmsByState() {
  loadingSmsByState.value = true
  try {
    const { data } = await api.get('/api/analytics/sms-by-state', {
      params: { start: startDate.value, end: endDate.value }
    })
    smsByStateData.value = data.data || []
  } catch (err) {
    smsByStateData.value = []
  } finally {
    loadingSmsByState.value = false
  }
}
</script>

<style scoped>
.bar-chart-scroll-wrapper {
  overflow-x: auto;
  width: 100%;
}
</style>
