<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, ref, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { getAnniversaryList } from "@/api/portal/anniversary";
import { getFootprintList } from "@/api/portal/footprint";
import { getHeroes } from "@/api/portal/hero";
import { getLovePhoto } from "@/api/portal/love-photo";
import { fallbackAvatar } from "@/utils/avatar";
import { resolveUserDisplay } from "@/utils/user-display";
import { prefersReducedMotion } from "@/utils/motion";
import { parseDateTime } from "@/utils/date";
import { nextOccurrenceDays } from "@/utils/anniversary";
import { usePortalSysConfig } from "@/layout/portal/usePortalSysConfig";
import PortalWorldMap, {
  type MapPoint
} from "@/components/PortalWorldMap/index.vue";
import PortalRollingNumber from "@/components/PortalRollingNumber/index.vue";
import reveal from "@/directives/reveal";
import { queryKeys } from "@/hooks/query-keys";
import { usePortalQuery } from "@/hooks/usePortalQuery";

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

/* ---------------- 目录 ---------------- */

/** 目录条目:语义图标与全站导航一致 */
const tocItems = [
  {
    icon: "moments",
    title: "点点滴滴",
    desc: "碎碎念,也要认真记录",
    path: "/moments"
  },
  {
    icon: "photo",
    title: "恋爱画册",
    desc: "记录最美瞬间",
    path: "/love-photo"
  },
  {
    icon: "list",
    title: "恋爱清单",
    desc: "你与我之间的约定",
    path: "/love-list"
  },
  {
    icon: "message",
    title: "留言簿",
    desc: "写下我们的祝福",
    path: "/message"
  },
  {
    icon: "calendar",
    title: "纪念日",
    desc: "距离下一次心动还有几天",
    path: "/anniversary"
  },
  {
    icon: "capsule",
    title: "时间胶囊",
    desc: "给未来的一封信",
    path: "/time-capsule"
  },
  {
    icon: "diary",
    title: "情侣日记",
    desc: "同一天的两个视角",
    path: "/diary"
  },
  {
    icon: "footprint",
    title: "足迹",
    desc: "我们一起去过的城市",
    path: "/footprint"
  }
];

/* ---------------- 封面:漂浮光点(纯装饰) ---------------- */

/** 每颗光点的水平落位/尺寸/节奏;负延迟让首屏加载时即处于漂浮中段 */
const coverHearts = [
  { left: "10%", size: 16, duration: 9, delay: 0, opacity: 0.32 },
  { left: "26%", size: 12, duration: 12, delay: -4.2, opacity: 0.22 },
  { left: "48%", size: 14, duration: 10, delay: -7.5, opacity: 0.28 },
  { left: "66%", size: 18, duration: 12, delay: -2.6, opacity: 0.3 },
  { left: "86%", size: 13, duration: 13, delay: -5.8, opacity: 0.24 }
];

/* ---------------- 卷首语:足迹世界地图 ---------------- */

/** 足迹原始数据(缓存 5 分钟,KeepAlive 激活时过期重拉);
 * 地图连线需全量点位,以单一大页一次拉取 */
const { data: footprintPage } = usePortalQuery(queryKeys.footprint(), () =>
  getFootprintList({ pageNumber: 1, pageSize: 500 })
);

/** 地图点位:有坐标的足迹按到访时间升序,依此连线
 * (元素经 markRaw 剥离响应式,避免 echarts 每帧重绘遍历 Proxy) */
const mapPoints = computed<MapPoint[]>(() =>
  (footprintPage.value?.records ?? [])
    .filter(it => it.longitude != null && it.latitude != null)
    .sort((a, b) => (a.arrivalDate ?? "").localeCompare(b.arrivalDate ?? ""))
    .map(it =>
      markRaw({
        id: it.id,
        city: it.city,
        longitude: it.longitude as number,
        latitude: it.latitude as number,
        arrivalDate: it.arrivalDate,
        remark: it.remark,
        photoUrl: it.photoUrl
      })
    )
);

/** 选中的足迹详情(null=关闭) */
const selectedPoint = ref<MapPoint | null>(null);

const router = useRouter();

