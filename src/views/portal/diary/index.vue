<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { getDiary, type DiaryItem } from "@/api/portal/diary";
import { queryKeys } from "@/hooks/query-keys";
import { usePortalList } from "@/hooks/usePortalQuery";
import PortalLoadMore from "@/components/PortalLoadMore/index.vue";
import { fallbackAvatar } from "@/utils/avatar";
import { prefersReducedMotion } from "@/utils/motion";
import reveal from "@/directives/reveal";

defineOptions({ name: "PortalDiary" });

const vReveal = reveal;

/** 门户「加载更多」分页加载(每页 12 篇:双栏布局左右各 6 篇);
 * 首拉与 KeepAlive 激活校验由查询层接管 */
const { items, loading, hasMore, loadMore } = usePortalList<DiaryItem>(
  queryKeys.diary(),
  getDiary,
  { pageSize: 12 }
);

/** 展开状态(超过 2 行截断展开) */
const expanded = ref(new Set<number>());

/** 展开过渡时长(与 CSS max-height 过渡一致) */
const EXPAND_MS = 400;

/** 进行中的高度过渡定时器:快速连点时清理上一次 */
const timers = new Map<number, number>();

function toggle(id: number) {
  const el = contentEls.get(id);
  const isExpanding = !expanded.value.has(id);
  // 减少动态偏好或元素缺失:状态瞬时切换,跳过高度动画
  if (!el || prefersReducedMotion()) {
    const next = new Set(expanded.value);
    if (isExpanding) next.add(id);
    else next.delete(id);
    expanded.value = next;
    return;
  }

  const prev = timers.get(id);
  if (prev) clearTimeout(prev);

  const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 26;
  const collapsedMax = `${Math.round(lineHeight * 2)}px`;

  /** 过渡结束:还原自然高度;收起时此刻才收回钳制,高度无缝衔接 */
  const finish = () => {
    timers.delete(id);
    el.style.maxHeight = "";
    if (!isExpanding) {
      const next = new Set(expanded.value);
      next.delete(id);
      expanded.value = next;
    }
    measureOverflow();
  };

  if (isExpanding) {
    // 展开:类先解除钳制,再从 2 行高度过渡到自然全高
    const next = new Set(expanded.value);
    next.add(id);
    expanded.value = next;
    el.style.maxHeight = collapsedMax;
    void el.offsetHeight; // 强制回流,锁定起点
    el.style.maxHeight = `${el.scrollHeight}px`;
  } else {
    // 收起:钳制保持(类未移除),用 max-height 裁剪平滑回 2 行,结束后再收钳制
    el.style.maxHeight = `${el.scrollHeight}px`;
    void el.offsetHeight;
    el.style.maxHeight = collapsedMax;
  }

  timers.set(id, window.setTimeout(finish, EXPAND_MS));
}

/** 溢出检测结果:需要显示展开按钮的日记 id(已展开的恒显示「收起」) */
const expandable = ref(new Set<number>());

/** 模板 ref 收集正文元素,供溢出量测 */
const contentEls = new Map<number, HTMLElement>();

function setContentRef(id: number, el: unknown) {
  if (el) contentEls.set(id, el as HTMLElement);
  else contentEls.delete(id);
}

/** 量测正文是否超过两行:未展开时滚动高大于可视高即溢出 */
function measureOverflow() {
  const next = new Set<number>();
  for (const [id, el] of contentEls) {
    if (expanded.value.has(id) || el.scrollHeight > el.clientHeight + 1) {
      next.add(id);
    }
  }
  expandable.value = next;
}

/** 合帧量测:resize 等高频事件下合并到下一帧执行 */
function scheduleMeasure() {
  cancelAnimationFrame(measureRaf);
  measureRaf = requestAnimationFrame(measureOverflow);
}

let measureRaf = 0;

/* 新数据渲染后与展开/收起后都要重新量测;
 * 分页扁平列表是 computed 重算结果,监听 length 以过滤无关引用变化 */
watch(
  () => items.value.length,
  () => nextTick(measureOverflow)
);
watch(expanded, () => nextTick(measureOverflow));

onMounted(() => {
  window.addEventListener("resize", scheduleMeasure, { passive: true });
  document.fonts?.ready.then(scheduleMeasure).catch(() => {});
});

onUnmounted(() => {
  cancelAnimationFrame(measureRaf);
  window.removeEventListener("resize", scheduleMeasure);
});

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
          <p
            :ref="el => setContentRef(it.id, el)"
            class="diary-content"
            :class="{ expanded: expanded.has(it.id) }"
          >
            {{ it.content }}
          </p>
          <button
            v-if="expandable.has(it.id)"
            class="diary-expand"
            type="button"
            @click="toggle(it.id)"
          >
            {{ expanded.has(it.id) ? "收起" : "展开全文" }}
          </button>
        </article>
      </section>
    </div>

    <!-- 首屏加载:杂志线框骨架屏 -->
    <el-skeleton v-if="loading && items.length === 0" :rows="2" animated />

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

/* 日记卡:手账窄栏限宽控制行长;
 * 不用 content-visibility:auto——视口外卡片跳过布局会让溢出量测失真 */
.diary-card {
  max-width: 36em;
  padding: 14px 0;
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

/* 正文:默认截断 2 行,展开后完整显示;仅溢出的日记显示按钮 */
.diary-content {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-line-clamp: 2;
  font-size: var(--am-text-sm);
  line-height: 1.9;
  color: var(--am-ink);
  -webkit-box-orient: vertical;
  transition: max-height 0.4s var(--am-ease);
}

.diary-content.expanded {
  -webkit-line-clamp: unset;
}

/* 减少动态:高度过渡直接关闭(状态切换由脚本瞬时完成) */
@media (prefers-reduced-motion: reduce) {
  .diary-content {
    transition: none;
  }
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
