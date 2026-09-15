<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import {
  getAnniversaryList,
  getHeroes,
  getMoments,
  type MomentsItem
} from "@/api/portal";
import { resolveUserDisplay } from "@/utils/userDisplay";
import { parseDateTime } from "@/utils/date";
import { nextOccurrenceDays } from "@/utils/anniversary";
import { usePortalSysConfig } from "@/layout/portal/usePortalSysConfig";
import reveal from "@/directives/reveal";

defineOptions({ name: "PortalHome" });

const vReveal = reveal;

/** 站点公共配置:封面计时起点由 sys_config 下发 */
const sysConfig = usePortalSysConfig();

/* ---------------- 封面:主角名 ---------------- */

/** 主角昵称(取展示链路结果;接口不可用时回退站点名) */
const heroNames = ref<{ female: string; male: string }>({
  female: "",
  male: ""
});

/** 封面主标题:两人名以「&」相连,均未维护时回退站点名 */
const coverTitle = computed(() => {
  const names = [heroNames.value.female, heroNames.value.male].filter(Boolean);
  return names.length ? names.join(" & ") : sysConfig.value.name || "AMOUR";
});

/** 目录锚点滚动:页内平滑滚动,不改动 URL hash(hash 路由下锚点会被当作路由路径);
 * 声明减少动态偏好时降级为瞬时定位 */
function scrollToToc() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document
    .getElementById("toc")
    ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
}

onMounted(async () => {
  try {
    const { success, data } = await getHeroes();
    if (!success || !data) return;
    const [female, male] = await Promise.all([
      resolveUserDisplay(data.female),
      resolveUserDisplay(data.male)
    ]);
    // 仅取昵称文本用于封面排版,头像细节不在封面重复展示
    heroNames.value = { female: female.name, male: male.name };
  } catch {
    // 后端不可用:回退站点名
  }
});

/* ---------------- 封面:恋爱计时器(每秒刷新) ---------------- */

const now = ref(Date.now());
const clock = window.setInterval(() => {
  now.value = Date.now();
}, 1000);
onBeforeUnmount(() => window.clearInterval(clock));

/** 恋爱计时:起点来自 sys_config,配置未就绪或非法时跳过渲染 */
const loveTime = computed(() => {
  const loveStart = parseDateTime(sysConfig.value.siteLoveStartDate);
  if (!loveStart) return null;
  const timeold = Math.max(0, now.value - loveStart.getTime());
  const msPerDay = 24 * 60 * 60 * 1000;
  const eDaysold = timeold / msPerDay;
  const days = Math.floor(eDaysold);
  const hrsold = Math.floor((eDaysold - days) * 24);
  const minsold = Math.floor(((eDaysold - days) * 24 - hrsold) * 60);
  const seconds = Math.floor(
    ((eDaysold - days) * 24 - hrsold) * 60 * 60 - minsold * 60
  );
  return { days, hours: hrsold, minutes: minsold, seconds };
});

/* ---------------- 目录 ---------------- */

/** 目录条目:编号与全站导航一致(01 为封面自身,从 02 起) */
const tocItems = [
  {
    no: "02",
    title: "点点滴滴",
    desc: "碎碎念,也要认真记录",
    path: "/moments"
  },
  { no: "03", title: "恋爱画册", desc: "记录最美瞬间", path: "/love-photo" },
  { no: "04", title: "恋爱清单", desc: "你与我之间的约定", path: "/love-list" },
  { no: "05", title: "留言簿", desc: "写下我们的祝福", path: "/message" },
  {
    no: "06",
    title: "纪念日",
    desc: "距离下一次心动还有几天",
    path: "/anniversary"
  },
  {
    no: "07",
    title: "时间胶囊",
    desc: "给未来的一封信",
    path: "/time-capsule"
  },
  { no: "08", title: "情侣日记", desc: "同一天的两个视角", path: "/diary" },
  { no: "09", title: "足迹", desc: "我们一起去过的城市", path: "/footprint" }
];

/* ---------------- 卷首语:最新一篇点滴 ---------------- */

/** 卷首语文章(取最新一条;接口不可用/无数据时不渲染) */
const featured = ref<MomentsItem | null>(null);

