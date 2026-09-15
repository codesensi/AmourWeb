<script setup lang="ts">
import { onMounted } from "vue";
import { getMoments, type MomentsItem } from "@/api/portal";
import { usePagedList } from "@/hooks/usePagedList";
import PortalLoadMore from "@/components/PortalLoadMore/index.vue";
import PortalSkeleton from "@/components/PortalSkeleton/index.vue";
import reveal from "@/directives/reveal";

defineOptions({ name: "PortalMoments" });

const vReveal = reveal;

/** 门户「加载更多」分页加载(每页 6 条) */
const { items, loading, hasMore, loadMore } =
  usePagedList<MomentsItem>(getMoments);

onMounted(() => loadMore());
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
        <h2 class="moment-title">{{ it.title }}</h2>
        <!-- 数据模型无详情页:标题即正文入口(纯文本渲染) -->
        <span
          v-for="dot in 3"
          :key="dot"
          class="moment-rule"
          aria-hidden="true"
        />
      </div>
      <div class="moment-aside">
        <span class="moment-index">{{ String(i + 1).padStart(2, "0") }}</span>
        <span class="moment-author">{{ it.author }}</span>
        <time class="moment-date">{{ it.date }}</time>
      </div>
    </article>

    <!-- 首屏加载:杂志线框骨架屏 -->
    <PortalSkeleton v-if="loading && items.length === 0" :rows="3" />

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
  contain-intrinsic-size: auto 120px;
  padding: var(--am-space-lg) 0;
  content-visibility: auto;
  border-bottom: 1px solid var(--am-line);
}

.moment-body {
  flex: 1;
  min-width: 0;
}

/* 标题即内容:衬线大字 + 悬停玫瑰下划线 */
.moment-title {
  margin: 0;
  font-family: var(--am-font-display);
  font-size: clamp(1.4rem, 3.4vw, var(--am-text-lg));
  font-weight: 700;
  line-height: 1.35;
  color: var(--am-ink);
  text-decoration: underline transparent;
  text-decoration-thickness: 2px;
  text-underline-offset: 6px;
  transition: color var(--am-duration) ease;
}

.moment:hover .moment-title {
  color: var(--am-rose);
}

/* 装饰细线:呼应印刷排版的段落节奏 */
.moment-rule {
  display: block;
  width: 32px;
  height: 1px;
  margin-top: 10px;
  background: var(--am-line);
}

/* 右侧署名栏:序号 + 作者 + 日期纵排 */
.moment-aside {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.moment-index {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-sm);
  color: var(--am-rose);
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
