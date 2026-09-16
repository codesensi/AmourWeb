<script setup lang="ts">
defineOptions({ name: "PortalLoadMore" });

defineProps<{
  /** 是否处于加载中(文案切换与防重入由 usePagedList 的 loading 驱动) */
  loading: boolean;
  /** 是否还有更多数据(到底后隐藏按钮) */
  hasMore: boolean;
}>();

defineEmits<{ load: [] }>();
</script>

<template>
  <!-- 语义化 button:键盘可达(tabindex/Enter/Space 原生支持),加载中禁用防重复触发;
       aria-busy 向读屏器宣告忙碌态 -->
  <button
    v-if="hasMore"
    type="button"
    class="portal-load-more"
    :disabled="loading"
    :aria-busy="loading"
    @click="$emit('load')"
  >
    <span v-if="loading" class="load-spinner" aria-hidden="true" />
    {{ loading ? "加载中" : "加载更多" }}
  </button>
</template>

<style scoped>
/* 「加载更多」按钮(门户列表页共用):杂志风墨色细线框;
   固定最小宽度,加载中文字变短也不跳动布局 */
.portal-load-more {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-width: 148px;
  padding: 12px 32px;
  margin: 2rem auto 0;
  font-family: var(--am-font-mono);
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
  text-align: center;
  letter-spacing: 0.3rem;
  cursor: pointer;
  background: none;
  border: 1px solid var(--am-line);
  border-radius: 999px;
  transition:
    color var(--am-duration) ease,
    border-color var(--am-duration) ease,
    background var(--am-duration) ease;
}

.portal-load-more:hover:not(:disabled) {
  color: var(--am-rose);
  background: var(--am-rose-soft);
  border-color: var(--am-rose);
}

/* 旋转圆环:与文字并排的轻量加载指示 */
.load-spinner {
  width: 12px;
  height: 12px;
  border: 1.5px solid currentcolor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: am-spin 0.8s linear infinite;
}

/* 减少动态:隐藏旋转环,退化为纯文字加载态 */
@media (prefers-reduced-motion: reduce) {
  .load-spinner {
    display: none;
  }
}
</style>
