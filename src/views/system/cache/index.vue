<script setup lang="ts">
import { computed } from "vue";
import { useCacheMonitor } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import Refresh from "~icons/ep/refresh";
import Monitor from "~icons/ep/monitor";
import InfoFilled from "~icons/ep/info-filled";
import Coin from "~icons/ep/coin";
import Box from "~icons/ep/box";
import Aim from "~icons/ep/aim";
import Delete from "~icons/ep/delete";
import CopyDocument from "~icons/ep/copy-document";
import Check from "~icons/ep/check";
import PieChart from "~icons/ep/pie-chart";
import WarningFilled from "~icons/ep/warning-filled";
import DataLine from "~icons/ep/data-line";
import Failed from "~icons/ep/failed";
import Timer from "~icons/ep/timer";
import Clock from "~icons/ep/clock";
import Pointer from "~icons/ep/pointer";
import Odometer from "~icons/ep/odometer";

defineOptions({
  name: "SystemCache"
});

const {
  loading,
  keyword,
  filteredCaches,
  selected,
  selectedName,
  handleSelect,
  entryKeyword,
  entries,
  entryColumns,
  pageInfo,
  entryTotal,
  handleSizeChange,
  handleCurrentChange,
  loadAll,
  refreshTime,
  globalStats,
  envPrefix,
  healthSummary,
  ringRef,
  iconMeta,
  formatDuration,
  formatRate,
  rateColor,
  prettyJson,
  detail,
  detailVisible,
  copied,
  openDetail,
  copyDetail
} = useCacheMonitor();

/** 概览 KPI 卡(数字/右上淡图标/底部语义色微条) */
const kpiCards = computed(() => [
  {
    label: "缓存数量",
    value: globalStats.value.cacheCount,
    icon: Coin,
    color: "var(--el-color-primary)",
    bar: "var(--el-color-primary)"
  },
  {
    label: "条目总数",
    value: globalStats.value.entryCount,
    icon: Box,
    color: "var(--el-color-success)",
    bar: "var(--el-color-success)"
  },
  {
    label: "平均命中率",
    value: formatRate(globalStats.value.hitRate),
    colored: rateColor(globalStats.value.hitRate),
    icon: Aim,
    color: "var(--el-color-success)",
    bar: "var(--el-color-success)"
  },
  {
    label: "驱逐总数",
    value: globalStats.value.evictionCount,
    icon: Delete,
    color: "#7c3aed",
    bar: "#7c3aed"
  }
]);

/** 选中缓存的运行统计磁贴(命中/未命中/驱逐/平均回源耗时) */
const statTiles = computed(() => [
  {
    label: "命中次数",
    value: selected.value?.stats?.hitCount ?? 0,
    icon: DataLine,
    color: "var(--el-color-primary)",
    bg: "rgb(64 158 255 / 12%)"
  },
  {
    label: "未命中数",
    value: selected.value?.stats?.missCount ?? 0,
    icon: Failed,
    color: "var(--el-color-danger)",
    bg: "rgb(245 108 108 / 12%)"
  },
  {
    label: "驱逐次数",
    value: selected.value?.stats?.evictionCount ?? 0,
    icon: Delete,
    color: "#7c3aed",
    bg: "rgb(124 58 237 / 12%)"
  },
  {
    label: "平均回源耗时",
    value: `${selected.value?.stats?.averageLoadPenaltyMillis?.toFixed(2) ?? "—"}ms`,
    icon: Timer,
    color: "var(--el-color-success)",
    bg: "rgb(103 194 58 / 12%)"
  }
]);

/** 缓存策略磁贴 */
const policyTiles = computed(() => [
  {
    label: "写后过期",
    icon: Clock,
    value: formatDuration(selected.value?.expireAfterWrite)
  },
  {
    label: "访问后过期",
    icon: Pointer,
    value: formatDuration(selected.value?.expireAfterAccess)
  },
  {
    label: "最大容量",
    icon: Odometer,
    value: selected.value?.maximumSize ?? "不限制"
  }
]);
</script>