onMounted(async () => {
  try {
    const { success, data } = await getMoments({ pageNumber: 1, pageSize: 1 });
    if (success && data?.records.length) featured.value = data.records[0];
  } catch {
    // 静默降级
  }
});

/* ---------------- 纪念日预告:最近的一个 ---------------- */

/** 最近纪念日(名称 + 倒计时天数 + 日期文案) */
const nextAnniversary = ref<{
  name: string;
  date: string;
  days: number;
} | null>(null);

onMounted(async () => {
  try {
    const { success, data } = await getAnniversaryList();
    if (!success || !data?.length) return;
    let best: { name: string; date: string; days: number } | null = null;
    for (const item of data) {
      const days = nextOccurrenceDays(item, new Date(now.value));
      if (days === null) continue;
      if (!best || days < best.days) {
        best = { name: item.name, date: item.anniversaryDate, days };
      }
    }
    nextAnniversary.value = best;
  } catch {
    // 静默降级
  }
});
</script>

<template>
  <div>
    <!-- 封面:全幅晨光插画 + 超大衬线标题 + 恋爱计时器 -->
    <section class="cover">
      <div class="cover-inner">
        <p class="cover-kicker">WELCOME TO OUR LITTLE WORLD · 我们的小世界</p>
        <h1 class="cover-title">{{ coverTitle }}</h1>
        <div v-if="loveTime" class="cover-timer" aria-label="恋爱计时">
          <div class="timer-cell">
            <b class="timer-num">
              <Transition name="timer-roll" mode="out-in">
                <span :key="loveTime.days">{{ loveTime.days }}</span>
              </Transition>
            </b>
            <span class="timer-label">天</span>
          </div>
          <div class="timer-cell">
            <b class="timer-num">
              <Transition name="timer-roll" mode="out-in">
                <span :key="loveTime.hours">{{ loveTime.hours }}</span>
              </Transition>
            </b>
            <span class="timer-label">时</span>
          </div>
          <div class="timer-cell">
            <b class="timer-num">
              <Transition name="timer-roll" mode="out-in">
                <span :key="loveTime.minutes">{{ loveTime.minutes }}</span>
              </Transition>
            </b>
            <span class="timer-label">分</span>
          </div>
          <div class="timer-cell">
            <b class="timer-num">
              <Transition name="timer-roll" mode="out-in">
                <span :key="loveTime.seconds">{{ loveTime.seconds }}</span>
              </Transition>
            </b>
            <span class="timer-label">秒</span>
          </div>
        </div>
        <p v-if="loveTime" class="cover-note">我们已经相爱了这么久</p>
      </div>
      <!-- 向下滚动提示:hash 路由下不能用 href="#toc" 锚点(会被当成 /toc 路由),
           改为脚本平滑滚动;箭头用线描 SVG 与全站图标风格一致 -->
      <button
        class="cover-scroll"
        type="button"
        aria-label="向下滚动查看目录"
        @click="scrollToToc"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14m0 0l-6-6m6 6l6-6" />
        </svg>
      </button>
    </section>

    <!-- 目录:杂志目录条目式 -->
    <section id="toc" class="toc">
      <div class="am-page">
        <header class="am-section-head">
          <p class="am-section-kicker">Our Story</p>
          <h2 class="am-section-title">我们的故事</h2>
        </header>
        <nav class="toc-list">
          <RouterLink
            v-for="(item, i) in tocItems"
            :key="item.path"
            v-reveal="i * 0.05"
            class="toc-item reveal"
            :to="item.path"
          >
            <span class="toc-no">{{ item.no }}</span>
            <span class="toc-main">
              <span class="toc-title">{{ item.title }}</span>
              <span class="toc-desc">{{ item.desc }}</span>
            </span>
            <span class="toc-arrow" aria-hidden="true">→</span>
          </RouterLink>
        </nav>
      </div>
    </section>

    <!-- 卷首语:最新一篇点滴 -->
    <section v-if="featured" class="editorial">
      <div class="am-page">
        <div v-reveal class="editorial-card reveal">
          <p class="am-section-kicker">Love Letter · 写给彼此</p>
          <RouterLink class="editorial-title" to="/moments">
            {{ featured.title }}
          </RouterLink>
          <p class="editorial-meta">
            {{ featured.author }} · 记录于 {{ featured.date }}
          </p>
          <RouterLink class="editorial-more" to="/moments">
            阅读全部点滴 →
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- 纪念日预告:最近的一个 -->
    <section v-if="nextAnniversary" class="teaser">
      <div class="am-page">
        <div v-reveal class="teaser-card reveal">
          <div>
            <p class="am-section-kicker">Countdown · 爱的倒计时</p>
            <RouterLink class="teaser-name" to="/anniversary">
              {{ nextAnniversary.name }}
            </RouterLink>
            <p class="teaser-date">{{ nextAnniversary.date }}</p>
          </div>
          <div class="teaser-count">
            <b class="teaser-days">{{ nextAnniversary.days }}</b>
            <span class="teaser-unit">天后</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ---------------- 封面 ---------------- */
