<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import ReCol from "@/components/ReCol";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import {
  type DashboardSummary,
  type DashboardTimelineItem,
  getDashboardSummary,
  getDashboardTimeline
} from "@/api/dashboard";

defineOptions({
  name: "Welcome"
});

const PAGE_SIZE = 10;

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
const loading = ref(true);
const summary = ref<DashboardSummary | null>(null);

/** 时间线状态 */
const timelineItems = ref<DashboardTimelineItem[]>([]);
const timelineTotal = ref(0);
const timelinePageNumber = ref(1);
const timelineLoading = ref(false);
const timelineHasMore = computed(
  () => timelineTotal.value > timelineItems.value.length
);

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

/** 加载时间线(reset=true 时回到第一页并清空已有条目) */
async function loadTimeline(reset = false) {
  if (timelineLoading.value) return;
  if (reset) {
    timelinePageNumber.value = 1;
  } else if (!timelineHasMore.value) {
    return;
  }
  timelineLoading.value = true;
  try {
    const page = (
      await getDashboardTimeline({
        pageNumber: timelinePageNumber.value,
        pageSize: PAGE_SIZE
      })
    ).data;
    if (reset) {
      timelineItems.value = page.records;
    } else {
      timelineItems.value = timelineItems.value.concat(page.records);
    }
    timelineTotal.value = page.totalRow;
    timelinePageNumber.value += 1;
  } finally {
    timelineLoading.value = false;
  }
}

/** 条目类型标签 */
function typeLabel(type: string) {
  return typeLabels[type] ?? "回忆";
}

onMounted(() => {
  loadSummary();
  loadTimeline(true);
});
</script>

<template>
  <div class="p-2">
    <!-- ① 概览卡:问候 + 在一起天数 + 下一个纪念日倒计时 -->
    <el-card shadow="never" class="mb-3">
      <el-skeleton :loading="loading" animated :rows="2">
        <div class="flex flex-wrap items-center justify-between gap-4">
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
          <div class="flex items-center justify-between">
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
            <div v-if="timelineHasMore" class="text-center">
              <el-button
                text
                type="primary"
                :loading="timelineLoading"
                @click="loadTimeline(false)"
              >
                加载更多
              </el-button>
            </div>
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
          <div class="flex items-center justify-center gap-2">
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