<template>
  <div>
    <!-- 页头:标题(含环境前缀) + 最近刷新 -->
    <div class="bg-bg_color px-4 py-3 mb-3 rounded flex-bc">
      <div class="flex items-center gap-3">
        <div
          class="size-10 rounded-lg flex-c flex-none"
          style="
            color: var(--el-color-primary);
            background: rgb(64 158 255 / 12%);
          "
        >
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
          @click="loadAll"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 健康摘要带:平均命中率 / 高命中缓存占比 / 驱逐提醒 -->
    <div class="bg-bg_color rounded px-4 py-2.5 mb-3 flex items-center text-sm">
      <div class="flex items-center gap-2">
        <el-icon :size="16" style="color: var(--el-color-success)">
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
      <div class="w-px h-3 mx-4" style="background: var(--el-border-color)" />
      <div class="flex items-center gap-2">
        <span
          class="size-2 rounded-full flex-none"
          style="background: var(--el-color-success)"
        />
        <span class="text-(--el-text-color-regular)">
          <span class="font-medium text-(--el-text-color-primary)">
            {{ healthSummary.healthyCount }}/{{ healthSummary.total }}
          </span>
          个缓存命中率 ≥90%
        </span>
      </div>
      <div class="w-px h-3 mx-4" style="background: var(--el-border-color)" />
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
          <el-icon
            :size="20"
            class="opacity-30"
            style="color: var(--el-text-color-secondary)"
          >
            <component :is="card.icon" />
          </el-icon>
        </div>
        <div
          class="absolute bottom-0 inset-x-0 h-1 opacity-80"
          :style="{ background: card.bar }"
        />
      </div>
    </div>

    <div class="flex items-stretch">
      <!-- 左侧:缓存列表(健康状态点 + 命中率进度);内层绝对定位,高度跟随右侧自适应表格,列表自身内滚、不撑高页面 -->
      <div class="bg-bg_color w-62.5 flex-none relative rounded">
        <div class="absolute inset-x-2 top-3 bottom-2 flex flex-col min-h-0">
          <el-input v-model="keyword" placeholder="搜索缓存名" clearable />
          <el-scrollbar class="flex-1 mt-2 min-h-0">
            <div
              v-for="item in filteredCaches"
              :key="item.cacheName"
              :class="[
                'cache-item flex items-center gap-2 rounded-sm p-2 mb-1 cursor-pointer select-none transition-colors',
                item.cacheName === selectedName
                  ? 'active'
                  : 'hover:bg-[#0000000f] dark:hover:bg-[#ffffff1f]'
              ]"
              @click="handleSelect(item.cacheName)"
            >
              <span
                class="size-1.5 rounded-full flex-none"
                :style="{ background: rateColor(item.stats?.hitRate) }"
              />
              <div
                class="size-8 rounded-md flex-c flex-none"
                :style="{
                  background: iconMeta(item.cacheName).bg,
                  color: iconMeta(item.cacheName).color
                }"
              >
                <el-icon :size="16">
                  <component :is="iconMeta(item.cacheName).icon" />
                </el-icon>
              </div>
              <div class="flex-1 min-w-0">
                <p class="truncate text-sm font-medium">
                  {{ item.cacheName }}
                </p>
                <div class="flex items-center gap-1.5 mt-1">
                  <div
                    class="flex-1 h-2 rounded-full overflow-hidden"
                    style="background: var(--el-fill-color)"
                  >
                    <div
                      class="h-full rounded-full"
                      :style="{
                        width: `${Math.round((item.stats?.hitRate ?? 0) * 100)}%`,
                        background: rateColor(item.stats?.hitRate)
                      }"
                    />
                  </div>
                  <span
                    class="text-[11px] leading-none flex-none"
                    :style="{ color: rateColor(item.stats?.hitRate) }"
                  >
                    {{ formatRate(item.stats?.hitRate) }}
                  </span>
                </div>
              </div>
              <el-tag size="small" effect="plain">
                {{ item.entries.length }}
              </el-tag>
            </div>
            <el-empty
              v-if="filteredCaches.length === 0"
              :image-size="60"
              description="暂无缓存数据"
            />
          </el-scrollbar>
        </div>
      </div>

      <!-- 右侧:KPI 磁贴带 + 仪表与策略 + 条目表格 -->
      <div class="flex-1 min-w-0 ml-3 bg-bg_color rounded p-4">
        <PureTableBar :columns="entryColumns" @refresh="loadAll">
          <template #title>
            <span class="font-bold flex items-center gap-1">
              「{{ selectedName }}」缓存数据
              <el-tooltip
                content="统计为自应用启动以来的累计值，重启后归零"
                placement="top"
              >
                <el-icon
                  class="cursor-pointer"
                  style="color: var(--el-color-primary)"
                >
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </span>
          </template>
          <template #buttons>
            <el-input
              v-model="entryKeyword"
              placeholder="搜索缓存键"
              clearable
              class="w-45!"
            />
          </template>
          <template v-slot="{ size, dynamicColumns }">
            <!-- 运行统计 KPI 磁贴带 -->
            <div class="grid grid-cols-4 gap-3 mb-4">
              <div
                v-for="tile in statTiles"
                :key="tile.label"
                class="flex items-center gap-3 p-3 rounded"
                style="background: var(--el-fill-color)"
              >
                <div
                  class="size-10 rounded flex-c flex-none"
                  :style="{ background: tile.bg, color: tile.color }"
                >
                  <el-icon :size="20">
                    <component :is="tile.icon" />
                  </el-icon>
                </div>
                <div>
                  <p class="text-lg font-medium m-0 leading-none">
                    {{ tile.value }}
                  </p>
                  <p
                    class="text-xs text-(--el-text-color-secondary) m-0 mt-1.5"
                  >
                    {{ tile.label }}
                  </p>
                </div>
              </div>
            </div>

            <!-- 命中率仪表环(echarts) + 缓存策略磁贴 -->
            <div class="flex items-center gap-8 mb-4 px-2">
              <div ref="ringRef" class="gauge-echarts" />
              <div
                class="w-px h-20 flex-none"
                style="background: var(--el-border-color-lighter)"
              />
              <div class="flex-1 min-w-0 grid grid-cols-3 gap-4">
                <div
                  v-for="tile in policyTiles"
                  :key="tile.label"
                  class="strategy-tile"
                >
                  <div
                    class="flex items-center gap-1.5 mb-2.5 text-[13px] text-(--el-text-color-regular)"
                  >
                    <el-icon :size="15">
                      <component :is="tile.icon" />
                    </el-icon>
                    {{ tile.label }}
                  </div>
                  <p class="text-base font-medium m-0">{{ tile.value }}</p>
                </div>
              </div>
            </div>

            <!-- 条目表格(自适应高度,分页固定视口底部,与用户/角色页一致);offsetBottom 需覆盖表格下方固定开销:分页器 64 + PureTableBar 槽位 pb-2 8 + 右栏卡片 p-4 底部 16 = 88,再加底部留白 24 与余量 12(对齐 user 页 108 = 72 + 24 + 12 的构成),取 124(main-content 底部 margin 已按表格页惯例归零) -->
            <pure-table
              row-key="key"
              adaptive
              :adaptiveConfig="{ offsetBottom: 124 }"
              align-whole="center"
              showOverflowTooltip
              table-layout="auto"
              :loading="loading"
              :size="size"
              :data="entries"
              :columns="dynamicColumns"
              :pagination="{ ...pageInfo, total: entryTotal, size }"
              :header-cell-style="{
                background: 'var(--el-fill-color-light)',
                color: 'var(--el-text-color-primary)'
              }"
              @page-size-change="handleSizeChange"
              @page-current-change="handleCurrentChange"
            >
              <template #operation="{ row }">
                <el-button
                  class="reset-margin"
                  link
                  type="primary"
                  :size="size"
                  @click="openDetail(row)"
                >
                  详情
                </el-button>
              </template>
            </pure-table>
          </template>
        </PureTableBar>
      </div>
    </div>

    <!-- 值详情弹窗:深色代码块 + 复制 -->
    <el-dialog
      v-model="detailVisible"
      :title="`缓存键：${detail?.key ?? ''}`"
      width="600px"
    >
      <div v-if="detail?.value == null" class="text-center py-4">
        <el-tag type="warning" effect="light">
          该键缓存的是数据不存在的空值占位
        </el-tag>
      </div>
      <div v-else class="code-block">
        <div class="code-header">
          <span class="code-dot" />
          <span class="text-xs text-[rgba(220,220,242,0.6)]">JSON</span>
          <el-button
            text
            size="small"
            class="ml-auto!"
            :style="{
              color: copied
                ? 'var(--el-color-success)'
                : 'rgba(220,220,242,0.8)'
            }"
            @click="copyDetail"
          >
            <el-icon class="mr-1">
              <component :is="copied ? Check : CopyDocument" />
            </el-icon>
            {{ copied ? "已复制" : "复制" }}
          </el-button>
        </div>
        <pre class="code-body">{{ prettyJson(detail?.value) }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
/* 对齐表格页:底部 margin 归零,底部留白由自适应表格 offsetBottom 决定 */
.main-content {
  margin: 24px 24px 0 !important;
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

.cache-item {
  border-left: 3px solid transparent;

  &.active {
    background: var(--el-color-primary-light-9);
    border-left-color: var(--el-color-primary);
  }
}

.gauge-echarts {
  flex: none;
  width: 160px;
  height: 160px;
}

.strategy-tile {
  padding: 14px;
  background: var(--el-fill-color);
  border: 1px solid transparent;
  border-radius: 4px;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--el-border-color);
  }
}

.code-block {
  overflow: hidden;
  background: #1e1e1e;
  border-radius: 8px;
}

.code-header {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgb(255 255 255 / 8%);
}

.code-dot {
  width: 8px;
  height: 8px;
  background: var(--el-color-success);
  border-radius: 50%;
}

.code-body {
  max-height: 400px;
  padding: 12px 16px;
  margin: 0;
  overflow: auto;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d4d4d4;
}
</style>
