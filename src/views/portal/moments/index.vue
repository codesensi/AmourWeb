<script setup lang="ts">
import DOMPurify from "dompurify";
import { RouterLink } from "vue-router";
import { ref, watch } from "vue";
import { getMoments, type MomentsItem } from "@/api/portal/moments";
import { queryKeys } from "@/hooks/query-keys";
import { usePortalList } from "@/hooks/usePortalQuery";
import { resolveUserDisplay } from "@/utils/user-display";
import PortalLoadMore from "@/components/PortalLoadMore/index.vue";
import reveal from "@/directives/reveal";

defineOptions({ name: "PortalMoments" });

const vReveal = reveal;

/** 门户「加载更多」分页加载(每页 6 条);首拉与 KeepAlive 激活校验由查询层接管 */
const { items, loading, hasMore, loadMore } = usePortalList<MomentsItem>(
  queryKeys.moments(),
  getMoments
);

/** 作者展示列(头像/昵称,QQ 昵称 → 昵称 → 用户名;头像恒非空) */
interface WriterColumn {
  id: string;
  name: string;
  avatar: string;
}

const writers = ref<Record<string, WriterColumn>>({});

/** 数据到达后解析作者展示信息(头像/昵称),内部静默降级 */
watch(
  () => items.value,
  async list => {
    if (!list?.length) return;
    for (const it of list) {
      if (writers.value[it.id]) continue;
      writers.value[it.id] = {
        id: it.id,
        ...(await resolveUserDisplay({
          nickname: it.nickname,
          username: it.username,
          avatar: it.avatar,
          qq: it.qq
        }))
      };
    }
  },
  { immediate: true, deep: true }
);

/** 标签拆分:逗号分隔 → 去空数组 */
function tagsOf(item: MomentsItem): string[] {
  return (item.tags ?? "")
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean);
}

