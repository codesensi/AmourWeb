<script setup lang="ts">
import { useRouter } from "vue-router";

defineOptions({ name: "PortalSidebar" });

const router = useRouter();

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** 管理后台:新标签页打开 /admin(未登录由守卫拦截到登录页) */
function goAdmin() {
  const { href } = router.resolve({ path: "/admin" });
  window.open(href, "_blank", "noopener,noreferrer");
}
</script>

<template>
  <!-- 右下角悬浮侧栏:返回顶部 / 管理后台 -->
  <div class="side-fab">
    <button
      class="side-fab-btn"
      type="button"
      title="返回顶部"
      aria-label="返回顶部"
      @click="scrollToTop"
    >
      <!-- 线性箭头图标(上) -->
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
    <button
      class="side-fab-btn"
      type="button"
      title="管理后台"
      aria-label="管理后台"
      @click="goAdmin"
    >
      <!-- 线性盾牌图标 -->
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* 右下角悬浮操作:墨色圆钮,悬停上浮;底部避让手势条安全区 */
.side-fab {
  position: fixed;
  right: 20px;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  z-index: 90;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.side-fab-btn {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: var(--am-cta-text);
  cursor: pointer;
  background: var(--am-cta);
  border: 0;
  border-radius: 50%;
  box-shadow: 0 6px 18px rgb(26 22 20 / 24%);
  transition:
    transform var(--am-duration) var(--am-ease),
    box-shadow var(--am-duration) ease;
}

.side-fab-btn:hover {
  box-shadow: 0 10px 24px rgb(26 22 20 / 30%);
  transform: translateY(-3px);
}

.side-fab-btn svg {
  width: 20px;
  height: 20px;
}
</style>
