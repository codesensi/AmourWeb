<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import ReCol from "@/components/ReCol";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useUserStoreHook } from "@/store/modules/user";
import {
  type AnnualReview,
  type DashboardMessageRegion,
  type DashboardSummary,
  type DashboardTimelineItem,
  type DashboardVisitTrendItem,
  getAnnualReview,
  getDashboardMessageRegion,
  getDashboardSummary,
  getDashboardTimeline,
  getDashboardVisitTrend
} from "@/api/dashboard";
import { useECharts } from "@/hooks/useECharts";

defineOptions({
  name: "Welcome"
});

/** 模块入口配置(icon/标题与侧边栏菜单保持一致) */
const moduleEntries = [
  {
    title: "点点滴滴",
    path: "/admin/moments",
    icon: "ep:sunny",
    countKey: "moments"
  },
  {
    title: "恋爱画册",
    path: "/admin/love-photo",
    icon: "ep:camera",
    countKey: "photos"
  },
  {
    title: "恋爱清单",
    path: "/admin/love-list",
    icon: "ep:list",
    countKey: "loveList"
  },
  {
    title: "留言簿",
    path: "/admin/message",
    icon: "ep:chat-dot-round",
    countKey: "messages"
  },
  {
    title: "纪念日",
    path: "/admin/anniversary",
    icon: "ep:calendar",
    countKey: "anniversaries"
  },
  {
    title: "时间胶囊",
    path: "/admin/time-capsule",
    icon: "ep:box",
    countKey: "timeCapsules"
  },
  {
    title: "情侣日志",
    path: "/admin/diary",
    icon: "ep:notebook",
    countKey: "diaries"
  },
  {
    title: "足迹",
    path: "/admin/footprint",
    icon: "ep:location",
    countKey: "footprints"
  }
] as const;

/** 条目类型对应的中文标签 */
const typeLabels: Record<string, string> = {
  photos: "恋爱画册",
  moments: "点点滴滴",
  diary: "情侣日志"
};

/** 快捷操作配置(页面收尾 CTA,点击跳对应管理页) */
const quickActions = [
  {
    title: "记点滴",
    desc: "记录今天的小事",
    path: "/admin/moments",
    icon: "ep:sunny"
  },
  {
    title: "传照片",
    desc: "充实恋爱画册",
    path: "/admin/love-photo",
    icon: "ep:upload"
  },
  {
    title: "写日志",
    desc: "写下此刻心情",
    path: "/admin/diary",
    icon: "ep:notebook"
  }
] as const;

const router = useRouter();
const userStore = useUserStoreHook();
const loading = ref(true);
const summary = ref<DashboardSummary | null>(null);

/** 时间线状态(后端固定返回最新条数,不做翻页) */
const timelineItems = ref<DashboardTimelineItem[]>([]);
const timelineLoading = ref(false);

/** 按时段问候 */
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 12) return "上午好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
});

