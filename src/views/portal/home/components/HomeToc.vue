<script setup lang="ts">
import reveal from "@/directives/reveal";

const vReveal = reveal;

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
</script>

<template>
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
</template>

<style scoped>
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

/* 640px:目录回落两列 */
@media (width <= 640px) {
  .toc-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 375px 窄屏:磁贴内边距与尺寸同步收敛,避免内容拥挤 */
@media (width <= 480px) {
  .toc-item {
    padding: var(--am-space-sm);
  }

  .toc-icon-chip {
    width: 36px;
    height: 36px;
  }
}
</style>
