<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";

defineOptions({ name: "PortalLightbox" });

/** 影院模式图片项 */
export interface LightboxItem {
  /** 图片地址 */
  url: string;
  /** 图注(日期/文案) */
  caption?: string;
}

const props = defineProps<{
  /** 是否打开(v-model:open) */
  open: boolean;
  /** 图片列表 */
  items: LightboxItem[];
  /** 当前下标(v-model:index) */
  index: number;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "update:index", value: number): void;
}>();

/** 当前图片(越界防御) */
const current = computed(() => props.items[props.index]);

/** 关闭影院模式 */
function close() {
  emit("update:open", false);
}

/** 上一张/下一张(循环切换) */
function prev() {
  if (props.items.length < 2) return;
  emit(
    "update:index",
    (props.index - 1 + props.items.length) % props.items.length
  );
}

function next() {
  if (props.items.length < 2) return;
  emit("update:index", (props.index + 1) % props.items.length);
}

function onKeydown(event: KeyboardEvent) {
  if (!props.open) return;
  if (event.key === "Escape") close();
  if (event.key === "ArrowLeft") prev();
  if (event.key === "ArrowRight") next();
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <!-- 影院模式:近黑底全屏,极简信息,Esc/左右键/点击遮罩关闭 -->
      <div
        v-if="open && current"
        class="lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="图片查看"
        @click.self="close"
      >
        <img
          class="lightbox-img"
          :src="current.url"
          :alt="current.caption || '照片大图'"
        />
        <p v-if="current.caption" class="lightbox-caption">
          {{ current.caption }}
        </p>

        <!-- 切换按钮(单图不显示) -->
        <template v-if="items.length > 1">
          <button
            class="lightbox-nav lightbox-prev"
            type="button"
            aria-label="上一张"
            @click.stop="prev"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            class="lightbox-nav lightbox-next"
            type="button"
            aria-label="下一张"
            @click.stop="next"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span class="lightbox-count"
            >{{ index + 1 }} / {{ items.length }}</span
          >
        </template>

        <button
          class="lightbox-close"
          type="button"
          aria-label="关闭"
          @click="close"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  background: rgb(16 12 11 / 92%);
  backdrop-filter: blur(6px);
}

.lightbox-img {
  max-width: min(92vw, 1200px);
  max-height: 82vh;
  object-fit: contain;
}

.lightbox-caption {
  position: absolute;
  bottom: 40px;
  left: 50%;
  font-family: var(--am-font-mono);
  font-size: var(--am-text-sm);
  color: rgb(255 255 255 / 78%);
  letter-spacing: 0.08em;
  transform: translateX(-50%);
}

/* 左右切换按钮 */
.lightbox-nav {
  position: absolute;
  top: 50%;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: rgb(255 255 255 / 82%);
  cursor: pointer;
  background: rgb(255 255 255 / 8%);
  border: 0;
  border-radius: 50%;
  transition: background var(--am-duration) ease;
}

.lightbox-nav:hover {
  background: rgb(255 255 255 / 18%);
}

.lightbox-prev {
  left: 20px;
}

.lightbox-next {
  right: 20px;
}

.lightbox-nav svg {
  width: 22px;
  height: 22px;
}

.lightbox-count {
  position: absolute;
  top: 20px;
  left: 50%;
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: rgb(255 255 255 / 70%);
  transform: translateX(-50%);
}

/* 关闭按钮 */
.lightbox-close {
  position: absolute;
  top: 16px;
  right: 16px;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: rgb(255 255 255 / 82%);
  cursor: pointer;
  background: none;
  border: 0;
}

.lightbox-close svg {
  width: 26px;
  height: 26px;
}

/* 开合过渡 */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.22s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
</style>