/** 富文本摘要:净化后去标签取纯文本并统一截断,引导进入详情页阅读全文 */
function excerptOf(item: MomentsItem, max = 96): string {
  const text = DOMPurify.sanitize(item.content ?? "", { ALLOWED_TAGS: [] })
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max)}...` : text;
}
</script>

<template>
  <div class="am-page">
    <!-- 章节题头 -->
    <header class="am-section-head">
      <p class="am-section-kicker">Little Moments · 甜甜的日常</p>
      <h1 class="am-section-title">点点滴滴</h1>
      <p class="column-intro">有人愿意听你碎碎念念,也很浪漫。</p>
    </header>

    <!-- 文章流:左正文右署名的非对称版式 -->
    <article
      v-for="(it, i) in items"
      :key="it.id"
      v-reveal="(i % 3 || 0) * 0.06"
      class="moment reveal"
    >
      <div class="moment-body">
        <div class="moment-title-row">
          <span class="moment-index" aria-hidden="true">
            {{ String(i + 1).padStart(2, "0") }}
          </span>
          <h2 class="moment-title">
            <RouterLink :to="`/moments/${it.id}`" class="moment-link">
              {{ it.title }}
            </RouterLink>
          </h2>
        </div>
        <p v-if="it.category || tagsOf(it).length" class="moment-pills">
          <span v-if="it.category" class="moment-pill moment-pill--category">
            {{ it.category }}
          </span>
          <span v-for="tag in tagsOf(it)" :key="tag" class="moment-pill">
            #{{ tag }}
          </span>
        </p>
        <p class="moment-excerpt">{{ excerptOf(it) }}</p>
        <RouterLink :to="`/moments/${it.id}`" class="moment-more">
          阅读全文
          <svg
            class="moment-more-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14m0 0l-6-6m6 6l-6 6" />
          </svg>
        </RouterLink>
      </div>
      <div class="moment-aside">
        <img
          class="moment-avatar"
          :src="writers[it.id]?.avatar"
          :alt="writers[it.id]?.name"
        />
        <span class="moment-author">{{ writers[it.id]?.name }}</span>
        <time class="moment-date">{{ it.recordDate }}</time>
      </div>
    </article>

    <!-- 首屏加载:杂志线框骨架屏 -->
    <el-skeleton v-if="loading && items.length === 0" :rows="3" animated />

    <div v-if="!loading && items.length === 0" class="am-empty">
      暂无记录,第一篇正在路上…
    </div>

    <!-- 「加载更多」按钮(门户列表页共用组件) -->
    <PortalLoadMore :loading="loading" :has-more="hasMore" @load="loadMore" />
  </div>
</template>

<style scoped>
.column-intro {
  margin-top: 6px;
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

/* 文章条目:左正文右署名(移动端上下堆叠);
 * content-visibility 跳过视口外条目的渲染,成本与列表长度解耦 */
.moment {
  display: flex;
  gap: var(--am-space-lg);
  align-items: flex-end;
  justify-content: space-between;
  contain-intrinsic-size: auto 160px;
  padding: var(--am-space-lg) 0;
  content-visibility: auto;
  border-bottom: 1px solid var(--am-line);
}

.moment-body {
  flex: 1;
  min-width: 0;
}

/* 标题行:前导序号与标题同行,基线对齐 */
.moment-title-row {
  display: flex;
  gap: 12px;
  align-items: baseline;
}

/* 标题:衬线大字,悬停玫瑰色 + 下划线浮现 */
.moment-title {
  margin: 0;
  font-family: var(--am-font-display);
  font-size: clamp(1.4rem, 3.4vw, var(--am-text-lg));
  font-weight: 700;
  line-height: 1.35;
}

.moment-link {
  color: var(--am-ink);
  text-decoration: underline transparent;
  text-decoration-thickness: 2px;
  text-underline-offset: 6px;
  transition:
    color var(--am-duration) ease,
    text-decoration-color var(--am-duration) ease;
}

.moment-link:hover {
  color: var(--am-rose);
  text-decoration-color: currentcolor;
}

/* 摘要:纯文本两行截断 */
.moment-excerpt {
  display: -webkit-box;
  margin: 8px 0 0;
  overflow: hidden;
  -webkit-line-clamp: 2;
  font-size: var(--am-text-sm);
  line-height: 1.8;
  color: var(--am-ink-secondary);
  -webkit-box-orient: vertical;
}

/* 阅读全文:等宽小字 + 箭头悬停右移 */
.moment-more {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  margin-top: 12px;
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-rose);
  letter-spacing: 0.12em;
}

.moment-more-arrow {
  width: 14px;
  height: 14px;
  transition: transform var(--am-duration) var(--am-ease);
}

.moment-more:hover .moment-more-arrow {
  transform: translateX(4px);
}

/* 右侧署名栏:头像 + 作者 + 日期纵排(序号已移至标题行) */
.moment-aside {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.moment-avatar {
  width: 40px;
  height: 40px;
  margin-bottom: 2px;
  object-fit: cover;
  border: 1px solid var(--am-line);
  border-radius: 50%;
}

/* 标题行前导序号:等宽玫瑰小字 */
.moment-index {
  flex-shrink: 0;
  font-family: var(--am-font-mono);
  font-size: var(--am-text-sm);
  color: var(--am-rose);
  letter-spacing: 0.08em;
}

.moment-author {
  font-size: var(--am-text-sm);
  color: var(--am-ink);
}

.moment-date {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
}

/* 分类/标签 pill:分类玫瑰实底、标签虚线框 + # 前缀,双通道区分不依赖颜色 */
.moment-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0 0;
}

.moment-pill {
  padding: 2px 10px;
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
  border: 1px dashed var(--am-line);
  border-radius: 999px;
}

.moment-pill--category {
  color: var(--am-rose);
  background: color-mix(in srgb, var(--am-rose) 12%, transparent);
  border-color: transparent;
}

@media (width <= 640px) {
  .moment {
    flex-direction: column;
    gap: var(--am-space-xs);
    align-items: flex-start;
  }

  .moment-aside {
    flex-direction: row;
    gap: 12px;
    align-items: baseline;
  }
}
</style>
