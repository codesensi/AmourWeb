<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { getMoment } from "@/api/portal";
import reveal from "@/directives/reveal";
import { queryKeys } from "@/hooks/queryKeys";
import { usePortalQuery } from "@/hooks/usePortalQuery";

defineOptions({ name: "PortalMomentDetail" });

const vReveal = reveal;

const route = useRoute();
const router = useRouter();

/** 文章详情(接口不可用/未命中时展示空态);
 * key 携带路由参数,文章间跳转/深链直达时自动重新拉取 */
const { data: article, isLoading: loading } = usePortalQuery(
  () => queryKeys.moment(Number(route.params.id)),
  () => getMoment(Number(route.params.id))
);

/** 返回列表:始终 push,深链直达时也能回到点点滴滴 */
function goBack() {
  router.push("/moments");
}
</script>

<template>
  <div class="am-page">
    <!-- 返回列表:线描箭头与全站图标风格一致 -->
    <button class="moment-back" type="button" @click="goBack">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5m0 0l6-6m-6 6l6 6" />
      </svg>
      返回点点滴滴
    </button>

    <!-- 首屏加载:杂志线框骨架屏 -->
    <el-skeleton v-if="loading" :rows="3" animated />

    <article v-else-if="article" v-reveal class="moment-article reveal">
      <p class="moment-kicker">Little Moments · 甜甜的日常</p>
      <h1 class="moment-title">{{ article.title }}</h1>
      <div class="moment-meta">
        <span class="moment-author">{{ article.author }}</span>
        <span class="moment-dot" aria-hidden="true">·</span>
        <time class="moment-date">{{ article.date }}</time>
      </div>

      <!-- 富文本正文:mock 为本地静态内容;接入后端后渲染前须净化(DOMPurify) -->
      <div class="moment-content" v-html="article.content" />
    </article>

    <div v-else class="am-empty">这篇文章走丢了…</div>
  </div>
</template>

<style scoped>
/* 返回链接:线描箭头 + 等宽小字,悬停玫瑰色 */
.moment-back {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 10px 0;
  margin-bottom: var(--am-space-lg);
  font-family: var(--am-font-mono);
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
  letter-spacing: 0.12em;
  cursor: pointer;
  background: none;
  border: none;
  transition: color var(--am-duration) ease;
}

.moment-back:hover {
  color: var(--am-rose);
}

.moment-back svg {
  width: 16px;
  height: 16px;
  transition: transform var(--am-duration) var(--am-ease);
}

.moment-back:hover svg {
  transform: translateX(-4px);
}

/* 文章版式:阅读宽度收敛(45-75 字符行长),居中单栏 */
.moment-article {
  max-width: 960px;
  padding-bottom: var(--am-space-lg);
  margin: 0 auto;
}

.moment-kicker {
  margin: 0;
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-rose);
  letter-spacing: 0.3em;
  animation: none;
}

.moment-title {
  margin: 10px 0 14px;
  font-family: var(--am-font-display);
  font-size: clamp(1.8rem, 5vw, var(--am-text-2xl));
  font-style: italic;
  font-weight: 700;
  line-height: 1.25;
  color: var(--am-ink);
  text-wrap: balance;
}

.moment-meta {
  display: flex;
  gap: 10px;
  align-items: baseline;
  padding-bottom: var(--am-space-lg);
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
  border-bottom: 1px solid var(--am-line);
}

.moment-author {
  color: var(--am-rose);
}

/* 富文本正文:紧凑排版,p/强调/引用/列表/配图统一韵律 */
.moment-content {
  padding-top: var(--am-space-lg);
  font-size: var(--am-text-base);
  line-height: 1.9;
  color: var(--am-ink);
  overflow-wrap: break-word;
}

.moment-content :deep(p) {
  margin: 0 0 1em;
}

.moment-content :deep(p:last-child) {
  margin-bottom: 0;
}

.moment-content :deep(strong) {
  font-weight: 600;
  color: var(--am-rose);
}

.moment-content :deep(em) {
  font-style: italic;
}

.moment-content :deep(blockquote) {
  padding: 4px 0 4px 18px;
  margin: 16px 0;
  font-family: var(--am-font-display);
  font-size: var(--am-text-lg);
  color: var(--am-ink);
  border-left: 2px solid var(--am-rose);
}

.moment-content :deep(blockquote p) {
  margin: 0;
}

.moment-content :deep(ul),
.moment-content :deep(ol) {
  padding-inline-start: 1.4em;
  margin: 10px 0;
}

.moment-content :deep(li + li) {
  margin-top: 6px;
}

.moment-content :deep(.moment-figure) {
  margin: 20px 0;
}

.moment-content :deep(.moment-figure img) {
  display: block;
  width: 100%;
  border: 1px solid var(--am-line);
  border-radius: var(--am-radius);
}

.moment-content :deep(figcaption) {
  margin-top: 8px;
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
}
</style>
