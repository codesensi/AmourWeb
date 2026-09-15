<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getLovePhoto, type LovePhotoItem } from "@/api/portal";
import { usePagedList } from "@/hooks/usePagedList";
import PortalLoadMore from "@/components/PortalLoadMore/index.vue";
import PortalSkeleton from "@/components/PortalSkeleton/index.vue";
import PortalLightbox, {
  type LightboxItem
} from "@/components/PortalLightbox/index.vue";
import reveal from "@/directives/reveal";

defineOptions({ name: "PortalLovePhoto" });

const vReveal = reveal;

/** 门户「加载更多」分页加载(每页 6 张) */
const { items, loading, hasMore, loadMore } =
  usePagedList<LovePhotoItem>(getLovePhoto);

onMounted(() => loadMore());

/** 图片加载失败兜底:隐藏破图,回落占位底色 */
function onImgError(event: Event) {
  (event.currentTarget as HTMLElement | null)?.classList.add(
    "album-img-broken"
  );
}

/* ---------------- tag 分册 ---------------- */

/** 分册标签:从已加载数据聚合(契约扩展位:后端返回 tag 前兼容无 tag 的 mock);「全部」固定首位 */
const ALL_TAG = "全部";
const activeTag = ref(ALL_TAG);

const tagOptions = computed(() => {
  const tags = new Set<string>();
  for (const it of items.value) {
    const tag = (it as LovePhotoItem & { tag?: string }).tag?.trim();
    if (tag) tags.add(tag);
  }
  return [ALL_TAG, ...tags];
});

/** 当前分册的照片(无 tag 数据时等价于全部) */
const visibleItems = computed(() => {
  if (activeTag.value === ALL_TAG) return items.value;
  return items.value.filter(
    it => (it as LovePhotoItem & { tag?: string }).tag === activeTag.value
  );
});

/* ---------------- 影院模式 ---------------- */

const lightboxOpen = ref(false);
const lightboxIndex = ref(0);

/** 影院模式数据源:带图注的图片列表 */
const lightboxItems = computed<LightboxItem[]>(() =>
  visibleItems.value.map(it => ({
    url: it.img,
    caption: `${it.text} · ${it.date}`
  }))
);

/** 打开影院模式(索引按当前分册计算) */
function openLightbox(i: number) {
  lightboxIndex.value = i;
  lightboxOpen.value = true;
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
        @click="activeTag = tag"
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
      </div>

      <!-- 首屏加载:杂志线框骨架屏 -->
      <PortalSkeleton v-else-if="loading" key="skeleton" :rows="3" />

      <div v-else key="empty" class="am-empty">相册整理中,敬请期待…</div>
    </Transition>

    <!-- 「加载更多」按钮(门户列表页共用组件) -->
    <PortalLoadMore :loading="loading" :has-more="hasMore" @load="loadMore" />

    <!-- 影院模式 -->
    <PortalLightbox
      v-model:open="lightboxOpen"
      v-model:index="lightboxIndex"
      :items="lightboxItems"
    />
  </div>
</template>

<style scoped>
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

/* 瀑布流:多列布局,列间距即册页间距 */
.album-grid {
  column-count: 3;
  column-gap: var(--am-space-sm);
}

/* 册页:无阴影卡片,层次靠底色与悬浮图注 */
.album-item {
  position: relative;
  margin: 0 0 var(--am-space-sm);
  overflow: hidden;
  cursor: zoom-in;
  background: var(--am-bg-deep);
  break-inside: avoid;
}

.album-img {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  transition: transform 0.5s var(--am-ease);
}

/* 加载失败兜底:隐藏破图,保底显示占位底色 */
.album-img-broken {
  visibility: hidden;
}

.album-item:hover .album-img {
  transform: scale(1.03);
}

/* 键盘可达:Tab 聚焦时玫瑰色焦点环,图注同步浮现 */
.album-item:focus-visible {
  outline: 2px solid var(--am-rose);
  outline-offset: 2px;
}

.album-item:focus-visible .album-caption {
  opacity: 1;
}

/* 图注:悬浮浮现 */
.album-caption {
  position: absolute;
  inset: auto 0 0;
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

.album-item:hover .album-caption,
.album-item:focus-within .album-caption {
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
    column-count: 2;
  }
}

@media (width <= 560px) {
  .album-grid {
    column-count: 1;
  }
}
</style>
