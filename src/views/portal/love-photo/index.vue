<script setup lang="ts">
import { computed, ref } from "vue";
import { getLovePhoto, type LovePhotoItem } from "@/api/portal/love-photo";
import { queryKeys } from "@/hooks/query-keys";
import { usePortalList } from "@/hooks/usePortalQuery";
import PortalLoadMore from "@/components/PortalLoadMore/index.vue";
import PortalGhostTile from "@/components/PortalGhostTile/index.vue";
import { useLightbox } from "@/hooks/useLightbox";
import { scrollToTop } from "@/utils/motion";
import reveal from "@/directives/reveal";

defineOptions({ name: "PortalLovePhoto" });

const vReveal = reveal;

/** 门户「加载更多」分页加载(每页 6 张);首拉与 KeepAlive 激活校验由查询层接管 */
const { items, loading, hasMore, loadMore } = usePortalList<LovePhotoItem>(
  queryKeys.lovePhoto(),
  getLovePhoto
);

/** 图片加载失败兜底:隐藏破图,回落占位底色 */
function onImgError(event: Event) {
  (event.currentTarget as HTMLElement | null)?.classList.add(
    "album-img-broken"
  );
}

/* ---------------- tag 分册 ---------------- */

/** 分册标签:从已加载数据聚合(后端 tags 为数组,一张照片可归入多个分册);「全部」固定首位 */
const ALL_TAG = "全部";
const activeTag = ref(ALL_TAG);

const tagOptions = computed(() => {
  const tags = new Set<string>();
  for (const it of items.value) {
    for (const raw of it.tags ?? []) {
      const tag = raw.trim();
      if (tag) tags.add(tag);
    }
  }
  return [ALL_TAG, ...tags];
});

/** 当前分册的照片(无标签的照片始终归入「全部」) */
const visibleItems = computed(() => {
  if (activeTag.value === ALL_TAG) return items.value;
  return items.value.filter(it =>
    (it.tags ?? []).some(t => t.trim() === activeTag.value)
  );
});

/** 切换分册:重置型操作,回到页首欣赏新分册(尊重 reduced-motion) */
function switchTag(tag: string) {
  if (tag === activeTag.value) return;
  activeTag.value = tag;
  scrollToTop();
}

/* ---------------- 影院模式 ---------------- */

/** 影院模式数据源:带图注的图片列表 */
const lightboxItems = computed(() =>
  visibleItems.value.map(it => ({
    url: it.img,
    caption: `${it.text} · ${it.date}`
  }))
);
const { lightboxOpen, lightboxIndex, openAt: openLightbox } = useLightbox();

/** 当前图注(el-image-viewer 的 default 插槽内展示) */
const currentCaption = computed(
  () => lightboxItems.value[lightboxIndex.value]?.caption
);

/** 杂志式网格节奏:每 7 张一循环——0 大图(2×2)、3 横幅(2×1)、5 竖幅(1×2) */
function spanClass(i: number) {
  const m = i % 7;
  if (m === 0) return "album-item-featured";
  if (m === 3) return "album-item-wide";
  if (m === 5) return "album-item-tall";
  return "";
}
</script>

<template>
  <div class="am-page">
    <!-- 章节题头 -->
    <header class="am-section-head">
      <p class="am-section-kicker">Our Album · 时光相册</p>
      <h1 class="am-section-title">恋爱画册</h1>
      <p class="album-intro">记录最美瞬间,把时间折进相纸里。</p>
    </header>

    <!-- tag 分册(mock 无 tag 时仅「全部」,不渲染) -->
    <div v-if="tagOptions.length > 1" class="album-tags">
      <button
        v-for="tag in tagOptions"
        :key="tag"
        class="album-tag"
        :class="{ active: tag === activeTag }"
        type="button"
        @click="switchTag(tag)"
      >
        {{ tag }}
      </button>
    </div>

    <!-- 照片瀑布流:CSS columns 实现,悬浮浮现图注,点击/回车进影院模式;
         分册切换整墙交叉淡入(CSS columns 下比逐项 FLIP 更稳) -->
    <Transition name="album-fade" mode="out-in">
      <div v-if="visibleItems.length" :key="activeTag" class="album-grid">
        <figure
          v-for="(it, i) in visibleItems"
          :key="`${it.img}-${i}`"
          v-reveal="(i % 3 || 0) * 0.06"
          class="album-item reveal"
          :class="spanClass(i)"
          role="button"
          tabindex="0"
          :aria-label="`查看照片:${it.text}`"
          @click="openLightbox(i)"
          @keydown.enter.prevent="openLightbox(i)"
          @keydown.space.prevent="openLightbox(i)"
        >
          <img
            class="album-img"
            :src="it.img"
            :alt="it.text"
            width="600"
            height="400"
            loading="lazy"
            @error="onImgError"
          />
          <figcaption class="album-caption">
            <span class="album-text">{{ it.text }}</span>
            <time class="album-date">{{ it.date }}</time>
          </figcaption>
        </figure>

        <!-- 加载更多:网格尾部幽灵占位(300ms 防闪烁),数据到达后由真实照片接管 -->
        <PortalGhostTile v-if="loading" variant="block" :count="6" />
      </div>

      <!-- 首屏加载:杂志线框骨架屏 -->
      <el-skeleton v-else-if="loading" key="skeleton" :rows="3" animated />

      <div v-else key="empty" class="am-empty">相册整理中,敬请期待…</div>
    </Transition>

    <!-- 「加载更多」按钮(门户列表页共用组件) -->
    <PortalLoadMore :loading="loading" :has-more="hasMore" @load="loadMore" />

    <!-- 影院模式:EP 内置键盘/缩放/循环切换;default 插槽承载图注 -->
    <el-image-viewer
      v-if="lightboxOpen"
      :url-list="lightboxItems.map(p => p.url)"
      :initial-index="lightboxIndex"
      hide-on-click-modal
      teleported
      @close="lightboxOpen = false"
      @switch="(i: number) => (lightboxIndex = i)"
    >
      <p v-if="currentCaption" class="viewer-caption">{{ currentCaption }}</p>
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