.cover {
  position: relative;
  display: grid;
  place-items: center;

  /* 100dvh 修正移动端地址栏收展导致的视口跳动,旧浏览器回退 100vh */
  min-height: calc(100vh - 64px);
  min-height: calc(100dvh - 64px);
  padding: var(--am-space-lg) var(--am-space-md) 96px;
  background: var(--am-cover-img) center / cover no-repeat;
}

/* 提亮薄纱:浅色模式奶油纱保淡雅,深色模式自动换暗纱保文字对比 */
.cover::before {
  position: absolute;
  inset: 0;
  content: "";
  background: var(--am-cover-veil);
}

.cover-inner {
  position: relative;
  z-index: 1;
  color: var(--am-ink);
  text-align: center;
}

/* 封面入场编排:kicker → 标题 → 计时器 → 注脚 依次上浮浮现;
 * 只动 transform/opacity(合成器线程),reduced-motion 下整体跳过 */
.cover-kicker {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-rose);
  letter-spacing: 0.3em;
  animation: hero-in 0.7s var(--am-ease) 0.05s backwards;
}

.cover-title {
  margin: 18px 0 40px;
  font-family: var(--am-font-display);
  font-size: clamp(3rem, 9vw, var(--am-text-giant));
  font-style: italic;
  font-weight: 700;
  line-height: 1.12;
  text-wrap: balance;
  animation: hero-in 0.7s var(--am-ease) 0.15s backwards;
}

/* 恋爱计时器:等宽翻牌数字(窄屏 2×2 折行) */
.cover-timer {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  justify-content: center;
  animation: hero-in 0.7s var(--am-ease) 0.3s backwards;
}

