<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { getHeroes } from "@/api/portal/hero";
import { fallbackAvatar } from "@/utils/avatar";
import { resolveUserDisplay } from "@/utils/user-display";
import { prefersReducedMotion } from "@/utils/motion";
import { parseDateTime } from "@/utils/date";
import { usePortalSysConfig } from "@/layout/portal/usePortalSysConfig";
import PortalRollingNumber from "@/components/PortalRollingNumber/index.vue";
import { queryKeys } from "@/hooks/query-keys";
import { usePortalQuery } from "@/hooks/usePortalQuery";

defineOptions({ name: "HomeCover" });

/** 站点公共配置:封面计时起点由 sys_config 下发 */
const sysConfig = usePortalSysConfig();

/** 主角昵称(取展示链路结果;接口不可用时回退站点名) */
const heroNames = ref<{ female: string; male: string }>({
  female: "",
  male: ""
});

/** 主角头像(展示链路已含 QQ 头像解析与兜底降级,恒非空) */
const heroAvatars = ref<{ female: string; male: string }>({
  female: fallbackAvatar,
  male: fallbackAvatar
});

/** 封面主标题:两人名以「&」相连,均未维护时回退站点名 */
const coverTitle = computed(() => {
  const names = [heroNames.value.female, heroNames.value.male].filter(Boolean);
  return names.length ? names.join(" & ") : sysConfig.value.name || "AMOUR";
});

/** 目录锚点滚动:页内平滑滚动,不改动 URL hash(hash 路由下锚点会被当作路由路径);
 * 声明减少动态偏好时降级为瞬时定位 */
function scrollToToc() {
  const reduced = prefersReducedMotion();
  document
    .getElementById("toc")
    ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
}

/** 主角资料查询:数据到达后经展示链路解析昵称与头像(含兜底降级,恒非空) */
const { data: heroesData } = usePortalQuery(queryKeys.heroes(), getHeroes);

watch(
  heroesData,
  async heroes => {
    if (!heroes) return;
    const [female, male] = await Promise.all([
      resolveUserDisplay(heroes.female),
      resolveUserDisplay(heroes.male)
    ]);
    heroAvatars.value = { female: female.avatar, male: male.avatar };
    heroNames.value = { female: female.name, male: male.name };
  },
  { immediate: true }
);

/** 恋爱计时器(每秒刷新) */

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

/** 计时器单元格:时/分/秒个位自动补 0(滚轮数字组件处理) */
const timerCells = computed(() => {
  const t = loveTime.value;
  if (!t) return [];
  return [
    { label: "天", value: t.days },
    { label: "时", value: t.hours, max: 23 },
    { label: "分", value: t.minutes, max: 59 },
    { label: "秒", value: t.seconds, max: 59 }
  ];
});

/** 完整读法:滚轮数字对读屏是一串裸数字,由容器 aria-label 提供连贯读法 */
const loveTimeAria = computed(() => {
  const t = loveTime.value;
  if (!t) return "";
  return `已相爱 ${t.days} 天 ${t.hours} 小时 ${t.minutes} 分 ${t.seconds} 秒`;
});

/** 每颗光点的水平落位/尺寸/节奏;负延迟让首屏加载时即处于漂浮中段 */
const coverHearts = [
  { left: "10%", size: 16, duration: 9, delay: 0, opacity: 0.32 },
  { left: "26%", size: 12, duration: 12, delay: -4.2, opacity: 0.22 },
  { left: "48%", size: 14, duration: 10, delay: -7.5, opacity: 0.28 },
  { left: "66%", size: 18, duration: 12, delay: -2.6, opacity: 0.3 },
  { left: "86%", size: 13, duration: 13, delay: -5.8, opacity: 0.24 }
];
</script>

<template>
  <!-- 封面:全幅晨光插画 + 超大衬线标题 + 恋爱计时器 -->
  <section class="cover">
    <!-- 漂浮光点:错峰上浮的柔光小心形(纯装饰,不响应指针) -->
    <div class="cover-hearts" aria-hidden="true">
      <svg
        v-for="(heart, i) in coverHearts"
        :key="i"
        class="cover-heart"
        :style="{
          left: heart.left,
          width: `${heart.size}px`,
          height: `${heart.size}px`,
          animationDuration: `${heart.duration}s`,
          animationDelay: `${heart.delay}s`,
          '--heart-opacity': heart.opacity
        }"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
    </div>
    <div class="cover-inner">
      <!-- 主角头像徽章:两张贴纸式小照轻倚,中缀一枚心动小心形(纯装饰) -->
      <div class="cover-avatars" aria-hidden="true">
        <img
          :src="heroAvatars.female"
          alt=""
          class="cover-avatar cover-avatar-female"
        />
        <svg class="cover-avatar-heart" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
        <img
          :src="heroAvatars.male"
          alt=""
          class="cover-avatar cover-avatar-male"
        />
      </div>
      <p class="cover-kicker">WELCOME TO OUR LITTLE WORLD · 我们的小世界</p>
      <h1 class="cover-title">
        <span class="cover-title-text">{{ coverTitle }}</span>
      </h1>
      <div
        v-if="loveTime"
        class="cover-timer"
        role="timer"
        :aria-label="loveTimeAria"
      >
        <div v-for="cell in timerCells" :key="cell.label" class="timer-cell">
          <b class="timer-num">
            <PortalRollingNumber :value="cell.value" :max="cell.max" />
          </b>
          <span class="timer-label">{{ cell.label }}</span>
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
</template>

