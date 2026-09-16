<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { RouterLink } from "vue-router";
import PortalNavIcon from "@/components/PortalNavIcon/index.vue";

defineOptions({ name: "PortalHeader" });

/** 目录式导航:一级条目 + 「更多」分组(线性语义图标贯穿全站) */
const NAV_ITEMS = [
  { icon: "home", title: "首页", path: "/" },
  { icon: "moments", title: "点点滴滴", path: "/moments" },
  { icon: "photo", title: "恋爱画册", path: "/love-photo" },
  { icon: "list", title: "恋爱清单", path: "/love-list" },
  { icon: "message", title: "留言簿", path: "/message" },
  { icon: "calendar", title: "纪念日", path: "/anniversary" },
  { icon: "capsule", title: "时间胶囊", path: "/time-capsule" },
  { icon: "diary", title: "情侣日记", path: "/diary" },
  { icon: "footprint", title: "足迹", path: "/footprint" }
];

/** 桌面端一级目录项(其余收入「更多」下拉) */
const primaryItems = NAV_ITEMS.slice(0, 5);
/** 桌面端「更多」下拉项 */
const moreItems = NAV_ITEMS.slice(5);

const route = useRoute();

/** 滚动收窄:滚过封面后刊头条收紧并显出分隔线 */
const scrolled = ref(false);
function onScroll() {
  scrolled.value = window.scrollY > 24;
}

/** 抽屉菜单开关(移动端全屏目录) */
const drawerOpen = ref(false);

/** 抽屉容器与菜单按钮:打开时聚焦首项、Tab 圈闭、关闭后焦点还原 */
const drawerEl = ref<HTMLElement | null>(null);
const menuBtn = ref<HTMLButtonElement | null>(null);

/** 路由切换后自动收起抽屉与「更多」下拉 */
watch(
  () => route.path,
  () => {
    drawerOpen.value = false;
    closeNavMore();
  }
);

/** 键盘处理:Escape 关抽屉;抽屉打开时 Tab 在菜单内圈闭(含 Shift+Tab 反向) */
function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    drawerOpen.value = false;
    closeNavMore();
    return;
  }
  if (event.key === "Tab" && drawerOpen.value && drawerEl.value) {
    const focusables = Array.from(
      drawerEl.value.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])"
      )
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    } else if (!drawerEl.value.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }
}

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("keydown", onKeydown);
  document.addEventListener("click", onDocClick);
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("keydown", onKeydown);
  document.removeEventListener("click", onDocClick);
  systemDark.removeEventListener("change", onSystemTheme);
  document.body.style.removeProperty("overflow");
});

/** 抽屉打开期间锁定背景滚动;打开聚焦首项,关闭还原焦点到菜单按钮 */
watch(drawerOpen, open => {
  document.body.style.overflow = open ? "hidden" : "";
  if (open) {
    nextTick(() => {
      drawerEl.value?.querySelector<HTMLElement>("a")?.focus();
    });
  } else {
    menuBtn.value?.focus();
  }
});

/* ---------------- 主题切换:浅色 → 深色 → 跟随系统 三态循环 ---------------- */

type ThemeChoice = "auto" | "light" | "dark";
const THEME_KEY = "amour-theme";

const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
const themeChoice = ref<ThemeChoice>("auto");

/** 当前解析后的主题(供图标展示) */
const resolvedTheme = computed(() => {
  if (themeChoice.value !== "auto") return themeChoice.value;
  return systemDark.matches ? "dark" : "light";
});

/** 应用主题到 <html> 属性(tokens.css 按属性切换令牌) */
function applyTheme(choice: ThemeChoice) {
  const resolved =
    choice === "auto" ? (systemDark.matches ? "dark" : "light") : choice;
  document.documentElement.setAttribute("data-amour-theme", resolved);
}

/** 系统主题变化时,仅「跟随系统」档位实时响应 */
function onSystemTheme() {
  if (themeChoice.value === "auto") applyTheme("auto");
}