.album-intro {
  margin-top: 6px;
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

/* tag 分册 */
.album-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: var(--am-space-md) 0;
}

.album-tag {
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

.album-tag:hover {
  color: var(--am-ink);
  border-color: var(--am-ink-secondary);
}

.album-tag.active {
  color: var(--am-rose);
  background: var(--am-rose-soft);
  border-color: var(--am-rose);
}

/* 杂志式网格:固定行高 + dense 流,大小交错打破均质;阅读顺序仍为时间线 */
.album-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 200px;
  grid-auto-flow: dense;
  gap: var(--am-space-md);
}

/* 册页:相纸底衬,层次靠纸边与悬浮图注 */
.album-item {
  --album-mat: 8px;

  position: relative;
  padding: var(--album-mat);
  overflow: hidden;
  cursor: zoom-in;
  background: var(--am-card);
  border: 1px solid var(--am-line);
}

/* 大小节奏:每 7 张中 1 大 1 横 1 竖(纯索引取模,不依赖数据契约) */
.album-item-featured {
  grid-row: span 2;
  grid-column: span 2;
}

.album-item-wide {
  grid-column: span 2;
}

.album-item-tall {
  grid-row: span 2;
}

.album-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s var(--am-ease);
}

/* 加载失败兜底:隐藏破图,保底显示占位底色 */
.album-img-broken {
  visibility: hidden;
}

/* 相纸微倾:错落倾角打破呆板,悬停转正抬升(尊重 reduced-motion) */
@media (prefers-reduced-motion: no-preference) {
  .album-item {
    transition:
      rotate var(--am-duration) var(--am-ease),
      translate var(--am-duration) var(--am-ease),
      box-shadow var(--am-duration) ease;
  }

  .album-item:nth-child(7n + 1) {
    rotate: -1.2deg;
  }

  .album-item:nth-child(7n + 3) {
    rotate: 0.9deg;
  }

  .album-item:nth-child(7n + 5) {
    rotate: 1.2deg;
  }

  .album-item:nth-child(7n + 6) {
    rotate: -0.9deg;
  }

  .album-item:hover {
    box-shadow: var(--am-shadow-hover);
    rotate: 0deg;
    translate: 0 -4px;
  }
}

/* 键盘可达:Tab 聚焦时玫瑰色焦点环,图注同步浮现 */
.album-item:focus-visible {
  outline: 2px solid var(--am-rose);
  outline-offset: 2px;
}

.album-item:focus-visible .album-caption {
  opacity: 1;
}

/* 图注:悬浮浮现,覆盖范围与照片区对齐(不压相纸边) */
.album-caption {
  position: absolute;
  inset: auto var(--album-mat) var(--album-mat);
  display: flex;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
  padding: 28px 14px 12px;
  color: #faf7f2;
  background: linear-gradient(transparent, rgb(20 16 14 / 72%));
  opacity: 0;
  transition: opacity var(--am-duration) ease;
}

/* 图注仅随悬停/键盘聚焦浮现:focus-visible 避免鼠标点击后的残留焦点锁住深色背景 */
.album-item:hover .album-caption,
.album-item:focus-visible .album-caption {
  opacity: 1;
}

.album-text {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--am-text-sm);
  white-space: nowrap;
}

.album-date {
  flex-shrink: 0;
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: rgb(250 247 242 / 72%);
}

/* 幽灵占位:沿用相纸衬边(形状与呼吸由 PortalGhostTile 组件内置) */
.album-grid :deep(.portal-ghost) {
  padding: 8px;
  border: 1px solid var(--am-line);
  border-radius: 0;
}

/* 分册切换:整墙交叉淡入淡出(opacity 合成器属性,不触发重排) */
.album-fade-enter-active,
.album-fade-leave-active {
  transition: opacity var(--am-duration) ease;
}

.album-fade-enter-from,
.album-fade-leave-to {
  opacity: 0;
}

@media (width <= 960px) {
  .album-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 180px;
  }
}

@media (width <= 560px) {
  .album-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: 240px;
  }

  /* 单列下取消横向跨列,大图仍保留纵向加高 */
  .album-item-featured,
  .album-item-wide {
    grid-column: auto;
  }
}
</style>