function onMapSelect(point: MapPoint | null) {
  selectedPoint.value = point;
}

function closeMapDetail() {
  selectedPoint.value = null;
}

/** 浮层内直达足迹页(链接不可嵌套,改用编程导航) */
function goFootprint() {
  selectedPoint.value = null;
  router.push("/footprint");
}

/* ---------------- 纪念日预告:最近的一个 ---------------- */

/** 最近纪念日(封面焦点):接口按下一次发生日升序,取首条即最近;
 * 数据到达时按当日计算剩余天数 */
const { data: anniversaryPage } = usePortalQuery(
  queryKeys.anniversaryList(),
  () => getAnniversaryList({ pageNumber: 1, pageSize: 1 })
);

const nextAnniversary = computed(() => {
  const item = anniversaryPage.value?.records[0];
  if (!item) return null;
  const days = nextOccurrenceDays(item, new Date());
  return days === null
    ? null
    : { name: item.name, date: item.anniversaryDate, days };
});

/* ---------------- 恋爱画册:最新一张照片 ---------------- */

/** 最新照片(取画册第一张;接口不可用/为空时整卡不渲染) */
const { data: latestPhotoPage } = usePortalQuery(queryKeys.latestPhoto(), () =>
  getLovePhoto({ pageNumber: 1, pageSize: 1 })
);

const latestPhoto = computed(() => latestPhotoPage.value?.records[0] ?? null);
</script>

<template>
  <div>
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

    <!-- 目录:4×2 等宽 Bento 卡片(描边卡填满格子,左右视觉重量均衡) -->
    <section id="toc" class="toc">
      <div class="am-page">
        <header class="am-section-head">
          <p class="am-section-kicker">Our Story</p>
          <h2 class="am-section-title">我们的故事</h2>
        </header>
        <nav class="toc-list">
          <RouterLink
            v-for="item in tocItems"
            :key="item.path"
            v-reveal
            class="toc-item reveal"
            :to="item.path"
          >
            <span class="toc-head">
              <span class="toc-icon-chip">
                <IconifyIconOffline
                  :icon="`portal/${item.icon}`"
                  class="toc-icon"
                />
              </span>
              <span class="toc-title">{{ item.title }}</span>
            </span>
            <span class="toc-desc">{{ item.desc }}</span>
          </RouterLink>
        </nav>
      </div>
    </section>

    <!-- 足迹世界地图 + 纪念日预告:非对称双栏,右栏倒计时填充右区 -->
    <section class="editorial">
      <div class="am-page">
        <div
          class="editorial-grid"
          :class="{ 'editorial-grid--solo': !nextAnniversary && !latestPhoto }"
        >
          <div v-reveal class="editorial-card footprint-card reveal">
            <PortalWorldMap
              class="footprint-map"
              :points="mapPoints"
              @select="onMapSelect"
            />
            <p class="am-section-kicker">Footprints · 足迹</p>
            <span class="editorial-title">我们走过的每一座城</span>
            <p class="editorial-meta">
              已到访 {{ mapPoints.length }} 座城市,滚轮缩放、拖动漫游
            </p>
            <RouterLink to="/footprint" class="editorial-more">
              查看全部足迹 →
            </RouterLink>
            <span
              v-if="selectedPoint"
              class="footprint-detail"
              :class="{ 'footprint-detail--photo': selectedPoint.photoUrl }"
              :style="
                selectedPoint.photoUrl
                  ? {
                      backgroundImage:
                        `linear-gradient(rgb(15 18 25 / 55%), rgb(15 18 25 / 55%)), ` +
                        `url('${selectedPoint.photoUrl}')`
                    }
                  : undefined
              "
              @click.stop
            >
              <span class="gd-city">{{ selectedPoint.city }}</span>
              <span v-if="selectedPoint.arrivalDate" class="gd-date">
                {{ selectedPoint.arrivalDate }}
              </span>
              <span v-if="selectedPoint.remark" class="gd-remark">
                {{ selectedPoint.remark }}
              </span>
              <span class="gd-more" @click.stop="goFootprint">
                查看全部足迹 →
              </span>
              <button
                type="button"
                class="gd-close"
                aria-label="关闭详情"
                @click.stop="closeMapDetail"
              >
                ×
              </button>
            </span>
          </div>
          <div
            v-if="nextAnniversary"
            v-reveal="0.1"
            class="teaser-card reveal"
            :class="{ 'teaser-card--tall': !latestPhoto }"
          >
            <p class="am-section-kicker">Countdown · 爱的倒计时</p>
            <div class="teaser-count">
              <b class="teaser-days">{{ nextAnniversary.days }}</b>
              <span class="teaser-unit">天后</span>
            </div>
            <div class="teaser-meta">
              <p class="teaser-date">{{ nextAnniversary.date }}</p>
              <RouterLink class="teaser-name" to="/anniversary">
                {{ nextAnniversary.name }}
              </RouterLink>
            </div>
          </div>
          <RouterLink
            v-if="latestPhoto"
            v-reveal="0.2"
            class="photo-card reveal"
            :class="{ 'photo-card--tall': !nextAnniversary }"
            to="/love-photo"
          >
            <img
              :src="latestPhoto.img"
              :alt="latestPhoto.text"
              class="photo-card-img"
            />
            <span class="am-section-kicker photo-card-kicker">
              Album · 恋爱画册
            </span>
            <span class="photo-card-caption">{{ latestPhoto.text }}</span>
          </RouterLink>
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