<style scoped>
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
  z-index: 1;
  content: "";
  background: var(--am-cover-veil);
}

/* 漂浮光点:小心形自底部错峰上浮,播完渐隐再重来 */
.cover-hearts {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
}

.cover-heart {
  position: absolute;
  bottom: -36px;
  color: var(--am-rose);
  opacity: 0;
  animation: cover-float 10s linear infinite;
}

@keyframes cover-float {
  0% {
    opacity: 0;
    transform: translate(0, 0) rotate(0deg);
  }

  12% {
    opacity: var(--heart-opacity, 0.3);
  }

  50% {
    transform: translate(10px, -45vh) rotate(10deg);
  }

  86% {
    opacity: var(--heart-opacity, 0.3);
  }

  100% {
    opacity: 0;
    transform: translate(-10px, -92vh) rotate(-8deg);
  }
}

.cover-inner {
  position: relative;
  z-index: 2;
  color: var(--am-ink);
  text-align: center;
}

.cover-avatars {
  display: flex;
  gap: var(--am-space-md);
  align-items: center;
  justify-content: center;
  margin-bottom: var(--am-space-md);
  animation: hero-in 0.7s var(--am-ease) backwards;
}

.cover-avatar {
  width: clamp(56px, 7vw, 80px);
  height: clamp(56px, 7vw, 80px);
  object-fit: cover;
  background: var(--am-card);
  border: 3px solid rgb(255 253 250 / 90%);
  border-radius: 50%;
  box-shadow: 0 8px 20px rgb(20 16 14 / 16%);
  transition: transform var(--am-duration) var(--am-ease);
}

.cover-avatar-female {
  transform: rotate(-3deg);
}

.cover-avatar-male {
  transform: rotate(3deg);
}

.cover-avatars:hover .cover-avatar {
  transform: rotate(0deg);
}

.cover-avatar-heart {
  width: 24px;
  height: 24px;
  color: var(--am-rose);
  filter: drop-shadow(0 2px 4px rgb(20 16 14 / 18%));
  animation: avatar-heart-beat 1.8s var(--am-ease) infinite;
}

@keyframes avatar-heart-beat {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.15);
  }
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
  margin: 14px 0 36px;
  font-family: var(--am-font-display);

  /* 精美化字号:上限收敛到展示档 huge,与页面其他展示标题同一阶梯 */
  font-size: clamp(2.4rem, 6vw, var(--am-text-huge));
  font-style: italic;
  font-weight: 700;
  line-height: 1.12;
  text-wrap: balance;
  animation: hero-in 0.7s var(--am-ease) 0.15s backwards;
}

/* 流光扫过:文字按墨色渐变裁切,柔光带平时停在视野外,
 * 滑过时自右向左掠过一次(仅 hover 设备且未偏好减弱动效) */
.cover-title-text {
  display: inline-block;

  /* 斜体字形右倾出框:延伸背景盒覆盖末字笔画,负外边距回补占位,
   * 否则出框部分不被渐变填充,视觉上末字被裁剪 */
  padding: 0 0.12em;
  margin: 0 -0.12em;
}

@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  @media (hover: hover) and (prefers-reduced-motion: no-preference) {
    .cover-title:hover .cover-title-text {
      animation: title-shimmer 1.8s var(--am-ease) 1;
    }
  }

  .cover-title-text {
    background-image: linear-gradient(
      100deg,
      var(--am-ink) 0% 45%,
      var(--am-rose-soft) 50%,
      var(--am-ink) 58% 100%
    );
    background-position: 100% 0;
    background-clip: text;
    background-size: 300% 100%;
    -webkit-text-fill-color: transparent;
  }
}

@keyframes title-shimmer {
  from {
    background-position: 100% 0;
  }

  to {
    background-position: 0% 0;
  }
}

/* 恋爱计时器:滚轮数字(窄屏 2×2 折行) */
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

@media (prefers-reduced-motion: reduce) {
  .cover-kicker,
  .cover-avatars,
  .cover-title,
  .cover-timer,
  .cover-note,
  .cover-avatar-heart {
    animation: none;
  }

  /* 漂浮光点一并静默,保持纯静态封面 */
  .cover-heart {
    display: none;
  }
}

/* 向下滚动提示:44px 触控目标的圆形按钮 */
.cover-scroll {
  position: absolute;
  bottom: 24px;
  left: 50%;
  z-index: 2;
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
