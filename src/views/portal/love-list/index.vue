<script setup lang="ts">
import { computed, ref } from "vue";
import { getLoveList, type LoveListItem } from "@/api/portal";
import { queryKeys } from "@/hooks/queryKeys";
import { usePortalList } from "@/hooks/usePortalQuery";
import PortalLoadMore from "@/components/PortalLoadMore/index.vue";
import PortalGhostTile from "@/components/PortalGhostTile/index.vue";
import { useLightbox } from "@/hooks/useLightbox";
import reveal from "@/directives/reveal";

defineOptions({ name: "PortalLoveList" });

const vReveal = reveal;

/** 门户「加载更多」分页加载(每页 6 条);首拉与 KeepAlive 激活校验由查询层接管 */
const { items, loading, hasMore, loadMore } = usePortalList<LoveListItem>(
  queryKeys.loveList(),
  getLoveList
);

/* ---------------- 进度统计 ---------------- */

/** 完成数与完成率(mock 无主键,index 作 key 可接受;后端补主键后改用业务 id) */
const doneCount = computed(() => items.value.filter(it => it.done).length);
const donePercent = computed(() =>
  items.value.length
    ? Math.round((doneCount.value / items.value.length) * 100)
    : 0
);

/* ---------------- 分组展示 ---------------- */

/** 视图:待完成 / 已完成(默认按「待完成在前」混排) */
type ViewMode = "all" | "done";
const viewMode = ref<ViewMode>("all");

const visibleItems = computed(() => {
  if (viewMode.value === "done") return items.value.filter(it => it.done);
  // 混排:未完成在前,已完成在后(保持各自加载顺序)
  return [
    ...items.value.filter(it => !it.done),
    ...items.value.filter(it => it.done)
  ];
});

/* ---------------- 纪念照影院模式 ---------------- */

const { lightboxOpen, lightboxIndex, openAt: openLightbox } = useLightbox();

/** 纪念照数据源(仅已完成且带照片的项) */
const photoItems = computed(() =>
  visibleItems.value
    .filter(it => it.done && it.img)
    .map(it => ({ url: it.img as string, caption: it.text }))
);

/** 当前图注(el-image-viewer 的 default 插槽内展示) */
const currentCaption = computed(
  () => photoItems.value[lightboxIndex.value]?.caption
);

/** 打开纪念照 */
function openPhoto(item: LoveListItem) {
  const idx = photoItems.value.findIndex(p => p.url === item.img);
  if (idx >= 0) openLightbox(idx);
}
</script>

<template>
  <div class="am-page">
    <!-- 章节题头 -->
    <header class="am-section-head">
      <p class="am-section-kicker">Bucket List · 想和你一起</p>
      <h1 class="am-section-title">恋爱清单</h1>
      <p class="list-intro">总有些惊奇的际遇,比方说当我遇见你。</p>
    </header>

    <!-- 视图切换 -->
    <div class="list-tabs">
      <button
        class="list-tab"
        :class="{ active: viewMode === 'all' }"
        type="button"
        @click="viewMode = 'all'"
      >
        全部 · {{ items.length }}
      </button>
      <button
        class="list-tab"
        :class="{ active: viewMode === 'done' }"
        type="button"
        @click="viewMode = 'done'"
      >
        已完成 · {{ doneCount }}
      </button>
    </div>

    <div class="list-layout">
      <!-- 左栏:进度(粘性) -->
      <aside class="list-progress">
        <div class="list-progress-sticky">
          <p class="am-section-kicker">Keep Going</p>
          <b class="list-percent">{{ donePercent }}<i>%</i></b>
          <p class="list-progress-note">
            已完成 {{ doneCount }} / 共 {{ items.length }} 项
          </p>
          <div class="list-bar" aria-hidden="true">
            <span class="list-bar-fill" :style="{ width: `${donePercent}%` }" />
          </div>
        </div>
      </aside>

      <!-- 右栏:清单条目 -->
      <div class="list-main">
        <ul class="list-items">
          <li
            v-for="(it, i) in visibleItems"
            :key="`${it.text}-${i}`"
            v-reveal="(i % 3 || 0) * 0.06"
            class="list-item reveal"
            :class="{ 'list-item-done': it.done }"
          >
            <!-- 完成印章:旋转弹入 -->
            <span v-if="it.done" class="list-stamp" aria-label="已完成">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M4 12.5l5 5L20 6.5" />
              </svg>
            </span>
            <span v-else class="list-circle" aria-hidden="true" />

            <span class="list-no">{{ String(i + 1).padStart(2, "0") }}</span>

            <span class="list-text" :class="{ 'list-text-done': it.done }">
              {{ it.text }}
            </span>

            <!-- 完成项纪念照 -->
            <button
              v-if="it.done && it.img"
              class="list-photo"
              type="button"
              @click="openPhoto(it)"
            >
              <img :src="it.img" :alt="`${it.text} 纪念照`" loading="lazy" />
            </button>
          </li>

          <!-- 加载更多:幽灵占位(300ms 阈值防闪烁),与清单行同构 -->
          <PortalGhostTile
            v-if="loading && visibleItems.length > 0"
            tag="li"
            variant="row"
            :count="6"
          />
        </ul>

        <!-- 首屏加载:杂志线框骨架屏 -->
        <el-skeleton v-if="loading && items.length === 0" :rows="4" animated />

        <div v-if="!loading && items.length === 0" class="am-empty">
          清单还是空的,写下第一个约定吧…
        </div>

        <!-- 「加载更多」按钮(门户列表页共用组件) -->
        <PortalLoadMore
          :loading="loading"
          :has-more="hasMore"
          @load="loadMore"
        />
      </div>
    </div>

    <!-- 纪念照影院模式:EP 内置键盘/缩放/循环切换;default 插槽承载图注 -->
    <el-image-viewer
      v-if="lightboxOpen"
      :url-list="photoItems.map(p => p.url)"
      :initial-index="lightboxIndex"
      hide-on-click-modal
      teleported
      @close="lightboxOpen = false"
      @switch="(i: number) => (lightboxIndex = i)"
    >
      <p v-if="currentCaption"
        class="viewer-caption"
      >{{ currentCaption }}</p>
    </el-image-viewer>
  </div>