/* 主角头像徽章:两张贴纸式小照轻倚,中缀一枚心动小心形;入场编排在最前 */
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

/* ---------------- 目录 ---------------- */
.toc {
  padding-top: var(--am-space-lg);

  /* 锚点滚动留白:避免粘性头部(85px)盖住区块标题 */
  scroll-margin-top: 88px;
}

/* 首页目录:题头不画满宽分隔线,避免与第一行卡片上缘连成一线
 * (仅本页局部覆盖;其他页面共用的 am-section-head 分隔线不受影响) */
.toc .am-section-head {
  border-bottom: 0;
}

/* 目录:4×2 等宽 Bento 卡片(窄屏回落两列) */
.toc-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--am-space-md);
}

/* 目录条目:描边卡片,图标与目录名同行、说明弱化,内容整体居中 */
.toc-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  padding: var(--am-space-md) var(--am-space-sm);
  color: var(--am-ink);
  text-align: center;
  text-decoration: none;
  background: transparent;
  border: 1px solid var(--am-line);
  border-radius: var(--am-radius);
  transition:
    background-color var(--am-duration) var(--am-ease),
    box-shadow var(--am-duration) var(--am-ease),
    transform var(--am-duration) var(--am-ease);
}

.toc-item:hover,
.toc-item:focus-visible {
  background: var(--am-bg-deep);
  box-shadow: var(--am-shadow-hover);
  transform: translateY(-4px);
}

/* 图标 + 目录名一行:磁贴与标题垂直居中对齐 */
.toc-head {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 图标磁贴:玫瑰软底圆角小方块,描边图标居中,与全站线描风格一致 */
.toc-icon-chip {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: var(--am-rose);
  background: var(--am-rose-soft);
  border-radius: calc(var(--am-radius) - 4px);
  transition: transform var(--am-duration) var(--am-ease);
}

.toc-icon {
  display: block;
  width: 20px;
  height: 20px;

  /* 对齐门户线描视觉(lucide 内置 stroke-width 2) */
  stroke-width: 1.8;
}

.toc-title {
  font-family: var(--am-font-display);
  font-size: clamp(1.25rem, 2vw, 1.4rem);
  font-weight: 700;
  line-height: 1.3;
}

/* 目录说明:弱化为小号辅助文字 */
.toc-desc {
  font-size: var(--am-text-xs);
  line-height: 1.5;
  color: var(--am-ink-secondary);
}

@media (prefers-reduced-motion: no-preference) {
  .toc-item:hover .toc-icon-chip {
    transform: scale(1.06);
  }
}

/* 足迹世界地图卡:地图铺满整卡作背景,文字浮于其上 */
.footprint-map {
  position: absolute;
  inset: 0;

  /* 禁止选中:防止画布拖动连带触发链接的原生拖拽/文字选择 */
  user-select: none;
}

.footprint-card .am-section-kicker,
.footprint-card .editorial-title,
.footprint-card .editorial-meta {
  position: relative;
  z-index: 1;

  /* 文字不拦截指针:整卡面均可拖拽地图 */
  pointer-events: none;
}

/* 跳转链接是明确的可点按钮,浮于地图之上 */
.footprint-card .editorial-more {
  position: relative;
  z-index: 1;
}

/* 详情浮层:点击地点后的详细说明(层级高于重置视角按钮,打开时自然覆盖它) */
.footprint-detail {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  justify-content: center;
  padding: var(--am-space-xl, 48px);
  text-align: center;
  background: var(--am-bg-deep);
}

.gd-city {
  font-family: var(--am-font-display);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  line-height: 1.15;
  color: var(--am-ink);
}

.gd-date {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-base);
  color: var(--am-ink-secondary);
  letter-spacing: 0.08em;
}

