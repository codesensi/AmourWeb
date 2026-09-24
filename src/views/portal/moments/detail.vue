<script setup lang="ts">
import DOMPurify from "dompurify";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { getMoment, type MomentsItem } from "@/api/portal/moments";
import reveal from "@/directives/reveal";
import { queryKeys } from "@/hooks/query-keys";
import { usePortalQuery } from "@/hooks/usePortalQuery";
import { resolveUserDisplay } from "@/utils/user-display";

defineOptions({ name: "PortalMomentDetail" });

const vReveal = reveal;

const route = useRoute();
const router = useRouter();

/** 标签拆分:逗号分隔 → 去空数组 */
function tagsOf(item: MomentsItem): string[] {
  return (item.tags ?? "")
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean);
}

/** 文章详情(接口不可用/未命中时展示空态);
 * key 携带路由参数,文章间跳转/深链直达时自动重新拉取;
 * id 为雪花号字符串,全程透传禁止 Number 化(JS Number 精度丢失防护) */
const { data: article, isLoading: loading } = usePortalQuery(
  () => queryKeys.moment(String(route.params.id)),
  () => getMoment(String(route.params.id))
);

/** 作者展示信息(QQ 昵称 → 昵称 → 用户名;头像恒非空) */
const authorName = ref("");
const authorAvatar = ref("");

watch(
  () => article.value,
  async value => {
    if (!article.value) return;
    const display = await resolveUserDisplay({
      nickname: article.value.nickname,
      username: article.value.username,
      avatar: article.value.avatar,
      qq: article.value.qq
    });
    authorName.value = display.name;
    authorAvatar.value = display.avatar;
  },
  { immediate: true, deep: true }
);

/** 阅读时长:剥除标签后的正文字数 ÷ 每分钟 400 字,至少 1 分钟 */
const readingMinutes = computed(() => {
  const text = (article.value?.content ?? "").replace(/<[^>]+>/g, "");
  return Math.max(1, Math.round(text.length / 400));
});

/** 阅读进度:滚动位置占页面可滚动高度的比例(0-1) */
const progress = ref(0);

function updateProgress() {
  const root = document.documentElement;
  const total = root.scrollHeight - root.clientHeight;
  progress.value = total > 0 ? Math.min(root.scrollTop / total, 1) : 0;
}

onMounted(() => {
  window.addEventListener("scroll", updateProgress, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateProgress);
  revealObserver?.disconnect();
});

/** 富文本正文渲染前净化:白名单保留排版标签,脚本/事件属性全数剥离 */
function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "s",
      "u",
      "code",
      "pre",
      "blockquote",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "hr",
      "figure",
      "figcaption",
      "img",
      "a"
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "class"]
  });
}

/** 正文引用元素(级联渐显的观察容器) */
const contentRef = ref<HTMLElement | null>(null);
let revealObserver: IntersectionObserver | null = null;

/** 正文直接子元素级联渐显:进入视口逐个显现,与全局 reveal 过渡共用样式 */
function observeContentChildren() {
  if (!contentRef.value) return;
  const children = contentRef.value.querySelectorAll(":scope > *");
  if (typeof IntersectionObserver === "undefined") {
    children.forEach(child => child.classList.add("is-visible"));
    return;
  }
  revealObserver?.disconnect();
  revealObserver = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver?.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
  );
  children.forEach((child, index) => {
    (child as HTMLElement).style.setProperty(
      "--reveal-delay",
      `${Math.min(index * 0.05, 0.5)}s`
    );
    child.classList.add("reveal");
    revealObserver?.observe(child);
  });
}

// 文章渲染后观察正文子元素(接口不可用/文章间跳转时同步重建)
watch(
  () => article.value,
  () => {
    nextTick(observeContentChildren);
  }
);

/** 返回列表:始终 push,深链直达时也能回到点点滴滴 */
function goBack() {
  router.push("/moments");
}
</script>

