<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import {
  getTimeCapsule,
  type TimeCapsuleItem
} from "@/api/portal/time-capsule";
import { queryKeys } from "@/hooks/queryKeys";
import { usePortalList } from "@/hooks/usePortalQuery";
import PortalLoadMore from "@/components/PortalLoadMore/index.vue";
import reveal from "@/directives/reveal";

defineOptions({ name: "PortalTimeCapsule" });

const vReveal = reveal;

/** 门户「加载更多」分页加载(每页 6 封);首拉与 KeepAlive 激活校验由查询层接管 */
const { items, loading, hasMore, loadMore } = usePortalList<TimeCapsuleItem>(
  queryKeys.timeCapsule(),
  getTimeCapsule
);

/** 已展开的信件 id 集合(到期信点击封面后展开) */
const opened = ref(new Set<number>());

/** 信件是否已到解锁时间(content 由服务端到期裁剪,锁定中为 null) */
function isOpened(item: TimeCapsuleItem): boolean {
  return item.content != null;
}

/** 锁定剩余倒计时(天/时/分文案);每 30s 刷新一次足够 */
const now = ref(Date.now());
const tick = window.setInterval(() => {
  now.value = Date.now();
}, 30_000);
onBeforeUnmount(() => window.clearInterval(tick));

/** 剩余倒计时文案(锁定中返回「N 天 N 时 N 分」) */
function countdown(item: TimeCapsuleItem): string {
  const open = new Date(item.openTime.replace(/-/g, "/")).getTime();
  const diff = Math.max(0, open - now.value);
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  return days > 0
    ? `${days} 天 ${hours} 时 ${minutes} 分`
    : `${hours} 时 ${minutes} 分`;
}

/** 展开一封信(仅已到期的信可展开) */
function open(item: TimeCapsuleItem) {
  if (!isOpened(item)) return;
  opened.value = new Set([...opened.value, item.id]);
}

/** 展示时间文案(yyyy 年 M 月 D 日) */
const formatOpenTime = computed(
  () => (item: TimeCapsuleItem) =>
    item.openTime.slice(0, 10).replaceAll("-", " / ")
);
</script>

<template>
  <div class="am-page">
    <!-- 章节题头 -->
    <header class="am-section-head">
      <p class="am-section-kicker">Dear Future · 写给未来</p>
      <h1 class="am-section-title">时间胶囊</h1>
      <p class="capsule-intro">给未来的信,会在指定的那天自动开启。</p>
    </header>

    <!-- 信封墙 -->
    <div class="capsule-wall">
      <article
        v-for="(it, i) in items"
        :key="it.id"
        v-reveal="(i % 3 || 0) * 0.06"
        class="capsule reveal"
        :class="{ 'capsule-opened': isOpened(it) }"
      >
        <!-- 封面:封蜡 + 锁/开图标 + 倒计时 -->
        <button
          v-if="isOpened(it) && !opened.has(it.id)"
          class="capsule-cover"
          type="button"
          @click="open(it)"
        >
          <span class="capsule-seal" aria-hidden="true">
            <!-- 到期信:可拆封 -->
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="7" width="18" height="13" rx="1.5" />
              <path d="M3 8l9 6 9-6" />
            </svg>
          </span>
          <span class="capsule-cta">点击拆封</span>
        </button>
        <div
          v-else-if="!isOpened(it)"
          class="capsule-cover capsule-cover-locked"
        >
          <span class="capsule-seal" aria-hidden="true">
            <!-- 锁定信:挂锁 -->
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="5" y="10" width="14" height="10" rx="1.5" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <span class="capsule-countdown">{{ countdown(it) }}</span>
          <span class="capsule-cta">开启时间 {{ formatOpenTime(it) }}</span>
        </div>

        <!-- 信纸:点击拆封后展开 -->
        <div v-if="isOpened(it) && opened.has(it.id)" class="capsule-letter">
          <h3 class="capsule-title">{{ it.title || "一封没有题目的信" }}</h3>
          <p class="capsule-content">{{ it.content }}</p>
          <p class="capsule-date">写于 {{ formatOpenTime(it) }} 前的这个季节</p>
        </div>
        <footer v-else class="capsule-meta">
          <span class="capsule-name">{{ it.title || "无题的信" }}</span>
        </footer>
      </article>
    </div>

    <!-- 首屏加载:杂志线框骨架屏 -->
    <el-skeleton v-if="loading && items.length === 0" :rows="2" animated />

    <div v-if="!loading && items.length === 0" class="am-empty">
      还没有寄出过信,第一封时间胶囊正在书写…
    </div>

    <!-- 「加载更多」按钮(门户列表页共用组件) -->
    <PortalLoadMore :loading="loading" :has-more="hasMore" @load="loadMore" />
  </div>
</template>

<style scoped>
.capsule-intro {
  margin-top: 6px;
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

.capsule-wall {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--am-space-md);
  padding: var(--am-space-md) 0;
}

/* 胶囊卡:信封样式 */
.capsule {
  display: flex;
  flex-direction: column;
  contain-intrinsic-size: auto 320px;
  content-visibility: auto;
  overflow: hidden;
  background: var(--am-card);
  border: 1px solid var(--am-line);
  border-radius: var(--am-radius);
}

.capsule-opened {
  border-color: var(--am-rose);
}

/* 封面:拆封/锁定 */
.capsule-cover {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: var(--am-space-lg) var(--am-space-md);
  cursor: pointer;
  background: none;
  border: 0;
}

.capsule-cover-locked {
  cursor: default;
}

.capsule-seal {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  color: var(--am-rose);
  background: var(--am-rose-soft);
  border-radius: 50%;
}

.capsule-seal svg {
  width: 26px;
  height: 26px;
}

.capsule-countdown {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-lg);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--am-rose);
}

.capsule-cta {
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
  letter-spacing: 0.12em;
}

button.capsule-cover:hover .capsule-cta {
  color: var(--am-rose);
}

/* 信纸 */
.capsule-letter {
  padding: var(--am-space-md);
  animation: letter-in 0.5s var(--am-ease) both;
}

@keyframes letter-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

.capsule-title {
  margin: 0 0 10px;
  font-family: var(--am-font-display);
  font-size: var(--am-text-lg);
  font-weight: 700;
  color: var(--am-ink);
}

.capsule-content {
  /* 信纸行长控制 */
  max-width: 45em;
  margin: 0;
  font-family: var(--am-font-display);
  font-size: var(--am-text-base);
  line-height: 2;
  color: var(--am-ink);
}

.capsule-date {
  margin: 14px 0 0;
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
}

/* 锁定信的底部元信息 */
.capsule-meta {
  padding: 12px var(--am-space-md);
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
  border-top: 1px dashed var(--am-line);
}

@media (width <= 640px) {
  .capsule-wall {
    grid-template-columns: 1fr;
  }
}
</style>
