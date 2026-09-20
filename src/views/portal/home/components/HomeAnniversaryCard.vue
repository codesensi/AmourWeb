<script setup lang="ts">
defineOptions({ name: "HomeAnniversaryCard" });

defineProps<{
  /** 最近纪念日(name/date/days 由骨架层从焦点查询派生;null 时整卡不渲染) */
  anniversary: { name: string; date: string; days: number } | null;
  /** 画册卡缺失时占满右列(布局联动由骨架层下发) */
  tall: boolean;
}>();
</script>

<template>
  <div
    v-if="anniversary"
    class="teaser-card"
    :class="{ 'teaser-card--tall': tall }"
  >
    <p class="am-section-kicker">Countdown · 爱的倒计时</p>
    <div class="teaser-count">
      <b class="teaser-days">{{ anniversary.days }}</b>
      <span class="teaser-unit">天后</span>
    </div>
    <div class="teaser-meta">
      <p class="teaser-date">{{ anniversary.date }}</p>
      <RouterLink class="teaser-name" to="/anniversary">
        {{ anniversary.name }}
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.teaser-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--am-space-lg);
  background: var(--am-rose-soft);
  border-radius: var(--am-radius);
}

/* 底部落款:日期居左,纪念日名落到右下角 */
.teaser-meta {
  display: flex;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
}

.teaser-name {
  display: inline-block;
  margin: 0;
  font-family: var(--am-font-display);
  font-size: var(--am-text-lg);
  font-weight: 700;
  color: var(--am-ink);
  text-decoration: none;
  transition: color var(--am-duration-fast) ease;
}

.teaser-name:hover {
  color: var(--am-rose);
}

.teaser-date {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

.teaser-count {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: baseline;
  justify-content: center;
  margin-block: 0;
}

.teaser-days {
  font-family: var(--am-font-mono);
  font-size: clamp(3rem, 8vw, var(--am-text-giant));
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--am-rose);
}

.teaser-unit {
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}
</style>
