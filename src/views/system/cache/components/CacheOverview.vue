<script setup lang="ts">
// 缓存监控仪表盘统计区(对齐后端 CacheController 聚合数据):
// 页头(标题/环境前缀/最近刷新) + 健康摘要带 + 全局 KPI 概览带
// 数据全部来自父级的 useCacheMonitor 单例状态,本组件不重复订阅
import { computed } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { formatRate, rateColor } from "../utils/hook";

import Refresh from "~icons/ep/refresh";
import Monitor from "~icons/ep/monitor";
import PieChart from "~icons/ep/pie-chart";
import WarningFilled from "~icons/ep/warning-filled";
import Coin from "~icons/ep/coin";
import Box from "~icons/ep/box";
import Aim from "~icons/ep/aim";
import Delete from "~icons/ep/delete";

const props = defineProps<{
  /** 刷新请求进行中(按钮 loading) */
  loading: boolean;
  /** 最近一次成功拉取的时间文案 */
  refreshTime: string;
  /** 运行环境前缀(如 amour_dev) */
  envPrefix: string;
  /** 全局聚合统计(缓存数/条目数/加权命中率/驱逐数) */
  globalStats: {
    cacheCount: number;
    entryCount: number;
    hitRate: number | null;
    evictionCount: number;
  };
  /** 健康摘要(命中率 ≥90% 的缓存占比) */
  healthSummary: { total: number; healthyCount: number };
}>();

const emit = defineEmits<{ refresh: [] }>();

/** 概览 KPI 卡(数字/右上淡图标/底部语义色微条) */
const kpiCards = computed(() => [
  {
    label: "缓存数量",
    value: props.globalStats.cacheCount,
    icon: Coin,
    color: "var(--el-color-primary)",
    bar: "var(--el-color-primary)"
  },
  {
    label: "条目总数",
    value: props.globalStats.entryCount,
    icon: Box,
    color: "var(--el-color-success)",
    bar: "var(--el-color-success)"
  },
  {
    label: "平均命中率",
    value: formatRate(props.globalStats.hitRate),
    colored: rateColor(props.globalStats.hitRate),
    icon: Aim,
    color: "var(--el-color-success)",
    bar: "var(--el-color-success)"
  },
  {
    label: "驱逐总数",
    value: props.globalStats.evictionCount,
    icon: Delete,
    color: "#7c3aed",
    bar: "#7c3aed"
  }
]);
</script>

<template>
  <div>
    <!-- 页头:标题(含环境前缀) + 最近刷新 -->
    <div class="bg-bg_color px-4 py-3 mb-3 rounded flex-bc">
      <div class="flex items-center gap-3">
        <div class="size-10 rounded-lg flex-c flex-none head-icon">
          <el-icon :size="22"><Monitor /></el-icon>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <p class="text-base font-medium">缓存监控</p>
            <el-tag v-if="envPrefix" size="small" effect="plain">
              {{ envPrefix }}
            </el-tag>
          </div>
          <p class="text-xs text-(--el-text-color-secondary)">
            Caffeine 本地缓存运行状态 · 时点快照
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-(--el-text-color-secondary)">
          最近刷新 {{ refreshTime }}
        </span>
        <el-button
          type="primary"
          :icon="useRenderIcon(Refresh)"
          :loading="loading"
          @click="emit('refresh')"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 健康摘要带:平均命中率 / 高命中缓存占比 / 驱逐提醒 -->
    <div class="bg-bg_color rounded px-4 py-2.5 mb-3 flex items-center text-sm">
      <div class="flex items-center gap-2">
        <el-icon :size="16" class="health-icon">
          <PieChart />
        </el-icon>
        <span class="text-(--el-text-color-regular)">
          平均命中率
          <span
            class="font-medium"
            :style="{ color: rateColor(globalStats.hitRate) }"
          >
            {{ formatRate(globalStats.hitRate) }}
          </span>
        </span>
      </div>
      <div class="v-divider w-px h-3 mx-4" />
      <div class="flex items-center gap-2">
        <span class="size-2 rounded-full flex-none dot-success" />
        <span class="text-(--el-text-color-regular)">
          <span class="font-medium text-(--el-text-color-primary)">
            {{ healthSummary.healthyCount }}/{{ healthSummary.total }}
          </span>
          个缓存命中率 ≥90%
        </span>
      </div>
      <div class="v-divider w-px h-3 mx-4" />
      <div
        class="flex items-center gap-2"
        :style="{
          color:
            globalStats.evictionCount > 0
              ? 'var(--el-color-warning)'
              : 'var(--el-text-color-secondary)'
        }"
      >
        <el-icon :size="16"><WarningFilled /></el-icon>
        <span>
          {{
            globalStats.evictionCount > 0
              ? `驱逐 ${globalStats.evictionCount} 次需要关注`
              : "暂无驱逐记录"
          }}
        </span>
      </div>
    </div>

    <!-- 紧凑 KPI 概览带:数字左上 + 淡图标右上 + 底部语义色微条 -->
    <div class="grid grid-cols-4 gap-3 mb-3">
      <div
        v-for="card in kpiCards"
        :key="card.label"
        class="stat-card bg-bg_color rounded relative overflow-hidden flex flex-col p-4"
      >
        <div class="flex justify-between items-start">
          <div>
            <p
              class="text-2xl leading-none font-medium m-0"
              :style="card.colored ? { color: card.colored } : undefined"
            >
              {{ card.value }}
            </p>
            <p class="text-xs text-(--el-text-color-secondary) m-0 mt-2">
              {{ card.label }}
            </p>
          </div>
          <el-icon :size="20" class="opacity-30 kpi-icon">
            <component :is="card.icon" />
          </el-icon>
        </div>
        <div
          class="absolute bottom-0 inset-x-0 h-1 opacity-80"
          :style="{ background: card.bar }"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 页头标题图标:主色 + 浅色圆底(原内联样式) */
.head-icon {
  color: var(--el-color-primary);
  background: rgb(64 158 255 / 12%);
}

/* 健康摘要带命中图标(原内联样式) */
.health-icon {
  color: var(--el-color-success);
}

/* 摘要带竖向分隔线(原内联样式) */
.v-divider {
  background: var(--el-border-color);
}

/* 健康状态点(原内联样式) */
.dot-success {
  background: var(--el-color-success);
}

/* KPI 卡淡图标(原内联样式) */
.kpi-icon {
  color: var(--el-text-color-secondary);
}

.stat-card {
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    box-shadow: var(--el-box-shadow-light);
    transform: translateY(-2px);
  }
}
</style>