.timer-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timer-num {
  font-family: var(--am-font-mono);
  font-size: clamp(1.6rem, 4vw, var(--am-text-xl));
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.timer-label {
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
  letter-spacing: 0.2em;
}

.cover-note {
  margin-top: 14px;
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
  animation: hero-in 0.7s var(--am-ease) 0.45s backwards;
}

@keyframes hero-in {
  from {
    opacity: 0;
    transform: translateY(22px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

/* 计时器翻牌:数值变化时旧值上移淡出、新值自下浮入(等宽字体不跳宽) */
.timer-roll-enter-active,
.timer-roll-leave-active {
  transition:
    opacity var(--am-duration-fast) ease,
    transform var(--am-duration-fast) ease;
}

.timer-roll-enter-from {
  opacity: 0;
  transform: translateY(0.35em);
}

.timer-roll-leave-to {
  opacity: 0;
  transform: translateY(-0.35em);
}

@media (prefers-reduced-motion: reduce) {
  .cover-kicker,
  .cover-title,
  .cover-timer,
  .cover-note {
    animation: none;
  }

  .timer-roll-enter-active,
  .timer-roll-leave-active {
    transition: none;
  }
}

/* 向下滚动提示:44px 触控目标的圆形按钮 */
.cover-scroll {
  position: absolute;
  bottom: 24px;
  left: 50%;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: var(--am-ink-secondary);
  cursor: pointer;
  background: none;
  border: 0;
  transform: translateX(-50%);
  animation: cover-scroll 1.8s ease-in-out infinite;
}

.cover-scroll svg {
  width: 22px;
  height: 22px;
}

.cover-scroll:hover {
  color: var(--am-ink);
}

.cover-scroll:focus-visible {
  outline: 2px solid var(--am-rose);
  outline-offset: 2px;
}

@keyframes cover-scroll {
  0%,
  100% {
    opacity: 0.4;
    transform: translate(-50%, 0);
  }

  50% {
    opacity: 1;
    transform: translate(-50%, 8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cover-scroll {
    opacity: 0.8;
    animation: none;
  }
}

/* ---------------- 目录 ---------------- */
.toc {
  padding-top: var(--am-space-lg);
}

.toc-list {
  display: flex;
  flex-direction: column;
}

/* 目录条目:编号 + 标题 + 描述 + 箭头,hover 编号变玫瑰、标题右移 */
.toc-item {
  display: flex;
  gap: var(--am-space-md);
  align-items: baseline;
  padding: 20px 0;
  color: var(--am-ink);
  text-decoration: none;
  border-bottom: 1px solid var(--am-line);
}

.toc-no {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-sm);
  color: var(--am-ink-tertiary);
  transition: color var(--am-duration) ease;
}

.toc-main {
  display: flex;
  flex-basis: auto;
  flex-direction: column;
  gap: 2px;
  transition: transform var(--am-duration) var(--am-ease);
}

.toc-title {
  font-family: var(--am-font-display);
  font-size: clamp(1.4rem, 3vw, var(--am-text-lg));
  font-weight: 700;
}

.toc-desc {
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

.toc-arrow {
  margin-left: auto;
  font-size: var(--am-text-lg);
  color: var(--am-ink-tertiary);
  opacity: 0;
  transition:
    opacity var(--am-duration) ease,
    transform var(--am-duration) var(--am-ease);
}

.toc-item:hover .toc-no {
  color: var(--am-rose);
}

.toc-item:hover .toc-main {
  transform: translateX(6px);
}

.toc-item:hover .toc-arrow {
  color: var(--am-rose);
  opacity: 1;
  transform: translateX(4px);
}

/* ---------------- 卷首语 ---------------- */
.editorial {
  padding-top: var(--am-space-2xl, 64px);
}

.editorial-card {
  padding: var(--am-space-lg) 0;
  border-top: 3px solid var(--am-line-strong);
}

.editorial-title {
  display: inline-block;
  margin: 10px 0 6px;
  font-family: var(--am-font-display);
  font-size: clamp(1.8rem, 5vw, var(--am-text-huge));
  font-weight: 700;
  line-height: 1.2;
  color: var(--am-ink);
  text-decoration: none;
}

.editorial-title:hover {
  color: var(--am-rose);
}

.editorial-meta {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

.editorial-more {
  display: inline-block;
  margin-top: 14px;
  font-size: var(--am-text-sm);
  color: var(--am-rose);
  text-decoration: none;
}

.editorial-more:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

/* ---------------- 纪念日预告 ---------------- */
.teaser {
  padding: var(--am-space-lg) 0 var(--am-space-2xl, 64px);
}

.teaser-card {
  display: flex;
  gap: var(--am-space-md);
  align-items: center;
  justify-content: space-between;
  padding: var(--am-space-lg);
  background: var(--am-rose-soft);
  border-radius: var(--am-radius);
}

.teaser-name {
  display: inline-block;
  margin: 8px 0 4px;
  font-family: var(--am-font-display);
  font-size: var(--am-text-lg);
  font-weight: 700;
  color: var(--am-ink);
  text-decoration: none;
}

.teaser-name:hover {
  color: var(--am-rose);
}

.teaser-date {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

.teaser-count {
  display: flex;
  gap: 6px;
  align-items: baseline;
  text-align: right;
}

.teaser-days {
  font-family: var(--am-font-mono);
  font-size: clamp(2.4rem, 6vw, var(--am-text-huge));
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--am-rose);
}

.teaser-unit {
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

/* 375px 窄屏:计时器 2×2 折行,封面高度随地址栏动态视口收敛 */
@media (width <= 480px) {
  .cover-timer {
    gap: 20px 28px;
    max-width: 320px;
    margin: 0 auto;
  }

  .timer-cell {
    flex: 1 1 40%;
  }
}
</style>
