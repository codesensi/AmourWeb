<script setup lang="ts">
import { computed } from "vue";
import {
  getAnniversaryList,
  type AnniversaryItem
} from "@/api/portal/anniversary";
import PortalLoadMore from "@/components/PortalLoadMore/index.vue";
import { anniversaryMonthDay, nextOccurrenceDays } from "@/utils/anniversary";
import reveal from "@/directives/reveal";
import { queryKeys } from "@/hooks/query-keys";
import { usePortalList } from "@/hooks/usePortalQuery";

defineOptions({ name: "PortalAnniversary" });

const vReveal = reveal;

/** 纪念日分页(按下一次发生日升序,首条即最近纪念日,「加载更多」追加);
 * 数据极低频,缓存后不再重拉,倒计时由本地时钟每秒驱动 */
const { items, loading, hasMore, loadMore } = usePortalList<AnniversaryItem>(
  queryKeys.anniversaryList(),
  getAnniversaryList
);

/** 类型文案与线描图标标识 */
const TYPE_META: Record<number, { label: string; icon: string }> = {
  1: { label: "生日", icon: "cake" },
  2: { label: "纪念日", icon: "heart" },
  3: { label: "节日", icon: "gift" }
};

function typeMeta(type: number | undefined) {
  return TYPE_META[type ?? 0] ?? { label: "纪念", icon: "heart" };
}

/** 已加载条目附倒计时(按剩余天数升序;一次性过去日期不展示) */
const countdownItems = computed(() => {
  return items.value
    .map(item => ({ item, days: nextOccurrenceDays(item) }))
    .filter(
      (it): it is { item: AnniversaryItem; days: number } => it.days !== null
    )
    .sort((a, b) => a.days - b.days);
});

/** 最近纪念日(封面焦点) */
const nearest = computed(() => countdownItems.value[0] ?? null);
</script>

<template>
  <div class="am-page">
    <!-- 章节题头 -->
    <header class="am-section-head">
      <p class="am-section-kicker">Marked Days · 值得纪念</p>
      <h1 class="am-section-title">纪念日</h1>
      <p class="ann-intro">把重要的日子留在日历上,一件件倒数。</p>
    </header>

    <!-- 本期焦点:最近的一个纪念日 -->
    <section v-if="nearest" v-reveal class="ann-focus reveal reveal-scale">
      <p class="am-section-kicker">Soon · 快到了</p>
      <div class="ann-focus-row">
        <div>
          <h2 class="ann-focus-name">{{ nearest.item.name }}</h2>
          <p class="ann-focus-date">
            {{
              nearest.item.repeatYearly
                ? `每年 · ${anniversaryMonthDay(nearest.item.anniversaryDate)}`
                : nearest.item.anniversaryDate
            }}
          </p>
        </div>
        <div class="ann-focus-count">
          <b>{{ nearest.days }}</b>
          <span>天后</span>
        </div>
      </div>
    </section>

    <!-- 年度时间轴:按剩余天数排列 -->
    <ol v-if="countdownItems.length" class="ann-list">
      <li
        v-for="(it, i) in countdownItems"
        :key="it.item.id"
        v-reveal="(i % 3 || 0) * 0.06"
        class="ann-item reveal"
        :class="{ 'ann-item-soon': it.days <= 7 }"
      >
        <!-- 时间轴节点 -->
        <span class="ann-dot" aria-hidden="true" />
        <div class="ann-card">
          <div class="ann-head">
            <!-- 线描类型图标(生日/纪念日/节日) -->
            <svg
              v-if="typeMeta(it.item.type).icon === 'cake'"
              class="ann-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M4 21h16M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7M9 12V9m6 3V9M12 12V9M4 17c2 1.6 4 1.6 6 0m4 0c2 1.6 4 1.6 6 0"
              />
            </svg>
            <svg
              v-else-if="typeMeta(it.item.type).icon === 'gift'"
              class="ann-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M12 3v18M3 8h18v4H3zM5 12v9h14v-9M12 8c-1.5 0-4-1-4-2.8C8 3.9 9 3 10 3c1.3 0 2 1.5 2 5zm0 0c1.5 0 4-1 4-2.8C16 3.9 15 3 14 3c-1.3 0-2 1.5-2 5z"
              />
            </svg>
            <svg
              v-else
              class="ann-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M12 20.5l-8-8a4.6 4.6 0 1 1 8-3.2 4.6 4.6 0 1 1 8 3.2l-8 8z"
              />
            </svg>
            <h3 class="ann-name">{{ it.item.name }}</h3>
            <span class="ann-type">{{ typeMeta(it.item.type).label }}</span>
          </div>
          <div class="ann-row">
            <span class="ann-date">
              {{
                it.item.repeatYearly
                  ? `每年 ${anniversaryMonthDay(it.item.anniversaryDate)}`
                  : it.item.anniversaryDate
              }}
            </span>
            <span class="ann-days">
              <b>{{ it.days }}</b> 天
            </span>
          </div>
        </div>
      </li>
    </ol>

    <!-- 首屏加载:杂志线框骨架屏;加载完为空则展示空态 -->
    <el-skeleton v-else-if="loading" :rows="3" animated />

    <div v-else-if="!countdownItems.length" class="am-empty">
      日历还是空的,去后台添加第一个纪念日吧…
    </div>

    <!-- 分页「加载更多」 -->
    <PortalLoadMore :loading="loading" :has-more="hasMore" @load="loadMore" />
  </div>