<template>
  <div class="am-page">
    <!-- 阅读进度:页顶玫瑰细条随滚动填充 -->
    <div class="moment-progress" aria-hidden="true">
      <div
        class="moment-progress-bar"
        :style="{ transform: `scaleX(${progress})` }"
      />
    </div>

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
        <img class="moment-avatar" :src="authorAvatar" :alt="authorName" />
        <span class="moment-author">{{ authorName }}</span>
        <span class="moment-dot" aria-hidden="true">·</span>
        <time class="moment-date">{{ article.recordDate }}</time>
        <span class="moment-dot" aria-hidden="true">·</span>
        <span class="moment-read-time">约 {{ readingMinutes }} 分钟</span>
      </div>

      <!-- 元信息行:分类(玫瑰实底+图标)/标签(虚线+#前缀) + 行尾最后更新时间 -->
      <div
        v-if="article.category || tagsOf(article).length || article.updateTime"
        class="moment-pills"
      >
        <span v-if="article.category" class="moment-pill moment-pill--category">
          {{ article.category }}
        </span>
        <span v-for="tag in tagsOf(article)" :key="tag" class="moment-pill">
          #{{ tag }}
        </span>
        <span v-if="article.updateTime" class="moment-updated">
          最后更新于 {{ article.updateTime }}
        </span>
      </div>

      <!-- 富文本正文:渲染前经 DOMPurify 净化(白名单保留排版标签);ref 供级联渐显观察 -->
      <div
        ref="contentRef"
        class="moment-content"
        v-html="sanitize(article.content ?? '')"
      />
    </article>

    <div v-else class="am-empty">这篇文章走丢了…</div>
  </div>
</template>

<style scoped>
/* 阅读进度:页顶玫瑰细条,scaleX 由滚动进度驱动 */
.moment-progress {
  position: fixed;
  inset: 0 0 auto;
  z-index: 10;
  height: 2px;
  pointer-events: none;
}

.moment-progress-bar {
  height: 100%;
  background: var(--am-rose);
  transform: scaleX(0);
  transform-origin: left;
}

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
  align-items: center;
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
}

.moment-avatar {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border: 1px solid var(--am-line);
  border-radius: 50%;
}

.moment-author {
  color: var(--am-rose);
}

/* 元信息行:分类/标签 pill + 行尾最后更新时间,下边线与正文分区 */
.moment-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding-bottom: var(--am-space-lg);
  margin-top: var(--am-space-md);
  font-family: var(--am-font-mono);
  border-bottom: 1px solid var(--am-line);
}

.moment-pill {
  padding: 2px 10px;
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
  border: 1px dashed var(--am-line);
  border-radius: 999px;
}

/* 分类:玫瑰实底纯文字(与虚线 # 标签区分) */
.moment-pill--category {
  color: var(--am-rose);
  background: color-mix(in srgb, var(--am-rose) 12%, transparent);
  border-color: transparent;
}

.moment-updated {
  margin-left: auto;
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
  letter-spacing: 0.04em;
}

/* 阅读时长:与作者/日期同行,等宽小字 */
.moment-read-time {
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
}

/* 富文本正文:阅读宽度收敛 65-75 字符行长,p/强调/引用/列表/配图统一韵律 */
.moment-content {
  max-width: 42rem;
  padding-top: var(--am-space-lg);
  margin-inline: auto;
  font-size: var(--am-text-base);
  line-height: 1.9;
  color: var(--am-ink);
  overflow-wrap: break-word;

  /* h2 章节编号计数器 */
  counter-reset: chapter;
}

/* 首字下沉:杂志开篇仪式感,仅首个段落生效 */
.moment-content :deep(p:first-of-type)::first-letter {
  float: left;
  margin: 6px 10px 0 0;
  font-family: var(--am-font-display);
  font-size: 3.2em;
  font-style: italic;
  line-height: 0.85;
  color: var(--am-rose);
}

.moment-content :deep(h2) {
  display: flex;
  gap: 12px;
  align-items: baseline;
  margin: 2.2em 0 0.9em;
  font-family: var(--am-font-display);
  font-size: 1.35em;
  line-height: 1.4;
  color: var(--am-ink);
}

.moment-content :deep(h2)::before {
  font-family: var(--am-font-mono);
  font-size: 0.55em;
  color: var(--am-rose);
  letter-spacing: 0.1em;
  content: counter(chapter, decimal-leading-zero);
  counter-increment: chapter;
}

