<!-- 门户回到顶部:长内容页滚动 600px 后浮现;44px 触控目标,reduced-motion 时直接跳转 -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { prefersReducedMotion } from "@/utils/motion";

defineOptions({ name: "PortalBackTop" });

const visible = ref(false);

function onScroll() {
  visible.value = window.scrollY > 600;
}

function scrollTop() {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? "auto" : "smooth"
  });
}

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
});
</script>

<template>
  <Transition name="backtop">
    <button
      v-if="visible"
      class="backtop"
      type="button"
      aria-label="回到顶部"
      @click="scrollTop"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 14l6-6 6 6"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.backtop {
  position: fixed;
  right: 24px;
  bottom: 32px;
  z-index: 30;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: var(--am-ink-secondary);
  cursor: pointer;
  background: var(--am-card);
  border: 1px solid var(--am-line);
  border-radius: var(--am-radius-pill);
  box-shadow: var(--am-shadow-hover);
  transition:
    color var(--am-duration-fast) ease,
    background var(--am-duration-fast) ease,
    border-color var(--am-duration-fast) ease,
    transform var(--am-duration-fast) var(--am-ease);
}

.backtop:hover {
  color: var(--am-cta-text);
  background: var(--am-cta);
  border-color: var(--am-cta);
  transform: translateY(-2px);
}

.backtop:focus-visible {
  outline: 2px solid var(--am-rose);
  outline-offset: 2px;
}

.backtop svg {
  width: 20px;
  height: 20px;
}

/* 浮现/隐去:只动透明度与位移,不改变布局 */
.backtop-enter-active,
.backtop-leave-active {
  transition:
    opacity var(--am-duration) var(--am-ease),
    transform var(--am-duration) var(--am-ease);
}

.backtop-enter-from,
.backtop-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (width <= 768px) {
  .backtop {
    right: 16px;
    bottom: 24px;
  }
}
</style>
