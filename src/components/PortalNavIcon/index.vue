<!-- 门户导航图标:线性描边小图标,与全站线描风格一致;替代原先的杂志序号 -->
<script setup lang="ts">
import { computed } from "vue";

defineOptions({ name: "PortalNavIcon" });

const props = defineProps<{ name: string }>();

/** 图标集:键为导航语义名,值为 24×24 视图下的线性路径(与 Element 线性风格协调) */
const ICON_PATHS: Record<string, string[]> = {
  home: ["M3 10.5L12 3l9 7.5", "M5 9.5V21h14V9.5"],
  moments: ["M12 20h9", "M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"],
  photo: [
    "M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2z",
    "M3 15l4.5-4.5L12 15l3-3 6 6"
  ],
  list: [
    "M8 6h13",
    "M8 12h11",
    "M8 18h10",
    "M3 6h.01",
    "M3 12h.01",
    "M3 18h.01"
  ],
  message: ["M3 5h18v14H3z", "M3 7l9 6 9-6"],
  calendar: ["M3 5h18v16H3z", "M3 9h18", "M8 3v4", "M16 3v4"],
  capsule: ["M12 22a10 10 0 110-20 10 10 0 010 20z", "M12 7v5l3.5 2"],
  diary: [
    "M4 19.5A2.5 2.5 0 016.5 17H20",
    "M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
  ],
  footprint: [
    "M12 21s-7-5.5-7-11a7 7 0 1114 0c0 5.5-7 11-7 11z",
    "M12 12a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
  ]
};

const paths = computed(() => ICON_PATHS[props.name] ?? []);
</script>

<template>
  <svg
    class="nav-svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="(d, i) in paths" :key="i" :d="d" />
  </svg>
</template>

<style scoped>
.nav-svg {
  display: block;
  flex-shrink: 0;

  /* 悬停微动效过渡:描边加粗/轻浮起/光晕(状态由父级 hover 驱动) */
  transition:
    transform var(--am-duration-fast) var(--am-ease),
    stroke-width var(--am-duration-fast) var(--am-ease),
    filter var(--am-duration-fast) var(--am-ease);
}

/* 降级:减弱动效偏好下仅保留描边变化,关闭位移与光晕 */
@media (prefers-reduced-motion: reduce) {
  .nav-svg {
    transition: stroke-width var(--am-duration-fast) var(--am-ease);
  }
}
</style>