/** 循环切换主题并持久化(auto 档移除存储键,交由系统) */
function cycleTheme() {
  const order: ThemeChoice[] = ["auto", "light", "dark"];
  themeChoice.value = order[(order.indexOf(themeChoice.value) + 1) % 3];
  try {
    if (themeChoice.value === "auto") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, themeChoice.value);
  } catch {
    /* 存储不可用时仅会话内生效 */
  }
  applyTheme(themeChoice.value);
}

onMounted(() => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") themeChoice.value = saved;
  } catch {
    /* 读取失败保持 auto */
  }
  applyTheme(themeChoice.value);
  systemDark.addEventListener("change", onSystemTheme);
});

/** 当前路径是否命中导航项(精确匹配;首页仅在「/」时激活) */
function isActive(path: string) {
  return route.path === path;
}

/** 「更多」分组是否包含当前页(触发态高亮) */
const moreActive = computed(() =>
  moreItems.some(item => item.path === route.path)
);

/** 「更多」下拉:点击面板外 / Escape / 路由跳转后自动收起 */
const navMoreRef = ref<HTMLDetailsElement | null>(null);

function closeNavMore() {
  if (navMoreRef.value?.open) navMoreRef.value.open = false;
}

/** 点击「更多」面板外区域时收起(面板内点击交给 details 原生开合) */
function onDocClick(event: MouseEvent) {
  if (
    navMoreRef.value?.open &&
    !navMoreRef.value.contains(event.target as Node)
  ) {
    closeNavMore();
  }
}
</script>

<template>
  <header class="masthead" :class="{ 'masthead-scrolled': scrolled }">
    <div class="masthead-inner">
      <!-- 刊名 -->
      <RouterLink class="brand" to="/">
        <svg class="brand-heart" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 21s-7.5-4.9-10-9.2C.4 8.6 2 5 5.5 5c2 0 3.4 1.1 4.2 2.4L12 9.6l2.3-2.2C15.1 6.1 16.5 5 18.5 5 22 5 23.6 8.6 22 11.8 19.5 16.1 12 21 12 21z"
            fill="currentColor"
          />
        </svg>
        <span class="brand-name">AMOUR</span>
        <span class="brand-vol">FOR US · 恋爱中</span>
      </RouterLink>

      <!-- 桌面端目录导航 -->
      <nav class="nav" aria-label="门户导航">
        <RouterLink
          v-for="item in primaryItems"
          :key="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          :aria-current="isActive(item.path) ? 'page' : undefined"
          :to="item.path"
        >
          <PortalNavIcon :name="item.icon" class="nav-icon" />
          {{ item.title }}
        </RouterLink>

        <details ref="navMoreRef" class="nav-more">
          <summary
            class="nav-item nav-more-trigger"
            :class="{ active: moreActive }"
          >
            更多
            <svg class="nav-more-caret" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 9l6 6 6-6"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </summary>
          <div class="nav-more-panel">
            <RouterLink
              v-for="item in moreItems"
              :key="item.path"
              class="nav-more-item"
              :class="{ active: isActive(item.path) }"
              :aria-current="isActive(item.path) ? 'page' : undefined"
              :to="item.path"
            >
              <PortalNavIcon :name="item.icon" class="nav-more-icon" />
              {{ item.title }}
            </RouterLink>
          </div>
        </details>
      </nav>

      <!-- 主题切换 + 移动端菜单按钮 -->
      <div class="masthead-actions">
        <button
          class="theme-btn"
          type="button"
          :title="
            themeChoice === 'auto'
              ? '主题:跟随系统(点击切换)'
              : themeChoice === 'light'
                ? '主题:浅色(点击切换)'
                : '主题:深色(点击切换)'
          "
          :aria-label="`主题:${themeChoice === 'auto' ? '跟随系统' : themeChoice === 'light' ? '浅色' : '深色'},点击切换`"
          @click="cycleTheme"
        >
          <!-- 跟随系统:显示器 -->
          <svg
            v-if="themeChoice === 'auto'"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="13" rx="1.5" />
            <path d="M8 21h8m-4-4v4" />
          </svg>
          <!-- 浅色:太阳 -->
          <svg
            v-else-if="themeChoice === 'light'"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path
              d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
            />
          </svg>
          <!-- 深色:月亮 -->
          <svg
            v-else
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
          </svg>
        </button>

        <button
          ref="menuBtn"
          class="menu-btn"
          :class="{ 'menu-btn-open': drawerOpen }"
          type="button"
          :aria-label="drawerOpen ? '关闭菜单' : '打开菜单'"
          :aria-expanded="drawerOpen"
          @click="drawerOpen = !drawerOpen"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </div>

    <!-- 移动端全屏抽屉:大号衬线目录逐行入场 -->
    <Transition name="drawer">
      <div v-if="drawerOpen" ref="drawerEl" class="drawer">
        <nav class="drawer-nav" aria-label="抽屉导航">
          <RouterLink
            v-for="(item, i) in NAV_ITEMS"
            :key="item.path"
            class="drawer-item"
            :class="{ active: isActive(item.path) }"
            :aria-current="isActive(item.path) ? 'page' : undefined"
            :style="{ '--drawer-delay': `${i * 45}ms` }"
            :to="item.path"
          >
            <PortalNavIcon :name="item.icon" class="drawer-icon" />
            <span class="drawer-title">{{ item.title }}</span>
          </RouterLink>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
