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
  <!-- 语义化 button:键盘可达(tabindex/Enter/Space 原生支持),加载中禁用防重复触发 -->
  <button
    v-if="hasMore"
    type="button"
    class="portal-load-more"
    :disabled="loading"
    @click="$emit('load')"
  >
    {{ loading ? "加载中..." : "加载更多" }}
  </button>
</template>

<style scoped>
/* 「加载更多」按钮(门户列表页共用):杂志风墨色细线框 */
.portal-load-more {
  display: block;
  width: fit-content;
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
</style>
