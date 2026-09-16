<script setup lang="ts">
import { onUnmounted, ref } from "vue";

/**
 * 门户「加载更多」幽灵占位:分页等待期的条目同构线框。
 * <p>
 * 挂载后延迟 delay 毫秒才渲染(默认 300ms):接口响应快于阈值时整块不出现,
 * 杜绝高频闪烁;各页面置于自身网格/列表容器的尾部,形状经 variant 与
 * --portal-ghost-min-h / --portal-ghost-radius 两个 CSS 变量适配。
 */
defineOptions({ name: "PortalGhostTile" });

const props = withDefaults(
  defineProps<{
    /** 占位条数 */
    count?: number;
    /** 显示延迟阈值(毫秒):低于该时长的响应不出现占位 */
    delay?: number;
    /** 形状: block=整体呼吸块(网格页) / row=行内双横条(列表页) */
    variant?: "block" | "row";
    /** 占位元素标签:列表容器内保持合法 HTML(如 li) */
    tag?: string;
  }>(),
  { count: 3, delay: 300, variant: "block", tag: "div" }
);

/** 延迟窗口:阈值内响应完成则本组件随卸载消失,占位从未渲染 */
const visible = ref(false);
const timer = setTimeout(() => {
  visible.value = true;
}, props.delay);
onUnmounted(() => clearTimeout(timer));
</script>

<template>
  <template v-if="visible">
    <component
      :is="tag"
      v-for="i in count"
      :key="i"
      class="portal-ghost"
      :class="`portal-ghost--${variant}`"
      aria-hidden="true"
    >
      <template v-if="variant === 'row'">
        <span class="portal-ghost-bar" />
        <span class="portal-ghost-bar portal-ghost-bar-short" />
      </template>
    </component>
  </template>
</template>

<style scoped>
/* 呼吸占位:与 PortalSkeleton 同源的灰色渐变,不引入位移避免抖动 */
.portal-ghost {
  min-height: var(--portal-ghost-min-h, 72px);
  background: linear-gradient(
    90deg,
    var(--am-bg-deep) 0%,
    var(--am-line) 50%,
    var(--am-bg-deep) 100%
  );
  background-size: 200% 100%;
  border-radius: var(--portal-ghost-radius, 3px);
  animation: am-shimmer 1.6s ease-in-out infinite;
}

/* block:整块填充,由容器(网格固定行高)决定形状 */
.portal-ghost--block {
  width: 100%;
  height: 100%;
}

/* row:行内双横条,占位行骨架 */
.portal-ghost--row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.portal-ghost-bar {
  display: block;
  width: 100%;
  height: 14px;
  background: inherit;
  background-size: 200% 100%;
  border-radius: 3px;
  animation: am-shimmer 1.6s ease-in-out infinite;
}

.portal-ghost-bar-short {
  width: 42%;
  height: 10px;
}

/* 减少动态:占位停止呼吸,静态灰块仍表达结构 */
@media (prefers-reduced-motion: reduce) {
  .portal-ghost,
  .portal-ghost-bar {
    animation: none;
  }
}
</style>
