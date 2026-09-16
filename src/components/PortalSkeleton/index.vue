<script setup lang="ts">
/**
 * 门户列表骨架屏:杂志线框风(题头小字 + 标题行 + 正文两行),
 * 形状与最终内容同构,加载中 >300ms 即展示,避免首屏空白与布局跳动。
 */
defineOptions({ name: "PortalSkeleton" });

withDefaults(defineProps<{ rows?: number }>(), { rows: 3 });
</script>

<template>
  <div class="am-skeleton" aria-hidden="true">
    <div v-for="i in rows" :key="i" class="skel-row">
      <span class="skel-line skel-kicker" />
      <span class="skel-line skel-title" />
      <span class="skel-line skel-text" />
      <span class="skel-line skel-text skel-text-short" />
    </div>
  </div>
</template>

<style scoped>
.am-skeleton {
  padding: var(--am-space-md) 0;
}

.skel-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: var(--am-space-md) 0;
  border-bottom: 1px solid var(--am-line);
}

/* 脉冲呼吸:低调灰色渐变,不做位移避免抖动 */
.skel-line {
  display: block;
  height: 0.9em;
  background: linear-gradient(
    90deg,
    var(--am-bg-deep) 0%,
    var(--am-line) 50%,
    var(--am-bg-deep) 100%
  );
  background-size: 200% 100%;
  border-radius: 3px;
  animation: am-shimmer 1.6s ease-in-out infinite;
}

.skel-kicker {
  width: 96px;
  height: 0.7em;
}

.skel-title {
  width: 42%;
  height: 1.2em;
}

.skel-text {
  width: 100%;
}

.skel-text-short {
  width: 68%;
}

.skel-row .skel-line:nth-child(2) {
  animation-delay: 0.08s;
}

.skel-row .skel-line:nth-child(3) {
  animation-delay: 0.16s;
}

.skel-row .skel-line:nth-child(4) {
  animation-delay: 0.24s;
}

/* 减少动态:骨架屏停止呼吸,静态灰块仍表达占位结构 */
@media (prefers-reduced-motion: reduce) {
  .skel-line {
    animation: none;
  }
}
</style>
