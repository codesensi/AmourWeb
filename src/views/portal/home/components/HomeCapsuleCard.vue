<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { countdownText } from "@/utils/date";

defineOptions({ name: "HomeCapsuleCard" });

const props = defineProps<{
  /** 最近一封待解封胶囊(骨架层从 next 查询派生;null 时整卡不渲染) */
  capsule: { title: string | null; openTime: string } | null;
}>();

/** 倒计时展示节奏与信箱页一致(30s tick 精度足够) */
const now = ref(Date.now());
const tick = window.setInterval(() => {
  now.value = Date.now();
}, 30_000);
onBeforeUnmount(() => window.clearInterval(tick));

/** 剩余倒计时文案(共用工具实现,与信箱页同源);到期瞬间由时钟兜底 */
const countdown = computed(() =>
  props.capsule
    ? countdownText(props.capsule.openTime, new Date(now.value))
    : null
);
</script>

<template>
  <div v-if="capsule" class="teaser-card">
    <p class="am-section-kicker">Time Capsule · 时光信箱</p>
    <div class="teaser-title">
      {{ capsule.title || "一封尚未拆开的信" }}
    </div>
    <div class="teaser-meta">
      <span class="teaser-label">距解锁</span>
      <span class="teaser-countdown">{{ countdown }}</span>
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

.teaser-title {
  font-family: var(--am-font-display);
  font-size: var(--am-text-lg);
  font-weight: 700;
  color: var(--am-ink);
}

.teaser-meta {
  display: flex;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
}

.teaser-label {
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

.teaser-countdown {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-lg);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--am-rose);
}
</style>
