<script setup lang="ts">
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
</script>

<template>
  <div>
    <!-- 页头:标题 + 最近刷新 -->
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
          <p class="text-base font-medium">缓存监控</p>
          <p
            class="text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
          >
            Caffeine 本地缓存运行状态 · 时点快照
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span
          class="text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
        >
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

    <!-- 全局概览带:4 张统计卡 -->
    <div class="grid grid-cols-4 gap-3 mb-3">
      <div class="stat-card bg-bg_color rounded p-4 flex items-center gap-3">
        <div
          class="size-11 rounded-full flex-c flex-none"
          style="
            color: var(--el-color-primary);
            background: rgb(64 158 255 / 12%);
          "
        >
          <el-icon :size="22"><Coin /></el-icon>
        </div>
        <div>
          <p class="text-[22px]/6 font-medium">
            {{ globalStats.cacheCount }}
          </p>
          <p
            class="text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
          >
            缓存数量
          </p>
        </div>
      </div>
      <div class="stat-card bg-bg_color rounded p-4 flex items-center gap-3">
        <div
          class="size-11 rounded-full flex-c flex-none"
          style="
            color: var(--el-color-success);
            background: rgb(103 194 58 / 14%);
          "
        >
          <el-icon :size="22"><Box /></el-icon>
        </div>
        <div>
          <p class="text-[22px]/6 font-medium">
            {{ globalStats.entryCount }}
          </p>
          <p
            class="text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
          >
            条目总数
          </p>
        </div>
      </div>
      <div class="stat-card bg-bg_color rounded p-4 flex items-center gap-3">
        <div
          class="size-11 rounded-full flex-c flex-none"
          style="
            color: var(--el-color-warning);
            background: rgb(230 162 60 / 14%);
          "
        >
          <el-icon :size="22"><Aim /></el-icon>
        </div>
        <div>
          <p
            class="text-[22px]/6 font-medium"
            :style="{ color: rateColor(globalStats.hitRate) }"
          >
            {{ formatRate(globalStats.hitRate) }}
          </p>
          <p
            class="text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
          >
            平均命中率
          </p>
        </div>
      </div>
      <div class="stat-card bg-bg_color rounded p-4 flex items-center gap-3">
        <div
          class="size-11 rounded-full flex-c flex-none"
          style="color: #7c3aed; background: rgb(124 58 237 / 12%)"
        >
          <el-icon :size="22"><Delete /></el-icon>
        </div>
        <div>
          <p class="text-[22px]/6 font-medium">
            {{ globalStats.evictionCount }}
          </p>
          <p
            class="text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
          >
            驱逐总数
          </p>
        </div>
      </div>
    </div>

    <div class="flex items-stretch">
      <!-- 左侧:缓存列表(主) -->
      <div
        class="bg-bg_color w-60 flex-none px-2 pt-3 pb-2 overflow-hidden flex flex-col"
      >
        <el-input v-model="keyword" placeholder="搜索缓存名" clearable />
        <el-scrollbar class="flex-1 mt-2">
          <div
            v-for="item in filteredCaches"
            :key="item.cacheName"
            :class="[
              'cache-item flex items-center gap-2 rounded-sm p-2   cursor-pointer select-none transition-colors',
              item.cacheName === selectedName
                ? 'active'
                : 'hover:bg-[#0000000f] dark:hover:bg-[#ffffff1f]'
            ]"
            @click="handleSelect(item.cacheName)"
          >
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
              <p class="truncate text-sm font-medium">{{ item.cacheName }}</p>
              <div class="flex items-center gap-1.5">
                <el-progress
                  class="flex-1"
                  :percentage="Math.round((item.stats?.hitRate ?? 0) * 100)"
                  :show-text="false"
                  :stroke-width="6"
                  :color="rateColor(item.stats?.hitRate)"
                />
                <span
                  class="text-xs flex-none"
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

      <!-- 右侧:命中率仪表 + 策略 + 条目(从,整卡承载) -->
      <div
        class="flex-1 min-w-0 ml-3 bg-bg_color rounded p-3 flex flex-col overflow-hidden"
      >
        <PureTableBar
          :columns="entryColumns"
          class="mt-0! px-0!"
          @refresh="loadAll"
        >
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
            <!-- 命中率仪表环(echarts) + 策略与实例统计(分组瓦片) -->
            <div class="mb-3 pl-6 flex items-center gap-8">
              <div ref="ringRef" class="gauge-echarts" />
              <div
                class="w-px h-20 flex-none"
                style="background: var(--el-border-color-lighter)"
              />
              <div class="flex-1 min-w-0">
                <!-- 缓存策略 -->
                <div class="flex items-center gap-1.5 mb-1.5">
                  <span
                    class="w-0.5 h-3 rounded-sm flex-none"
                    style="background: var(--el-color-primary)"
                  />
                  <span
                    class="text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
                  >
                    缓存策略
                  </span>
                </div>
                <div class="grid grid-cols-3 gap-x-6">
                  <div>
                    <p
                      class="text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
                    >
                      写后过期
                    </p>
                    <p class="text-sm font-medium mt-0.5">
                      {{ formatDuration(selected?.expireAfterWrite) }}
                    </p>
                  </div>
                  <div>
                    <p
                      class="text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
                    >
                      访问后过期
                    </p>
                    <p class="text-sm font-medium mt-0.5">
                      {{ formatDuration(selected?.expireAfterAccess) }}
                    </p>
                  </div>
                  <div>
                    <p
                      class="text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
                    >
                      最大容量
                    </p>
                    <p class="text-sm font-medium mt-0.5">
                      {{ selected?.maximumSize ?? "不限制" }}
                    </p>
                  </div>
                </div>
                <!-- 运行统计 -->
                <div class="flex items-center gap-1.5 mt-3 mb-1.5">
                  <span
                    class="w-0.5 h-3 rounded-sm flex-none"
                    style="background: var(--el-color-primary)"
                  />
                  <span
                    class="text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
                  >
                    运行统计
                  </span>
                </div>
                <div class="grid grid-cols-3 gap-x-6">
                  <div>
                    <p
                      class="text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
                    >
                      命中 / 未命中
                    </p>
                    <p class="text-sm font-medium mt-0.5">
                      {{ selected?.stats?.hitCount ?? 0 }} /
                      {{ selected?.stats?.missCount ?? 0 }}
                    </p>
                  </div>
                  <div>
                    <p
                      class="text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
                    >
                      驱逐 / 回源失败
                    </p>
                    <p class="text-sm font-medium mt-0.5">
                      {{ selected?.stats?.evictionCount ?? 0 }} /
                      {{ selected?.stats?.loadFailureCount ?? 0 }}
                    </p>
                  </div>
                  <div>
                    <p
                      class="text-xs text-[rgba(42,46,54,0.45)] dark:text-[rgba(220,220,242,0.45)]"
                    >
                      平均回源耗时
                    </p>
                    <p class="text-sm font-medium mt-0.5">
                      {{
                        selected?.stats?.averageLoadPenaltyMillis?.toFixed(2) ??
                        "—"
                      }}ms
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <pure-table
              adaptive
              :adaptiveConfig="{ offsetBottom: 120 }"
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
  width: 120px;
  height: 120px;
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