/* 刊头条:吸顶,滚过后收紧并显出底部分隔线 */
.masthead {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--am-bg);
  border-bottom: 1px solid transparent;
  transition:
    border-color var(--am-duration) ease,
    background var(--am-duration) ease;
}

.masthead-scrolled {
  border-bottom-color: var(--am-line);
}

.masthead-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: var(--am-content-width);
  padding: 18px var(--am-space-md);
  margin: 0 auto;
}

/* 刊名 */
.brand {
  display: flex;
  gap: 10px;
  align-items: baseline;
  color: var(--am-ink);
  text-decoration: none;
}

/* 爱心标识:轻柔搏动(全局 reduced-motion 下自动停用) */
.brand-heart {
  align-self: center;
  width: 16px;
  height: 16px;
  color: var(--am-rose);
  animation: heart-beat 1.8s var(--am-ease) infinite;
}

@keyframes heart-beat {
  0%,
  100% {
    transform: scale(1);
  }

  12% {
    transform: scale(1.18);
  }

  24% {
    transform: scale(1);
  }

  36% {
    transform: scale(1.12);
  }

  48% {
    transform: scale(1);
  }
}

.brand-name {
  font-family: var(--am-font-display);
  font-size: var(--am-text-xl);
  font-weight: 700;
  letter-spacing: 0.06em;
}

.brand-vol {
  font-family: var(--am-font-mono);
  font-size: var(--am-text-xs);
  color: var(--am-ink-secondary);
  letter-spacing: 0.18em;
}

/* 桌面目录 */
.nav {
  display: flex;
  gap: 22px;
  align-items: center;
}

.nav-item {
  position: relative;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: var(--am-text-sm);
  color: var(--am-ink-secondary);
  text-decoration: none;
  cursor: pointer;
  list-style: none;
  transition: color var(--am-duration-fast) ease;
}

/* 悬停下划线从左向右生长 */
.nav-item::after {
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  content: "";
  background: currentcolor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--am-duration) var(--am-ease);
}

.nav-item:hover::after {
  transform: scaleX(1);
}

.nav-item:hover {
  color: var(--am-ink);
}

.nav-item.active {
  color: var(--am-rose);
}

/* 当前项:下划线常驻(复用同一根 ::after,免去 text-decoration 跳变) */
.nav-item.active::after {
  transform: scaleX(1);
}

/* 图标不设色:继承条目文字颜色,悬停/激活自动联动 */
.nav-icon {
  width: 15px;
  height: 15px;
}

/* 悬停微动效:描边加粗 + 轻浮起 + 玫瑰光晕(仅 transform/filter,不触发布局回流) */
.nav-item:hover .nav-icon,
.nav-item:focus-visible .nav-icon,
.nav-more-item:hover .nav-more-icon,
.nav-more-item.active .nav-more-icon,
.drawer-item:hover .drawer-icon {
  stroke-width: 2.2;
}