</template>

<style scoped>
.ann-intro {
  margin-top: 6px;
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

/* 本期焦点:玫瑰软底色块 + 大号倒计时 */
.ann-focus {
  padding: var(--am-space-lg);
  margin-top: var(--am-space-md);
  background: var(--am-rose-soft);
  border-radius: var(--am-radius);
}

.ann-focus-row {
  display: flex;
  gap: var(--am-space-md);
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.ann-focus-name {
  margin: 0 0 4px;
  font-family: var(--am-font-display);
  font-size: clamp(1.6rem, 4vw, var(--am-text-xl));
  font-weight: 700;
  color: var(--am-ink);
}

.ann-focus-date {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

.ann-focus-count {
  display: flex;
  gap: 6px;
  align-items: baseline;
}

.ann-focus-count b {
  font-family: var(--am-font-mono);
  font-size: clamp(2.6rem, 7vw, var(--am-text-huge));
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--am-rose);
}

.ann-focus-count span {
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

/* 时间轴 */
.ann-list {
  position: relative;
  padding: var(--am-space-lg) 0 0;
  margin: 0;
  list-style: none;
}

/* 中轴线 */
.ann-list::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 6px;
  width: 1px;
  content: "";
  background: var(--am-line);
}

.ann-item {
  position: relative;
  padding: 0 0 var(--am-space-md) 32px;
}

/* 节点圆点:7 天内变玫瑰色 */
.ann-dot {
  position: absolute;
  top: 26px;
  left: 2px;
  width: 9px;
  height: 9px;
  background: var(--am-bg);
  border: 2px solid var(--am-ink-secondary);
  border-radius: 50%;
}

.ann-item-soon .ann-dot {
  background: var(--am-rose);
  border-color: var(--am-rose);

  /* 临近节点:玫瑰涟漪脉冲,提示「就快到了」 */
  animation: ann-pulse 2s ease-out infinite;
}

@keyframes ann-pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--am-rose) 45%, transparent);
  }

  70% {
    box-shadow: 0 0 0 9px color-mix(in srgb, var(--am-rose) 0%, transparent);
  }

  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--am-rose) 0%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ann-item-soon .ann-dot {
    animation: none;
  }
}

/* 条目卡 */
.ann-card {
  padding: 14px 18px;
  background: var(--am-card);
  border: 1px solid var(--am-line);
  border-radius: var(--am-radius);
}

.ann-head {
  display: flex;
  gap: 10px;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--am-line);
}

.ann-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: var(--am-rose);
}

.ann-name {
  margin: 0;
  font-family: var(--am-font-display);
  font-size: var(--am-text-base);
  font-weight: 700;
  color: var(--am-ink);
}

.ann-type {
  margin-left: auto;
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
}

.ann-row {
  display: flex;
  gap: 10px;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 10px;
}

.ann-date {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

.ann-days {
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

.ann-days b {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-lg);
  font-weight: 600;
  color: var(--am-rose);
}
</style>