.gd-remark {
  max-width: 34ch;
  font-size: var(--am-text-lg);
  line-height: 1.7;
  color: var(--am-ink-secondary);
}

.gd-more {
  padding: 10px 26px;
  font-size: var(--am-text-lg);
  color: var(--am-rose);
  cursor: pointer;
  border: 1px solid currentcolor;
  border-radius: 999px;
}

.gd-more:hover,
.gd-more:focus-visible {
  color: #fff;
  text-decoration: none;
  background: var(--am-rose);
}

.gd-close {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 32px;
  height: 32px;
  font-size: var(--am-text-lg);
  color: var(--am-ink-secondary);
  cursor: pointer;
  background: none;
  border: 0;
}

.gd-close:hover {
  color: var(--am-ink);
}

.gd-close:focus-visible {
  outline: 2px solid var(--am-rose);
  outline-offset: 2px;
}

/* 有足迹照片时:照片铺满浮层作背景(叠深色遮罩),文字切换为白系保证可读 */
.footprint-detail--photo {
  background-position: center;
  background-size: cover;
}

.footprint-detail--photo .gd-city {
  color: #fff;
}

.footprint-detail--photo .gd-date,
.footprint-detail--photo .gd-remark {
  color: rgb(255 255 255 / 72%);
}

.footprint-detail--photo .gd-more {
  color: #fda4af;
}

.footprint-detail--photo .gd-more:hover,
.footprint-detail--photo .gd-more:focus-visible {
  color: #fff;
}

.footprint-detail--photo .gd-close {
  color: rgb(255 255 255 / 72%);
}

.footprint-detail--photo .gd-close:hover {
  color: #fff;
}

/* ---------------- 卷首语 + 纪念日预告 ---------------- */
.editorial {
  padding-top: var(--am-space-2xl, 64px);
}

/* Bento 三卡组:左大卡跨两行,右侧倒计时/一言两小卡;统一卡体配平视觉重量 */
.editorial-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  grid-auto-rows: minmax(120px, auto);
  gap: var(--am-space-md);
  align-items: stretch;
}

/* 倒计时与画册均无内容时:仅剩足迹地图卡,保持原宽水平居中 */
.editorial-grid--solo {
  grid-template-columns: minmax(0, 66.667%);
  justify-content: center;
}

.editorial-grid--solo > .footprint-card {
  grid-row: auto;
}

.editorial-grid > * {
  transition:
    transform var(--am-duration) var(--am-ease),
    box-shadow var(--am-duration) var(--am-ease);
}

.editorial-grid > *:hover {
  box-shadow: var(--am-shadow-hover);
  transform: translateY(-4px);
}

/* 地图卡不参与 hover 抬升:避免 CSS transform 与画布交互层叠加产生布局反馈 */
.editorial-grid > .footprint-card:hover {
  transform: none;
}

.editorial-card {
  position: relative;
  display: flex;
  flex-direction: column;
  grid-row: span 2;
  padding: var(--am-space-lg);
  overflow: hidden;
  background: var(--am-card);
  border: 1px solid var(--am-line);
  border-radius: var(--am-radius);
}

/* 一言/倒计时在缺失彼此时各自占满右列 */
.teaser-card--tall,
.photo-card--tall {
  grid-row: span 2;
}