@media (prefers-reduced-motion: no-preference) {
  .nav-item:hover .nav-icon,
  .nav-item:focus-visible .nav-icon,
  .nav-more-item:hover .nav-more-icon,
  .nav-more-item.active .nav-more-icon,
  .drawer-item:hover .drawer-icon {
    filter: drop-shadow(0 0 3px var(--am-rose));
    transform: translateY(-1px);
  }
}

/* 「更多」下拉 */
.nav-more {
  position: relative;
}

.nav-more-trigger {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  user-select: none;
}

/* 展开时箭头翻转(details 开合驱动) */
.nav-more[open] .nav-more-caret {
  transform: rotate(180deg);
}

.nav-more-caret {
  width: 12px;
  height: 12px;
  transition: transform var(--am-duration-fast) var(--am-ease);
}

.nav-more-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: -8px;
  display: flex;
  flex-direction: column;
  min-width: 168px;
  padding: 8px 0;
  background: var(--am-card);
  border: 1px solid var(--am-line);
  border-radius: var(--am-radius);
  box-shadow: 0 12px 32px rgb(26 22 20 / 10%);

  /* 展开入场:自上而下浮现(details 开合无过渡,用动画承担) */
  transform-origin: top right;
  animation: more-panel-in var(--am-duration) var(--am-ease);
}

@keyframes more-panel-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-more-panel {
    animation: none;
  }
}

.nav-more-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 9px 16px;
  font-size: var(--am-text-sm);
  color: var(--am-ink);
  text-decoration: none;
}

.nav-more-item:hover,
.nav-more-item.active {
  color: var(--am-rose);
  background: var(--am-rose-soft);
}

.nav-more-icon {
  width: 14px;
  height: 14px;
}

/* 主题切换按钮:与菜单按钮同组,线性图标 44px 触控目标 */
.masthead-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.theme-btn {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: var(--am-ink-secondary);
  cursor: pointer;
  background: none;
  border: 0;
  border-radius: var(--am-radius);
  transition:
    color var(--am-duration) ease,
    background var(--am-duration) ease;
}

.theme-btn:hover {
  color: var(--am-rose);
  background: var(--am-rose-soft);
}

.theme-btn svg {
  width: 20px;
  height: 20px;
}

/* 移动端菜单按钮(≤860px 显示,三条杠动画) */
.menu-btn {
  display: none;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  cursor: pointer;
  background: none;
  border: 0;
}

.menu-btn span {
  width: 22px;
  height: 2px;
  background: var(--am-ink);
  transition:
    transform var(--am-duration) var(--am-ease),
    opacity var(--am-duration) ease;
}

.menu-btn-open span:first-child {
  transform: translateY(7px) rotate(45deg);
}

.menu-btn-open span:nth-child(2) {
  opacity: 0;
}

.menu-btn-open span:last-child {
  transform: translateY(-7px) rotate(-45deg);
}

/* 全屏抽屉 */
.drawer {
  position: fixed;
  inset: 0;
  z-index: 90;
  padding: 96px var(--am-space-md) var(--am-space-xl);
  overflow-y: auto;
  background: var(--am-bg);
}

.drawer-nav {
  display: flex;
  flex-direction: column;
  max-width: var(--am-content-width);
  margin: 0 auto;
}

.drawer-item {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 14px 0;
  color: var(--am-ink);
  text-decoration: none;
  border-bottom: 1px solid var(--am-line);

  /* 条目逐行入场:延迟由行内 --drawer-delay 注入 */
  animation: drawer-item-in 0.4s var(--am-ease) both;
  animation-delay: var(--drawer-delay, 0s);
}

.drawer-item.active .drawer-title {
  color: var(--am-rose);
}

.drawer-icon {
  width: 20px;
  height: 20px;
  color: var(--am-rose);
}

.drawer-title {
  font-family: var(--am-font-display);
  font-size: var(--am-text-xl);
  font-weight: 600;
}

@keyframes drawer-item-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

/* 抽屉开合过渡 */
.drawer-enter-active {
  transition: opacity 0.25s ease;
}

.drawer-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

@media (width <= 860px) {
  .nav {
    display: none;
  }

  .menu-btn {
    display: flex;
  }
}
</style>