/** 今日日期(yyyy年M月d日 星期X) */
const todayText = computed(() => {
  const now = new Date();
  const week = ["日", "一", "二", "三", "四", "五", "六"][now.getDay()];
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${week}`;
});

/** 下一个纪念日剩余天数(按月/日计算下一次发生日) */
const nextAnniversaryDays = computed(() => {
  const next = summary.value?.nextAnniversary;
  if (!next) return null;
  const [, month, day] = next.anniversaryDate.split("-").map(Number);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let target = new Date(now.getFullYear(), month - 1, day);
  if (target.getTime() < todayStart.getTime()) {
    target = new Date(now.getFullYear() + 1, month - 1, day);
  }
  return Math.round((target.getTime() - todayStart.getTime()) / 86400000);
});

/** 入口卡计数(恋爱清单取进度总数,其余取各模块计数) */
function entryCount(countKey: string): number | null {
  if (!summary.value) return null;
  if (countKey === "loveList") {
    return summary.value.loveListProgress?.total ?? null;
  }
  const counts = summary.value.counts as Record<string, number | undefined>;
  return counts[countKey] ?? null;
}

/** 加载概览数据 */
async function loadSummary() {
  try {
    summary.value = (await getDashboardSummary()).data;
  } finally {
    loading.value = false;
  }
}

/** 加载时间线(单次拉取最新条数) */
async function loadTimeline() {
  if (timelineLoading.value) return;
  timelineLoading.value = true;
  try {
    timelineItems.value = (await getDashboardTimeline()).data.records;
  } finally {
    timelineLoading.value = false;
  }
}

/** 条目类型标签 */
function typeLabel(type: string) {
  return typeLabels[type] ?? "回忆";
}

/* ---------------- 访问趋势(近 30 天,PV/UV 双线) ---------------- */

const visitTrendLoading = ref(true);
const visitTrendItems = ref<DashboardVisitTrendItem[]>([]);
const trendChartRef = ref<HTMLElement>();
const { setOptions: setTrendOptions } = useECharts(trendChartRef);

/** 趋势图渲染:日期为 X 轴(月/日),PV/UV 双折线 */
function renderTrend() {
  const items = visitTrendItems.value;
  setTrendOptions({
    grid: { left: 8, right: 8, top: 40, bottom: 0, containLabel: true },
    legend: { data: ["访问量(PV)", "访客数(UV)"], top: 0 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: items.map(item => item.statDate.slice(5))
    },
    yAxis: { type: "value", minInterval: 1 },
    series: [
      {
        name: "访问量(PV)",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: items.map(item => item.pv),
        areaStyle: { opacity: 0.08 }
      },
      {
        name: "访客数(UV)",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: items.map(item => item.uv)
      }
    ]
  });
}

/** 加载访问趋势并渲染(数据为空时保持空态,不渲染图表) */
async function loadVisitTrend() {
  try {
    visitTrendItems.value = (await getDashboardVisitTrend(30)).data;
    if (visitTrendItems.value.length) {
      renderTrend();
    }
  } finally {
    visitTrendLoading.value = false;
  }
}

/* ---------------- 留言地区分布(审核通过口径,TOP10) ---------------- */

const messageRegionLoading = ref(true);
const messageRegions = ref<DashboardMessageRegion[]>([]);
const regionChartRef = ref<HTMLElement>();
const { setOptions: setRegionOptions } = useECharts(regionChartRef);

/** 加载地区分布并渲染(条数降序,横向柱图自上而下) */
async function loadMessageRegion() {
  try {
    messageRegions.value = (await getDashboardMessageRegion(10)).data;
    if (messageRegions.value.length) {
      setRegionOptions({
        grid: { left: 8, right: 16, top: 8, bottom: 0, containLabel: true },
        tooltip: { trigger: "axis" },
        xAxis: { type: "value", minInterval: 1 },
        yAxis: {
          type: "category",
          data: messageRegions.value.map(item => item.region).reverse(),
          axisLabel: { width: 72, overflow: "truncate" }
        },
        series: [
          {
            type: "bar",
            barMaxWidth: 14,
            data: messageRegions.value.map(item => item.count),
            itemStyle: { borderRadius: [0, 4, 4, 0] }
          }
        ]
      });
    }
  } finally {
    messageRegionLoading.value = false;
  }
}

/* ---------------- 年度恋爱回顾 ---------------- */

/** 回顾年份(默认当前年份;切换即重拉) */
const reviewYear = ref(new Date().getFullYear());
const reviewLoading = ref(false);
const annualReview = ref<AnnualReview | null>(null);

/** 年份选项(当前年份往前推 4 年) */
const reviewYearOptions = computed(() => {
  const current = new Date().getFullYear();
  return [current, current - 1, current - 2, current - 3, current - 4];
});

/** 切换年份即重拉回顾 */
async function loadAnnualReview() {
  if (reviewLoading.value) return;
  reviewLoading.value = true;
  try {
    annualReview.value = (await getAnnualReview(reviewYear.value)).data;
  } finally {
    reviewLoading.value = false;
  }
}

/** 切换年份(重置型操作) */
function switchReviewYear(year: number) {
  if (year === reviewYear.value) return;
  reviewYear.value = year;
  loadAnnualReview();
}

onMounted(() => {
  loadSummary();
  loadTimeline();
  loadVisitTrend();
  loadMessageRegion();
  loadAnnualReview();
});
</script>

<template>
  <div class="p-2">
    <!-- 默认密码警告:当前登录用户未更新过密码时置顶提醒 -->
    <el-alert
      v-if="userStore.passwordUpdated === false"
      type="warning"
      show-icon
      :closable="false"
      class="mb-3"
    >
      <template #title>
        当前仍在使用默认密码，存在安全风险，请前往
        <RouterLink class="alert-link" to="/admin/profile">个人中心</RouterLink>
        修改
      </template>
    </el-alert>

    <!-- ① 概览卡:问候 + 在一起天数 + 下一个纪念日倒计时 -->
    <el-card shadow="never" class="mb-3">
      <el-skeleton :loading="loading" animated :rows="2">
        <div class="flex-bc flex-wrap gap-4">
          <div>
            <div class="text-lg font-medium">{{ greeting }}，欢迎回来</div>
            <div
              class="mt-1 text-sm"
              style="color: var(--el-text-color-secondary)"
            >
              {{ todayText }}
            </div>
          </div>
          <div class="flex items-center gap-6">
            <div v-if="summary?.togetherDays != null" class="text-center">
              <div
                class="text-2xl font-semibold"
                style="color: var(--el-color-primary)"
              >
                {{ summary.togetherDays }}
              </div>
              <div
                class="text-xs"
                style="color: var(--el-text-color-secondary)"
              >
                在一起(天)
              </div>
            </div>
            <template v-if="summary?.nextAnniversary">
              <el-divider direction="vertical" class="h-10" />
              <div class="text-center">
                <div class="text-sm font-medium">
                  {{ summary.nextAnniversary.name }}
                </div>
                <div
                  class="mt-1 text-xs"
                  style="color: var(--el-text-color-secondary)"
                >
                  {{ summary.nextAnniversary.anniversaryDate }}
                  <template v-if="nextAnniversaryDays != null">
                    · 还有
                    <span
                      style="
                        font-variant-numeric: tabular-nums;
                        color: var(--el-color-primary);
                      "
                    >
                      {{ nextAnniversaryDays }}
                    </span>
                    天
                  </template>
                </div>
              </div>
            </template>
          </div>
        </div>
      </el-skeleton>
    </el-card>

    <!-- ② 模块入口网格 -->
    <el-row :gutter="16">
      <re-col
        v-for="entry in moduleEntries"
        :key="entry.path"
        class="mb-4"
        :value="6"
        :md="6"
        :sm="12"
        :xs="24"
      >
        <el-card
          shadow="hover"
          class="entry-card"
          @click="router.push(entry.path)"
        >
          <div class="flex-bc">
            <div class="flex items-center gap-3">
              <el-icon :size="22" style="color: var(--el-color-primary)">
                <component :is="useRenderIcon(entry.icon)" />
              </el-icon>
              <span class="font-medium">{{ entry.title }}</span>
            </div>
            <el-tag
              v-if="entryCount(entry.countKey) == null"
              size="small"
              type="info"
            >
              待建设
            </el-tag>
            <span
              v-else
              class="text-lg font-medium"
              style="font-variant-numeric: tabular-nums"
            >
              {{ entryCount(entry.countKey) }}
            </span>
          </div>
        </el-card>
      </re-col>
    </el-row>

    <!-- ②⑤ 访问趋势 + 留言地区分布:数据驱动的两张图,空数据整卡隐藏 -->
    <el-row :gutter="16">
      <re-col :value="16" :md="16" :sm="24" :xs="24" class="mb-4">
        <el-card shadow="never" class="h-full">
          <template #header>
            <span class="font-medium">访问趋势</span>
            <span
              class="ml-2 text-xs"
              style="color: var(--el-text-color-secondary)"
            >
              近 30 天
            </span>
          </template>
          <el-skeleton :loading="visitTrendLoading" animated :rows="5">
            <div
              v-show="visitTrendItems.length"
              ref="trendChartRef"
              class="chart-line"
            />
            <el-empty
              v-if="!visitTrendLoading && !visitTrendItems.length"
              description="暂无访问数据"
              :image-size="80"
            />
          </el-skeleton>
        </el-card>
      </re-col>
      <re-col :value="8" :md="8" :sm="24" :xs="24" class="mb-4">
        <el-card shadow="never" class="h-full">
          <template #header>
            <span class="font-medium">留言地区分布</span>
          </template>
          <el-skeleton :loading="messageRegionLoading" animated :rows="5">
            <div
              v-show="messageRegions.length"
              ref="regionChartRef"
              class="region-chart"
            />
            <el-empty
              v-if="!messageRegionLoading && !messageRegions.length"
              description="暂无留言数据"
              :image-size="80"
            />
          </el-skeleton>
        </el-card>
      </re-col>
    </el-row>

    <!-- ③ 最近回忆时间线 + ④ 数据统计 -->
    <el-row :gutter="16">
      <re-col :value="16" :md="16" :sm="24" :xs="24" class="mb-4">
        <el-card shadow="never" class="timeline-card h-full">
          <template #header>
            <span class="font-medium">最近回忆</span>
          </template>
          <el-skeleton
            :loading="timelineLoading && timelineItems.length === 0"
            :rows="6"
            animated
          >
            <el-timeline v-if="timelineItems.length">
              <el-timeline-item
                v-for="(item, index) in timelineItems"
                :key="index"
                :timestamp="item.time"
                placement="top"
              >
                <div class="flex items-center gap-2">
                  <el-tag size="small" effect="plain">
                    {{ typeLabel(item.type) }}
                  </el-tag>
                  <span class="font-medium">{{ item.title }}</span>
                </div>
                <div
                  v-if="item.content"
                  class="mt-1 text-sm"
                  style="color: var(--el-text-color-regular)"
                >
                  {{ item.content }}
                </div>
                <el-image
                  v-if="item.imageUrl"
                  class="mt-2 w-40 rounded-md"
                  :src="item.imageUrl"
                  :preview-src-list="[item.imageUrl]"
                  preview-teleported
                  hide-on-click-modal
                  fit="cover"
                  lazy
                />
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="还没有留下回忆">
              <el-button
                type="primary"
                @click="router.push('/admin/love-photo')"
              >
                去恋爱画册上传第一张照片
              </el-button>
            </el-empty>
          </el-skeleton>
        </el-card>
      </re-col>
      <re-col :value="8" :md="8" :sm="24" :xs="24" class="mb-4">
        <div class="flex h-full flex-col gap-4">
          <el-card shadow="never">
            <template #header>
              <span class="font-medium">照片墙</span>
            </template>
            <el-skeleton :loading="loading" animated :rows="3">
              <div
                v-if="summary?.recentPhotos?.length"
                class="grid grid-cols-3 gap-2"
              >
                <el-image
                  v-for="(url, index) in summary.recentPhotos"
                  :key="url"
                  class="aspect-square w-full rounded-md"
                  :src="url"
                  :preview-src-list="summary.recentPhotos"
                  :initial-index="index"
                  preview-teleported
                  hide-on-click-modal
                  fit="cover"
                  lazy
                />
              </div>
              <el-empty v-else description="还没有照片">
                <el-button
                  type="primary"
                  @click="router.push('/admin/love-photo')"
                >
                  去恋爱画册上传
                </el-button>
              </el-empty>
            </el-skeleton>
          </el-card>
          <el-card shadow="never" class="stat-card flex-1">
            <template #header>
              <span class="font-medium">我们的数据</span>
            </template>
            <el-skeleton :loading="loading" animated :rows="5">
              <div class="grid grid-cols-2 gap-3">
                <div class="stat-cell">
                  <div class="stat-value">
                    {{ summary?.counts?.messages ?? 0 }}
                  </div>
                  <div class="stat-label">留言簿</div>
                </div>
                <div class="stat-cell">
                  <div class="stat-value">
                    <template v-if="summary?.loveListProgress?.total">
                      {{
                        Math.round(
                          (summary.loveListProgress.done * 100) /
                            summary.loveListProgress.total
                        )
                      }}%
                    </template>
                    <template v-else>-</template>
                  </div>
                  <div class="stat-label">
                    恋爱清单{{
                      summary?.loveListProgress?.total
                        ? `（${summary.loveListProgress.done}/${summary.loveListProgress.total}）`
                        : ""
                    }}
                  </div>
                </div>
                <div class="stat-cell">
                  <div class="stat-value">
                    {{ summary?.footprintsCityCount ?? 0 }}
                  </div>
                  <div class="stat-label">足迹到访城市</div>
                </div>
                <div class="stat-cell">
                  <div class="stat-value">
                    {{ summary?.counts?.timeCapsules ?? 0 }}
                  </div>
                  <div class="stat-label">时间胶囊</div>
                </div>
                <div class="stat-cell">
                  <div
                    class="stat-value pending-value"
                    role="link"
                    tabindex="0"
                    @click="router.push('/admin/message')"
                    @keydown.enter="router.push('/admin/message')"
                  >
                    {{ summary?.pendingMessages ?? 0 }}
                  </div>
                  <div class="stat-label">待审留言</div>
                </div>
              </div>
              <div v-if="summary?.latestMessage" class="mt-5">
                <div class="mb-1 text-sm">最新留言</div>
                <div
                  class="rounded-md p-3 text-sm"
                  style="background: var(--el-fill-color-light)"
                >
                  <span class="font-medium">{{
                    summary.latestMessage.nickname
                  }}</span>
                  <span
                    class="ml-2 text-xs"
                    style="color: var(--el-text-color-secondary)"
                  >
                    {{ summary.latestMessage.createTime }}
                  </span>
                  <div class="mt-1">{{ summary.latestMessage.content }}</div>
                </div>
              </div>
            </el-skeleton>
          </el-card>
        </div>
      </re-col>
    </el-row>

    <!-- ⑥ 年度恋爱回顾:年份切换 + 年度计数 + 精选回忆(隐私数据仅登录态可见) -->
    <el-card shadow="never" class="mb-4">
      <template #header>
        <div class="flex-bc gap-3">
          <span class="whitespace-nowrap font-medium">
            {{ reviewYear }} 年度回顾
          </span>
          <el-select
            :model-value="reviewYear"
            class="w-30!"
            @update:model-value="switchReviewYear"
          >
            <el-option
              v-for="year in reviewYearOptions"
              :key="year"
              :label="`${year} 年`"
              :value="year"
            />
          </el-select>
        </div>
      </template>
      <el-skeleton :loading="reviewLoading" animated :rows="5">
        <template v-if="annualReview">
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div class="stat-cell">
              <div class="stat-value">{{ annualReview.diaryCount }}</div>
              <div class="stat-label">日志({{ annualReview.year }})</div>
            </div>
            <div class="stat-cell">
              <div class="stat-value">{{ annualReview.momentsCount }}</div>
              <div class="stat-label">点滴</div>
            </div>
            <div class="stat-cell">
              <div class="stat-value">{{ annualReview.photoCount }}</div>
              <div class="stat-label">照片</div>
            </div>
            <div class="stat-cell">
              <div class="stat-value">{{ annualReview.footprintCount }}</div>
              <div class="stat-label">到访足迹</div>
            </div>
            <div class="stat-cell">
              <div class="stat-value">
                {{ annualReview.newCities?.length ?? 0 }}
              </div>
              <div class="stat-label">新到访城市</div>
            </div>
            <div class="stat-cell">
              <div class="stat-value">
                <template v-if="annualReview.pv != null">
                  {{ annualReview.pv }}
                </template>
                <template v-else>-</template>
              </div>
              <div class="stat-label">
                门户访问量(UV {{ annualReview.uv ?? "-" }})
              </div>
            </div>
            <div class="stat-cell">
              <div class="stat-value">
                <template v-if="annualReview.loveListTotal">
                  {{
                    Math.round(
                      ((annualReview.loveListDone ?? 0) * 100) /
                        annualReview.loveListTotal
                    )
                  }}%
                </template>
                <template v-else>-</template>
              </div>
              <div class="stat-label">恋爱清单进度</div>
            </div>
            <div class="stat-cell">
              <div class="stat-value">
                {{ annualReview.topMood || "-" }}
              </div>
              <div class="stat-label">最常见心情</div>
            </div>
          </div>
          <div v-if="annualReview.newCities?.length" class="mt-4">
            <span class="text-sm" style="color: var(--el-text-color-secondary)">
              年度新城市：
            </span>
            <el-tag
              v-for="city in annualReview.newCities"
              :key="city"
              class="ml-1"
              effect="plain"
              size="small"
            >
              {{ city }}
            </el-tag>
          </div>
          <div v-if="annualReview.highlights?.length" class="mt-4">
            <div class="mb-2 text-sm">精选回忆</div>
            <el-timeline>
              <el-timeline-item
                v-for="(item, index) in annualReview.highlights"
                :key="index"
                :timestamp="item.time"
                placement="top"
              >
                <el-tag size="small" effect="plain">
                  {{ typeLabel(item.type) }}
                </el-tag>
                <span class="ml-2 font-medium">{{ item.title }}</span>
              </el-timeline-item>
            </el-timeline>
          </div>
        </template>
        <el-empty
          v-else-if="!reviewLoading"
          description="该年份还没有留下回忆"
          :image-size="80"
        />
      </el-skeleton>
    </el-card>

    <!-- ⑤ 快捷操作:三个最高频动作的收尾入口 -->
    <el-row :gutter="16">
      <re-col
        v-for="action in quickActions"
        :key="action.path"
        :value="8"
        :md="8"
        :sm="24"
        :xs="24"
        class="mb-4"
      >
        <el-card
          shadow="hover"
          class="quick-action-card"
          @click="router.push(action.path)"
        >
          <div class="flex-c gap-2">
            <el-icon :size="18" style="color: var(--el-color-primary)">
              <component :is="useRenderIcon(action.icon)" />
            </el-icon>
            <span class="font-medium">{{ action.title }}</span>
            <span class="text-xs" style="color: var(--el-text-color-secondary)">
              {{ action.desc }}
            </span>
          </div>
        </el-card>
      </re-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
/* 警告条跳转链接:主题色 + 下划线,明示可点击跳转 */
.alert-link {
  color: var(--el-color-primary);
  text-decoration: underline;
  cursor: pointer;
}

/* 趋势/分布图表容器:固定高度,避免 0 高度不渲染 */
.chart-line {
  width: 100%;
  height: 300px;
}

.region-chart {
  width: 100%;
  height: 300px;
}

/* 待审留言数字可点击:警告色提示待办存在 */
.pending-value {
  color: var(--el-color-warning);
  cursor: pointer;
}

/* 统计卡等高填充:header 固定,body 撑满剩余高度并将留言贴底 */
.stat-card {
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  /* 骨架层是 body 的唯一子元素,需同样纵向拉伸才能让内容分布生效 */
  :deep(.el-skeleton) {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: space-between;
  }
}

/* 统计数字格:浅底圆角,大数字 + 小标签 */
.stat-cell {
  padding: 12px 16px;
  text-align: center;
  background: var(--el-fill-color-light);
  border-radius: 8px;

  .stat-value {
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
}

/* 可点击卡片显式手型光标 */
.entry-card,
.quick-action-card {
  cursor: pointer;
}

/* 时间线卡:大屏下保证合理最小高度,空态与加载更多落在恰当位置 */
.timeline-card {
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  /* 骨架层为 body 唯一子元素,同样纵向拉伸 */
  :deep(.el-skeleton) {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  /* 时间线与空态占据剩余空间,空态自然垂直居中 */
  :deep(.el-timeline),
  :deep(.el-empty) {
    flex: 1;
  }
}
</style>