/* 恋爱画册卡:图片满铺整卡,标签浮于左上角压暗渐变上,卡片趋近正方形 */
.photo-card {
  position: relative;
  display: flex;
  flex-direction: column;
  aspect-ratio: 3 / 2;
  padding: 0;
  overflow: hidden;
  background: var(--am-card);
  border: 1px solid var(--am-line);
  border-radius: var(--am-radius);
}

.photo-card-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--am-duration) var(--am-ease);
}

/* 顶部栏目浮层:平时纯图,悬停/聚焦时浮现;轻投影保证浅图上的可读性
 * (浮层文字恒用暖白,不随主题切换) */
.photo-card-kicker {
  position: absolute;
  inset: 0 0 auto;
  padding: var(--am-space-sm);
  color: rgb(255 251 245 / 90%);
  text-align: center;
  text-shadow: 0 1px 4px rgb(20 16 14 / 40%);
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity var(--am-duration) var(--am-ease),
    transform var(--am-duration) var(--am-ease);
}

/* 底部画册名称:居中弱化显示 */
.photo-card-caption {
  position: absolute;
  inset: auto 0 0;
  padding: var(--am-space-sm);
  font-size: var(--am-text-xs);
  line-height: 1.5;
  color: rgb(255 251 245 / 75%);
  text-align: center;
  text-shadow: 0 1px 4px rgb(20 16 14 / 40%);
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity var(--am-duration) var(--am-ease),
    transform var(--am-duration) var(--am-ease);
}

/* 悬停/键盘聚焦:文字浮现 */
.photo-card:hover .photo-card-kicker,
.photo-card:focus-visible .photo-card-kicker,
.photo-card:hover .photo-card-caption,
.photo-card:focus-visible .photo-card-caption {
  opacity: 1;
  transform: translateY(0);
}

/* 触屏设备无悬停:文字常显 */
@media (hover: none) {
  .photo-card-kicker,
  .photo-card-caption {
    opacity: 1;
    transform: none;
  }
}

/* 减弱动效偏好:浮现无过渡,瞬时显隐 */
@media (prefers-reduced-motion: reduce) {
  .photo-card-kicker,
  .photo-card-caption {
    transition: none;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .photo-card:hover .photo-card-img {
    transform: scale(1.04);
  }
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
  transition: color var(--am-duration-fast) ease;
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
  align-self: flex-start;
  padding-top: 14px;
  margin-top: auto;
  font-size: var(--am-text-sm);
  color: var(--am-rose);
  text-decoration: none;
  transition: transform var(--am-duration-fast) var(--am-ease);
}

.editorial-more:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
  transform: translateX(2px);
}

/* ---------------- 纪念日预告 ---------------- */
.teaser-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--am-space-lg);
  background: var(--am-rose-soft);
  border-radius: var(--am-radius);
}

/* 底部落款:日期居左,纪念日名落到右下角 */
.teaser-meta {
  display: flex;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
}

.teaser-name {
  display: inline-block;
  margin: 0;
  font-family: var(--am-font-display);
  font-size: var(--am-text-lg);
  font-weight: 700;
  color: var(--am-ink);
  text-decoration: none;
  transition: color var(--am-duration-fast) ease;
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
  flex: 1;
  gap: 8px;
  align-items: baseline;
  justify-content: center;
  margin-block: 0;
}

.teaser-days {
  font-family: var(--am-font-mono);
  font-size: clamp(3rem, 8vw, var(--am-text-giant));
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--am-rose);
}

.teaser-unit {
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
}

/* 640px:目录回落两列,双栏区块上下堆叠 */
@media (width <= 640px) {
  .toc-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .editorial-grid {
    grid-template-columns: 1fr;
  }

  .editorial-card,
  .teaser-card--tall,
  .photo-card--tall {
    grid-row: auto;
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

  /* 375px 窄屏:卡片内边距与磁贴同步收敛,避免内容拥挤 */
  .toc-item {
    padding: var(--am-space-sm);
  }

  .toc-icon-chip {
    width: 36px;
    height: 36px;
  }
}
</style>
