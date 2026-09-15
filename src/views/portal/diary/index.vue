<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getDiary, type DiaryItem } from "@/api/portal";
import { usePagedList } from "@/hooks/usePagedList";
import PortalLoadMore from "@/components/PortalLoadMore/index.vue";
import PortalSkeleton from "@/components/PortalSkeleton/index.vue";
import { fallbackAvatar } from "@/utils/avatar";
import reveal from "@/directives/reveal";

defineOptions({ name: "PortalDiary" });

const vReveal = reveal;

/** 门户「加载更多」分页加载(每页 6 篇) */
const { items, loading, hasMore, loadMore } = usePagedList<DiaryItem>(getDiary);

onMounted(() => loadMore());

/** 展开状态(>6 行截断展开) */
const expanded = ref(new Set<number>());

function toggle(id: number) {
  const next = new Set(expanded.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expanded.value = next;
}

/** 记录人列表(按 user_id 聚合,维持首次出现顺序) */
const writers = computed(() => {
  const map = new Map<number, DiaryItem>();
  for (const it of items.value) {
    if (!map.has(it.userId)) map.set(it.userId, it);
  }
  return [...map.values()].map(it => ({
    userId: it.userId,
    nickname: it.nickname,
    avatar: it.avatar
  }));
});

/** 按记录人分组的日记(组内按日期倒序,后端契约按时间倒序) */
const columns = computed(() => {
  return writers.value.map(writer => ({
    ...writer,
    entries: items.value.filter(it => it.userId === writer.userId)
  }));
});

/** 头像兜底 */
function avatarSrc(it: DiaryItem): string {
  return it.avatar || fallbackAvatar;
}

/** 心情线描图标(枚举:m sunny/rainy/starry;其余不展示) */
function moodIcon(mood: string | null): string | null {
  if (!mood) return null;
  if (["sunny", "rainy", "starry"].includes(mood)) return mood;
  return null;
}
</script>

<template>
  <div class="am-page">
    <!-- 章节题头 -->
    <header class="am-section-head">
      <p class="am-section-kicker">Two Voices · 两地书</p>
      <h1 class="am-section-title">情侣日记</h1>
      <p class="diary-intro">同一天的两种视角,拼成完整的我们。</p>
    </header>

    <!-- 双栏手账:按记录人分栏,同日期左右对齐 -->
    <div v-if="columns.length" class="diary-columns">
      <section v-for="col in columns" :key="col.userId" class="diary-column">
        <header class="diary-col-head">
          <img :src="col.avatar || fallbackAvatar" :alt="col.nickname" />
          <span class="diary-col-name">{{ col.nickname }} 的手账</span>
        </header>

        <article
          v-for="(it, i) in col.entries"
          :key="it.id"
          v-reveal="(i % 2 || 0) * 0.06"
          class="diary-card reveal"
        >
          <header class="diary-card-head">
            <time class="diary-date">{{ it.diaryDate }}</time>
            <!-- 心情线描图标 -->
            <svg
              v-if="moodIcon(it.mood) === 'sunny'"
              class="diary-mood"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path
                d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
              />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'rainy'"
              class="diary-mood"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M20 15.5A3.5 3.5 0 0 0 18 9h-.5A5.5 5.5 0 0 0 9 7.5 4 4 0 0 0 4 15.5"
              />
              <path d="M8 19l-1 2m5-2l-1 2m5-2l-1 2" />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'starry'"
              class="diary-mood"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 15l.9 2.6L21 18.5l-.9.9-.9 2.6-.9-2.6-.9-.9.9-.9L18.7 15l.9 1z"
              />
            </svg>
          </header>
          <p class="diary-content" :class="{ expanded: expanded.has(it.id) }">
            {{ it.content }}
          </p>
          <button class="diary-expand" type="button" @click="toggle(it.id)">
            {{ expanded.has(it.id) ? "收起" : "展开全文" }}
          </button>
        </article>
      </section>
    </div>

    <!-- 首屏加载:杂志线框骨架屏 -->
    <PortalSkeleton v-if="loading && items.length === 0" :rows="2" />

    <div v-if="!loading && items.length === 0" class="am-empty">
      今天还没有日记,写下第一篇吧…
    </div>

    <!-- 「加载更多」按钮(门户列表页共用组件) -->
    <PortalLoadMore :loading="loading" :has-more="hasMore" @load="loadMore" />
  </div>
</template>

<style scoped>
/* 双栏手账:左右两人各一列,中间细线分隔 */
.diary-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--am-space-lg);
  padding: var(--am-space-md) 0;
}

.diary-column {
  min-width: 0;
}

.diary-col-head {
  display: flex;
  gap: 10px;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--am-line-strong);
}

.diary-col-head img {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 50%;
}

.diary-col-name {
  font-family: var(--am-font-display);
  font-size: var(--am-text-base);
  font-weight: 700;
  color: var(--am-ink);
}

/* 日记卡:手账窄栏限宽控制行长 */
.diary-card {
  max-width: 36em;
  contain-intrinsic-size: auto 180px;
  padding: 14px 0;
  content-visibility: auto;
  border-bottom: 1px solid var(--am-line);
}

.diary-card-head {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.diary-date {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-rose);
}

.diary-mood {
  width: 18px;
  height: 18px;
  color: var(--am-ink-secondary);
}

/* 正文:默认截断 6 行,展开后完整显示 */
.diary-content {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-line-clamp: 6;
  font-size: var(--am-text-sm);
  line-height: 1.9;
  color: var(--am-ink);
  -webkit-box-orient: vertical;
}

.diary-content.expanded {
  overflow: visible;
  -webkit-line-clamp: unset;
}

/* 展开按钮:小字链接 */
button.diary-expand {
  padding: 0;
  margin-top: 6px;
  font-size: var(--am-text-xs);
  color: var(--am-rose);
  cursor: pointer;
  background: none;
  border: 0;
}

@media (width <= 768px) {
  .diary-columns {
    grid-template-columns: 1fr;
  }
}
</style>
