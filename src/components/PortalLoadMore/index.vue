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
/* 「加载更多」按钮:替代原站 layui flow 的按钮式分页(门户列表页共用) */
.portal-load-more {
  width: fit-content;
  padding: 0.5rem 2rem;
  margin: 2rem auto 0;
  font-family: inherit;
  font-size: 1.2rem;
  color: #959595;
  text-align: center;
  letter-spacing: 0.3rem;
  cursor: pointer;
  background: none;
  border: 1px solid #e4e4e4;
  border-radius: 2rem;
  transition: all 0.2s;
}

.portal-load-more:hover:not(:disabled) {
  color: #ff69b4;
  border-color: #ff69b4;
}
</style>
