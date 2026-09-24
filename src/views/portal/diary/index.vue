<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { getDiary, type DiaryItem } from "@/api/portal/diary";
import { queryKeys } from "@/hooks/query-keys";
import { usePortalList } from "@/hooks/usePortalQuery";
import PortalLoadMore from "@/components/PortalLoadMore/index.vue";
import { resolveUserDisplay } from "@/utils/user-display";
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

/** 展开状态(超过 2 行截断展开;id 为后端字符串化的 Long) */
const expanded = ref(new Set<string>());

/** 展开过渡时长(与 CSS max-height 过渡一致) */
const EXPAND_MS = 400;

/** 进行中的高度过渡定时器:快速连点时清理上一次 */
const timers = new Map<string, number>();

function toggle(id: string) {
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
const expandable = ref(new Set<string>());

/** 模板 ref 收集正文元素,供溢出量测 */
const contentEls = new Map<string, HTMLElement>();

function setContentRef(id: string, el: unknown) {
  if (el) contentEls.set(id, el as HTMLElement);
  else contentEls.delete(id);
}

/** 量测正文是否超过两行:未展开时滚动高大于可视高即溢出 */
function measureOverflow() {
  const next = new Set<string>();
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
  // 动画收尾定时器一并清理:卸载后不再触碰僵尸 DOM 与已失效的响应式状态
  timers.forEach(clearTimeout);
  timers.clear();
});

/** 记录人展示信息(按 user_id 聚合,维持首次出现顺序) */
type WriterColumn = {
  userId: string;
  name: string;
  avatar: string;
};

const writers = ref<Array<WriterColumn>>([]);

/** 分栏头展示链路与门户首页一致:QQ 昵称 → 昵称 → 用户名;
 * 头像 QQ → 上传头像 → 兜底图(resolveUserDisplay 内部降级,恒非空) */
watch(
  items,
  async list => {
    const map = new Map<string, DiaryItem>();
    for (const it of list) {
      if (!map.has(it.userId)) map.set(it.userId, it);
    }
    const resolved = await Promise.all(
      [...map.values()].map(async it => {
        const display = await resolveUserDisplay({
          nickname: it.nickname,
          username: it.username,
          avatar: it.avatar,
          qq: it.qq
        });
        return {
          userId: it.userId,
          name: display.name,
          avatar: display.avatar
        };
      })
    );
    writers.value = resolved;
  },
  { immediate: true }
);

/** 按记录人分组的日记(组内按日期倒序,后端契约按时间倒序) */
const columns = computed(() => {
  return writers.value.map(writer => ({
    ...writer,
    entries: items.value.filter(it => it.userId === writer.userId)
  }));
});

/** 心情线描图标(unknown 为不标记不展示;枚举与后端 DiaryMoodEnum 对齐) */
function moodIcon(mood: string | null): string | null {
  if (!mood || mood === "unknown") return null;
  const known = [
    "sunny",
    "cloudy",
    "overcast",
    "rainy",
    "drizzle",
    "thunderstorm",
    "windy",
    "snowy",
    "sleet",
    "hail",
    "starry",
    "bloom",
    "moon",
    "rainbow",
    "fog",
    "leaf",
    "sunset",
    "meteor",
    "aurora"
  ];
  return known.includes(mood) ? mood : null;
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
          <img :src="col.avatar" :alt="col.name" />
          <span class="diary-col-name">{{ col.name }} 的手账</span>
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
            <svg
              v-else-if="moodIcon(it.mood) === 'cloudy'"
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
                d="M16 18a3 3 0 0 0 0-6 4.5 4.5 0 0 0-8.5-1.5A3.5 3.5 0 0 0 7 18h9z"
              />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'windy'"
              class="diary-mood"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 8h9a2.5 2.5 0 1 0-2-3.2" />
              <path d="M3 12h13a2.5 2.5 0 1 1-2 4" />
              <path d="M3 16h6" />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'snowy'"
              class="diary-mood"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
              <path d="M12 6.5l-2-1m2 1l2-1m-2 13l-2 1m2-1l2 1" />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'bloom'"
              class="diary-mood"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="9" r="2.2" />
              <path
                d="M12 6.8c0-2.5 1.5-3.8 3.2-3.8 0 2.4-1.2 3.6-3.2 3.8zm0 0c-2-0.2-3.2-1.4-3.2-3.8C10.8 3 12 4.3 12 6.8z"
              />
              <path d="M12 11.2V15m0 0c-2.8 0-5 1.6-5 4h10c0-2.4-2.2-4-5-4z" />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'moon'"
              class="diary-mood"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'rainbow'"
              class="diary-mood"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 18a9 9 0 0 1 18 0" />
              <path d="M7 18a5 5 0 0 1 10 0" />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'fog'"
              class="diary-mood"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M5 8h14M7 12h12M4 16h11" />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'leaf'"
              class="diary-mood"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M5 19C5 9 11 4 20 4c0 9-5 14-13 14" />
              <path d="M5 19c2-5 5-8 9-10" />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'overcast'"
              class="diary-mood"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M6 8.5a3 3 0 0 1 5.6-1.5" />
              <path
                d="M15 19a4 4 0 0 0 .8-7.9A5.5 5.5 0 0 0 5.5 12 3.5 3.5 0 0 0 6 19h9z"
              />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'drizzle'"
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
                d="M17 13a3.5 3.5 0 0 0-.5-7 5 5 0 0 0-9 1.5A3.8 3.8 0 0 0 8 13"
              />
              <path d="M9 16.5v1.5m3-1v2m3-2.5v1.5" />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'thunderstorm'"
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
                d="M17 12a3.5 3.5 0 0 0-.5-7 5 5 0 0 0-9 1.5A3.8 3.8 0 0 0 8 12"
              />
              <path d="M12.5 13l-2 3.5h2.5l-1.5 3.5" />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'sleet'"
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
                d="M17 13a3.5 3.5 0 0 0-.5-7 5 5 0 0 0-9 1.5A3.8 3.8 0 0 0 8 13"
              />
              <path d="M9 16.5l-1 2m4-2.5l-1 2m4-2l-1 2" />
              <path
                d="M17.5 17.5l1.5-1.5m0 3l-1.5-1.5m0 0L15.5 18m1.5 1.5V21"
              />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'hail'"
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
                d="M17 13a3.5 3.5 0 0 0-.5-7 5 5 0 0 0-9 1.5A3.8 3.8 0 0 0 8 13"
              />
              <path d="M9 16.5v.5m3 1v.5m3-2.5v.5" />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'sunset'"
              class="diary-mood"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M8 17a4 4 0 0 1 8 0" />
              <path
                d="M4 17h2m12 0h2M12 9V7m-5.5 3.5l1.4 1.4m8.6-1.4l-1.4 1.4M3 21h18"
              />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'meteor'"
              class="diary-mood"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M8 13l1 2.4 2.5 1-2.4 1-1 2.6-1-2.6-2.5-1 2.5-1z" />
              <path d="M12 12l7-7m-4 12l5-5" />
            </svg>
            <svg
              v-else-if="moodIcon(it.mood) === 'aurora'"
              class="diary-mood"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 10c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
              <path d="M3 15.5c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
            </svg>
          </header>
          <p
            :id="`diary-content-${it.id}`"
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
            :aria-expanded="expanded.has(it.id)"
            :aria-controls="`diary-content-${it.id}`"
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