/* h3:玫瑰短竖前缀 */
.moment-content :deep(h3) {
  margin: 1.8em 0 0.8em;
  font-size: 1.15em;
  color: var(--am-ink);
}

.moment-content :deep(h3)::before {
  display: inline-block;
  width: 4px;
  height: 1em;
  margin-right: 10px;
  vertical-align: -0.1em;
  content: "";
  background: var(--am-rose);
  border-radius: 2px;
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

/* 引用:装饰引号 + 衬线斜体,取代理线左框 */
.moment-content :deep(blockquote) {
  position: relative;
  padding: 6px 0 6px 28px;
  margin: 16px 0;
  font-family: var(--am-font-display);
  font-size: 1.1em;
  font-style: italic;
  color: var(--am-ink);
}

.moment-content :deep(blockquote)::before {
  position: absolute;
  left: 0;
  font-size: 2em;
  font-style: normal;
  color: color-mix(in srgb, var(--am-rose) 35%, transparent);
  content: "「";
}

.moment-content :deep(blockquote p) {
  margin: 0;
}

.moment-content :deep(ul),
.moment-content :deep(ol) {
  padding-inline-start: 1.4em;
  margin: 10px 0;
}

/* 有序序列表:前导零玫瑰序号,替代默认圆点 */
.moment-content :deep(ol) {
  list-style: none;
  counter-reset: item;
}

.moment-content :deep(ol li) {
  position: relative;
  counter-increment: item;
}

.moment-content :deep(ol li)::before {
  position: absolute;
  left: -2.2em;
  font-family: var(--am-font-mono);
  font-size: 0.85em;
  color: var(--am-rose);
  content: counter(item, decimal-leading-zero);
}

.moment-content :deep(ul li)::marker {
  color: var(--am-rose);
}

/* 行内代码:玫瑰虚线胶囊,延续标签视觉语言 */
.moment-content :deep(code) {
  padding: 2px 8px;
  font-family: var(--am-font-mono);
  font-size: 0.9em;
  color: var(--am-rose);
  background: color-mix(in srgb, var(--am-rose) 8%, transparent);
  border: 1px dashed color-mix(in srgb, var(--am-rose) 40%, transparent);
  border-radius: 6px;
}

/* 代码块:整段玫瑰浅底 */
.moment-content :deep(pre) {
  padding: 14px 18px;
  margin: 14px 0;
  overflow-x: auto;
  background: color-mix(in srgb, var(--am-rose) 5%, transparent);
  border: 1px solid var(--am-line);
  border-radius: var(--am-radius);
}

.moment-content :deep(pre code) {
  padding: 0;
  color: inherit;
  background: none;
  border: none;
}

/* 分隔线:居中玫瑰点串,符号化过渡 */
.moment-content :deep(hr) {
  height: auto;
  margin: 2.4em 0;
  border: none;
}

.moment-content :deep(hr)::after {
  display: block;
  font-family: var(--am-font-mono);
  color: var(--am-rose);
  text-align: center;
  letter-spacing: 0.6em;
  content: "· · ·";
}

.moment-content :deep(li + li) {
  margin-top: 6px;
}

.moment-content :deep(.moment-figure) {
  margin: 20px 0;
}

/* 桌面端宽图出血:突破正文列,杂志图版质感 */
@media (width >= 1024px) {
  .moment-content :deep(figure) {
    margin-inline: -48px;
  }
}

.moment-content :deep(.moment-figure img),
.moment-content :deep(figure img) {
  display: block;
  width: 100%;
  border: 1px solid var(--am-line);
  border-radius: var(--am-radius);
  transition:
    box-shadow 200ms var(--am-ease),
    transform 200ms var(--am-ease);
}

.moment-content :deep(.moment-figure img:hover),
.moment-content :deep(figure img:hover) {
  box-shadow: 0 12px 32px rgb(0 0 0 / 10%);
  transform: scale(1.02);
}

.moment-content :deep(figcaption) {
  margin-top: 8px;
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
}
</style>