</template>

<style scoped>
.viewer-caption {
  position: absolute;
  bottom: 52px;
  left: 50%;
  max-width: 80%;
  padding: 8px 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--am-text-sm);
  color: #fff;
  white-space: nowrap;
  background: rgb(0 0 0 / 45%);
  border-radius: 999px;
  backdrop-filter: blur(4px);
  transform: translateX(-50%);
}

.list-intro {
  margin-top: 6px;
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

/* 视图切换 */
.list-tabs {
  display: flex;
  gap: 10px;
  padding: var(--am-space-md) 0;
}

.list-tab {
  padding: 8px 18px;
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
  cursor: pointer;
  background: none;
  border: 1px solid var(--am-line);
  border-radius: 999px;
  transition:
    color var(--am-duration) ease,
    border-color var(--am-duration) ease,
    background var(--am-duration) ease;
}

.list-tab.active {
  color: var(--am-rose);
  background: var(--am-rose-soft);
  border-color: var(--am-rose);
}

/* 左右分栏:左进度粘性,右清单滚动 */
.list-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: var(--am-space-lg);
  align-items: start;
}

.list-progress-sticky {
  position: sticky;
  top: 96px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: var(--am-space-md);
}

.list-percent {
  font-family: var(--am-font-mono);
  font-size: clamp(3rem, 8vw, 4rem);
  font-weight: 600;
  line-height: 1;
  color: var(--am-rose);
}

.list-percent i {
  font-size: var(--am-text-lg);
  font-style: normal;
  color: var(--am-ink-secondary);
}

.list-progress-note {
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

/* 进度细线 */
.list-bar {
  height: 2px;
  margin-top: 10px;
  background: var(--am-line);
}

.list-bar-fill {
  display: block;
  height: 100%;
  background: var(--am-rose);
  transition: width 0.6s var(--am-ease);
}

/* 清单条目 */
.list-items {
  display: flex;
  flex-direction: column;
}

.list-item {
  display: flex;
  gap: 14px;
  align-items: center;
  contain-intrinsic-size: auto 72px;
  padding: 18px 0;
  content-visibility: auto;
  border-bottom: 1px solid var(--am-line);
  transition: transform var(--am-duration) var(--am-ease);
}

/* 完成印章:旋转弹入 */
.list-stamp {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 26px;
  height: 26px;
  color: var(--am-rose);
  border: 2px solid var(--am-rose);
  border-radius: 50%;
  animation: stamp-in 0.4s var(--am-ease-spring) both;
}

.list-stamp svg {
  width: 14px;
  height: 14px;
}

@keyframes stamp-in {
  from {
    opacity: 0;
    transform: rotate(-24deg) scale(1.5);
  }

  to {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .list-stamp {
    animation: none;
  }
}

/* 未完成空圈 */
.list-circle {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: 2px solid var(--am-line);
  border-radius: 50%;
}

/* 条目悬浮:整行右移 4px + 编号点亮(纯 transform,不触发布局) */
.list-item:hover {
  transform: translateX(4px);
}

.list-item:hover .list-no {
  color: var(--am-rose);
}

.list-no {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-ink-tertiary);
  transition: color var(--am-duration-fast) ease;
}

.list-text {
  flex: 1;
  min-width: 0;
  font-size: var(--am-text-base);
  color: var(--am-ink);
}

.list-text-done {
  color: var(--am-ink-secondary);
  text-decoration: line-through;
  text-decoration-thickness: 1.5px;
  text-decoration-color: var(--am-rose);
}

/* 纪念照缩略图 */
.list-photo {
  flex-shrink: 0;
  padding: 0;
  cursor: zoom-in;
  background: none;
  border: 0;
}

.list-photo img {
  display: block;
  width: 56px;
  height: 44px;
  object-fit: cover;
  border-radius: var(--am-radius);
}

@media (width <= 768px) {
  .list-layout {
    grid-template-columns: 1fr;
  }

  .list-progress-sticky {
    position: static;
    flex-flow: row wrap;
    gap: 12px;
    align-items: baseline;
  }

  .list-percent {
    font-size: 2.4rem;
  }
}
</style>
