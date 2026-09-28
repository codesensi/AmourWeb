<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getFootprintStats, type FootprintStats } from "@/api/admin-footprint";
import { useECharts } from "@/hooks/useECharts";

defineOptions({ name: "FootprintStatsCard" });

/** 统计年份(默认当前年份;切换即重拉) */
const year = ref(new Date().getFullYear());
const loading = ref(false);
const stats = ref<FootprintStats | null>(null);
const chartRef = ref<HTMLElement>();
const { setOptions } = useECharts(chartRef);

/** 年份选项(当前年份往前推 4 年) */
const yearOptions = computed(() => {
  const current = new Date().getFullYear();
  return [current, current - 1, current - 2, current - 3, current - 4];
});

/** 月度柱状图:1-12 月逐月补齐,空态由卡片级空态兜底 */
function renderChart() {
  const data = stats.value;
  if (!data) return;
  setOptions({
    grid: { left: 8, right: 8, top: 24, bottom: 0, containLabel: true },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: data.byMonth.map(item => `${item.month}月`)
    },
    yAxis: { type: "value", minInterval: 1 },
    series: [
      {
        type: "bar",
        name: "到访次数",
        barMaxWidth: 18,
        data: data.byMonth.map(item => item.count),
        itemStyle: { borderRadius: [4, 4, 0, 0] }
      }
    ]
  });
}

/** 加载年度统计(切换年份防重入) */
async function load() {
  if (loading.value) return;
  loading.value = true;
  try {
    stats.value = (await getFootprintStats(year.value)).data;
    renderChart();
  } finally {
    loading.value = false;
  }
}

/** 切换统计年份(重置型操作) */
function switchYear(value: number) {
  if (value === year.value) return;
  year.value = value;
  load();
}

onMounted(load);
</script>

<template>
  <el-card v-loading="loading" shadow="never" class="mb-2">
    <template #header>
      <div class="flex-bc gap-3">
        <span class="whitespace-nowrap font-medium">{{ year }} 年足迹统计</span>
        <el-select
          :model-value="year"
          class="w-30!"
          @update:model-value="switchYear"
        >
          <el-option
            v-for="item in yearOptions"
            :key="item"
            :label="`${item} 年`"
            :value="item"
          />
        </el-select>
      </div>
    </template>
    <template v-if="stats">
      <div class="flex flex-wrap items-stretch gap-4">
        <div class="flex gap-3">
          <div class="stat-tile">
            <div class="stat-num">{{ stats.totalVisits }}</div>
            <div class="stat-label">到访次数</div>
          </div>
          <div class="stat-tile">
            <div class="stat-num">{{ stats.totalCities }}</div>
            <div class="stat-label">到访城市</div>
          </div>
        </div>
        <div ref="chartRef" class="footprint-chart min-w-0 flex-1" />
      </div>
      <div v-if="stats.topCities.length" class="mt-3">
        <span class="text-sm" style="color: var(--el-text-color-secondary)">
          到访城市排行：
        </span>
        <el-tag
          v-for="(item, index) in stats.topCities"
          :key="item.city"
          class="ml-1"
          :type="index === 0 ? 'primary' : 'info'"
          effect="plain"
          size="small"
        >
          {{ item.city }}（{{ item.count }}）
        </el-tag>
      </div>
    </template>
    <el-empty
      v-else-if="!loading"
      description="该年份还没有足迹"
      :image-size="80"
    />
  </el-card>
</template>

<style scoped>
.stat-tile {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 96px;
  padding: 12px 16px;
  text-align: center;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.stat-num {
  font-size: 22px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-color-primary);
}

.stat-label {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.footprint-chart {
  width: 100%;
  min-width: 0;
  height: 220px;
}
</style>
